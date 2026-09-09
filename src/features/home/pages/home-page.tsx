import { ArrowRight, Search } from "lucide-react";
import { Link } from "react-router-dom";

export function HomePage() {
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
    </section>
  );
}
