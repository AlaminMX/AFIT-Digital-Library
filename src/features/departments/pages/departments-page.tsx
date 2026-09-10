import {
  Atom,
  ArrowRight,
  BarChart3,
  Briefcase,
  Calculator,
  CircuitBoard,
  Code,
  Construction,
  BookOpen,
  Network,
  RotateCw,
  Sigma,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { getAcademicDirectory, type AcademicDirectory, type Department, type Faculty } from "@/lib/supabase/queries/departments";

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

function DepartmentIcon({ icon }: { icon: string | null }) {
  const Icon = (icon && DEPARTMENT_ICONS[icon as keyof typeof DEPARTMENT_ICONS]) || BookOpen;
  return <Icon aria-hidden="true" className="size-5" />;
}

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
          <FacultyTabs
            activeFacultyId={activeFacultyId}
            faculties={directory.faculties}
            onChange={setActiveFacultyId}
          />
          {departments.length ? (
            <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {departments.map((department) => (
                <li key={department.id}>
                  <DepartmentCard department={department} />
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

function FacultyTabs({
  activeFacultyId,
  faculties,
  onChange,
}: {
  activeFacultyId: string;
  faculties: Faculty[];
  onChange: (facultyId: string) => void;
}) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTabAt = (index: number) => {
    const wrapped = (index + faculties.length) % faculties.length;
    onChange(faculties[wrapped].id);
    tabRefs.current[wrapped]?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
    switch (event.key) {
      case "ArrowRight":
        event.preventDefault();
        focusTabAt(index + 1);
        break;
      case "ArrowLeft":
        event.preventDefault();
        focusTabAt(index - 1);
        break;
      case "Home":
        event.preventDefault();
        focusTabAt(0);
        break;
      case "End":
        event.preventDefault();
        focusTabAt(faculties.length - 1);
        break;
      default:
        break;
    }
  };

  return (
    <div aria-label="Faculties" className="mt-8 flex gap-2 overflow-x-auto pb-2" role="tablist">
      {faculties.map((faculty, index) => {
        const isActive = faculty.id === activeFacultyId;
        return (
          <button
            aria-selected={isActive}
            className={`shrink-0 rounded-md border px-4 py-2 text-sm font-medium transition-colors ${isActive ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            key={faculty.id}
            onClick={() => onChange(faculty.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            ref={(el) => {
              tabRefs.current[index] = el;
            }}
            role="tab"
            tabIndex={isActive ? 0 : -1}
            type="button"
          >
            {faculty.name}
          </button>
        );
      })}
    </div>
  );
}

function DepartmentCard({ department }: { department: Department }) {
  const accent = department.color || DEFAULT_ACCENT;

  return (
    <Link
      className="group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-lg border border-border p-5 transition-colors hover:border-[var(--accent)]"
      style={{ "--accent": accent } as React.CSSProperties}
      to={`/departments/${department.slug}`}
    >
      {department.background_image_url && (
        <>
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-cover bg-center opacity-10 transition-opacity group-hover:opacity-15"
            style={{ backgroundImage: `url(${department.background_image_url})` }}
          />
          <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/40" />
        </>
      )}
      <div className="relative">
        <span
          className="inline-flex size-9 items-center justify-center rounded-md text-white"
          style={{ backgroundColor: accent }}
        >
          <DepartmentIcon icon={department.icon} />
        </span>
        <h2 className="mt-3 font-medium">{department.name}</h2>
        {department.description && <p className="mt-2 text-sm leading-6 text-muted-foreground">{department.description}</p>}
      </div>
      <span className="relative mt-4 flex items-center gap-2 text-sm font-medium" style={{ color: accent }}>
        View department <ArrowRight aria-hidden="true" className="size-4" />
      </span>
    </Link>
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
