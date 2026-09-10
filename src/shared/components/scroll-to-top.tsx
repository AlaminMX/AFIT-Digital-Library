import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * ScrollToTop ensures that navigating between pages immediately
 * resets the scroll coordinate to the very top (0, 0), preventing
 * the browser from landing users at the bottom of newly entered pages.
 */
export function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // Instant reset on window and document elements
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant",
    });

    if (document.documentElement) {
      document.documentElement.scrollTop = 0;
    }
    if (document.body) {
      document.body.scrollTop = 0;
    }
  }, [pathname, search]);

  return null;
}
