-- 현재 데이터베이스 상태 확인

-- 0. user_applications 테이블 스키마 확인
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'user_applications' 
ORDER BY ordinal_position;

-- 1. user_applications 테이블 데이터 확인
SELECT 
  id,
  user_id,
  campaign_id,
  status,
  applied_at
FROM user_applications 
ORDER BY applied_at DESC 
LIMIT 10;

-- 2. campaigns 테이블 데이터 확인
SELECT 
  id,
  campaign_name,
  product_name,
  brand_name,
  status,
  created_at
FROM campaigns 
ORDER BY created_at DESC 
LIMIT 10;

-- 3. user_applications와 campaigns 조인해서 연결 상태 확인
SELECT 
  ua.id as application_id,
  ua.user_id,
  ua.campaign_id,
  ua.status as application_status,
  c.campaign_name,
  c.product_name,
  c.brand_name,
  c.status as campaign_status
FROM user_applications ua
LEFT JOIN campaigns c ON ua.campaign_id = c.id
ORDER BY ua.applied_at DESC
LIMIT 10;

-- 4. campaigns 테이블에 있는 모든 ID 확인
SELECT id, campaign_name, product_name FROM campaigns;

-- 5. user_applications 테이블의 campaign_id 값들 확인
SELECT DISTINCT campaign_id FROM user_applications WHERE campaign_id IS NOT NULL;
