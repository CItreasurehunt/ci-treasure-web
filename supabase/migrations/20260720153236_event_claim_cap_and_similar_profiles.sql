-- Caps pending event claims at 5 per user (not 1, unlike profile claims) — a real organizer
-- can legitimately have several genuine events to claim at once (unlike profiles, where a
-- person only ever has one identity), so the goal is stopping queue-flooding, not restricting
-- normal use.
create or replace function public.submit_event_claim(p_event_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_profile_id uuid;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_role not in ('organizer', 'teacher') then
    raise exception 'Invalid role';
  end if;

  select id into v_profile_id from profiles where user_id = v_uid;
  if v_profile_id is null then
    raise exception 'You need a claimed profile before you can claim an event';
  end if;

  if (select count(*) from event_claims where user_id = v_uid and status = 'pending') >= 5 then
    raise exception 'You have too many pending event claims — wait for one to be reviewed first';
  end if;

  if not exists (select 1 from events where id = p_event_id) then
    raise exception 'Event not found';
  end if;

  if p_role = 'organizer' and exists (
    select 1 from event_organizers where event_id = p_event_id and organizer_id = v_profile_id
  ) then
    raise exception 'You are already linked to this event as an organizer';
  end if;

  if p_role = 'teacher' and exists (
    select 1 from event_teachers where event_id = p_event_id and teacher_id = v_profile_id
  ) then
    raise exception 'You are already linked to this event as a teacher';
  end if;

  if exists (
    select 1 from event_claims
    where event_id = p_event_id and profile_id = v_profile_id and role = p_role and status = 'pending'
  ) then
    raise exception 'You already have a pending claim for this event and role';
  end if;

  insert into event_claims (event_id, profile_id, user_id, role)
  values (p_event_id, v_profile_id, v_uid, p_role);
end;
$$;

-- Backs the new-profile "similar profiles already exist" warning — advisory only, never
-- blocks creation. SECURITY DEFINER because shadow profiles (invisible under normal RLS)
-- need to be checked too, same reasoning as searchProfiles in dashboard/claim/actions.ts.
-- Returns only non-sensitive fields, same minimal-exposure shape as that search.
create or replace function public.search_similar_profiles(p_name text)
returns table (
  id uuid,
  name text,
  slug text,
  bio_snippet text,
  visibility profile_visibility
)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.name, p.slug, left(p.bio, 160) as bio_snippet, p.visibility
  from profiles p
  where similarity(p.name, p_name) > 0.4
  order by similarity(p.name, p_name) desc
  limit 5;
$$;

revoke all on function public.search_similar_profiles(text) from public;
grant execute on function public.search_similar_profiles(text) to authenticated;
