// Shared types + pure helpers for the organizer-facing event form (/events/new,
// /events/[slug]/edit). Reuses the admin item shapes but is intentionally a smaller
// field set — no status/hide/cancelled/people controls (those stay admin-only).

import type { AdminLinkItem, AdminPriceItem } from "./admin-events";

export { EVENT_TYPE_OPTIONS, LINK_TYPE_OPTIONS } from "./admin-events";
export type { AdminLinkItem, AdminPriceItem };

// Level is a free-text column. Canonical set (unified 2026-07-03): "all_levels" is the
// single "everyone welcome" value; open_level/mixed/intermediate_plus were migrated away.
export const LEVEL_OPTIONS = ["", "all_levels", "beginner", "intermediate", "advanced"] as const;

// Global timezone coverage, roughly ordered west→east, with Europe first (CI events
// skew European). The form shows each zone's live UTC offset and keeps the event's
// current value even if it's not listed, so edits never drop it. IANA names are stored
// (DST-aware) — a bare "GMT+6" would be wrong half the year.
export const TIMEZONE_OPTIONS = [
  // Europe
  "Europe/London",
  "Europe/Lisbon",
  "Europe/Berlin",
  "Europe/Paris",
  "Europe/Madrid",
  "Europe/Rome",
  "Europe/Amsterdam",
  "Europe/Zurich",
  "Europe/Vienna",
  "Europe/Prague",
  "Europe/Warsaw",
  "Europe/Athens",
  "Europe/Stockholm",
  "Europe/Helsinki",
  "Europe/Bucharest",
  "Europe/Istanbul",
  "Europe/Moscow",
  // Americas
  "America/Sao_Paulo",
  "America/Argentina/Buenos_Aires",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Mexico_City",
  "America/Bogota",
  "America/Toronto",
  // Africa & Middle East
  "Africa/Casablanca",
  "Africa/Lagos",
  "Africa/Cairo",
  "Africa/Johannesburg",
  "Asia/Jerusalem",
  "Asia/Dubai",
  // Asia
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Shanghai",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  // Oceania & Pacific
  "Australia/Perth",
  "Australia/Sydney",
  "Pacific/Auckland",
  "Pacific/Honolulu",
] as const;

export type OrganizerEventFormData = {
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  timezone: string;
  city: string;
  country: string;
  description: string;
  imageUrl: string;
  level: string;
  // Comma-separated in the form; parsed to text[] on save.
  languages: string;
  features: string;
  cancelled: boolean;
  cancelledText: string;
  priceItems: AdminPriceItem[];
  linkItems: AdminLinkItem[];
};

export function createEmptyOrganizerEventFormData(): OrganizerEventFormData {
  return {
    title: "",
    type: "workshop",
    startDate: "",
    endDate: "",
    timezone: "Europe/Berlin",
    city: "",
    country: "",
    description: "",
    imageUrl: "",
    level: "",
    languages: "",
    features: "",
    cancelled: false,
    cancelledText: "",
    priceItems: [],
    linkItems: [],
  };
}

// ── Parsing (form → DB) ────────────────────────────────────────────────────

// All currencies are stored ×100 (minor units); the display layer divides by 100.
export function parsePriceItems(items: AdminPriceItem[]) {
  return items
    .map((item) => {
      const amount = item.amount.trim();
      return {
        amount: amount ? Math.round(Number.parseFloat(amount) * 100) : null,
        currency: item.currency.trim() || "EUR",
        description: item.description.trim() || undefined,
      };
    })
    .filter((item) => item.amount !== null || item.description);
}

export function parseLinkItems(items: AdminLinkItem[]) {
  return items
    .map((item) => ({ type: item.type.trim() || "website", url: item.url.trim() }))
    .filter((item) => item.url);
}

export function normalizeJsonItems<T>(items: T[]) {
  return items.length ? { items } : null;
}

// "en, de" → ["en","de"]; empty → null (so the column stays NULL, not []).
export function parseCsvArray(value: string): string[] | null {
  const parts = value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.length ? parts : null;
}

// ── Prefill (DB → form) ────────────────────────────────────────────────────

type EventRowForForm = {
  title: string;
  type: string;
  start_date: string | null;
  end_date: string | null;
  timezone: string | null;
  city: string | null;
  country: string | null;
  description: string | null;
  image_url: string | null;
  level: string | null;
  language: string[] | null;
  features: string[] | null;
  cancelled: boolean | null;
  cancelled_text: string | null;
  price: { items?: Array<{ amount?: number | null; currency?: string; description?: string }> } | null;
  links: { items?: Array<{ type?: string; url?: string }> } | null;
};

export function eventRowToFormData(row: EventRowForForm): OrganizerEventFormData {
  return {
    title: row.title ?? "",
    type: row.type ?? "workshop",
    startDate: row.start_date ?? "",
    endDate: row.end_date ?? "",
    timezone: row.timezone ?? "Europe/Berlin",
    city: row.city ?? "",
    country: row.country ?? "",
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    level: row.level ?? "",
    languages: (row.language ?? []).join(", "),
    features: (row.features ?? []).join(", "),
    cancelled: row.cancelled ?? false,
    cancelledText: row.cancelled_text ?? "",
    priceItems: (row.price?.items ?? []).map((p) => ({
      // Stored minor units → back to major units for editing.
      amount: p.amount != null ? String(p.amount / 100) : "",
      currency: p.currency ?? "EUR",
      description: p.description ?? "",
    })),
    linkItems: (row.links?.items ?? []).map((l) => ({
      type: l.type ?? "website",
      url: l.url ?? "",
    })),
  };
}

// Validation shared by create + edit. `enforceMinDuration` is only passed true from
// createEvent — single-day jams/classes are blocked at submission time (2026-07-05
// decision) because neither the organizer nor admin web forms capture start/end time
// of day yet, and a single-day listing without a time is barely usable. Editing an
// existing event never re-checks this, so already-linked single-day events (added via
// /addevent or admin, which do capture time) stay editable.
export function validateOrganizerEvent(
  data: OrganizerEventFormData,
  options?: { enforceMinDuration?: boolean }
): string | null {
  if (!data.title.trim()) return "Title is required.";
  if (!data.startDate) return "Start date is required.";
  if (!data.endDate) return "End date is required.";
  if (data.endDate < data.startDate) return "End date can't be before the start date.";
  if (options?.enforceMinDuration && data.endDate === data.startDate) {
    return "Self-service submission currently requires events spanning 2+ days. For single-day jams, classes, or workshops, please share it in our Telegram group and we'll add it manually.";
  }
  if (!data.city.trim()) return "City is required.";
  if (!data.country.trim()) return "Country is required.";
  if (!/^[A-Za-z]{2}$/.test(data.country.trim())) {
    return "Country must be a 2-letter ISO code (e.g. DE, GB, US).";
  }
  if (!data.timezone.trim()) return "Timezone is required.";
  return null;
}

// Normalize a 2-letter country code to uppercase for storage.
export function normalizeCountry(value: string) {
  return value.trim().toUpperCase();
}
