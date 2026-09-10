import {
  ArrowRight,
  RotateCw,
  BookOpen,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getDepartments, type Department } from "@/lib/supabase/queries/departments";
import { Button } from "@/shared/ui/button";

const DEFAULT_ACCENT = "#1d4ed8";

export function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [hasError, setHasError] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadDepartments = () => {
    setDepartments(null);
    setHasError(false);
    getDepartments()
      .then(setDepartments)
      .catch(() => setHasError(true));
  };

  useEffect(() => {
    loadDepartments();
  }, []);

  const filteredDepartments = departments
    ? departments.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()) || (d.description && d.description.toLowerCase().includes(searchQuery.toLowerCase())))
    : null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="text-xs font-bold uppercase tracking-wider text-primary mb-2">Academic Repository</p>
          <h1 className="text-4xl font-extrabold tracking-tight text-primary font-serif sm:text-5xl">Departments</h1>
          <p className="mt-3 text-lg leading-relaxed text-muted-foreground">
            Select an institutional department to browse authorized books, research journals, and technical publications.
          </p>
        </div>
        <div className="w-full md:w-80">
          <div className="relative">
            <Search aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search departments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-border bg-card pl-10 pr-4.5 py-3 text-sm text-foreground shadow-2xs focus:outline-hidden focus:ring-2 focus:ring-primary font-sans"
            />
          </div>
        </div>
      </div>

      {hasError ? (
        <DirectoryError onRetry={loadDepartments} />
      ) : !filteredDepartments ? (
        <DirectorySkeleton />
      ) : filteredDepartments.length === 0 ? (
        <EmptyDirectory query={searchQuery} />
      ) : (
        <div className="grid gap-6 sm:grid-cols-2">
          {filteredDepartments.map((department, index) => {
            // Editorial variation: subtle height/proportion offset on alternating cards
            const isTaller = index % 3 === 0;
            return (
              <DepartmentCard
                key={department.id}
                department={department}
                className={isTaller ? "min-h-[380px] sm:min-h-[420px]" : "min-h-[320px] sm:min-h-[360px]"}
              />
            );
          })}
        </div>
      )}
    </section>
  );
}

function DepartmentCard({ department, className }: { department: Department; className?: string }) {
  const accent = department.color || DEFAULT_ACCENT;

  return (
    <Link
      className={`group relative flex flex-col justify-end overflow-hidden rounded-2xl border border-border bg-card p-8 shadow-sm transition-all hover:border-primary/60 hover:shadow-xl ${className || "min-h-[340px]"}`}
      style={{ "--accent": accent } as React.CSSProperties}
      to={`/departments/${department.slug}`}
    >
      {department.background_image_url && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url(${department.background_image_url})` }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/60 to-black/30" />
        </>
      )}

      <div className="relative z-10">
        <span className="inline-block text-xs font-bold uppercase tracking-wider text-white/90 bg-black/50 backdrop-blur-md px-3 py-1 rounded-md border border-white/20 mb-3">
          Department Library
        </span>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white font-serif group-hover:text-gold transition-colors leading-tight">
          {department.name}
        </h2>
        {department.description && (
          <p className="mt-2.5 text-sm sm:text-base leading-relaxed text-white/85 line-clamp-2 max-w-xl font-sans">
            {department.description}
          </p>
        )}
        
        <div className="mt-6 pt-4 border-t border-white/20 flex items-center justify-between text-sm font-semibold text-white group-hover:text-gold transition-colors">
          <span>Explore department repository</span>
          <ArrowRight aria-hidden="true" className="size-5 transition-transform group-hover:translate-x-1.5" />
        </div>
      </div>
    </Link>
  );
}

function DirectorySkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      {Array.from({ length: 6 }, (_, index) => (
        <div className="h-80 animate-pulse rounded-2xl bg-muted border border-border" key={index} />
      ))}
    </div>
  );
}

function DirectoryError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mt-12 rounded-2xl border border-border bg-card p-10 text-center max-w-lg mx-auto shadow-sm" role="alert">
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-4">
        <RotateCw aria-hidden="true" className="size-7" />
      </div>
      <h2 className="text-xl font-bold font-serif text-foreground">We couldn’t load the departments.</h2>
      <p className="mt-2 text-base text-muted-foreground">Check your connection or credentials, then try again.</p>
      <Button className="mt-6 gap-2 text-base px-6 py-3" onClick={onRetry} type="button">
        <RotateCw aria-hidden="true" className="size-4" /> Try again
      </Button>
    </div>
  );
}

function EmptyDirectory({ query }: { query: string }) {
  return (
    <div className="mt-12 rounded-2xl border border-border bg-card p-12 text-center max-w-lg mx-auto">
      <BookOpen aria-hidden="true" className="size-10 text-primary mx-auto mb-4" />
      <h2 className="text-xl font-bold text-foreground font-serif">No departments match your search.</h2>
      <p className="mt-2 text-base text-muted-foreground">No departments were found matching "{query}". Try searching with a different keyword.</p>
    </div>
  );
}
