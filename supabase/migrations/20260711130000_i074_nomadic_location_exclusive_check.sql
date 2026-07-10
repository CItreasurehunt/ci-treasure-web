-- I-074 -- enforce is_nomadic/city/country mutual exclusivity at the DB level, not just as an
-- application-layer convention. Cleanup is being done via direct SQL updates (no admin UI exists
-- yet), so nothing was actually stopping is_nomadic=true and a populated city/country from
-- coexisting except discipline. All 594 existing profiles default is_nomadic=false, so this cannot
-- fail on current data.
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_nomadic_location_exclusive
  CHECK (NOT is_nomadic OR (city IS NULL AND country IS NULL));
