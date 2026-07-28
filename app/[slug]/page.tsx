import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink, MapPin } from "lucide-react";

import { CountryCombinedMap } from "@/components/country-combined-map";
import { EventCard } from "@/components/event-card";
import { ExpandableList } from "@/components/expandable-list";
import { GENERIC_ACCENT_GRADIENT } from "@/lib/event-display";
import { COMMUNITY_SUBMIT_URL, getPrimaryJoinUrl, type Community } from "@/lib/communities";
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
      siteName: "CI Treasure Hunt",
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
        <header className="mb-10">
          <h1 className="mb-4 font-serif text-3xl text-slate-900 md:text-5xl">
            {flag ? `${flag} ` : ""}Contact Improvisation in {label}
          </h1>

          {/* Stat strip: bold counts + small labels, not a plain inline text row — gives
              search snippets and quick scanners something concrete to grab onto. Each stat links
              down to its own section (matching anchor id) when that section actually renders;
              a stat reading 0 has nothing to jump to, so it stays a plain box instead of a dead link. */}
          <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(
              [
                ["communities", communities.length + nationalCommunities.length, "communities"],
                ["teachers", teachers.length, "teachers"],
                ["upcoming events", events.length, "events"],
                ["venues", venues.length, "venues"],
              ] as const
            ).map(([labelText, count, anchorId]) => {
              const content = (
                <>
                  <p className="font-serif text-xl text-slate-900">{count}</p>
                  <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">{labelText}</p>
                </>
              );
              return count > 0 ? (
                <a
                  key={labelText}
                  href={`#${anchorId}`}
                  className="rounded-xl border border-(--color-sand-strong) bg-white px-4 py-2.5 text-center transition hover:border-(--color-pine) hover:shadow-sm"
                >
                  {content}
                </a>
              ) : (
                <div key={labelText} className="rounded-xl border border-(--color-sand-strong) bg-white px-4 py-2.5 text-center">
                  {content}
                </div>
              );
            })}
          </div>

          {/* Map fixed-size and floated top-right, text flows around/below it — deliberately
              not a grid, so the map's size and the summary text's length are fully decoupled.
              A grid that stretches both to equal height makes the map inherit however long the
              text is (bad: a 3-paragraph summary produced a huge, over-zoomed-out map); a grid
              that fixes the map's height independently leaves an empty gutter under whichever
              column is shorter. A float has neither failure mode: short text just leaves the
              map extending a bit further down (normal, reads as an inset illustration, not a
              layout bug), and long text simply continues at full width once it clears the
              float's bottom edge. `flow-root` on the wrapper is the modern non-hacky way to
              stop the section from collapsing its height around the floated child. */}
          <div className="flow-root">
            {mapMarkers.length > 0 && (
              <div className="mb-6 h-80 w-full overflow-hidden rounded-2xl border border-(--color-sand-strong) lg:float-right lg:mb-4 lg:ml-8 lg:h-[420px] lg:w-[420px]">
                <CountryCombinedMap markers={mapMarkers} />
              </div>
            )}
            <h2 className="mb-2 font-serif text-xl text-slate-900">Overview</h2>
            <p className="text-lg leading-8 whitespace-pre-line text-slate-700">
              {summaryText}
            </p>
          </div>
        </header>

        {(nationalCommunities.length > 0 || communities.length > 0) && (
          // Single anchor wraps both the national-spotlight and general communities blocks —
          // the stat strip's "communities" count is their combined total, so it should jump to
          // wherever the first of the two actually renders, not just one or the other.
          <div id="communities" className="scroll-mt-6">
            {nationalCommunities.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 font-serif text-xl text-slate-900">National community</h2>
                <div className="space-y-2">
                  {nationalCommunities.map((c) => (
                    <CompactCommunityRow key={c.id} community={c} />
                  ))}
                </div>
              </section>
            )}

            {/* Communities and Teachers are stacked full-width, not paired side by side — a
                5-row list next to a 13-row list (Sweden today) or a 25-row list next to a 39-row
                list (Germany-scale, eventually) reads as broken when compared at equal column
                width, but not when each is just its own list, the same way /communities or
                /venues already read as normal long lists. Each row is a plain table-style line
                (name / city / link) rather than a bordered card — a dense country's teacher list
                is meant to scan fast, not to be browsed tile by tile. ExpandableList caps the
                initial render and expands in place, deliberately not linking out to a "view all"
                page since /teachers isn't a real filterable directory yet (I-132 shipped ahead
                of it). */}
            {communities.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 font-serif text-xl text-slate-900">Communities</h2>
                <div className="divide-y divide-(--color-sand-strong) overflow-hidden rounded-xl border border-(--color-sand-strong) bg-white">
                  <ExpandableList
                    itemLabel="communities"
                    initialCount={7}
                    items={communities.map((c) => (
                      <CompactCommunityRow key={c.id} community={c} />
                    ))}
                  />
                </div>
                <p className="mt-3 text-sm text-slate-500">
                  Know a community in {label} we&apos;re missing?{" "}
                  <a href={COMMUNITY_SUBMIT_URL} target="_blank" rel="noopener noreferrer" className="font-medium text-(--color-pine) hover:underline">
                    Suggest it →
                  </a>
                </p>
              </section>
            )}
          </div>
        )}

        {teachers.length > 0 && (
          <section id="teachers" className="mb-8 scroll-mt-6">
            <h2 className="mb-3 font-serif text-xl text-slate-900">Teachers</h2>
            <div className="divide-y divide-(--color-sand-strong) overflow-hidden rounded-xl border border-(--color-sand-strong) bg-white">
              <ExpandableList
                itemLabel="teachers"
                initialCount={7}
                items={teachers.map((t) => (
                  <CompactTeacherRow key={t.id} teacher={t} />
                ))}
              />
            </div>
            <p className="mt-3 text-sm text-slate-500">
              Know a teacher, organizer, or musician who should be listed?{" "}
              <Link href="/auth" className="font-medium text-(--color-pine) hover:underline">
                Create your profile →
              </Link>
            </p>
          </section>
        )}

        {events.length > 0 && (
          <section id="events" className="mb-8 scroll-mt-6">
            <h2 className="mb-3 font-serif text-xl text-slate-900">Upcoming events</h2>
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
          <section id="venues" className="mb-8 scroll-mt-6">
            <h2 className="mb-3 font-serif text-xl text-slate-900">Venues</h2>
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

        <p className="mt-4 border-t border-(--color-sand-strong) pt-6 text-sm text-slate-500">
          Want to help keep the {label} page accurate — spot missing communities, teachers,
          events, or venues before we do?{" "}
          <a href="mailto:hello@citreasurehunt.com" className="font-medium text-(--color-pine) hover:underline">
            Get in touch →
          </a>
        </p>
      </div>
    </main>
  );
}

