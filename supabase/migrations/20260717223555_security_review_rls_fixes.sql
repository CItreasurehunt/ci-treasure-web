-- Security review 2026-07-17: RLS policies on events/venues/event_series/profiles allowed
-- any authenticated user to bypass app-level checks via a direct REST call.
--
-- events_insert_authenticated and events_update had no WITH CHECK tying status/hide/
-- user_id/editors to the caller — the app's own createEvent()/updateEvent() only ever
-- write safe values, but that's an app-layer convention, not an RLS guarantee. A direct
-- POST/PATCH to /rest/v1/events with the (public) anon key + any authenticated session
-- could self-publish an event and self-grant persistent edit rights.
--
-- profiles_update_owner_or_admin has the same gap for is_trusted (auto-publish bypass —
-- the exact class of bug protect_profile_image_status was already added to prevent for
-- image_status, see 20260711170000/20260711172000) and show_in_list (curated-directory
-- bypass).
--
-- venues_insert_authenticated / event_series_insert_authenticated share the INSERT
-- pattern; no app code currently exercises venue/series self-creation, so this closes
-- latent attack surface rather than an actively-exploited path.

-- =============================================================================
-- events: INSERT — tie the row to the caller and force safe defaults
-- =============================================================================

DROP POLICY IF EXISTS "events_insert_authenticated" ON public.events;
CREATE POLICY "events_insert_authenticated" ON public.events
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
        AND status = 'pending'
        AND editors IS NULL
        AND hide = false
    );
-- Note: admin/import flows use the service-role client, which has BYPASSRLS and never
-- evaluates this policy — createEvent()'s is_trusted auto-publish step (app/events/
-- actions.ts) explicitly switches to createAdminClient() for that reason already.

-- =============================================================================
-- events: UPDATE — revert privileged columns unless admin/moderator/service-role
-- Mirrors the protect_profile_image_status trigger pattern (20260711172000) rather
-- than a WITH CHECK, since we need per-column protection: owners/editors must still be
-- able to edit title/description/etc., just not self-publish or reassign ownership.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_event_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- service_role (admin actions, imports) and app-level admins/moderators may change
  -- anything. auth.role() check mirrors 20260711172000's fix: a service-role connection
  -- has no auth.uid() session, so has_role(NULL, ...) would otherwise always be false.
  IF auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin')
     OR public.has_role(auth.uid(), 'moderator') THEN
    RETURN NEW;
  END IF;

  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.status := OLD.status;
  END IF;
  IF NEW.hide IS DISTINCT FROM OLD.hide THEN
    NEW.hide := OLD.hide;
  END IF;
  IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
    NEW.user_id := OLD.user_id;
  END IF;
  IF NEW.editors IS DISTINCT FROM OLD.editors THEN
    NEW.editors := OLD.editors;
  END IF;
  IF NEW.claimed_by IS DISTINCT FROM OLD.claimed_by THEN
    NEW.claimed_by := OLD.claimed_by;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_event_privileged_columns ON public.events;
CREATE TRIGGER protect_event_privileged_columns
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.protect_event_privileged_columns();

-- =============================================================================
-- profiles: protect is_trusted (moderation bypass) and show_in_list (curated-
-- directory bypass) the same way image_status is already protected.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  IF NEW.is_trusted IS DISTINCT FROM OLD.is_trusted THEN
    NEW.is_trusted := OLD.is_trusted;
  END IF;
  IF NEW.show_in_list IS DISTINCT FROM OLD.show_in_list THEN
    NEW.show_in_list := OLD.show_in_list;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

-- =============================================================================
-- venues / event_series: same unscoped-INSERT pattern as events, closed the same way.
-- =============================================================================

DROP POLICY IF EXISTS "venues_insert_authenticated" ON public.venues;
CREATE POLICY "venues_insert_authenticated" ON public.venues
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "event_series_insert_authenticated" ON public.event_series;
CREATE POLICY "event_series_insert_authenticated" ON public.event_series
    FOR INSERT WITH CHECK (auth.uid() = created_by);
