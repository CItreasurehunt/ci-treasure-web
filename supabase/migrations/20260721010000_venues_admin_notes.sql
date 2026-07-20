-- Internal-only note field for venues, mirroring events.admin_notes.
-- Never rendered on the public venue page — for admin context only
-- (e.g. who to contact once venue claiming exists).
ALTER TABLE public.venues ADD COLUMN admin_notes text;
