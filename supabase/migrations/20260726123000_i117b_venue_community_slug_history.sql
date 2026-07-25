-- I-117 follow-up: extend the same slug-stability fix to venues and communities, ahead of
-- I-139 (venue self-edit) and I-111 (communities self-service) landing — once non-admins can
-- rename these entities, uncoordinated slug drift becomes likely, same as it did for teacher
-- profiles via manual I-098 corrections. Generic trigger function (works on any table with a
-- `slug` + `previous_slugs text[]` column pair) rather than duplicating
-- `track_profile_slug_history`'s body per table.
alter table public.venues add column previous_slugs text[];
alter table public.communities add column previous_slugs text[];

create or replace function public.track_slug_history()
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

create trigger venues_track_slug_history
before update on public.venues
for each row
execute function public.track_slug_history();

create trigger communities_track_slug_history
before update on public.communities
for each row
execute function public.track_slug_history();
