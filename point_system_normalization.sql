-- =============================================
-- 포인트 시스템 정규화 및 상태값 통일 SQL
-- =============================================

-- 1. user_applications 테이블 상태값 정리
-- 기존 상태값들을 정규화된 상태값으로 업데이트
UPDATE public.user_applications 
SET status = CASE 
  WHEN status = 'review_in_progress' THEN 'review_submitted'
  WHEN status = 'review_completed' THEN 'review_approved'
  WHEN status = 'point_pending' THEN 'point_requested'
  WHEN status = 'completed' THEN 'point_completed'
  ELSE status
END
WHERE status IN ('review_in_progress', 'review_completed', 'point_pending', 'completed');

-- 2. points_history 테이블 정규화
-- payment_status 컬럼이 없으면 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'points_history' AND column_name = 'payment_status') THEN
    ALTER TABLE public.points_history ADD COLUMN payment_status VARCHAR(20) DEFAULT 'pending';
  END IF;
END $$;

-- payment_status 값 정규화
UPDATE public.points_history 
SET payment_status = CASE 
  WHEN payment_status = '지급대기중' THEN 'pending'
  WHEN payment_status = '지급완료' THEN 'completed'
  WHEN status = 'success' AND payment_status IS NULL THEN 'completed'
  WHEN status = 'pending' AND payment_status IS NULL THEN 'pending'
  WHEN status = 'failed' AND payment_status IS NULL THEN 'failed'
  ELSE payment_status
END;

-- 3. withdrawal_requests 테이블 정규화
-- 필요한 컬럼들이 없으면 추가
DO $$ 
BEGIN
  -- exchange_rate 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawal_requests' AND column_name = 'exchange_rate') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN exchange_rate DECIMAL(10,2) DEFAULT 1.0;
  END IF;
  
  -- request_reason 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawal_requests' AND column_name = 'request_reason') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN request_reason TEXT;
  END IF;
  
  -- admin_notes 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawal_requests' AND column_name = 'admin_notes') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN admin_notes TEXT;
  END IF;
  
  -- processed_by 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawal_requests' AND column_name = 'processed_by') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN processed_by VARCHAR(255);
  END IF;
  
  -- processed_at 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawal_requests' AND column_name = 'processed_at') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN processed_at TIMESTAMPTZ;
  END IF;
  
  -- completed_at 컬럼 추가
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'withdrawal_requests' AND column_name = 'completed_at') THEN
    ALTER TABLE public.withdrawal_requests ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- 4. user_points 테이블 정규화
-- 필요한 컬럼들이 없으면 추가
DO $$ 
BEGIN
  -- earned_points 컬럼 추가 (총 적립 포인트)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_points' AND column_name = 'earned_points') THEN
    ALTER TABLE public.user_points ADD COLUMN earned_points INTEGER DEFAULT 0;
  END IF;
  
  -- used_points 컬럼 추가 (사용/출금된 포인트)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_points' AND column_name = 'used_points') THEN
    ALTER TABLE public.user_points ADD COLUMN used_points INTEGER DEFAULT 0;
  END IF;
  
  -- points 컬럼 추가 (현재 사용 가능한 포인트)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_points' AND column_name = 'points') THEN
    ALTER TABLE public.user_points ADD COLUMN points INTEGER DEFAULT 0;
  END IF;
END $$;

-- 5. user_profiles 테이블에 experience_count 컬럼 추가
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'experience_count') THEN
    ALTER TABLE public.user_profiles ADD COLUMN experience_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- 6. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_user_applications_status ON public.user_applications(status);
CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON public.user_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON public.points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_payment_status ON public.points_history(payment_status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON public.withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON public.withdrawal_requests(status);

-- 7. 트리거 함수 업데이트 (포인트 자동 계산)
CREATE OR REPLACE FUNCTION update_user_points_from_history()
RETURNS TRIGGER AS $$
BEGIN
  -- 사용자의 포인트 히스토리에서 총 적립, 사용, 현재 잔액 계산
  WITH point_summary AS (
    SELECT 
      user_id,
      COALESCE(SUM(CASE WHEN points_type = 'earned' AND payment_status = 'completed' THEN points_amount ELSE 0 END), 0) as total_earned,
      COALESCE(SUM(CASE WHEN points_type = 'withdrawn' AND payment_status = 'completed' THEN ABS(points_amount) ELSE 0 END), 0) as total_used
    FROM public.points_history 
    WHERE user_id = COALESCE(NEW.user_id, OLD.user_id)
    GROUP BY user_id
  )
  INSERT INTO public.user_points (user_id, earned_points, used_points, points, updated_at)
  SELECT 
    ps.user_id,
    ps.total_earned,
    ps.total_used,
    ps.total_earned - ps.total_used,
    NOW()
  FROM point_summary ps
  ON CONFLICT (user_id) 
  DO UPDATE SET
    earned_points = EXCLUDED.earned_points,
    used_points = EXCLUDED.used_points,
    points = EXCLUDED.points,
    updated_at = EXCLUDED.updated_at;
    
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 8. 트리거 재생성
DROP TRIGGER IF EXISTS trigger_update_user_points ON public.points_history;
CREATE TRIGGER trigger_update_user_points
  AFTER INSERT OR UPDATE OR DELETE ON public.points_history
  FOR EACH ROW EXECUTE FUNCTION update_user_points_from_history();

-- 9. 기존 데이터 동기화
-- 모든 사용자의 포인트 데이터를 히스토리 기반으로 재계산
INSERT INTO public.user_points (user_id, earned_points, used_points, points, created_at, updated_at)
SELECT 
  user_id,
  COALESCE(SUM(CASE WHEN points_type = 'earned' AND payment_status = 'completed' THEN points_amount ELSE 0 END), 0) as earned_points,
  COALESCE(SUM(CASE WHEN points_type = 'withdrawn' AND payment_status = 'completed' THEN ABS(points_amount) ELSE 0 END), 0) as used_points,
  COALESCE(SUM(CASE WHEN points_type = 'earned' AND payment_status = 'completed' THEN points_amount ELSE 0 END), 0) - 
  COALESCE(SUM(CASE WHEN points_type = 'withdrawn' AND payment_status = 'completed' THEN ABS(points_amount) ELSE 0 END), 0) as points,
  NOW(),
  NOW()
FROM public.points_history 
GROUP BY user_id
ON CONFLICT (user_id) 
DO UPDATE SET
  earned_points = EXCLUDED.earned_points,
  used_points = EXCLUDED.used_points,
  points = EXCLUDED.points,
  updated_at = EXCLUDED.updated_at;

-- 10. 사용자 프로필의 체험단 참여 횟수 업데이트
UPDATE public.user_profiles 
SET experience_count = (
  SELECT COUNT(*) 
  FROM public.user_applications 
  WHERE user_applications.user_id = user_profiles.user_id 
    AND status = 'point_completed'
);

-- 11. 제약조건 추가
-- user_points 테이블에 유니크 제약조건 추가
ALTER TABLE public.user_points ADD CONSTRAINT unique_user_points_user_id UNIQUE (user_id);

-- 12. RLS 정책 업데이트 (보안 강화)
-- user_points 테이블 RLS 정책
DROP POLICY IF EXISTS "Users can view own points" ON public.user_points;
CREATE POLICY "Users can view own points" ON public.user_points
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can update own points" ON public.user_points;
CREATE POLICY "Users can update own points" ON public.user_points
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- points_history 테이블 RLS 정책
DROP POLICY IF EXISTS "Users can view own points history" ON public.points_history;
CREATE POLICY "Users can view own points history" ON public.points_history
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- withdrawal_requests 테이블 RLS 정책
DROP POLICY IF EXISTS "Users can view own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can view own withdrawal requests" ON public.withdrawal_requests
  FOR SELECT USING (auth.uid()::text = user_id::text);

DROP POLICY IF EXISTS "Users can create own withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Users can create own withdrawal requests" ON public.withdrawal_requests
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 13. 뷰 생성 (관리자용 통합 대시보드)
-- 먼저 테이블 구조 확인을 위해 간단한 뷰 생성
CREATE OR REPLACE VIEW admin_dashboard_view AS
SELECT 
  ua.id as application_id,
  ua.user_id,
  ua.campaign_id,
  ua.status as application_status,
  ua.created_at as application_created_at,
  ua.updated_at as application_updated_at,
  COALESCE(up.nickname, '이름 없음') as user_name,
  '이메일 없음' as user_email,
  COALESCE(up.phone, '연락처 없음') as user_phone,
  c.campaign_name,
  c.rewards,
  ph.id as points_history_id,
  ph.points_amount,
  ph.payment_status,
  ph.created_at as points_created_at,
  upoints.earned_points,
  upoints.used_points,
  upoints.points as available_points,
  uprofile.experience_count
FROM public.user_applications ua
LEFT JOIN public.user_profiles up ON ua.user_id = up.user_id
LEFT JOIN public.campaigns c ON ua.campaign_id = c.id
LEFT JOIN public.points_history ph ON ua.user_id = ph.user_id
LEFT JOIN public.user_points upoints ON ua.user_id = upoints.user_id
LEFT JOIN public.user_profiles uprofile ON ua.user_id = uprofile.user_id
ORDER BY ua.updated_at DESC;

-- 14. 함수 생성 (상태값 변경 시 자동 알림)
CREATE OR REPLACE FUNCTION notify_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- 상태가 변경되었을 때만 알림 생성
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.admin_notifications (
      type,
      title,
      message,
      data,
      read,
      created_at
    ) VALUES (
      'status_change',
      '신청 상태 변경',
      '사용자 ' || NEW.user_id || '의 신청 상태가 ' || OLD.status || '에서 ' || NEW.status || '로 변경되었습니다.',
      jsonb_build_object(
        'user_id', NEW.user_id,
        'application_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status
      ),
      false,
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 15. 상태 변경 알림 트리거
DROP TRIGGER IF EXISTS trigger_notify_status_change ON public.user_applications;
CREATE TRIGGER trigger_notify_status_change
  AFTER UPDATE ON public.user_applications
  FOR EACH ROW EXECUTE FUNCTION notify_status_change();

-- 완료 메시지
SELECT '포인트 시스템 정규화가 완료되었습니다.' as message;
