import { createClient } from "@/lib/supabase/server";
import { mapEventRow, SupabaseEventRow, LinkItem } from "./events";

function normalizeAddress(raw: unknown): string | null {
  if (!raw) return null;
  if (typeof raw === "string") return raw;
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

  const { data: past, error: pastError } = await supabase
    .from("events")
    .select(EVENT_COLS)
    .eq("venue_id", venueId)
    .eq("status", "published")
    .lt("end_date", today)
    .order("start_date", { ascending: false });

  if (upcomingError) console.error("Error fetching upcoming venue events:", upcomingError);
  if (pastError) console.error("Error fetching past venue events:", pastError);

  return {
    upcoming: ((upcoming ?? []) as SupabaseEventRow[]).map(mapEventRow),
    past: ((past ?? []) as SupabaseEventRow[]).map(mapEventRow),
  };
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
