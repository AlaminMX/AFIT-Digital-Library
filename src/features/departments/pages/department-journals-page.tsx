import {
  ArrowLeft,
  Newspaper,
  Search,
  FileText,
  Download,
  Calendar,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDepartmentBySlug, type Department } from "@/lib/supabase/queries/departments";
import { getJournalsByDepartment, type Journal } from "@/lib/supabase/queries/library";
import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function DepartmentJournalsPage() {
  const { slug = "" } = useParams();
  const [department, setDepartment] = useState<Department | null>(null);
  const [journals, setJournals] = useState<Journal[] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJournal, setSelectedJournal] = useState<Journal | null>(null);
  const [savedIds, setSavedIds] = useState<string[]>([]);

  useEffect(() => {
    getDepartmentBySlug(slug).then(async (dept) => {
      setDepartment(dept);
      if (dept) {
        const jrns = await getJournalsByDepartment(dept.id);
        setJournals(jrns);
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

  const toggleSaveOffline = (journal: Journal) => {
    const offline = JSON.parse(localStorage.getItem("afit_offline_resources") || "[]");
    const exists = offline.some((o: { id: string }) => o.id === journal.id);
    let updated;
    if (exists) {
      updated = offline.filter((o: { id: string }) => o.id !== journal.id);
    } else {
      updated = [...offline, { ...journal, category: 'Journal', saved_at: new Date().toISOString() }];
    }
    localStorage.setItem("afit_offline_resources", JSON.stringify(updated));
    setSavedIds(updated.map((o: { id: string }) => o.id));
  };

  const filteredJournals = journals
    ? journals.filter(j => j.title.toLowerCase().includes(searchQuery.toLowerCase()) || (j.publisher && j.publisher.toLowerCase().includes(searchQuery.toLowerCase())))
    : null;

  if (!department) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center">
        <p className="text-muted-foreground">Loading department journals...</p>
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
            {department.name} Repository
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground font-serif sm:text-4xl">Journals & Periodicals</h1>
          <p className="mt-2 text-base text-muted-foreground">Peer-reviewed academic research, bulletins, and conference proceedings.</p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search journals by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4.5 py-3 text-sm text-foreground shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-primary font-sans"
            />
          </div>
        </div>
      </div>

      {!filteredJournals ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted border border-border" />
          ))}
        </div>
      ) : filteredJournals.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-12 text-center max-w-lg mx-auto">
          <Newspaper aria-hidden="true" className="size-10 text-primary mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground font-serif">No journals have been added to this department yet.</h2>
          <p className="mt-2 text-sm text-muted-foreground">Check back later for newly published scholarly research papers.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredJournals.map((journal) => (
            <div key={journal.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div>
                {journal.cover_image && (
                  <div className="mb-4 h-48 w-full overflow-hidden rounded-xl bg-muted">
                    <img src={journal.cover_image} alt="" className="h-full w-full object-cover" />
                  </div>
                )}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded">
                    {journal.volume || 'Vol. 1'} {journal.issue ? `• ${journal.issue}` : ''}
                  </span>
                  {journal.publication_date && (
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Calendar aria-hidden="true" className="size-3.5" /> {journal.publication_date}
                    </span>
                  )}
                </div>
                <h2 className="text-xl font-bold font-serif text-foreground line-clamp-2">{journal.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground font-medium">Publisher: {journal.publisher || 'AFIT Press'}</p>
                {journal.description && (
                  <p className="mt-3 text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {journal.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-border flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => toggleSaveOffline(journal)}
                  className={cn("gap-1.5 text-xs", savedIds.includes(journal.id) && "bg-primary/10 text-primary border-primary")}
                >
                  <Download aria-hidden="true" className="size-3.5" />
                  {savedIds.includes(journal.id) ? "Saved Offline" : "Save Offline"}
                </Button>
                <Button size="sm" className="gap-1.5" onClick={() => setSelectedJournal(journal)}>
                  <FileText aria-hidden="true" className="size-4" /> Read Journal
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Journal Preview Modal */}
      {selectedJournal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-4xl rounded-2xl bg-card border border-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Journal Research Paper</span>
                <h2 className="text-lg font-bold font-serif text-foreground truncate max-w-2xl">{selectedJournal.title}</h2>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setSelectedJournal(null)}>Close</Button>
            </div>

            <div className="flex-1 p-6 overflow-y-auto space-y-6">
              <div className="grid md:grid-cols-3 gap-6">
                <div className="space-y-4">
                  {selectedJournal.cover_image && (
                    <img src={selectedJournal.cover_image} alt="" className="w-full rounded-xl object-cover shadow-sm h-60" />
                  )}
                  <div className="rounded-xl border border-border bg-muted/40 p-4 space-y-2 text-sm">
                    <p><strong className="text-foreground">Publisher:</strong> {selectedJournal.publisher || 'AFIT Research'}</p>
                    <p><strong className="text-foreground">ISSN:</strong> {selectedJournal.issn || 'N/A'}</p>
                    <p><strong className="text-foreground">Volume:</strong> {selectedJournal.volume || 'N/A'}</p>
                    <p><strong className="text-foreground">Issue:</strong> {selectedJournal.issue || 'N/A'}</p>
                    <p><strong className="text-foreground">Date:</strong> {selectedJournal.publication_date || 'N/A'}</p>
                  </div>
                </div>

                <div className="md:col-span-2 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Abstract & Overview</h3>
                    <p className="text-sm text-foreground leading-relaxed">{selectedJournal.description || 'No abstract provided.'}</p>
                  </div>

                  <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 space-y-4">
                    <h3 className="text-base font-bold font-serif text-primary">Journal PDF Document</h3>
                    <p className="text-sm text-muted-foreground">
                      Access the full-text peer-reviewed paper in digital PDF format.
                    </p>
                    <div className="flex flex-wrap gap-3">
                      <a
                        href={selectedJournal.file_path || "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"}
                        target="_blank"
                        rel="noreferrer"
                        className={cn(buttonVariants(), "gap-2")}
                      >
                        <ExternalLink aria-hidden="true" className="size-4" /> Open Full PDF in New Tab
                      </a>
                      <Button
                        variant="outline"
                        onClick={() => toggleSaveOffline(selectedJournal)}
                        className="gap-2"
                      >
                        <Download aria-hidden="true" className="size-4" />
                        {savedIds.includes(selectedJournal.id) ? "Remove from Offline" : "Save for Offline Viewing"}
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
