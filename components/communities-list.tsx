"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { CalendarDays, ExternalLink, MapPin, MessageCircle, Send } from "lucide-react";

import { COMMUNITY_ISSUE_URL, COMMUNITY_SUBMIT_URL, getPrimaryJoinUrl, hasPrivateGroupLink, isPrivateGroupInvite, type Community } from "@/lib/airtable";
import { TELEGRAM_URL } from "@/lib/site";

type CommunitiesListProps = {
  initialCommunities: Community[];
  initialCountries: Array<{ value: string; label: string }>;
  initialError: string | null;
};

export function CommunitiesList({
  initialCommunities,
  initialCountries,
  initialError,
}: CommunitiesListProps) {
  const [selectedCountry, setSelectedCountry] = useState<string>("");

  const filteredCommunities = useMemo(() => {
    if (!selectedCountry) return initialCommunities;
    return initialCommunities.filter((c) => c.country === selectedCountry);
  }, [initialCommunities, selectedCountry]);

  if (initialError) {
    return (
      <div className="rounded-2xl border-2 border-amber-200 bg-amber-50 p-6 text-center">
        <h1 className="mb-2 font-serif text-2xl text-amber-900">
          Unable to load communities
        </h1>
        <p className="text-amber-800">{initialError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:w-64">
          <label className="sr-only" htmlFor="community-country">
            Filter communities by country
          </label>
          <select
            id="community-country"
            value={selectedCountry}
            onChange={(e) => setSelectedCountry(e.target.value)}
            className="w-full rounded-2xl border border-[--color-sand-strong] bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-[--color-pine] focus:ring-2 focus:ring-[--color-pine]/20"
          >
            <option value="">All countries</option>
            {initialCountries.map((country) => (
              <option key={country.value} value={country.value}>
                {country.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {filteredCommunities.map((community) => (
          <CommunityCard
            key={community.id}
            community={community}
            getPrimaryJoinUrl={getPrimaryJoinUrl}
          />
        ))}
      </div>

      {/* Empty state */}
      {filteredCommunities.length === 0 && (
        <div className="rounded-[2rem] border border-dashed border-[--color-sand-strong] bg-white/75 px-6 py-12 text-center">
          <p className="font-serif text-2xl text-slate-950">No communities found.</p>
          <p className="mt-2 text-sm text-slate-600">Try selecting a different country.</p>
        </div>
      )}

      {/* Footer / CTA */}
      <section className="rounded-[2rem] bg-[--color-pine] p-8 text-center text-white shadow-sm">
        <h2 className="mb-4 font-serif text-2xl">Add or update a community</h2>
        <p className="mx-auto mb-6 max-w-2xl text-white/80 text-sm leading-6">
          Help us keep the directory accurate. If you know of a community that&apos;s missing or needs an update, please let us know.
        </p>
        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link
            href={COMMUNITY_SUBMIT_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-[--color-pine] transition hover:bg-slate-100"
          >
            <Send className="size-4" />
            Add a community
          </Link>
          <Link
            href={COMMUNITY_ISSUE_URL}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            <ExternalLink className="size-4" />
            Suggest an edit
          </Link>
        </div>
      </section>
    </div>
  );
}

function CommunityCard({
  community,
  getPrimaryJoinUrl
}: {
  community: Community;
  getPrimaryJoinUrl: (c: Community) => string | null
}) {
  const joinUrl = getPrimaryJoinUrl(community);

  return (
    <div className="flex flex-col rounded-2xl border border-[--color-sand-strong] bg-white p-5 transition hover:shadow-md">
      <div className="mb-3 flex-1">
        <h3 className="mb-1 font-serif text-xl text-slate-900">
          {community.name}
        </h3>
        <p className="flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="size-3 text-[--color-ember]" />
          {community.city}
          {community.city && community.country && ", "}
          {community.country}
        </p>
      </div>

      {community.description && (
        <p className="mb-4 line-clamp-3 text-sm text-slate-600">
          {community.description}
        </p>
      )}

      {/* Platform Icons */}
      <div className="mb-5 flex flex-wrap gap-2">
        {community.websiteUrl && <PlatformIcon href={community.websiteUrl} icon={<ExternalLink className="size-4" />} label="Website" />}
        {community.facebookGroupUrl && <PlatformIcon href={community.facebookGroupUrl} icon={<FacebookIcon />} label="Facebook" />}
        {community.facebookPageUrl && <PlatformIcon href={community.facebookPageUrl} icon={<FacebookIcon />} label="Facebook" />}
        {community.instagramUrl && <PlatformIcon href={community.instagramUrl} icon={<InstagramIcon />} label="Instagram" />}
        {community.calendarUrl && <PlatformIcon href={community.calendarUrl} icon={<CalendarDays className="size-4" />} label="Calendar" />}
        {community.telegramChannelUrl && !isPrivateGroupInvite(community.telegramChannelUrl) && <PlatformIcon href={community.telegramChannelUrl} icon={<MessageCircle className="size-4" />} label="Telegram" />}
        {community.whatsappChannelUrl && !isPrivateGroupInvite(community.whatsappChannelUrl) && <PlatformIcon href={community.whatsappChannelUrl} icon={<MessageCircle className="size-4" />} label="WhatsApp" />}
        {community.newsletterUrl && <PlatformIcon href={community.newsletterUrl} icon={<Send className="size-4" />} label="Newsletter" />}
      </div>

      <div className="mt-auto flex flex-col gap-2">
        {joinUrl && (
          <a
            href={joinUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full justify-center rounded-full bg-[--color-ember] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[--color-ember]/90"
          >
            Join
          </a>
        )}
        {(hasPrivateGroupLink(community) || !joinUrl) && (
          <a
            href={TELEGRAM_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full justify-center rounded-full border border-[--color-sand-strong] bg-white px-4 py-2.5 text-sm font-semibold text-[--color-pine] transition hover:border-[--color-pine] hover:bg-slate-50"
          >
            Request access
          </a>
        )}
      </div>
    </div>
  );
}

function PlatformIcon({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
      aria-label={label}
    >
      {icon}
    </a>
  );
}

function FacebookIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
