-- I-099: rate limit for community invite link reveals (defense-in-depth alongside Turnstile)
-- Same ip_hash pattern as the reports table (I-012). Service-role only — no anon policy needed
-- since this table is only ever touched from the getInviteLinks server action.

create table public.invite_reveal_log (
  id            uuid primary key default gen_random_uuid(),
  ip_hash       text not null,
  community_id  uuid not null references public.communities(id) on delete cascade,
  created_at    timestamptz not null default now()
);

create index on public.invite_reveal_log (ip_hash, created_at);

alter table public.invite_reveal_log enable row level security;
-- Intentionally no policies — service role bypasses RLS, anon/authenticated get zero access.
