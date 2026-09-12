import express, { type Request, type Response } from "express";
import { supabaseAdmin } from "../lib/supabase.js";
import { readJsonFile, writeJsonFile } from "../lib/storage.js";
import { requireAdminAuth } from "../lib/auth.js";
import { DEFAULT_STATS, type StatsResponse } from "../lib/seed-data.js";

const router = express.Router();

// --- INSTITUTIONAL STATS ---
router.get("/api/stats", async (_req: Request, res: Response) => {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("institutional_stats")
        .select("total_students, academic_resources, active_departments, research_citations")
        .eq("id", true)
        .maybeSingle();

      if (!error && data) {
        res.json({
          totalStudents: data.total_students,
          academicResources: data.academic_resources,
          activeDepartments: data.active_departments,
          researchCitations: data.research_citations,
        });
        return;
      }
    } catch {
      // Fallback to local
    }
  }

  const stats = readJsonFile<StatsResponse>("institutional_stats.json", DEFAULT_STATS);
  res.json(stats);
});

router.put("/api/admin/stats", requireAdminAuth, async (req: Request, res: Response) => {
  const { totalStudents, academicResources, activeDepartments, researchCitations } = req.body || {};

  const updated: StatsResponse = {
    totalStudents: totalStudents || DEFAULT_STATS.totalStudents,
    academicResources: academicResources || DEFAULT_STATS.academicResources,
    activeDepartments: activeDepartments || DEFAULT_STATS.activeDepartments,
    researchCitations: researchCitations || DEFAULT_STATS.researchCitations,
  };

  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from("institutional_stats")
        .upsert({
          id: true,
          total_students: updated.totalStudents,
          academic_resources: updated.academicResources,
          active_departments: updated.activeDepartments,
          research_citations: updated.researchCitations,
        })
        .select()
        .single();

      if (!error && data) {
        writeJsonFile("institutional_stats.json", updated);
        res.json(updated);
        return;
      }
    } catch (err) {
      console.warn("Failed to update stats in Supabase, updating locally:", err);
    }
  }

  writeJsonFile("institutional_stats.json", updated);
  res.json(updated);
});

export default router;
