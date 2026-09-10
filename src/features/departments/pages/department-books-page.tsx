import {
  ArrowLeft,
  BookOpen,
  Search,
  FileText,
  Download,
  Calendar,
  User,
  FileCode,
  Eye,
  Bookmark,
  X,
  Maximize2,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDepartmentBySlug, type Department } from "@/lib/supabase/queries/departments";
import { getBooksByDepartment, type Book } from "@/lib/supabase/queries/library";
import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";
import { AcademicLoader } from "@/shared/components/academic-loader";

export function DepartmentBooksPage() {
  const { slug = "" } = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [previewTab, setPreviewTab] = useState<"both" | "preview" | "metadata">("both");
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    getDepartmentBySlug(slug).then(async (dept) => {
      setDepartment(dept);
      if (dept) {
        const bks = await getBooksByDepartment(dept.id);
        setBooks(bks);
      }
    });

    const offline = localStorage.getItem("afit_offline_resources");
    if (offline) {
      try {
        const parsed = JSON.parse(offline);
        setSavedIds(parsed.map((p: { id: string }) => p.id));
      } catch (e) {
        console.error(e);
      }
    }
  }, [slug]);

  const toggleSaveOffline = (book: Book) => {
    const offline = JSON.parse(localStorage.getItem("afit_offline_resources") || "[]");
    const exists = offline.some((o: { id: string }) => o.id === book.id);
    let updated;
    if (exists) {
      updated = offline.filter((o: { id: string }) => o.id !== book.id);
    } else {
      updated = [...offline, { ...book, saved_at: new Date().toISOString() }];
    }
    localStorage.setItem("afit_offline_resources", JSON.stringify(updated));
    setSavedIds(updated.map((o: { id: string }) => o.id));
  };

  const filteredBooks = books
    ? books.filter(b => b.title.toLowerCase().includes(searchQuery.toLowerCase()) || b.author.toLowerCase().includes(searchQuery.toLowerCase()) || (b.category && b.category.toLowerCase().includes(searchQuery.toLowerCase())))
    : null;

  if (!department) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-24 text-center">
        <AcademicLoader
          title="Loading Department Books"
          subtitle="Retrieving catalog, digital textbooks, and monographs..."
        />
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Link to="/" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2 text-xs font-semibold shadow-2xs")}>
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to Home
        </Link>
        <Link to={`/departments/${department.slug}`} className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "gap-1 text-xs text-muted-foreground hover:text-foreground")}>
          {department.name} Hub
        </Link>
      </div>

      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md">
            {department.name} Library
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground font-serif sm:text-4xl">Books Collection</h1>
          <p className="mt-2 text-base text-muted-foreground">Authorized textbooks, reference monographs, and study manuals.</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search books by title, author..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4.5 py-3 text-sm text-foreground shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-primary font-sans"
            />
          </div>
        </div>
      </div>

      {!filteredBooks ? (
        <div className="py-16">
          <AcademicLoader
            title="Searching Department Catalog"
            subtitle="Formatting textbook monographs and repository items..."
          />
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center max-w-lg mx-auto">
          <BookOpen aria-hidden="true" className="size-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground font-serif">No books have been added to this department yet.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Check back later or contact the institutional librarian for updates.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBooks.map((book) => {
            const isSaved = savedIds.includes(book.id);
            return (
              <div key={book.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:border-sky-400 hover:shadow-xl hover:shadow-sky-500/10 transition-all">
                <div>
                  {book.cover_image && (
                    <div className="mb-4 h-48 w-full overflow-hidden rounded-xl bg-muted">
                      <img src={book.cover_image} alt="" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded">
                      {book.category || 'Textbook'}
                    </span>
                    {book.publication_year && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar aria-hidden="true" className="size-3.5" /> {book.publication_year}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl font-bold font-serif text-foreground line-clamp-2">{book.title}</h2>
                  <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1.5 font-medium">
                    <User aria-hidden="true" className="size-3.5" /> {book.author}
                  </p>
                  {book.description && (
                    <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                      {book.description}
                    </p>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <a
                      href={`/api/documents/download?type=book&id=${book.id}&format=pdf`}
                      download
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2.5 text-xs gap-1 hover:border-red-500/50 hover:bg-red-500/10")}
                      title="Download PDF Document"
                    >
                      <Download aria-hidden="true" className="size-3 text-red-600" /> PDF
                    </a>
                    <a
                      href={`/api/documents/download?type=book&id=${book.id}&format=docx`}
                      download
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2.5 text-xs gap-1 hover:border-blue-500/50 hover:bg-blue-500/10")}
                      title="Download Word (.DOCX) Document"
                    >
                      <Download aria-hidden="true" className="size-3 text-blue-600" /> DOCX
                    </a>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toggleSaveOffline(book)}
                      className={cn("h-8 px-2 text-xs gap-1", isSaved && "text-primary font-semibold")}
                      title={isSaved ? "Saved Offline" : "Save Offline"}
                    >
                      <Bookmark aria-hidden="true" className="size-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      className="h-8 px-3 text-xs font-semibold gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs cursor-pointer"
                      onClick={() => {
                        setSelectedBook(book);
                        setPreviewTab("both");
                      }}
                      title="Quick View & PDF Preview"
                    >
                      <Eye aria-hidden="true" className="size-3.5" /> Quick View
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* QUICK VIEW & PDF PREVIEW MODAL */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-3 sm:p-6 overflow-hidden">
          <div className="relative w-full max-w-5xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3.5 bg-muted/40">
              <div className="min-w-0 pr-4">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 text-2xs font-bold uppercase tracking-wider text-sky-600 bg-sky-500/10 px-2 py-0.5 rounded">
                    <Eye aria-hidden="true" className="size-3" /> Quick View
                  </span>
                  <span className="text-2xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2 py-0.5 rounded">
                    {selectedBook.category || 'Book'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold font-serif text-foreground truncate mt-0.5">
                  {selectedBook.title}
                </h2>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {/* View Mode Controls */}
                <div className="hidden sm:inline-flex items-center rounded-lg border border-border bg-background p-0.5 text-2xs">
                  <button
                    type="button"
                    onClick={() => setPreviewTab("both")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                      previewTab === "both" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Split View
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("preview")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                      previewTab === "preview" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    PDF Only
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewTab("metadata")}
                    className={cn(
                      "px-2.5 py-1 rounded-md font-medium transition-colors cursor-pointer",
                      previewTab === "metadata" ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Metadata
                  </button>
                </div>

                <a
                  href={`/api/documents/download?type=book&id=${selectedBook.id}&format=pdf&inline=true`}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(buttonVariants({ variant: "outline", size: "sm" }), "h-8 px-2.5 text-xs gap-1")}
                  title="Open PDF in new tab"
                >
                  <Maximize2 aria-hidden="true" className="size-3.5" />
                  <span className="hidden sm:inline">New Tab</span>
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedBook(null)}
                  className="h-8 w-8 p-0 rounded-lg cursor-pointer"
                  title="Close Quick View"
                >
                  <X aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6">
              <div className={cn(
                "gap-6",
                previewTab === "both" ? "grid lg:grid-cols-12" : "block"
              )}>
                {/* METADATA COLUMN */}
                {(previewTab === "both" || previewTab === "metadata") && (
                  <div className={cn("space-y-4", previewTab === "both" ? "lg:col-span-5" : "max-w-2xl mx-auto")}>
                    <div className="rounded-xl border border-border bg-muted/20 p-4 space-y-3">
                      {selectedBook.cover_image && (
                        <div className="h-44 w-full overflow-hidden rounded-lg bg-muted shadow-2xs mb-3">
                          <img src={selectedBook.cover_image} alt="" className="h-full w-full object-cover" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Document Metadata</h3>
                        <dl className="mt-2.5 grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                          <div>
                            <dt className="text-muted-foreground font-medium">Author</dt>
                            <dd className="font-semibold text-foreground truncate">{selectedBook.author}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground font-medium">Publisher</dt>
                            <dd className="font-semibold text-foreground truncate">{selectedBook.publisher || 'AFIT Press'}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground font-medium">Publication Year</dt>
                            <dd className="font-semibold text-foreground">{selectedBook.publication_year || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground font-medium">ISBN</dt>
                            <dd className="font-semibold text-foreground">{selectedBook.isbn || 'N/A'}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground font-medium">Edition</dt>
                            <dd className="font-semibold text-foreground">{selectedBook.edition || '1st Edition'}</dd>
                          </div>
                          <div>
                            <dt className="text-muted-foreground font-medium">Access Status</dt>
                            <dd className="font-semibold text-emerald-600">Institutional Access</dd>
                          </div>
                        </dl>
                      </div>

                      {selectedBook.description && (
                        <div className="pt-3 border-t border-border">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Abstract & Summary</h4>
                          <p className="text-xs leading-relaxed text-foreground max-h-36 overflow-y-auto">
                            {selectedBook.description}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Download & Offline Actions */}
                    <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-primary">Download File Formats</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <a
                          href={`/api/documents/download?type=book&id=${selectedBook.id}&format=pdf`}
                          download
                          className={cn(buttonVariants({ variant: "default", size: "sm" }), "justify-center gap-1.5 h-9 text-xs font-semibold shadow-xs")}
                        >
                          <FileText aria-hidden="true" className="size-3.5" />
                          <span>PDF Format</span>
                        </a>
                        <a
                          href={`/api/documents/download?type=book&id=${selectedBook.id}&format=docx`}
                          download
                          className={cn(buttonVariants({ variant: "secondary", size: "sm" }), "justify-center gap-1.5 h-9 text-xs font-semibold border border-border hover:border-blue-500/50 hover:bg-blue-500/10")}
                        >
                          <FileCode aria-hidden="true" className="size-3.5 text-blue-600" />
                          <span>Word (.DOCX)</span>
                        </a>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleSaveOffline(selectedBook)}
                        className="w-full gap-1.5 text-xs h-8 cursor-pointer"
                      >
                        <Bookmark aria-hidden="true" className="size-3.5 text-primary" />
                        <span>{savedIds.includes(selectedBook.id) ? "Saved to Offline Library" : "Save for Offline Access"}</span>
                      </Button>
                    </div>
                  </div>
                )}

                {/* PDF PREVIEW COLUMN */}
                {(previewTab === "both" || previewTab === "preview") && (
                  <div className={cn("flex flex-col", previewTab === "both" ? "lg:col-span-7" : "w-full")}>
                    <div className="flex items-center justify-between mb-2 text-xs font-medium text-muted-foreground">
                      <span className="flex items-center gap-1.5 text-foreground font-semibold">
                        <FileText aria-hidden="true" className="size-3.5 text-red-500" />
                        Direct Document Preview (PDF)
                      </span>
                      <span className="text-2xs text-muted-foreground">Embedded Reader</span>
                    </div>

                    <div className="relative rounded-xl border border-border overflow-hidden bg-muted/40 shadow-inner flex-1 min-h-[460px] sm:min-h-[560px]">
                      <iframe
                        src={`/api/documents/download?type=book&id=${selectedBook.id}&format=pdf&inline=true#toolbar=1&navpanes=0`}
                        title={`${selectedBook.title} PDF Document Preview`}
                        className="w-full h-full min-h-[460px] sm:min-h-[560px] border-0 bg-card"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
