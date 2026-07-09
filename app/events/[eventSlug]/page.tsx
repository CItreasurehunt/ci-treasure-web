import Link from "next/link";
import { CalendarDays, Clock3, ExternalLink, GraduationCap, Languages, Mail, MapPin } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import { ShareButton } from "@/components/share-button";
import { ReportButton } from "@/components/report-button";
import { SegmentsSection } from "@/components/segments-section";
import BackButton from "@/components/back-button";
import {
  type SeriesSibling,
  formatEventDateRange,
  formatPriceLabel,
  formatTimeRange,
  getEventBySlug,
  getEventHref,
  getEventLocation,
  getLevelLabel,
  getLanguageLabel,
  getLinkLabel,
  getOgImageStyle,
  getTypeLabel,
  parseEventSlug,
} from "@/lib/events";
import { SITE_URL } from "@/lib/site";

export const revalidate = 3600;

function stripMarkdown(text: string) {
  return text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1") // Replace links [text](url) with 'text'
    .replace(/[#*`_~]/g, "") // Remove basic markdown characters
    .replace(/\n+/g, " ") // Replace newlines with spaces
    .trim();
}

type EventPageProps = {
  params: Promise<{
    eventSlug: string;
  }>;
};

export async function generateMetadata({ params }: { params: Promise<{ eventSlug: string }> }) {
  const { eventSlug } = await params;
  const parsed = parseEventSlug(eventSlug);
  if (!parsed) return {};
  const event = await getEventBySlug(parsed.shortId);
  if (!event) return {};
  return {
    title: `${event.title} — CI Treasure Hunt`,
    description: event.description?.slice(0, 160) ?? `${event.type} in ${event.city}, ${event.country}`,
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 160) ?? `${event.type} in ${event.city}, ${event.country}`,
      url: `${SITE_URL}/events/${event.slug}`,
      type: "article",
      images: event.imageUrl ? [{ url: event.imageUrl }] : [],
    },
  };
}

