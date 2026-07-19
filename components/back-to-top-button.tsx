"use client";

import { useEffect, useState, type RefObject } from "react";
import { ArrowUp } from "lucide-react";

/**
 * Floating "back to top" control for a scrollable panel (not the page itself — these
 * list/map dashboards scroll an inner container, not the window). Render as a sibling
 * of the scrollable element inside a `relative` wrapper so it stays fixed in place
 * while the content scrolls underneath it.
 */
export function BackToTopButton({ containerRef }: { containerRef: RefObject<HTMLElement | null> }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => setVisible(el.scrollTop > 400);
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, [containerRef]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => containerRef.current?.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Back to top"
      className="absolute bottom-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-violet-600 text-white shadow-lg transition hover:bg-violet-700"
    >
      <ArrowUp className="h-5 w-5" />
    </button>
  );
}
