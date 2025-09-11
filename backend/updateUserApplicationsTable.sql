-- user_applications 테이블에 누락된 컬럼들 추가
ALTER TABLE public.user_applications 
ADD COLUMN IF NOT EXISTS name character varying(100),
ADD COLUMN IF NOT EXISTS email character varying(255),
ADD COLUMN IF NOT EXISTS phone character varying(20),
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS detailed_address text,
ADD COLUMN IF NOT EXISTS instagram_handle character varying(100),
ADD COLUMN IF NOT EXISTS blog_url text,
ADD COLUMN IF NOT EXISTS youtube_channel text,
ADD COLUMN IF NOT EXISTS application_reason text,
ADD COLUMN IF NOT EXISTS experience_plan text,
ADD COLUMN IF NOT EXISTS platform_type character varying(50),
ADD COLUMN IF NOT EXISTS submitted_by_role character varying(50),
ADD COLUMN IF NOT EXISTS submitted_by_admin_role character varying(50),
ADD COLUMN IF NOT EXISTS debug_info jsonb,
ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT now(),
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- experience_id 컬럼도 추가 (현재 코드에서 사용)
ALTER TABLE public.user_applications 
ADD COLUMN IF NOT EXISTS experience_id character varying(255);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_applications_experience_id ON public.user_applications USING btree (experience_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON public.user_applications USING btree (status);
CREATE INDEX IF NOT EXISTS idx_user_applications_created_at ON public.user_applications USING btree (created_at);
