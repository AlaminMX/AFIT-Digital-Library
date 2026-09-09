import { BookOpen } from "lucide-react";
import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import { cn } from "@/shared/lib/utils";

export function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link className="flex items-center gap-2 font-semibold tracking-tight" to="/">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <BookOpen aria-hidden="true" className="size-4" />
            </span>
            <span>AFIT Library</span>
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm font-medium">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/departments">Departments</NavItem>
          </nav>
        </div>
      </header>
      <main>
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({ children, to }: { children: ReactNode; to: string }) {
  return (
    <NavLink
      className={({ isActive }) =>
        cn(
          "rounded-md px-3 py-2 transition-colors hover:bg-muted",
          isActive && "bg-muted text-foreground",
        )
      }
      to={to}
    >
      {children}
    </NavLink>
  );
}
