"use server";

import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin-auth";
import { sendEmail } from "@/lib/email";
import { createAdminClient } from "@/lib/supabase/admin";

export type PendingClaim = {
  profileId: string;
  name: string;
  bioSnippet: string | null;
  visibility: string;
  claimerEmail: string;
  claimerUserId: string;
  claimedAt: string | null;
};

export async function getPendingClaims(): Promise<PendingClaim[]> {
  await requireAdminUser();
  const admin = createAdminClient();

  const { data: profiles } = await admin
    .from("profiles")
    .select("id, name, bio, visibility, claim_pending_user_id, updated_at")
    .not("claim_pending_user_id", "is", null)
    .order("updated_at", { ascending: false });

  const claims: PendingClaim[] = [];
  for (const p of profiles ?? []) {
    const { data: userData } = await admin.auth.admin.getUserById(p.claim_pending_user_id as string);
    claims.push({
      profileId: p.id as string,
      name: p.name as string,
      bioSnippet: p.bio ? String(p.bio).slice(0, 160) : null,
      visibility: p.visibility as string,
      claimerEmail: userData?.user?.email ?? "(unknown email)",
      claimerUserId: p.claim_pending_user_id as string,
      claimedAt: (p.updated_at as string) ?? null,
    });
  }
  return claims;
}

export async function approveClaim(profileId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createAdminClient();

  // Read the pending claimant before clearing it.
  const { data: profile, error: readError } = await admin
    .from("profiles")
    .select("name, claim_pending_user_id")
    .eq("id", profileId)
    .maybeSingle();
  if (readError || !profile?.claim_pending_user_id) {
    return { success: false, error: "Claim not found or already resolved." };
  }

  // Grant ownership + auto-upgrade shadow → public.
  const { error: updateError } = await admin
    .from("profiles")
    .update({
      user_id: profile.claim_pending_user_id,
      claim_pending_user_id: null,
      visibility: "public",
    })
    .eq("id", profileId);
  if (updateError) {
    return { success: false, error: updateError.message };
  }

  // Notify the organizer (non-fatal if email fails — the claim is already approved).
  const { data: userData } = await admin.auth.admin.getUserById(profile.claim_pending_user_id);
  const email = userData?.user?.email;
  if (email) {
    const result = await sendEmail({
      to: email,
      subject: "Your CI Treasure Hunt profile claim was approved",
      text: [
        `Hi ${profile.name},`,
        "",
        "Your profile claim has been approved. You can now manage your events at",
        "https://citreasurehunt.com/dashboard",
        "",
        "— CI Treasure Hunt",
      ].join("\n"),
    });
    if (!result.ok) {
      console.error("approval email failed:", result.error);
    }
  }

  revalidatePath("/admin/claims");
  return { success: true };
}

export async function rejectClaim(profileId: string): Promise<{ success: boolean; error?: string }> {
  await requireAdminUser();
  const admin = createAdminClient();

  const { error } = await admin
    .from("profiles")
    .update({ claim_pending_user_id: null })
    .eq("id", profileId);
  if (error) {
    return { success: false, error: error.message };
  }

  revalidatePath("/admin/claims");
  return { success: true };
}
