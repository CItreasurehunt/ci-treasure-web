-- I-122: profile photo self-service upload.
-- Renames profile_picture_url -> image_url for naming consistency with
-- events.image_url / venues.image_url (zero app-code references to the old
-- name outside this migration, confirmed before renaming). Adds image_credit
-- (mirrors events/venues) and image_status, gating public visibility of a
-- self-uploaded photo behind admin review.
alter table profiles rename column profile_picture_url to image_url;
alter table profiles add column image_credit text;
alter table profiles add column image_status text not null default 'pending'
  check (image_status in ('pending', 'approved', 'rejected'));

-- Defense-in-depth beyond the upload server action (which always sets
-- image_status = 'pending' on write): profiles_update_owner_or_admin lets an
-- owner update any column on their own row, so without this trigger a direct
-- API call could set image_status = 'approved' and bypass moderation
-- entirely. Mirrors D-17's "RLS is the last line of defense" principle.
create or replace function public.protect_profile_image_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.image_status is distinct from OLD.image_status
     and not public.has_role(auth.uid(), 'admin') then
    NEW.image_status := OLD.image_status;
  end if;
  return NEW;
end;
$$;

create trigger protect_profile_image_status
  before update on profiles
  for each row execute function public.protect_profile_image_status();
