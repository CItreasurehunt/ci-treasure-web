"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { buildEventSlug } from "@/lib/events";
import { createAdminClient } from "@/lib/supabase/admin";

// Look up the submitter's email from the event's user_id.
async function submitterEmail(admin: ReturnType<typeof createAdminClient>, userId: string | null) {
  if (!userId) return null;
  const { data } = await admin.auth.admin.getUserById(userId);
  return data?.user?.email ?? null;
}

export type PendingEventOrganizer = {
  profileId: string;
  name: string;
  isTrusted: boolean;
};

export type PendingEvent = {
  id: string;
  title: string;
  startDate: string | null;
  city: string | null;
  country: string | null;
  organizer: PendingEventOrganizer | null;
};

export async function getPendingEvents(): Promise<PendingEvent[]> {
  await requireAdminUser();
  const admin = createAdminClient();

  const { data } = await admin
    .from("events")
    .select(
      "id, title, start_date, city, country, event_organizers(role, profiles(id, name, is_trusted, user_id))",
    )
    .eq("status", "pending")
    .order("start_date", { ascending: true });

  return (data ?? []).map((event) => {
    // Prefer a claimed (user_id set) lead organizer. Supabase typegen types a
    // to-one embed as an array, but it's a single object at runtime — assert via unknown.
    const links = (event.event_organizers ?? []) as unknown as Array<{
      role: string | null;
      profiles: { id: string; name: string; is_trusted: boolean; user_id: string | null } | null;
    }>;
    const claimed = links.find((l) => l.profiles?.user_id) ?? links[0];
    const profile = claimed?.profiles ?? null;

    return {
      id: event.id as string,
      title: event.title as string,
      startDate: (event.start_date as string) ?? null,
      city: (event.city as string) ?? null,
      country: (event.country as string) ?? null,
      organizer: profile
        ? { profileId: profile.id, name: profile.name, isTrusted: profile.is_trusted }
        : null,
    };
  });
}

export async function approveEvent(eventId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("title, short_id, user_id")
    .eq("id", eventId)
    .maybeSingle();

  // pending → published fires the announce Edge Function via the UPDATE trigger.
  const { error } = await admin.from("events").update({ status: "published" }).eq("id", eventId);
  if (error) {
    return { success: false, error: error.message };
  }

  // Notify the organizer (non-fatal).
  const email = await submitterEmail(admin, event?.user_id ?? null);
  if (email && event) {
    const url = `https://citreasurehunt.com/events/${buildEventSlug(event.short_id, event.title)}`;
    const result = await sendEmail({
      to: email,
      subject: `Your event "${event.title}" is now live`,
      text: [
        `Good news — your event "${event.title}" has been approved and is now published on CI Treasure Hunt:`,
        url,
        "",
        "You can edit it anytime from your dashboard: https://citreasurehunt.com/dashboard",
        "",
        "— CI Treasure Hunt",
      ].join("\n"),
    });
    if (!result.ok) console.error("approve email failed:", result.error);
  }

  revalidatePath("/admin/events/pending");
  revalidatePath("/");
  return { success: true };
}

export async function rejectEvent(
  eventId: string,
  reason: string,
): Promise<{ success: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createAdminClient();

  const { data: event } = await admin
    .from("events")
    .select("title, user_id")
    .eq("id", eventId)
    .maybeSingle();

  const trimmedReason = reason.trim();
  const { error } = await admin
    .from("events")
    .update({ status: "rejected", admin_notes: trimmedReason || null })
    .eq("id", eventId);
  if (error) {
    return { success: false, error: error.message };
  }

  // Notify the organizer with the reason (non-fatal).
  const email = await submitterEmail(admin, event?.user_id ?? null);
  if (email && event) {
    const result = await sendEmail({
      to: email,
      subject: `Your event "${event.title}" needs changes`,
      text: [
        `Your event "${event.title}" wasn't published yet.`,
        trimmedReason ? `\nReason: ${trimmedReason}` : "",
        "",
        "You can update and resubmit it from your dashboard: https://citreasurehunt.com/dashboard",
        "",
        "— CI Treasure Hunt",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    if (!result.ok) console.error("reject email failed:", result.error);
  }

  revalidatePath("/admin/events/pending");
  return { success: true };
}

export async function trustOrganizer(profileId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createAdminClient();
  const { error } = await admin.from("profiles").update({ is_trusted: true }).eq("id", profileId);
  if (error) {
    return { success: false, error: error.message };
  }
  revalidatePath("/admin/events/pending");
  return { success: true };
}
