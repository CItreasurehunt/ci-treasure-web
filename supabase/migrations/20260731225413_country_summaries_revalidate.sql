-- Extends 20260721205619_revalidate_on_write.sql's trigger to country_summaries. That migration
-- covered events/profiles/venues but not this table — found 2026-07-31 when a country_summaries
-- edit (the Greece Mihos-opening correction, done via direct SQL/MCP, not an in-app action) only
-- picked up on the plain 60-minute ISR window instead of instantly, same staleness gap the
-- original migration exists to close for the other three tables. public.trigger_revalidate()
-- itself needs no changes — it already forwards tg_table_name/record generically; the matching
-- `case "country_summaries"` in app/api/revalidate/route.ts is what actually resolves iso -> slug
-- and calls revalidatePath.

drop trigger if exists on_country_summaries_write_revalidate on public.country_summaries;
create trigger on_country_summaries_write_revalidate
after insert or update on public.country_summaries
for each row execute function public.trigger_revalidate();
