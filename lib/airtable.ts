const AIRTABLE_API_URL = "https://api.airtable.com/v0";
const COMMUNITY_SUBMIT_URL =
  "https://airtable.com/appQWr8oE2rc2URpU/pagqLIrZE1eCTbvqn/form";
const COMMUNITY_ISSUE_URL =
  "https://airtable.com/appQWr8oE2rc2URpU/pagUNLXJ4aG1oRDJ3/form";

export const AIRTABLE_FIELD_MAPPING = {
  name: "Community Name",
  city: "City",
  country: "Country",
  addressForMap: "Adress for Map",
  description: "Description",
  status: "Status",
  websiteUrl: "Website",
  facebookGroupUrl: "Facebook Group",
  facebookPageUrl: "Facebook Page",
  instagramUrl: "Instagram",
  telegramChannelUrl: "Telegram Channel",
  whatsappChannelUrl: "WhatsApp Channel",
  calendarUrl: "Calendar",
  newsletterUrl: "Mailing List / Newsletter",
  otherResourceUrl: "Other Platform or Resource",
  latitude: "Latitude",
  longitude: "Longitude",
} as const;

type AirtableRecord = {
  id?: string;
  fields?: Record<string, unknown>;
};

export type Community = {
  id: string;
  name: string;
  city: string;
  country: string;
  addressForMap: string | null;
  description: string | null;
  websiteUrl: string | null;
  facebookGroupUrl: string | null;
  facebookPageUrl: string | null;
  instagramUrl: string | null;
  telegramChannelUrl: string | null;
  whatsappChannelUrl: string | null;
  calendarUrl: string | null;
  newsletterUrl: string | null;
  otherResourceUrl: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type CommunitiesResponse = {
  communities: Community[];
  countries: Array<{ value: string; label: string }>;
  communityCount: number;
  countryCount: number;
  error: string | null;
};

function hasAirtableEnv(): boolean {
  return Boolean(process.env.AIRTABLE_PAT && process.env.AIRTABLE_BASE_ID && process.env.AIRTABLE_TABLE_ID);
}

function getFieldValue(record: Record<string, unknown>, fieldName: string): unknown {
  return record[fieldName] ?? null;
}

function normalizeString(value: unknown): string | null {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }

  if (Array.isArray(value)) {
    const strings = value
      .map((entry) => (typeof entry === "string" ? entry.trim() : ""))
      .filter(Boolean);

    if (strings.length === 0) {
      return null;
    }

    return strings.join(", ");
  }

  return null;
}

function normalizeNumber(value: unknown): number | null {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function deriveCountry(record: Record<string, unknown>): string {
  const directCountry = normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.country));
  if (directCountry) {
    return directCountry;
  }

  const addressForMap = normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.addressForMap));
  if (!addressForMap) {
    return "";
  }

  const parts = addressForMap
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return parts.at(-1) ?? "";
}

function normalizeRecord(record: Record<string, unknown>, id: string): Community | null {
  const name = normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.name));
  if (!name) {
    return null;
  }

  const status = normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.status));
  if (status && status !== "Active") {
    return null;
  }

  return {
    id,
    name,
    city: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.city)) ?? "",
    country: deriveCountry(record),
    addressForMap: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.addressForMap)),
    description: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.description)),
    websiteUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.websiteUrl)),
    facebookGroupUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.facebookGroupUrl)),
    facebookPageUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.facebookPageUrl)),
    instagramUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.instagramUrl)),
    telegramChannelUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.telegramChannelUrl)),
    whatsappChannelUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.whatsappChannelUrl)),
    calendarUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.calendarUrl)),
    newsletterUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.newsletterUrl)),
    otherResourceUrl: normalizeString(getFieldValue(record, AIRTABLE_FIELD_MAPPING.otherResourceUrl)),
    latitude: normalizeNumber(getFieldValue(record, AIRTABLE_FIELD_MAPPING.latitude)),
    longitude: normalizeNumber(getFieldValue(record, AIRTABLE_FIELD_MAPPING.longitude)),
  };
}

function sortCommunities(communities: Community[]): Community[] {
  return [...communities].sort((a, b) => {
    const countryCompare = a.country.localeCompare(b.country);
    if (countryCompare !== 0) {
      return countryCompare;
    }

    return a.name.localeCompare(b.name);
  });
}

function extractCountries(communities: Community[]): Array<{ value: string; label: string }> {
  const uniqueCountries = new Set<string>();
  for (const community of communities) {
    if (community.country) {
      uniqueCountries.add(community.country);
    }
  }

  return Array.from(uniqueCountries)
    .sort((a, b) => a.localeCompare(b))
    .map((country) => ({ value: country, label: country }));
}

export function getPrimaryJoinUrl(community: Community): string | null {
  return (
    community.websiteUrl ??
    community.calendarUrl ??
    community.facebookGroupUrl ??
    community.facebookPageUrl ??
    community.instagramUrl ??
    community.telegramChannelUrl ??
    community.whatsappChannelUrl ??
    community.newsletterUrl ??
    community.otherResourceUrl ??
    null
  );
}

async function fetchCommunitiesPage(offset?: string): Promise<{
  records: AirtableRecord[];
  offset?: string;
}> {
  const apiKey = process.env.AIRTABLE_PAT!;
  const baseId = process.env.AIRTABLE_BASE_ID!;
  const tableId = process.env.AIRTABLE_TABLE_ID!;

  const url = new URL(`${AIRTABLE_API_URL}/${baseId}/${encodeURIComponent(tableId)}`);
  url.searchParams.set("cellFormat", "string");
  url.searchParams.set("timeZone", "Europe/Berlin");
  url.searchParams.set("userLocale", "en");
  url.searchParams.set("filterByFormula", "{Status}='Active'");

  if (offset) {
    url.searchParams.set("offset", offset);
  }

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    next: { revalidate: 24 * 60 * 60 },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to load communities: ${response.status} ${response.statusText}. ${errorText}`);
  }

  return response.json();
}

export async function getCommunities(): Promise<CommunitiesResponse> {
  if (!hasAirtableEnv()) {
    return {
      communities: [],
      countries: [],
      communityCount: 0,
      countryCount: 0,
      error: "Airtable is not configured. Please set AIRTABLE_PAT, AIRTABLE_BASE_ID, and AIRTABLE_TABLE_ID environment variables.",
    };
  }

  try {
    const records: AirtableRecord[] = [];
    let offset: string | undefined;

    do {
      const page = await fetchCommunitiesPage(offset);
      records.push(...(Array.isArray(page.records) ? page.records : []));
      offset = page.offset;
    } while (offset);

    const communities = records
      .map((record) => normalizeRecord(record.fields ?? {}, record.id ?? ""))
      .filter((community): community is Community => Boolean(community));

    const sorted = sortCommunities(communities);
    const countries = extractCountries(sorted);

    return {
      communities: sorted,
      countries,
      communityCount: sorted.length,
      countryCount: countries.length,
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

export { COMMUNITY_ISSUE_URL, COMMUNITY_SUBMIT_URL };
