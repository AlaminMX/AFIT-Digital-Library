// --- SEED / DEFAULT DATA ---
// Used to bootstrap the local-disk JSON fallback files the first time the
// server runs, and as the in-memory fallback whenever Supabase is empty,
// unconfigured, or unreachable.

export const DEFAULT_DEPARTMENTS = [
  {
    id: "d1000000-0000-4000-8000-000000000001",
    name: "Artificial Intelligence",
    slug: "artificial-intelligence",
    description: "Advanced machine learning, neural architectures, cognitive systems, and autonomous robotics research collections.",
    display_order: 1,
    color: "#1d4ed8",
    icon: "code",
    background_image_url: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000002",
    name: "Biotechnology",
    slug: "biotechnology",
    description: "Genetic engineering, molecular biology, bio-informatics, and biomedical laboratory literature.",
    display_order: 2,
    color: "#0d9488",
    icon: "atom",
    background_image_url: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000003",
    name: "Business Administration",
    slug: "business-administration",
    description: "Strategic management, entrepreneurship, organizational behavior, and military logistics administration.",
    display_order: 3,
    color: "#ea580c",
    icon: "briefcase",
    background_image_url: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000004",
    name: "Economics",
    slug: "economics",
    description: "Macroeconomic policy, defense economics, econometric modeling, and resource allocation studies.",
    display_order: 4,
    color: "#4f46e5",
    icon: "chart",
    background_image_url: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000005",
    name: "Accounting",
    slug: "accounting",
    description: "Financial reporting, auditing, public sector finance, and fiscal compliance journals.",
    display_order: 5,
    color: "#ca8a04",
    icon: "calculator",
    background_image_url: "https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000006",
    name: "Civil Engineering",
    slug: "civil-engineering",
    description: "Structural engineering, geotechnics, airfield pavements, and heavy infrastructure research.",
    display_order: 6,
    color: "#0284c7",
    icon: "construction",
    background_image_url: "https://images.unsplash.com/photo-1541888946425-d0fbb18f192b?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000007",
    name: "Mechanical Engineering",
    slug: "mechanical-engineering",
    description: "Thermodynamics, fluid mechanics, machine design, and automotive propulsion systems.",
    display_order: 7,
    color: "#9333ea",
    icon: "circuit",
    background_image_url: "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000008",
    name: "Aerospace Engineering",
    slug: "aerospace-engineering",
    description: "Aircraft design, aerodynamics, propulsion, avionics, and space flight dynamics monographs.",
    display_order: 8,
    color: "#2563eb",
    icon: "construction",
    background_image_url: "https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000009",
    name: "Electrical and Electronics Engineering",
    slug: "electrical-and-electronics-engineering",
    description: "Power systems, microelectronics, control engineering, and electrical machinery publications.",
    display_order: 9,
    color: "#d97706",
    icon: "circuit",
    background_image_url: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000010",
    name: "Information Communication Engineering",
    slug: "information-communication-engineering",
    description: "Telecommunication networks, optical communications, radar signal processing, and wireless systems.",
    display_order: 10,
    color: "#059669",
    icon: "network",
    background_image_url: "https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
  {
    id: "d1000000-0000-4000-8000-000000000011",
    name: "Cybersecurity",
    slug: "cybersecurity",
    description: "Information assurance, cryptographic protocols, ethical hacking, and tactical network defense.",
    display_order: 11,
    color: "#dc2626",
    icon: "code",
    background_image_url: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=1200&q=80",
    is_visible: true,
  },
];

export const DEFAULT_BOOKS = [
  {
    id: "b1000000-0000-4000-8000-000000000001",
    department_id: "d1000000-0000-4000-8000-000000000001",
    title: "Foundations of Artificial Intelligence & Neural Systems",
    author: "Dr. A. K. Bello, Prof. E. N. Okafor",
    description: "Comprehensive textbook covering foundational machine learning algorithms, expert systems, and neural network architectures for defense and aerospace applications.",
    cover_image: "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80",
    isbn: "978-978-362-101-2",
    publisher: "AFIT Academic Press",
    publication_year: 2024,
    edition: "2nd Edition",
    category: "Machine Learning",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "4.2 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000002",
    department_id: "d1000000-0000-4000-8000-000000000003",
    title: "Principles of Business Administration & Strategic Management",
    author: "Col. M. S. Ibrahim (Retd.), Dr. Chinyere Uzor",
    description: "An authoritative guide to organizational leadership, military logistics management, and corporate strategy in modern institutions.",
    cover_image: "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80",
    isbn: "978-978-411-890-5",
    publisher: "Kaduna University Press",
    publication_year: 2023,
    edition: "1st Edition",
    category: "Management",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "3.8 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "b1000000-0000-4000-8000-000000000003",
    department_id: "d1000000-0000-4000-8000-000000000006",
    title: "Advanced Structural Engineering and Reinforced Concrete Design",
    author: "Engr. Prof. T. D. Aliyu",
    description: "Detailed analysis of load-bearing structures, earthquake-resistant design, and heavy infrastructural materials testing.",
    cover_image: "https://images.unsplash.com/photo-1541888946425-d0fbb18f192b?auto=format&fit=crop&w=800&q=80",
    isbn: "978-978-882-334-1",
    publisher: "Nigerian Society of Engineers Press",
    publication_year: 2024,
    edition: "3rd Edition",
    category: "Civil Engineering",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "7.1 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  }
];

export const DEFAULT_JOURNALS = [
  {
    id: "j1000000-0000-4000-8000-000000000001",
    department_id: "d1000000-0000-4000-8000-000000000001",
    title: "AFIT Journal of Artificial Intelligence & Autonomous Systems",
    description: "Peer-reviewed biannual journal featuring cutting-edge research in UAV autonomy, neural controllers, and cognitive decision support.",
    cover_image: "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80",
    publisher: "AFIT Research Directorate",
    issn: "2756-9901",
    volume: "Vol. 5",
    issue: "Issue 2",
    publication_date: "2025-06-15",
    category: "Research Journal",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "2.9 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  },
  {
    id: "j1000000-0000-4000-8000-000000000002",
    department_id: "d1000000-0000-4000-8000-000000000011",
    title: "Nigerian Journal of Cybersecurity & National Security Informatics",
    description: "Scholarly articles on cryptographic protocols, tactical communications encryption, and critical national infrastructure protection.",
    cover_image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80",
    publisher: "AFIT Cybersecurity Center",
    issn: "2811-0423",
    volume: "Vol. 3",
    issue: "Issue 1",
    publication_date: "2025-03-10",
    category: "Cybersecurity",
    file_path: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
    file_size: "3.4 MB",
    status: "published",
    uploaded_by: "Admin Librarian",
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-01T00:00:00.000Z",
  }
];

export interface CarouselSlideRecord {
  id: string;
  title: string;
  description: string;
  image_url: string;
  cta_text?: string | null;
  cta_url?: string | null;
  display_order: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export const DEFAULT_SLIDES: CarouselSlideRecord[] = [
  {
    id: "c1000000-0000-4000-8000-000000000001",
    title: "Aeronautics & Defense Systems Archive",
    description: "Access over 15,000 peer-reviewed technical reports, propulsion research, and aerospace engineering papers.",
    image_url: "https://images.unsplash.com/photo-1517976487502-d5966a3d92fb?auto=format&fit=crop&w=1600&q=80",
    cta_text: "Explore Aerospace Papers",
    cta_url: "/departments/aerospace-engineering",
    display_order: 1,
    is_active: true,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "c1000000-0000-4000-8000-000000000002",
    title: "Artificial Intelligence & Autonomous Robotics",
    description: "Cutting-edge publications in autonomous control algorithms, cyber defence analytics, and computer vision systems.",
    image_url: "https://images.unsplash.com/photo-1507413245164-6160d8298b31?auto=format&fit=crop&w=1600&q=80",
    cta_text: "View AI Publications",
    cta_url: "/departments/artificial-intelligence",
    display_order: 2,
    is_active: true,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
  {
    id: "c1000000-0000-4000-8000-000000000003",
    title: "National Defense Journal & Academic Proceedings",
    description: "Official periodicals and strategic military logistics studies published by accredited AFIT faculty boards.",
    image_url: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1600&q=80",
    cta_text: "Read Periodicals",
    cta_url: "/departments/cyber-security",
    display_order: 3,
    is_active: true,
    created_at: "2026-09-09T00:00:00.000Z",
    updated_at: "2026-09-09T00:00:00.000Z",
  },
];

export interface StatsResponse {
  totalStudents: string;
  academicResources: string;
  activeDepartments: string;
  researchCitations: string;
}

export const DEFAULT_STATS: StatsResponse = {
  totalStudents: "12,500+",
  academicResources: "45,000+",
  activeDepartments: "18+",
  researchCitations: "98%",
};
