import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { buildEventSlug } from "@/lib/events";

import { ClaimEventForm } from "./claim-event-form";

export default async function ClaimEventPage({
  searchParams,
}: {
  searchParams?: Promise<{ event?: string }>;
}) {
  const { event: eventId } = (await searchParams) ?? {};
  if (!eventId) {
    notFound();
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?next=${encodeURIComponent(`/dashboard/claim-event?event=${eventId}`)}`);
  }

  const { data: event } = await supabase
    .from("events")
    .select("id, short_id, title, city, country, start_date")
    .eq("id", eventId)
    .maybeSingle();
  if (!event) {
    notFound();
  }

  const { data: ownedProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const eventSlug = buildEventSlug(event.short_id, event.title);

  return (
    <main className="min-h-screen bg-(--color-mist) px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-2xl">
        <Link href={`/events/${eventSlug}`} className="text-sm font-medium text-(--color-pine) hover:underline">
          ← Back to event
        </Link>
        <div className="mt-4 rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Claim this event</p>
          <h1 className="mt-3 font-serif text-4xl text-slate-950">{event.title}</h1>
          <p className="mt-1 text-sm text-slate-600">
            {event.city}, {event.country} · {event.start_date}
          </p>

          {ownedProfile ? (
            <>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Tell us how you were involved. An admin reviews every claim before it&apos;s linked — you
                won&apos;t get edit access until it&apos;s approved.
              </p>
              <div className="mt-8">
                <ClaimEventForm eventId={event.id} />
              </div>
            </>
          ) : (
            <p className="mt-4 text-base leading-7 text-slate-700">
              You need a profile before you can claim an event.{" "}
              <Link href="/dashboard/claim" className="font-semibold text-(--color-pine) underline">
                Find or create your profile
              </Link>
              , then come back to this page to claim the event.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
