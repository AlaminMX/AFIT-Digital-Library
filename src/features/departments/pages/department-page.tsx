import {
  ArrowLeft,
  BookOpen,
  Bookmark,
  Share2,
  Library,
  Newspaper,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDepartmentBySlug, type Department } from "@/lib/supabase/queries/departments";
import { getBooksByDepartment, getJournalsByDepartment } from "@/lib/supabase/queries/library";
import { Button, buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function DepartmentPage() {
  const { slug = "" } = useParams();
  const [department, setDepartment] = useState<Department | null | undefined>(undefined);
  const [bookCount, setBookCount] = useState<number>(0);
  const [journalCount, setJournalCount] = useState<number>(0);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setDepartment(undefined);
    setHasError(false);
    getDepartmentBySlug(slug)
      .then(async (dept) => {
        setDepartment(dept);
        if (dept) {
          const [books, journals] = await Promise.all([
            getBooksByDepartment(dept.id),
            getJournalsByDepartment(dept.id),
          ]);
          setBookCount(books.length);
          setJournalCount(journals.length);
        }
      })
      .catch(() => setHasError(true));
  }, [slug]);

  if (department === undefined && !hasError) {
    return (
      <section aria-label="Loading department" className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
        <div className="h-12 w-32 animate-pulse rounded-lg bg-muted mb-8" />
        <div className="h-64 animate-pulse rounded-xl bg-muted border border-border" />
      </section>
    );
  }

  if (hasError) return <DepartmentMessage title="We couldn’t load this department." text="Check your connection and try again from the department directory." />;
  if (!department) return <DepartmentMessage title="Department not found." text="This department collection is unavailable or no longer published." />;

  return (
    <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-8">
        <Link to="/departments" className={cn(buttonVariants({ variant: "outline", size: "sm" }), "gap-2")}>
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to departments
        </Link>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm mb-12">
        {department.background_image_url && (
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-15"
            style={{ backgroundImage: `url(${department.background_image_url})` }}
          />
        )}
        <div className="relative z-10 p-6 sm:p-10 border-b border-border/80 bg-gradient-to-r from-primary/10 via-transparent to-transparent">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                Department Library Hub
              </span>
              <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-foreground font-serif sm:text-4xl">{department.name}</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => alert("Bookmark feature coming soon")}>
                <Bookmark aria-hidden="true" className="size-3.5" /> Save
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-xs" onClick={() => alert("Link copied to clipboard")}>
                <Share2 aria-hidden="true" className="size-3.5" /> Share
              </Button>
            </div>
          </div>

          <p className="mt-4 text-base leading-relaxed text-muted-foreground max-w-3xl font-sans">
            {department.description || "Official research repository, textbooks, monographs, and academic journals assigned to this department."}
          </p>
        </div>
      </div>

      {/* Primary Resource Tiles: BOOKS & JOURNALS */}
      <div className="mb-6">
        <h2 className="text-xl font-bold font-serif text-foreground tracking-tight">Select Resource Category</h2>
        <p className="text-sm text-muted-foreground">Choose a collection to browse authorized peer-reviewed holdings.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* BOOKS TILE */}
        <Link
          to={`/departments/${department.slug}/books`}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary hover:shadow-xl min-h-[260px]"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Library aria-hidden="true" className="size-7" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-md">
              {bookCount} {bookCount === 1 ? 'Book' : 'Books'}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold font-serif text-foreground group-hover:text-primary transition-colors">
              Books Collection
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Explore textbooks, course monographs, reference guides, and research books assigned directly to {department.name}.
            </p>
          </div>
        </Link>

        {/* JOURNALS TILE */}
        <Link
          to={`/departments/${department.slug}/journals`}
          className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary hover:shadow-xl min-h-[260px]"
        >
          <div className="flex items-center justify-between">
            <span className="inline-flex size-14 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Newspaper aria-hidden="true" className="size-7" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground bg-muted px-3 py-1 rounded-md">
              {journalCount} {journalCount === 1 ? 'Journal' : 'Journals'}
            </span>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold font-serif text-foreground group-hover:text-primary transition-colors">
              Journals & Periodicals
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Access peer-reviewed academic papers, research bulletins, and conference proceedings published by faculty and researchers.
            </p>
          </div>
        </Link>
      </div>
    </section>
  );
}

function DepartmentMessage({ text, title }: { text: string; title: string }) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <BookOpen aria-hidden="true" className="size-6" />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Department Archive</p>
      <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground font-serif">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">{text}</p>
      <div className="mt-8">
        <Link to="/departments" className={cn(buttonVariants(), "gap-2")}>
          <ArrowLeft aria-hidden="true" className="size-4" /> Back to departments
        </Link>
      </div>
    </section>
  );
}
