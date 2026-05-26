
-- =============================================
-- 004_storage_policies_item_images_avatars.sql
-- Predictive insights RPC
-- Get Location Insights (7-Day Found Counts)
-- =============================================


-- item-images bucket
DROP POLICY IF EXISTS "Public read item images" ON storage.objects;
CREATE POLICY "Public read item images"
  ON storage.objects FOR SELECT USING (bucket_id = 'item-images');

DROP POLICY IF EXISTS "Auth upload item images" ON storage.objects;
CREATE POLICY "Auth upload item images"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users update own item images" ON storage.objects;
CREATE POLICY "Users update own item images"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

DROP POLICY IF EXISTS "Users delete own item images" ON storage.objects;
CREATE POLICY "Users delete own item images"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'item-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- avatars bucket
DROP POLICY IF EXISTS "Public read avatars" ON storage.objects;
CREATE POLICY "Public read avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Auth upload avatars" ON storage.objects;
CREATE POLICY "Auth upload avatars"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );