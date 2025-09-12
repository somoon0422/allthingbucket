-- 캠페인 테이블에 모든 필요한 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS provided_items text null,
ADD COLUMN IF NOT EXISTS keywords text null,
ADD COLUMN IF NOT EXISTS review_guidelines text null,
ADD COLUMN IF NOT EXISTS additional_info text null,
ADD COLUMN IF NOT EXISTS experience_location character varying(255) null,
ADD COLUMN IF NOT EXISTS experience_period character varying(100) null,
ADD COLUMN IF NOT EXISTS review_deadline timestamp with time zone null,
ADD COLUMN IF NOT EXISTS result_announcement timestamp with time zone null,
ADD COLUMN IF NOT EXISTS experience_announcement timestamp with time zone null;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_provided_items ON public.campaigns USING btree (provided_items);
CREATE INDEX IF NOT EXISTS idx_campaigns_keywords ON public.campaigns USING btree (keywords);
CREATE INDEX IF NOT EXISTS idx_campaigns_review_guidelines ON public.campaigns USING btree (review_guidelines);
CREATE INDEX IF NOT EXISTS idx_campaigns_additional_info ON public.campaigns USING btree (additional_info);
CREATE INDEX IF NOT EXISTS idx_campaigns_experience_location ON public.campaigns USING btree (experience_location);
CREATE INDEX IF NOT EXISTS idx_campaigns_experience_period ON public.campaigns USING btree (experience_period);
CREATE INDEX IF NOT EXISTS idx_campaigns_review_deadline ON public.campaigns USING btree (review_deadline);
CREATE INDEX IF NOT EXISTS idx_campaigns_result_announcement ON public.campaigns USING btree (result_announcement);
CREATE INDEX IF NOT EXISTS idx_campaigns_experience_announcement ON public.campaigns USING btree (experience_announcement);

-- RLS 정책 확인 (필요시)
-- 기존 RLS 정책이 있다면 그대로 유지
