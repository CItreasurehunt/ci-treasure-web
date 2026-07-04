-- Add LINE as a valid invite platform, matching the treatment of telegram/whatsapp/
-- signal: token-bearing group-invite links (line.me/ti/g/...) get the same captcha-
-- gated reveal instead of sitting in the public "Other Platform or Resource" column.
alter table public.community_invites
  drop constraint community_invites_platform_check;
alter table public.community_invites
  add constraint community_invites_platform_check
  check (platform = any (array['telegram', 'whatsapp', 'signal', 'line']));

alter table public.communities
  add column has_line_invite boolean not null default false;
