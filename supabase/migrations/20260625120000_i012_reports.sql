-- I-012: reports table
-- Flag/report flow for events, venues, profiles (community ready once I-039 lands)

CREATE TABLE public.reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- entity
  entity_type    text NOT NULL
                 CHECK (entity_type IN ('event', 'venue', 'profile', 'community')),
  entity_id      uuid NOT NULL,
  entity_title   text,
  entity_slug    text,

  -- report content
  reason         text NOT NULL
                 CHECK (reason IN (
                   'incorrect_info', 'spam_fake', 'copyright', 'illegal_other'
                 )),
  details        text,

  -- reporter
  ip_hash        text,
  reporter_email text,

  -- admin workflow
  status         text NOT NULL DEFAULT 'open'
                 CHECK (status IN ('open', 'resolved', 'dismissed')),
  admin_note     text,
  resolved_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  resolved_at    timestamptz,

  -- meta
  source         text NOT NULL DEFAULT 'web_form',
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reports_ip_hash_created ON public.reports (ip_hash, created_at);
CREATE INDEX reports_status           ON public.reports (status);
CREATE INDEX reports_entity           ON public.reports (entity_type, entity_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_public_insert" ON public.reports
  FOR INSERT WITH CHECK (true);

CREATE POLICY "reports_admin_select" ON public.reports
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "reports_admin_update" ON public.reports
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
