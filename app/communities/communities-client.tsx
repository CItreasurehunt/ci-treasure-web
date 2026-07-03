"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ExternalLink, Globe, MapPin, MessageCircle, Send } from "lucide-react";

import { COMMUNITY_ISSUE_URL, COMMUNITY_SUBMIT_URL, isPrivateGroupInvite, type Community } from "@/lib/communities";
import { TELEGRAM_URL } from "@/lib/site";
import { Badge } from "@/components/ui/badge";
import { CONTINENT_COUNTRIES, CONTINENT_LABELS } from "@/lib/continents";

const WORLDWIDE_VALUE = "__worldwide";

type CommunitiesClientProps = {
  initialCommunities: Community[];
  initialCountries: Array<{ value: string; label: string }>;
  initialCommunityCount: number;
  initialCountryCount: number;
  initialError: string | null;
};

export function CommunitiesClient({
  initialCommunities,
  initialCountries,
  initialCommunityCount,
  initialCountryCount,
  initialError,
}: CommunitiesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedCountry = searchParams.get("country") ?? "";

  function setSelectedCountry(value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set("country", value);
    else params.delete("country");
    const qs = params.toString();
    router.replace(qs ? `/communities?${qs}` : "/communities", { scroll: false });
  }

  // Group country options into the project's three business regions (Americas / EMEA /
  // Asia-Pacific — same CONTINENT_COUNTRIES used on the events page), plus a "Worldwide" group
  // for communities with no single country.
  const groupedCountryOptions = useMemo(() => {
    const groups = (["americas", "emea", "apac"] as const).map((key) => ({
      key,
      label: CONTINENT_LABELS[key],
      value: `__continent_${key}`,
      countries: initialCountries.filter((o) => CONTINENT_COUNTRIES[key].includes(o.value)),
    }));
    const hasWorldwide = initialCommunities.some((c) => c.countryIso === null);
    return { groups: groups.filter((g) => g.countries.length > 0), hasWorldwide };
  }, [initialCountries, initialCommunities]);

  // Filter communities by selected country / continent / worldwide
  const filteredCommunities = useMemo(() => {
    if (!selectedCountry) return initialCommunities;
    if (selectedCountry === WORLDWIDE_VALUE) {
      return initialCommunities.filter((c) => c.countryIso === null);
    }
    if (selectedCountry.startsWith("__continent_")) {
      const key = selectedCountry.slice("__continent_".length);
      return initialCommunities.filter((c) => c.countryIso && CONTINENT_COUNTRIES[key]?.includes(c.countryIso));
    }
    return initialCommunities.filter((c) => c.countryIso === selectedCountry);
  }, [initialCommunities, selectedCountry]);

  // Error state
  if (initialError) {
    return (
      <div className="min-h-screen bg-(--color-cream) px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 rounded-2xl border-2 border-amber-200 bg-amber-50 p-6">
            <h1 className="mb-2 font-serif text-2xl text-amber-900">
              Unable to load communities
            </h1>
            <p className="text-amber-800">{initialError}</p>
          </div>
          <p className="text-sm text-slate-500">
            Please try again later or contact us if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-(--color-cream) px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-10">
          <h1 className="mb-3 font-serif text-3xl text-slate-900 md:text-5xl">
            CI Communities Worldwide
          </h1>
          <p className="mb-6 max-w-2xl text-lg text-slate-600">
            Explore Contact Improvisation communities around the globe and find the public channels, websites, and resources that help you connect locally.
          </p>
          <div className="flex justify-start gap-8 text-sm font-medium text-slate-700">
            <span className="flex items-center gap-2">
              <Globe className="size-4 text-(--color-pine)" />
              {initialCommunityCount} communities
            </span>
            <span className="flex items-center gap-2">
              <MapPin className="size-4 text-slate-400" />
              {initialCountryCount} countries
            </span>
          </div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-slate-500">
            Invite links to WhatsApp, Telegram, and Signal groups are not shown here due to spam protection.
            Join our Telegram group to access the chat groups:{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-(--color-pine) underline decoration-(--color-pine)/35 underline-offset-4"
            >
              t.me/citreasurehunt
            </a>
          </p>
        </header>

        {/* Controls */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Country Filter */}
          <div className="w-full md:w-64">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="w-full rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-(--color-pine) focus:ring-2 focus:ring-(--color-pine)/20"
            >
              <option value="">All countries</option>
              {groupedCountryOptions.groups.map((group) => (
                <optgroup key={group.key} label={group.label}>
                  <option value={group.value}>All {group.label}</option>
                  {group.countries.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </optgroup>
              ))}
              {groupedCountryOptions.hasWorldwide && (
                <optgroup label="Worldwide">
                  <option value={WORLDWIDE_VALUE}>Worldwide / International</option>
                </optgroup>
              )}
            </select>
          </div>
        </div>

        {/* Content */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCommunities.map((community) => (
            <CommunityCard key={community.id} community={community} />
          ))}
        </div>

        {/* Empty state for filtered results */}
        {filteredCommunities.length === 0 && !initialError && (
          <div className="py-12 text-center text-slate-500">
            No communities found. Try selecting a different country.
          </div>
        )}

        <section className="mt-12 rounded-2xl bg-(--color-pine) p-8 text-center text-white">
          <h2 className="mb-2 font-serif text-2xl">Know a community we&apos;re missing?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-white/75">
            Private invite links are hidden to reduce spam — join the global Telegram group first to request access to chat groups.
          </p>
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href={COMMUNITY_SUBMIT_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-medium text-(--color-pine) transition hover:bg-slate-100"
            >
              <ExternalLink className="size-4" />
              Add a community
            </Link>
            <Link
              href={COMMUNITY_ISSUE_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <ExternalLink className="size-4" />
              Suggest a correction
            </Link>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/20"
            >
              <TelegramIcon className="size-4" />
              Join the global conversation
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

type CommunityCardProps = {
  community: Community;
};

function CommunityCard({ community }: CommunityCardProps) {
  const linkIconClass = "relative z-20 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200";
  const hasInvitePlatform = community.hasTelegramInvite || community.hasWhatsappInvite || community.hasSignalInvite;

  return (
    <div className="relative flex min-w-0 flex-col overflow-hidden rounded-2xl border border-(--color-sand-strong) bg-white p-4 transition hover:shadow-lg">
      {/* Whole card links to the detail page; icon row above sits at a higher z-index so those links remain independently clickable */}
      <Link href={`/communities/${community.slug}`} className="absolute inset-0 z-10" aria-label={community.name} />

      {/* Name + location */}
      <h3 className="mb-1 font-serif text-lg text-slate-900 wrap-break-word">{community.name}</h3>
      <p className="mb-3 flex min-w-0 items-center gap-1 text-sm text-slate-500">
        <MapPin className="size-3 shrink-0 text-slate-400" />
        <span className="min-w-0 wrap-break-word">
          {community.city}
          {community.city && community.country && ", "}
          {community.country}
        </span>
      </p>

      {/* Platform links */}
      <div className="mb-3 flex flex-wrap gap-2">
        {community.websiteUrl && (
          <a href={community.websiteUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Website">
            <ExternalLink className="size-4" />
          </a>
        )}
        {community.facebookGroupUrl && (
          <a href={community.facebookGroupUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Facebook group">
            <FacebookIcon />
          </a>
        )}
        {community.facebookPageUrl && (
          <a href={community.facebookPageUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Facebook page">
            <FacebookIcon />
          </a>
        )}
        {community.instagramUrl && (
          <a href={community.instagramUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Instagram">
            <InstagramIcon />
          </a>
        )}
        {community.calendarUrl && (
          <a href={community.calendarUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Calendar">
            <CalendarDays className="size-4" />
          </a>
        )}
        {community.telegramChannelUrl && !isPrivateGroupInvite(community.telegramChannelUrl) && (
          <a href={community.telegramChannelUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Telegram channel">
            <MessageCircle className="size-4" />
          </a>
        )}
        {community.whatsappChannelUrl && !isPrivateGroupInvite(community.whatsappChannelUrl) && (
          <a href={community.whatsappChannelUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="WhatsApp channel">
            <MessageCircle className="size-4" />
          </a>
        )}
        {community.newsletterUrl && (
          <a href={community.newsletterUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Newsletter">
            <Send className="size-4" />
          </a>
        )}
        {community.otherResourceUrl && (
          <a href={community.otherResourceUrl} target="_blank" rel="noopener noreferrer" className={linkIconClass} aria-label="Other resource">
            <ExternalLink className="size-4" />
          </a>
        )}
      </div>

      {/* Description */}
      {community.description && (
        <p className="mb-3 line-clamp-2 wrap-break-word text-sm text-slate-600">{community.description}</p>
      )}

      {/* Passive platform badges — the actual join/request-access action lives on the detail page */}
      {hasInvitePlatform && (
        <div className="mt-auto flex flex-wrap gap-1 pt-1">
          {community.hasTelegramInvite && (
            <Badge variant="secondary" className="px-2 py-0 text-[10px] font-medium">
              Telegram
            </Badge>
          )}
          {community.hasWhatsappInvite && (
            <Badge variant="secondary" className="px-2 py-0 text-[10px] font-medium">
              WhatsApp
            </Badge>
          )}
          {community.hasSignalInvite && (
            <Badge variant="secondary" className="px-2 py-0 text-[10px] font-medium">
              Signal
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}

function FacebookIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}

function TelegramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M21.9 4.6 18.6 20c-.2 1.1-.8 1.4-1.7.9l-5.1-3.8-2.5 2.4c-.3.3-.5.5-1 .5l.4-5.2 9.5-8.6c.4-.4-.1-.6-.6-.2L5.8 13.4.7 11.8c-1.1-.3-1.1-1.1.2-1.6L20.8 2.5c.9-.3 1.7.2 1.1 2.1Z" />
    </svg>
  );
}
