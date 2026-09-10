import { getSupabaseClient } from "@/lib/supabase/client";

export type Faculty = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
};

export type Department = {
  id: string;
  faculty_id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
};

export type AcademicDirectory = {
  faculties: Faculty[];
  departments: Department[];
};

export type AcademicStructureCounts = {
  faculties: number;
  departments: number;
};

/** Loads the public, visible catalogue in the ordering defined by the database. */
export async function getAcademicDirectory(): Promise<AcademicDirectory> {
  const supabase = getSupabaseClient();
  const [facultiesResult, departmentsResult] = await Promise.all([
    supabase
      .from("faculties")
      .select("id, name, slug, description, display_order")
      .eq("is_visible", true)
      .order("display_order", { ascending: true }),
    supabase
      .from("departments")
      .select("id, faculty_id, name, slug, description, display_order")
      .eq("is_visible", true)
      .order("display_order", { ascending: true }),
  ]);

  if (facultiesResult.error) throw facultiesResult.error;
  if (departmentsResult.error) throw departmentsResult.error;

  return {
    faculties: (facultiesResult.data ?? []) as Faculty[],
    departments: (departmentsResult.data ?? []) as Department[],
  };
}

/** Counts the public catalogue without transferring complete table rows. */
export async function getAcademicStructureCounts(): Promise<AcademicStructureCounts> {
  const supabase = getSupabaseClient();
  const [facultiesResult, departmentsResult] = await Promise.all([
    supabase.from("faculties").select("id", { count: "exact", head: true }).eq("is_visible", true),
    supabase.from("departments").select("id", { count: "exact", head: true }).eq("is_visible", true),
  ]);

  if (facultiesResult.error) throw facultiesResult.error;
  if (departmentsResult.error) throw departmentsResult.error;

  return {
    faculties: facultiesResult.count ?? 0,
    departments: departmentsResult.count ?? 0,
  };
}

/** Returns a visible department for its public URL slug, or no result when it is unavailable. */
export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  const { data, error } = await getSupabaseClient()
    .from("departments")
    .select("id, faculty_id, name, slug, description, display_order")
    .eq("is_visible", true)
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw error;
  return data as Department | null;
}
