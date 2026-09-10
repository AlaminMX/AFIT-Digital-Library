import { ArrowRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAcademicStructureCounts, type AcademicStructureCounts } from "@/lib/supabase/queries/departments";

export function HomePage() {
  const [counts, setCounts] = useState<AcademicStructureCounts | null>(null);
  const [hasCountError, setHasCountError] = useState(false);

  useEffect(() => {
    getAcademicStructureCounts()
      .then(setCounts)
      .catch(() => setHasCountError(true));
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">AFIT Digital Library</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Knowledge for every mission.</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
          Find research, publications, and learning resources from the Air Force Institute of Technology.
        </p>
      </div>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90" to="/departments">
          Browse departments <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <span className="inline-flex h-11 items-center gap-2 rounded-md border border-border px-4 text-sm text-muted-foreground">
          <Search aria-hidden="true" className="size-4" /> Search is coming soon
        </span>
      </div>
      <LibraryStatistics counts={counts} hasError={hasCountError} />
    </section>
  );
}

function LibraryStatistics({ counts, hasError }: { counts: AcademicStructureCounts | null; hasError: boolean }) {
  if (hasError) {
    return <p className="mt-10 text-sm text-muted-foreground">Library statistics are currently unavailable.</p>;
  }

  if (!counts) {
    return <div aria-label="Loading library statistics" className="mt-10 h-20 w-72 animate-pulse rounded-lg bg-muted" />;
  }

  return (
    <dl className="mt-10 grid max-w-md grid-cols-2 divide-x divide-border rounded-lg border border-border bg-muted/40">
      <div className="p-4">
        <dt className="text-sm text-muted-foreground">Faculties</dt>
        <dd className="mt-1 text-2xl font-semibold">{counts.faculties}</dd>
      </div>
      <div className="p-4">
        <dt className="text-sm text-muted-foreground">Departments</dt>
        <dd className="mt-1 text-2xl font-semibold">{counts.departments}</dd>
      </div>
    </dl>
  );
}
