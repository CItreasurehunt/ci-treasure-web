-- I-132: country landing pages. Small, explicit table for the one piece of a country page
-- that isn't pure aggregation of existing data — the AI-drafted, human-reviewed summary text.
-- A country only gets a static page once it has a row here (see lib/countries.ts /
-- app/[slug]/page.tsx generateStaticParams) — this is also how the spec's "minimum entity
-- threshold before publishing" gate is enforced in practice: no row, no page.
create table public.country_summaries (
  iso text primary key,
  summary_text text not null,
  reviewed_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.country_summaries enable row level security;

create policy "country_summaries_select_public" on public.country_summaries
for select using (true);
