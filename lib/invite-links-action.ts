"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const RATE_LIMIT_PER_DAY = 20;

type InviteLinks = Partial<Record<"telegram" | "whatsapp" | "signal", string>>;

export async function getInviteLinks(
  communityId: string,
  token: string
): Promise<{ links: InviteLinks } | { error: string }> {
  if (!communityId || !token) {
    return { error: "invalid" };
  }

  const secret = process.env.CF_TURNSTILE_SECRET_KEY;
  if (!secret) {
    return { error: "not_configured" };
  }

  const verifyRes = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
    }
  );
  const verified = await verifyRes.json();
  if (!verified.success) {
    return { error: "challenge_failed" };
  }

  const headersList = await headers();
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("sha256").update(`${rawIp}:${today}`).digest("hex");

  const supabase = createAdminClient();

  const oneDayAgo = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await supabase
    .from("invite_reveal_log")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneDayAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_DAY) {
    return { error: "rate_limited" };
  }

  const { data, error } = await supabase
    .from("community_invites")
    .select("platform, url")
    .eq("community_id", communityId);

  if (error) {
    return { error: "lookup_failed" };
  }

  if (!data || data.length === 0) {
    return { error: "not_found" };
  }

  await supabase
    .from("invite_reveal_log")
    .insert({ ip_hash: ipHash, community_id: communityId });

  const rows = data as { platform: string; url: string }[];
  const links: InviteLinks = {};
  for (const row of rows) {
    if (row.platform === "telegram" || row.platform === "whatsapp" || row.platform === "signal") {
      links[row.platform] = row.url;
    }
  }

  return { links };
}
