-- Fix: I-129 Phase 2 added WebP medium/small uploads to the profile photo
-- pipeline (photo-actions.ts), but the profile-images bucket was never
-- updated from its original jpeg-only restriction (20260711170100), which
-- assumed everything landing here was converted to JPEG. Every upload since
-- has been failing at the medium-size WebP write and rolling back — zero
-- profiles have ever had a working self-uploaded photo. Bring this bucket in
-- line with event-images/venue-images, which already allow jpeg+webp
-- (20260711174000).
update storage.buckets
set allowed_mime_types = array['image/jpeg', 'image/webp']
where id = 'profile-images';