function renderDescription(text: string) {
  return text.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} className="font-semibold text-slate-900">{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default async function EventPage({ params }: EventPageProps) {
  const { eventSlug } = await params;
  const parsed = parseEventSlug(eventSlug);

  if (!parsed) {
    notFound();
  }

  const event = await getEventBySlug(parsed.shortId);
  if (!event) {
    notFound();
  }

  if (eventSlug !== event.slug) {
    redirect(`/events/${event.slug}`);
  }

  const isSingleDay = event.startDate === event.endDate;
  const timeRange =
    isSingleDay && (event.startTime || event.endTime) ? formatTimeRange(event) : "";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    image: event.imageUrl ?? undefined,
    description: event.description
      ? stripMarkdown(event.description).slice(0, 200)
      : undefined,
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: event.cancelled
      ? "https://schema.org/EventCancelled"
      : "https://schema.org/EventScheduled",
    startDate: event.startDateIso,
    endDate: event.endDateIso,
    location: {
      "@type": "Place",
      name: event.venueName ?? event.city,
      address: {
        "@type": "PostalAddress",
        streetAddress: event.venueAddress ?? undefined,
        addressLocality: event.city,
        addressCountry: event.country,
      },
    },
    organizer:
      event.organizers.length > 0
        ? event.organizers.map((organizer) => ({
            "@type": "Person",
            name: organizer.name,
            ...(organizer.slug ? { url: `${SITE_URL}/teachers/${organizer.slug}` } : {}),
          }))
        : undefined,
    performer: event.teachers.map((teacher) => ({
      "@type": "Person",
      name: teacher.name,
      ...(teacher.slug ? { url: `${SITE_URL}/teachers/${teacher.slug}` } : {}),
    })),
    offers:
      event.priceItems.length > 0
        ? {
            "@type": "Offer",
            price:
              typeof event.priceItems[0].amount === "number"
                ? event.priceItems[0].amount / 100
                : undefined,
            priceCurrency: event.priceItems[0].currency,
            availability: "https://schema.org/InStock",
            url: event.primaryRegistrationUrl ?? `${SITE_URL}/events/${event.slug}`,
          }
        : undefined,
    url: `${SITE_URL}/events/${event.slug}`,
  };

  return (
    <main className="min-h-screen bg-(--color-cream) px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton label="Back to events" />
          <ShareButton
            url={`${SITE_URL}/events/${event.slug}`}
            title={event.title}
          />
        </div>

        {event.isPast ? (
          <div className="rounded-2xl border border-slate-300 bg-slate-100 px-5 py-4 text-sm text-slate-700">
            <span className="font-semibold text-slate-900">This event has ended.</span> It&apos;s kept here
            for reference.{" "}
            <Link href="/" className="font-semibold text-(--color-pine) underline">
              Browse upcoming events
            </Link>
            .
          </div>
        ) : null}

        <section
          className={`overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_25px_90px_rgba(105,73,22,0.12)] ${
            event.isPast ? "opacity-75 grayscale-[0.35]" : ""
          }`}
        >
          <div className={`border-b border-(--color-sand-strong) ${getOgImageStyle(event.type)}`}>
            <div className="px-6 py-10 sm:px-8">
              <div className="max-w-3xl space-y-5">
                <p className="inline-flex items-center rounded-full border border-white/80 bg-white/75 px-4 py-1 text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">
                  {getTypeLabel(event.type)}
                </p>
                <h1 className="font-serif text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl">
                  {event.title}
                </h1>
              </div>
            </div>
            {event.imageUrl ? (
              <div className="px-6 pb-8 sm:px-8">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={event.imageUrl}
                  alt={event.title}
                  className="max-h-120 w-auto max-w-2xl rounded-2xl drop-shadow-lg"
                />
                {event.imageCredit ? (
                  <p className="mt-2 inline-block rounded-full bg-white/80 px-2.5 py-0.5 text-xs text-slate-700 backdrop-blur-sm">
                    {event.imageCredit}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-8">
              {event.cancelled ? (
                <div className="rounded-[1.5rem] border border-rose-200 bg-rose-50 p-4 text-sm leading-6 text-rose-950">
                  <p className="font-semibold">This event has been cancelled.</p>
                </div>
              ) : null}

              <div className="grid gap-4 sm:grid-cols-2">
                <InfoCard
                  icon={<CalendarDays className="size-4" />}
                  label="Dates"
                  value={formatEventDateRange(event)}
                />
                {timeRange ? (
                  <InfoCard
                    icon={<Clock3 className="size-4" />}
                    label="Time"
                    value={timeRange}
                  />
                ) : null}
                <InfoCard
                  icon={<MapPin className="size-4" />}
                  label="Location"
                  value={
                    event.venueSlug ? (
                      <div className="flex flex-col gap-1">
                        <Link
                          href={`/venues/${event.venueSlug}`}
                          className="font-bold text-violet-600 underline decoration-violet-200 underline-offset-4 transition hover:text-violet-800 hover:decoration-violet-400"
                        >
                          {event.venueName}
                        </Link>
                        <span className="text-sm text-slate-600">{getEventLocation(event)}</span>
                      </div>
                    ) : event.venueName ? (
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-900">{event.venueName}</span>
                        <span className="text-sm text-slate-600">{getEventLocation(event)}</span>
                      </div>
                    ) : (
                      getEventLocation(event)
                    )
                  }
                />
                {event.level ? (
                  <InfoCard
                    icon={<GraduationCap className="size-4" />}
                    label="Level"
                    value={getLevelLabel(event.level)}
                  />
                ) : null}
                {event.language.length > 0 ? (
                  <InfoCard
                    icon={<Languages className="size-4" />}
                    label="Language"
                    value={event.language.map(getLanguageLabel).join(" · ")}
                  />
                ) : null}
              </div>

              {event.description ? (
                <section className="space-y-3">
                  <h2 className="font-serif text-2xl text-slate-950">About this event</h2>
                  <p className="whitespace-pre-line text-base leading-8 text-slate-700">
                    {renderDescription(event.description)}
                  </p>
                </section>
              ) : null}

              {event.segments ? (
                <SegmentsSection
                  segments={event.segments}
                  teacherProfiles={event.teachers}
                />
              ) : null}

              {event.seriesSiblings.length > 1 ? (
                <SeriesSection
                  seriesName={event.seriesName ?? "Part of series"}
                  siblings={event.seriesSiblings}
                  currentEventId={event.id}
                />
              ) : null}

              {event.teachers.length > 0 || event.organizers.length > 0 ? (
                <div className="grid gap-8 md:grid-cols-2">
                  {event.teachers.length > 0 ? <PeopleSection title="Teachers" items={event.teachers} /> : null}
                  {event.organizers.length > 0 ? (
                    <PeopleSection
                      title="Organizers"
                      items={event.organizers.map((o) => ({
                        ...o,
                        role: o.role === "hosting_venue" ? "Venue" : null,
                      }))}
                    />
                  ) : null}
                </div>
              ) : null}
            </div>

            <aside className="space-y-6">
              <section className="rounded-[1.75rem] border border-(--color-sand-strong) bg-(--color-cream) p-5">
                <h2 className="font-serif text-2xl text-slate-950">Links</h2>
                <div className="mt-4 flex flex-col gap-3">
                  {event.linkItems.length ? (
                    event.linkItems.map((item) => (
                      <a
                        key={`${item.type}-${item.url}`}
                        href={item.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center justify-between rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-(--color-pine) hover:text-(--color-pine)"
                      >
                        {getLinkLabel(item.type, item.label)}
                        <ExternalLink className="size-4" />
                      </a>
                    ))
                  ) : (
                    <p className="text-sm leading-6 text-slate-600">No public links added yet.</p>
                  )}
                  {event.contactEmail ? (
                    <a
                      href={`mailto:${event.contactEmail}`}
                      className="inline-flex items-center justify-between rounded-2xl border border-(--color-sand-strong) bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-(--color-pine) hover:text-(--color-pine)"
                    >
                      Email
                      <Mail className="size-4" />
                    </a>
                  ) : null}
                </div>
              </section>

              {event.priceItems.length ? (
                <section className="rounded-[1.75rem] border border-(--color-sand-strong) bg-white p-5">
                  <h2 className="font-serif text-2xl text-slate-950">Pricing</h2>
                  <div className="mt-4 space-y-3">
                    {event.priceItems.map((item, index) => (
                      <div
                        key={`${item.currency}-${item.amount}-${index}`}
                        className="rounded-2xl border border-(--color-sand-strong) bg-(--color-cream) px-4 py-3"
                      >
                        <p className="text-lg font-semibold text-slate-950">{formatPriceLabel(item)}</p>
                        {item.description ? (
                          <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </aside>
          </div>
        </section>
        <div className="text-center text-sm text-slate-400">
          <ReportButton
            entity_type="event"
            entity_id={event.id}
            entity_title={event.title}
            entity_slug={event.slug}
          />
        </div>
      </div>
    </main>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-[1.5rem] border border-(--color-sand-strong) bg-(--color-cream) p-4">
      <p className="flex items-center gap-2 text-sm font-medium text-slate-600">
        <span className="text-(--color-pine)">{icon}</span>
        {label}
      </p>
      <div className="mt-3 text-lg leading-7 text-slate-950">{value}</div>
    </div>
  );
}

function PeopleSection({
  title,
  items,
}: {
  title: string;
  items: Array<{ name: string; role?: string | null; slug?: string | null }>;
}) {
  return (
    <section className="space-y-3">
      <h2 className="font-serif text-2xl text-slate-950">{title}</h2>
      <div className="flex flex-wrap gap-3">
        {items.map((item) => {
          const content = (
            <>
              <span className="font-medium text-slate-950 group-hover:text-(--color-pine) transition-colors">{item.name}</span>
              {item.role && item.role !== 'teacher' ? <span className="text-slate-500"> · {item.role.charAt(0).toUpperCase() + item.role.slice(1)}</span> : null}
            </>
          );

          if (item.slug) {
            return (
              <Link
                key={`${item.name}-${item.role ?? "role"}`}
                href={`/teachers/${item.slug}`}
                className="group rounded-full border border-(--color-sand-strong) bg-white px-4 py-2 text-sm text-slate-700 transition hover:border-(--color-pine) hover:shadow-sm"
              >
                {content}
              </Link>
            );
          }

          return (
            <div
              key={`${item.name}-${item.role ?? "role"}`}
              className="rounded-full border border-(--color-sand-strong) bg-white px-4 py-2 text-sm text-slate-700"
            >
              {content}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function SeriesSection({
  seriesName,
  siblings,
  currentEventId,
}: {
  seriesName: string;
  siblings: SeriesSibling[];
  currentEventId: string;
}) {
  return (
    <section className="space-y-5">
      <h2 className="font-serif text-2xl text-slate-950">{seriesName}</h2>
      <div className="grid gap-4">
        {siblings.map((sibling) => {
          const isCurrent = sibling.id === currentEventId;
          const content = (
            <div
              className={`rounded-[1.5rem] p-5 shadow-sm sm:p-6 ${
                isCurrent
                  ? "border-2 border-(--color-pine) bg-white"
                  : "border border-(--color-sand-strong) bg-white transition hover:shadow-md"
              }`}
            >
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                <h3 className="font-serif text-xl leading-tight text-slate-900">
                  {sibling.title}
                </h3>
                <span className="shrink-0 text-sm font-semibold text-(--color-pine)">
                  {formatEventDateRange({
                    startDate: sibling.startDate,
                    endDate: sibling.endDate,
                  })}
                </span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-flex items-center rounded-full border border-slate-100 bg-slate-50 px-3 py-1 text-xs font-medium tracking-wider text-slate-600 uppercase">
                  {getTypeLabel(sibling.type)}
                </span>
                {isCurrent && (
                  <span className="text-xs font-bold text-(--color-pine) uppercase tracking-wider">
                    Current event
                  </span>
                )}
              </div>
            </div>
          );

          if (isCurrent) {
            return <div key={sibling.id}>{content}</div>;
          }

          return (
            <Link key={sibling.id} href={getEventHref(sibling)} className="block">
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
