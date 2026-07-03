-- I-024 Phase 2 — admin rejection/notes field on events.
-- Shown to the organizer in their dashboard when an event is rejected.
ALTER TABLE events ADD COLUMN IF NOT EXISTS admin_notes text;
