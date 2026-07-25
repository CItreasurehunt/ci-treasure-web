-- Adds an is_claimed flag to get_event_credited_people so the event page can show a
-- "claim your event" CTA when at least one organizer is unclaimed (I-118). Returns a
-- boolean, not the raw user_id, to keep this SECURITY DEFINER function's exposure to
-- exactly what the public event page needs (same minimal-exposure reasoning as the
-- original migration's four-column choice).
drop function if exists public.get_event_credited_people(uuid);

create function public.get_event_credited_people(p_event_id uuid)
returns table (
  kind text,
  role text,
  name text,
  slug text,
  visibility profile_visibility,
  is_claimed boolean
)
language sql
security definer
set search_path = public
stable
as $$
  select 'teacher'::text as kind, et.role::text, p.name, p.slug, p.visibility, (p.user_id is not null) as is_claimed
  from event_teachers et
  join profiles p on p.id = et.teacher_id
  join events e on e.id = et.event_id
  where et.event_id = p_event_id
    and e.hide = false
    and e.status = any (array['published', 'archived']::event_status[])

  union all

  select 'organizer'::text as kind, eo.role::text, p.name, p.slug, p.visibility, (p.user_id is not null) as is_claimed
  from event_organizers eo
  join profiles p on p.id = eo.organizer_id
  join events e on e.id = eo.event_id
  where eo.event_id = p_event_id
    and e.hide = false
    and e.status = any (array['published', 'archived']::event_status[]);
$$;

grant execute on function public.get_event_credited_people(uuid) to anon, authenticated;
