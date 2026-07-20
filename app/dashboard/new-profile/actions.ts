"use server";

import { redirect } from "next/navigation";

import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export type SimilarProfile = {
  id: string;
  name: string;
  slug: string;
  bioSnippet: string | null;
  visibility: string;
};

// Advisory only — never blocks creation. Backs the "similar profiles already exist" warning
// so someone doesn't accidentally create a duplicate of a profile that's already listed
// (including shadow profiles, which search_similar_profiles can see but a normal session can't).
export async function checkSimilarProfiles(name: string): Promise<SimilarProfile[]> {
  if (name.trim().length < 3) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("search_similar_profiles", { p_name: name.trim() });

  return (data ?? []).map((p: { id: string; name: string; slug: string; bio_snippet: string | null; visibility: string }) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    bioSnippet: p.bio_snippet,
    visibility: p.visibility,
  }));
}

// Find a unique slug (idx_profiles_slug is UNIQUE on lower(slug)).
async function uniqueProfileSlug(admin: ReturnType<typeof createAdminClient>, name: string) {
  const base = slugify(name) || "profile";
  let candidate = base;
  for (let i = 2; i < 100; i += 1) {
    const { data } = await admin
      .from("profiles")
      .select("id")
      .ilike("slug", candidate)
      .maybeSingle();
    if (!data) {
      return candidate;
    }
    candidate = `${base}-${i}`;
  }
  // Extremely unlikely fallback: suffix with a random token.
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

export async function createProfile(input: {
  name: string;
  website: string;
  isOrganizer: boolean;
  isTeacher: boolean;
  isMusician: boolean;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth?next=/dashboard/new-profile");
  }

  // Guard: one profile per user.
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (existing) {
    redirect("/dashboard");
  }

  const name = input.name.trim();
  if (!name) {
    return { success: false, error: "Name is required." };
  }

  const admin = createAdminClient();
  const slug = await uniqueProfileSlug(admin, name);

  const { error } = await admin.from("profiles").insert({
    name,
    slug,
    website: input.website.trim() || null,
    user_id: user.id,
    visibility: "public",
    source: "self_submitted",
    is_organizer: input.isOrganizer,
    is_teacher: input.isTeacher,
    is_musician: input.isMusician,
    is_trusted: false,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  return { success: true };
}
