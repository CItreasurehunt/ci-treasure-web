import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type SupabaseEventRow = {
  id: string;
  short_id: string;
  title: string;
  description: string | null;
  type: string;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  city: string;
  country: string;
  cancelled: boolean;
  cancelled_text: string | null;
  image_url: string | null;
  image_credit?: string | null;
  links: unknown;
  price: unknown;
  segments: unknown;
  venue_id: string | null;
  address: { venue_name?: string } | null;
  lat: number | null;
  lng: number | null;
  contact_email?: string | null;
  series_id?: string | null;
  series_order?: number | null;
  event_series?: { title: string } | null;
  discipline?: string[] | null;
  level?: string | null;
  language?: string[] | null;
};

export type SeriesSibling = {
  id: string;
  shortId: string;
  slug: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  seriesOrder: number | null;
};

type SupabaseProfileJoin = {
  role?: string | null;
  profiles?: {
    name?: string | null;
    slug?: string | null;
  } | null;
};

export type LinkItem = {
  type: string;
  url: string;
  label?: string;
};

export type PriceItem = {
  amount: number | null;
  currency: string;
  description?: string;
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

export type EventDetail = EventListItem & {
  startTime: string | null;
  endTime: string | null;
  timezone: string;
  cancelledText: string | null;
  linkItems: LinkItem[];
  priceItems: PriceItem[];
  segments: SegmentsData | null;
  teachers: Array<{ name: string; role?: string | null; slug?: string | null }>;
  organizers: Array<{ name: string; role?: string | null; slug?: string | null }>;
  venueName: string | null;
  venueAddress: string | null;
  venueSlug: string | null;
  primaryRegistrationUrl: string | null;
  startDateIso: string;
  endDateIso: string;
  contactEmail: string | null;
  level: string | null;
  language: string[];
  seriesName: string | null;
  seriesSiblings: SeriesSibling[];
  imageCredit: string | null;
  // True for archived (past) events — the page renders an "event has ended" state.
  isPast: boolean;
};

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

const SLUG_CHAR_MAP: Record<string, string> = {
  ł: "l", ø: "o", ß: "ss", đ: "d", ð: "d", þ: "th", æ: "ae", å: "a",
};

export function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[łøßđðþæå]/g, (c) => SLUG_CHAR_MAP[c] ?? c)
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Shared fallback gradient — used for event types without a dedicated accent (below),
// and as the generic hero background for entity types with no "type" taxonomy of their
// own (venues, profiles). See I-123 for the decision to formalize this as the generic
// gradient rather than leaving it an unnamed accident of mapAccent()'s default case.
export const GENERIC_ACCENT_GRADIENT = "bg-[linear-gradient(135deg,#1f3b46_0%,#3a6a73_50%,#ead9b1_100%)]";

function mapAccent(type: string) {
  const palette: Record<string, string> = {
    festival:
      "bg-[radial-gradient(circle_at_15%_20%,rgba(241,123,52,0.9),transparent_20%),linear-gradient(135deg,#17313b_0%,#0b6b73_48%,#f7b267_100%)]",
    retreat:
      "bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.45),transparent_26%),linear-gradient(135deg,#255757_0%,#4d8f75_48%,#f6d8a8_100%)]",
    training:
      "bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.3),transparent_22%),linear-gradient(135deg,#2d2748_0%,#875c52_52%,#f0c38e_100%)]",
    workshop:
      "bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.28),transparent_18%),linear-gradient(135deg,#3a425d_0%,#0f7c82_55%,#edd6a1_100%)]",
  };

  return palette[type] ?? GENERIC_ACCENT_GRADIENT;
}

export function mapEventRow(row: SupabaseEventRow): EventListItem {
  return {
    id: row.id,
    shortId: row.short_id,
    slug: `${row.short_id}-${slugify(row.title)}`,
    title: row.title,
    description: row.description,
    type: row.type,
    startDate: row.start_date,
    endDate: row.end_date,
    city: row.city,
    country: row.country,
    imageUrl: row.image_url,
    accentClass: mapAccent(row.type),
    lat: row.lat,
    lng: row.lng,
    discipline: row.discipline ?? [],
    cancelled: row.cancelled,
  };
}

export const LINK_CANONICAL_ORDER: Record<string, number> = {
  // Event link order (unchanged from original)
  website: 0, registration: 1, info_pack: 2, schedule: 3,
  facebook_event: 4, video: 5, telegram: 6, whatsapp: 7,
  instagram: 8, youtube: 9, other: 10,
  // Social page variants — facebook profile/group sorts near instagram, not with facebook_event
  facebook: 8, facebook_page: 8, facebook_group: 8,
  telegram_group: 6, telegram_channel: 6,
  whatsapp_channel: 7,
  newsletter: 11, calendar: 12,
  // legacy aliases
  info: 2, program: 3,
};

