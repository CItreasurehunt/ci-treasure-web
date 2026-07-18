"use server";

import sharp from "sharp";

import { requireAdminUser } from "@/lib/admin-auth";
import { createClient } from "@/lib/supabase/server";

// Only reachable from the admin event form (components/admin/event-form.tsx), but a
// server action is an independently callable endpoint regardless of which UI renders
// it — requireAdminUser() is the real gate, not the component that happens to use this.
const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/webp"];
// Same conventions as lib/rehost-image.ts / photo-actions.ts (I-122): this path
// previously uploaded whatever the admin picked completely unprocessed — a real,
// uncompressed 4000px camera photo would sail straight through the type/size
// checks above. Resize + recompress here the same way the other three upload
// paths already do, closing the one upload path that never did.
const RESIZE_LONG_EDGE = 2000;

export async function uploadEventImage(formData: FormData) {
  await requireAdminUser();

  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");
  if (file.size > MAX_UPLOAD_BYTES) throw new Error("File too large (max 8MB)");
  if (!ALLOWED_TYPES.includes(file.type)) throw new Error("File must be JPEG or WEBP");

  const inputBuffer = Buffer.from(await file.arrayBuffer());
  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(RESIZE_LONG_EDGE, RESIZE_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    throw new Error("Could not process image");
  }

  const supabase = await createClient();

  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;
  const filePath = fileName;

  const { error } = await supabase.storage
    .from('event-images')
    // 30 days — Supabase's default is 1h, which PageSpeed Insights flagged as
    // ~14.7MB in avoidable re-fetches across the homepage's event images.
    .upload(filePath, outputBuffer, { contentType: "image/jpeg", cacheControl: '2592000' });

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return publicUrl;
}
