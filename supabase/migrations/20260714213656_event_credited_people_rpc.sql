-- Replaces the service-role admin-client bypass in getEventBySlug() (lib/events.ts) with a
-- narrowly-scoped SECURITY DEFINER function. The event's teacher/organizer credit is public
-- historical record (who actually taught/organized it) even when the credited profile itself
-- is shadow (never claimed) or deactivated (self-hidden) — but a blanket RLS policy granting
-- public SELECT on `profiles` rows joined to a public event would leak the *entire* row (bio,
-- city, country, socials, links, etc.), defeating the point of self-service deactivation. This
-- function returns only the four columns the event page actually needs, for exactly the
-- teacher/organizer credits on events that are themselves publicly visible.
create or replace function public.get_event_credited_people(p_event_id uuid)
returns table (
  kind text,
  role text,
  name text,
  slug text,
  visibility profile_visibility
)
language sql
security definer
set search_path = public
stable
as $$
  select 'teacher'::text as kind, et.role::text, p.name, p.slug, p.visibility
  from event_teachers et
  join profiles p on p.id = et.teacher_id
  join events e on e.id = et.event_id
  where et.event_id = p_event_id
    and e.hide = false
    and e.status = any (array['published', 'archived']::event_status[])

  union all

  select 'organizer'::text as kind, eo.role::text, p.name, p.slug, p.visibility
  from event_organizers eo
  join profiles p on p.id = eo.organizer_id
  join events e on e.id = eo.event_id
  where eo.event_id = p_event_id
    and e.hide = false
    and e.status = any (array['published', 'archived']::event_status[]);
$$;

grant execute on function public.get_event_credited_people(uuid) to anon, authenticated;
