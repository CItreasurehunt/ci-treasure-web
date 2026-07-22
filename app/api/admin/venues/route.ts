import { NextResponse, type NextRequest } from "next/server";

import { requireAdminRequestUser } from "@/lib/admin-api";
import { geocodeAddress } from "@/lib/geocode";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

async function createUniqueSlug(baseSlug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("venues").select("slug").ilike("slug", `${baseSlug}%`);
  if (error) throw error;

  const existing = new Set((data ?? []).map((row) => String(row.slug).toLowerCase()));
  if (!existing.has(baseSlug)) return baseSlug;

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) suffix += 1;
  return `${baseSlug}-${suffix}`;
}

// Admin-only inline venue creation from the event form — deliberately not exposed to the
// organizer-facing form (which only gets search+select, see app/api/venues/search). A
// venue record carries a visibility tier / show_in_list curation call the addvenue skill
// makes deliberately (dedicated space vs. one-off rental, website required for 'public') —
// this quick path skips that research, so it always lands as 'hidden' (linkable for
// event/map purposes, no public detail page) rather than guessing a tier. An admin can
// upgrade it properly later via /addvenue if it turns out to be a recurring space worth it.
export async function POST(request: NextRequest) {
  try {
    await requireAdminRequestUser(request);
    const payload = await request.json();
    const name = String(payload.name ?? "").trim();
    const city = String(payload.city ?? "").trim();
    const country = String(payload.country ?? "").trim();
    const address = String(payload.address ?? "").trim();

    if (!name || !city || !country) {
      return NextResponse.json({ error: "Name, city, and country are required." }, { status: 400 });
    }

    const coords = await geocodeAddress([address || name, city, country].filter(Boolean).join(", "));

    const supabase = createAdminClient();
    const slug = await createUniqueSlug(slugify(name) || "venue");
    const { data, error } = await supabase
      .from("venues")
      .insert({
        name,
        slug,
        city,
        country,
        address: address || null,
        lat: coords?.lat ?? null,
        lng: coords?.lng ?? null,
        visibility: "hidden",
        show_in_list: false,
        show_in_announce: false,
      })
      .select("id, name, city, country, lat, lng")
      .single();
    if (error) throw error;

    return NextResponse.json({ venue: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create venue." },
      { status: 500 },
    );
  }
}
