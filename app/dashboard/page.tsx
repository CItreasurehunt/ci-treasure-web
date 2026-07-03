import Link from "next/link";
import { redirect } from "next/navigation";

import { isAdminEmail } from "@/lib/admin-auth";
import { buildEventSlug } from "@/lib/events";
import { createClient } from "@/lib/supabase/server";

type DashboardEvent = {
  id: string;
  short_id: string;
  title: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  admin_notes: string | null;
};

const STATUS_STYLES: Record<string, string> = {
  published: "bg-emerald-100 text-emerald-800",
  pending: "bg-amber-100 text-amber-800",
  draft: "bg-slate-100 text-slate-700",
  rejected: "bg-rose-100 text-rose-800",
  cancelled: "bg-rose-100 text-rose-800",
};

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${style}`}>{status}</span>
  );
}

async function signOut() {
  "use server";
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth");
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // proxy.ts already guards this route, but never render dashboard without a session.
  if (!user) {
    redirect("/auth?next=/dashboard");
  }

  const isAdmin = await isAdminEmail(user.email);

  // Profile this user owns (claim approved, or self-created).
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, slug, is_trusted")
    .eq("user_id", user.id)
    .maybeSingle();

  // Middle state: a claim submitted but not yet approved by an admin.
  const { data: pendingClaim } = await supabase
    .from("profiles")
    .select("name")
    .eq("claim_pending_user_id", user.id)
    .maybeSingle();

  // Scope explicitly to events this user submitted or is linked to as an organizer.
  // RLS also grants read on ALL published events (events_select_public), so relying
  // on RLS alone would surface every published event — filter here instead.
  let events: DashboardEvent[] = [];
  if (profile) {
    const { data: orgLinks } = await supabase
      .from("event_organizers")
      .select("event_id")
      .eq("organizer_id", profile.id);
    const linkedIds = (orgLinks ?? []).map((r) => r.event_id as string);
    const orFilter = linkedIds.length
      ? `user_id.eq.${user.id},id.in.(${linkedIds.join(",")})`
      : `user_id.eq.${user.id}`;
    const { data: eventRows } = await supabase
      .from("events")
      .select("id, short_id, title, start_date, end_date, status, admin_notes")
      .or(orFilter)
      .order("start_date", { ascending: true });
    events = (eventRows ?? []) as DashboardEvent[];
  }

  return (
    <main className="min-h-screen bg-[linear-gradient(180deg,#f7f0e5_0%,#fffdf8_45%,#fffaf2_100%)] px-5 py-6 text-slate-900 sm:px-8 lg:px-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/80 bg-white/85 p-5 shadow-[0_18px_55px_rgba(106,75,25,0.08)] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Organizer dashboard</p>
            <h1 className="mt-2 font-serif text-3xl text-slate-950">
              {profile ? profile.name : "Welcome"}
            </h1>
            <p className="mt-1 text-sm text-slate-600">{user.email}</p>
          </div>
          <div className="flex flex-wrap gap-3 text-sm font-medium">
            {isAdmin ? (
              <Link
                href="/admin/events"
                className="rounded-full border border-(--color-sand-strong) px-4 py-2 text-slate-700 hover:border-(--color-pine) hover:text-(--color-pine)"
              >
                Admin
              </Link>
            ) : null}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-full border border-(--color-sand-strong) px-4 py-2 text-slate-700 hover:border-(--color-pine) hover:text-(--color-pine)"
              >
                Sign out
              </button>
            </form>
          </div>
        </header>

        {!profile && pendingClaim ? (
          <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
            <h2 className="font-serif text-2xl text-slate-950">Claim pending review</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              Your claim for <span className="font-semibold">{pendingClaim.name}</span> is waiting for an admin to
              review it. You&apos;ll get an email once it&apos;s approved, and then you can manage your events here.
            </p>
          </section>
        ) : !profile ? (
          <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-8 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
            <h2 className="font-serif text-2xl text-slate-950">Find your profile</h2>
            <p className="mt-3 text-base leading-7 text-slate-700">
              To manage events, first claim your organizer or teacher profile — or create a new one if you&apos;re
              not listed yet. Once your claim is approved you&apos;ll be able to edit your events and submit new ones.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href="/dashboard/claim"
                className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-cream)"
              >
                Claim your profile
              </Link>
            </div>
          </section>
        ) : (
          <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-serif text-2xl text-slate-950">Your events</h2>
              <Link
                href="/events/new"
                className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-cream)"
              >
                Submit a new event
              </Link>
            </div>

            {events.length === 0 ? (
              <p className="mt-6 text-base leading-7 text-slate-600">
                No events linked to your profile yet. Submit one with the button above.
              </p>
            ) : (
              <ul className="mt-6 divide-y divide-(--color-sand-strong)">
                {events.map((event) => (
                  <li key={event.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-semibold text-slate-950">{event.title}</p>
                      <p className="text-sm text-slate-600">
                        {event.start_date ?? "—"}
                        {event.end_date && event.end_date !== event.start_date ? ` – ${event.end_date}` : ""}
                      </p>
                      {event.status === "rejected" && event.admin_notes ? (
                        <p className="mt-1 text-sm text-rose-700">Note: {event.admin_notes}</p>
                      ) : null}
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={event.status} />
                      <Link
                        href={`/events/${buildEventSlug(event.short_id, event.title)}/edit`}
                        className="rounded-full border border-(--color-sand-strong) px-4 py-2 text-sm font-medium text-slate-700 hover:border-(--color-pine) hover:text-(--color-pine)"
                      >
                        Edit
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
