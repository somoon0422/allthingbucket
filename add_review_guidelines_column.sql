-- 캠페인 테이블에 리뷰 작성시 안내사항 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS review_guidelines text null;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_review_guidelines ON public.campaigns USING btree (review_guidelines);

-- RLS 정책 업데이트 (필요시)
-- 기존 RLS 정책이 있다면 그대로 유지
