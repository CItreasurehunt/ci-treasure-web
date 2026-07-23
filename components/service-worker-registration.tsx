"use client";

import { useEffect } from "react";

// Registers the no-op service worker in public/sw.js. Its only purpose is
// satisfying Chrome/Android's installability criteria (manifest + HTTPS + a
// registered SW with a fetch handler) for the "Install app" prompt (I-142).
export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);

  return null;
}
