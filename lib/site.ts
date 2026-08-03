export const SITE_URL = "https://citreasurehunt.com";
// Referenced explicitly on pages without their own entity photo — Next's
// automatic opengraph-image.jpg fallback only reaches statically-exported
// `metadata`, not pages using `generateMetadata` (confirmed: homepage gets
// the fallback, /teachers/[slug] with no photo does not, despite an
// otherwise identical openGraph shape).
export const SITE_OG_IMAGE = `${SITE_URL}/opengraph-image.jpg`;

// `ogImage()` (the `sharp`-based dimension probe) lives in `lib/og-image.ts`, not here — this
// file is imported by client components too (e.g. `invite-buttons.tsx` for TELEGRAM_URL), and a
// dynamic `import("sharp")` anywhere in a module client components pull in still gets analyzed
// for the client bundle, which broke the build (`sharp`/`detect-libc` need Node's `fs`/
// `child_process`, unavailable in the browser). Keeping the probe in its own server-only-imported
// file avoids that entirely.

const TITLE_SUFFIX = "CI Treasure Hunt";
const TITLE_MAX_LEN = 60;

// Google/Bing truncate <title> around ~60 characters in the SERP (og:title, used for link
// previews, is set separately to just the bare entity name and never has this problem — see
// each generateMetadata's openGraph.title). Ahrefs flagged ~120 pages "Title too long" (I-150):
// venue/community titles concatenated name + city + country + site suffix with no length
// awareness. This degrades gracefully, keeping the entity name intact (never truncated — a
// long proper name is a content decision, not a template one) and dropping lower-priority
// pieces first: the brand suffix, then country, then city. Confirmed against real data that
// dropping the suffix alone resolves the large majority of flagged cases — for a directory site
// not yet a known brand, local-search-relevant location matters more to SERP relevance than
// brand recognition, so it's kept longer.
export function buildEntityTitle(
  name: string,
  location?: { city?: string | null; country?: string | null },
  maxLen = TITLE_MAX_LEN,
): string {
  const city = location?.city?.trim() || null;
  const country = location?.country?.trim() || null;
  const cityCountry = city && country ? `${city}, ${country}` : city;

  const candidates = [
    cityCountry ? `${name} — ${cityCountry} — ${TITLE_SUFFIX}` : `${name} — ${TITLE_SUFFIX}`,
    cityCountry ? `${name} — ${cityCountry}` : null,
    city && country ? `${name} — ${city}` : null,
    name,
  ].filter((c): c is string => c !== null);

  return candidates.find((c) => c.length <= maxLen) ?? candidates[candidates.length - 1];
}

export const TELEGRAM_URL = "https://t.me/citreasurehunt";
export const FACEBOOK_URL = "https://www.facebook.com/citreasurehunt/";
export const INSTAGRAM_URL = "https://www.instagram.com/citreasurehunt/";
export const NEWSLETTER_URL =
  process.env.NEXT_PUBLIC_NEWSLETTER_URL || "https://citreasurehunt.eo.page/7y7hk";
