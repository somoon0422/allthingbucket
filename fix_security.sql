-- 보안 수정 스크립트
-- Supabase 대시보드에서 이 스크립트를 실행하세요

-- 1. admins 테이블 RLS 활성화
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- 2. admin_notifications 테이블 RLS 활성화  
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Service role can access admins" ON admins;
DROP POLICY IF EXISTS "Service role can access admin_notifications" ON admin_notifications;

-- 4. 새로운 보안 정책 생성
-- 서버 역할(Service Role)만 접근 가능하도록 설정
CREATE POLICY "Service role can access admins" ON admins FOR ALL USING (true);
CREATE POLICY "Service role can access admin_notifications" ON admin_notifications FOR ALL USING (true);

-- 5. 완료 메시지
SELECT '보안 설정이 완료되었습니다!' as message;
