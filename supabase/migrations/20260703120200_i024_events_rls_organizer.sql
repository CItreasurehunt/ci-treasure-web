-- I-024 Phase 2 — let organizers edit/see events linked to a profile they own.
-- Extends the two existing policies with an event_organizers → profiles(user_id) path.
-- Existing clauses are preserved verbatim; only the organizer EXISTS clause is added.

-- UPDATE: original had no separate WITH CHECK, so USING doubles as the row check.
DROP POLICY IF EXISTS "events_update" ON events;
CREATE POLICY "events_update" ON events FOR UPDATE
USING (
  auth.uid() = user_id
  OR auth.uid() = ANY (editors)
  OR has_role(auth.uid(), 'admin'::app_role)
  OR has_role(auth.uid(), 'moderator'::app_role)
  OR EXISTS (
    SELECT 1 FROM event_organizers eo
    JOIN profiles p ON p.id = eo.organizer_id
    WHERE eo.event_id = events.id AND p.user_id = auth.uid()
  )
);

-- SELECT (own): also surface pending/rejected events an organizer is linked to,
-- so they show up in the dashboard before they are published.
DROP POLICY IF EXISTS "events_select_own" ON events;
CREATE POLICY "events_select_own" ON events FOR SELECT
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1 FROM event_organizers eo
    JOIN profiles p ON p.id = eo.organizer_id
    WHERE eo.event_id = events.id AND p.user_id = auth.uid()
  )
);
