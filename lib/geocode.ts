// Server-side geocoding for event/venue addresses typed into admin/organizer forms —
// same source (OpenStreetMap Nominatim, free, no key) as the addvenue skill's manual
// lookup. Never called from the client: Nominatim's usage policy wants a descriptive
// User-Agent and courteous request volume, both easier to guarantee server-side.
const NOMINATIM_USER_AGENT = "CITreasureHunt/1.0 (https://citreasurehunt.com)";
const TIMEOUT_MS = 8_000;

export async function geocodeAddress(query: string): Promise<{ lat: number; lng: number } | null> {
  const trimmed = query.trim();
  if (!trimmed) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(trimmed)}&format=json&limit=1`,
      {
        headers: { "User-Agent": NOMINATIM_USER_AGENT },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    );
    if (!response.ok) return null;
    const results = (await response.json()) as Array<{ lat?: string; lon?: string }>;
    const first = results[0];
    if (!first?.lat || !first?.lon) return null;

    const lat = Number.parseFloat(first.lat);
    const lng = Number.parseFloat(first.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
  } catch {
    return null;
  }
}

/**
 * Geocode an event's location, trying the full address first and falling back to a
 * city-level approximation (same fallback the addvenue skill uses manually) — never
 * blocks the caller, just returns null on total failure.
 */
export async function geocodeEventLocation(
  venueName: string,
  city: string,
  country: string,
): Promise<{ lat: number; lng: number } | null> {
  const parts = [venueName.trim(), city.trim(), country.trim()].filter(Boolean);
  if (parts.length < 2) return null; // need at least city + country to mean anything

  const full = await geocodeAddress(parts.join(", "));
  if (full) return full;

  if (venueName.trim() && city.trim() && country.trim()) {
    return geocodeAddress(`${city.trim()}, ${country.trim()}`);
  }
  return null;
}

/**
 * Shared venue_id/address/lat/lng resolution for the organizer and admin event forms
 * (2026-07-22 — venue accumulation feature). A linked venue is always authoritative: its
 * own lat/lng wins and the free-text address is cleared (the venue join supplies the
 * display name instead, see lib/events.ts). With no venue link, falls back to geocoding
 * the free text — but only when there isn't already a real venue link or coordinates to
 * protect (`isUpdate` + `current`), so editing an unrelated field on an /addevent-sourced
 * event never clobbers its accurate coordinates.
 */
export async function resolveVenueLocation(
  // Accepts either the browser/server Supabase client or the admin client — both differ in
  // generic instantiation depending on call site, so this is intentionally untyped rather
  // than fighting each caller's specific SupabaseClient<...> shape for a two-column lookup.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  venueId: string | null,
  venueName: string,
  city: string,
  country: string,
  current?: { lat: number | null; lng: number | null; venue_id: string | null } | null,
): Promise<{ venue_id: string | null; address: { venue_name: string } | null; lat?: number; lng?: number }> {
  if (venueId) {
    const { data: venue } = await supabase
      .from("venues")
      .select("id, lat, lng")
      .eq("id", venueId)
      .maybeSingle();
    const v = venue as { lat: number | null; lng: number | null } | null;
    return {
      venue_id: venueId,
      address: null,
      ...(v?.lat != null && v?.lng != null ? { lat: v.lat, lng: v.lng } : {}),
    };
  }

  const address = venueName.trim() ? { venue_name: venueName.trim() } : null;
  // No current row (create path) → always geocode. With a current row (update path):
  // only geocode if a venue link is being removed, or there was never any coordinate.
  const shouldGeocode = !current || current.venue_id != null || (current.lat == null && current.lng == null);
  const coords = shouldGeocode ? await geocodeEventLocation(venueName, city, country) : null;

  return { venue_id: null, address, ...(coords ? { lat: coords.lat, lng: coords.lng } : {}) };
}
