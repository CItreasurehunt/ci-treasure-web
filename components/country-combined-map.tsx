"use client";

import dynamic from "next/dynamic";
import type { CountryMapMarker } from "@/lib/country-pages";

// components/combined-map.tsx imports leaflet at module scope, which touches `window` and
// breaks SSR — same reason country-event-map.tsx (and events-dashboard.tsx before it) load
// the map this way rather than a direct import.
const CombinedMap = dynamic(() => import("./combined-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-sm font-medium">Loading map...</p>
      </div>
    </div>
  ),
});

export function CountryCombinedMap({ markers }: { markers: CountryMapMarker[] }) {
  return <CombinedMap markers={markers} />;
}
