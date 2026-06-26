-- Drop announce_name column — venues are renamed directly in DB instead
ALTER TABLE venues DROP COLUMN IF EXISTS announce_name;
