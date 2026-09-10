import { getSupabaseClient } from "@/lib/supabase/client";

export type Department = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  display_order: number;
  color: string | null;
  icon: string | null;
  background_image_url: string | null;
  is_visible?: boolean;
};

const MOCK_DEPARTMENTS: Department[] = [
  {
    id: 'd1000000-0000-4000-8000-000000000001',
    name: 'Artificial Intelligence',
    slug: 'artificial-intelligence',
    description: 'Advanced machine learning, neural architectures, cognitive systems, and autonomous robotics research collections.',
    display_order: 1,
    color: '#1d4ed8',
    icon: 'code',
    background_image_url: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000002',
    name: 'Biotechnology',
    slug: 'biotechnology',
    description: 'Genetic engineering, molecular biology, bio-informatics, and biomedical laboratory literature.',
    display_order: 2,
    color: '#0d9488',
    icon: 'atom',
    background_image_url: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000003',
    name: 'Business Administration',
    slug: 'business-administration',
    description: 'Strategic management, entrepreneurship, organizational behavior, and military logistics administration.',
    display_order: 3,
    color: '#ea580c',
    icon: 'briefcase',
    background_image_url: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000004',
    name: 'Economics',
    slug: 'economics',
    description: 'Macroeconomic policy, defense economics, econometric modeling, and resource allocation studies.',
    display_order: 4,
    color: '#4f46e5',
    icon: 'chart',
    background_image_url: 'https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000005',
    name: 'Accounting',
    slug: 'accounting',
    description: 'Financial reporting, auditing, public sector finance, and fiscal compliance journals.',
    display_order: 5,
    color: '#ca8a04',
    icon: 'calculator',
    background_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000006',
    name: 'Civil Engineering',
    slug: 'civil-engineering',
    description: 'Structural engineering, geotechnics, airfield pavements, and heavy infrastructure research.',
    display_order: 6,
    color: '#0284c7',
    icon: 'construction',
    background_image_url: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f192b?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000007',
    name: 'Mechanical Engineering',
    slug: 'mechanical-engineering',
    description: 'Thermodynamics, fluid mechanics, machine design, and automotive propulsion systems.',
    display_order: 7,
    color: '#9333ea',
    icon: 'circuit',
    background_image_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000008',
    name: 'Aerospace Engineering',
    slug: 'aerospace-engineering',
    description: 'Aircraft design, aerodynamics, propulsion, avionics, and space flight dynamics monographs.',
    display_order: 8,
    color: '#2563eb',
    icon: 'construction',
    background_image_url: 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000009',
    name: 'Electrical and Electronics Engineering',
    slug: 'electrical-and-electronics-engineering',
    description: 'Power systems, microelectronics, control engineering, and electrical machinery publications.',
    display_order: 9,
    color: '#d97706',
    icon: 'circuit',
    background_image_url: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000010',
    name: 'Information Communication Engineering',
    slug: 'information-communication-engineering',
    description: 'Telecommunication networks, optical communications, radar signal processing, and wireless systems.',
    display_order: 10,
    color: '#059669',
    icon: 'network',
    background_image_url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
  {
    id: 'd1000000-0000-4000-8000-000000000011',
    name: 'Cybersecurity',
    slug: 'cybersecurity',
    description: 'Information assurance, cryptographic protocols, ethical hacking, and tactical network defense.',
    display_order: 11,
    color: '#dc2626',
    icon: 'code',
    background_image_url: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80',
    is_visible: true,
  },
];

export async function getDepartments(): Promise<Department[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("is_visible", true)
      .order("display_order", { ascending: true });

    if (error || !data || data.length === 0) {
      return MOCK_DEPARTMENTS;
    }
    return data as Department[];
  } catch {
    return MOCK_DEPARTMENTS;
  }
}

export async function getDepartmentBySlug(slug: string): Promise<Department | null> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("departments")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error || !data) {
      return MOCK_DEPARTMENTS.find(d => d.slug === slug) || null;
    }
    return data as Department;
  } catch {
    return MOCK_DEPARTMENTS.find(d => d.slug === slug) || null;
  }
}
