-- =============================================
-- wishlist 테이블 간단한 RLS 정책 수정
-- =============================================

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can create own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist;

-- 2. 임시로 모든 사용자에게 모든 권한 부여 (개발용)
CREATE POLICY "Allow all operations for authenticated users" ON public.wishlist
  FOR ALL USING (auth.role() = 'authenticated');

-- 3. 완료 메시지
SELECT 'wishlist 테이블 RLS 정책이 임시로 설정되었습니다.' as message;
