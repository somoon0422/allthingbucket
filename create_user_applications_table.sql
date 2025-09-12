-- user_applications 테이블 생성
CREATE TABLE IF NOT EXISTS public.user_applications (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id text NOT NULL,
    campaign_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending',
    application_data jsonb,
    applied_at timestamp with time zone DEFAULT now(),
    approved_at timestamp with time zone,
    rejected_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    CONSTRAINT user_applications_pkey PRIMARY KEY (id)
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON public.user_applications USING btree (user_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_campaign_id ON public.user_applications USING btree (campaign_id);
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON public.user_applications USING btree (status);
CREATE INDEX IF NOT EXISTS idx_user_applications_applied_at ON public.user_applications USING btree (applied_at);

-- RLS (Row Level Security) 활성화
ALTER TABLE public.user_applications ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 사용자가 읽기/쓰기 가능)
CREATE POLICY "Enable all access for all users" ON public.user_applications
    FOR ALL USING (true) WITH CHECK (true);

-- campaigns 테이블과의 외래키 관계 설정
ALTER TABLE public.user_applications 
    ADD CONSTRAINT fk_user_applications_campaign_id 
    FOREIGN KEY (campaign_id) 
    REFERENCES public.campaigns(id) 
    ON DELETE CASCADE;
