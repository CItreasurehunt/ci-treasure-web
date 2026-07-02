-- I-039 Step 1: communities mirror (Airtable → Supabase daily sync)
-- Public links live on communities (anon-readable). Private invite links live in
-- community_invites with NO anon policy — unreadable via the REST API by design.

create table public.communities (
  id               uuid        primary key default gen_random_uuid(),
  airtable_id      text        unique not null,

  -- Identity
  name             text        not null,
  slug             text        unique,
  type             text,
  verified         boolean     not null default false,

  -- Cross-links to existing entities (set manually, never touched by sync)
  venue_id         uuid        references public.venues(id),
  profile_id       uuid        references public.profiles(id),

  -- Location
  city             text,
  country          text,       -- ISO 3166-1 alpha-2; NULL for Worldwide / several
  region           text,
  continent        text,
  address_for_map  text,
  lat              numeric,
  lng              numeric,

  -- Content
  description      text,
  focus            text[],
  activity_level   text,
  languages        text[],
  audience_size    int,
  friendliness     text,
  contact_person   text,

  -- Public links
  website          text,
  instagram        text,
  facebook_group   text,
  facebook_page    text,
  telegram_group   text,
  telegram_channel text,
  whatsapp_channel text,
  youtube          text,
  calendar         text,       -- may be free text, not a URL
  newsletter       text,       -- may be an email address
  other_resource   text,

  -- Invite presence flag (maintained by sync; URLs themselves in community_invites)
  has_invites      boolean     not null default false,

  -- Sync metadata
  last_verified    date,
  airtable_created_at  timestamptz,
  airtable_updated_at  timestamptz,
  synced_at            timestamptz not null default now(),
  deleted_at           timestamptz
);

create index on public.communities (country);
create index on public.communities (continent);
create index on public.communities (type) where deleted_at is null;

create table public.community_invites (
  id            uuid  primary key default gen_random_uuid(),
  community_id  uuid  not null references public.communities(id) on delete cascade,
  platform      text  not null check (platform in ('telegram', 'whatsapp', 'signal')),
  url           text  not null,
  synced_at     timestamptz not null default now(),
  unique (community_id, platform)
);

alter table public.communities enable row level security;
alter table public.community_invites enable row level security;

create policy communities_public_read on public.communities
  for select to anon, authenticated
  using (deleted_at is null);

-- community_invites: intentionally NO select policy for anon/authenticated.
-- Only the service role (captcha server action, I-099) can read invite URLs.
