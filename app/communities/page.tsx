import { Metadata } from "next";
import { Suspense } from "react";
import { getCommunities } from "@/lib/communities";
import { CommunitiesClient } from "./communities-client";

export const metadata: Metadata = {
  title: "CI Communities Worldwide",
  description: "Find and join Contact Improvisation communities around the world.",
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
