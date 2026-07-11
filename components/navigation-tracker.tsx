"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Marks that the user has navigated within the app at least once, so BackButton
// knows it's safe to use router.back() instead of falling back to the homepage.
export default function NavigationTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    sessionStorage.setItem("hasInternalHistory", "true");
  }, [pathname]);

  return null;
}
