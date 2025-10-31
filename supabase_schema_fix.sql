-- influencer_profiles 테이블 스키마 수정
-- 코드에서 사용하지 않는 필수 필드의 NOT NULL 제약 제거

-- 1. platform 필드를 NULL 허용하도록 변경 (코드에서 기본값 'instagram' 제공)
ALTER TABLE influencer_profiles
ALTER COLUMN platform DROP NOT NULL;

-- 2. handle 필드를 NULL 허용하도록 변경 (코드에서 자동 생성)
ALTER TABLE influencer_profiles
ALTER COLUMN handle DROP NOT NULL;

-- 3. 사용하지 않는 컬럼이 있다면 확인 후 삭제 (선택사항)
-- 예: ALTER TABLE influencer_profiles DROP COLUMN IF EXISTS unused_column;

-- 4. 기본값 설정 (선택사항)
ALTER TABLE influencer_profiles
ALTER COLUMN platform SET DEFAULT 'instagram';

ALTER TABLE influencer_profiles
ALTER COLUMN handle SET DEFAULT 'user';

-- 5. 현재 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'influencer_profiles'
ORDER BY ordinal_position;
