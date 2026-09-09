import { getSupabaseClient } from "@/lib/supabase/client";

export type Department = {
  id: string;
  name: string;
  slug: string;
};

/** Example query boundary for department data; keep database access out of UI components. */
export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await getSupabaseClient()
    .from("departments")
    .select("id, name, slug")
    .order("name");

  if (error) throw error;
  return data ?? [];
}
