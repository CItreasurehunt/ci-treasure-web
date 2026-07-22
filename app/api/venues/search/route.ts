import { NextResponse, type NextRequest } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Signed-in (not admin-only) — both the organizer and admin event forms search this to let
// an organizer pick a venue that's already in the system instead of retyping an address
// (2026-07-22: venues accumulate one at a time via /addevent's own dedup-checked insert;
// this just makes the growing list selectable). Uses the admin client for the read since
// `visibility='hidden'` venues (no public page, but still valid for event linking) aren't
// covered by the public RLS select policy, and search needs to see all of them.
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    if (query.length < 2) {
      return NextResponse.json({ results: [] });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("venues")
      .select("id, name, city, country, lat, lng")
      .ilike("name", `%${query}%`)
      .order("name", { ascending: true })
      .limit(10);
    if (error) {
      throw error;
    }

    return NextResponse.json({ results: data ?? [] });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not search venues." },
      { status: 500 },
    );
  }
}
