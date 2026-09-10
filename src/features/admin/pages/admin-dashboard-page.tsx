import {
  Shield,
  Layers,
  BookOpen,
  Newspaper,
  Plus,
  Trash2,
  Edit,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertCircle,
  LogOut,
  Eye,
  EyeOff,
  UploadCloud,
  Files,
  X,
  Upload,
} from "lucide-react";
import { useEffect, useState } from "react";

import { type Department } from "@/lib/supabase/queries/departments";
import { type Book, type Journal } from "@/lib/supabase/queries/library";
import { checkAdminSession, loginAdmin, logoutAdmin } from "@/lib/auth";
import {
  fetchAdminDepartments,
  createAdminDepartment,
  updateAdminDepartment,
  deleteAdminDepartment,
  fetchAdminBooks,
  createAdminBook,
  updateAdminBook,
  deleteAdminBook,
  fetchAdminJournals,
  createAdminJournal,
  updateAdminJournal,
  deleteAdminJournal,
  uploadLibraryDocument,
  uploadLibraryDocuments,
  generateAdminAbstract,
  uploadAdminImage,
  fetchAdminStats,
  updateAdminStats,
  type InstitutionalStats,
} from "@/lib/admin-library";
import { CarouselManager } from "../components/carousel-manager";
import { Button } from "@/shared/ui/button";

const DEFAULT_STATS: InstitutionalStats = {
  totalStudents: '12,500+',
  academicResources: '45,000+',
  activeDepartments: '18+',
  researchCitations: '98%',
};

