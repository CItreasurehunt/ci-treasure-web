import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { EventsDashboard } from "@/components/events-dashboard";
import { getCountryLabel, getUpcomingEvents } from "@/lib/events";
import { SITE_URL } from "@/lib/site";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

const TITLE = "Contact Improvisation Events, Communities & Teachers Worldwide | CI Treasure Hunt";
const DESCRIPTION =
  "A living map of Contact Improvisation events, communities, teachers & venues worldwide — find jams, festivals, workshops and intensives near you.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    siteName: "CI Treasure Hunt",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    // No site-default OG image exists yet — "summary_large_image" with no image
    // would just show an empty card, so this stays "summary" until one does.
    card: "summary",
    title: TITLE,
    description: DESCRIPTION,
  },
};

function getTodayDateKey() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Berlin",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export default async function Home() {
  const { events, error } = await getUpcomingEvents(getTodayDateKey());

  const countries = Array.from(new Set(events.map((event) => event.country))).sort((a, b) =>
    getCountryLabel(a).localeCompare(getCountryLabel(b)),
  );

  return (
    <main className="min-h-screen bg-(--color-mist) text-slate-900">
      <section className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-5 py-8 sm:px-8 lg:px-10">

        {/* Hero */}
        <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="border-l-4 border-(--color-pine) pl-5 py-1">
            <h1 className="font-serif text-4xl tracking-tight text-slate-950 sm:text-5xl">
              Contact Improvisation events &amp;{" "}
              <Link href="/communities" className="text-violet-600 underline underline-offset-4 hover:text-violet-800">
                communities
              </Link>
            </h1>
            <p className="mt-3 text-base text-slate-500 sm:text-lg">
              Browse {events.length} upcoming events across {countries.length} countries.
            </p>
          </div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/ci-hero.jpg"
            alt="Contact improvisation dancers"
            className="w-full h-52 rounded-2xl object-cover shadow-lg lg:w-72 xl:w-96 lg:h-52 xl:h-64"
          />
        </div>

        {error && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950">
            {error}
          </div>
        )}

        <Suspense>
          <EventsDashboard events={events} />
        </Suspense>
      </section>
    </main>
  );
}
