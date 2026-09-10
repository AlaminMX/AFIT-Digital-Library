import {
  ArrowLeft,
  BookOpen,
  Search,
  FileText,
  Download,
  Calendar,
  User,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDepartmentBySlug, type Department } from "@/lib/supabase/queries/departments";
import { getBooksByDepartment, type Book } from "@/lib/supabase/queries/library";
import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function DepartmentBooksPage() {
  const { slug = "" } = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [books, setBooks] = useState<Book[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
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
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading department books...</p>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-8">
        <Link to={`/departments/${department.slug}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to {department.name} Hub
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
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted border border-border" />
          ))}
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
              <div key={book.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
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

                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => toggleSaveOffline(book)}
                    className={cn("gap-1.5 text-xs", isSaved && "bg-primary/10 text-primary border-primary")}
                  >
                    <Download aria-hidden="true" className="size-3.5" />
                    {isSaved ? "Saved Offline" : "Save Offline"}
                  </Button>
                  <Button size="sm" className="gap-1.5" onClick={() => setSelectedBook(book)}>
                    <FileText aria-hidden="true" className="size-4" /> View PDF
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* PDF / Book Preview Modal */}
      {selectedBook && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Document Reader</span>
                <h2 className="text-lg font-bold font-serif text-foreground truncate max-w-2xl">{selectedBook.title}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedBook(null)}>Close</Button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  {selectedBook.cover_image && (
                    <img src={selectedBook.cover_image} alt="" className="w-full rounded-xl object-cover shadow-sm h-60" />
                  )}
                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm">
                    <p><strong className="text-foreground">Author:</strong> {selectedBook.author}</p>
                    <p><strong className="text-foreground">Publisher:</strong> {selectedBook.publisher || 'AFIT Press'}</p>
                    <p><strong className="text-foreground">Year:</strong> {selectedBook.publication_year || 'N/A'}</p>
                    <p><strong className="text-foreground">ISBN:</strong> {selectedBook.isbn || 'N/A'}</p>
                    <p><strong className="text-foreground">Edition:</strong> {selectedBook.edition || '1st'}</p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Description</h3>
                    <p className="text-sm text-foreground leading-relaxed">{selectedBook.description || 'No description provided.'}</p>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
                    <h3 className="text-base font-bold font-serif text-primary">PDF Document Preview</h3>
                    <p className="text-sm text-muted-foreground">
                      The document has been securely loaded from the institutional repository storage. You can view pages directly or download the file for offline study.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={selectedBook.file_path || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants(), "gap-2")}
                      >
                        <ExternalLink aria-hidden="true" className="size-4" /> Open Full PDF in New Tab
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => toggleSaveOffline(selectedBook)}
                        className="gap-2"
                      >
                        <Download aria-hidden="true" className="size-4" />
                        {savedIds.includes(selectedBook.id) ? "Remove from Offline" : "Save for Offline Viewing"}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
