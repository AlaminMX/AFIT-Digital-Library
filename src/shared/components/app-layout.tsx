import type { ReactNode } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";

import afitCrest from "@/assets/afit-logo.svg";
import { cn } from "@/shared/lib/utils";

export function AppLayout() {
  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <header className="border-b border-border bg-background/95">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link className="flex min-w-0 items-center gap-3" to="/">
            <img alt="AFIT crest" className="h-11 w-9 shrink-0 object-contain" src={afitCrest} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-base font-bold tracking-tight text-primary">AFIT eLibrary</span>
              <span className="truncate text-xs font-medium text-muted-foreground">AFIT Digital Library</span>
            </span>
          </Link>
          <nav aria-label="Primary navigation" className="flex items-center gap-1 text-sm font-medium">
            <NavItem to="/">Home</NavItem>
            <NavItem to="/departments">Departments</NavItem>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border bg-muted/50">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 md:grid-cols-[1.25fr_1fr_1fr] md:py-10">
          <div>
            <div className="flex items-center gap-3">
              <img alt="" aria-hidden="true" className="h-12 w-10 object-contain" src={afitCrest} />
              <p className="font-semibold tracking-tight text-primary">Air Force Institute of Technology</p>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">AFIT Digital Library</p>
          </div>
          <section aria-labelledby="footer-contact-heading">
            <h2 id="footer-contact-heading" className="text-sm font-semibold text-foreground">Contact</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">[PLACEHOLDER — replace with real AFIT content]</p>
          </section>
          <section aria-labelledby="footer-social-heading">
            <h2 id="footer-social-heading" className="text-sm font-semibold text-foreground">Social links</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">[PLACEHOLDER — replace with real AFIT content]</p>
          </section>
        </div>
      </footer>
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
