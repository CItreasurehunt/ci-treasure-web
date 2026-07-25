import { disciplineLabel } from "@/lib/event-display";

/**
 * Practice ("discipline") pill for entity detail-page headers. Deliberately shared between the
 * event header and the teacher header so a modality reads identically wherever it appears —
 * practice is the first badge that spans multiple entity types, so it's the one place a single
 * shared treatment actually matters (I-135 harmonization note).
 *
 * Frosted-on-dark (`bg-white/20` + `border-white/30`), matching the teacher header's RoleBadge
 * rather than the event header's solid-white type pill. That's intentional: on an event the solid
 * pill is the *type* (the event's primary identity — festival/jam/workshop); practice is secondary,
 * so a lighter frosted pill reads as subordinate to it instead of competing. Both header
 * backgrounds are dark gradients (event type-gradient, teacher/venue GENERIC_ACCENT_GRADIENT), so
 * one treatment works on all of them.
 *
 * Header-only for now (white text assumes a dark gradient behind it). A light-background variant
 * (for a future /teachers or /events listing filter chip on white) is a separate addition — don't
 * reuse this one there without adding a variant.
 */
export function PracticeBadge({ discipline }: { discipline: string }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm">
      {disciplineLabel(discipline)}
    </span>
  );
}

/**
 * Which practices to actually show on an *event* detail header.
 *
 * Suppresses a lone `contact_improvisation`: this is a CI-by-default site, so a solitary
 * "Contact Improvisation" badge on ~99% of event pages is noise, not information — the same
 * reasoning the listing filter (I-073) and the Telegram announce marker already apply, where CI
 * is the assumed default and only the *distinctive* practices get surfaced. Any non-CI or
 * multi-practice event shows all of its tags (CI included, so a CI+BMC mix is visible).
 *
 * Teacher pages deliberately do NOT use this filter — there, showing "Contact Improvisation"
 * explicitly is the point (it's what a future modality filter on /teachers keys off, and what
 * distinguishes a CI teacher from a BMC/Axis one). Same badge component, different show-rule,
 * because the two entities have genuinely different defaults-contexts.
 */
export function eventPracticesToShow(discipline: string[] | null | undefined): string[] {
  const list = (discipline ?? []).filter(Boolean);
  if (list.length === 1 && list[0] === "contact_improvisation") return [];
  return list;
}
