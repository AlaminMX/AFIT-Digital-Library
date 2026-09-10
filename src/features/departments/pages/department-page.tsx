import {
  Atom,
  BarChart3,
  Briefcase,
  Calculator,
  BookOpen,
  CircuitBoard,
  Code,
  Construction,
  Network,
  Sigma,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDepartmentBySlug, type Department } from "@/lib/supabase/queries/departments";

const DEPARTMENT_ICONS = {
  atom: Atom,
  briefcase: Briefcase,
  calculator: Calculator,
  chart: BarChart3,
  circuit: CircuitBoard,
  code: Code,
  construction: Construction,
  network: Network,
  sigma: Sigma,
  users: Users,
} satisfies Record<string, typeof BookOpen>;

const DEFAULT_ACCENT = "#1d4ed8";

export function DepartmentPage() {
  const { slug = "" } = useParams();
  const [department, setDepartment] = useState<Department | null | undefined>(undefined);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setDepartment(undefined);
    setHasError(false);
    getDepartmentBySlug(slug).then(setDepartment).catch(() => setHasError(true));
  }, [slug]);

  if (department === undefined && !hasError) {
    return <section aria-label="Loading department" className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24"><div className="h-40 animate-pulse rounded-lg bg-muted" /></section>;
  }

  if (hasError) return <DepartmentMessage title="We couldn’t load this department." text="Check your connection and try again from the department directory." />;
  if (!department) return <DepartmentMessage title="Department not found." text="This department is unavailable or no longer published." />;

  const accent = department.color || DEFAULT_ACCENT;
  const Icon = (department.icon && DEPARTMENT_ICONS[department.icon as keyof typeof DEPARTMENT_ICONS]) || BookOpen;

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <span className="inline-flex size-11 items-center justify-center rounded-md text-white" style={{ backgroundColor: accent }}>
        <Icon aria-hidden="true" className="size-6" />
      </span>
      <p className="mt-4 text-sm font-semibold uppercase tracking-wider text-primary">Department collection</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{department.name}</h1>
      <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{department.description || "This department’s collection is being prepared. Please check back soon."}</p>
      <Link className="mt-8 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/departments">Back to departments</Link>
    </section>
  );
}

function DepartmentMessage({ text, title }: { text: string; title: string }) {
  return <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Department collection</p><h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1><p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{text}</p><Link className="mt-8 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/departments">Back to departments</Link></section>;
}
