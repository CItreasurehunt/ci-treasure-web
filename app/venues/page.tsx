import { Metadata } from "next";
import { Suspense } from "react";
import { getVenues } from "@/lib/venues";
import { VenuesClient } from "./venues-client";

export const metadata: Metadata = {
  title: "CI Venues Worldwide",
  description: "Find Contact Improvisation venues and spaces around the world.",
};

export const revalidate = 3600;

export default async function VenuesPage() {
  const { venues, countries, venueCount, countryCount, error } = await getVenues();

  return (
    // Suspense is required here because VenuesClient calls useSearchParams(), not for data
    // (venues is already resolved above). Without a fallback, Next's streaming reveal pops the
    // whole grid in at once, shoving the footer down — same root cause as the homepage CLS bug
    // (I-136). Venues has no fixed-height dashboard to mirror exactly, but min-h-screen matches
    // the real content's own base height, closing most of the gap.
    <Suspense fallback={<div className="min-h-screen" />}>
      <VenuesClient
        initialVenues={venues}
        initialCountries={countries}
        initialVenueCount={venueCount}
        initialCountryCount={countryCount}
        initialError={error}
      />
    </Suspense>
  );
}
