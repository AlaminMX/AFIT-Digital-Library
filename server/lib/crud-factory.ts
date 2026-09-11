import crypto from "crypto";
import type { Router, Request, Response } from "express";
import { supabaseAdmin } from "./supabase";
import { readJsonFile, writeJsonFile } from "./storage";
import { requireAdminAuth } from "./auth";

// --- GENERIC ADMIN CRUD FACTORY ---
export interface CrudOptions {
  resourcePath: string;
  table: string;
  singular: string;
  orderColumn: string;
  ascending?: boolean;
  requiredFields: string[];
  defaultData: Record<string, unknown>[];
}

export function registerAdminCrudRoutes(router: Router, opts: CrudOptions): void {
  const { resourcePath, table, singular, orderColumn, ascending = true, requiredFields, defaultData } = opts;
  const jsonFilename = `${resourcePath}.json`;

  // List all
  router.get(`/api/admin/${resourcePath}`, requireAdminAuth, async (_req: Request, res: Response) => {
    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .order(orderColumn, { ascending });

        if (!error && data && data.length > 0) {
          res.json({ [resourcePath]: data });
          return;
        }
      } catch (err) {
        console.warn(`Supabase ${table} read error, using local data:`, err);
      }
    }

    const localData = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    localData.sort((a, b) => {
      const valA = a[orderColumn];
      const valB = b[orderColumn];
      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return ascending ? 1 : -1;
      if (valB === undefined || valB === null) return ascending ? -1 : 1;
      return ascending ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });

    res.json({ [resourcePath]: localData });
  });

  // Create
  router.post(`/api/admin/${resourcePath}`, requireAdminAuth, async (req: Request, res: Response) => {
    const body = req.body || {};

    // Auto-resolve optional titles and authors according to institutional standards
    if (resourcePath === "books") {
      if (!body.title || String(body.title).trim() === "") {
        body.title = body.suggested_title || body.original_name?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Untitled Academic Monograph";
      }
      if (!body.author || String(body.author).trim() === "") {
        body.author = "AFIT Faculty";
      }
    } else if (resourcePath === "journals") {
      if (!body.title || String(body.title).trim() === "") {
        body.title = body.suggested_title || body.original_name?.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Untitled Research Paper";
      }
    }

    const missing = requiredFields.filter((field) => !body[field] || String(body[field]).trim() === "");
    if (missing.length > 0) {
      res.status(400).json({ error: `Missing required field(s): ${missing.join(", ")}` });
      return;
    }

    const id = body.id || crypto.randomUUID();
    const now = new Date().toISOString();
    const newRecord = {
      ...body,
      id,
      created_at: body.created_at || now,
      updated_at: now,
    };

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin.from(table).insert(newRecord).select().single();
        if (!error && data) {
          const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
          items.unshift(data);
          writeJsonFile(jsonFilename, items);
          res.status(201).json({ [singular]: data });
          return;
        }
      } catch (err) {
        console.warn(`Supabase ${table} insert error, saving locally:`, err);
      }
    }

    const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    items.unshift(newRecord);
    writeJsonFile(jsonFilename, items);
    res.status(201).json({ [singular]: newRecord });
  });

  // Update
  router.put(`/api/admin/${resourcePath}/:id`, requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;
    const body = req.body || {};
    const now = new Date().toISOString();

    if (supabaseAdmin) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .update({ ...body, updated_at: now })
          .eq("id", id)
          .select()
          .single();

        if (!error && data) {
          const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
          const idx = items.findIndex((item) => String(item.id) === String(id));
          if (idx !== -1) {
            items[idx] = data;
          } else {
            items.unshift(data);
          }
          writeJsonFile(jsonFilename, items);
          res.json({ [singular]: data });
          return;
        }
      } catch (err) {
        console.warn(`Supabase ${table} update error, saving locally:`, err);
      }
    }

    const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    const idx = items.findIndex((item) => String(item.id) === String(id));
    if (idx === -1) {
      res.status(404).json({ error: `${singular} not found.` });
      return;
    }

    const updatedRecord = {
      ...items[idx],
      ...body,
      id,
      updated_at: now,
    };
    items[idx] = updatedRecord;
    writeJsonFile(jsonFilename, items);
    res.json({ [singular]: updatedRecord });
  });

  // Delete
  router.delete(`/api/admin/${resourcePath}/:id`, requireAdminAuth, async (req: Request, res: Response) => {
    const { id } = req.params;

    if (supabaseAdmin) {
      try {
        await supabaseAdmin.from(table).delete().eq("id", id);
      } catch (err) {
        console.warn(`Supabase ${table} delete error:`, err);
      }
    }

    const items = readJsonFile<Record<string, unknown>[]>(jsonFilename, defaultData);
    const filtered = items.filter((item) => String(item.id) !== String(id));
    writeJsonFile(jsonFilename, filtered);
    res.json({ success: true });
  });
}
