import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, ArrowRight, Pause, Play } from "lucide-react";
import { getActiveCarouselSlides, type CarouselSlide } from "@/lib/carousel";
import { buttonVariants } from "@/shared/ui/button";
import { cn } from "@/shared/lib/utils";

export function HomepageCarousel() {
  const [slides, setSlides] = useState<CarouselSlide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    let mounted = true;
    getActiveCarouselSlides().then((data) => {
      if (mounted) {
        setSlides(data);
        setIsLoading(false);
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  // Auto-advance timer
  useEffect(() => {
    if (slides.length <= 1 || isPaused) return;

    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 6000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [slides.length, isPaused]);

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  if (isLoading) {
    return (
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-md">
        <div className="h-72 sm:h-84 md:h-96 w-full animate-pulse bg-muted/60 flex items-end p-6 sm:p-10 md:p-12">
          <div className="space-y-3 w-full max-w-lg">
            <div className="h-4 w-28 rounded-full bg-muted-foreground/20" />
            <div className="h-8 w-3/4 rounded-xl bg-muted-foreground/20" />
            <div className="h-4 w-full rounded-md bg-muted-foreground/20" />
          </div>
        </div>
      </div>
    );
  }

  if (slides.length === 0) {
    return null;
  }

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <section
      aria-roledescription="carousel"
      aria-label="AFIT Institutional Highlights"
      className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-md transition-all"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
    >
      {/* Slide Image Background with Academic Gradient Overlay */}
      <div className="relative h-72 sm:h-84 md:h-96 w-full overflow-hidden bg-slate-950">
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-700 ease-in-out",
              idx === currentIndex ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            )}
            aria-hidden={idx !== currentIndex}
          >
            <img
              src={slide.image_url}
              alt={slide.title}
              referrerPolicy="no-referrer"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src =
                  "https://images.unsplash.com/photo-1517976487502-d5966a3d92fb?auto=format&fit=crop&w=1600&q=80";
              }}
              className="h-full w-full object-cover object-center"
              loading={idx === 0 ? "eager" : "lazy"}
            />
            {/* Multi-stage refined academic gradient for legibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/55 to-black/30 md:via-black/45" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/20" />
          </div>
        ))}

        {/* Content Container */}
        <div className="relative z-20 flex h-full flex-col justify-end p-6 sm:p-10 md:p-12 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/90 px-3 py-0.5 text-2xs font-bold uppercase tracking-wider text-white backdrop-blur-xs">
              Institutional Spotlight
            </span>
            <span className="text-2xs font-semibold text-white/70">
              {currentIndex + 1} / {slides.length}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl md:text-3xl font-extrabold font-serif tracking-tight text-white line-clamp-2 drop-shadow-xs">
            {currentSlide.title}
          </h3>

          <p className="mt-2 text-xs sm:text-sm md:text-base text-slate-200 line-clamp-2 md:line-clamp-3 leading-relaxed font-sans max-w-2xl drop-shadow-xs">
            {currentSlide.description}
          </p>

          {currentSlide.cta_url && currentSlide.cta_text && (
            <div className="mt-4 sm:mt-5">
              {currentSlide.cta_url.startsWith("http") ? (
                <a
                  href={currentSlide.cta_url}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md rounded-xl text-xs sm:text-sm px-4 py-2"
                  )}
                >
                  <span>{currentSlide.cta_text}</span>
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </a>
              ) : (
                <Link
                  to={currentSlide.cta_url}
                  className={cn(
                    buttonVariants({ size: "sm" }),
                    "gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-md rounded-xl text-xs sm:text-sm px-4 py-2"
                  )}
                >
                  <span>{currentSlide.cta_text}</span>
                  <ArrowRight aria-hidden="true" className="size-3.5" />
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Navigation Controls (Arrows) */}
        {slides.length > 1 && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPaused((prev) => !prev)}
              aria-label={isPaused ? "Play slide show" : "Pause slide show"}
              className="flex size-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white border border-white/10"
            >
              {isPaused ? <Play aria-hidden="true" className="size-3.5" /> : <Pause aria-hidden="true" className="size-3.5" />}
            </button>
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous slide"
              className="flex size-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white border border-white/10"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              aria-label="Next slide"
              className="flex size-8 items-center justify-center rounded-full bg-black/40 text-white/80 backdrop-blur-md transition-colors hover:bg-black/60 hover:text-white border border-white/10"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </button>
          </div>
        )}

        {/* Indicators (Dots) */}
        {slides.length > 1 && (
          <div className="absolute bottom-4 right-6 z-30 flex items-center gap-1.5">
            {slides.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  idx === currentIndex
                    ? "w-6 bg-primary shadow-xs"
                    : "w-2 bg-white/40 hover:bg-white/70"
                )}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
