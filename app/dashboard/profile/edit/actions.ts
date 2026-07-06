"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateData = {
  bio: string;
  city: string;
  country: string;
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  telegram: string;
  newsletter: string;
  public_email: string;
};

function normalizeInstagram(value: string): string {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  return `https://instagram.com/${handle}`;
}

function normalizeTelegram(value: string): string {
  if (!value) return "";
  if (value.startsWith("http")) return value;
  const handle = value.replace(/^@/, "");
  return `https://t.me/${handle}`;
}

export async function updateProfile(data: ProfileUpdateData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  // Convert empty strings to null for optional fields so DB stays clean
  const nullIfEmpty = (v: string) => v.trim() === "" ? null : v.trim();

  const normalizedData = {
    bio:          nullIfEmpty(data.bio),
    city:         nullIfEmpty(data.city),
    country:      nullIfEmpty(data.country),
    website:      nullIfEmpty(data.website),
    facebook:     nullIfEmpty(data.facebook),
    instagram:    nullIfEmpty(normalizeInstagram(data.instagram)),
    youtube:      nullIfEmpty(data.youtube),
    telegram:     nullIfEmpty(normalizeTelegram(data.telegram)),
    newsletter:   nullIfEmpty(data.newsletter),
    public_email: nullIfEmpty(data.public_email),
    updated_at:   new Date().toISOString(),
  };

  const { data: updated, error } = await supabase
    .from("profiles")
    .update(normalizedData)
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile/edit");
  if (updated?.slug) {
    revalidatePath(`/teachers/${updated.slug}`);
  }

  return { success: true };
}
