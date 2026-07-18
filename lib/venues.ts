import { createClient } from "@/lib/supabase/server";
import { createClient as createStaticClient } from "@/lib/supabase/static";
import { mapEventRow, SupabaseEventRow, LinkItem, getLinkLabel, linkSortKey } from "./events";

function normalizeAddress(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    if (raw.trimStart().startsWith("{")) {
      try { return normalizeAddress(JSON.parse(raw)); } catch { /* fall through */ }
    }
    return raw;
  }
  if (typeof raw === "object" && raw !== null) {
    const obj = raw as Record<string, unknown>;
    const text = obj.full ?? obj.text ?? obj.venue_name ?? null;
    return typeof text === "string" ? text : null;
  }
  return null;
}

export type Venue = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  region: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  website: string | null;
  imageUrl: string | null;
  imageCredit: string | null;
  email: string | null;
  newsletter: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  links: { items: LinkItem[] } | null;
};

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getVenueBySlug(slug: string): Promise<Venue | null> {
  if (!hasSupabaseEnv()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("slug", slug)
    .eq("visibility", "public")
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    city: data.city,
    country: data.country,
    region: data.region,
    address: normalizeAddress(data.address),
    lat: data.lat,
    lng: data.lng,
    description: data.description,
    website: data.website,
    imageUrl: data.image_url,
    imageCredit: data.image_credit ?? null,
    email: data.email,
    newsletter: data.newsletter,
    instagram: data.instagram,
    facebook: data.facebook,
    youtube: data.youtube,
    links: data.links,
  };
}

export async function getVenueEvents(venueId: string) {
  if (!hasSupabaseEnv()) return { upcoming: [], past: [] };

  const supabase = await createClient();
  const today = new Date().toISOString().split("T")[0];

  const EVENT_COLS = "id, short_id, title, description, type, start_date, end_date, start_time, end_time, timezone, city, country, cancelled, cancelled_text, image_url, links, price, segments, venue_id, lat, lng";

  const { data: upcoming, error: upcomingError } = await supabase
    .from("events")
    .select(EVENT_COLS)
    .eq("venue_id", venueId)
    .eq("status", "published")
    .gte("end_date", today)
    .order("start_date", { ascending: true });

  // Past events transition to status='archived' once their end_date passes (confirmed:
  // zero 'published' rows have a past end_date). events_select_public RLS covers both
  // 'published' and 'archived' (I-112), so the normal session client sees these directly.
  const { data: past, error: pastError } = await supabase
    .from("events")
    .select(EVENT_COLS)
    .eq("venue_id", venueId)
    .eq("status", "archived")
    .eq("hide", false)
    .lt("end_date", today)
    .order("start_date", { ascending: false });

  if (upcomingError) console.error("Error fetching upcoming venue events:", upcomingError);
  if (pastError) console.error("Error fetching past venue events:", pastError);

  return {
    upcoming: ((upcoming ?? []) as SupabaseEventRow[]).map(mapEventRow),
    past: ((past ?? []) as SupabaseEventRow[]).map(mapEventRow),
  };
}

export type VenueLinkItem = { type: string; url: string; label: string };

export type VenueListItem = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string; // display label, e.g. "Germany"
  countryIso: string;
  description: string | null;
  website: string | null;
  imageUrl: string | null;
  // Community-channel-style links (telegram, whatsapp, signal, facebook group, etc.) —
  // "website" is excluded here since it's already broken out above.
  channelLinks: VenueLinkItem[];
};

export type VenuesResponse = {
  venues: VenueListItem[];
  countries: Array<{ value: string; label: string }>;
  venueCount: number;
  countryCount: number;
  error: string | null;
};

const venueCountryNames = new Intl.DisplayNames(["en"], { type: "region" });

function venueCountryLabel(iso: string): string {
  try {
    return venueCountryNames.of(iso) ?? iso;
  } catch {
    return iso;
  }
}

function ensureHttps(url: string): string {
  return url.startsWith("http") ? url : `https://${url}`;
}

type VenueListRow = {
  id: string;
  name: string;
  slug: string;
  city: string;
  country: string;
  description: string | null;
  website: string | null;
  image_url: string | null;
  instagram: string | null;
  facebook: string | null;
  youtube: string | null;
  links: { items: LinkItem[] } | null;
};

function toVenueListItem(row: VenueListRow): VenueListItem {
  const rawItems = (row.links?.items ?? []).filter((item) => item.type !== "website");
  // instagram/facebook/youtube live in their own columns, not the links jsonb — fold them
  // into the same channel-link list so the card only needs one loop.
  if (row.instagram) rawItems.push({ type: "instagram", url: row.instagram });
  if (row.facebook) rawItems.push({ type: "facebook", url: row.facebook });
  if (row.youtube) rawItems.push({ type: "youtube", url: row.youtube });

  const channelLinks = rawItems
    .map((item) => ({
      type: item.type,
      url: ensureHttps(item.url),
      label: getLinkLabel(item.type, item.label),
    }))
    .sort((a, b) => linkSortKey(a.type) - linkSortKey(b.type));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city,
    country: venueCountryLabel(row.country),
    countryIso: row.country,
    description: row.description,
    website: row.website ? ensureHttps(row.website) : null,
    imageUrl: row.image_url,
    channelLinks,
  };
}

export async function getVenues(): Promise<VenuesResponse> {
  try {
    // Static (cookie-free) client — see getUpcomingEvents() in lib/events.ts
    // for why: this public listing has no auth-dependent RLS branch, and the
    // cookie-aware client would force dynamic rendering on every request.
    const supabase = createStaticClient();
    const { data, error } = await supabase
      .from("venues")
      .select("id,name,slug,city,country,description,website,image_url,instagram,facebook,youtube,links")
      .eq("visibility", "public")
      .eq("show_in_list", true)
      .order("country")
      .order("name");

    if (error) throw new Error(error.message);

    const venues = (data as unknown as VenueListRow[]).map(toVenueListItem);

    const isoToLabel = new Map<string, string>();
    for (const v of venues) isoToLabel.set(v.countryIso, v.country);
    const countries = Array.from(isoToLabel.entries())
      .sort((a, b) => a[1].localeCompare(b[1]))
      .map(([value, label]) => ({ value, label }));

    return {
      venues,
      countries,
      venueCount: venues.length,
      countryCount: countries.length,
      error: null,
    };
  } catch (error) {
    return {
      venues: [],
      countries: [],
      venueCount: 0,
      countryCount: 0,
      error:
        error instanceof Error ? error.message : "Failed to load venues. Please try again later.",
    };
  }
}

export async function getAllVenueSlugs(): Promise<string[]> {
  if (!hasSupabaseEnv()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("venues")
    .select("slug")
    .eq("visibility", "public");
  if (error || !data) return [];
  return data.map((v) => v.slug);
}
