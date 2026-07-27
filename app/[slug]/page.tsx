import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, Globe, MapPin } from "lucide-react";

import { CountryCombinedMap } from "@/components/country-combined-map";
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
  const title = `Contact Improvisation in ${country.label}`;
  return {
    title: `${title} — CI Treasure Hunt`,
    description,
    alternates: {
      canonical: `${SITE_URL}/${country.slug}`,
    },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/${country.slug}`,
      images: [{ url: SITE_OG_IMAGE }],
    },
    // Root layout's default twitter: block is worldwide/generic — without this override every
    // country page's card on X/Twitter would say "CI Treasure Hunt" instead of naming the
    // country, undermining the one channel (external CI orgs sharing their own country link)
    // this whole feature is meant to earn.
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [SITE_OG_IMAGE],
    },
  };
}

export default async function CountryPage({ params }: CountryPageProps) {
  const { slug } = await params;
  const country = await getCountryPageData(slug);
  if (!country) notFound();

  const { label, iso, summaryText, nationalCommunities, communities, teachers, events, venues, mapMarkers } = country;
  const flag = getCountryFlag(iso);

  // Schema-only breadcrumb (I-132 follow-up, 2026-07-27): describes the page's position in the
  // site hierarchy independent of any visible trail. Deliberately decoupled from the visible
  // breadcrumb UI, which stays gated behind Step 2 (linking) — Google reads BreadcrumbList
  // structured data on its own terms, it doesn't require an on-page element to match it. Has no
  // practical effect until the page is actually crawled (Step 2 also adds the sitemap entry),
  // but costs nothing to ship now rather than bundling it with the visible-UI gate.
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: label, item: `${SITE_URL}/${slug}` },
    ],
  };

  return (
    <main className="min-h-screen bg-(--color-mist) px-5 py-10 sm:px-8 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, "\\u003c") }}
      />
      <div className="mx-auto max-w-5xl">
        <header className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-start">
          <div>
            <h1 className="mb-4 font-serif text-3xl text-slate-900 md:text-5xl">
              {flag ? `${flag} ` : ""}Contact Improvisation in {label}
            </h1>
            <div className="mb-6 flex flex-wrap gap-x-6 gap-y-1 text-sm font-medium text-slate-700">
              <span>{communities.length + nationalCommunities.length} communities</span>
              <span>{teachers.length} teachers</span>
              <span>{events.length} upcoming events</span>
              <span>{venues.length} venues</span>
            </div>
            <h2 className="mb-2 font-serif text-xl text-slate-900">Overview</h2>
            <p className="max-w-3xl text-lg leading-8 whitespace-pre-line text-slate-700">
              {summaryText}
            </p>
          </div>
          {mapMarkers.length > 0 && (
            <div className="h-80 lg:h-full lg:min-h-105">
              <CountryCombinedMap markers={mapMarkers} />
            </div>
          )}
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

        <section className="mb-12 rounded-2xl bg-(--color-pine) p-8 text-white">
          <h2 className="mb-6 text-center font-serif text-2xl">Something missing?</h2>
          <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3">
            <div className="flex flex-col items-center">
              <p className="mb-4 text-sm leading-6 text-white/75">
                Know a teacher, organizer, or musician who should be listed?
              </p>
              <a
                href="/auth"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-(--color-pine) transition hover:bg-slate-100"
              >
                Create your profile
              </a>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-4 text-sm leading-6 text-white/75">
                Running an event in {label} that isn&apos;t listed yet?
              </p>
              <a
                href="/events/new"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-(--color-pine) transition hover:bg-slate-100"
              >
                Add an event
              </a>
            </div>
            <div className="flex flex-col items-center">
              <p className="mb-4 text-sm leading-6 text-white/75">
                Know a venue that should be on this page?
              </p>
              <a
                href="mailto:hello@citreasurehunt.com"
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-(--color-pine) transition hover:bg-slate-100"
              >
                <ExternalLink className="size-4" />
                hello@citreasurehunt.com
              </a>
            </div>
          </div>
        </section>
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

  // Bio deliberately sits outside the <Link>: a screen reader shouldn't announce a
  // 100+ word bio as one giant clickable link, and search engines shouldn't see a wall of
  // unrelated prose as this URL's anchor text. Only the name (and image) are the link.
  return (
    <div className="flex overflow-hidden rounded-2xl border border-(--color-sand-strong) bg-white shadow-sm transition hover:shadow-lg">
      <Link href={`/teachers/${teacher.slug}`} className={`h-24 w-24 shrink-0 border-r border-(--color-sand-strong) ${!renderImage ? GENERIC_ACCENT_GRADIENT : ""}`}>
        {renderImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediumUrl(imageUrl)} alt={teacher.name} className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="min-w-0 flex-1 p-4">
        <h3 className="font-serif text-lg text-slate-900">
          <Link href={`/teachers/${teacher.slug}`} className="hover:underline">{teacher.name}</Link>
        </h3>
        {teacher.city && <p className="text-sm text-slate-500">{teacher.city}</p>}
        {teacher.bio && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{teacher.bio}</p>}
      </div>
    </div>
  );
}

function VenueCard({ venue }: { venue: { name: string; slug: string; city: string; description: string | null; imageUrl: string | null } }) {
  const imageUrl = venue.imageUrl?.trim() ?? "";
  const renderImage = imageUrl.length > 0;

  // Same anchor-text/a11y fix as TeacherCard: description stays outside the <Link>.
  return (
    <div className="flex overflow-hidden rounded-2xl border border-(--color-sand-strong) bg-white shadow-sm transition hover:shadow-lg">
      <Link href={`/venues/${venue.slug}`} className={`h-24 w-24 shrink-0 border-r border-(--color-sand-strong) ${!renderImage ? GENERIC_ACCENT_GRADIENT : ""}`}>
        {renderImage && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediumUrl(imageUrl)} alt={venue.name} className="h-full w-full object-cover" />
        )}
      </Link>
      <div className="min-w-0 flex-1 p-4">
        <h3 className="font-serif text-lg text-slate-900">
          <Link href={`/venues/${venue.slug}`} className="hover:underline">{venue.name}</Link>
        </h3>
        <p className="text-sm text-slate-500">{venue.city}</p>
        {venue.description && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{venue.description}</p>}
      </div>
    </div>
  );
}
