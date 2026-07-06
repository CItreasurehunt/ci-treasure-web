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

  const normalizedData = {
    ...data,
    instagram: normalizeInstagram(data.instagram),
    telegram: normalizeTelegram(data.telegram),
  };

  const { error } = await supabase
    .from("profiles")
    .update(normalizedData)
    .eq("user_id", user.id);

  if (error) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile/edit");
  // Also revalidate the public teacher page. We don't know the slug here easily,
  // but revalidatePath("/teachers/[slug]", "page") might work if supported,
  // or we just rely on the fact that teachers page is revalidated on demand or via TTL.
  // Actually, revalidatePath is usually enough for the current user's view.

  return { success: true };
}
