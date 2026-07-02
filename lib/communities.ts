import { createClient } from "@/lib/supabase/server";

// Public submit/issue forms still live on Airtable until I-039 Step 2
export const COMMUNITY_SUBMIT_URL =
  "https://airtable.com/appQWr8oE2rc2URpU/pagqLIrZE1eCTbvqn/form";
export const COMMUNITY_ISSUE_URL =
  "https://airtable.com/appQWr8oE2rc2URpU/pagUNLXJ4aG1oRDJ3/form";

type CommunityRow = {
  id: string;
  name: string;
  slug: string | null;
  type: string | null;
  city: string | null;
  country: string | null; // ISO 3166-1 alpha-2
  continent: string | null;
  address_for_map: string | null;
  lat: number | null;
  lng: number | null;
  description: string | null;
  website: string | null;
  instagram: string | null;
  facebook_group: string | null;
  facebook_page: string | null;
  telegram_group: string | null;
  telegram_channel: string | null;
  whatsapp_channel: string | null;
  youtube: string | null;
  calendar: string | null;
  newsletter: string | null;
  other_resource: string | null;
  has_invites: boolean;
};

export type Community = {
  id: string;
  name: string;
  slug: string | null;
  city: string;
  country: string; // display label, e.g. "Germany"
  description: string | null;
  websiteUrl: string | null;
  facebookGroupUrl: string | null;
  facebookPageUrl: string | null;
  instagramUrl: string | null;
  telegramGroupUrl: string | null;
  telegramChannelUrl: string | null;
  whatsappChannelUrl: string | null;
  youtubeUrl: string | null;
  calendarUrl: string | null;
  newsletterUrl: string | null;
  otherResourceUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  hasInvites: boolean;
};

export type CommunitiesResponse = {
  communities: Community[];
  countries: Array<{ value: string; label: string }>;
  communityCount: number;
  countryCount: number;
  error: string | null;
};

const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

function countryLabel(row: CommunityRow): string {
  if (row.country) {
    try {
      return countryNames.of(row.country) ?? row.country;
    } catch {
      return row.country;
    }
  }
  // No ISO code (e.g. "Worldwide / several") — fall back to the address tail
  const tail = row.address_for_map?.split(",").map((p) => p.trim()).filter(Boolean).at(-1);
  return tail ?? "Worldwide / International";
}

function normalizeUrl(value: string | null): string | null {
  if (!value) return null;
  const str = value.trim();
  if (!str) return null;
  if (/^https?:\/\//i.test(str)) return str;
  if (/^mailto:/i.test(str)) return str;
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str)) return `mailto:${str}`;
  // Free text (e.g. Calendar notes) — not renderable as a link
  if (/\s/.test(str) || !str.includes(".")) return null;
  return `https://${str}`;
}

function toCommunity(row: CommunityRow): Community {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    city: row.city ?? "",
    country: countryLabel(row),
    description: row.description,
    websiteUrl: normalizeUrl(row.website),
    facebookGroupUrl: normalizeUrl(row.facebook_group),
    facebookPageUrl: normalizeUrl(row.facebook_page),
    instagramUrl: normalizeUrl(row.instagram),
    telegramGroupUrl: normalizeUrl(row.telegram_group),
    telegramChannelUrl: normalizeUrl(row.telegram_channel),
    whatsappChannelUrl: normalizeUrl(row.whatsapp_channel),
    youtubeUrl: normalizeUrl(row.youtube),
    calendarUrl: normalizeUrl(row.calendar),
    newsletterUrl: normalizeUrl(row.newsletter),
    otherResourceUrl: normalizeUrl(row.other_resource),
    latitude: row.lat,
    longitude: row.lng,
    hasInvites: row.has_invites,
  };
}

export function isPrivateGroupInvite(url: string | null): boolean {
  if (!url) return false;
  return (
    /^https?:\/\/chat\.whatsapp\.com\//i.test(url) ||
    /^https?:\/\/t\.me\/(\+|joinchat\/)/i.test(url) ||
    /^https?:\/\/signal\.group\//i.test(url)
  );
}

export function hasPrivateGroupLink(community: Community): boolean {
  return community.hasInvites;
}

export function getPrimaryJoinUrl(community: Community): string | null {
  // Defense in depth: never surface an invite link even if one slips into a public column
  const telegramGroupUrl = !isPrivateGroupInvite(community.telegramGroupUrl)
    ? community.telegramGroupUrl
    : null;
  const telegramUrl = !isPrivateGroupInvite(community.telegramChannelUrl)
    ? community.telegramChannelUrl
    : null;
  const whatsappUrl = !isPrivateGroupInvite(community.whatsappChannelUrl)
    ? community.whatsappChannelUrl
    : null;
  const otherUrl = !isPrivateGroupInvite(community.otherResourceUrl)
    ? community.otherResourceUrl
    : null;
  return (
    community.websiteUrl ??
    community.calendarUrl ??
    community.facebookGroupUrl ??
    community.facebookPageUrl ??
    community.instagramUrl ??
    telegramGroupUrl ??
    telegramUrl ??
    whatsappUrl ??
    community.newsletterUrl ??
    otherUrl ??
    null
  );
}

function sortCommunities(communities: Community[]): Community[] {
  return [...communities].sort((a, b) => {
    const countryCompare = a.country.localeCompare(b.country);
    if (countryCompare !== 0) return countryCompare;
    return a.name.localeCompare(b.name);
  });
}

export async function getCommunities(): Promise<CommunitiesResponse> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("communities")
      .select(
        "id,name,slug,type,city,country,continent,address_for_map,lat,lng,description,website,instagram,facebook_group,facebook_page,telegram_group,telegram_channel,whatsapp_channel,youtube,calendar,newsletter,other_resource,has_invites",
      )
      .is("deleted_at", null)
      .order("name");

    if (error) throw new Error(error.message);

    const communities = sortCommunities((data as CommunityRow[]).map(toCommunity));
    const uniqueCountries = Array.from(new Set(communities.map((c) => c.country).filter(Boolean)))
      .sort((a, b) => a.localeCompare(b))
      .map((country) => ({ value: country, label: country }));

    return {
      communities,
      countries: uniqueCountries,
      communityCount: communities.length,
      countryCount: uniqueCountries.length,
      error: null,
    };
  } catch (error) {
    return {
      communities: [],
      countries: [],
      communityCount: 0,
      countryCount: 0,
      error:
        error instanceof Error ? error.message : "Failed to load communities. Please try again later.",
    };
  }
}
