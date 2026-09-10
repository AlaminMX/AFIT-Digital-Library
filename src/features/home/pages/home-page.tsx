import { ArrowRight, Building2, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { loadLandingPageAcademicStructureCounts, type AcademicStructureClient, type LandingPageAcademicStructureCounts } from "@/lib/supabase/academic-structure";
import { getSupabaseClient } from "@/lib/supabase/client";

export function HomePage() {
  const [counts, setCounts] = useState<LandingPageAcademicStructureCounts>();
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    let isCurrent = true;
    Promise.resolve()
      .then(() => loadLandingPageAcademicStructureCounts(getSupabaseClient() as unknown as AcademicStructureClient))
      .then((result) => isCurrent && setCounts(result))
      .catch(() => isCurrent && setHasError(true));
    return () => { isCurrent = false; };
  }, []);

  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="max-w-2xl">
        <p className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">Digital Library</p>
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Discover your next resource.</h1>
        <p className="mt-5 text-base leading-7 text-muted-foreground sm:text-lg">
          [PLACEHOLDER — replace with real AFIT content] Find approved research, publications, and learning resources.
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
      <section className="mt-12" aria-labelledby="directory-statistics">
        <h2 id="directory-statistics" className="sr-only">Directory statistics</h2>
        {hasError ? (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-foreground" role="alert">
            We couldn’t load the live directory totals. Please refresh to try again.
          </p>
        ) : !counts ? (
          <div className="grid max-w-lg grid-cols-2 gap-4" aria-label="Loading directory totals" aria-busy="true">
            {["faculties", "departments"].map((item) => <div className="h-28 animate-pulse rounded-xl bg-muted" key={item} />)}
          </div>
        ) : (
          <div className="grid max-w-lg grid-cols-2 gap-4">
            <Stat label="Visible faculties" value={counts.faculties} />
            <Stat label="Visible departments" value={counts.departments} />
          </div>
        )}
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return <div className="rounded-xl border border-border bg-muted/40 p-5"><Building2 aria-hidden="true" className="size-5 text-primary" /><p className="mt-4 text-3xl font-bold">{value}</p><p className="mt-1 text-sm text-muted-foreground">{label}</p></div>;
}
