-- Promo banner images via Supabase Storage

ALTER TABLE public.promo_banners
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS image_path TEXT;

ALTER TABLE public.promo_banners
  ALTER COLUMN title DROP NOT NULL;

-- Storage bucket for promo banner images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promo-banners',
  'promo-banners',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "promo banner images public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'promo-banners');

CREATE POLICY "admin upload promo banner images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'promo-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update promo banner images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'promo-banners' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete promo banner images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'promo-banners' AND public.has_role(auth.uid(), 'admin'));
