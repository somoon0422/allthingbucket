-- Supabase Storage RLS 정책 설정
-- campaign_images 버킷에 대한 접근 권한 설정

-- 1. campaign_images 버킷이 public인지 확인 (필요시 수동으로 Supabase Dashboard에서 설정)
-- Storage > campaign_images > Configuration > Public bucket 체크

-- 2. Storage 객체에 대한 RLS 정책 설정
-- 모든 사용자가 파일을 읽을 수 있도록 설정 (public access)
CREATE POLICY "Public Access for campaign_images"
ON storage.objects FOR SELECT
USING (bucket_id = 'campaign_images');

-- 인증된 사용자가 파일을 업로드할 수 있도록 설정
CREATE POLICY "Authenticated users can upload to campaign_images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'campaign_images');

-- 인증된 사용자가 자신이 업로드한 파일을 수정할 수 있도록 설정
CREATE POLICY "Users can update their own files in campaign_images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'campaign_images' AND auth.uid()::text = owner)
WITH CHECK (bucket_id = 'campaign_images');

-- 인증된 사용자가 자신이 업로드한 파일을 삭제할 수 있도록 설정
CREATE POLICY "Users can delete their own files in campaign_images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'campaign_images' AND auth.uid()::text = owner);

-- 또는 더 간단하게, 인증된 모든 사용자가 업로드/수정/삭제할 수 있도록 하려면:
-- (위의 개별 정책 대신 아래 정책을 사용)

-- DROP POLICY IF EXISTS "Authenticated users can upload to campaign_images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can update their own files in campaign_images" ON storage.objects;
-- DROP POLICY IF EXISTS "Users can delete their own files in campaign_images" ON storage.objects;

-- CREATE POLICY "Authenticated users can manage campaign_images"
-- ON storage.objects FOR ALL
-- TO authenticated
-- USING (bucket_id = 'campaign_images')
-- WITH CHECK (bucket_id = 'campaign_images');
