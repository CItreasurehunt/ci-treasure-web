import { requireAdminUser } from "@/lib/admin-auth";

import { getPendingEvents } from "./actions";
import { EventReviewActions } from "./review-actions";

export default async function AdminPendingEventsPage() {
  await requireAdminUser();
  const events = await getPendingEvents();

  return (
    <section className="rounded-[1.75rem] border border-white/80 bg-white/90 p-6 shadow-[0_18px_55px_rgba(106,75,25,0.08)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl text-slate-950">Pending events</h2>
          <p className="mt-1 text-sm text-slate-600">
            Organizer-submitted events awaiting review. Approving publishes and announces them. Trusting an
            organizer auto-publishes their future submissions.
          </p>
        </div>
        <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-semibold text-amber-800">
          {events.length} pending
        </span>
      </div>

      {events.length === 0 ? (
        <p className="mt-6 text-base text-slate-600">No pending events.</p>
      ) : (
        <ul className="mt-6 divide-y divide-(--color-sand-strong)">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-3 py-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="lg:pr-6">
                <p className="font-semibold text-slate-950">{event.title}</p>
                <p className="mt-1 text-sm text-slate-600">
                  {[event.startDate, [event.city, event.country].filter(Boolean).join(", ")]
                    .filter(Boolean)
                    .join(" · ")}
                </p>
                <p className="mt-1 text-sm text-slate-500">
                  Organizer: {event.organizer ? event.organizer.name : "— unlinked —"}
                </p>
              </div>
              <EventReviewActions eventId={event.id} organizer={event.organizer} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
