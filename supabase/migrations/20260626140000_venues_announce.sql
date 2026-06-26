-- I-018a: venue announce override columns
-- show_in_announce: use venue name instead of city in public TG announcements
-- announce_name: short display name for TG (falls back to venues.name if null)

ALTER TABLE venues
  ADD COLUMN show_in_announce boolean NOT NULL DEFAULT false,
  ADD COLUMN announce_name    text;

UPDATE venues SET show_in_announce = true, announce_name = 'Earthdance'  WHERE id = '7836c202-9b2f-4fef-9d7a-83df353312a2';
UPDATE venues SET show_in_announce = true, announce_name = 'Ponderosa'   WHERE id = 'cf88831d-ba85-41de-b774-f066f9f93c3f';
UPDATE venues SET show_in_announce = true, announce_name = 'Sommerecke'  WHERE id = 'bda26c8d-20f5-4d97-be6c-1ae8bf3de076';
