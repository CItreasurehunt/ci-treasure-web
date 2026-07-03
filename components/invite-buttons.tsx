"use client";

import { useCallback, useState } from "react";
import { Turnstile } from "@marsidev/react-turnstile";
import { getInviteLinks } from "@/lib/invite-links-action";
import { TELEGRAM_URL } from "@/lib/site";

type Platform = "telegram" | "whatsapp" | "signal";

const PLATFORM_LABELS: Record<Platform, string> = {
  telegram: "Telegram",
  whatsapp: "WhatsApp",
  signal: "Signal",
};

const STORAGE_PREFIX = "cith_invite_";
const SESSION_TTL_MS = 30 * 60 * 1000; // 30 min

type CachedLinks = { links: Partial<Record<Platform, string>>; expiresAt: number };

function readCache(communityId: string): Partial<Record<Platform, string>> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + communityId);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedLinks;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(STORAGE_PREFIX + communityId);
      return null;
    }
    return parsed.links;
  } catch {
    return null;
  }
}

function writeCache(communityId: string, links: Partial<Record<Platform, string>>) {
  try {
    window.localStorage.setItem(
      STORAGE_PREFIX + communityId,
      JSON.stringify({ links, expiresAt: Date.now() + SESSION_TTL_MS } satisfies CachedLinks)
    );
  } catch {
    // private browsing / storage full — non-fatal, just won't persist across reloads
  }
}

const ERROR_MESSAGES: Record<string, string> = {
  rate_limited: "Too many requests from this network — try again tomorrow, or ask in our Telegram group.",
  challenge_failed: "Verification failed. Please try again.",
  not_found: "No invite links found for this community.",
};

type InviteButtonsProps = {
  communityId: string;
  platforms: Partial<Record<Platform, boolean>>;
};

function formatPlatformList(platforms: Platform[]): string {
  const names = platforms.map((platform) => PLATFORM_LABELS[platform]);
  if (names.length <= 1) return names.join("");
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;
}

export function InviteButtons({ communityId, platforms }: InviteButtonsProps) {
  const availablePlatforms = (Object.keys(platforms) as Platform[]).filter(
    (platform) => platforms[platform]
  );
  const platformList = formatPlatformList(availablePlatforms);

  const [links, setLinks] = useState<Partial<Record<Platform, string>> | null>(() =>
    readCache(communityId)
  );
  const [showWidget, setShowWidget] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleStart = useCallback(() => {
    setShowWidget(true);
    setErrorMsg(null);
  }, []);

  const handleSuccess = useCallback(
    async (token: string) => {
      setVerifying(true);
      const result = await getInviteLinks(communityId, token);
      setShowWidget(false);
      setVerifying(false);

      if ("error" in result) {
        setErrorMsg(ERROR_MESSAGES[result.error] ?? "Something went wrong. Please try again.");
        return;
      }

      setLinks(result.links);
      writeCache(communityId, result.links);
    },
    [communityId]
  );

  const handleWidgetError = useCallback(() => {
    setShowWidget(false);
    setVerifying(false);
    setErrorMsg("Verification failed to load. Please try again.");
  }, []);

  const siteKey = process.env.NEXT_PUBLIC_CF_TURNSTILE_SITE_KEY;

  if (links && Object.keys(links).length > 0) {
    return (
      <div className="flex flex-col gap-2">
        {(Object.entries(links) as [Platform, string][]).map(([platform, url]) => (
          <a
            key={platform}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-pine) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--color-pine)/90"
          >
            Join {PLATFORM_LABELS[platform]} group
          </a>
        ))}
      </div>
    );
  }

  // Turnstile not configured (missing env var) — fall back to the pre-I-099 stub
  if (!siteKey) {
    return (
      <a
        href={TELEGRAM_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-pine) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--color-pine)/90"
      >
        Request access via Telegram
      </a>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {!showWidget && (
        <button
          type="button"
          onClick={handleStart}
          disabled={verifying}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-(--color-pine) px-4 py-3 text-sm font-semibold text-white transition hover:bg-(--color-pine)/90 disabled:opacity-60"
        >
          {verifying
            ? "Verifying…"
            : platformList
              ? `Request access to ${platformList} ${availablePlatforms.length > 1 ? "groups" : "group"}`
              : "Request access"}
        </button>
      )}
      {showWidget && (
        <div className="flex justify-center">
          <Turnstile
            siteKey={siteKey}
            onSuccess={handleSuccess}
            onError={handleWidgetError}
            options={{ theme: "light" }}
          />
        </div>
      )}
      {errorMsg && <p className="text-center text-xs text-red-600">{errorMsg}</p>}
    </div>
  );
}
