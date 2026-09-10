import { useState, useEffect } from "react";
import { Download, Trash2, FileText, BookOpen, WifiOff, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/shared/ui/button";

interface OfflineResource {
  id: string;
  title: string;
  author?: string;
  publisher?: string;
  category?: string;
  description?: string | null;
  file_path: string;
  file_size?: string;
  saved_at: string;
}

export function OfflinePage() {
  const [offlineResources, setOfflineResources] = useState<OfflineResource[]>([]);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("afit_offline_resources");
    if (stored) {
      try {
        setOfflineResources(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse offline resources", e);
      }
    }
  }, []);

  const handleRemove = (id: string) => {
    const updated = offlineResources.filter(item => item.id !== id);
    setOfflineResources(updated);
    localStorage.setItem("afit_offline_resources", JSON.stringify(updated));
  };

  const handleClearAll = () => {
    if (confirm("Are you sure you want to remove all saved offline resources?")) {
      setOfflineResources([]);
      localStorage.removeItem("afit_offline_resources");
    }
  };

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-6 border-b border-border">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md mb-3">
            <WifiOff aria-hidden="true" className="size-3.5" /> PWA Offline Storage
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground font-serif sm:text-4xl">
            Saved Offline Library
          </h1>
          <p className="mt-2 text-base text-muted-foreground">
            Access your bookmarked textbooks, research publications, and journal articles even when disconnected from the internet.
          </p>
        </div>
        {offlineResources.length > 0 && (
          <Button variant="outline" onClick={handleClearAll} className="gap-2 text-destructive hover:bg-destructive/10">
            <Trash2 aria-hidden="true" className="size-4" /> Clear All Offline Files
          </Button>
        )}
      </div>

      {offlineResources.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-16 text-center max-w-xl mx-auto shadow-xs">
          <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary mb-6">
            <Download aria-hidden="true" className="size-8" />
          </div>
          <h2 className="text-2xl font-bold font-serif text-foreground">No Offline Resources Saved</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            You haven't saved any library resources for offline viewing yet. When browsing department books or journals, click the <span className="font-semibold text-primary">"Save Offline"</span> button to keep them available without internet access.
          </p>
          <div className="mt-8">
            <Link to="/departments">
              <Button size="lg" className="gap-2">
                Browse Departments & Resources
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {offlineResources.map((item) => (
            <div key={item.id} className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow">
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-md">
                    {item.category || "Offline Resource"}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <FileText aria-hidden="true" className="size-3.5 text-primary" /> {item.file_size || "PDF"}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-foreground line-clamp-2 mb-1">{item.title}</h3>
                {item.author && <p className="text-xs text-muted-foreground mb-3">By {item.author}</p>}
                {item.publisher && <p className="text-xs text-muted-foreground mb-3">Published by {item.publisher}</p>}
                {item.description && <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{item.description}</p>}
              </div>

              <div className="pt-4 border-t border-border flex items-center justify-between gap-3">
                <Button
                  size="sm"
                  onClick={() => {
                    setActivePdfUrl(item.file_path);
                    setActiveTitle(item.title);
                  }}
                  className="gap-1.5 flex-1"
                >
                  <BookOpen aria-hidden="true" className="size-4" /> Read Offline
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleRemove(item.id)}
                  title="Remove from offline"
                  className="text-destructive hover:bg-destructive/10"
                >
                  <Trash2 aria-hidden="true" className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PDF Reader Modal */}
      {activePdfUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-4xl h-[85vh] bg-card rounded-2xl border border-border flex flex-col shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/40">
              <div className="flex items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <FileText aria-hidden="true" className="size-5" />
                </div>
                <div>
                  <h3 className="font-serif font-bold text-foreground text-base truncate max-w-xl">{activeTitle}</h3>
                  <p className="text-xs text-emerald-600 font-medium">Cached Offline Ready</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <a href={activePdfUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted transition-colors">
                  <ExternalLink aria-hidden="true" className="size-3.5" /> Open Direct
                </a>
                <Button variant="ghost" size="sm" onClick={() => { setActivePdfUrl(null); setActiveTitle(null); }}>
                  Close
                </Button>
              </div>
            </div>
            <div className="flex-1 bg-muted/20 relative">
              <iframe src={activePdfUrl} title={activeTitle || "PDF Document"} className="w-full h-full border-0" />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
