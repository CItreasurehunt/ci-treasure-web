-- I-099 follow-up: which invite platforms exist, as public booleans (names only, never URLs).
-- Written exclusively by the sync script from data it already computes in memory — no read
-- against community_invites required here or anywhere else outside the service-role server action.
alter table public.communities
  add column has_telegram_invite boolean not null default false,
  add column has_whatsapp_invite boolean not null default false,
  add column has_signal_invite   boolean not null default false;
