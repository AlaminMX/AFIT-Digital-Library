import { ArrowRight, BookOpen, Building2, Calculator, Code2, Cpu, FlaskConical, type LucideIcon } from "lucide-react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";

import type { Department } from "@/lib/supabase/academic-structure";

const icons: Record<string, LucideIcon> = {
  book: BookOpen,
  building: Building2,
  calculator: Calculator,
  code: Code2,
  cpu: Cpu,
  flask: FlaskConical,
};

export function DepartmentCard({ department }: { department: Department }) {
  const Icon = (department.icon && icons[department.icon.toLowerCase()]) || BookOpen;
  const cardStyle = {
    "--department-color": department.color || "var(--primary)",
    backgroundImage: department.background_image_url
      ? `linear-gradient(to bottom, color-mix(in oklab, var(--department-color) 82%, transparent), color-mix(in oklab, var(--department-color) 96%, transparent)), url("${department.background_image_url}")`
      : undefined,
  } as CSSProperties;

  return (
    <Link
      className="group relative flex min-h-56 flex-col overflow-hidden rounded-xl border border-border bg-[var(--department-color)] bg-cover bg-center p-6 text-white shadow-sm transition-transform hover:-translate-y-1 focus-visible:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      style={cardStyle}
      to={`/departments/${department.slug}`}
    >
      <span className="relative grid size-11 place-items-center rounded-lg bg-white/15" aria-hidden="true">
        <Icon className="size-5" />
      </span>
      <div className="relative mt-auto">
        <h2 className="text-xl font-semibold tracking-tight">{department.name}</h2>
        <p className="mt-2 line-clamp-2 text-sm leading-6 text-white/85">
          {department.description || "[PLACEHOLDER — replace with real AFIT content] Department library resources."}
        </p>
        <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold">
          View collection <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  );
}
