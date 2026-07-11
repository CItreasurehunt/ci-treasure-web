-- I-122: retroactively apply the same infra-layer limits to event-images and
-- venue-images that profile-images shipped with. Both buckets have had
-- file_size_limit = null and allowed_mime_types = null since creation -
-- no enforcement beyond application code. Only affects new uploads, existing
-- objects are untouched.
--
-- allowed_mime_types is jpeg+webp here (not jpeg-only like profile-images):
-- both enrich_image.py and enrich_venue_image.py keep a source's native
-- jpg/webp extension rather than always converting to jpeg (see
-- _image_processing.py, same migration set) - webp really does land in these
-- two buckets, unlike profile-images where the upload path always outputs jpeg.
update storage.buckets
set file_size_limit = 8388608, allowed_mime_types = array['image/jpeg', 'image/webp']
where id in ('event-images', 'venue-images');
