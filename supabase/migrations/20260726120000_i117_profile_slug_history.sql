-- I-117: stable teacher profile URLs across slug (name) changes.
-- Tracks superseded slugs on profiles so a rename never silently breaks an
-- external link — the [slug] route falls back to this array and 301s to the
-- current slug (same shape as the events short_id redirect already in
-- app/events/[eventSlug]/page.tsx, just keyed on the slug itself since profiles
-- have no short_id).
alter table public.profiles add column previous_slugs text[];

create or replace function public.track_profile_slug_history()
returns trigger
language plpgsql
as $$
begin
  if new.slug is distinct from old.slug and old.slug is not null then
    if not (old.slug = any(coalesce(old.previous_slugs, '{}'::text[]))) then
      new.previous_slugs := array_append(coalesce(old.previous_slugs, '{}'::text[]), old.slug);
    end if;
  end if;
  return new;
end;
$$;

create trigger profiles_track_slug_history
before update on public.profiles
for each row
execute function public.track_profile_slug_history();
