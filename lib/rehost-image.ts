import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";

// Same conventions as app/dashboard/profile/edit/photo-actions.ts (I-122): resize long edge,
// EXIF-safe rotate, JPEG quality 82.
const MAX_FETCH_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 10_000;
const RESIZE_LONG_EDGE = 2000;

function isOwnBucketUrl(url: string): boolean {
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return Boolean(base) && url.startsWith(`${base}/storage/`);
}

/**
 * Fetches an external image URL, validates/normalizes it, and stores our own copy —
 * closes the "organizer-pasted external URL rots/expires" risk (I-126). Skips entirely if
 * the URL already points into one of our own buckets.
 */
export async function rehostExternalImage(
  url: string,
  bucket: string,
  path: string,
): Promise<{ url: string } | { error: string }> {
  if (!url) {
    return { error: "No URL provided" };
  }
  if (isOwnBucketUrl(url)) {
    return { url };
  }

  let response: Response;
  try {
    response = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
  } catch {
    return { error: "Could not fetch image URL" };
  }
  if (!response.ok || !response.body) {
    return { error: `Image URL returned ${response.status}` };
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.startsWith("image/")) {
    return { error: "URL did not return an image" };
  }

  // Stream with a byte cap - don't trust Content-Length alone, a server can lie.
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.byteLength;
    if (total > MAX_FETCH_BYTES) {
      await reader.cancel();
      return { error: "Image too large (max 8MB)" };
    }
    chunks.push(value);
  }
  const inputBuffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));

  let outputBuffer: Buffer;
  try {
    outputBuffer = await sharp(inputBuffer)
      .rotate()
      .resize(RESIZE_LONG_EDGE, RESIZE_LONG_EDGE, { fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82 })
      .toBuffer();
  } catch {
    return { error: "Could not process image" };
  }

  const admin = createAdminClient();
  const { error: uploadError } = await admin.storage
    .from(bucket)
    .upload(path, outputBuffer, { contentType: "image/jpeg", upsert: true });
  if (uploadError) {
    return { error: uploadError.message };
  }

  const { data: { publicUrl } } = admin.storage.from(bucket).getPublicUrl(path);
  return { url: publicUrl };
}
