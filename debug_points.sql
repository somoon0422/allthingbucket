-- 포인트 관련 데이터 디버깅 쿼리

-- 1. points_history 테이블의 최근 데이터 확인
SELECT 
    id,
    user_id,
    points_amount,
    points_type,
    status,
    payment_status,
    description,
    created_at
FROM points_history 
ORDER BY created_at DESC 
LIMIT 10;

-- 2. 특정 사용자의 포인트 히스토리 확인 (user_id를 실제 값으로 변경하세요)
-- SELECT 
--     id,
--     user_id,
--     points_amount,
--     points_type,
--     status,
--     payment_status,
--     description,
--     created_at
-- FROM points_history 
-- WHERE user_id = 'YOUR_USER_ID_HERE'
-- ORDER BY created_at DESC;

-- 3. user_points 테이블 상태 확인
SELECT 
    id,
    user_id,
    points,
    earned_points,
    used_points,
    created_at,
    updated_at
FROM user_points 
ORDER BY updated_at DESC 
LIMIT 10;

-- 4. points_history에서 payment_status가 '지급완료'인 레코드 확인
SELECT 
    id,
    user_id,
    points_amount,
    payment_status,
    description,
    created_at
FROM points_history 
WHERE payment_status = '지급완료'
ORDER BY created_at DESC;