export function linkSortKey(type: string): number {
  return LINK_CANONICAL_ORDER[type] ?? 14;
}

function normalizeLinkItems(payload: unknown): LinkItem[] {
  const rawItems =
    typeof payload === "object" && payload && "items" in payload
      ? (payload as { items?: unknown[] }).items
      : [];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  return rawItems
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const typed = item as { type?: unknown; url?: unknown; label?: unknown };
      const type = typeof typed.type === "string" ? typed.type : "website";
      const url = typeof typed.url === "string" ? typed.url : "";
      const label = typeof typed.label === "string" ? typed.label : undefined;
      if (!url) {
        return null;
      }
      return { type, url, ...(label ? { label } : {}) };
    })
    .filter((item): item is LinkItem => Boolean(item))
    .sort((a, b) => linkSortKey(a.type) - linkSortKey(b.type));
}

function normalizePriceItems(payload: unknown): PriceItem[] {
  const rawItems =
    typeof payload === "object" && payload && "items" in payload
      ? (payload as { items?: unknown[] }).items
      : [];

  if (!Array.isArray(rawItems)) {
    return [];
  }

  const items: Array<PriceItem | null> = rawItems.map((item) => {
    if (!item || typeof item !== "object") {
      return null;
    }
    const typed = item as { amount?: unknown; currency?: unknown; description?: unknown };
    return {
      amount: typeof typed.amount === "number" ? typed.amount : null,
      currency: typeof typed.currency === "string" ? typed.currency : "EUR",
      description: typeof typed.description === "string" ? typed.description : undefined,
    };
  });

  return items.filter((item): item is PriceItem => item !== null);
}

function normalizeSegments(payload: unknown): SegmentsData | null {
  if (typeof payload !== "object" || !payload || !("items" in payload)) {
    return null;
  }

  const rawItems = (payload as { items?: unknown[] }).items;
  if (!Array.isArray(rawItems) || rawItems.length === 0) {
    return null;
  }

  const items = rawItems
    .map((item): SegmentItem | null => {
      if (!item || typeof item !== "object") {
        return null;
      }
      const typed = item as {
        title?: unknown;
        start_date?: unknown;
        end_date?: unknown;
        teachers?: unknown;
        description?: unknown;
      };

      if (typeof typed.title !== "string" || !typed.title) {
        return null;
      }

      return {
        title: typed.title,
        startDate: typeof typed.start_date === "string" ? typed.start_date : undefined,
        endDate: typeof typed.end_date === "string" ? typed.end_date : undefined,
        teachers: Array.isArray(typed.teachers)
          ? typed.teachers.filter((t): t is string => typeof t === "string")
          : undefined,
        description: typeof typed.description === "string" ? typed.description : undefined,
      };
    })
    .filter((item): item is SegmentItem => item !== null);

  if (items.length === 0) return null;
  return { items };
}

function normalizePeople(rows: SupabaseProfileJoin[] | null | undefined) {
  const items: Array<{ name: string; role: string | null; slug: string | null } | null> = (
    rows ?? []
  ).map((row) => {
    const name = row.profiles?.name?.trim();
    if (!name) {
      return null;
    }
    return {
      name,
      role: row.role ?? null,
      slug: row.profiles?.slug ?? null,
    };
  });

  return items.filter(
    (item): item is { name: string; role: string | null; slug: string | null } => item !== null,
  );
}

export async function getUpcomingEvents(today: string): Promise<{ events: EventListItem[]; error: string | null }> {
  if (!hasSupabaseEnv()) {
    return {
      events: [],
      error: "Supabase environment variables are missing, so the public calendar cannot load yet.",
    };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("events")
      .select("id, short_id, title, description, type, start_date, end_date, city, country, image_url, lat, lng, discipline, cancelled")
      .eq("status", "published")
      .gte("end_date", today)
      .order("start_date", { ascending: true });

    if (error) {
      return { events: [], error: `Could not load public events: ${error.message}` };
    }

    return {
      events: ((data ?? []) as SupabaseEventRow[]).map(mapEventRow),
      error: null,
    };
  } catch (error) {
    return {
      events: [],
      error:
        error instanceof Error
          ? `Could not load public events: ${error.message}`
          : "Could not load public events.",
    };
  }
}

function getTimezoneOffset(timezone: string, date: Date) {
  try {
    const parts = new Intl.DateTimeFormat("en", {
      timeZone: timezone,
      timeZoneName: "longOffset",
    }).formatToParts(date);
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    // offset is something like "GMT+02:00" or "GMT-05:00" or "GMT"
    if (offset === "GMT") return "+00:00";
    return offset.replace("GMT", "");
  } catch {
    return "+00:00";
  }
}

