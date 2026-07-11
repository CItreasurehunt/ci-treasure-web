"use client";

import { useState, useMemo, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, ExternalLink, Globe, Lock, MapPin, MessageCircle, Send, Search, X, Filter, Map, List } from "lucide-react";

import { COMMUNITY_ISSUE_URL, COMMUNITY_SUBMIT_URL, isLineUrl, isMessengerUrl, isPrivateGroupInvite, type Community } from "@/lib/communities";
import { TELEGRAM_URL } from "@/lib/site";
import { Button } from "@/components/ui/button";
import { CONTINENT_COUNTRIES, CONTINENT_LABELS } from "@/lib/continents";

const WORLDWIDE_VALUE = "__worldwide";

// Shared style for every platform icon on a community card (public + gated).
const PLATFORM_ICON_CLASS =
  "relative z-20 flex size-8 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200";

type CommunitiesClientProps = {
  initialCommunities: Community[];
  initialCountries: Array<{ value: string; label: string }>;
  initialCommunityCount: number;
  initialCountryCount: number;
  initialError: string | null;
};

// Dynamically load the Map component without SSR
const CommunityMap = dynamic(() => import("@/components/community-map"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-400">
      <div className="flex flex-col items-center gap-2">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent"></div>
        <p className="text-sm font-medium">Loading Interactive Map...</p>
      </div>
    </div>
  ),
});

