-- user_applications 테이블 성능 최적화를 위한 인덱스 추가
-- 실행 날짜: 2025-10-30

-- 1. updated_at 컬럼에 인덱스 추가 (정렬 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_applications_updated_at
ON user_applications(updated_at DESC);

-- 2. created_at 컬럼에 인덱스 추가 (선택사항)
CREATE INDEX IF NOT EXISTS idx_user_applications_created_at
ON user_applications(created_at DESC);

-- 3. user_id와 campaign_id 복합 인덱스 (중복 신청 체크 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_applications_user_campaign
ON user_applications(user_id, campaign_id);

-- 4. status 컬럼에 인덱스 추가 (상태별 조회 성능 향상)
CREATE INDEX IF NOT EXISTS idx_user_applications_status
ON user_applications(status);

-- 5. 인덱스 생성 확인
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'user_applications'
ORDER BY indexname;
