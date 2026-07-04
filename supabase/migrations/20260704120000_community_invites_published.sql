-- Trust-first invite gating: no invite link is public until explicitly allow-listed.
-- Defaults to false so ALL existing links go hidden; admin flips per community as
-- consent is confirmed. The sync script upserts (community_id, platform) without
-- touching this column, so the allow-list survives the daily Airtable sync
-- (new invites still default to false).
alter table public.community_invites
  add column published boolean not null default false;