// Table-style row: name / city / link as fixed grid columns, not a bordered card — a CSS grid
// rather than a real <table> so the columns can collapse per-row on narrow screens (name+link on
// one line, city dropping below) instead of forcing horizontal scroll the way a literal <table>
// would. Used for both community and teacher lists so a mixed-density country page still reads
// as one consistent list style.
function CompactCommunityRow({ community }: { community: Community }) {
  const joinUrl = getPrimaryJoinUrl(community);
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_28px] items-center gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_140px_28px]">
      <Link href={`/communities/${community.slug}`} className="truncate font-serif text-base text-slate-900 hover:underline">
        {community.name}
      </Link>
      {community.city && (
        <p className="col-start-1 row-start-2 flex items-center gap-1 text-xs text-slate-500 sm:col-start-2 sm:row-start-1 sm:text-sm">
          <MapPin className="size-3 shrink-0 text-slate-400" />
          {community.city}
        </p>
      )}
      {joinUrl && (
        <a
          href={joinUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-start-3 row-start-1 justify-self-end text-slate-400 hover:text-(--color-pine)"
          aria-label={`Visit ${community.name}`}
        >
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function CompactTeacherRow({ teacher }: { teacher: { name: string; slug: string; city: string | null; bio: string | null; imageUrl?: string | null; linkUrl?: string | null } }) {
  const imageUrl = teacher.imageUrl?.trim() ?? "";
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto_28px] items-center gap-3 px-4 py-2.5 sm:grid-cols-[minmax(0,1fr)_140px_28px]">
      <div className="flex min-w-0 items-center gap-2">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={getMediumUrl(imageUrl)} alt={teacher.name} className="size-7 shrink-0 rounded-full object-cover" />
        ) : null}
        <Link href={`/teachers/${teacher.slug}`} className="truncate font-serif text-base text-slate-900 hover:underline">
          {teacher.name}
        </Link>
      </div>
      {teacher.city && (
        <p className="col-start-1 row-start-2 text-xs text-slate-500 sm:col-start-2 sm:row-start-1 sm:text-sm">
          {teacher.city}
        </p>
      )}
      {teacher.linkUrl && (
        <a
          href={teacher.linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="col-start-3 row-start-1 justify-self-end text-slate-400 hover:text-(--color-pine)"
          aria-label={`Visit ${teacher.name}'s website`}
        >
          <ExternalLink className="size-4" />
        </a>
      )}
    </div>
  );
}

function VenueCard({ venue }: { venue: { name: string; slug: string; city: string; description: string | null; imageUrl: string | null } }) {
  const imageUrl = venue.imageUrl?.trim() ?? "";
  const renderImage = imageUrl.length > 0;

  // Anchor-text/a11y fix (I-132 follow-up): description stays outside the <Link> — only the
  // name/image are the link, so a screen reader doesn't announce the whole card as one link.
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
