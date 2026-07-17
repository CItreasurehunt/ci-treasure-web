-- Follow-up to security_review_rls_fixes: testing revealed the new protective triggers
-- also silently blocked direct postgres-superuser SQL (e.g. Supabase MCP / SQL editor
-- sessions with no request.jwt.claims set at all) from touching the protected columns —
-- auth.role() and auth.uid() are both NULL in that context, so neither escape clause
-- matched. That's a real regression: this session's own venue curation work, and
-- future direct-SQL profile curation (I-074 teacher listing), both rely on exactly this
-- kind of direct postgres-role UPDATE.
--
-- Fix: also allow session_user = 'postgres'. This doesn't weaken the actual security
-- boundary — a superuser Postgres connection already has unrestricted access (can
-- bypass RLS entirely, alter the schema, or disable the trigger outright), so refusing
-- it here was only ever security theater, not a real control. The vulnerability these
-- triggers close is PostgREST-facing authenticated/anon self-escalation, not direct
-- superuser DB access, which is a separate, already-fully-trusted boundary.
--
-- Verified safe: this project uses Supabase's standard `authenticator` role (member of
-- anon/authenticated/service_role) as PostgREST's connecting role, not `postgres` —
-- confirmed via pg_roles/pg_auth_members. `SET ROLE` (which PostgREST uses per-request
-- to become anon/authenticated/service_role) changes current_user but never
-- session_user, so a real end-user request always has session_user = 'authenticator',
-- never 'postgres'. This escape clause is unreachable from any PostgREST-originated
-- request regardless of JWT role, and only matches a genuine direct superuser
-- connection.

CREATE OR REPLACE FUNCTION public.protect_event_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF session_user = 'postgres'
     OR auth.role() = 'service_role'
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

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF session_user = 'postgres'
     OR auth.role() = 'service_role'
     OR public.has_role(auth.uid(), 'admin') THEN
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
