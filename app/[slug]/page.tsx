import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { CountryCombinedMap } from "@/components/country-combined-map";
import { CommunityCard } from "@/app/communities/communities-client";
import { EventCard } from "@/components/event-card";
import { GENERIC_ACCENT_GRADIENT } from "@/lib/event-display";
import { COMMUNITY_SUBMIT_URL } from "@/lib/communities";
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
        <header className="mb-12">
          <h1 className="mb-4 font-serif text-3xl text-slate-900 md:text-5xl">
            {flag ? `${flag} ` : ""}Contact Improvisation in {label}
          </h1>

          {/* Stat strip: bold counts + small labels, not a plain inline text row — gives
              search snippets and quick scanners something concrete to grab onto. */}
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ["communities", communities.length + nationalCommunities.length],
              ["teachers", teachers.length],
              ["upcoming events", events.length],
              ["venues", venues.length],
            ].map(([labelText, count]) => (
              <div key={labelText} className="rounded-xl border border-(--color-sand-strong) bg-white px-4 py-3 text-center">
                <p className="font-serif text-2xl text-slate-900">{count}</p>
                <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{labelText}</p>
              </div>
            ))}
          </div>

          {/* Map given more visual weight than the text (5/7 split) — it's the fastest way to
              answer "where does this scene physically happen," ahead of reading prose. */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-start">
            <div className="lg:col-span-5">
              <h2 className="mb-2 font-serif text-xl text-slate-900">Overview</h2>
              <p className="text-lg leading-8 whitespace-pre-line text-slate-700">
                {summaryText}
              </p>
            </div>
            {mapMarkers.length > 0 && (
              // Fixed height at every breakpoint — h-full/min-h against an unstretched grid
              // track (lg:items-start) previously left the map's actual height ambiguous and
              // it rendered far taller than intended.
              <div className="h-96 lg:col-span-7">
                <CountryCombinedMap markers={mapMarkers} />
              </div>
            )}
          </div>
        </header>

        {nationalCommunities.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">National community</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {nationalCommunities.map((c) => (
                <CommunityCard key={c.id} community={c} onShowOnMap={undefined} />
              ))}
            </div>
          </section>
        )}

        {communities.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Communities</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {communities.map((c) => (
                <CommunityCard key={c.id} community={c} onShowOnMap={undefined} />
              ))}
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Know a community in {label} we&apos;re missing?{" "}
              <a href={COMMUNITY_SUBMIT_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-(--color-pine) hover:underline">
                Suggest it →
              </a>
            </p>
          </section>
        )}

        {teachers.length > 0 && (
          <section className="mb-12">
            <h2 className="mb-4 font-serif text-2xl text-slate-900">Teachers</h2>
            {teachers.some((t) => t.imageUrl) ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {teachers.map((t) => (
                  <TeacherCard key={t.id} teacher={t} />
                ))}
              </div>
            ) : (
              // No teacher in this country has a profile photo yet (common — teacher image
              // outreach is still early sitewide). A grid of empty gradient blocks would just
              // be visual weight with nothing behind it, so a plain compact list runs more
              // teachers per screen instead.
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {teachers.map((t) => (
                  <CompactTeacherRow key={t.id} teacher={t} />
                ))}
              </div>
            )}
            <p className="mt-3 text-sm text-slate-500">
              Know a teacher, organizer, or musician who should be listed?{" "}
              <Link href="/auth" className="font-medium text-(--color-pine) hover:underline">
                Create your profile →
              </Link>
            </p>
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
            <p className="mt-3 text-sm text-slate-500">
              Missing your event in {label}?{" "}
              <Link href="/events/new" className="font-medium text-(--color-pine) hover:underline">
                Add it →
              </Link>
            </p>
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
            <p className="mt-3 text-sm text-slate-500">
              Know a venue in {label} that should be here?{" "}
              <a href="mailto:hello@citreasurehunt.com" className="font-medium text-(--color-pine) hover:underline">
                Let us know →
              </a>
            </p>
          </section>
        )}
      </div>
    </main>
  );
}

function CompactTeacherRow({ teacher }: { teacher: { name: string; slug: string; city: string | null; bio: string | null } }) {
  return (
    <div className="rounded-xl border border-(--color-sand-strong) bg-white p-3">
      <h3 className="font-serif text-base text-slate-900">
        <Link href={`/teachers/${teacher.slug}`} className="hover:underline">{teacher.name}</Link>
      </h3>
      {teacher.city && <p className="text-xs text-slate-500">{teacher.city}</p>}
      {teacher.bio && <p className="mt-1 line-clamp-2 text-sm text-slate-600">{teacher.bio}</p>}
    </div>
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
