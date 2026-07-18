"use server";

import sharp from "sharp";

import { requireAdminUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";
import { getThumbUrl } from "@/lib/image-url";

// Only reachable from the admin event form (components/admin/event-form.tsx), but a
// server action is an independently callable endpoint regardless of which UI renders
// it — requireAdminUser() is the real gate, not the component that happens to use this.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/webp"];
// Same conventions as lib/rehost-image.ts / photo-actions.ts (I-122/I-129): this path
// previously uploaded whatever the admin picked completely unprocessed — a real,
// uncompressed 4000px camera photo would sail straight through the type/size
// checks above. Resize + recompress here the same way the other upload paths do,
// and also produce the small tile-sized thumb alongside it.
const LARGE_LONG_EDGE = 1600;
const LARGE_QUALITY = 82;
const THUMB_LONG_EDGE = 400;
const THUMB_QUALITY = 75;

export async function uploadEventImage(formData: FormData) {
  await requireAdminUser();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 8MB)");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("File must be JPEG or WEBP");

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let largeBuffer: Buffer;
  let thumbBuffer: Buffer;
  try {
    const rotated = sharp(inputBuffer).rotate();
    largeBuffer = await rotated
      .clone()
      .resize(LARGE_LONG_EDGE, LARGE_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: LARGE_QUALITY })
      .toBuffer();
    thumbBuffer = await rotated
      .clone()
      .resize(THUMB_LONG_EDGE, THUMB_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: THUMB_QUALITY })
      .toBuffer();
  } catch {
    throw new Error("Could not process image");
  }

  const supabase = await createClient();

  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
  const filePath = fileName;
  const thumbPath = getThumbUrl(filePath);

  const { error } = await supabase.storage
    .from('event-images')
    // 30 days — Supabase's default is 1h, which PageSpeed Insights flagged as
    // ~14.7MB in avoidable re-fetches across the homepage's event images.
    .upload(filePath, largeBuffer, { contentType: "image/jpeg", cacheControl: '2592000' });

  if (error) {
    throw error;
  }

  // Atomic-ish: large uploads first, then thumb. If the thumb upload fails,
  // roll back the large so storage never ends up with a large file and no
  // matching thumb (I-129 — see spec for why this isn't a DB column).
  const { error: thumbError } = await supabase.storage
    .from('event-images')
    .upload(thumbPath, thumbBuffer, { contentType: "image/jpeg", cacheControl: '2592000' });

  if (thumbError) {
    await supabase.storage.from('event-images').remove([filePath]);
    throw thumbError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return publicUrl;
}
