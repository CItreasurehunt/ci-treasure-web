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
            <PlatformIcon platform={platform} className="h-4 w-4" />
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

function PlatformIcon({ platform, className }: { platform: Platform; className?: string }) {
  if (platform === "telegram") return <TelegramIcon className={className} />;
  if (platform === "whatsapp") return <WhatsAppIcon className={className} />;
  return <SignalIcon className={className} />;
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.9 4.6 18.6 20c-.2 1.1-.8 1.4-1.7.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2L5.8 13.4.7 11.8c-1.1-.3-1.1-1.1.2-1.6L20.8 2.5c.9-.3 1.7.2 1.1 2.1Z" />
    </svg>
  );
}

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01s-.52.07-.79.37c-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.35h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.02 6.6 1.59 12.05 1.59c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.15 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
    </svg>
  );
}

function SignalIcon({ className }: { className?: string }) {
  // Generic chat-bubble glyph, not Signal's exact wordmark — swap in the real logo if this looks off.
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  );
}
