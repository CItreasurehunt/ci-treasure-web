-- I-074 -- profiles.is_nomadic: a third location state alongside city/country/NULL, for teachers
-- with no single identifiable home base (as opposed to a teacher who simply tours a lot but has a
-- real base -- those just get city/country set normally). See docs/issues/i-074-teachers-listing.md
-- addendum 2026-07-11. Unblocks the ongoing residency-vs-nationality profile cleanup (memory
-- feedback_location_is_residency) without waiting on the public teachers listing page build.
ALTER TABLE public.profiles
  ADD COLUMN is_nomadic boolean NOT NULL DEFAULT false;
