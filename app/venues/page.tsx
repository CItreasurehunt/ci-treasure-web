import { Metadata } from "next";
import { Suspense } from "react";
import { getVenues } from "@/lib/venues";
import { VenuesClient } from "./venues-client";

export const metadata: Metadata = {
  title: "CI Venues Worldwide",
  description: "Find Contact Improvisation venues and spaces around the world.",
};

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function VenuesPage() {
  const { venues, countries, venueCount, countryCount, error } = await getVenues();

  return (
    <Suspense>
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
