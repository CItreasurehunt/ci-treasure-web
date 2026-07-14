"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ProfileUpdateData = {
  bio: string;
  city: string;
  country: string;
  is_nomadic: boolean;
  website: string;
  facebook: string;
  instagram: string;
  youtube: string;
  telegram: string;
  newsletter: string;
  public_email: string;
  is_organizer: boolean;
  is_teacher: boolean;
  is_musician: boolean;
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

  const { data: ownProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!ownProfile) {
    return { success: false, error: "Profile not found" };
  }

  // Re-derive locked roles server-side rather than trusting the client's booleans directly —
  // a role backed by a real event_organizers/event_teachers row must never be turned off,
  // regardless of what a direct (UI-bypassing) call sends.
  const [{ data: organizerLinks }, { data: teacherLinks }] = await Promise.all([
    supabase.from("event_organizers").select("id").eq("organizer_id", ownProfile.id).limit(1),
    supabase.from("event_teachers").select("role").eq("teacher_id", ownProfile.id),
  ]);
  const lockedOrganizer = Boolean(organizerLinks?.length);
  const lockedMusician = Boolean(teacherLinks?.some((t) => t.role === "musician"));
  const lockedTeacher = Boolean(teacherLinks?.some((t) => t.role !== "musician"));

  // Convert empty strings to null for optional fields so DB stays clean
  const nullIfEmpty = (v: string) => v.trim() === "" ? null : v.trim();

  // Belt-and-suspenders alongside the DB check constraint: never send a populated city/country
  // alongside is_nomadic=true, regardless of what the client sent.
  const normalizedData = {
    bio:          nullIfEmpty(data.bio),
    city:         data.is_nomadic ? null : nullIfEmpty(data.city),
    country:      data.is_nomadic ? null : nullIfEmpty(data.country),
    is_nomadic:   data.is_nomadic,
    website:      nullIfEmpty(data.website),
    facebook:     nullIfEmpty(data.facebook),
    instagram:    nullIfEmpty(normalizeInstagram(data.instagram)),
    youtube:      nullIfEmpty(data.youtube),
    telegram:     nullIfEmpty(normalizeTelegram(data.telegram)),
    newsletter:   nullIfEmpty(data.newsletter),
    public_email: nullIfEmpty(data.public_email),
    is_organizer: data.is_organizer || lockedOrganizer,
    is_teacher:   data.is_teacher || lockedTeacher,
    is_musician:  data.is_musician || lockedMusician,
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

// Admin group topic for profile deactivations + deletion requests (env-overridable).
const DELETIONS_THREAD_ID = Number(process.env.TELEGRAM_DELETIONS_THREAD_ID ?? 702);

// No profile name here by design, same reasoning as the claims notifier — a nudge to go
// look, not a record of who did what, avoids putting personal data in Telegram.
async function notifyAdminDeletions(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: DELETIONS_THREAD_ID,
      text: message,
      link_preview_options: { is_disabled: true },
    }),
  });
}

export async function setProfileDeactivated(deactivated: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: updated, error } = await supabase
    .from("profiles")
    .update({ visibility: deactivated ? "deactivated" : "public", updated_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .select("slug")
    .single();

  if (error) {
    return { success: false, error: error.message };
  }

  if (deactivated) {
    notifyAdminDeletions("🙈 A profile was deactivated (self-service).").catch(() => {});
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile/edit");
  if (updated?.slug) {
    revalidatePath(`/teachers/${updated.slug}`);
  }

  return { success: true };
}

export async function requestProfileDeletion() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ deletion_requested_at: new Date().toISOString() })
    .eq("user_id", user.id);

  if (error) {
    return { success: false, error: error.message };
  }

  notifyAdminDeletions("🗑️ A profile requested permanent deletion.").catch(() => {});

  revalidatePath("/dashboard/profile/edit");
  return { success: true };
}
