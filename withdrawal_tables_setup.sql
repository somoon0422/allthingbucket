-- 포인트 출금 시스템을 위한 테이블 생성

-- 1. 사용자 계좌 정보 테이블
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_name VARCHAR(100) NOT NULL,
    account_number VARCHAR(50) NOT NULL,
    account_holder VARCHAR(100) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, account_number)
);

-- 2. 출금 요청 테이블
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    bank_account_id UUID NOT NULL REFERENCES bank_accounts(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    withdrawal_amount DECIMAL(10,2) NOT NULL, -- 실제 출금 금액 (포인트 * 환율)
    exchange_rate DECIMAL(8,4) DEFAULT 1.0, -- 포인트 대 현금 환율
    status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected, completed, failed
    request_reason TEXT,
    admin_notes TEXT,
    processed_by UUID REFERENCES auth.users(id),
    processed_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 출금 히스토리 테이블 (points_history와 연동)
-- points_history 테이블에 출금 관련 컬럼 추가
ALTER TABLE points_history 
ADD COLUMN IF NOT EXISTS withdrawal_request_id UUID REFERENCES withdrawal_requests(id),
ADD COLUMN IF NOT EXISTS withdrawal_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS bank_account_info JSONB;

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_withdrawal_id ON points_history(withdrawal_request_id);

-- 5. RLS (Row Level Security) 정책 설정
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 계좌 정보만 조회/수정 가능
CREATE POLICY "Users can view own bank accounts" ON bank_accounts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts" ON bank_accounts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts" ON bank_accounts
    FOR UPDATE USING (auth.uid() = user_id);

-- 사용자는 자신의 출금 요청만 조회/생성 가능
CREATE POLICY "Users can view own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 관리자는 모든 출금 요청 조회/수정 가능 (임시로 모든 사용자 허용)
CREATE POLICY "Allow all users to view withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (true);

CREATE POLICY "Allow all users to update withdrawal requests" ON withdrawal_requests
    FOR UPDATE USING (true);

-- 6. 트리거 함수: 출금 요청 상태 변경 시 points_history 자동 생성
CREATE OR REPLACE FUNCTION create_withdrawal_points_history() RETURNS TRIGGER AS $$
BEGIN
    -- 출금 승인 시 points_history에 출금 기록 생성
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        INSERT INTO points_history (
            user_id,
            points,
            points_amount,
            type,
            points_type,
            status,
            payment_status,
            description,
            withdrawal_request_id,
            withdrawal_amount,
            bank_account_info,
            transaction_date,
            created_at
        ) VALUES (
            NEW.user_id,
            -NEW.points_amount, -- 음수로 출금 표시
            NEW.points_amount,
            'withdrawal',
            'withdrawal',
            'success',
            '출금완료',
            '포인트 출금 처리 (관리자 승인)',
            NEW.id,
            NEW.withdrawal_amount,
            (SELECT jsonb_build_object(
                'bank_name', ba.bank_name,
                'account_number', ba.account_number,
                'account_holder', ba.account_holder
            ) FROM bank_accounts ba WHERE ba.id = NEW.bank_account_id),
            NOW(),
            NOW()
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_withdrawal_points_history ON withdrawal_requests;
CREATE TRIGGER trigger_withdrawal_points_history
    AFTER UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION create_withdrawal_points_history();

-- 7. 트리거 함수: 출금 시 user_points 자동 업데이트
CREATE OR REPLACE FUNCTION update_user_points_on_withdrawal() RETURNS TRIGGER AS $$
BEGIN
    -- 출금 승인 시 user_points에서 포인트 차감
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        UPDATE user_points 
        SET 
            points = points - NEW.points_amount,
            used_points = used_points + NEW.points_amount,
            updated_at = NOW()
        WHERE user_id = NEW.user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_user_points_on_withdrawal ON withdrawal_requests;
CREATE TRIGGER trigger_update_user_points_on_withdrawal
    AFTER UPDATE ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_user_points_on_withdrawal();

-- 8. 관리자 알림을 위한 함수 (admin_notifications 테이블이 존재하는 경우에만)
CREATE OR REPLACE FUNCTION notify_admin_withdrawal_request() RETURNS TRIGGER AS $$
BEGIN
    -- 새로운 출금 요청 시 관리자에게 알림 (admin_notifications 테이블이 존재하는 경우에만)
    IF TG_OP = 'INSERT' THEN
        -- admin_notifications 테이블이 존재하는지 확인
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_notifications' AND table_schema = 'public') THEN
            INSERT INTO public.admin_notifications (
                type,
                title,
                message,
                data,
                read,
                created_at
            ) VALUES (
                'withdrawal_request',
                '새로운 포인트 출금 요청',
                '사용자가 포인트 출금을 요청했습니다.',
                jsonb_build_object(
                    'withdrawal_request_id', NEW.id,
                    'user_id', NEW.user_id::text,
                    'points_amount', NEW.points_amount,
                    'withdrawal_amount', NEW.withdrawal_amount,
                    'bank_account_id', NEW.bank_account_id
                ),
                false,
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성
DROP TRIGGER IF EXISTS trigger_notify_admin_withdrawal ON withdrawal_requests;
CREATE TRIGGER trigger_notify_admin_withdrawal
    AFTER INSERT ON withdrawal_requests
    FOR EACH ROW
    EXECUTE FUNCTION notify_admin_withdrawal_request();

-- 9. 초기 데이터 확인용 뷰 (user_profiles 테이블이 존재하는 경우에만)
CREATE OR REPLACE VIEW withdrawal_summary AS
SELECT 
    wr.id,
    wr.user_id,
    up.email,
    up.name,
    wr.points_amount,
    wr.withdrawal_amount,
    wr.status,
    ba.bank_name,
    ba.account_number,
    ba.account_holder,
    wr.created_at,
    wr.processed_at
FROM withdrawal_requests wr
LEFT JOIN user_profiles up ON wr.user_id::text = up.user_id::text
LEFT JOIN bank_accounts ba ON wr.bank_account_id = ba.id
ORDER BY wr.created_at DESC;

-- 완료 메시지
SELECT '포인트 출금 시스템 테이블 및 트리거 설정이 완료되었습니다.' as message;
