import { useState, useEffect } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Shield, Wifi, WifiOff } from "lucide-react";

import afitCrest from "@/assets/afit-logo.png";
import { cn } from "@/shared/lib/utils";
import { ScrollToTop } from "@/shared/components/scroll-to-top";

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isOfflineMode = location.pathname.startsWith("/offline");
  const [isNavigating, setIsNavigating] = useState(false);

  // Trigger a brief top-loading progress indicator on route transitions
  useEffect(() => {
    setIsNavigating(true);
    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 280);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  return (
    <div className="flex min-h-svh flex-col bg-background text-foreground">
      <ScrollToTop />
      
      {/* Top Page Transition Progress Bar */}
      {isNavigating && (
        <div className="fixed top-0 left-0 right-0 z-60 h-1 overflow-hidden bg-primary/20 pointer-events-none">
          <div className="h-full bg-sky-400 animate-indeterminate-bar shadow-sm shadow-sky-400" />
        </div>
      )}

      <header className="sticky top-0 z-50 border-b border-border/80 bg-background/95 backdrop-blur-md shadow-xs">
        <div className="mx-auto flex min-h-18 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <Link className="group flex min-w-0 items-center gap-3.5 transition-opacity hover:opacity-95" to="/">
            <img alt="AFIT crest" className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-sm shrink-0" src={afitCrest} />
            <span className="flex min-w-0 flex-col leading-tight">
              <span className="truncate text-base font-extrabold tracking-tight text-primary font-serif sm:text-lg">AFIT eLibrary</span>
              <span className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">Air Force Institute of Technology</span>
            </span>
          </Link>
          <div className="flex items-center gap-3">
            {/* Online / Offline Mode Toggle */}
            <div
              className="inline-flex items-center rounded-xl border border-border bg-muted/60 p-1 text-xs shadow-2xs"
              role="group"
              aria-label="Library connectivity toggle"
            >
              <button
                type="button"
                onClick={() => {
                  if (isOfflineMode) navigate("/");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  !isOfflineMode
                    ? "bg-card text-emerald-600 shadow-xs border border-emerald-500/20"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={!isOfflineMode}
              >
                <Wifi aria-hidden="true" className={cn("size-3.5", !isOfflineMode && "text-emerald-500")} />
                <span>Online</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!isOfflineMode) navigate("/offline");
                }}
                className={cn(
                  "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-all cursor-pointer",
                  isOfflineMode
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground"
                )}
                aria-pressed={isOfflineMode}
              >
                <WifiOff aria-hidden="true" className="size-3.5" />
                <span>Offline</span>
              </button>
            </div>
          </div>
        </div>
      </header>
      
      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-muted/40">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 md:py-16">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-3.5">
              <img alt="" aria-hidden="true" className="h-12 w-12 object-contain" src={afitCrest} />
              <div>
                <p className="font-bold tracking-tight text-primary font-serif text-lg">Air Force Institute of Technology</p>
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Kaduna, Nigeria &bull; Official Digital Library Repository</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground max-w-md">
              Authorized research publications, department archives, and academic learning resources for faculty and student officers.
            </p>
          </div>
        </div>

        <div className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p>&copy; {new Date().getFullYear()} Air Force Institute of Technology. All rights reserved.</p>
            <div className="flex items-center gap-4">
              <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg border border-primary/20 transition-colors">
                <Shield aria-hidden="true" className="size-3.5" /> Admin Portal
              </Link>
              <span className="text-muted-foreground/40">•</span>
              <span className="text-xs font-semibold tracking-wide text-primary bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-2xs">Made by PDFNest</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
