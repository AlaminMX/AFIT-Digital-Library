/**
 * The small interface keeps these helpers compatible with both browser and
 * server Supabase clients without coupling this repository to a client factory.
 */
export interface AcademicStructureClient {
  from(table: "faculties" | "departments"): AcademicStructureQuery;
}

interface AcademicStructureQuery extends PromiseLike<unknown> {
  select(columns: string, options?: { count?: "exact"; head?: boolean }): AcademicStructureQuery;
  eq(column: "is_visible", value: boolean): AcademicStructureQuery;
  order(column: "display_order", options?: { ascending?: boolean }): AcademicStructureQuery;
}

export interface Faculty {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
}

export interface Department extends Faculty {
  faculty_id: string;
}

export interface LandingPageAcademicStructureCounts {
  faculties: number;
  departments: number;
}

type SupabaseResult<T> = {
  data: T | null;
  error: { message: string } | null;
  count?: number | null;
};

function resultOrThrow<T>(result: SupabaseResult<T>): T {
  if (result.error) throw new Error(result.error.message);
  return result.data as T;
}

/** Loads only faculties permitted by the public RLS policy. */
export async function loadVisibleFaculties(client: AcademicStructureClient): Promise<Faculty[]> {
  const result = (await client
    .from("faculties")
    .select("id, name, slug, description, display_order")
    .eq("is_visible", true)
    .order("display_order", { ascending: true })) as SupabaseResult<Faculty[]>;

  return resultOrThrow(result);
}

/** Loads only departments permitted by the public RLS policy. */
export async function loadVisibleDepartments(client: AcademicStructureClient): Promise<Department[]> {
  const result = (await client
    .from("departments")
    .select("id, faculty_id, name, slug, description, display_order")
    .eq("is_visible", true)
    .order("display_order", { ascending: true })) as SupabaseResult<Department[]>;

  return resultOrThrow(result);
}

/** Counts visible records in Supabase for the landing-page statistics. */
export async function loadLandingPageAcademicStructureCounts(
  client: AcademicStructureClient,
): Promise<LandingPageAcademicStructureCounts> {
  const [faculties, departments] = await Promise.all([
    client.from("faculties").select("id", { count: "exact", head: true }).eq("is_visible", true),
    client.from("departments").select("id", { count: "exact", head: true }).eq("is_visible", true),
  ]);

  const facultyResult = faculties as SupabaseResult<null>;
  const departmentResult = departments as SupabaseResult<null>;
  if (facultyResult.error) throw new Error(facultyResult.error.message);
  if (departmentResult.error) throw new Error(departmentResult.error.message);

  return {
    faculties: facultyResult.count ?? 0,
    departments: departmentResult.count ?? 0,
  };
}
