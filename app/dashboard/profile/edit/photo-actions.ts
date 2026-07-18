"use server";

import { revalidatePath } from "next/cache";
import sharp from "sharp";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getThumbUrl } from "@/lib/image-url";

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024;
const MIN_LONG_EDGE = 200;
// I-129: also produce a small tile-sized thumb alongside the large photo.
// 0 profiles have an approved photo yet, so there's nothing to backfill here —
// but wiring this now means teacher photos are two-size-ready from their very
// first upload, ahead of I-074 Phase 3 (teacher listing) needing tile photos.
const LARGE_LONG_EDGE = 1600;
const LARGE_QUALITY = 82;
const THUMB_LONG_EDGE = 400;
const THUMB_QUALITY = 75;

export async function uploadProfilePhoto(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { success: false, error: "No file provided" };
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return { success: false, error: "File too large (max 8MB)" };
  }
  if (!file.type.startsWith("image/")) {
    return { success: false, error: "File must be an image" };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, slug, image_url")
    .eq("user_id", user.id)
    .single();

  if (profileError || !profile) {
    return { success: false, error: "Profile not found" };
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let metadata;
  try {
    metadata = await sharp(inputBuffer).metadata();
  } catch {
    return { success: false, error: "Could not read image file" };
  }

  const longEdge = Math.max(metadata.width ?? 0, metadata.height ?? 0);
  if (longEdge < MIN_LONG_EDGE) {
    return { success: false, error: `Image too small (minimum ${MIN_LONG_EDGE}px)` };
  }

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
    return { success: false, error: "Could not process image" };
  }

  const admin = createAdminClient();
  const path = `${profile.slug}.jpg`;
  const thumbPath = getThumbUrl(path);

  const { error: uploadError } = await admin.storage
    .from("profile-images")
    // 30 days, not longer — see rehost-image.ts for the same reasoning
    // (upsert overwrites in place on re-upload, so this bounds staleness).
    .upload(path, largeBuffer, { contentType: "image/jpeg", upsert: true, cacheControl: "2592000" });

  if (uploadError) {
    return { success: false, error: uploadError.message };
  }

  // Atomic-ish: large uploads first, then thumb. If the thumb upload fails,
  // roll back the large so storage never ends up with a large file and no
  // matching thumb (I-129 — see spec for why this isn't a DB column).
  const { error: thumbError } = await admin.storage
    .from("profile-images")
    .upload(thumbPath, thumbBuffer, { contentType: "image/jpeg", upsert: true, cacheControl: "2592000" });

  if (thumbError) {
    await admin.storage.from("profile-images").remove([path]);
    return { success: false, error: thumbError.message };
  }

  // Orphan cleanup: if the previous image_url pointed into this bucket under a
  // different path than what we just wrote (e.g. a legacy/manually-set URL
  // with a different extension), remove it (and its thumb) so it doesn't
  // linger unreferenced.
  const previousPath = extractProfileImagesPath(profile.image_url);
  if (previousPath && previousPath !== path) {
    await admin.storage.from("profile-images").remove([previousPath, getThumbUrl(previousPath)]);
  }

  const { data: { publicUrl } } = admin.storage.from("profile-images").getPublicUrl(path);

  const creditRaw = formData.get("credit");
  const credit = typeof creditRaw === "string" && creditRaw.trim() !== "" ? creditRaw.trim() : null;

  // Uses the caller's own RLS-scoped client, not the admin client: image_status
  // must always go through the trigger's authorization path (protect_profile_image_status,
  // migration 20260711172000), which allows any authenticated owner to set it back to
  // 'pending' but not to 'approved'/'rejected'. Every upload resets to pending, no exceptions.
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      image_url: publicUrl,
      image_credit: credit,
      image_status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (updateError) {
    return { success: false, error: updateError.message };
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/profile/edit");
  // Deliberately not revalidating /teachers/[slug] - a pending photo isn't
  // publicly visible yet, so there's nothing new to show there.

  return { success: true };
}

function extractProfileImagesPath(imageUrl: string | null): string | null {
  if (!imageUrl) return null;
  const marker = "/profile-images/";
  const index = imageUrl.indexOf(marker);
  if (index === -1) return null;
  return imageUrl.slice(index + marker.length);
}
