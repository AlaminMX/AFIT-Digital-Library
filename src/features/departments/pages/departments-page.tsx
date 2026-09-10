import { BookOpen } from "lucide-react";
import { type KeyboardEvent, useEffect, useId, useRef, useState } from "react";

import { DepartmentCard } from "@/features/departments/components/department-card";
import { loadVisibleDepartments, loadVisibleFaculties, type AcademicStructureClient, type Department, type Faculty } from "@/lib/supabase/academic-structure";
import { getSupabaseClient } from "@/lib/supabase/client";

type Directory = { faculties: Faculty[]; departments: Department[] };

export function DepartmentsPage() {
  const [directory, setDirectory] = useState<Directory>();
  const [hasError, setHasError] = useState(false);
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const tabsId = useId();
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const loadDirectory = () => {
    setDirectory(undefined);
    setHasError(false);
    Promise.resolve()
      .then(() => {
        const client = getSupabaseClient() as unknown as AcademicStructureClient;
        return Promise.all([loadVisibleFaculties(client), loadVisibleDepartments(client)]);
      })
      .then(([faculties, departments]) => {
        setDirectory({ faculties, departments });
        setSelectedFacultyId(faculties[0]?.id ?? "");
      })
      .catch(() => setHasError(true));
  };

  useEffect(() => { loadDirectory(); }, []); // The client is configured once for the app session.

  const selectTab = (index: number) => {
    const faculty = directory?.faculties[index];
    if (!faculty) return;
    setSelectedFacultyId(faculty.id);
    tabRefs.current[index]?.focus();
  };
  const handleTabKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!directory) return;
    const { length } = directory.faculties;
    if (!length) return;
    const keys: Record<string, number> = { ArrowLeft: (index - 1 + length) % length, ArrowRight: (index + 1) % length, Home: 0, End: length - 1 };
    if (keys[event.key] !== undefined) { event.preventDefault(); selectTab(keys[event.key]); }
  };
  const visibleDepartments = directory?.departments.filter((department) => department.faculty_id === selectedFacultyId) ?? [];

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-16">
      <p className="text-sm font-semibold uppercase tracking-wider text-primary">Directory</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Departments</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">[PLACEHOLDER — replace with real AFIT content] Browse library resources by academic department.</p>
      {hasError ? <FailureState onRetry={loadDirectory} /> : !directory ? <Skeletons /> : (
        <>
          {directory.faculties.length ? (
            <div className="mt-8">
              <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0" role="tablist" aria-label="Select a faculty">
                <div className="flex w-max min-w-full gap-2">
                  {directory.faculties.map((faculty, index) => <button aria-controls={`${tabsId}-panel`} aria-selected={faculty.id === selectedFacultyId} className={`min-h-11 rounded-md border px-4 text-left text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${faculty.id === selectedFacultyId ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:bg-muted"}`} id={`${tabsId}-tab-${index}`} key={faculty.id} onClick={() => setSelectedFacultyId(faculty.id)} onKeyDown={(event) => handleTabKeyDown(event, index)} ref={(element) => { tabRefs.current[index] = element; }} role="tab" tabIndex={faculty.id === selectedFacultyId ? 0 : -1}>{faculty.name}</button>)}
                </div>
              </div>
              <div aria-labelledby={`${tabsId}-tab-${directory.faculties.findIndex((faculty) => faculty.id === selectedFacultyId)}`} className="mt-6" id={`${tabsId}-panel`} role="tabpanel">
                {visibleDepartments.length ? <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{visibleDepartments.map((department) => <li key={department.id}><DepartmentCard department={department} /></li>)}</ul> : <EmptyState />}
              </div>
            </div>
          ) : <EmptyState message="No visible faculties are available yet." />}
        </>
      )}
    </section>
  );
}

function Skeletons() { return <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Loading departments">{Array.from({ length: 6 }, (_, index) => <div className="h-56 animate-pulse rounded-xl bg-muted" key={index} />)}</div>; }
function EmptyState({ message = "The selected faculty does not have any visible departments yet." }: { message?: string }) { return <div className="rounded-xl border border-dashed border-border p-8 text-center"><BookOpen aria-hidden="true" className="mx-auto size-8 text-muted-foreground" /><h2 className="mt-3 text-lg font-semibold">No departments available</h2><p className="mt-2 text-sm text-muted-foreground">{message}</p></div>; }
function FailureState({ onRetry }: { onRetry: () => void }) { return <div className="mt-8 rounded-xl border border-destructive/30 bg-destructive/10 p-6" role="alert"><h2 className="text-lg font-semibold">We couldn’t load the directory.</h2><p className="mt-2 text-sm text-muted-foreground">Please check your connection and try again.</p><button className="mt-4 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90" onClick={onRetry} type="button">Try again</button></div>; }
