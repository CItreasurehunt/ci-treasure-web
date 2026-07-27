"use client";

import dynamic from "next/dynamic";
import type { EventListItem } from "@/lib/event-display";

// components/map.tsx imports leaflet at module scope, which touches `window` and breaks SSR —
// same reason events-dashboard.tsx loads it this way rather than a direct import. This wrapper
// exists so country pages (a Server Component) can still render the map without needing
// `ssr: false`, which next/dynamic disallows outside Client Components.
const EventMap = dynamic(() => import("./map"), {
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

export function CountryEventMap({ events }: { events: EventListItem[] }) {
  return <EventMap events={events} highlightedEventId={null} />;
}