export function CommunitiesClient({
  initialCommunities,
  initialCountries,
  initialCommunityCount,
  initialCountryCount,
  initialError,
}: CommunitiesClientProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search query: local state only
  const [searchQuery, setSearchQuery] = useState("");

  // Filters from URL
  const selectedCountry = searchParams.get("country") ?? "";
  const selectedType = searchParams.get("type") ?? "";

  function setParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    const qs = params.toString();
    router.replace(qs ? `/communities?${qs}` : "/communities", { scroll: false });
  }

  const setSelectedCountry = (v: string) => setParam("country", v);
  const setSelectedType = (v: string) => setParam("type", v);

  // Interaction state
  const [highlightedCommunityId, setHighlightedCommunityId] = useState<string | null>(null);

  // Mobile view state: 'list' | 'map'
  const [mobileView, setMobileView] = useState<"list" | "map">("list");
  const [filtersOpen, setFiltersOpen] = useState(false);

  const activeFilterCount = [selectedCountry, selectedType].filter(Boolean).length;

  // Reset all filters
  const resetFilters = () => {
    router.replace("/communities", { scroll: false });
    setSearchQuery("");
    setHighlightedCommunityId(null);
  };

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

  // Extract unique types from loaded communities list
  const typeOptions = useMemo(() => {
    const types = Array.from(new Set(initialCommunities.map((c) => c.type).filter((t): t is string => !!t)));
    return types
      .map((t) => ({ value: t, label: t }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [initialCommunities]);

  // Filter communities locally
  const filteredCommunities = useMemo(() => {
    return initialCommunities.filter((community) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const nameMatch = community.name?.toLowerCase().includes(query);
        const descMatch = community.description?.toLowerCase().includes(query);
        const cityMatch = community.city?.toLowerCase().includes(query);
        const countryMatch = community.country?.toLowerCase().includes(query);
        if (!nameMatch && !descMatch && !cityMatch && !countryMatch) {
          return false;
        }
      }

      // 2. Country / Continent Match
      if (selectedCountry) {
        if (selectedCountry === WORLDWIDE_VALUE) {
          if (community.countryIso !== null) return false;
        } else if (selectedCountry.startsWith("__continent_")) {
          const key = selectedCountry.slice("__continent_".length);
          if (!community.countryIso || !CONTINENT_COUNTRIES[key]?.includes(community.countryIso)) return false;
        } else if (community.countryIso !== selectedCountry) {
          return false;
        }
      }

      // 3. Community Type Match
      if (selectedType && community.type !== selectedType) {
        return false;
      }

      return true;
    });
  }, [initialCommunities, searchQuery, selectedCountry, selectedType]);

  const handleShowOnMap = useCallback((communityId: string) => {
    setHighlightedCommunityId(communityId);
    // Switch to map view on mobile
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView("map");
    }
  }, []);

  const handleMarkerClick = useCallback((communityId: string) => {
    setHighlightedCommunityId(communityId);
    // Scroll to card
    const cardElement = document.getElementById(`community-card-${communityId}`);
    if (cardElement) {
      cardElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, []);

  // Error state
  if (initialError) {
    return (
      <div className="min-h-screen bg-(--color-mist) px-5 py-10 sm:px-8 lg:px-10">
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
    <div className="min-h-screen overflow-x-hidden bg-(--color-mist) px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <header className="mb-8">
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
            Invite links to Telegram, WhatsApp, and Signal groups are protected by a quick
            verification check to keep spam bots out. Questions, or a link not working?{" "}
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-(--color-pine) underline decoration-(--color-pine)/35 underline-offset-4"
            >
              Join our Telegram group
            </a>
            .
          </p>
        </header>

        {/* Search & Filter Toolbar */}
        <div className="mb-8 flex flex-col gap-4 rounded-xl border border-(--color-sand-strong) bg-white p-4 shadow-sm md:p-5">
          <div className="flex flex-col gap-3 sm:flex-row">
            {/* Search bar */}
            <div className="relative flex-1">
              <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, city, or country..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50/50 py-3 pr-4 pl-11 text-sm outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute top-1/2 right-4 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="size-4" />
                </button>
              )}
            </div>

            {/* Mobile controls */}
            <div className="flex gap-2 border-t border-slate-100 pt-3 sm:border-none sm:pt-0 lg:hidden">
              <button
                onClick={() => setFiltersOpen((o) => !o)}
                className={`flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
                  filtersOpen || activeFilterCount > 0
                    ? "bg-violet-100 text-violet-700"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                <Filter className="size-4" />
                Filters
                {activeFilterCount > 0 && !filtersOpen && (
                  <span className="rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-bold leading-none text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              <div className="flex flex-1">
                <button
                  onClick={() => setMobileView("list")}
                  className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
                    mobileView === "list"
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <List className="size-4" />
                  List
                </button>
                <button
                  onClick={() => setMobileView("map")}
                  className={`flex flex-1 items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${
                    mobileView === "map"
                      ? "bg-violet-100 text-violet-700"
                      : "text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  <Map className="size-4" />
                  Map
                </button>
              </div>
            </div>
          </div>

          {/* Extended filters */}
          <div className={`flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3 md:pt-4 ${filtersOpen ? "flex" : "hidden"} lg:flex`}>
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-44"
              >
                <option value="">All Countries</option>
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

              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 sm:w-44"
              >
                <option value="">All Types</option>
                {typeOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold text-slate-500 w-full justify-between sm:w-auto sm:justify-end border-t border-slate-50 pt-2 sm:border-none sm:pt-0">
              <span>
                {filteredCommunities.length} of {initialCommunities.length} communities
              </span>
              {(searchQuery || selectedCountry || selectedType) && (
                <button
                  onClick={resetFilters}
                  className="text-violet-600 hover:text-violet-800 transition"
                >
                  Clear all filters
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Main Viewport Container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-320px)] min-h-[500px]">
          {/* List Column */}
          <div
            className={`lg:col-span-4 h-full overflow-y-auto pr-1 space-y-3 ${
              mobileView === "list" ? "block" : "hidden lg:block"
            }`}
          >
            {filteredCommunities.length > 0 ? (
              filteredCommunities.map((community) => (
                <div
                  key={community.id}
                  id={`community-card-${community.id}`}
                  className={`transition rounded-2xl ${
                    highlightedCommunityId === community.id
                      ? "ring-2 ring-violet-500 ring-offset-2 scale-[0.99] shadow-sm"
                      : ""
                  }`}
                >
                  <CommunityCard
                    community={community}
                    onShowOnMap={() => handleShowOnMap(community.id)}
                  />
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-white/75 px-6 py-16 text-center">
                <p className="font-serif text-xl text-slate-900 font-medium">No communities found.</p>
                <p className="mt-2 text-sm text-slate-500">
                  Try widening your parameters or clearing the search box.
                </p>
                <Button
                  onClick={resetFilters}
                  variant="outline"
                  size="sm"
                  className="mt-4 border-violet-200 text-violet-600 hover:bg-violet-50"
                >
                  Reset Filters
                </Button>
              </div>
            )}
          </div>

          {/* Map Column */}
          <div
            className={`lg:col-span-8 h-full ${
              mobileView === "map" ? "block" : "hidden lg:block"
            }`}
          >
            <CommunityMap
              communities={filteredCommunities}
              highlightedCommunityId={highlightedCommunityId}
              onMarkerClick={handleMarkerClick}
              onReset={() => setHighlightedCommunityId(null)}
              visible={mobileView === "map"}
            />
          </div>
        </div>

        <section className="mt-12 rounded-2xl bg-(--color-pine) p-8 text-center text-white">
          <h2 className="mb-2 font-serif text-2xl">Know a community we&apos;re missing?</h2>
          <p className="mx-auto mb-6 max-w-2xl text-sm leading-6 text-white/75">
            Add it, flag something that&apos;s out of date, or just say hi in our global Telegram group.
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
  onShowOnMap?: () => void;
};

function CommunityCard({ community, onShowOnMap }: CommunityCardProps) {
  const linkIconClass = PLATFORM_ICON_CLASS;
  const hasCoords = community.latitude !== null && community.longitude !== null;

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
        {hasCoords && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onShowOnMap?.();
            }}
            className={`${linkIconClass} text-violet-600 hover:text-violet-800`}
            aria-label="Show on map"
          >
            <Map className="size-4" />
          </button>
        )}
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
          <a
            href={community.otherResourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={linkIconClass}
            aria-label={
              isMessengerUrl(community.otherResourceUrl)
                ? "Messenger group"
                : isLineUrl(community.otherResourceUrl)
                  ? "LINE group"
                  : "Other resource"
            }
          >
            {isMessengerUrl(community.otherResourceUrl) ? (
              <MessengerIcon />
            ) : isLineUrl(community.otherResourceUrl) ? (
              <LineIcon />
            ) : (
              <ExternalLink className="size-4" />
            )}
          </a>
        )}
        {/* Gated invites: same icon row, but these link into the detail page's join
            section rather than the platform directly — the lock signals the extra
            verification step instead of an instant external jump. */}
        {community.hasTelegramInvite && (
          <GatedPlatformIcon slug={community.slug} label="Telegram group" icon={<TelegramIcon className="size-4" />} />
        )}
        {community.hasWhatsappInvite && (
          <GatedPlatformIcon slug={community.slug} label="WhatsApp group" icon={<WhatsAppIcon />} />
        )}
        {community.hasSignalInvite && (
          <GatedPlatformIcon slug={community.slug} label="Signal group" icon={<SignalIcon />} />
        )}
        {community.hasLineInvite && (
          <GatedPlatformIcon slug={community.slug} label="LINE group" icon={<LineIcon />} />
        )}
      </div>

      {/* Description */}
      {community.description && (
        <p className="mb-3 line-clamp-2 wrap-break-word text-sm text-slate-600">{community.description}</p>
      )}
    </div>
  );
}

function GatedPlatformIcon({
  slug,
  icon,
  label,
}: {
  slug: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={`/communities/${slug}#invite`}
      className={PLATFORM_ICON_CLASS}
      aria-label={`${label} — verification required to join`}
    >
      {icon}
      <span className="absolute -bottom-1 -right-1 flex size-3.5 items-center justify-center rounded-full bg-amber-500 text-white ring-2 ring-white">
        <Lock className="size-2" strokeWidth={3} />
      </span>
    </Link>
  );
}

function FacebookIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function MessengerIcon() {
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 0C5.373 0 0 5.093 0 11.552c0 3.686 1.745 6.972 4.472 9.12V24l4.086-2.242c1.09.301 2.246.464 3.442.464 6.627 0 12-5.093 12-11.552C24 5.093 18.627 0 12 0Zm1.191 15.527-3.055-3.26-5.963 3.26L10.732 9l3.131 3.259L19.752 9l-6.561 6.527Z" />
    </svg>
  );
}

