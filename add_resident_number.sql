-- influencer_profiles 테이블에 주민등록번호 컬럼 추가
-- 출금 관리 기능을 위한 개인정보 필드

-- 1. resident_number 컬럼 추가 (VARCHAR 13자리 - 하이픈 제거한 형태로 저장)
ALTER TABLE influencer_profiles
ADD COLUMN IF NOT EXISTS resident_number VARCHAR(13);

-- 2. 컬럼에 대한 주석 추가 (문서화)
COMMENT ON COLUMN influencer_profiles.resident_number IS '주민등록번호 (하이픈 없이 13자리 숫자로 저장)';

-- 3. 인덱스 추가 (검색 성능 향상 - 선택사항)
-- CREATE INDEX IF NOT EXISTS idx_influencer_profiles_resident_number
-- ON influencer_profiles(resident_number);

-- 4. 현재 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default, character_maximum_length
FROM information_schema.columns
WHERE table_name = 'influencer_profiles'
ORDER BY ordinal_position;
