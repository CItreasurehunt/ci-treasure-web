-- Lets a signed-in user who already owns a profile (teacher/organizer/musician) request to be
-- linked to an *additional* event as organizer or teacher — closes the gap where an event has
-- no organizer credited at all (or is missing one), which the plain profile-claim flow (I-024)
-- can't help with since there's no existing credit to take over. Mirrors that flow's shape:
-- pending state + SECURITY DEFINER submit RPC + admin-reviewed approve/reject, not auto-applied.
create table event_claims (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events(id) on delete cascade,
  profile_id uuid not null references profiles(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('organizer', 'teacher')),
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  reviewed_at timestamptz
);

create index event_claims_event_id_idx on event_claims(event_id);
create index event_claims_pending_idx on event_claims(status) where status = 'pending';

alter table event_claims enable row level security;

-- Claimant can see their own claims (dashboard "pending review" state); everything else is
-- admin-client only (service role bypasses RLS, same as profiles claim review).
create policy event_claims_select_own on event_claims
  for select using (auth.uid() = user_id);

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

revoke all on function public.submit_event_claim(uuid, text) from public;
grant execute on function public.submit_event_claim(uuid, text) to authenticated;
