import { ArrowRight, BookOpen, ShieldCheck, Users, Layers, Award, Library } from "lucide-react";
import { Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { cn } from "@/shared/lib/utils";
import { buttonVariants } from "@/shared/ui/button";
import afitCrest from "@/assets/afit-logo.png";
import { HomepageCarousel } from "../components/homepage-carousel";

interface Stats {
  totalStudents: string;
  academicResources: string;
  activeDepartments: string;
  researchCitations: string;
}

const defaultStats: Stats = {
  totalStudents: "12,500+",
  academicResources: "45,000+",
  activeDepartments: "18+",
  researchCitations: "98%",
};

export function HomePage() {
  const [stats, setStats] = useState<Stats>(defaultStats);

  useEffect(() => {
    let mounted = true;
    fetch("/api/stats")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("Failed to load stats"))))
      .then((data: Stats) => {
        if (mounted) {
          setStats(data);
        }
      })
      .catch(() => {
        // Keep defaultStats on failure — this is decorative hero content,
        // not worth showing an error state for.
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary/5 via-background to-background">
      {/* Full height background watermark crest */}
      <div className="absolute inset-0 flex items-center justify-end pr-8 sm:pr-16 pointer-events-none opacity-10 select-none overflow-hidden" aria-hidden="true">
        <img src={afitCrest} alt="" className="h-full max-h-[500px] w-auto object-contain grayscale scale-125 translate-x-12" />
      </div>

      <section className="relative mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-20 lg:py-24">
        <div className="max-w-3xl">
          <h1 className="text-4xl font-extrabold tracking-tight text-primary font-serif sm:text-5xl lg:text-6xl leading-[1.1]">
            Knowledge for every mission.
          </h1>
          
          <p className="mt-6 text-base leading-7 text-muted-foreground sm:text-lg">
            Access authorized research publications, department archives, academic journals, and learning resources from the Air Force Institute of Technology.
          </p>

          <div className="mt-8 flex flex-col gap-3.5 sm:flex-row sm:items-center">
            <Link to="/departments" className={cn(buttonVariants({ size: "lg" }), "gap-2 font-semibold")}>
              Browse departments <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
            <Link to="/offline" className={cn(buttonVariants({ variant: "outline", size: "lg" }), "gap-2 font-semibold")}>
              Offline Library Access
            </Link>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-4 border-t border-border pt-6 sm:grid-cols-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <ShieldCheck aria-hidden="true" className="size-4 text-primary shrink-0" />
              <span>Verified Academic Repository</span>
            </div>
            <div className="flex items-center gap-2">
              <BookOpen aria-hidden="true" className="size-4 text-primary shrink-0" />
              <span>Peer-Reviewed Publications & Theses</span>
            </div>
          </div>
        </div>

        {/* Dynamic Academic Spotlight Carousel */}
        <div className="mt-14 w-full">
          <HomepageCarousel />
        </div>

        {/* Institutional Statistics Cards Section */}
        <div className="mt-16 grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xs p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Users aria-hidden="true" className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Enrolled Students</span>
            </div>
            <p className="text-3xl font-extrabold font-serif text-foreground">{stats.totalStudents}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xs p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Library aria-hidden="true" className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Library Resources</span>
            </div>
            <p className="text-3xl font-extrabold font-serif text-foreground">{stats.academicResources}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xs p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Layers aria-hidden="true" className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Departments</span>
            </div>
            <p className="text-3xl font-extrabold font-serif text-foreground">{stats.activeDepartments}</p>
          </div>

          <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-xs p-6 shadow-xs">
            <div className="flex items-center gap-3 mb-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Award aria-hidden="true" className="size-5" />
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Research Index</span>
            </div>
            <p className="text-3xl font-extrabold font-serif text-foreground">{stats.researchCitations}</p>
          </div>
        </div>
      </section>
    </div>
  );
}
