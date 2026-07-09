-- Add optional photographer/source credit for events.image_url.
-- Populated when a promotional photo (not an official flyer) is reused and the
-- photographer is credited at the source (e.g. FB post comments).
alter table events add column image_credit text;
