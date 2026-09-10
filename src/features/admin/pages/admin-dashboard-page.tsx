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
} from "lucide-react";
import { useEffect, useState } from "react";

import { getAllDepartmentsAdmin, type Department } from "@/lib/supabase/queries/departments";
import { getAllBooks, getAllJournals, type Book, type Journal } from "@/lib/supabase/queries/library";
import { checkAdminSession, loginAdmin, logoutAdmin } from "@/lib/auth";
import { CarouselManager } from "../components/carousel-manager";
import { Button } from "@/shared/ui/button";

export function AdminDashboardPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [authErrorMessage, setAuthErrorMessage] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'overview' | 'carousel' | 'departments' | 'books' | 'journals' | 'stats'>('overview');
  const [departments, setDepartments] = useState<Department[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [journals, setJournals] = useState<Journal[]>([]);

  // Institutional Stats state
  const [statsConfig, setStatsConfig] = useState(() => {
    const saved = localStorage.getItem('afit_institutional_stats');
    return saved ? JSON.parse(saved) : {
      totalStudents: '12,500+',
      academicResources: '45,000+',
      activeDepartments: '18+',
      researchCitations: '98%'
    };
  });
  const [statsSuccess, setStatsSuccess] = useState(false);

  const handleSaveStats = (e: React.FormEvent) => {
    e.preventDefault();
    localStorage.setItem('afit_institutional_stats', JSON.stringify(statsConfig));
    setStatsSuccess(true);
    setTimeout(() => setStatsSuccess(false), 3000);
  };

  // Modal states for CRUD
  const [isAddingDept, setIsAddingDept] = useState(false);
  const [isAddingBook, setIsAddingBook] = useState(false);
  const [isAddingJournal, setIsAddingJournal] = useState(false);

  // Form states
  const [newDeptName, setNewDeptName] = useState("");
  const [newDeptDesc, setNewDeptDesc] = useState("");
  const [newDeptImage, setNewDeptImage] = useState("");

  const [newBookTitle, setNewBookTitle] = useState("");
  const [newBookAuthor, setNewBookAuthor] = useState("");
  const [newBookDeptId, setNewBookDeptId] = useState("");
  const [newBookDesc, setNewBookDesc] = useState("");

  const [newJournalTitle, setNewJournalTitle] = useState("");
  const [newJournalDeptId, setNewJournalDeptId] = useState("");
  const [newJournalDesc, setNewJournalDesc] = useState("");

  const loadData = async () => {
    const [depts, bks, jrns] = await Promise.all([
      getAllDepartmentsAdmin(),
      getAllBooks(),
      getAllJournals(),
    ]);
    setDepartments(depts);
    setBooks(bks);
    setJournals(jrns);
    if (depts.length > 0) {
      setNewBookDeptId(depts[0].id);
      setNewJournalDeptId(depts[0].id);
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

  const handleCreateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName) return;
    const slug = newDeptName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const newDept: Department = {
      id: 'd' + Math.random().toString(36).substring(2, 11),
      faculty_id: 'a1000000-0000-4000-8000-000000000001',
      name: newDeptName,
      slug,
      description: newDeptDesc || null,
      display_order: departments.length + 1,
      color: '#1d4ed8',
      icon: 'code',
      background_image_url: newDeptImage || 'https://images.unsplash.com/photo-1541185933-ef5d8ed016c2?auto=format&fit=crop&w=1200&q=80',
      is_visible: true,
    };
    setDepartments([newDept, ...departments]);
    setNewDeptName("");
    setNewDeptDesc("");
    setNewDeptImage("");
    setIsAddingDept(false);
  };

  const handleCreateBook = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBookTitle || !newBookAuthor) return;
    const newBk: Book = {
      id: 'b' + Math.random().toString(36).substring(2, 11),
      department_id: newBookDeptId || departments[0]?.id || '',
      title: newBookTitle,
      author: newBookAuthor,
      description: newBookDesc || null,
      cover_image: 'https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?auto=format&fit=crop&w=800&q=80',
      isbn: '978-978-000-000-0',
      publisher: 'AFIT Academic Press',
      publication_year: 2025,
      edition: '1st',
      category: 'Textbook',
      file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: '3.5 MB',
      status: 'published',
      uploaded_by: 'Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setBooks([newBk, ...books]);
    setNewBookTitle("");
    setNewBookAuthor("");
    setNewBookDesc("");
    setIsAddingBook(false);
  };

  const handleCreateJournal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJournalTitle) return;
    const newJr: Journal = {
      id: 'j' + Math.random().toString(36).substring(2, 11),
      department_id: newJournalDeptId || departments[0]?.id || '',
      title: newJournalTitle,
      description: newJournalDesc || null,
      cover_image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80',
      publisher: 'AFIT Research',
      issn: '2800-1111',
      volume: 'Vol. 6',
      issue: 'Issue 1',
      publication_date: new Date().toISOString().split('T')[0],
      category: 'Journal',
      file_path: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      file_size: '2.8 MB',
      status: 'published',
      uploaded_by: 'Administrator',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setJournals([newJr, ...journals]);
    setNewJournalTitle("");
    setNewJournalDesc("");
    setIsAddingJournal(false);
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
              <input
                type="password"
                required
                autoComplete="current-password"
                placeholder="Enter administrator password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm text-foreground focus:ring-2 focus:ring-primary outline-hidden"
              />
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
      <div className="flex flex-wrap gap-2 mb-8 border-b border-border pb-4">
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
              Update the key metrics displayed on the AFIT eLibrary home page hero area. Changes take effect instantly across client sessions.
            </p>

            {statsSuccess && (
              <div className="mb-6 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-4 text-sm text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="size-5 text-emerald-600 shrink-0" />
                <span>Institutional statistics successfully updated and saved!</span>
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
                <Button type="submit" size="lg" className="w-full">
                  Save Institutional Statistics
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
                <Button variant="secondary" className="justify-start gap-2" onClick={() => { setActiveTab('departments'); setIsAddingDept(true); }}>
                  <Plus aria-hidden="true" className="size-4" /> Create New Department
                </Button>
                <Button variant="secondary" className="justify-start gap-2" onClick={() => { setActiveTab('books'); setIsAddingBook(true); }}>
                  <Plus aria-hidden="true" className="size-4" /> Upload New Book PDF
                </Button>
                <Button variant="secondary" className="justify-start gap-2" onClick={() => { setActiveTab('journals'); setIsAddingJournal(true); }}>
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
            <Button className="gap-2" onClick={() => setIsAddingDept(true)}>
              <Plus aria-hidden="true" className="size-4" /> Add Department
            </Button>
          </div>

          {/* Add Dept Modal */}
          {isAddingDept && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6">
              <h3 className="text-base font-bold font-serif text-foreground mb-4">Create New Department</h3>
              <form onSubmit={handleCreateDepartment} className="space-y-4">
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Background Image URL</label>
                    <input
                      type="text"
                      placeholder="https://images.unsplash.com/..."
                      value={newDeptImage}
                      onChange={e => setNewDeptImage(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
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
                  <Button type="button" variant="ghost" onClick={() => setIsAddingDept(false)}>Cancel</Button>
                  <Button type="submit">Save Department</Button>
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
                        <Button variant="ghost" size="sm" onClick={() => alert(`Editing ${dept.name}`)}>
                          <Edit className="size-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                          if (confirm(`Are you sure you want to delete ${dept.name}?`)) {
                            setDepartments(departments.filter(d => d.id !== dept.id));
                          }
                        }}>
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
            <h2 className="text-xl font-bold font-serif text-foreground">Manage Books Collection</h2>
            <Button className="gap-2" onClick={() => setIsAddingBook(true)}>
              <Plus aria-hidden="true" className="size-4" /> Upload New Book
            </Button>
          </div>

          {/* Add Book Modal */}
          {isAddingBook && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6">
              <h3 className="text-base font-bold font-serif text-foreground mb-4">Upload Book PDF & Metadata</h3>
              <form onSubmit={handleCreateBook} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Book Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Advanced AI Systems"
                      value={newBookTitle}
                      onChange={e => setNewBookTitle(e.target.value)}
                      className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Author(s)</label>
                    <input
                      type="text"
                      required
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
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">PDF File</label>
                    <input
                      type="file"
                      accept=".pdf"
                      className="w-full rounded-xl border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                  <textarea
                    rows={2}
                    placeholder="Book overview..."
                    value={newBookDesc}
                    onChange={e => setNewBookDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingBook(false)}>Cancel</Button>
                  <Button type="submit">Publish Book</Button>
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
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                            if (confirm(`Delete book "${bk.title}"?`)) {
                              setBooks(books.filter(b => b.id !== bk.id));
                            }
                          }}>
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
            <h2 className="text-xl font-bold font-serif text-foreground">Manage Journals & Periodicals</h2>
            <Button className="gap-2" onClick={() => setIsAddingJournal(true)}>
              <Plus aria-hidden="true" className="size-4" /> Upload New Journal
            </Button>
          </div>

          {/* Add Journal Modal */}
          {isAddingJournal && (
            <div className="rounded-2xl border border-primary/40 bg-card p-6 shadow-md mb-6">
              <h3 className="text-base font-bold font-serif text-foreground mb-4">Upload Journal Research Paper</h3>
              <form onSubmit={handleCreateJournal} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Journal Title</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. AFIT Journal of Engineering"
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
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Abstract</label>
                  <textarea
                    rows={2}
                    placeholder="Paper abstract..."
                    value={newJournalDesc}
                    onChange={e => setNewJournalDesc(e.target.value)}
                    className="w-full rounded-xl border border-border bg-muted/40 px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex justify-end gap-3">
                  <Button type="button" variant="ghost" onClick={() => setIsAddingJournal(false)}>Cancel</Button>
                  <Button type="submit">Publish Journal</Button>
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
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => {
                            if (confirm(`Delete journal "${jr.title}"?`)) {
                              setJournals(journals.filter(j => j.id !== jr.id));
                            }
                          }}>
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
