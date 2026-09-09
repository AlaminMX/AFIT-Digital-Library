import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6 sm:py-24">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">404</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight">Page not found</h1>
      <Link className="mt-6 inline-flex text-sm font-medium text-primary underline-offset-4 hover:underline" to="/">
        Return home
      </Link>
    </section>
  );
}
