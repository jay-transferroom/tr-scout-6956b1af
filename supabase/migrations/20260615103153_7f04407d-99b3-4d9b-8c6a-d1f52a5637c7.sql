CREATE POLICY "Authenticated users can upload scout images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'scout_images' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Scout images are publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'scout_images');

CREATE POLICY "Users can update own scout images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'scout_images' AND (storage.foldername(name))[2] = auth.uid()::text);

CREATE POLICY "Users can delete own scout images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'scout_images' AND (storage.foldername(name))[2] = auth.uid()::text);