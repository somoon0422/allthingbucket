-- 캠페인 테이블에 연락처 정보 및 상시 운영 필드 추가
-- 실행 날짜: 2025-10-29

-- 1. 연락처 정보 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- 2. 상시 운영 플래그 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS is_always_open_application BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_always_open_content BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_always_announcement_experience BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_always_announcement_result BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_always_announcement_influencer BOOLEAN DEFAULT FALSE;

-- 3. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN (
  'contact_email',
  'contact_phone',
  'is_always_open_application',
  'is_always_open_content',
  'is_always_announcement_experience',
  'is_always_announcement_result',
  'is_always_announcement_influencer'
)
ORDER BY ordinal_position;
