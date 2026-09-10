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
  color: string | null;
  icon: string | null;
  background_image_url: string | null;
};

export type AcademicDirectory = {
  faculties: Faculty[];
  departments: Department[];
};

export type AcademicStructureCounts = {
  faculties: number;
  departments: number;
};

const MOCK_FACULTIES: Faculty[] = [
  { id: 'a1000000-0000-4000-8000-000000000001', name: 'Faculty of Engineering', slug: 'engineering', description: 'Faculty for engineering programmes and applied sciences.', display_order: 1 },
  { id: 'a1000000-0000-4000-8000-000000000002', name: 'Faculty of Computing and Informatics', slug: 'computing-and-informatics', description: 'Faculty for computing, software engineering, and information systems.', display_order: 2 },
  { id: 'a1000000-0000-4000-8000-000000000003', name: 'Faculty of Science', slug: 'science', description: 'Faculty for pure and applied sciences.', display_order: 3 },
  { id: 'a1000000-0000-4000-8000-000000000004', name: 'Faculty of Business and Management', slug: 'business-and-management', description: 'Faculty for management, accounting, and business administration.', display_order: 4 },
  { id: 'a1000000-0000-4000-8000-000000000005', name: 'Faculty of Social Sciences', slug: 'social-sciences', description: 'Faculty for economics, sociology, and social research.', display_order: 5 },
];

const MOCK_DEPARTMENTS: Department[] = [
  { id: 'd1000000-0000-4000-8000-000000000001', faculty_id: 'a1000000-0000-4000-8000-000000000001', name: 'Department of Civil Engineering', slug: 'civil-engineering', description: 'Structural engineering, geotechnics, and infrastructure research collection.', display_order: 1, color: '#1d4ed8', icon: 'construction', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000002', faculty_id: 'a1000000-0000-4000-8000-000000000001', name: 'Department of Electrical Engineering', slug: 'electrical-engineering', description: 'Power systems, electronics, and telecommunications publications.', display_order: 2, color: '#0284c7', icon: 'circuit', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000003', faculty_id: 'a1000000-0000-4000-8000-000000000002', name: 'Department of Computer Science', slug: 'computer-science', description: 'Algorithms, artificial intelligence, software engineering, and systems research.', display_order: 1, color: '#0d9488', icon: 'code', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000004', faculty_id: 'a1000000-0000-4000-8000-000000000002', name: 'Department of Information Systems', slug: 'information-systems', description: 'Information security, database systems, and enterprise architectures.', display_order: 2, color: '#16a34a', icon: 'network', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000005', faculty_id: 'a1000000-0000-4000-8000-000000000003', name: 'Department of Mathematics', slug: 'mathematics', description: 'Applied mathematics, mathematical modeling, and statistical analysis.', display_order: 1, color: '#9333ea', icon: 'sigma', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000006', faculty_id: 'a1000000-0000-4000-8000-000000000003', name: 'Department of Biological Sciences', slug: 'biological-sciences', description: 'Biotechnology, environmental biology, and life sciences literature.', display_order: 2, color: '#c026d3', icon: 'atom', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000007', faculty_id: 'a1000000-0000-4000-8000-000000000004', name: 'Department of Accounting', slug: 'accounting', description: 'Financial reporting, auditing, and corporate finance journals.', display_order: 1, color: '#ea580c', icon: 'calculator', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000008', faculty_id: 'a1000000-0000-4000-8000-000000000004', name: 'Department of Business Administration', slug: 'business-administration', description: 'Strategic management, entrepreneurship, and organizational behavior.', display_order: 2, color: '#ca8a04', icon: 'briefcase', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000009', faculty_id: 'a1000000-0000-4000-8000-000000000005', name: 'Department of Economics', slug: 'economics', description: 'Macroeconomics, microeconomics, and economic policy research.', display_order: 1, color: '#4f46e5', icon: 'chart', background_image_url: null },
  { id: 'd1000000-0000-4000-8000-000000000010', faculty_id: 'a1000000-0000-4000-8000-000000000005', name: 'Department of Sociology', slug: 'sociology', description: 'Social systems, cultural studies, and sociological research.', display_order: 2, color: '#0891b2', icon: 'users', background_image_url: null },
];

/** Loads the public, visible catalogue in the ordering defined by the database. */
export async function getAcademicDirectory(): Promise<AcademicDirectory> {
  try {
    const supabase = getSupabaseClient();
    const [facultiesResult, departmentsResult] = await Promise.all([
      supabase
        .from("faculties")
        .select("id, name, slug, description, display_order")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),
      supabase
        .from("departments")
        .select("id, faculty_id, name, slug, description, display_order, color, icon, background_image_url")
        .eq("is_visible", true)
        .order("display_order", { ascending: true }),
    ]);

    if (facultiesResult.error || departmentsResult.error) {
      throw new Error("Supabase query failed");
    }

    const faculties = (facultiesResult.data ?? []) as Faculty[];
    const departments = (departmentsResult.data ?? []) as Department[];

    if (faculties.length === 0) {
      return { faculties: MOCK_FACULTIES, departments: MOCK_DEPARTMENTS };
    }

    return { faculties, departments };
  } catch {
    // Fallback to sample mock data if Supabase is unconfigured or unreachable
    return {
      faculties: MOCK_FACULTIES,
      departments: MOCK_DEPARTMENTS,
    };
  }
}

/** Counts the public catalogue without transferring complete table rows. */
export async function getAcademicStructureCounts(): Promise<AcademicStructureCounts> {
  try {
    const supabase = getSupabaseClient();
    const [facultiesResult, departmentsResult] = await Promise.all([
      supabase.from("faculties").select("id", { count: "exact", head: true }).eq("is_visible", true),
      supabase.from("departments").select("id", { count: "exact", head: true }).eq("is_visible", true),
    ]);

    if (facultiesResult.error || departmentsResult.error) {
      throw new Error("Supabase query failed");
    }

    return {
      faculties: facultiesResult.count ?? MOCK_FACULTIES.length,
      departments: departmentsResult.count ?? MOCK_DEPARTMENTS.length,
    };
  } catch {
    return {
      faculties: MOCK_FACULTIES.length,
      departments: MOCK_DEPARTMENTS.length,
    };
  }
}

/** Returns a visible department for its public URL slug, or no result when it is unavailable. */
export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  try {
    const { data, error } = await getSupabaseClient()
      .from("departments")
      .select("id, faculty_id, name, slug, description, display_order, color, icon, background_image_url")
      .eq("is_visible", true)
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) {
      const mockDept = MOCK_DEPARTMENTS.find((d) => d.slug === slug);
      return mockDept ?? null;
    }
    return data as Department | null;
  } catch {
    const mockDept = MOCK_DEPARTMENTS.find((d) => d.slug === slug);
    return mockDept ?? null;
  }
}
