"use server";

import { createHash } from "crypto";
import { headers } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";

const VALID_ENTITY_TYPES = ["event", "venue", "profile", "community"] as const;
const VALID_REASONS = ["incorrect_info", "spam_fake", "copyright", "illegal_other"] as const;
const RATE_LIMIT = 5;

const REASON_LABELS: Record<string, string> = {
  incorrect_info: "Incorrect or outdated information",
  spam_fake: "Spam or fake listing",
  copyright: "Copyright infringement",
  illegal_other: "Other / illegal content",
};

export type ReportInput = {
  entity_type: "event" | "venue" | "profile" | "community";
  entity_id: string;
  entity_title: string;
  entity_slug: string;
  reason: string;
  details?: string;
};

export async function submitReport(
  input: ReportInput
): Promise<{ success: boolean; error?: string }> {
  if (!VALID_ENTITY_TYPES.includes(input.entity_type)) {
    return { success: false, error: "invalid" };
  }
  if (!VALID_REASONS.includes(input.reason as (typeof VALID_REASONS)[number])) {
    return { success: false, error: "invalid" };
  }

  const headersList = await headers();
  const rawIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const today = new Date().toISOString().slice(0, 10);
  const ipHash = createHash("sha256").update(`${rawIp}:${today}`).digest("hex");

  const supabase = createAdminClient();

  const oneDayAgo = new Date(Date.now() - 86400_000).toISOString();
  const { count } = await supabase
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ipHash)
    .gte("created_at", oneDayAgo);

  if ((count ?? 0) >= RATE_LIMIT) {
    return { success: false, error: "rate_limited" };
  }

  const { error: insertError } = await supabase.from("reports").insert({
    entity_type: input.entity_type,
    entity_id: input.entity_id,
    entity_title: input.entity_title,
    entity_slug: input.entity_slug,
    reason: input.reason,
    details: input.details?.trim() || null,
    ip_hash: ipHash,
    source: "web_form",
  });

  if (insertError) {
    return { success: false, error: "db_error" };
  }

  notifyTelegram(input).catch(() => {});

  return { success: true };
}

async function notifyTelegram(input: ReportInput) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_ADMIN_CHAT_ID;
  const threadId = process.env.TELEGRAM_REPORT_THREAD_ID;

  if (!token || !chatId) return;

  const basePath =
    input.entity_type === "profile" ? "teachers" : `${input.entity_type}s`;
  const url = `https://citreasurehunt.com/${basePath}/${input.entity_slug}`;

  const text = [
    `🚩 Report · ${input.entity_type}: ${input.entity_title}`,
    `Reason: ${REASON_LABELS[input.reason] ?? input.reason}`,
    `Details: ${input.details?.trim() || "—"}`,
    `→ ${url}`,
  ].join("\n");

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      message_thread_id: threadId ? Number(threadId) : undefined,
      text,
      link_preview_options: { is_disabled: true },
    }),
  });
}
