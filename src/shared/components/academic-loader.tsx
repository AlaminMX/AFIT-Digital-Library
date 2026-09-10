import { BookOpen, Loader2 } from "lucide-react";
import afitCrest from "@/assets/afit-logo.png";
import { cn } from "@/shared/lib/utils";

interface AcademicLoaderProps {
  title?: string;
  subtitle?: string;
  className?: string;
  fullScreen?: boolean;
}

export function AcademicLoader({
  title = "Loading Academic Repository",
  subtitle = "Retrieving authorized publications and resources...",
  className,
  fullScreen = false,
}: AcademicLoaderProps) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center text-center p-8", className)}>
      {/* Visual Icon with subtle crest & loader animation */}
      <div className="relative mb-5 flex size-20 items-center justify-center">
        <div className="absolute inset-0 rounded-2xl bg-primary/10 animate-ping opacity-25" />
        <div className="relative flex size-16 items-center justify-center rounded-2xl border border-primary/20 bg-card p-2.5 shadow-sm">
          <img
            src={afitCrest}
            alt=""
            aria-hidden="true"
            className="size-full object-contain drop-shadow-xs opacity-90"
          />
        </div>
        <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs">
          <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
        </div>
      </div>

      {/* Institutional label */}
      <span className="inline-flex items-center gap-1.5 text-2xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-2">
        <BookOpen aria-hidden="true" className="size-3 text-primary" />
        Air Force Institute of Technology
      </span>

      <h3 className="text-xl font-bold font-serif text-foreground tracking-tight">
        {title}
      </h3>

      <p className="mt-1 text-xs text-muted-foreground max-w-sm leading-relaxed">
        {subtitle}
      </p>

      {/* Refined Academic Loading Indicator Bar */}
      <div className="mt-6 w-48 h-1 rounded-full bg-muted overflow-hidden">
        <div className="h-full bg-primary rounded-full animate-indeterminate-bar" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/85 backdrop-blur-md">
        {content}
      </div>
    );
  }

  return content;
}
