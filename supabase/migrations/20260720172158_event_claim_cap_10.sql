-- Bumps the pending-event-claim cap from 5 to 10 — it's a soft anti-flood guard, not a
-- security boundary (admin review still gates every claim, and rejecting a bad one is a
-- single-row status update with no destructive side effects), and weekend workshops now
-- counting means an active organizer's real backlog can plausibly exceed 5 in one sitting.
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

  if (select count(*) from event_claims where user_id = v_uid and status = 'pending') >= 10 then
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
