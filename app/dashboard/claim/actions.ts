"use server";

import { revalidatePath } from "next/cache";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export type ClaimableProfile = {
  id: string;
  name: string;
  bioSnippet: string | null;
  roles: string;
  visibility: string;
};

// Escape LIKE/ILIKE wildcards so user input can't turn into a match-all pattern.
function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

// Search runs on the service-role client: shadow/CIGC profiles are invisible to a
// normal user session (profiles RLS = public OR own), but they must be claimable.
// Only non-sensitive fields and only truly-claimable rows are returned.
export async function searchProfiles(query: string): Promise<ClaimableProfile[]> {
  const q = query.trim();
  if (q.length < 2) return [];

  const admin = createAdminClient();
  const { data } = await admin
    .from("profiles")
    .select("id, name, bio, visibility, is_organizer, is_teacher, is_musician")
    .ilike("name", `%${escapeLike(q)}%`)
    .is("user_id", null)
    .is("claim_pending_user_id", null)
    .order("name")
    .limit(20);

  return (data ?? []).map((p) => ({
    id: p.id as string,
    name: p.name as string,
    bioSnippet: p.bio ? String(p.bio).slice(0, 120) : null,
    roles: [
      p.is_organizer ? "Organizer" : null,
      p.is_teacher ? "Teacher" : null,
      p.is_musician ? "Musician" : null,
    ]
      .filter(Boolean)
      .join(" · "),
    visibility: p.visibility as string,
  }));
}

export async function submitClaim(profileId: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "You are not signed in." };
  }

  // RPC is SECURITY DEFINER and validates the claim rules (unclaimed, no existing
  // pending claim by this user). It only sets claim_pending_user_id — no access yet.
  const { error } = await supabase.rpc("submit_profile_claim", { p_profile_id: profileId });
  if (error) {
    return { success: false, error: error.message };
  }

  // Fire-and-forget admin notification (same pattern as lib/report-action.ts).
  notifyAdminClaim().catch(() => {});

  revalidatePath("/dashboard");
  return { success: true };
}

// Admin group topic for profile claims (env-overridable).
const CLAIM_THREAD_ID = Number(process.env.TELEGRAM_CLAIM_THREAD_ID ?? 683);

// No profile name or claimant email here by design — the notification is just a nudge
// to go review the queue, not a record of who claimed what (avoids putting personal
// data in Telegram, which isn't a documented processor in the privacy policy).
async function notifyAdminClaim() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  if (!token || !chatId) return;

  const text = [
    "🔔 New profile claim submitted.",
    "Review: https://citreasurehunt.com/admin/claims",
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: CLAIM_THREAD_ID,
      text,
      link_preview_options: { is_disabled: true },
    }),
  });
}
