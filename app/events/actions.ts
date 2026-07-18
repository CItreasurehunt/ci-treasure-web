"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { buildEventSlug } from "@/lib/events";
import { rehostExternalImage } from "@/lib/rehost-image";
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

type ActionResult = { success: boolean; error?: string; slug?: string; warning?: string };

// Columns written from the organizer form. Status is handled separately so an
// organizer can never set it directly. imageUrl is resolved separately (see
// resolveEventImage, I-126) rather than read straight off data.imageUrl, since a pasted
// external URL needs to be rehosted first.
function eventColumns(data: OrganizerEventFormData, imageUrl: string | null) {
  return {
    title: data.title.trim(),
    type: data.type,
    start_date: data.startDate,
    end_date: data.endDate,
    timezone: data.timezone.trim(),
    city: data.city.trim(),
    country: normalizeCountry(data.country),
    description: data.description.trim() || null,
    image_url: imageUrl,
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

// I-126: organizers paste a URL, not upload a file — this intercepts it server-side and
// stores our own copy instead of leaving events.image_url pointing at an organizer-pasted
// external link that can rot/expire. Non-fatal on failure: the event still saves, just
// without an image, surfaced as a warning rather than blocking the submission.
async function resolveEventImage(rawUrl: string): Promise<{ imageUrl: string | null; warning?: string }> {
  const trimmed = rawUrl.trim();
  if (!trimmed) {
    return { imageUrl: null };
  }
  const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.jpg`;
  const result = await rehostExternalImage(trimmed, "event-images", path);
  if ("error" in result) {
    console.error("Event image rehost failed:", result.error);
    return {
      imageUrl: null,
      warning: "We couldn't process that image link — your event was saved without an image. You can add one from the edit page.",
    };
  }
  return { imageUrl: result.url };
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

  const { imageUrl, warning } = await resolveEventImage(data.imageUrl);

  // Insert as pending. short_id is filled by the generate_short_id() DB trigger.
  const { data: inserted, error: insertError } = await supabase
    .from("events")
    .insert({
      ...eventColumns(data, imageUrl),
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
    revalidatePath("/");
  } else {
    notifyAdminNewEvent(inserted.title, user.email ?? "unknown").catch(() => {});
  }

  revalidatePath("/dashboard");
  return { success: true, slug: buildEventSlug(inserted.short_id, inserted.title), warning };
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

  const { imageUrl, warning } = await resolveEventImage(data.imageUrl);

  // RLS (events_update) enforces that the user owns or is linked to this event.
  // Status is intentionally not touched — published stays published.
  const { data: updated, error } = await supabase
    .from("events")
    .update({ ...eventColumns(data, imageUrl), updated_by: user.id })
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
  // Cached ISR pages (homepage list, this event's own detail page) won't
  // otherwise pick up an organizer edit for up to an hour — revalidate both
  // immediately, same as the admin edit API route.
  revalidatePath("/");
  revalidatePath(`/events/${buildEventSlug(updated.short_id, updated.title)}`);
  return { success: true, slug: buildEventSlug(updated.short_id, updated.title), warning };
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