export function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'carousel' | 'departments' | 'books' | 'journals' | 'stats'>('overview');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);

  // Shared action feedback banner (create/edit/delete/upload across all tabs)
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const flashSuccess = (message: string) => {
    setActionSuccess(message);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  // Institutional Stats — real backend now (Supabase), was localStorage
  const [statsConfig, setStatsConfig] = useState<InstitutionalStats>(DEFAULT_STATS);
  const [isSavingStats, setIsSavingStats] = useState(false);
  const [statsSuccess, setStatsSuccess] = useState(false);

  const handleSaveStats = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingStats(true);
    setActionError(null);
    try {
      const updated = await updateAdminStats(statsConfig);
      setStatsConfig(updated);
      setStatsSuccess(true);
      setTimeout(() => setStatsSuccess(false), 3000);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save institutional statistics.");
    } finally {
      setIsSavingStats(false);
    }
  };

  // Modal states for CRUD
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [isAddingJournal, setIsAddingJournal] = useState(false);
  const [editingJournal, setEditingJournal] = useState<Journal | null>(null);

  // Saving/submitting flags
  const [isSavingDept, setIsSavingDept] = useState(false);
  const [isSavingBook, setIsSavingBook] = useState(false);
  const [isSavingJournal, setIsSavingJournal] = useState(false);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptImage, setNewDeptImage] = useState("");
  const [isUploadingDeptImage, setIsUploadingDeptImage] = useState(false);

  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookDeptId, setNewBookDeptId] = useState("");
  const [newBookDesc, setNewBookDesc] = useState("");
  const [newBookFile, setNewBookFile] = useState<File | null>(null);
  const [bookFileInputKey, setBookFileInputKey] = useState(0);
  const [isGeneratingBookAbstract, setIsGeneratingBookAbstract] = useState(false);

  // Batch books state
  const [isBatchAddingBooks, setIsBatchAddingBooks] = useState(false);
  const [batchBookDeptId, setBatchBookDeptId] = useState("");
  const [batchBookItems, setBatchBookItems] = useState<Array<{
    file: File;
    title: string;
    author: string;
    abstract: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
  }>>([]);
  const [isProcessingBatchBooks, setIsProcessingBatchBooks] = useState(false);
  const [batchBookInputKey, setBatchBookInputKey] = useState(0);

  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [newJournalDeptId, setNewJournalDeptId] = useState("");
  const [newJournalDesc, setNewJournalDesc] = useState("");
  const [newJournalFile, setNewJournalFile] = useState<File | null>(null);
  const [journalFileInputKey, setJournalFileInputKey] = useState(0);
  const [isGeneratingJournalAbstract, setIsGeneratingJournalAbstract] = useState(false);

  // Batch journals state
  const [isBatchAddingJournals, setIsBatchAddingJournals] = useState(false);
  const [batchJournalDeptId, setBatchJournalDeptId] = useState("");
  const [batchJournalItems, setBatchJournalItems] = useState<Array<{
    file: File;
    title: string;
    publisher: string;
    abstract: string;
    status: 'pending' | 'uploading' | 'done' | 'error';
  }>>([]);
  const [isProcessingBatchJournals, setIsProcessingBatchJournals] = useState(false);
  const [batchJournalInputKey, setBatchJournalInputKey] = useState(0);

  const loadData = async () => {
    try {
      const [depts, bks, jrns, stats] = await Promise.all([
        fetchAdminDepartments(),
        fetchAdminBooks(),
        fetchAdminJournals(),
        fetchAdminStats(),
      ]);
      setDepartments(depts);
      setBooks(bks);
      setJournals(jrns);
      setStatsConfig(stats);
      if (depts.length > 0) {
        setNewBookDeptId((prev) => prev || depts[0].id);
        setNewJournalDeptId((prev) => prev || depts[0].id);
      }
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to load CMS data.");
    }
  };

  useEffect(() => {
    let mounted = true;
    checkAdminSession().then((authenticated) => {
      if (mounted) {
        setIsAuthenticated(authenticated);
        setIsCheckingSession(false);
        if (authenticated) {
          loadData();
        }
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;

    setIsSubmittingAuth(true);
    setAuthErrorMessage(null);

    const result = await loginAdmin(adminPassword);
    setIsSubmittingAuth(false);

    if (result.success) {
      setIsAuthenticated(true);
      setAdminPassword("");
      await loadData();
    } else {
      setAuthErrorMessage(result.message);
    }
  };

  const handleLogout = async () => {
    await logoutAdmin();
    setIsAuthenticated(false);
  };

  // --- DEPARTMENTS: create + edit share one form/modal ---

  const openCreateDept = () => {
    setEditingDept(null);
    setNewDeptName("");
    setNewDeptDesc("");
    setNewDeptImage("");
    setIsAddingDept(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setNewDeptName(dept.name);
    setNewDeptDesc(dept.description || "");
    setNewDeptImage(dept.background_image_url || "");
    setIsAddingDept(true);
  };

  const closeDeptModal = () => {
    setIsAddingDept(false);
    setEditingDept(null);
    setNewDeptName("");
    setNewDeptDesc("");
    setNewDeptImage("");
  };

  const handleDeptImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingDeptImage(true);
    setActionError(null);
    try {
      const url = await uploadAdminImage(file);
      setNewDeptImage(url);
      flashSuccess("Department image uploaded successfully!");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to upload department image.");
    } finally {
      setIsUploadingDeptImage(false);
    }
  };

  const handleSaveDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setIsSavingDept(true);
    setActionError(null);

    const slug = newDeptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    try {
      if (editingDept) {
        await updateAdminDepartment(editingDept.id, {
          name: newDeptName.trim(),
          slug,
          description: newDeptDesc.trim() || null,
          background_image_url: newDeptImage.trim() || null,
        });
        flashSuccess(`"${newDeptName.trim()}" updated.`);
      } else {
        await createAdminDepartment({
          name: newDeptName.trim(),
          slug,
          description: newDeptDesc.trim() || null,
          background_image_url: newDeptImage.trim() || 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
          display_order: departments.length + 1,
          color: '#1d4ed8',
          icon: 'code',
          is_visible: true,
        });
        flashSuccess(`"${newDeptName.trim()}" created.`);
      }
      await loadData();
      closeDeptModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save department.");
    } finally {
      setIsSavingDept(false);
    }
  };

  const handleDeleteDepartment = async (dept: Department) => {
    if (!confirm(`Are you sure you want to delete "${dept.name}"? Books and journals assigned to it will become unassigned.`)) return;
    setActionError(null);
    try {
      await deleteAdminDepartment(dept.id);
      setDepartments((prev) => prev.filter((d) => d.id !== dept.id));
      flashSuccess(`"${dept.name}" deleted.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete department.");
    }
  };

  // --- BOOKS: create + edit share one form/modal ---

  const openCreateBook = () => {
    setEditingBook(null);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookDeptId(departments[0]?.id || "");
    setNewBookDesc("");
    setNewBookFile(null);
    setBookFileInputKey((k) => k + 1);
    setIsAddingBook(true);
  };

  const openEditBook = (bk: Book) => {
    setEditingBook(bk);
    setNewBookTitle(bk.title);
    setNewBookAuthor(bk.author);
    setNewBookDeptId(bk.department_id || departments[0]?.id || "");
    setNewBookDesc(bk.description || "");
    setNewBookFile(null);
    setBookFileInputKey((k) => k + 1);
    setIsAddingBook(true);
  };

  const closeBookModal = () => {
    setIsAddingBook(false);
    setEditingBook(null);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookDesc("");
    setNewBookFile(null);
    setBookFileInputKey((k) => k + 1);
  };

  const handleBookFileChange = (file: File | null) => {
    setNewBookFile(file);
    if (file && !newBookTitle.trim()) {
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setNewBookTitle(autoTitle);
    }
  };

  const handleGenerateBookAbstract = async () => {
    setIsGeneratingBookAbstract(true);
    setActionError(null);
    try {
      const deptObj = departments.find((d) => d.id === newBookDeptId);
      const titleToUse = newBookTitle.trim() || newBookFile?.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Academic Monograph";
      const abstract = await generateAdminAbstract({
        title: titleToUse,
        author: newBookAuthor.trim() || "AFIT Faculty",
        department: deptObj?.name,
        type: "book",
      });
      setNewBookDesc(abstract);
      flashSuccess("Abstract generated with AI!");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate abstract.");
    } finally {
      setIsGeneratingBookAbstract(false);
    }
  };

  const handleSaveBook = async (e: React.FormEvent) => {
    e.preventDefault();

    // Title is optional - defaults to file name if not provided
    let effectiveTitle = newBookTitle.trim();
    if (!effectiveTitle && newBookFile) {
      effectiveTitle = newBookFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    }
    if (!effectiveTitle) {
      effectiveTitle = editingBook?.title || "Untitled Publication";
    }

    const effectiveAuthor = newBookAuthor.trim() || "AFIT Faculty";

    setIsSavingBook(true);
    setActionError(null);

    try {
      let fileFields: { file_path: string; file_size: string } | undefined;

      if (newBookFile) {
        const uploaded = await uploadLibraryDocument(newBookFile);
        fileFields = { file_path: uploaded.url, file_size: uploaded.file_size };
        if (!newBookTitle.trim() && uploaded.suggested_title) {
          effectiveTitle = uploaded.suggested_title;
        }
      } else if (!editingBook) {
        fileFields = {
          file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: '—',
        };
      }

      const basePayload: Partial<Book> = {
        department_id: newBookDeptId || departments[0]?.id || '',
        title: effectiveTitle,
        author: effectiveAuthor,
        description: newBookDesc.trim() || null,
        ...(fileFields || {}),
      };

      if (editingBook) {
        await updateAdminBook(editingBook.id, basePayload);
        flashSuccess(`"${effectiveTitle}" updated.`);
      } else {
        await createAdminBook({
          ...basePayload,
          cover_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
          isbn: null,
          publisher: 'AFIT Academic Press',
          publication_year: new Date().getFullYear(),
          edition: '1st',
          category: 'Textbook',
          status: 'published',
          uploaded_by: 'Administrator',
        });
        flashSuccess(`"${effectiveTitle}" published as PDF.`);
      }

      await loadData();
      closeBookModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save book.");
    } finally {
      setIsSavingBook(false);
    }
  };

  const handleDeleteBook = async (bk: Book) => {
    if (!confirm(`Delete book "${bk.title}"?`)) return;
    setActionError(null);
    try {
      await deleteAdminBook(bk.id);
      setBooks((prev) => prev.filter((b) => b.id !== bk.id));
      flashSuccess(`"${bk.title}" deleted.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete book.");
    }
  };

  // --- BATCH BOOKS: multi-upload ---

  const openBatchBookModal = () => {
    setBatchBookDeptId(departments[0]?.id || "");
    setBatchBookItems([]);
    setBatchBookInputKey((k) => k + 1);
    setIsBatchAddingBooks(true);
  };

  const closeBatchBookModal = () => {
    setIsBatchAddingBooks(false);
    setBatchBookItems([]);
    setBatchBookInputKey((k) => k + 1);
  };

  const handleBatchBookFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const items = Array.from(files).map((f) => ({
      file: f,
      title: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      author: "AFIT Faculty",
      abstract: "",
      status: 'pending' as const,
    }));
    setBatchBookItems(items);
  };

  const handleProcessBatchBooks = async () => {
    if (batchBookItems.length === 0) return;
    setIsProcessingBatchBooks(true);
    setActionError(null);
    const targetDeptId = batchBookDeptId || departments[0]?.id || '';

    try {
      const rawFiles = batchBookItems.map((item) => item.file);
      const uploadedDocs = await uploadLibraryDocuments(rawFiles);

      for (let i = 0; i < uploadedDocs.length; i++) {
        const doc = uploadedDocs[i];
        const item = batchBookItems[i];
        const title = item.title.trim() || doc.suggested_title || doc.original_name;
        const abstract = item.abstract.trim() || doc.abstract || "Academic research publication archived in the AFIT Institutional Repository.";

        await createAdminBook({
          department_id: targetDeptId,
          title,
          author: item.author.trim() || "AFIT Faculty",
          description: abstract,
          file_path: doc.url,
          file_size: doc.file_size,
          cover_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
          isbn: null,
          publisher: 'AFIT Academic Press',
          publication_year: new Date().getFullYear(),
          edition: '1st',
          category: 'Textbook',
          status: 'published',
          uploaded_by: 'Administrator',
        });
      }

      flashSuccess(`Successfully published ${uploadedDocs.length} books as standardized PDFs!`);
      await loadData();
      closeBatchBookModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to process batch books.");
    } finally {
      setIsProcessingBatchBooks(false);
    }
  };

  // --- JOURNALS: create + edit share one form/modal ---

  const openCreateJournal = () => {
    setEditingJournal(null);
    setNewJournalTitle("");
    setNewJournalDeptId(departments[0]?.id || "");
    setNewJournalDesc("");
    setNewJournalFile(null);
    setJournalFileInputKey((k) => k + 1);
    setIsAddingJournal(true);
  };

  const openEditJournal = (jr: Journal) => {
    setEditingJournal(jr);
    setNewJournalTitle(jr.title);
    setNewJournalDeptId(jr.department_id || departments[0]?.id || "");
    setNewJournalDesc(jr.description || "");
    setNewJournalFile(null);
    setJournalFileInputKey((k) => k + 1);
    setIsAddingJournal(true);
  };

  const closeJournalModal = () => {
    setIsAddingJournal(false);
    setEditingJournal(null);
    setNewJournalTitle("");
    setNewJournalDesc("");
    setNewJournalFile(null);
    setJournalFileInputKey((k) => k + 1);
  };

  const handleJournalFileChange = (file: File | null) => {
    setNewJournalFile(file);
    if (file && !newJournalTitle.trim()) {
      const autoTitle = file.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
      setNewJournalTitle(autoTitle);
    }
  };

  const handleGenerateJournalAbstract = async () => {
    setIsGeneratingJournalAbstract(true);
    setActionError(null);
    try {
      const deptObj = departments.find((d) => d.id === newJournalDeptId);
      const titleToUse = newJournalTitle.trim() || newJournalFile?.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ") || "Journal Research Paper";
      const abstract = await generateAdminAbstract({
        title: titleToUse,
        department: deptObj?.name,
        type: "journal",
      });
      setNewJournalDesc(abstract);
      flashSuccess("Abstract generated with AI!");
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to generate abstract.");
    } finally {
      setIsGeneratingJournalAbstract(false);
    }
  };

  const handleSaveJournal = async (e: React.FormEvent) => {
    e.preventDefault();

    // Title is optional - defaults to file name if not provided
    let effectiveTitle = newJournalTitle.trim();
    if (!effectiveTitle && newJournalFile) {
      effectiveTitle = newJournalFile.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " ");
    }
    if (!effectiveTitle) {
      effectiveTitle = editingJournal?.title || "Untitled Research Paper";
    }

    setIsSavingJournal(true);
    setActionError(null);

    try {
      let fileFields: { file_path: string; file_size: string } | undefined;

      if (newJournalFile) {
        const uploaded = await uploadLibraryDocument(newJournalFile);
        fileFields = { file_path: uploaded.url, file_size: uploaded.file_size };
        if (!newJournalTitle.trim() && uploaded.suggested_title) {
          effectiveTitle = uploaded.suggested_title;
        }
      } else if (!editingJournal) {
        fileFields = {
          file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
          file_size: '—',
        };
      }

      const basePayload: Partial<Journal> = {
        department_id: newJournalDeptId || departments[0]?.id || '',
        title: effectiveTitle,
        description: newJournalDesc.trim() || null,
        ...(fileFields || {}),
      };

      if (editingJournal) {
        await updateAdminJournal(editingJournal.id, basePayload);
        flashSuccess(`"${effectiveTitle}" updated.`);
      } else {
        await createAdminJournal({
          ...basePayload,
          cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          publisher: 'AFIT Research',
          issn: '2800-1111',
          volume: 'Vol. 6',
          issue: 'Issue 1',
          publication_date: new Date().toISOString().split('T')[0],
          category: 'Journal',
          status: 'published',
          uploaded_by: 'Administrator',
        });
        flashSuccess(`"${effectiveTitle}" published as PDF.`);
      }

      await loadData();
      closeJournalModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to save journal.");
    } finally {
      setIsSavingJournal(false);
    }
  };

  const handleDeleteJournal = async (jr: Journal) => {
    if (!confirm(`Delete journal "${jr.title}"?`)) return;
    setActionError(null);
    try {
      await deleteAdminJournal(jr.id);
      setJournals((prev) => prev.filter((j) => j.id !== jr.id));
      flashSuccess(`"${jr.title}" deleted.`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to delete journal.");
    }
  };

  // --- BATCH JOURNALS: multi-upload ---

  const openBatchJournalModal = () => {
    setBatchJournalDeptId(departments[0]?.id || "");
    setBatchJournalItems([]);
    setBatchJournalInputKey((k) => k + 1);
    setIsBatchAddingJournals(true);
  };

  const closeBatchJournalModal = () => {
    setIsBatchAddingJournals(false);
    setBatchJournalItems([]);
    setBatchJournalInputKey((k) => k + 1);
  };

  const handleBatchJournalFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const items = Array.from(files).map((f) => ({
      file: f,
      title: f.name.replace(/\.[^/.]+$/, "").replace(/[-_]/g, " "),
      publisher: "AFIT Research",
      abstract: "",
      status: 'pending' as const,
    }));
    setBatchJournalItems(items);
  };

  const handleProcessBatchJournals = async () => {
    if (batchJournalItems.length === 0) return;
    setIsProcessingBatchJournals(true);
    setActionError(null);
    const targetDeptId = batchJournalDeptId || departments[0]?.id || '';

    try {
      const rawFiles = batchJournalItems.map((item) => item.file);
      const uploadedDocs = await uploadLibraryDocuments(rawFiles);

      for (let i = 0; i < uploadedDocs.length; i++) {
        const doc = uploadedDocs[i];
        const item = batchJournalItems[i];
        const title = item.title.trim() || doc.suggested_title || doc.original_name;
        const abstract = item.abstract.trim() || doc.abstract || "Peer-reviewed research paper cataloged in AFIT Periodicals.";

        await createAdminJournal({
          department_id: targetDeptId,
          title,
          description: abstract,
          file_path: doc.url,
          file_size: doc.file_size,
          cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
          publisher: item.publisher.trim() || 'AFIT Research',
          issn: '2800-1111',
          volume: 'Vol. 6',
          issue: 'Issue 1',
          publication_date: new Date().toISOString().split('T')[0],
          category: 'Journal',
          status: 'published',
          uploaded_by: 'Administrator',
        });
      }

      flashSuccess(`Successfully published ${uploadedDocs.length} journal papers as standardized PDFs!`);
      await loadData();
      closeBatchJournalModal();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Failed to process batch journals.");
    } finally {
      setIsProcessingBatchJournals(false);
    }
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 aria-hidden="true" className="size-8 animate-spin text-primary" />
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
            Verifying administrative security session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <section className="mx-auto max-w-md px-4 py-24">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-xl">
          <div className="text-center mb-6">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground mb-4 shadow-sm">
              <Shield aria-hidden="true" className="size-7" />
            </div>
            <h1 className="text-2xl font-bold font-serif text-foreground">Admin Portal Access</h1>
            <p className="mt-2 text-xs text-muted-foreground uppercase tracking-wider">
              Enter administrator password to continue
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1.5">
                Administrator Password
              </label>
              <div className="relative">
                <input
                  id="admin-password-input"
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  placeholder="Enter administrator password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/40 pl-4 pr-11 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
                />
                <button
                  id="toggle-admin-password-visibility-btn"
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground focus:outline-hidden focus:text-foreground transition-colors cursor-pointer"
                  aria-label={showPassword ? "Hide administrator password" : "Show administrator password"}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff aria-hidden="true" className="size-4.5" />
                  ) : (
                    <Eye aria-hidden="true" className="size-4.5" />
                  )}
                </button>
              </div>
              {authErrorMessage && (
                <div className="mt-3 rounded-xl bg-destructive/10 border border-destructive/20 p-3 text-xs text-destructive font-medium flex items-center gap-2">
                  <AlertCircle className="size-4 shrink-0" />
                  <span>{authErrorMessage}</span>
                </div>
              )}
            </div>
            <Button type="submit" disabled={isSubmittingAuth} className="w-full py-3 font-semibold gap-2">
              {isSubmittingAuth ? (
                <>
                  <Loader2 aria-hidden="true" className="size-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <span>Authenticate & Enter CMS</span>
              )}
            </Button>
          </form>
          <div className="mt-6 text-center text-xs text-muted-foreground">
            <p>Authorized AFIT administrative personnel only. All access attempts are logged and monitored.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-border">
        <div className="flex items-center gap-3.5">
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Shield aria-hidden="true" className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold font-serif text-foreground">AFIT Library Administration CMS</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Secure Content Management & Database Control</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-600 border border-emerald-500/20">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" /> CMS Session Active
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout} className="gap-1.5 text-xs">
            <LogOut aria-hidden="true" className="size-3.5" />
            <span>Log Out & Lock</span>
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'overview' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
        >
          Dashboard Overview
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('carousel')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'carousel' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
        >
          <Sparkles aria-hidden="true" className="size-3.5" />
          <span>Spotlight Carousel</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('stats')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'stats' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
        >
          Institutional Statistics
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('departments')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'departments' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
        >
          Departments ({departments.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('books')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'books' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
        >
          Books ({books.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('journals')}
          className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${activeTab === 'journals' ? 'bg-primary text-primary-foreground shadow-xs' : 'bg-muted/60 text-muted-foreground hover:bg-muted'}`}
        >
          Journals ({journals.length})
        </button>
      </div>

      {/* SHARED ACTION FEEDBACK BANNER */}
      {actionError && (
        <div className="mb-6 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive font-medium flex items-center gap-2">
          <AlertCircle className="size-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}
      {actionSuccess && (
        <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 flex items-center gap-2">
          <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* CAROUSEL TAB */}
      {activeTab === 'carousel' && (
        <CarouselManager />
      )}

      {/* INSTITUTIONAL STATISTICS TAB */}
      {activeTab === 'stats' && (
        <div className="space-y-6 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
            <h2 className="text-xl font-bold font-serif text-foreground mb-2">Institutional Statistics Manager</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Update the key metrics displayed on the AFIT eLibrary home page hero area. These now save to the server and are visible to every visitor, not just this browser.
            </p>

            {statsSuccess && (
              <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <span>Institutional statistics saved and live on the homepage.</span>
              </div>
            )}

            <form onSubmit={handleSaveStats} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Total Enrolled Students</label>
                <input
                  type="text"
                  value={statsConfig.totalStudents}
                  onChange={(e) => setStatsConfig({ ...statsConfig, totalStudents: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 12,500+"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Academic Library Resources</label>
                <input
                  type="text"
                  value={statsConfig.academicResources}
                  onChange={(e) => setStatsConfig({ ...statsConfig, academicResources: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 45,000+"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Active Academic Departments</label>
                <input
                  type="text"
                  value={statsConfig.activeDepartments}
                  onChange={(e) => setStatsConfig({ ...statsConfig, activeDepartments: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 18+"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Research Index Score</label>
                <input
                  type="text"
                  value={statsConfig.researchCitations}
                  onChange={(e) => setStatsConfig({ ...statsConfig, researchCitations: e.target.value })}
                  className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  placeholder="e.g. 98%"
                />
              </div>

              <div className="pt-4">
                <Button type="submit" size="lg" className="w-full" disabled={isSavingStats}>
                  {isSavingStats ? "Saving..." : "Save Institutional Statistics"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Departments</p>
                <Layers aria-hidden="true" className="size-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-extrabold font-serif text-foreground">{departments.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Active academic units</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Books</p>
                <BookOpen aria-hidden="true" className="size-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-extrabold font-serif text-foreground">{books.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Textbooks & monographs</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Total Journals</p>
                <Newspaper aria-hidden="true" className="size-5 text-primary" />
              </div>
              <p className="mt-4 text-3xl font-extrabold font-serif text-foreground">{journals.length}</p>
              <p className="mt-1 text-xs text-muted-foreground">Peer-reviewed papers</p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">System Status</p>
                <CheckCircle2 aria-hidden="true" className="size-5 text-emerald-600" />
              </div>
              <p className="mt-4 text-3xl font-extrabold font-serif text-emerald-600">Online</p>
              <p className="mt-1 text-xs text-muted-foreground">PostgreSQL / Supabase synced</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold font-serif text-foreground mb-4">Quick Actions</h2>
              <div className="grid gap-3">
                <Button className="justify-start gap-2" onClick={() => setActiveTab('carousel')}>
                  <Sparkles aria-hidden="true" className="size-4" /> Manage Homepage Spotlight Carousel
                </Button>
                <Button variant="secondary" className="justify-start gap-2" onClick={() => { setActiveTab('departments'); openCreateDept(); }}>
                  <Plus aria-hidden="true" className="size-4" /> Create New Department
                </Button>
                <Button variant="secondary" className="justify-start gap-2" onClick={() => { setActiveTab('books'); openCreateBook(); }}>
                  <Plus aria-hidden="true" className="size-4" /> Upload New Book PDF
                </Button>
                <Button variant="secondary" className="justify-start gap-2" onClick={() => { setActiveTab('journals'); openCreateJournal(); }}>
                  <Plus aria-hidden="true" className="size-4" /> Upload New Journal Paper
                </Button>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <h2 className="text-lg font-bold font-serif text-foreground mb-4">Repository Guidelines</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                All resources uploaded through the admin CMS are instantly bound to their respective department records. Ensure correct metadata (ISBN, publisher, author) is entered before publishing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENTS TAB */}
      {activeTab === 'departments' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="text-xl font-bold font-serif text-foreground">Manage Departments</h2>
            <Button className="gap-2" onClick={openCreateDept}>
              <Plus aria-hidden="true" className="size-4" /> Add Department
            </Button>
          </div>

          {/* Add/Edit Dept Modal */}
          {isAddingDept && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6">
              <h3 className="text-base font-bold font-serif text-foreground mb-4">
                {editingDept ? `Edit "${editingDept.name}"` : "Create New Department"}
              </h3>
              <form onSubmit={handleSaveDepartment} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Department Name</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mechatronics Engineering"
                      value={newDeptName}
                      onChange={e => setNewDeptName(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Department Cover Image</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <label className="relative flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-2 text-xs font-medium text-foreground hover:bg-muted/60 transition-colors">
                          <Upload className="size-3.5 text-primary" />
                          <span>{isUploadingDeptImage ? "Uploading..." : "Upload Any Image"}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleDeptImageUpload}
                            disabled={isUploadingDeptImage}
                            className="sr-only"
                          />
                        </label>
                        {isUploadingDeptImage && <Loader2 className="size-4 animate-spin text-primary" />}
                        {newDeptImage && (
                          <div className="flex items-center gap-2">
                            <img
                              src={newDeptImage}
                              alt="Preview"
                              className="size-8 rounded-lg object-cover border border-border"
                              referrerPolicy="no-referrer"
                            />
                            <button
                              type="button"
                              onClick={() => setNewDeptImage("")}
                              className="text-muted-foreground hover:text-destructive text-xs"
                              title="Remove image"
                            >
                              <X className="size-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder="Or enter image URL (https://...)"
                        value={newDeptImage}
                        onChange={e => setNewDeptImage(e.target.value)}
                        className="w-full rounded-xl border border-border bg-muted/40 px-3 py-1.5 text-xs text-foreground focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Short summary of research collections..."
                    value={newDeptDesc}
                    onChange={e => setNewDeptDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeDeptModal}>Cancel</Button>
                  <Button type="submit" disabled={isSavingDept}>
                    {isSavingDept ? "Saving..." : editingDept ? "Save Changes" : "Save Department"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Department Name</th>
                    <th className="p-4">Slug</th>
                    <th className="p-4">Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {departments.map(dept => (
                    <tr key={dept.id} className="hover:bg-muted/30">
                      <td className="p-4 font-bold text-foreground font-serif">{dept.name}</td>
                      <td className="p-4 text-muted-foreground font-mono text-xs">{dept.slug}</td>
                      <td className="p-4">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3" /> Published
                        </span>
                      </td>
                      <td className="p-4 text-right space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditDept(dept)}>
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteDepartment(dept)}>
                          <Trash2 className="size-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* BOOKS TAB */}
      {activeTab === 'books' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">Manage Books Collection</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Upload single books or bulk upload multiple documents in any format</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={openBatchBookModal}>
                <Files aria-hidden="true" className="size-4" /> Bulk Upload Books
              </Button>
              <Button className="gap-2" onClick={openCreateBook}>
                <Plus aria-hidden="true" className="size-4" /> Upload New Book
              </Button>
            </div>
          </div>

          {/* Bulk/Batch Books Modal */}
          {isBatchAddingBooks && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold font-serif text-foreground">Bulk Upload Multiple Books</h3>
                  <p className="text-xs text-muted-foreground">Select multiple files of any format. Each will be automatically converted to an academic PDF.</p>
                </div>
                <button
                  type="button"
                  onClick={closeBatchBookModal}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Assign Target Department</label>
                  <select
                    value={batchBookDeptId}
                    onChange={e => setBatchBookDeptId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Select Files (Multiple Allowed)</label>
                  <input
                    key={batchBookInputKey}
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={handleBatchBookFilesSelected}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
                  />
                  <p className="mt-1 text-2xs text-muted-foreground">Accepts any format (DOCX, PDF, TXT, EPUB, etc.)</p>
                </div>
              </div>

              {batchBookItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Documents ({batchBookItems.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {batchBookItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.file.name}</p>
                          <p className="text-2xs text-muted-foreground">{(item.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Title (defaults to filename)"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...batchBookItems];
                              updated[idx].title = e.target.value;
                              setBatchBookItems(updated);
                            }}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          />
                        </div>
                        <div className="w-full sm:w-36">
                          <input
                            type="text"
                            placeholder="Author"
                            value={item.author}
                            onChange={(e) => {
                              const updated = [...batchBookItems];
                              updated[idx].author = e.target.value;
                              setBatchBookItems(updated);
                            }}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBatchBookItems(batchBookItems.filter((_, i) => i !== idx));
                          }}
                          className="text-muted-foreground hover:text-destructive text-xs p-1"
                          title="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeBatchBookModal}>Cancel</Button>
                <Button
                  type="button"
                  disabled={batchBookItems.length === 0 || isProcessingBatchBooks}
                  onClick={handleProcessBatchBooks}
                >
                  {isProcessingBatchBooks ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Converting to PDF & Publishing ({batchBookItems.length})...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4 mr-2" />
                      Publish {batchBookItems.length} Books as PDFs
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Add/Edit Book Modal */}
          {isAddingBook && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6">
              <h3 className="text-base font-bold font-serif text-foreground mb-4">
                {editingBook ? `Edit "${editingBook.title}"` : "Upload Book Document & Metadata"}
              </h3>
              <form onSubmit={handleSaveBook} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Book Title <span className="font-normal lowercase text-muted-foreground">(optional — defaults to file name)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Advanced AI Systems (or leave blank for file name)"
                      value={newBookTitle}
                      onChange={e => setNewBookTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Author(s) <span className="font-normal lowercase text-muted-foreground">(optional — defaults to AFIT Faculty)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Prof. J. Doe"
                      value={newBookAuthor}
                      onChange={e => setNewBookAuthor(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Assign Department</label>
                    <select
                      value={newBookDeptId}
                      onChange={e => setNewBookDeptId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Document File</label>
                    <input
                      key={bookFileInputKey}
                      type="file"
                      accept="*/*"
                      onChange={e => handleBookFileChange(e.target.files?.[0] ?? null)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
                    />
                    <p className="mt-1 text-2xs text-muted-foreground">
                      Accepts all file formats (DOCX, PDF, TXT, EPUB, etc.) — automatically converted to PDF when stored.
                    </p>
                    {editingBook && !newBookFile && (
                      <p className="mt-0.5 text-2xs text-muted-foreground">Current file: {editingBook.file_size || 'on record'}. Leave empty to keep it.</p>
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Description / Abstract</label>
                    <button
                      type="button"
                      onClick={handleGenerateBookAbstract}
                      disabled={isGeneratingBookAbstract}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      {isGeneratingBookAbstract ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Generating Abstract...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          <span>Auto-generate Abstract with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Book overview or auto-generated abstract..."
                    value={newBookDesc}
                    onChange={e => setNewBookDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeBookModal}>Cancel</Button>
                  <Button type="submit" disabled={isSavingBook}>
                    {isSavingBook
                      ? (newBookFile ? "Converting to PDF & Saving..." : "Saving...")
                      : editingBook ? "Save Changes" : "Publish Book as PDF"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Title</th>
                    <th className="p-4">Author</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Year</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {books.map(bk => {
                    const dept = departments.find(d => d.id === bk.department_id);
                    return (
                      <tr key={bk.id} className="hover:bg-muted/30">
                        <td className="p-4 font-bold text-foreground font-serif">{bk.title}</td>
                        <td className="p-4 text-muted-foreground">{bk.author}</td>
                        <td className="p-4 font-medium text-primary">{dept?.name || 'General'}</td>
                        <td className="p-4 text-muted-foreground">{bk.publication_year || '2025'}</td>
                        <td className="p-4 text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditBook(bk)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteBook(bk)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* JOURNALS TAB */}
      {activeTab === 'journals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold font-serif text-foreground">Manage Journals & Periodicals</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Upload single research papers or bulk upload multiple papers in any format</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" className="gap-2" onClick={openBatchJournalModal}>
                <Files aria-hidden="true" className="size-4" /> Bulk Upload Journals
              </Button>
              <Button className="gap-2" onClick={openCreateJournal}>
                <Plus aria-hidden="true" className="size-4" /> Upload New Journal
              </Button>
            </div>
          </div>

          {/* Bulk/Batch Journals Modal */}
          {isBatchAddingJournals && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h3 className="text-base font-bold font-serif text-foreground">Bulk Upload Multiple Journals</h3>
                  <p className="text-xs text-muted-foreground">Select multiple research paper files of any format. Each will be automatically converted to an academic PDF.</p>
                </div>
                <button
                  type="button"
                  onClick={closeBatchJournalModal}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Assign Target Department</label>
                  <select
                    value={batchJournalDeptId}
                    onChange={e => setBatchJournalDeptId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Select Files (Multiple Allowed)</label>
                  <input
                    key={batchJournalInputKey}
                    type="file"
                    multiple
                    accept="*/*"
                    onChange={handleBatchJournalFilesSelected}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
                  />
                  <p className="mt-1 text-2xs text-muted-foreground">Accepts any format (DOCX, PDF, TXT, EPUB, etc.)</p>
                </div>
              </div>

              {batchJournalItems.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Selected Documents ({batchJournalItems.length})
                  </h4>
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {batchJournalItems.map((item, idx) => (
                      <div key={idx} className="flex flex-col sm:flex-row items-start sm:items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-foreground truncate">{item.file.name}</p>
                          <p className="text-2xs text-muted-foreground">{(item.file.size / 1024).toFixed(0)} KB</p>
                        </div>
                        <div className="flex-1 w-full sm:w-auto">
                          <input
                            type="text"
                            placeholder="Title (defaults to filename)"
                            value={item.title}
                            onChange={(e) => {
                              const updated = [...batchJournalItems];
                              updated[idx].title = e.target.value;
                              setBatchJournalItems(updated);
                            }}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          />
                        </div>
                        <div className="w-full sm:w-36">
                          <input
                            type="text"
                            placeholder="Publisher"
                            value={item.publisher}
                            onChange={(e) => {
                              const updated = [...batchJournalItems];
                              updated[idx].publisher = e.target.value;
                              setBatchJournalItems(updated);
                            }}
                            className="w-full rounded-lg border border-border bg-background px-2.5 py-1 text-xs text-foreground"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setBatchJournalItems(batchJournalItems.filter((_, i) => i !== idx));
                          }}
                          className="text-muted-foreground hover:text-destructive text-xs p-1"
                          title="Remove item"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="ghost" onClick={closeBatchJournalModal}>Cancel</Button>
                <Button
                  type="button"
                  disabled={batchJournalItems.length === 0 || isProcessingBatchJournals}
                  onClick={handleProcessBatchJournals}
                >
                  {isProcessingBatchJournals ? (
                    <>
                      <Loader2 className="size-4 animate-spin mr-2" />
                      Converting to PDF & Publishing ({batchJournalItems.length})...
                    </>
                  ) : (
                    <>
                      <UploadCloud className="size-4 mr-2" />
                      Publish {batchJournalItems.length} Journals as PDFs
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Add/Edit Journal Modal */}
          {isAddingJournal && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6">
              <h3 className="text-base font-bold font-serif text-foreground mb-4">
                {editingJournal ? `Edit "${editingJournal.title}"` : "Upload Journal Research Paper"}
              </h3>
              <form onSubmit={handleSaveJournal} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">
                      Journal Title <span className="font-normal lowercase text-muted-foreground">(optional — defaults to file name)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. AFIT Journal of Engineering (or leave blank for file name)"
                      value={newJournalTitle}
                      onChange={e => setNewJournalTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Assign Department</label>
                    <select
                      value={newJournalDeptId}
                      onChange={e => setNewJournalDeptId(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Document File</label>
                  <input
                    key={journalFileInputKey}
                    type="file"
                    accept="*/*"
                    onChange={e => handleJournalFileChange(e.target.files?.[0] ?? null)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
                  />
                  <p className="mt-1 text-2xs text-muted-foreground">
                    Accepts all file formats (DOCX, PDF, TXT, EPUB, etc.) — automatically converted to PDF when stored.
                  </p>
                  {editingJournal && !newJournalFile && (
                    <p className="mt-0.5 text-2xs text-muted-foreground">Current file: {editingJournal.file_size || 'on record'}. Leave empty to keep it.</p>
                  )}
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground">Abstract</label>
                    <button
                      type="button"
                      onClick={handleGenerateJournalAbstract}
                      disabled={isGeneratingJournalAbstract}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
                    >
                      {isGeneratingJournalAbstract ? (
                        <>
                          <Loader2 className="size-3.5 animate-spin" />
                          <span>Generating Abstract...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="size-3.5" />
                          <span>Auto-generate Abstract with AI</span>
                        </>
                      )}
                    </button>
                  </div>
                  <textarea
                    rows={3}
                    placeholder="Paper abstract or auto-generate with AI..."
                    value={newJournalDesc}
                    onChange={e => setNewJournalDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={closeJournalModal}>Cancel</Button>
                  <Button type="submit" disabled={isSavingJournal}>
                    {isSavingJournal
                      ? (newJournalFile ? "Converting to PDF & Saving..." : "Saving...")
                      : editingJournal ? "Save Changes" : "Publish Journal as PDF"}
                  </Button>
                </div>
              </form>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <th className="p-4">Title</th>
                    <th className="p-4">Publisher</th>
                    <th className="p-4">Department</th>
                    <th className="p-4">Volume</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {journals.map(jr => {
                    const dept = departments.find(d => d.id === jr.department_id);
                    return (
                      <tr key={jr.id} className="hover:bg-muted/30">
                        <td className="p-4 font-bold text-foreground font-serif">{jr.title}</td>
                        <td className="p-4 text-muted-foreground">{jr.publisher || 'AFIT Press'}</td>
                        <td className="p-4 font-medium text-primary">{dept?.name || 'General'}</td>
                        <td className="p-4 text-muted-foreground">{jr.volume || 'Vol. 1'}</td>
                        <td className="p-4 text-right space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => openEditJournal(jr)}>
                            <Edit className="size-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteJournal(jr)}>
                            <Trash2 className="size-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
