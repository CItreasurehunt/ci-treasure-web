import Link from "next/link";

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
 * `href` (optional) makes the pill a link to the filtered listing (`/?discipline=<slug>`). Used on
 * the event header, where the target filter exists. Teacher headers pass no href (stay plain spans)
 * until `/teachers` has its own practice filter (I-074) — otherwise a teacher's tag would jump to
 * the *events* listing, a semantic non-sequitur.
 *
 * Header-only for now (white text assumes a dark gradient behind it). A light-background variant
 * (for a future /teachers or /events listing filter chip on white) is a separate addition — don't
 * reuse this one there without adding a variant.
 */
export function PracticeBadge({ discipline, href }: { discipline: string; href?: string }) {
  const className =
    "inline-flex items-center rounded-full border border-white/30 bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white backdrop-blur-sm";
  if (href) {
    return (
      <Link href={href} className={`${className} transition hover:bg-white/30`}>
        {disciplineLabel(discipline)}
      </Link>
    );
  }
  return (
    <span className={className}>
      {disciplineLabel(discipline)}
    </span>
  );
}

/**
 * Which practices to actually render as badges — shared by the event and teacher headers.
 *
 * Suppresses a lone `contact_improvisation`: this is a CI-by-default site, so a solitary
 * "Contact Improvisation" badge is noise, not information — the same reasoning the listing filter
 * (I-073) and the Telegram announce marker already apply, where CI is the assumed default and only
 * the *distinctive* practices get surfaced. Any non-CI or multi-practice entity shows all its tags
 * (CI included, so a CI+BMC mix stays visible).
 *
 * Applies to teachers too (decided 2026-07-25, correcting the earlier "teachers show all" choice):
 * a CI teacher showing "Contact Improvisation" is the same redundancy as on an event. The future
 * `/teachers` modality filter keys off the `discipline` *column*, which keeps CI regardless of what
 * the badge renders — so suppressing the badge costs the filter nothing.
 */
export function practicesToDisplay(discipline: string[] | null | undefined): string[] {
  const list = (discipline ?? []).filter(Boolean);
  if (list.length === 1 && list[0] === "contact_improvisation") return [];
  return list;
}
