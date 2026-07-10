import { NextResponse, type NextRequest } from "next/server";

import { requireAdminRequestUser } from "@/lib/admin-api";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";

async function createUniqueSlug(baseSlug: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("slug")
    .ilike("slug", `${baseSlug}%`);

  if (error) {
    throw error;
  }

  const existing = new Set((data ?? []).map((row) => String(row.slug).toLowerCase()));
  if (!existing.has(baseSlug)) {
    return baseSlug;
  }

  let suffix = 2;
  while (existing.has(`${baseSlug}-${suffix}`)) {
    suffix += 1;
  }
  return `${baseSlug}-${suffix}`;
}

export async function POST(request: NextRequest) {
  try {
    await requireAdminRequestUser(request);
    const payload = await request.json();
    const name = String(payload.name ?? "").trim();
    const kind = payload.kind === "organizer" ? "organizer" : "teacher";

    if (!name) {
      return NextResponse.json({ error: "Name is required." }, { status: 400 });
    }

    const supabase = createAdminClient();
    const slug = await createUniqueSlug(slugify(name) || "profile");
    const insertPayload = {
      name,
      slug,
      is_organizer: kind === "organizer",
      is_teacher: kind === "teacher",
      source: "manual",
      visibility: "public",
    };

    const { data, error } = await supabase
      .from("profiles")
      .insert(insertPayload)
      .select("id, name, slug")
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ profile: data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not create profile." },
      { status: 500 },
    );
  }
}
