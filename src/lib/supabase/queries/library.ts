import { getSupabaseClient } from "@/lib/supabase/client";

export type Book = {
  id: string;
  department_id: string;
  title: string;
  author: string;
  description: string | null;
  cover_image: string | null;
  isbn: string | null;
  publisher: string | null;
  publication_year: number | null;
  edition: string | null;
  category: string | null;
  file_path: string | null;
  file_size: string | null;
  status: 'published' | 'draft';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Journal = {
  id: string;
  department_id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  publisher: string | null;
  issn: string | null;
  volume: string | null;
  issue: string | null;
  publication_date: string | null;
  category: string | null;
  file_path: string | null;
  file_size: string | null;
  status: 'published' | 'draft';
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

const MOCK_BOOKS: Book[] = [
  {
    id: 'b1000000-0000-4000-8000-000000000001',
    department_id: 'd1000000-0000-4000-8000-000000000001',
    title: 'Foundations of Artificial Intelligence & Neural Systems',
    author: 'Dr. A. K. Bello, Prof. E. N. Okafor',
    description: 'Comprehensive textbook covering foundational machine learning algorithms, expert systems, and neural network architectures for defense and aerospace applications.',
    cover_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
    isbn: '978-978-362-101-2',
    publisher: 'AFIT Academic Press',
    publication_year: 2024,
    edition: '2nd Edition',
    category: 'Machine Learning',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '4.2 MB',
    status: 'published',
    uploaded_by: 'Admin Librarian',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b1000000-0000-4000-8000-000000000002',
    department_id: 'd1000000-0000-4000-8000-000000000003',
    title: 'Principles of Business Administration & Strategic Management',
    author: 'Col. M. S. Ibrahim (Retd.), Dr. Chinyere Uzor',
    description: 'An authoritative guide to organizational leadership, military logistics management, and corporate strategy in modern institutions.',
    cover_image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=800&q=80',
    isbn: '978-978-411-890-5',
    publisher: 'Kaduna University Press',
    publication_year: 2023,
    edition: '1st Edition',
    category: 'Management',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '3.8 MB',
    status: 'published',
    uploaded_by: 'Admin Librarian',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'b1000000-0000-4000-8000-000000000003',
    department_id: 'd1000000-0000-4000-8000-000000000006',
    title: 'Advanced Structural Engineering and Reinforced Concrete Design',
    author: 'Engr. Prof. T. D. Aliyu',
    description: 'Detailed analysis of load-bearing structures, earthquake-resistant design, and heavy infrastructural materials testing.',
    cover_image: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f192b?auto=format&fit=crop&w=800&q=80',
    isbn: '978-978-882-334-1',
    publisher: 'Nigerian Society of Engineers Press',
    publication_year: 2024,
    edition: '3rd Edition',
    category: 'Civil Engineering',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '7.1 MB',
    status: 'published',
    uploaded_by: 'Admin Librarian',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

const MOCK_JOURNALS: Journal[] = [
  {
    id: 'j1000000-0000-4000-8000-000000000001',
    department_id: 'd1000000-0000-4000-8000-000000000001',
    title: 'AFIT Journal of Artificial Intelligence & Autonomous Systems',
    description: 'Peer-reviewed biannual journal featuring cutting-edge research in UAV autonomy, neural controllers, and cognitive decision support.',
    cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
    publisher: 'AFIT Research Directorate',
    issn: '2756-9901',
    volume: 'Vol. 5',
    issue: 'Issue 2',
    publication_date: '2025-06-15',
    category: 'Research Journal',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '2.9 MB',
    status: 'published',
    uploaded_by: 'Admin Librarian',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'j1000000-0000-4000-8000-000000000002',
    department_id: 'd1000000-0000-4000-8000-000000000011',
    title: 'Nigerian Journal of Cybersecurity & National Security Informatics',
    description: 'Scholarly articles on cryptographic protocols, tactical communications encryption, and critical national infrastructure protection.',
    cover_image: 'https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=800&q=80',
    publisher: 'AFIT Cybersecurity Center',
    issn: '2811-0423',
    volume: 'Vol. 3',
    issue: 'Issue 1',
    publication_date: '2025-03-10',
    category: 'Cybersecurity',
    file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    file_size: '3.4 MB',
    status: 'published',
    uploaded_by: 'Admin Librarian',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }
];

export async function getBooksByDepartment(departmentId: string): Promise<Book[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("books")
      .select("*")
      .eq("department_id", departmentId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return MOCK_BOOKS.filter(b => b.department_id === departmentId);
    }
    return data as Book[];
  } catch {
    return MOCK_BOOKS.filter(b => b.department_id === departmentId);
  }
}

export async function getJournalsByDepartment(departmentId: string): Promise<Journal[]> {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("journals")
      .select("*")
      .eq("department_id", departmentId)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    if (error || !data) {
      return MOCK_JOURNALS.filter(j => j.department_id === departmentId);
    }
    return data as Journal[];
  } catch {
    return MOCK_JOURNALS.filter(j => j.department_id === departmentId);
  }
}
