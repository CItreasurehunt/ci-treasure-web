"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Marks that the user has navigated within the app at least once, so BackButton
// knows it's safe to use router.back() instead of falling back to the homepage.
// Also records the pathname being left on each transition, so a page can tell
// specifically whether it was reached directly from the events list.
export default function NavigationTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);
  const previousPathnameRef = useRef(pathname);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathnameRef.current = pathname;
      return;
    }
    sessionStorage.setItem("hasInternalHistory", "true");
    sessionStorage.setItem("previousPathname", previousPathnameRef.current);
    previousPathnameRef.current = pathname;
  }, [pathname]);

  return null;
}
