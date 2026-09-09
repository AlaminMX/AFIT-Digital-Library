import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const departments = [
  { name: "Aerospace Engineering", slug: "aerospace-engineering" },
  { name: "Computer Science", slug: "computer-science" },
  { name: "Systems Engineering", slug: "systems-engineering" },
];

export function DepartmentsPage() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Explore</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Departments</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Browse library resources by academic department.</p>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {departments.map((department) => (
          <li key={department.slug}>
            <Link className="flex min-h-24 items-center justify-between rounded-lg border border-border p-5 font-medium transition-colors hover:border-primary hover:bg-muted" to={`/departments/${department.slug}`}>
              {department.name}
              <ArrowRight aria-hidden="true" className="size-4 text-muted-foreground" />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
