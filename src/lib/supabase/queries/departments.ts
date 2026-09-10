import { getSupabaseClient } from "@/lib/supabase/client";

export type Department = {
  id: string;
  faculty_id: string;
  name: string;
  slug: string;
  description: string | null;
  color: string | null;
  icon: string | null;
  background_image_url: string | null;
};

/** Example query boundary for department data; keep database access out of UI components. */
export async function getDepartments(): Promise<Department[]> {
  const { data, error } = await getSupabaseClient()
    .from("departments")
    .select("id, faculty_id, name, slug, description, color, icon, background_image_url")
    .eq("is_visible", true)
    .order("name");

  if (error) throw error;
  return data ?? [];
}
