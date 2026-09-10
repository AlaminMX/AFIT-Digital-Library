import { Link, useParams } from "react-router-dom";

function formatDepartmentName(slug: string) {
  return slug.replaceAll("-", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function DepartmentPage() {
  const { slug = "department" } = useParams();
  const name = formatDepartmentName(slug);

  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">{name}</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Coming soon</h1>
      <p className="mx-auto mt-4 max-w-lg text-muted-foreground">
        [PLACEHOLDER — replace with real AFIT content] This department’s collection is being prepared. Please check back soon.
      </p>
      <Link className="mt-8 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/departments">
        Back to departments
      </Link>
    </section>
  );
}
