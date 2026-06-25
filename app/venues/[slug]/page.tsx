import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ExternalLink,
  Facebook,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageSquare,
  Youtube,
} from "lucide-react";

import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/back-button";
import VenueMap from "@/components/venue-map";
import {
  formatEventDateRange,
  getCountryLabel,
  getEventHref,
  getEventLocation,
  getTypeLabel,
} from "@/lib/events";
import { getAllVenueSlugs, getVenueBySlug, getVenueEvents } from "@/lib/venues";
import { getCountryFlag } from "@/lib/utils";
import { SITE_URL } from "@/lib/site";
import { EventListItem } from "@/lib/events";

export const revalidate = 3600;

type VenuePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateStaticParams() {
  const slugs = await getAllVenueSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: VenuePageProps): Promise<Metadata> {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);
  if (!venue) return {};

  return {
    title: `${venue.name} — ${venue.city}, ${venue.country} — CI Treasure Hunt`,
    description: venue.description?.slice(0, 160) ?? `Venue in ${venue.city}, ${venue.country}`,
    openGraph: {
      title: venue.name,
      description: venue.description?.slice(0, 160) ?? `Venue in ${venue.city}, ${venue.country}`,
      url: `${SITE_URL}/venues/${venue.slug}`,
      images: venue.imageUrl ? [{ url: venue.imageUrl }] : [],
    },
  };
}

