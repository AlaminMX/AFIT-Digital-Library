import { ArrowRight, BookOpen, RotateCw } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { getAcademicDirectory, type AcademicDirectory } from "@/lib/supabase/queries/departments";

export function DepartmentsPage() {
  const [directory, setDirectory] = useState<AcademicDirectory | null>(null);
  const [activeFacultyId, setActiveFacultyId] = useState("");
  const [hasError, setHasError] = useState(false);

  const loadDirectory = () => {
    setDirectory(null);
    setHasError(false);
    getAcademicDirectory()
      .then((result) => {
        setDirectory(result);
        setActiveFacultyId((current) => current || result.faculties[0]?.id || "");
      })
      .catch(() => setHasError(true));
  };

  useEffect(() => {
    loadDirectory();
  }, []);

  const departments = directory?.departments.filter((department) => department.faculty_id === activeFacultyId) ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Explore</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Departments</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Choose a faculty to browse its available library collections.</p>

      {hasError ? (
        <DirectoryError onRetry={loadDirectory} />
      ) : !directory ? (
        <DirectorySkeleton />
      ) : directory.faculties.length === 0 ? (
        <EmptyDirectory />
      ) : (
        <>
          <div aria-label="Faculties" className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist">
            {directory.faculties.map((faculty) => (
              <button
                aria-selected={faculty.id === activeFacultyId}
                className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${faculty.id === activeFacultyId ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
                key={faculty.id}
                onClick={() => setActiveFacultyId(faculty.id)}
                role="tab"
                type="button"
              >
                {faculty.name}
              </button>
            ))}
          </div>
          {departments.length ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((department) => (
                <li key={department.id}>
                  <Link className="flex min-h-32 flex-col justify-between rounded-lg border border-border p-5 transition-colors hover:border-primary hover:bg-muted" to={`/departments/${department.slug}`}>
                    <div>
                      <h2 className="font-medium">{department.name}</h2>
                      {department.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{department.description}</p>}
                    </div>
                    <span className="mt-4 flex items-center gap-2 text-sm font-medium text-primary">
                      View department <ArrowRight aria-hidden="true" className="size-4" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyFaculty />
          )}
        </>
      )}
    </section>
  );
}

function DirectorySkeleton() {
  return <div aria-label="Loading departments" className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <div className="h-32 animate-pulse rounded-lg bg-muted" key={index} />)}</div>;
}

function DirectoryError({ onRetry }: { onRetry: () => void }) {
  return <div className="mt-8 rounded-lg border border-border p-6" role="alert"><h2 className="font-semibold">We couldn’t load the directory.</h2><p className="mt-2 text-sm text-muted-foreground">Check your Supabase configuration or connection, then try again.</p><button className="mt-4 inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={onRetry} type="button"><RotateCw aria-hidden="true" className="size-4" />Try again</button></div>;
}

function EmptyDirectory() {
  return <div className="mt-8 rounded-lg border border-border p-6 text-muted-foreground"><BookOpen aria-hidden="true" className="size-6 text-primary" /><h2 className="mt-3 font-semibold text-foreground">No faculties are available yet.</h2><p className="mt-2 text-sm">Check back when the library directory is published.</p></div>;
}

function EmptyFaculty() {
  return <div className="mt-6 rounded-lg border border-border p-6 text-muted-foreground"><BookOpen aria-hidden="true" className="size-6 text-primary" /><h2 className="mt-3 font-semibold text-foreground">No departments are available for this faculty.</h2><p className="mt-2 text-sm">Please choose another faculty or check back later.</p></div>;
}
