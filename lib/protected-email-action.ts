"use server";

import { createAdminClient } from "@/lib/supabase/admin";

type EntityType = "venue" | "profile" | "event";

const TABLE_BY_ENTITY: Record<EntityType, { table: string; column: string }> = {
  venue: { table: "venues", column: "email" },
  profile: { table: "profiles", column: "public_email" },
  event: { table: "events", column: "contact_email" },
};

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

  const { table, column } = TABLE_BY_ENTITY[entityType];
  const supabase = createAdminClient();
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

  return { email };
}
