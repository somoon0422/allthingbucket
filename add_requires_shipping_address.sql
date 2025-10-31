-- campaigns 테이블에 배송지 수집 여부 필드 추가
-- 실행 날짜: 2025-10-31

-- 배송지 수집 여부 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS requires_shipping_address BOOLEAN DEFAULT true;

-- 컬럼에 설명 추가
COMMENT ON COLUMN campaigns.requires_shipping_address IS '신청 시 배송 주소를 수집할지 여부. true면 배송지 입력란 표시, false면 숨김 (네이버 구매평, 온라인 체험 등)';

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name = 'requires_shipping_address';
