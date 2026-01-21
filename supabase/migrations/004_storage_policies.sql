-- ============================================
-- Storage Policies for survey-images bucket
-- ============================================

-- Create the bucket if it doesn't exist (handled in dashboard)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('survey-images', 'survey-images', true);

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'survey-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'survey-images')
WITH CHECK (bucket_id = 'survey-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'survey-images');

-- Allow public read access to all images
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'survey-images');
