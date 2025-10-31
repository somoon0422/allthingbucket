-- ============================================
-- campaign_products 테이블 생성
-- 캠페인별 제품 정보를 저장하는 테이블
-- ============================================

CREATE TABLE IF NOT EXISTS public.campaign_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL,
  product_name TEXT NOT NULL,
  allowed_platforms JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Foreign Key 제약조건 추가 (이미 존재하면 무시)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'campaign_products_campaign_id_fkey'
  ) THEN
    ALTER TABLE public.campaign_products
    ADD CONSTRAINT campaign_products_campaign_id_fkey
    FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE CASCADE;
  END IF;
END $$;

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_campaign_products_campaign_id ON public.campaign_products(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_products_created_at ON public.campaign_products(created_at DESC);

-- RLS (Row Level Security) 정책 활성화
ALTER TABLE public.campaign_products ENABLE ROW LEVEL SECURITY;

-- RLS 정책 삭제 (기존에 있을 경우)
DROP POLICY IF EXISTS "Anyone can view campaign products" ON public.campaign_products;
DROP POLICY IF EXISTS "Authenticated users can create campaign products" ON public.campaign_products;
DROP POLICY IF EXISTS "Authenticated users can update campaign products" ON public.campaign_products;
DROP POLICY IF EXISTS "Authenticated users can delete campaign products" ON public.campaign_products;

-- RLS 정책: 모든 사용자가 읽을 수 있음
CREATE POLICY "Anyone can view campaign products"
ON public.campaign_products
FOR SELECT
USING (true);

-- RLS 정책: 인증된 사용자만 생성 가능
CREATE POLICY "Authenticated users can create campaign products"
ON public.campaign_products
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 수정 가능
CREATE POLICY "Authenticated users can update campaign products"
ON public.campaign_products
FOR UPDATE
USING (auth.role() = 'authenticated');

-- RLS 정책: 인증된 사용자만 삭제 가능
CREATE POLICY "Authenticated users can delete campaign products"
ON public.campaign_products
FOR DELETE
USING (auth.role() = 'authenticated');

-- 코멘트 추가
COMMENT ON TABLE public.campaign_products IS '캠페인별 제품 정보';
COMMENT ON COLUMN public.campaign_products.id IS '제품 ID';
COMMENT ON COLUMN public.campaign_products.campaign_id IS '캠페인 ID (FK)';
COMMENT ON COLUMN public.campaign_products.product_name IS '제품명';
COMMENT ON COLUMN public.campaign_products.allowed_platforms IS '허용된 플랫폼 목록 (JSON 배열): ["review", "blog", "naver", "instagram", "youtube", "tiktok", "product", "press", "local", "other"]';
COMMENT ON COLUMN public.campaign_products.created_at IS '생성일시';
COMMENT ON COLUMN public.campaign_products.updated_at IS '수정일시';
