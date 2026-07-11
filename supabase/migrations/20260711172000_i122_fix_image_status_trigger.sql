-- I-122: fix protect_profile_image_status (20260711170000) - the original
-- check only allowed public.has_role(auth.uid(), 'admin'), but a service-role
-- connection (createAdminClient(), which the admin approve/reject actions and
-- this feature's own "reset to pending on re-upload" both use) has no
-- auth.uid() session at all, so has_role(NULL, 'admin') is always false - the
-- trigger would have incorrectly blocked the legitimate admin approval flow
-- too, not just a malicious direct write.
--
-- Corrected model: setting image_status back to 'pending' is always safe (it's
-- the least-privileged state, invisible publicly) and allowed for anyone,
-- including the self-service upload action running as the row owner. Setting
-- it to 'approved' or 'rejected' requires either a service-role connection
-- (auth.role() = 'service_role' - Supabase's standard convention for a
-- PostgREST request made with the service_role API key) or an authenticated
-- app-level admin (public.has_role(auth.uid(), 'admin')).
create or replace function public.protect_profile_image_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.image_status is distinct from OLD.image_status
     and NEW.image_status <> 'pending'
     and auth.role() <> 'service_role'
     and not public.has_role(auth.uid(), 'admin') then
    NEW.image_status := OLD.image_status;
  end if;
  return NEW;
end;
$$;
