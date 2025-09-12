-- 플랫폼과 배송형 컬럼 추가
ALTER TABLE public.campaigns 
ADD COLUMN IF NOT EXISTS platform VARCHAR(50) DEFAULT '인스타그램',
ADD COLUMN IF NOT EXISTS delivery_type VARCHAR(50) DEFAULT '배송형';

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_platform ON public.campaigns USING btree (platform);
CREATE INDEX IF NOT EXISTS idx_campaigns_delivery_type ON public.campaigns USING btree (delivery_type);

-- 기존 데이터 업데이트 (필요시)
-- UPDATE public.campaigns SET platform = '인스타그램' WHERE platform IS NULL;
-- UPDATE public.campaigns SET delivery_type = '배송형' WHERE delivery_type IS NULL;