function LineIcon() {
  // LINE app logo mark, from Simple Icons (CC0), fill swapped to currentColor.
  return (
    <svg className="size-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63h2.386c.346 0 .627.285.627.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.63-.63.346 0 .628.285.628.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
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

function WhatsAppIcon() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.16-.17.2-.35.22-.64.08-.3-.15-1.26-.46-2.39-1.48-.88-.78-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.61-.92-2.21-.24-.58-.49-.5-.67-.51-.17-.01-.37-.01-.57-.01s-.52.07-.79.37c-.27.3-1.04 1.01-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.69.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.35h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26C2.16 6.02 6.6 1.59 12.05 1.59c2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.43 9.88-9.88 9.88m8.41-18.3A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.15 1.59 5.95L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89a11.82 11.82 0 0 0-3.48-8.41" />
    </svg>
  );
}

function SignalIcon() {
  // Official Signal icon mark, from Signal's brand asset kit (Logo/SVG/Signal-Logo-White.svg),
  // fill swapped to currentColor — same path as components/invite-buttons.tsx for consistency.
  return (
    <svg className="size-4" viewBox="0 0 160 160" fill="currentColor" aria-hidden="true">
      <path d="m80 0c4.1505 0 8.2271.31607 12.2072.925452l-1.1444 7.413248c-3.6069-.55226-7.3014-.8387-11.0628-.8387-3.7612 0-7.4555.28641-11.0623.83862l-1.1444-7.413245c3.9799-.609332 8.0564-.925375 12.2067-.925375z" />
      <path d="m98.9849 2.26619-1.7798 7.28755c7.3099 1.77896 14.1849 4.66606 20.4389 8.47306l3.895-6.411c-6.901-4.20091-14.488-7.38658-22.5541-9.34961z" />
      <path d="m127.279 15.4591-4.432 6.0507c5.977 4.3861 11.257 9.6664 15.643 15.6437l6.051-4.4324c-4.84-6.5957-10.666-12.4222-17.262-17.262z" />
      <path d="m148.384 38.4618-6.411 3.8942c3.807 6.2541 6.694 13.1299 8.473 20.4395l7.288-1.7798c-1.963-8.0657-5.149-15.6528-9.35-22.5539z" />
      <path d="m159.075 67.7934-7.414 1.1444c.553 3.6067.839 7.301.839 11.0622 0 3.7614-.286 7.4559-.839 11.0628l7.414 1.1444c.609-3.9801.925-8.0567.925-12.2072 0-4.1503-.316-8.2267-.925-12.2066z" />
      <path d="m141.973 117.645c3.807-6.255 6.694-13.13 8.473-20.44l7.288 1.7798c-1.963 8.0662-5.149 15.6532-9.35 22.5542z" />
      <path d="m138.49 122.847 6.051 4.432c-4.84 6.596-10.666 12.422-17.262 17.262l-4.433-6.051c5.978-4.386 11.258-9.666 15.644-15.643z" />
      <path d="m117.644 141.973 3.894 6.411c-6.901 4.201-14.488 7.387-22.5537 9.35l-1.7798-7.288c7.3095-1.779 14.1855-4.666 20.4395-8.473z" />
      <path d="m91.0622 151.661 1.1445 7.414c-3.9799.609-8.0564.925-12.2067.925-4.1505 0-8.2272-.316-12.2073-.925l1.1442-7.413c3.6054.552 7.2997.838 11.0631.838 3.7612 0 7.4555-.286 11.0622-.839z" />
      <path d="m62.7945 150.448-1.7794 7.286c-6.0589-1.475-11.8477-3.639-17.2785-6.406l-7.5927 1.772-1.7042-7.304 10.2604-2.394 2.4408 1.243c4.9187 2.506 10.1623 4.467 15.6536 5.803z" />
      <path d="m28.1097 147.273 1.7042 7.304-13.0145 3.036c-8.66079 2.021-16.433718-5.752-14.41286-14.412l3.03673-13.015 7.30383 1.704-3.03675 13.015c-.75782 3.248 2.15705 6.162 5.40485 5.405z" />
      <path d="m14.2041 125.56-7.30383-1.704 1.77163-7.593c-2.76664-5.431-4.93123-11.22-6.40585-17.2787l7.28586-1.7794c1.33599 5.4911 3.29709 10.7351 5.80279 15.6541l1.2435 2.441z" />
      <path d="m8.33759 91.0624-7.412228 1.1442c-.609324-3.9799-.925362-8.0563-.925362-12.2066 0-4.1505.316067-8.2271.925446-12.2072l7.413244 1.1444c-.55225 3.607-.83869 7.3014-.83869 11.0628 0 3.7631.28613 7.4572.83759 11.0624z" />
      <path d="m9.55373 62.795-7.28755-1.7798c1.96302-8.0657 5.1487-15.6528 9.34962-22.5539l6.411 3.8942c-3.807 6.2541-6.6941 13.1299-8.47307 20.4395z" />
      <path d="m21.5098 37.1531-6.0507-4.4324c4.8398-6.5957 10.6663-12.4221 17.262-17.2619l4.4324 6.0507c-5.9773 4.3861-11.2576 9.6663-15.6437 15.6436z" />
      <path d="m42.356 18.0266-3.8943-6.4111c6.9011-4.20082 14.4882-7.38645 22.554-9.34944l1.7798 7.28755c-7.3096 1.77899-14.1854 4.66589-20.4395 8.47299z" />
      <path d="m145 80c0 35.899-29.101 65-65 65-11.3866 0-22.0893-2.928-31.3965-8.072-.8961-.495-1.9417-.658-2.9389-.426l-28.9134 6.747 6.7465-28.914c.2326-.997.0692-2.043-.426-2.939-5.1439-9.307-8.0717-20.0095-8.0717-31.396 0-35.8985 29.1015-65 65-65 35.899 0 65 29.1015 65 65z" />
    </svg>
  );
}
