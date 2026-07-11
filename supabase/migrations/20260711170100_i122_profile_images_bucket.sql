-- I-122: storage bucket for self-uploaded profile photos.
-- Public read (photos are only linked from profiles.image_url once approved),
-- authenticated write via the server action's admin client. JPEG only: the
-- upload path always converts to JPEG server-side before writing here, so
-- nothing else ever actually lands in this bucket through our own code.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('profile-images', 'profile-images', true, 8388608, array['image/jpeg']);
