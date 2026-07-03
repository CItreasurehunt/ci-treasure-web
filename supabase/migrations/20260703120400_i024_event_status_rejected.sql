-- I-024 Phase 2 — add a 'rejected' event status for organizer submissions the admin
-- declines (distinct from 'archived', which is a retired live event). The rejection
-- reason is stored in events.admin_notes and shown to the organizer in their dashboard.
ALTER TYPE event_status ADD VALUE IF NOT EXISTS 'rejected';