export async function getEventBySlug(shortId: string): Promise<EventDetail | null> {
  if (!hasSupabaseEnv()) {
    return null;
  }

  const columns =
    "id, short_id, title, description, type, start_date, end_date, start_time, end_time, timezone, city, country, cancelled, cancelled_text, image_url, image_credit, links, price, segments, venue_id, address, contact_email, series_id, series_order, status, level, language, event_series(title)";

  // events_select_public RLS covers both 'published' and 'archived' (I-112) -- archived
  // (past) events stay publicly readable so their pages keep working for SEO + history,
  // rendered as "ended"; drafts/pending/rejected stay excluded by RLS regardless of query.
  const supabase = await createClient();
  const { data: eventRow } = await supabase
    .from("events")
    .select(columns)
    .ilike("short_id", shortId)
    .maybeSingle();

  if (!eventRow) {
    return null;
  }

  const base = mapEventRow(eventRow as unknown as SupabaseEventRow);

  let seriesSiblings: SeriesSibling[] = [];
  if (eventRow.series_id) {
    const { data: siblingsData } = await supabase
      .from("events")
      .select("id, short_id, title, type, start_date, end_date, series_order")
      .eq("series_id", eventRow.series_id)
      .eq("status", "published")
      .order("series_order", { ascending: true });

    if (siblingsData) {
      seriesSiblings = siblingsData.map((row) => ({
        id: row.id,
        shortId: row.short_id,
        slug: `${row.short_id}-${slugify(row.title)}`,
        title: row.title,
        type: row.type,
        startDate: row.start_date,
        endDate: row.end_date,
        seriesOrder: row.series_order,
      }));
    }
  }

  const [teacherResponse, organizerResponse, venueResponse] = await Promise.all([
    supabase.from("event_teachers").select("role, profiles(name, slug)").eq("event_id", eventRow.id),
    supabase.from("event_organizers").select("role, profiles(name, slug)").eq("event_id", eventRow.id),
    eventRow.venue_id
      ? supabase.from("venues").select("name, address, slug, visibility").eq("id", eventRow.venue_id).single()
      : Promise.resolve({ data: null, error: null }),
  ]);

  const linkItems = normalizeLinkItems(eventRow.links);
  const venueData = venueResponse.data as { name?: string; address?: string; slug?: string; visibility?: string } | null;

  return {
    ...base,
    startTime: eventRow.start_time,
    endTime: eventRow.end_time,
    timezone: eventRow.timezone,
    cancelledText: eventRow.cancelled_text,
    linkItems,
    priceItems: normalizePriceItems(eventRow.price),
    segments: normalizeSegments(eventRow.segments),
    teachers: normalizePeople(teacherResponse.data as SupabaseProfileJoin[] | undefined),
    organizers: normalizePeople(organizerResponse.data as SupabaseProfileJoin[] | undefined),
    venueName: venueData?.name ?? eventRow.address?.venue_name ?? null,
    venueAddress: venueData?.address ?? null,
    venueSlug: venueData?.visibility === "public" ? (venueData.slug ?? null) : null,
    contactEmail: eventRow.contact_email ?? null,
    level: eventRow.level ?? null,
    language: eventRow.language ?? [],
    primaryRegistrationUrl:
      linkItems.find((item) => item.type === "registration")?.url ?? linkItems[0]?.url ?? null,
    startDateIso: `${eventRow.start_date}T${eventRow.start_time ?? "00:00:00"}${getTimezoneOffset(
      eventRow.timezone,
      new Date(`${eventRow.start_date}T${eventRow.start_time ?? "00:00:00"}`),
    )}`,
    endDateIso: `${eventRow.end_date}T${eventRow.end_time ?? "23:59:00"}${getTimezoneOffset(
      eventRow.timezone,
      new Date(`${eventRow.end_date}T${eventRow.end_time ?? "23:59:00"}`),
    )}`,
    seriesName: Array.isArray(eventRow.event_series)
      ? (eventRow.event_series[0] as { title?: string } | null)?.title ?? null
      : (eventRow.event_series as { title?: string } | null)?.title ?? null,
    seriesSiblings,
    imageCredit: eventRow.image_credit ?? null,
    isPast: eventRow.status === "archived",
  };
}

export function parseEventSlug(value: string) {
  const shortId = value.split("-")[0];
  if (!shortId) return null;
  return { shortId };
}

export function getEventHref(event: Pick<EventListItem, "slug">) {
  return `/events/${event.slug}`;
}

