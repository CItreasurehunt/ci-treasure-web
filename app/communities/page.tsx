import { Metadata } from "next";
import { Suspense } from "react";
import { getCommunities } from "@/lib/communities";
import { CommunitiesClient } from "./communities-client";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "CI Communities Worldwide",
  description: "Find and join Contact Improvisation communities around the world.",
  // Filter state (country/type/etc.) lives in the URL via router.replace, not real <a href>
  // links — Googlebot won't discover ?country=SE... through normal crawling, but a filtered
  // URL copied from the address bar and shared externally could still get indexed on its own
  // without this, diluting the canonical /communities page across filter-combination URLs.
  alternates: { canonical: `${SITE_URL}/communities` },
};

export const revalidate = 3600;

export default async function CommunitiesPage() {
  const { communities, countries, communityCount, countryCount, error } =
    await getCommunities();

  return (
    // Same fix as venues/page.tsx and the original homepage CLS bug (I-136): Suspense is
    // required for useSearchParams(), not data, but a bare fallback lets the real content pop
    // in all at once and shove the footer down. min-h-screen matches the real content's own
    // base height.
    <Suspense fallback={<div className="min-h-screen" />}>
      <CommunitiesClient
        initialCommunities={communities}
        initialCountries={countries}
        initialCommunityCount={communityCount}
        initialCountryCount={countryCount}
        initialError={error}
      />
    </Suspense>
  );
}
