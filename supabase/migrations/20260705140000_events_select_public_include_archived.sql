-- I-112 — archived events (past events, shown on venue/teacher/event history pages) are
-- meant to be publicly readable, but events_select_public only allowed status='published'.
-- App code was working around this with a service-role client bypass in 2 places
-- (getEventBySlug, getVenueEvents), manually re-deriving the safe conditions each time --
-- fragile, since forgetting a clause (e.g. hide=false) there would leak with no RLS
-- safety net. Widen RLS itself instead: single source of truth for "publicly readable",
-- enforced regardless of which query touches the table.
--
-- Explicit allow-list (not e.g. status <> 'draft'), so newly added statuses default to
-- NOT public: event_status is currently draft / pending / published / archived / rejected.
DROP POLICY "events_select_public" ON public.events;

CREATE POLICY "events_select_public" ON public.events
    FOR SELECT USING (hide = false AND status IN ('published', 'archived'));

-- Document actual usage: 'archived' is admin-settable (see EVENT_STATUS_OPTIONS in
-- lib/admin-events.ts) but in practice only ever applied by the time-based published→archived
-- transition once end_date passes. Manually retiring a still-upcoming event should use
-- cancelled=true (keeps it visible with an explanation) rather than 'archived' (which now
-- reads as public history) -- confirmed with the product owner 2026-07-05.
COMMENT ON TYPE event_status IS
    'draft: work in progress, not submitted. pending: submitted, awaiting approval. '
    'published: visible to public. archived: publicly-visible past event, set once '
    'end_date passes -- not used to manually retire a future event; use events.cancelled '
    'for that instead. rejected: submitted then declined by an admin (see admin_notes).';
