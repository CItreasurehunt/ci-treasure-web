import Link from "next/link";
import { redirect } from "next/navigation";

import { OrganizerEventForm } from "@/components/organizer/event-form";
import { getKnownDisciplines } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

export default async function NewEventPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth?next=/events/new");
  }

  // Must own a profile to submit an event (it becomes the lead organizer link).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profile) {
    redirect("/dashboard/claim");
  }

  const availablePractices = await getKnownDisciplines();

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e5_0%,#fffdf8_45%,#fffaf2_100%)] px-5 py-10 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/dashboard" className="text-sm font-medium text-(--color-pine) hover:underline">
          ← Back to dashboard
        </Link>
        <div className="mt-4">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">New event</p>
          <h1 className="mt-2 font-serif text-4xl text-slate-950">Submit an event</h1>
          <p className="mt-3 text-base leading-7 text-slate-700">
            Fill in the details below. Fields marked * are required.
          </p>
        </div>
        <div className="mt-8">
          <OrganizerEventForm mode="create" availablePractices={availablePractices} />
        </div>
      </div>
    </main>
  );
}
