// Pure, client-safe event display helpers — split out of lib/events.ts (I-136) so client
// components (event cards, map, filters) don't drag the Supabase server client into their
// browser bundle just to format a date or a country name. Nothing in this file may import
// @/lib/supabase/* or touch the network — that's the whole point of the split.

export type SegmentItem = {
  title: string;
  startDate?: string;
  endDate?: string;
  teachers?: string[];
  description?: string;
};

export type SegmentsData = {
  items: SegmentItem[];
};

export type EventListItem = {
  id: string;
  shortId: string;
  slug: string;
  title: string;
  description: string | null;
  type: string;
  startDate: string;
  endDate: string;
  city: string;
  country: string;
  imageUrl: string | null;
  accentClass: string;
  lat: number | null;
  lng: number | null;
  discipline: string[];
  cancelled: boolean;
};

// Shared fallback gradient — used for event types without a dedicated accent (below),
// and as the generic hero background for entity types with no "type" taxonomy of their
// own (venues, profiles). Derived from the brand tokens (--color-ink -> --color-pine ->
// --color-sand) rather than an unrelated palette — see I-123/design.md D-02 for the trial
// and decision history.
export const GENERIC_ACCENT_GRADIENT = "bg-[linear-gradient(135deg,#1e0c30_0%,#472278_50%,#f3e8ff_100%)]";

export function getEventHref(event: Pick<EventListItem, "slug">) {
  return `/events/${event.slug}`;
}

export function getCountryLabel(country: string) {
  if (/^[A-Z]{2}$/.test(country)) {
    try {
      return new Intl.DisplayNames(["en"], { type: "region" }).of(country) ?? country;
    } catch {
      return country;
    }
  }
  return country;
}

export function getTypeLabel(type: string) {
  const labels: Record<string, string> = {
    camp: "Camp",
    festival: "Festival",
    intensive: "Intensive",
    long_jam: "Long Jam",
    residency: "Residency",
    retreat: "Retreat",
    training: "Training",
    workshop: "Workshop",
  };
  return labels[type] ?? type;
}

// Acronyms that shouldn't be title-cased word-by-word. Add here as new short-form
// practices appear — everything else humanizes automatically (snake_case -> Title Case).
// Shared between the homepage practice filter and the organizer submission form.
const DISCIPLINE_LABEL_OVERRIDES: Record<string, string> = {
  bmc: "BMC",
};

export function disciplineLabel(value: string): string {
  return (
    DISCIPLINE_LABEL_OVERRIDES[value] ??
    value
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ")
  );
}

export function getEventLocation(event: Pick<EventListItem, "city" | "country">) {
  return `${event.city}, ${getCountryLabel(event.country)}`;
}

export function formatEventDateRange(event: Pick<EventListItem, "startDate" | "endDate">) {
  const start = new Date(`${event.startDate}T12:00:00`);
  const end = new Date(`${event.endDate}T12:00:00`);
  const sameDay = event.startDate === event.endDate;
  const sameYear = start.getFullYear() === end.getFullYear();

  if (sameDay) {
    return new Intl.DateTimeFormat("en", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(start);
  }

  if (sameYear) {
    return `${new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
    }).format(start)} - ${new Intl.DateTimeFormat("en", {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(end)}`;
  }

  return `${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(start)} - ${new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(end)}`;
}
