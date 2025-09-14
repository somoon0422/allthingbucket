-- 포인트 히스토리 변경 시 user_points 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_user_points_from_history()
RETURNS TRIGGER AS $$
DECLARE
    user_points_record RECORD;
    total_earned INTEGER := 0;
    total_used INTEGER := 0;
    available_points INTEGER := 0;
BEGIN
    -- 해당 사용자의 모든 포인트 히스토리에서 총 적립 포인트 계산
    SELECT COALESCE(SUM(points_amount), 0) INTO total_earned
    FROM points_history 
    WHERE user_id = NEW.user_id 
    AND status = 'success' 
    AND payment_status = '지급완료'
    AND points_type = 'earned';
    
    -- 해당 사용자의 모든 포인트 히스토리에서 총 출금 포인트 계산
    SELECT COALESCE(SUM(points_amount), 0) INTO total_used
    FROM points_history 
    WHERE user_id = NEW.user_id 
    AND (payment_status = '출금완료' OR points_type = 'withdrawal' OR status = 'withdrawn');
    
    -- 사용 가능한 포인트 계산 (총 적립 - 총 출금)
    available_points := GREATEST(0, total_earned - total_used);
    
    -- user_points 테이블에서 해당 사용자 레코드 찾기
    SELECT * INTO user_points_record
    FROM user_points 
    WHERE user_id = NEW.user_id;
    
    -- user_points 레코드가 있으면 업데이트, 없으면 생성
    IF user_points_record IS NOT NULL THEN
        UPDATE user_points 
        SET 
            points = available_points,
            earned_points = total_earned,
            used_points = total_used,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
        
        RAISE NOTICE 'Updated user_points for user %: earned=%, used=%, available=%', 
            NEW.user_id, total_earned, total_used, available_points;
    ELSE
        INSERT INTO user_points (user_id, points, earned_points, used_points, created_at, updated_at)
        VALUES (NEW.user_id, available_points, total_earned, total_used, NOW(), NOW());
        
        RAISE NOTICE 'Created new user_points for user %: earned=%, used=%, available=%', 
            NEW.user_id, total_earned, total_used, available_points;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- points_history 테이블에 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_points ON points_history;

CREATE TRIGGER trigger_update_user_points
    AFTER INSERT OR UPDATE ON points_history
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_from_history();

-- user_points 테이블에 user_id 유니크 제약조건 추가 (필요한 경우)
DO $$
BEGIN
    -- user_id에 유니크 제약조건이 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'user_points' 
        AND constraint_type = 'UNIQUE' 
        AND constraint_name LIKE '%user_id%'
    ) THEN
        ALTER TABLE user_points ADD CONSTRAINT user_points_user_id_unique UNIQUE (user_id);
        RAISE NOTICE 'Added unique constraint on user_id for user_points table';
    END IF;
END $$;

-- 기존 데이터에 대해 user_points 초기화 (한 번만 실행)
DO $$
DECLARE
    user_record RECORD;
    total_earned INTEGER;
    total_used INTEGER;
    available_points INTEGER;
BEGIN
    -- 모든 사용자에 대해 포인트 재계산
    FOR user_record IN 
        SELECT DISTINCT user_id FROM points_history WHERE user_id IS NOT NULL
    LOOP
        -- 총 적립 포인트 계산
        SELECT COALESCE(SUM(points_amount), 0) INTO total_earned
        FROM points_history 
        WHERE user_id = user_record.user_id 
        AND status = 'success' 
        AND payment_status = '지급완료'
        AND points_type = 'earned';
        
        -- 총 출금 포인트 계산
        SELECT COALESCE(SUM(points_amount), 0) INTO total_used
        FROM points_history 
        WHERE user_id = user_record.user_id 
        AND (payment_status = '출금완료' OR points_type = 'withdrawal' OR status = 'withdrawn');
        
        -- 사용 가능한 포인트 계산
        available_points := GREATEST(0, total_earned - total_used);
        
        -- user_points 업데이트 또는 생성
        INSERT INTO user_points (user_id, points, earned_points, used_points, created_at, updated_at)
        VALUES (user_record.user_id, available_points, total_earned, total_used, NOW(), NOW())
        ON CONFLICT (user_id) DO UPDATE SET
            points = available_points,
            earned_points = total_earned,
            used_points = total_used,
            updated_at = NOW();
    END LOOP;
    
    RAISE NOTICE 'Initial user_points calculation completed for all users';
END $$;
