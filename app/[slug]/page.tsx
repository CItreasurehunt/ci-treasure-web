import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Globe, MapPin } from "lucide-react";

import { CountryEventMap } from "@/components/country-event-map";
import { EventCard } from "@/components/event-card";
import { GENERIC_ACCENT_GRADIENT } from "@/lib/event-display";
import { getAllCountrySlugs, getCountryPageData } from "@/lib/country-pages";
import { getCountryFlag } from "@/lib/utils";
import { getMediumUrl } from "@/lib/image-url";
import { SITE_URL, SITE_OG_IMAGE } from "@/lib/site";

export const revalidate = 3600;

type CountryPageProps = {
  params: Promise<{ slug: string }>;
};

// I-132 Step 1 (pilot): this route intentionally has no entry in app/sitemap.ts and no inbound
// links from the homepage/breadcrumbs yet — see docs/issues/i-132-country-pages.md. The page
// exists at its real URL for direct review only. generateStaticParams below is scoped to
// country_summaries rows, so an unmatched slug 404s rather than rendering — required since this
// is a root-level catch-all route sitting alongside /venues, /teachers, /newsletter, etc.
export async function generateStaticParams() {
  const slugs = await getAllCountrySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: CountryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const country = await getCountryPageData(slug);
  if (!country) return {};

  const description = `Contact Improvisation in ${country.label}: communities, teachers, upcoming events, and venues.`;
  return {
    title: `Contact Improvisation in ${country.label} — CI Treasure Hunt`,
    description,
    alternates: {
      canonical: `${SITE_URL}/${country.slug}`,
    },
    openGraph: {
      title: `Contact Improvisation in ${country.label}`,
      description,
      url: `${SITE_URL}/${country.slug}`,
      images: [{ url: SITE_OG_IMAGE }],
    },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const country = await getCountryPageData(slug);
  if (!country) notFound();

  const { label, iso, summaryText, nationalCommunities, communities, teachers, events, venues } = country;
  const flag = getCountryFlag(iso);

  return (
    <main className="min-h-screen bg-(--color-mist) px-5 py-10 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10">
          <h1 className="mb-4 font-serif text-3xl text-slate-900 md:text-5xl">
            {flag ? `${flag} ` : ""}Contact Improvisation in {label}
          </h1>
          <p className="max-w-3xl text-lg leading-8 whitespace-pre-line text-slate-700">
            {summaryText}
          </p>
        </header>

        {nationalCommunities.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">National community</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {nationalCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>
          </section>
        )}

        {communities.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Communities</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {communities.map((c) => (
                <CommunityCard key={c.id} community={c} />
              ))}
            </div>
          </section>
        )}

        {teachers.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Teachers</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teachers.map((t) => (
                <TeacherCard key={t.id} teacher={t} />
              ))}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Upcoming events</h2>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </section>
        )}

        {venues.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Venues</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {venues.map((v) => (
                <VenueCard key={v.id} venue={v} />
              ))}
            </div>
          </section>
        )}

        {events.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Map</h2>
            <div className="h-105">
              <CountryEventMap events={events} />
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

function CommunityCard({ community }: { community: { name: string; slug: string; city: string | null; website: string | null } }) {
  return (
    <Link
      href={`/communities/${community.slug}`}
      className="block rounded-2xl border border-(--color-sand-strong) bg-white p-4 shadow-sm transition hover:shadow-lg"
    >
      <h3 className="font-serif text-lg text-slate-900">{community.name}</h3>
      {community.city && (
        <p className="mt-1 flex items-center gap-1 text-sm text-slate-500">
          <MapPin className="size-3 shrink-0 text-slate-400" />
          {community.city}
        </p>
      )}
      {community.website && (
        <p className="mt-2 flex items-center gap-1 text-sm text-(--color-pine)">
          <Globe className="size-3.5" />
          {community.website.replace(/^https?:\/\//, "")}
        </p>
      )}
    </Link>
  );
}

function TeacherCard({ teacher }: { teacher: { name: string; slug: string; city: string | null; bio: string | null; imageUrl: string | null } }) {
  const imageUrl = teacher.imageUrl?.trim() ?? "";
  const renderImage = imageUrl.length > 0;

  return (
    <Link
      href={`/teachers/${teacher.slug}`}
      className="group flex overflow-hidden rounded-2xl border border-(--color-sand-strong) bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className={`h-24 w-24 shrink-0 border-r border-(--color-sand-strong) ${!renderImage ? GENERIC_ACCENT_GRADIENT : ""}`}>
        {renderImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediumUrl(imageUrl)} alt={teacher.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 p-4">
        <h3 className="font-serif text-lg text-slate-900">{teacher.name}</h3>
        {teacher.city && <p className="text-sm text-slate-500">{teacher.city}</p>}
        {teacher.bio && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{teacher.bio}</p>}
      </div>
    </Link>
  );
}

function VenueCard({ venue }: { venue: { name: string; slug: string; city: string; description: string | null; imageUrl: string | null } }) {
  const imageUrl = venue.imageUrl?.trim() ?? "";
  const renderImage = imageUrl.length > 0;

  return (
    <Link
      href={`/venues/${venue.slug}`}
      className="group flex overflow-hidden rounded-2xl border border-(--color-sand-strong) bg-white shadow-sm transition hover:shadow-lg"
    >
      <div className={`h-24 w-24 shrink-0 border-r border-(--color-sand-strong) ${!renderImage ? GENERIC_ACCENT_GRADIENT : ""}`}>
        {renderImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediumUrl(imageUrl)} alt={venue.name} className="h-full w-full object-cover" />
        )}
      </div>
      <div className="min-w-0 flex-1 p-4">
        <h3 className="font-serif text-lg text-slate-900">{venue.name}</h3>
        <p className="text-sm text-slate-500">{venue.city}</p>
        {venue.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{venue.description}</p>}
      </div>
    </Link>
  );
}
