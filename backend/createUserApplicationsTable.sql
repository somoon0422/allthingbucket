-- user_applications 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying(255) NOT NULL,
  experience_id character varying(255) NOT NULL,
  status character varying(20) DEFAULT 'pending'::character varying,
  applied_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  
  -- 신청자 정보
  name character varying(100),
  email character varying(255),
  phone character varying(20),
  address text,
  detailed_address text,
  
  -- SNS 정보
  instagram_handle character varying(100),
  blog_url text,
  youtube_channel text,
  
  -- 신청 내용
  application_reason text,
  experience_plan text,
  platform_type character varying(50),
  
  -- 관리자 정보
  submitted_by_role character varying(50),
  submitted_by_admin_role character varying(50),
  debug_info jsonb,
  
  CONSTRAINT user_applications_pkey PRIMARY KEY (id)
) TABLESPACE pg_default;

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON public.user_applications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_experience_id ON public.user_applications USING btree (experience_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON public.user_applications USING btree (status);
CREATE INDEX IF NOT EXISTS idx_user_applications_created_at ON public.user_applications USING btree (created_at);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON public.user_applications
  FOR SELECT USING (true);

-- 인증된 사용자가 자신의 신청만 삽입 가능
CREATE POLICY "Enable insert for authenticated users" ON public.user_applications
  FOR INSERT WITH CHECK (true);

-- 인증된 사용자가 자신의 신청만 수정 가능
CREATE POLICY "Enable update for authenticated users" ON public.user_applications
  FOR UPDATE USING (true);

-- 인증된 사용자가 자신의 신청만 삭제 가능
CREATE POLICY "Enable delete for authenticated users" ON public.user_applications
  FOR DELETE USING (true);
