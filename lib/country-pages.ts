import { createClient as createStaticClient } from "@/lib/supabase/static";
import { getCountryLabel, type EventListItem } from "@/lib/event-display";
import { mapEventRow, slugify, type SupabaseEventRow } from "@/lib/events";

function hasSupabaseEnv() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export type CountrySummary = {
  iso: string;
  slug: string;
  label: string;
  summaryText: string;
};

export type CountryCommunity = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  website: string | null;
  lat: number | null;
  lng: number | null;
};

export type CountryTeacher = {
  id: string;
  name: string;
  slug: string;
  city: string | null;
  bio: string | null;
  imageUrl: string | null;
};

export type CountryVenue = {
  id: string;
  name: string;
  slug: string;
  city: string;
  description: string | null;
  imageUrl: string | null;
  lat: number | null;
  lng: number | null;
};

// Unified shape for the combined map — events/venues/communities are all place-like (you can
// go there, join it, attend it), unlike teachers, which is why the map stays a three-type
// layer and doesn't try to plot individual people. See docs/issues/i-132-country-pages.md for
// the reasoning on why teacher coordinates were deliberately not added.
export type CountryMapMarker = {
  id: string;
  type: "event" | "venue" | "community";
  title: string;
  href: string;
  lat: number;
  lng: number;
};

export type CountryPageData = {
  iso: string;
  slug: string;
  label: string;
  summaryText: string;
  nationalCommunities: CountryCommunity[];
  communities: CountryCommunity[];
  teachers: CountryTeacher[];
  events: EventListItem[];
  venues: CountryVenue[];
  mapMarkers: CountryMapMarker[];
};

// Every country page requires a row here — this is the "minimum entity threshold before
// publishing" gate from the I-132 spec, enforced in practice: no reviewed summary, no static
// page. Reused for both generateStaticParams (which countries get pages) and slug resolution
// (which iso a given /[slug] request maps to).
async function getAllCountrySummaries(): Promise<CountrySummary[]> {
  if (!hasSupabaseEnv()) return [];
  const supabase = createStaticClient();
  const { data, error } = await supabase.from("country_summaries").select("iso, summary_text");
  if (error || !data) return [];
  return data.map((row) => ({
    iso: row.iso,
    slug: slugify(getCountryLabel(row.iso)),
    label: getCountryLabel(row.iso),
    summaryText: row.summary_text,
  }));
}

export async function getAllCountrySlugs(): Promise<string[]> {
  const summaries = await getAllCountrySummaries();
  return summaries.map((s) => s.slug);
}

async function resolveCountryBySlug(slug: string): Promise<CountrySummary | null> {
  const summaries = await getAllCountrySummaries();
  return summaries.find((s) => s.slug === slug) ?? null;
}

export async function getCountryPageData(slug: string): Promise<CountryPageData | null> {
  if (!hasSupabaseEnv()) return null;

  const summary = await resolveCountryBySlug(slug);
  if (!summary) return null;

  const supabase = createStaticClient();
  const today = new Date().toISOString().split("T")[0];

  const EVENT_COLS =
    "id, short_id, title, description, type, start_date, end_date, city, country, image_url, lat, lng, discipline, cancelled";

  const [{ data: communityRows }, { data: teacherRows }, { data: eventRows }, { data: venueRows }] =
    await Promise.all([
      supabase
        .from("communities")
        .select("id, name, slug, city, website, lat, lng")
        .eq("country", summary.iso)
        .is("deleted_at", null)
        .order("name"),
      supabase
        .from("profiles")
        .select("id, name, slug, city, bio, image_url")
        .eq("country", summary.iso)
        .eq("visibility", "public")
        .eq("is_teacher", true)
        .order("name"),
      supabase
        .from("events")
        .select(EVENT_COLS)
        .eq("country", summary.iso)
        .eq("status", "published")
        .gte("end_date", today)
        .order("start_date", { ascending: true }),
      supabase
        .from("venues")
        .select("id, name, slug, city, description, image_url, lat, lng")
        .eq("country", summary.iso)
        .eq("visibility", "public")
        .order("name"),
    ]);

  const allCommunities = (communityRows ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    city: c.city,
    website: c.website,
    lat: c.lat,
    lng: c.lng,
  }));

  // National community spotlight: communities with a website on file are shown separately,
  // above the general list — see I-132 spec's "Canada/Switzerland/Dutch communities have
  // their own site" case. Not always populated (e.g. Sweden currently has none), in which
  // case this section is simply omitted by the page.
  const nationalCommunities = allCommunities.filter((c) => c.website);
  const communities = allCommunities.filter((c) => !c.website);

  const teachers = (teacherRows ?? []).map((t) => ({
    id: t.id,
    name: t.name,
    slug: t.slug,
    city: t.city,
    bio: t.bio,
    imageUrl: t.image_url,
  }));

  const events = ((eventRows ?? []) as SupabaseEventRow[]).map(mapEventRow);

  const venues = (venueRows ?? []).map((v) => ({
    id: v.id,
    name: v.name,
    slug: v.slug,
    city: v.city,
    description: v.description,
    imageUrl: v.image_url,
    lat: v.lat,
    lng: v.lng,
  }));

  const mapMarkers: CountryMapMarker[] = [
    ...events
      .filter((e): e is typeof e & { lat: number; lng: number } => typeof e.lat === "number" && typeof e.lng === "number")
      .map((e) => ({ id: e.id, type: "event" as const, title: e.title, href: `/events/${e.slug}`, lat: e.lat, lng: e.lng })),
    ...venues
      .filter((v): v is typeof v & { lat: number; lng: number } => typeof v.lat === "number" && typeof v.lng === "number")
      .map((v) => ({ id: v.id, type: "venue" as const, title: v.name, href: `/venues/${v.slug}`, lat: v.lat, lng: v.lng })),
    ...allCommunities
      .filter((c): c is typeof c & { lat: number; lng: number } => typeof c.lat === "number" && typeof c.lng === "number")
      .map((c) => ({ id: c.id, type: "community" as const, title: c.name, href: `/communities/${c.slug}`, lat: c.lat, lng: c.lng })),
  ];

  return {
    iso: summary.iso,
    slug: summary.slug,
    label: summary.label,
    summaryText: summary.summaryText,
    nationalCommunities,
    communities,
    teachers,
    events,
    venues,
    mapMarkers,
  };
}
