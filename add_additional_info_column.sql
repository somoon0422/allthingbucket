-- 캠페인 테이블에 additional_info 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS additional_info text null;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_additional_info ON public.campaigns USING btree (additional_info);

-- RLS 정책 확인 (필요시)
-- 기존 RLS 정책이 있다면 그대로 유지
