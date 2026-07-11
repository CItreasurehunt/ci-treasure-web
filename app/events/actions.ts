"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildEventSlug } from "@/lib/events";
import {
  normalizeCountry,
  normalizeJsonItems,
  parseCsvArray,
  parseLinkItems,
  parsePriceItems,
  validateOrganizerEvent,
  type OrganizerEventFormData,
} from "@/lib/organizer-events";
import { createClient } from "@/lib/supabase/server";

type ActionResult = { success: boolean; error?: string; slug?: string };

// Columns written from the organizer form. Status is handled separately so an
// organizer can never set it directly.
function eventColumns(data: OrganizerEventFormData) {
  return {
    title: data.title.trim(),
    type: data.type,
    start_date: data.startDate,
    end_date: data.endDate,
    timezone: data.timezone.trim(),
    city: data.city.trim(),
    country: normalizeCountry(data.country),
    description: data.description.trim() || null,
    image_url: data.imageUrl.trim() || null,
    level: data.level || null,
    language: parseCsvArray(data.languages),
    features: parseCsvArray(data.features),
    // Real, user-controlled field (checkbox picker, validated non-empty) — safe to share
    // between create and edit, unlike a silent auto-default would be.
    discipline: data.discipline,
    cancelled: data.cancelled,
    cancelled_text: data.cancelled ? data.cancelledText.trim() || "" : null,
    price: normalizeJsonItems(parsePriceItems(data.priceItems ?? [])),
    links: normalizeJsonItems(parseLinkItems(data.linkItems ?? [])),
  };
}

export async function createEvent(data: OrganizerEventFormData): Promise<ActionResult> {
  const validationError = validateOrganizerEvent(data, { enforceMinDuration: true });
  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You are not signed in." };
  }

  // Must own a profile to submit — this is the organizer link + trust flag.
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, is_trusted")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    return { success: false, error: "Claim or create your profile before submitting events." };
  }

  // Insert as pending. short_id is filled by the generate_short_id() DB trigger.
  const { data: inserted, error: insertError } = await supabase
    .from("events")
    .insert({
      ...eventColumns(data),
      status: "pending",
      source: "self_submitted",
      user_id: user.id,
      updated_by: user.id,
    })
    .select("id, short_id, title")
    .single();
  if (insertError || !inserted) {
    return { success: false, error: insertError?.message ?? "Could not create event." };
  }

  // Link the organizer's profile as lead (roles are always 'lead').
  const { error: linkError } = await supabase.from("event_organizers").insert({
    event_id: inserted.id,
    organizer_id: profile.id,
    role: "lead",
  });
  if (linkError) {
    // Non-fatal: event exists and is in the admin queue; admin can fix the link.
    console.error("event_organizers link failed:", linkError.message);
  }

  // Trusted organizers auto-publish. The announce Edge Function fires on the
  // pending→published UPDATE (not on INSERT), so publish via a follow-up update.
  if (profile.is_trusted) {
    const admin = createAdminClient();
    await admin.from("events").update({ status: "published" }).eq("id", inserted.id);
  } else {
    notifyAdminNewEvent(inserted.title, user.email ?? "unknown").catch(() => {});
  }

  revalidatePath("/dashboard");
  return { success: true, slug: buildEventSlug(inserted.short_id, inserted.title) };
}

export async function updateEvent(
  eventId: string,
  data: OrganizerEventFormData,
): Promise<ActionResult> {
  const validationError = validateOrganizerEvent(data);
  if (validationError) {
    return { success: false, error: validationError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You are not signed in." };
  }

  // RLS (events_update) enforces that the user owns or is linked to this event.
  // Status is intentionally not touched — published stays published.
  const { data: updated, error } = await supabase
    .from("events")
    .update({ ...eventColumns(data), updated_by: user.id })
    .eq("id", eventId)
    .select("id, short_id, title")
    .maybeSingle();

  if (error) {
    return { success: false, error: error.message };
  }
  if (!updated) {
    return { success: false, error: "You don't have permission to edit this event." };
  }

  revalidatePath("/dashboard");
  return { success: true, slug: buildEventSlug(updated.short_id, updated.title) };
}

// Admin group topic for pending-event submissions (env-overridable).
const EVENT_THREAD_ID = Number(process.env.TELEGRAM_EVENT_THREAD_ID ?? 685);

async function notifyAdminNewEvent(title: string, email: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    `🆕 New event submitted: ${title}`,
    `From: ${email}`,
    `Review: https://citreasurehunt.com/admin/events/pending`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: EVENT_THREAD_ID,
      text,
      link_preview_options: { is_disabled: true },
    }),
  });
}

export async function notifyAdminTeacherAdded(
  organizerName: string,
  teacherName: string,
  role: string,
  eventTitle: string,
  shortId: string,
) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const text = `👥 ${organizerName} added ${teacherName} as ${role} to ${eventTitle} — https://citreasurehunt.com/events/${shortId}`;

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: EVENT_THREAD_ID,
      text,
      link_preview_options: { is_disabled: true },
    }),
  });
}