export default async function VenuePage({ params }: VenuePageProps) {
  const { slug } = await params;
  const venue = await getVenueBySlug(slug);

  if (!venue) {
    notFound();
  }

  const { upcoming, past } = await getVenueEvents(venue.id);

  return (
    <main className="min-h-screen bg-[--color-cream] px-5 py-8 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="flex flex-wrap items-center gap-3">
          <BackButton />
        </div>

        <section className="overflow-hidden rounded-[2rem] border border-white/80 bg-white shadow-[0_25px_90px_rgba(105,73,22,0.12)]">
          <div className="border-b border-[--color-sand-strong] px-6 py-10 sm:px-8">
            <div className="max-w-3xl space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl" aria-hidden="true">
                  {getCountryFlag(venue.country)}
                </span>
                <p className="text-sm font-semibold uppercase tracking-widest text-[--color-pine]">
                  {venue.city}, {getCountryLabel(venue.country)}
                  {venue.region ? ` · ${venue.region}` : ""}
                </p>
              </div>
              <h1 className="font-serif text-4xl leading-tight tracking-tight text-slate-950 sm:text-5xl">
                {venue.name}
              </h1>
              {venue.address && (
                <p className="flex items-start gap-2 text-slate-600">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-[--color-pine]" />
                  <span>{venue.address}</span>
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.4fr_0.8fr]">
            <div className="space-y-10">
              {venue.imageUrl && (
                <div className="overflow-hidden rounded-2xl border border-[--color-sand-strong]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venue.imageUrl}
                    alt={venue.name}
                    className="h-auto w-full object-cover"
                  />
                </div>
              )}

              {venue.description && (
                <section className="space-y-4">
                  <h2 className="font-serif text-2xl text-slate-950">About the venue</h2>
                  <p className="whitespace-pre-line text-lg leading-8 text-slate-700">
                    {venue.description}
                  </p>
                </section>
              )}

              {venue.lat && venue.lng && (
                <section className="space-y-4">
                  <h2 className="font-serif text-2xl text-slate-950">Location</h2>
                  <VenueMap lat={venue.lat} lng={venue.lng} name={venue.name} />
                </section>
              )}

              <section className="space-y-6">
                <h2 className="font-serif text-3xl text-slate-950">Events at this venue</h2>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                      Upcoming Events
                    </h3>
                    {upcoming.length > 0 ? (
                      <div className="grid gap-4">
                        {upcoming.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    ) : (
                      <p className="italic text-slate-500">No upcoming events scheduled.</p>
                    )}
                  </div>

                  {past.length > 0 && (
                    <details className="group">
                      <summary className="cursor-pointer list-none space-y-4">
                        <div className="flex items-center justify-between border-t border-[--color-sand-strong] pt-6">
                          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                            Past Events ({past.length})
                          </h3>
                          <span className="text-sm font-medium text-violet-600 group-open:hidden">
                            Show past events
                          </span>
                          <span className="hidden text-sm font-medium text-violet-600 group-open:block">
                            Hide past events
                          </span>
                        </div>
                      </summary>
                      <div className="mt-4 grid gap-4">
                        {past.map((event) => (
                          <EventCard key={event.id} event={event} />
                        ))}
                      </div>
                    </details>
                  )}
                </div>
              </section>
            </div>

            <aside className="space-y-6">
              <section className="rounded-[1.75rem] border border-[--color-sand-strong] bg-[--color-cream] p-6">
                <h2 className="font-serif text-2xl text-slate-950">Links & Contact</h2>
                <div className="mt-5 flex flex-col gap-3">
                  {venue.website && (
                    <SocialLink href={venue.website} icon={<Globe className="h-4 w-4" />} label="Website" />
                  )}
                  {venue.email && (
                    <SocialLink
                      href={`mailto:${venue.email}`}
                      icon={<Mail className="h-4 w-4" />}
                      label="Email"
                    />
                  )}
                  {venue.newsletter && (
                    <SocialLink
                      href={venue.newsletter}
                      icon={<MessageSquare className="h-4 w-4" />}
                      label="Newsletter"
                    />
                  )}
                  {venue.instagram && (
                    <SocialLink
                      href={venue.instagram}
                      icon={<Instagram className="h-4 w-4" />}
                      label="Instagram"
                    />
                  )}
                  {venue.facebook && (
                    <SocialLink
                      href={venue.facebook}
                      icon={<Facebook className="h-4 w-4" />}
                      label="Facebook"
                    />
                  )}
                  {venue.youtube && (
                    <SocialLink
                      href={venue.youtube}
                      icon={<Youtube className="h-4 w-4" />}
                      label="YouTube"
                    />
                  )}

                  {venue.links?.items?.map((link, idx) => (
                    <SocialLink
                      key={idx}
                      href={link.url}
                      icon={<ExternalLink className="h-4 w-4" />}
                      label={link.type.replace(/_/g, " ")}
                    />
                  ))}

                  {!venue.website &&
                    !venue.email &&
                    !venue.newsletter &&
                    !venue.instagram &&
                    !venue.facebook &&
                    !venue.youtube &&
                    (!venue.links?.items || venue.links.items.length === 0) && (
                      <p className="text-sm text-slate-500 italic">No links available.</p>
                    )}
                </div>
              </section>
            </aside>
          </div>
        </section>
      </div>
    </main>
  );
}

function EventCard({ event }: { event: EventListItem }) {
  return (
    <Link
      href={getEventHref(event)}
      className="group flex flex-col justify-between gap-4 rounded-2xl border border-[--color-sand-strong] bg-white p-5 transition hover:border-violet-300 hover:shadow-md sm:flex-row sm:items-center"
    >
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Badge
            variant="secondary"
            className="bg-violet-50 text-xs font-semibold uppercase tracking-wider text-violet-700"
          >
            {getTypeLabel(event.type)}
          </Badge>
          <span className="text-xs text-slate-500">{getCountryFlag(event.country)}</span>
        </div>
        <h4 className="font-serif text-xl font-bold text-slate-950 group-hover:text-violet-700 transition">
          {event.title}
        </h4>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
          <p className="flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5" />
            {formatEventDateRange(event)}
          </p>
          <p className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" />
            {getEventLocation(event)}
          </p>
        </div>
      </div>
      <div className="text-violet-600 opacity-0 transition group-hover:opacity-100 sm:block hidden">
        <ArrowLeft className="h-5 w-5 rotate-180" />
      </div>
    </Link>
  );
}

function SocialLink({ href, icon, label }: { href: string; icon: React.ReactNode; label: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center justify-between rounded-xl border border-[--color-sand-strong] bg-white px-4 py-3 text-sm font-medium text-slate-900 transition hover:border-[--color-pine] hover:text-[--color-pine]"
    >
      <span className="flex items-center gap-3">
        <span className="text-[--color-pine]">{icon}</span>
        <span className="capitalize">{label}</span>
      </span>
      <ExternalLink className="h-4 w-4 opacity-30" />
    </a>
  );
}