// Canonical event slug from its short_id + title. `getEventBySlug` resolves by the
// short_id prefix, so the title portion is cosmetic — but keep this the single source
// of truth so dashboard/edit links match public links.
export function buildEventSlug(shortId: string, title: string) {
  return `${shortId}-${slugify(title)}`;
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

// All discipline values currently in use, for the organizer submission form's practice
// picker — deliberately checkbox-only (no free text) so the taxonomy only grows through
// admin/addevent-vetted additions, not organizer-invented categories. contact_improvisation
// is always included even if (hypothetically) no event had it, since it's the default.
export async function getKnownDisciplines(): Promise<string[]> {
  try {
    const admin = createAdminClient();
    const { data } = await admin.from("events").select("discipline").not("discipline", "is", null);
    const all = new Set<string>(["contact_improvisation"]);
    for (const row of data ?? []) {
      for (const d of (row.discipline as string[] | null) ?? []) all.add(d);
    }
    const rest = Array.from(all)
      .filter((d) => d !== "contact_improvisation")
      .sort((a, b) => disciplineLabel(a).localeCompare(disciplineLabel(b)));
    return ["contact_improvisation", ...rest];
  } catch {
    return ["contact_improvisation"];
  }
}

export function getLevelLabel(level: string): string {
  const labels: Record<string, string> = {
    all_levels: "All levels",
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    mixed: "Mixed levels",
  };
  return labels[level] ?? level;
}

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English", de: "German", fr: "French", es: "Spanish", it: "Italian",
  pt: "Portuguese", pl: "Polish", cs: "Czech", nl: "Dutch", he: "Hebrew",
  no: "Norwegian", sv: "Swedish", da: "Danish", fi: "Finnish", ru: "Russian",
  ja: "Japanese", zh: "Chinese", ko: "Korean", ar: "Arabic",
  hu: "Hungarian", sk: "Slovak", uk: "Ukrainian", ca: "Catalan", el: "Greek", lt: "Lithuanian",
};

export function getLanguageLabel(code: string): string {
  return LANGUAGE_NAMES[code] ?? code.toUpperCase();
}

export function getLinkLabel(type: string, label?: string) {
  if (label) return label;
  const labels: Record<string, string> = {
    website: "Website",
    email: "Email",
    registration: "Registration",
    info_pack: "Info pack",
    schedule: "Schedule",
    facebook: "Facebook",
    facebook_event: "Facebook event",
    facebook_page: "Facebook Page",
    facebook_group: "Facebook Group",
    video: "Video",
    telegram: "Telegram",
    telegram_group: "Telegram Group",
    telegram_channel: "Telegram Channel",
    whatsapp: "WhatsApp",
    whatsapp_channel: "WhatsApp",
    instagram: "Instagram",
    youtube: "YouTube",
    newsletter: "Newsletter",
    calendar: "Calendar",
    other: "Open link",
    // legacy — kept for any missed renames
    info: "Info pack",
    program: "Schedule",
  };
  return labels[type] ?? "Open link";
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

export function formatTimeRange(event: Pick<EventDetail, "startTime" | "endTime" | "timezone">) {
  if (!event.startTime && !event.endTime) {
    return event.timezone;
  }

  const start = event.startTime ? event.startTime.slice(0, 5) : "TBA";
  const end = event.endTime ? event.endTime.slice(0, 5) : "TBA";
  if (event.startTime && event.endTime && event.startTime !== event.endTime) {
    return `Starts ${start} first day · ends ${end} last day (${event.timezone})`;
  }
  return `${start}${event.endTime ? ` - ${end}` : ""} (${event.timezone})`;
}

export function formatPriceLabel(item: PriceItem) {
  if (typeof item.amount !== "number") {
    return item.currency;
  }

  const normalizedAmount = item.amount / 100;
  return new Intl.NumberFormat("en", {
    style: "currency",
    currency: item.currency,
    maximumFractionDigits: normalizedAmount % 1 === 0 ? 0 : 2,
  }).format(normalizedAmount);
}

export function getOgImageStyle(type: string) {
  return `${mapAccent(type)} bg-cover bg-center`;
}

export async function getAllPublishedEventSlugs(): Promise<string[]> {
  if (!hasSupabaseEnv()) {
    return [];
  }

  try {
    const supabase = await createClient();
    const today = new Date().toISOString().split("T")[0];
    const { data, error } = await supabase
      .from("events")
      .select("short_id, title")
      .eq("status", "published")
      .gte("end_date", today);

    if (error || !data) {
      return [];
    }

    return data.map((row: { short_id: string; title: string }) =>
      `${row.short_id}-${slugify(row.title)}`
    );
  } catch {
    return [];
  }
}
