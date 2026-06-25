"use server";

import { createClient } from "@/lib/supabase/server";

export async function uploadEventImage(formData: FormData) {
  const file = formData.get("file") as File;
  if (!file) throw new Error("No file provided");

  const supabase = await createClient();

  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
  const filePath = fileName;

  const { data, error } = await supabase.storage
    .from('event-images')
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('event-images')
    .getPublicUrl(filePath);

  return publicUrl;
}
