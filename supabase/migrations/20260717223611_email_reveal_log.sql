-- Security review 2026-07-17: getProtectedEmail (lib/protected-email-action.ts) had
-- server-verified Turnstile but no rate limit, unlike its two structurally identical
-- siblings (invite-links-action.ts / I-099, report-action.ts / I-012), which both cap
-- requests per IP per day as defense-in-depth alongside Turnstile. Same ip_hash pattern.

create table public.email_reveal_log (
  id            uuid primary key default gen_random_uuid(),
  ip_hash       text not null,
  entity_type   text not null,
  entity_id     uuid not null,
  created_at    timestamptz not null default now()
);

create index on public.email_reveal_log (ip_hash, created_at);

alter table public.email_reveal_log enable row level security;
-- Intentionally no policies — service role bypasses RLS, anon/authenticated get zero access.
