import Link from "next/link";
import { revalidatePath } from "next/cache";

import { requireAdminUser } from "@/lib/admin-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { slugify } from "@/lib/slug";

type AdminEventRow = {
  id: string;
  short_id: string;
  title: string;
  type: string;
  start_date: string;
  country: string;
  status: string;
  hide: boolean;
};

const STATUS_OPTIONS = ["draft", "pending", "published", "archived", "rejected"] as const;
// Archived/rejected events are done with — reviewing them isn't part of the normal
// workflow, so they'd otherwise just pad out every default view of this list.
const DEFAULT_STATUSES = ["draft", "pending", "published"] as const;

async function toggleStatus(formData: FormData) {
  "use server";

  await requireAdminUser();
  const eventId = String(formData.get("eventId") ?? "");
  const currentStatus = String(formData.get("currentStatus") ?? "");

  if (!eventId) {
    throw new Error("Missing event id.");
  }

  const nextStatus = currentStatus === "published" ? "draft" : "published";
  const supabase = createAdminClient();
  const { error } = await supabase.from("events").update({ status: nextStatus }).eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/events");
}

async function toggleHide(formData: FormData) {
  "use server";

  await requireAdminUser();
  const eventId = String(formData.get("eventId") ?? "");
  const currentHide = String(formData.get("currentHide") ?? "") === "true";

  if (!eventId) {
    throw new Error("Missing event id.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase.from("events").update({ hide: !currentHide }).eq("id", eventId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/admin/events");
}

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string | string[] }>;
}) {
  await requireAdminUser();

  const { status } = await searchParams;
  const requestedStatuses = status === undefined ? [] : Array.isArray(status) ? status : [status];
  const selectedStatuses = requestedStatuses.length > 0 ? requestedStatuses : [...DEFAULT_STATUSES];

  const supabase = createAdminClient();
  const [{ data: events, error: eventsError }, { data: teacherLinks, error: teacherError }, { data: organizerLinks, error: organizerError }] =
    await Promise.all([
      supabase
        .from("events")
        .select("id, short_id, title, type, start_date, country, status, hide")
        .in("status", selectedStatuses)
        .order("start_date", { ascending: true }),
      supabase.from("event_teachers").select("event_id"),
      supabase.from("event_organizers").select("event_id"),
    ]);

  if (eventsError) {
    throw new Error(eventsError.message);
  }
  if (teacherError) {
    throw new Error(teacherError.message);
  }
  if (organizerError) {
    throw new Error(organizerError.message);
  }

  const teacherCounts = new Map<string, number>();
  for (const row of teacherLinks ?? []) {
    const eventId = row.event_id as string;
    teacherCounts.set(eventId, (teacherCounts.get(eventId) ?? 0) + 1);
  }

  const organizerCounts = new Map<string, number>();
  for (const row of organizerLinks ?? []) {
    const eventId = row.event_id as string;
    organizerCounts.set(eventId, (organizerCounts.get(eventId) ?? 0) + 1);
  }

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-5 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-(--color-pine)">Events</p>
          <h2 className="mt-2 font-serif text-3xl text-slate-950">Manage events</h2>
          <p className="mt-1 text-sm text-slate-600">Review, publish, hide, and open each event for detailed editing.</p>
        </div>
        <Link href="/admin/events/new" className="rounded-full bg-(--color-ink) px-5 py-3 text-sm font-semibold text-(--color-mist)">
          New event
        </Link>
      </div>

      <form
        method="get"
        className="mt-4 flex flex-wrap items-center gap-4 rounded-2xl border border-(--color-sand-strong) bg-(--color-mist) p-4"
      >
        <span className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">status</span>
        {STATUS_OPTIONS.map((s) => (
          <label key={s} className="flex items-center gap-1.5 text-sm text-slate-800">
            <input type="checkbox" name="status" value={s} defaultChecked={selectedStatuses.includes(s)} />
            {s}
          </label>
        ))}
        <button
          type="submit"
          className="rounded-full bg-(--color-ink) px-4 py-1.5 text-xs font-semibold text-(--color-mist)"
        >
          Apply
        </button>
        <Link
          href={`/admin/events?${STATUS_OPTIONS.map((s) => `status=${s}`).join("&")}`}
          className="text-xs text-slate-500 underline"
        >
          Show all (incl. archived/rejected)
        </Link>
      </form>

      <div className="mt-6 overflow-x-auto pb-2">
        <div className="space-y-3 lg:min-w-[1080px]">
        <div className="hidden grid-cols-[minmax(240px,3fr)_90px_105px_70px_120px_70px_80px_200px] gap-3 px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 lg:grid">
          <div>title</div>
          <div>type</div>
          <div>start_date</div>
          <div>country</div>
          <div>status</div>
          <div>teachers</div>
          <div>organizers</div>
          <div>actions</div>
        </div>

        {(events as AdminEventRow[]).map((event) => (
          <div
            key={event.id}
            className="rounded-2xl bg-(--color-mist) p-4 text-sm text-slate-900 shadow-[0_10px_30px_rgba(106,75,25,0.05)]"
          >
            <div className="grid gap-4 lg:grid-cols-[minmax(240px,3fr)_90px_105px_70px_120px_70px_80px_200px] lg:items-center">
              <DetailItem label="title" value={event.title} strong truncate />
              <DetailItem label="type" value={event.type} />
              <DetailItem label="start_date" value={event.start_date} />
              <DetailItem label="country" value={event.country} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">status</p>
                <div className="mt-1 flex flex-wrap gap-2 lg:mt-0">
                  <span className="rounded-full border border-(--color-sand-strong) px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em]">
                    {event.status}
                  </span>
                  {event.hide ? (
                    <span className="rounded-full border border-rose-200 bg-rose-50 px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-rose-700">
                      hidden
                    </span>
                  ) : null}
                </div>
              </div>
              <DetailItem label="teachers" value={String(teacherCounts.get(event.id) ?? 0)} />
              <DetailItem label="organizers" value={String(organizerCounts.get(event.id) ?? 0)} />
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">actions</p>
                <div className="mt-1 flex flex-wrap gap-2 lg:mt-0">
                  <Link href={`/admin/events/${event.id}/edit`} className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold">
                    Edit
                  </Link>
                  {event.status === "published" ? (
                    <Link
                      href={`https://citreasurehunt.com/events/${event.short_id}-${slugify(event.title)}`}
                      target="_blank"
                      className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold"
                    >
                      View live
                    </Link>
                  ) : null}
                  <form action={toggleStatus}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="currentStatus" value={event.status} />
                    <button type="submit" className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold">
                      {event.status === "published" ? "Set draft" : "Publish"}
                    </button>
                  </form>
                  <form action={toggleHide}>
                    <input type="hidden" name="eventId" value={event.id} />
                    <input type="hidden" name="currentHide" value={String(event.hide)} />
                    <button type="submit" className="rounded-full border border-(--color-sand-strong) px-3 py-2 text-xs font-semibold">
                      {event.hide ? "Unhide" : "Hide"}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        ))}
        </div>
      </div>
    </section>
  );
}

function DetailItem({
  label,
  value,
  strong = false,
  truncate = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
  truncate?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 lg:hidden">{label}</p>
      <p className={`mt-1 lg:mt-0 ${strong ? "font-medium leading-snug" : ""} ${truncate ? "lg:truncate" : ""}`}>
        {value}
      </p>
    </div>
  );
}
