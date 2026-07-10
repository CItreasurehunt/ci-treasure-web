-- Add optional photographer/source credit for venues.image_url.
-- Mirrors events.image_credit (20260709120001) — populated only when the source
-- explicitly attributes the photo (named photographer/studio). See I-088/I-122.
alter table venues add column image_credit text;
