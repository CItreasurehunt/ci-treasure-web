-- I-153: drop communities.profile_id / communities.venue_id — the single-value columns these
-- replaced. Both were backfilled into community_profiles / community_venues in
-- 20260806164127_i153_community_junctions.sql and nothing in the app reads them anymore.
alter table public.communities drop column if exists profile_id;
alter table public.communities drop column if exists venue_id;
