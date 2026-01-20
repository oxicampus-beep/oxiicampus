-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true);

-- Allow anyone to view listing images
CREATE POLICY "Listing images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'listings');

-- Allow authenticated users to upload listing images
CREATE POLICY "Users can upload listing images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listings' AND auth.uid() IS NOT NULL);

-- Allow users to update their own listing images
CREATE POLICY "Users can update their own listing images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own listing images
CREATE POLICY "Users can delete their own listing images"
ON storage.objects FOR DELETE
USING (bucket_id = 'listings' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Add status column to listings table
ALTER TABLE public.listings 
ADD COLUMN status TEXT DEFAULT 'available' 
CHECK (status IN ('available', 'sold', 'unavailable'));