"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

type EntityType = "venue" | "profile" | "event";

const TABLE_BY_ENTITY: Record<EntityType, { table: string; column: string }> = {
  venue: { table: "venues", column: "email" },
  profile: { table: "profiles", column: "public_email" },
  event: { table: "events", column: "contact_email" },
};

// Same ip_hash rate-limit pattern as its siblings (invite-links-action.ts / I-099,
// report-action.ts / I-012) — defense-in-depth alongside Turnstile, not a replacement.
const RATE_LIMIT_PER_DAY = 20;

export async function getProtectedEmail(
  entityType: EntityType,
  entityId: string,
  token: string
): Promise<{ email: string } | { error: string }> {
  if (!token || !entityId) {
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
    .from("email_reveal_log")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneDayAgo);

  if ((count ?? 0) >= RATE_LIMIT_PER_DAY) {
    return { error: "rate_limited" };
  }

  const { table, column } = TABLE_BY_ENTITY[entityType];
  const { data, error } = await supabase
    .from(table)
    .select(column)
    .eq("id", entityId)
    .single();

  if (error || !data) {
    return { error: "not_found" };
  }

  const email = (data as unknown as Record<string, string | null>)[column];
  if (!email) {
    return { error: "not_found" };
  }

  await supabase
    .from("email_reveal_log")
    .insert({ ip_hash: ipHash, entity_type: entityType, entity_id: entityId });

  return { email };
}
