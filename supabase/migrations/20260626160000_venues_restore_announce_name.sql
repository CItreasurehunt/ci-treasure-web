-- Restore announce_name column: venues.name stays authoritative, announce_name is the short TG form
ALTER TABLE venues ADD COLUMN IF NOT EXISTS announce_name text;

-- Revert the 4 premature renames back to official names
UPDATE venues SET name = 'Létanec Art Center'                                   WHERE id = 'abcf2807-4781-4b19-981a-3f38f9a0d50f';
UPDATE venues SET name = 'Gaia Terra Ecovillage'                                WHERE id = 'f05b142c-07f1-438e-9d91-c49e2282055b';
UPDATE venues SET name = 'Ökodorf Sieben Linden'                                WHERE id = 'adfaba65-0baa-4780-9b4e-a42151a9c844';
UPDATE venues SET name = 'WildHeart: Center for Performance and Embodiment Practice' WHERE id = 'bcac074c-b4e5-4e8d-a8a4-3de9b43e506b';

-- Populate announce_name where it differs from venues.name
UPDATE venues SET announce_name = 'Létanec'       WHERE id = 'abcf2807-4781-4b19-981a-3f38f9a0d50f';
UPDATE venues SET announce_name = 'Gaia Terra'    WHERE id = 'f05b142c-07f1-438e-9d91-c49e2282055b';
UPDATE venues SET announce_name = 'Sieben Linden' WHERE id = 'adfaba65-0baa-4780-9b4e-a42151a9c844';
UPDATE venues SET announce_name = 'WildHeart Center' WHERE id = 'bcac074c-b4e5-4e8d-a8a4-3de9b43e506b';
-- Tänzerdorf Sommerecke: name itself is already the right announce name, no override needed
