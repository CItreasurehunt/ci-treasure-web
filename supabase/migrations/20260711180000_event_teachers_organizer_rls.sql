-- Helper: true when the current user owns or is a lead organizer of the event.
-- Lives in public, matching public.has_role() and every other helper in this codebase.
CREATE OR REPLACE FUNCTION public.is_event_organizer(p_event_id uuid)
RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.event_organizers eo
      JOIN public.profiles p ON p.id = eo.organizer_id
    WHERE eo.event_id = p_event_id AND p.user_id = auth.uid()
  )
$$;

-- Widen INSERT WITH CHECK — additive: keep every existing clause, add the organizer path.
DROP POLICY IF EXISTS "event_teachers_insert" ON public.event_teachers;
CREATE POLICY "event_teachers_insert" ON public.event_teachers
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id
              AND (e.user_id = auth.uid() OR auth.uid() = ANY(e.editors))
        )
        OR public.is_event_organizer(event_id)
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'moderator')
    );

-- Widen UPDATE — same additive pattern.
DROP POLICY IF EXISTS "event_teachers_update" ON public.event_teachers;
CREATE POLICY "event_teachers_update" ON public.event_teachers
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id
              AND (e.user_id = auth.uid() OR auth.uid() = ANY(e.editors))
        )
        OR public.is_event_organizer(event_id)
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'moderator')
    );

-- Widen DELETE. NOTE: unlike INSERT/UPDATE above, adding moderator here is a real
-- permission change, not preservation - the current delete policy only has admin.
-- Deliberate, confirmed with Jan (see prose above). Also backs the teacher
-- self-removal feature: a teacher removing themselves is covered separately below
-- (their own teacher_id row), this clause only covers organizer/admin/moderator removal.
DROP POLICY IF EXISTS "event_teachers_delete" ON public.event_teachers;
CREATE POLICY "event_teachers_delete" ON public.event_teachers
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_id
              AND (e.user_id = auth.uid() OR auth.uid() = ANY(e.editors))
        )
        OR public.is_event_organizer(event_id)
        OR public.has_role(auth.uid(), 'admin')
        OR public.has_role(auth.uid(), 'moderator')
        -- self-removal: a teacher can always delete their own link
        OR EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.id = event_teachers.teacher_id AND p.user_id = auth.uid()
        )
    );
