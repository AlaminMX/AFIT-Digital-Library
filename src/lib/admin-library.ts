import type { Department } from "@/lib/supabase/queries/departments";
import type { Book, Journal } from "@/lib/supabase/queries/library";

export interface InstitutionalStats {
  totalStudents: string;
  academicResources: string;
  activeDepartments: string;
  researchCitations: string;
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  const token = sessionStorage.getItem("afit_admin_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleJsonResponse<T>(res: Response, errorFallback: string): Promise<T> {
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || errorFallback);
  }
  return res.json();
}

// --- DEPARTMENTS ---

export async function fetchAdminDepartments(): Promise<Department[]> {
  const res = await fetch("/api/admin/departments", { credentials: "include", headers: getAuthHeaders() });
  const data = await handleJsonResponse<{ departments: Department[] }>(res, "Failed to load departments.");
  return data.departments || [];
}

export async function createAdminDepartment(dept: Partial<Department>): Promise<Department> {
  const res = await fetch("/api/admin/departments", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(dept)
  });
  const data = await handleJsonResponse<{ department: Department }>(res, "Failed to create department.");
  return data.department;
}

export async function updateAdminDepartment(id: string, dept: Partial<Department>): Promise<Department> {
  const res = await fetch(`/api/admin/departments/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(dept)
  });
  const data = await handleJsonResponse<{ department: Department }>(res, "Failed to update department.");
  return data.department;
}

export async function deleteAdminDepartment(id: string): Promise<void> {
  const res = await fetch(`/api/admin/departments/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders()
  });
  await handleJsonResponse(res, "Failed to delete department.");
}

// --- BOOKS ---

export async function fetchAdminBooks(): Promise<Book[]> {
  const res = await fetch("/api/admin/books", { credentials: "include", headers: getAuthHeaders() });
  const data = await handleJsonResponse<{ books: Book[] }>(res, "Failed to load books.");
  return data.books || [];
}

export async function createAdminBook(book: Partial<Book>): Promise<Book> {
  const res = await fetch("/api/admin/books", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(book)
  });
  const data = await handleJsonResponse<{ book: Book }>(res, "Failed to create book.");
  return data.book;
}

export async function updateAdminBook(id: string, book: Partial<Book>): Promise<Book> {
  const res = await fetch(`/api/admin/books/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(book)
  });
  const data = await handleJsonResponse<{ book: Book }>(res, "Failed to update book.");
  return data.book;
}

export async function deleteAdminBook(id: string): Promise<void> {
  const res = await fetch(`/api/admin/books/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders()
  });
  await handleJsonResponse(res, "Failed to delete book.");
}

// --- JOURNALS ---

export async function fetchAdminJournals(): Promise<Journal[]> {
  const res = await fetch("/api/admin/journals", { credentials: "include", headers: getAuthHeaders() });
  const data = await handleJsonResponse<{ journals: Journal[] }>(res, "Failed to load journals.");
  return data.journals || [];
}

export async function createAdminJournal(journal: Partial<Journal>): Promise<Journal> {
  const res = await fetch("/api/admin/journals", {
    method: "POST",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(journal)
  });
  const data = await handleJsonResponse<{ journal: Journal }>(res, "Failed to create journal.");
  return data.journal;
}

export async function updateAdminJournal(id: string, journal: Partial<Journal>): Promise<Journal> {
  const res = await fetch(`/api/admin/journals/${id}`, {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(journal)
  });
  const data = await handleJsonResponse<{ journal: Journal }>(res, "Failed to update journal.");
  return data.journal;
}

export async function deleteAdminJournal(id: string): Promise<void> {
  const res = await fetch(`/api/admin/journals/${id}`, {
    method: "DELETE",
    credentials: "include",
    headers: getAuthHeaders()
  });
  await handleJsonResponse(res, "Failed to delete journal.");
}

// --- DOCUMENT UPLOAD (PDF, for books & journals) ---
// Goes to Supabase Storage server-side — see /api/admin/upload-document.

export async function uploadLibraryDocument(file: File): Promise<{ url: string; file_size: string }> {
  const formData = new FormData();
  formData.append("document", file);

  const headers: Record<string, string> = {};
  const token = sessionStorage.getItem("afit_admin_token");
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch("/api/admin/upload-document", {
    method: "POST",
    credentials: "include",
    headers,
    body: formData
  });

  return handleJsonResponse(res, "Failed to upload document.");
}

// --- INSTITUTIONAL STATS ---
// GET is public (no auth headers needed) since the homepage also reads it.

export async function fetchAdminStats(): Promise<InstitutionalStats> {
  const res = await fetch("/api/stats");
  return handleJsonResponse<InstitutionalStats>(res, "Failed to load institutional stats.");
}

export async function updateAdminStats(stats: InstitutionalStats): Promise<InstitutionalStats> {
  const res = await fetch("/api/admin/stats", {
    method: "PUT",
    credentials: "include",
    headers: getAuthHeaders(),
    body: JSON.stringify(stats)
  });
  return handleJsonResponse<InstitutionalStats>(res, "Failed to update institutional stats.");
}
