import { supabase } from "@/integrations/supabase/client";

const BUCKET = "promo-banners";
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function validateBannerImage(file: File): string | null {
  if (!ALLOWED.includes(file.type)) return "Use JPG, PNG, WebP, or GIF.";
  if (file.size > MAX_BYTES) return "Image must be under 5 MB.";
  return null;
}

export async function uploadPromoBannerImage(file: File): Promise<{ image_url: string; image_path: string }> {
  const err = validateBannerImage(file);
  if (err) throw new Error(err);

  const id = crypto.randomUUID();
  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const image_path = `${id}/banner.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(image_path, file, { upsert: false, contentType: file.type });

  if (uploadError) throw new Error(uploadError.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(image_path);
  return { image_url: data.publicUrl, image_path };
}

export async function deletePromoBannerImage(image_path: string | null) {
  if (!image_path) return;
  await supabase.storage.from(BUCKET).remove([image_path]);
}
