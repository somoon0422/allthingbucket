-- =============================================
-- wishlist 테이블 RLS 정책 수정
-- =============================================

-- 1. wishlist 테이블이 없으면 생성
CREATE TABLE IF NOT EXISTS public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) NOT NULL,
  campaign_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT wishlist_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(user_id) ON DELETE CASCADE,
  CONSTRAINT wishlist_campaign_id_fkey FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE,
  CONSTRAINT wishlist_unique_user_campaign UNIQUE (user_id, campaign_id)
);

-- 2. RLS 활성화
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- 3. 기존 정책 삭제 (있다면)
DROP POLICY IF EXISTS "Users can view own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can create own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can update own wishlist" ON public.wishlist;
DROP POLICY IF EXISTS "Users can delete own wishlist" ON public.wishlist;

-- 4. 새로운 RLS 정책 생성
-- 사용자는 자신의 찜목록만 조회 가능
CREATE POLICY "Users can view own wishlist" ON public.wishlist
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- 사용자는 자신의 찜목록만 생성 가능
CREATE POLICY "Users can create own wishlist" ON public.wishlist
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 사용자는 자신의 찜목록만 수정 가능
CREATE POLICY "Users can update own wishlist" ON public.wishlist
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 사용자는 자신의 찜목록만 삭제 가능
CREATE POLICY "Users can delete own wishlist" ON public.wishlist
  FOR DELETE USING (auth.uid()::text = user_id::text);

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON public.wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_campaign_id ON public.wishlist(campaign_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON public.wishlist(created_at);

-- 6. 완료 메시지
SELECT 'wishlist 테이블 RLS 정책이 성공적으로 설정되었습니다.' as message;
