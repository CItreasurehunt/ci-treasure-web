-- I-135 — practice tags on teacher profiles.
--
-- Mirrors events.discipline exactly (same column name, same text[] type, same GIN index)
-- so the events and profiles vocabularies stay one shared concept rather than drifting.
-- The public-facing UI label is "Practice"; the column name stays `discipline` to match
-- events.discipline. A future rename of both columns to `practice` is deliberately deferred
-- (it would touch two DB columns, a GIN index, two Deno edge functions that read
-- event.discipline outside the type-checked build, and the `?discipline=` filter URL param).
--
-- Greenfield: profiles has no discipline column today (checked 2026-07-25). Nullable, no
-- default — an untagged profile stays NULL, distinct from an explicitly-empty [] (the same
-- convention events.discipline uses). Backfill happens separately via enrichment scripts /
-- Supabase MCP, one profile at a time (the I-098 pattern), not in this migration.

alter table public.profiles add column discipline text[];

-- GIN for containment queries (discipline @> '{bmc}'), matching idx_events_discipline —
-- so a future /teachers practice filter has the same index shape the events filter relies on.
create index idx_profiles_discipline on public.profiles using gin (discipline);
