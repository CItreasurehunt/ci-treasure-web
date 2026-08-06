-- I-153: community_profiles / community_venues junction tables.
-- Replaces the single-valued communities.profile_id / communities.venue_id for the N:M cases
-- (e.g. Assembly, Sintra: 7 team members, multiple venues) that a single FK can't represent.
-- Old columns are kept for now (lib/communities.ts doesn't read the new tables yet) — this
-- migration is additive only. Backfill + column drop happen once the frontend is wired up.

create table public.community_profiles (
  community_id uuid not null references public.communities(id) on delete cascade,
  profile_id   uuid not null references public.profiles(id) on delete cascade,
  role         text,
  created_at   timestamptz not null default now(),
  primary key (community_id, profile_id)
);

create table public.community_venues (
  community_id uuid not null references public.communities(id) on delete cascade,
  venue_id     uuid not null references public.venues(id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (community_id, venue_id)
);

alter table public.community_profiles enable row level security;
alter table public.community_venues enable row level security;

create policy community_profiles_public_read on public.community_profiles
  for select to anon, authenticated
  using (true);

create policy community_venues_public_read on public.community_venues
  for select to anon, authenticated
  using (true);

-- Backfill from the existing single-valued columns. Excludes soft-deleted communities (e.g. the
-- 6 Studio/Space rows retired 2026-07-20 whose venue_id just points at their own now-independent
-- venue row) — those are historical, not live links.
insert into public.community_profiles (community_id, profile_id)
select id, profile_id from public.communities where profile_id is not null and deleted_at is null;

insert into public.community_venues (community_id, venue_id)
select id, venue_id from public.communities where venue_id is not null and deleted_at is null;

-- Assembly (Sintra): 7-person team + 2 curated venues (home base + guest-program venue).
insert into public.community_profiles (community_id, profile_id, role)
select c.id, p.id, null
from public.communities c
join public.profiles p on p.slug in (
  'francisco-borges', 'alexa-papa', 'reimar-wen-shen', 'viktoria-makra',
  'barbara-ramos', 'nikolai-denz', 'sandra-fleischmann'
)
where c.slug = 'assembly';

insert into public.community_venues (community_id, venue_id)
select c.id, v.id
from public.communities c
join public.venues v on v.slug in ('quinta-ten-chi-sintra', 'estudio-yucca-tavira')
where c.slug = 'assembly';
