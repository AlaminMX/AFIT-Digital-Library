import express, { type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { readJsonFile } from "../lib/storage";
import { DEFAULT_DEPARTMENTS, DEFAULT_BOOKS, DEFAULT_JOURNALS } from "../lib/seed-data";

const router = express.Router();

// --- PUBLIC ACCELERATED ENDPOINTS: DEPARTMENTS, BOOKS, JOURNALS ---
router.get("/api/departments", async (_req: Request, res: Response) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("departments")
        .select("*")
        .eq("is_visible", true)
        .order("display_order", { ascending: true });

      if (!error && data && data.length > 0) {
        res.json({ departments: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public departments read error, using local fallback:", err);
    }
  }

  const localDepts = readJsonFile<Record<string, unknown>[]>("departments.json", DEFAULT_DEPARTMENTS);
  const visible = localDepts.filter((d) => d.is_visible !== false);
  res.json({ departments: visible });
});

router.get("/api/departments/:slug", async (req: Request, res: Response) => {
  const { slug } = req.params;
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("departments")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();

      if (!error && data) {
        res.json({ department: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public department slug read error, using local fallback:", err);
    }
  }

  const localDepts = readJsonFile<Record<string, unknown>[]>("departments.json", DEFAULT_DEPARTMENTS);
  const found = localDepts.find((d) => d.slug === slug);
  if (found) {
    res.json({ department: found });
  } else {
    res.status(404).json({ error: "Department not found" });
  }
});

router.get("/api/books", async (req: Request, res: Response) => {
  const departmentId = typeof req.query.department_id === "string" ? req.query.department_id : null;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("books")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;
      if (!error && data) {
        res.json({ books: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public books read error, using local fallback:", err);
    }
  }

  const localBooks = readJsonFile<Record<string, unknown>[]>("books.json", DEFAULT_BOOKS);
  let result = localBooks.filter((b) => b.status !== "draft");
  if (departmentId) {
    result = result.filter((b) => String(b.department_id) === departmentId);
  }
  res.json({ books: result });
});

router.get("/api/journals", async (req: Request, res: Response) => {
  const departmentId = typeof req.query.department_id === "string" ? req.query.department_id : null;

  if (supabaseAdmin) {
    try {
      let query = supabaseAdmin
        .from("journals")
        .select("*")
        .eq("status", "published")
        .order("created_at", { ascending: false });

      if (departmentId) {
        query = query.eq("department_id", departmentId);
      }

      const { data, error } = await query;
      if (!error && data) {
        res.json({ journals: data });
        return;
      }
    } catch (err) {
      console.warn("Supabase public journals read error, using local fallback:", err);
    }
  }

  const localJournals = readJsonFile<Record<string, unknown>[]>("journals.json", DEFAULT_JOURNALS);
  let result = localJournals.filter((j) => j.status !== "draft");
  if (departmentId) {
    result = result.filter((j) => String(j.department_id) === departmentId);
  }
  res.json({ journals: result });
});

export default router;
