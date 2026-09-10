import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { getDepartmentBySlug, type Department } from "@/lib/supabase/queries/departments";

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

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Department collection</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">{department.name}</h1>
      <p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{department.description || "This department’s collection is being prepared. Please check back soon."}</p>
      <Link className="mt-8 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/departments">Back to departments</Link>
    </section>
  );
}

function DepartmentMessage({ text, title }: { text: string; title: string }) {
  return <section className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-24"><p className="text-sm font-semibold uppercase tracking-wider text-primary">Department collection</p><h1 className="mt-3 text-4xl font-bold tracking-tight">{title}</h1><p className="mt-5 max-w-2xl leading-7 text-muted-foreground">{text}</p><Link className="mt-8 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/departments">Back to departments</Link></section>;
}
