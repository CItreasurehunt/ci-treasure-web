import { Metadata } from "next";
import { getCommunities } from "@/lib/airtable";
import { CommunitiesClient } from "./communities-client";

export const metadata: Metadata = {
  title: "CI Communities Worldwide",
  description: "Find and join Contact Improvisation communities around the world.",
};

export const revalidate = 21600; // recheck Airtable at most every 6 hours

export default async function CommunitiesPage() {
  const { communities, countries, communityCount, countryCount, error } =
    await getCommunities();

  return (
    <CommunitiesClient
      initialCommunities={communities}
      initialCountries={countries}
      initialCommunityCount={communityCount}
      initialCountryCount={countryCount}
      initialError={error}
    />
  );
}
