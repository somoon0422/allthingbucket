-- 1단계: 기존 데이터 정리 (P가 붙은 값들을 숫자만 추출)
UPDATE public.campaigns 
SET rewards = CAST(REGEXP_REPLACE(rewards::text, '[^0-9]', '', 'g') AS text)
WHERE rewards::text ~ '[^0-9]';

-- 2단계: 빈 값이나 null 값을 0으로 설정
UPDATE public.campaigns 
SET rewards = '0'
WHERE rewards IS NULL OR rewards = '' OR rewards = 'P';

-- 3단계: rewards 컬럼을 int 타입으로 변경
ALTER TABLE public.campaigns 
ALTER COLUMN rewards TYPE integer USING rewards::integer;

-- 4단계: 기본값 설정
ALTER TABLE public.campaigns 
ALTER COLUMN rewards SET DEFAULT 0;

-- 5단계: 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_campaigns_rewards ON public.campaigns USING btree (rewards);
