-- user_applications 테이블의 외래키 제약 조건 제거
-- 이렇게 하면 Supabase Auth 사용자도 신청할 수 있습니다

-- 1. 외래키 제약 조건 제거
ALTER TABLE public.user_applications 
DROP CONSTRAINT IF EXISTS user_applications_user_id_fkey;

-- 2. user_id 컬럼을 NOT NULL로 변경 (선택사항)
-- ALTER TABLE public.user_applications 
-- ALTER COLUMN user_id SET NOT NULL;

-- 3. 인덱스는 그대로 유지 (성능을 위해)
-- CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON public.user_applications USING btree (user_id);

-- 4. RLS 정책 확인 (필요시 수정)
-- 현재 정책이 모든 사용자에게 접근을 허용하는지 확인
-- CREATE POLICY "Enable all access for all users" ON public.user_applications
--     FOR ALL USING (true) WITH CHECK (true);
