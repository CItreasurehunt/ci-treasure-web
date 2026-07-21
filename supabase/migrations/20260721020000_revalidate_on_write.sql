-- Revalidate the Next.js ISR cache immediately on any events/profiles/venues write, instead of
-- waiting up to the 3600s revalidate window those pages use (app/events/[eventSlug]/page.tsx,
-- app/teachers/[slug]/page.tsx, app/venues/[slug]/page.tsx, and their list pages). This matters
-- because a large share of writes to these tables happen outside the app entirely — direct SQL via
-- the Supabase MCP, enrichment scripts — which never go through the server actions (events/actions.ts,
-- dashboard/profile/edit/actions.ts, etc.) that already call revalidatePath() for in-app edits.
--
-- Mirrors the existing supabase_functions.http_request trigger pattern used for TG announcements
-- (see 20260720182046_i138_announce_event_channel_trigger.sql), but calls our own app/api/revalidate
-- route instead of an edge function. That route requires a bearer-token secret (POST-only, allowlisted
-- table names) so it can't be used as an open cache-busting/DoS lever — the simpler
-- supabase_functions.http_request helper has no way to attach that header from a literal-headers
-- migration without committing the secret to git, so this uses pg_net directly and pulls the secret
-- from Supabase Vault at call time instead.
--
-- One-time setup required outside this migration (deliberately not committed — contains the secret):
--   select vault.create_secret('<value>', 'revalidate_secret');
-- and the same value must be set as the REVALIDATE_SECRET env var in the Vercel project.
--
-- Communities are not wired up here — they're still Airtable-authoritative. Add a matching trigger
-- once I-111 flips communities to Supabase-authoritative (see that issue's Sequencing section).

create or replace function public.trigger_revalidate()
returns trigger
language plpgsql
security definer
set search_path = public, vault, extensions
as $$
declare
  secret text;
begin
  select decrypted_secret into secret
  from vault.decrypted_secrets
  where name = 'revalidate_secret'
  limit 1;

  -- Not configured yet (e.g. a fresh branch/preview DB without the vault secret) — no-op rather
  -- than blocking the write that triggered this.
  if secret is null then
    return coalesce(new, old);
  end if;

  perform net.http_post(
    url := 'https://citreasurehunt.com/api/revalidate',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || secret
    ),
    body := jsonb_build_object(
      'type', tg_op,
      'table', tg_table_name,
      'record', to_jsonb(new),
      'old_record', to_jsonb(old)
    ),
    timeout_milliseconds := 5000
  );

  return coalesce(new, old);
end;
$$;

drop trigger if exists on_events_write_revalidate on public.events;
create trigger on_events_write_revalidate
after insert or update on public.events
for each row execute function public.trigger_revalidate();

drop trigger if exists on_profiles_write_revalidate on public.profiles;
create trigger on_profiles_write_revalidate
after insert or update on public.profiles
for each row execute function public.trigger_revalidate();

drop trigger if exists on_venues_write_revalidate on public.venues;
create trigger on_venues_write_revalidate
after insert or update on public.venues
for each row execute function public.trigger_revalidate();
