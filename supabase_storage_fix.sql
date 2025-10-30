-- Supabase Storage RLS 정책 수정
-- campaign_images 버킷을 public으로 설정하여 모든 사용자가 업로드 가능하도록 변경

-- 1. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Public Access for campaign_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to campaign_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files in campaign_images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files in campaign_images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can manage campaign_images" ON storage.objects;

-- 2. Public 정책 생성 - 모든 사용자가 읽기 가능
CREATE POLICY "Allow public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'campaign_images');

-- 3. Public 정책 생성 - 모든 사용자가 업로드 가능
CREATE POLICY "Allow public insert access"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'campaign_images');

-- 4. Public 정책 생성 - 모든 사용자가 업데이트 가능
CREATE POLICY "Allow public update access"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'campaign_images')
WITH CHECK (bucket_id = 'campaign_images');

-- 5. Public 정책 생성 - 모든 사용자가 삭제 가능
CREATE POLICY "Allow public delete access"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'campaign_images');

-- 또는 더 간단하게 하나의 정책으로 모든 작업 허용:
-- DROP POLICY IF EXISTS "Allow public read access" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public insert access" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public update access" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow public delete access" ON storage.objects;

-- CREATE POLICY "Allow public access to campaign_images"
-- ON storage.objects FOR ALL
-- TO public
-- USING (bucket_id = 'campaign_images')
-- WITH CHECK (bucket_id = 'campaign_images');
