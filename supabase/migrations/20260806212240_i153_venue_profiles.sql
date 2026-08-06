-- I-153: venue_profiles — the last of the six entity relationships. Distinct from
-- community_venues/event_teachers: this captures a direct relationship to the *place* itself
-- (ownership/management, or a regular teaching residency) that isn't mediated by any event or
-- community. role is nullable/free text ('owner' | 'manager' | 'resident teacher' | ...) so
-- "runs the place" and "teaches here regularly" don't collapse into the same unlabeled fact.

create table public.venue_profiles (
  venue_id   uuid not null references public.venues(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role       text,
  created_at timestamptz not null default now(),
  primary key (venue_id, profile_id)
);

alter table public.venue_profiles enable row level security;

create policy venue_profiles_public_read on public.venue_profiles
  for select to anon, authenticated
  using (true);
