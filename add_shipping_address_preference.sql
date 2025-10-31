-- 캠페인 테이블에 배송 주소 수집 여부 필드 추가
-- 실행 날짜: 2025-10-31
-- 설명: 네이버 구매평 등 배송이 불필요한 캠페인을 위해 배송 주소 수집 여부를 선택할 수 있도록 함

-- 1. 배송 주소 수집 여부 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS collect_shipping_address BOOLEAN DEFAULT TRUE;

-- 2. 컬럼 설명 추가
COMMENT ON COLUMN campaigns.collect_shipping_address IS '배송 주소 수집 여부 (TRUE: 수집, FALSE: 미수집). 네이버 구매평 등 배송이 불필요한 경우 FALSE로 설정';

-- 3. 인덱스 추가 (필터링 성능 향상)
CREATE INDEX IF NOT EXISTS idx_campaigns_collect_shipping_address
ON campaigns(collect_shipping_address);
