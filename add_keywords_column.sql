-- 캠페인 테이블에 키워드 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS keywords text null;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_keywords ON public.campaigns USING btree (keywords);

-- RLS 정책 업데이트 (필요시)
-- 기존 RLS 정책이 있다면 그대로 유지
