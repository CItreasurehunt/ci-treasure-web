-- I-153: event_organizers.community_id — lets a community be organizer-of-record on an event,
-- additive alongside existing person-level organizer rows (never a replacement). See
-- docs/issues/i-153-entity-cross-linking.md for the worked Assembly/Togethering examples.
alter table public.event_organizers
  add column community_id uuid references public.communities(id);

alter table public.event_organizers
  add constraint event_organizers_exactly_one_credit
    check (num_nonnulls(organizer_id, community_id) = 1);

-- organizer_id was not null; relax so a community-only row is valid.
alter table public.event_organizers
  alter column organizer_id drop not null;
