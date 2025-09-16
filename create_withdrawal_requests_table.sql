-- 환급 요청 테이블 생성
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    bank_account_id UUID NOT NULL,
    points_amount INTEGER NOT NULL,
    withdrawal_amount INTEGER NOT NULL,
    exchange_rate DECIMAL(10,2) DEFAULT 1.0,
    tax_amount INTEGER DEFAULT 0,
    final_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'completed', 'failed')),
    request_reason TEXT,
    admin_notes TEXT,
    processed_by TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 계좌 정보 테이블 생성
CREATE TABLE IF NOT EXISTS bank_accounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    bank_name TEXT NOT NULL,
    account_number TEXT NOT NULL,
    account_holder TEXT NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_verified ON bank_accounts(is_verified);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- withdrawal_requests 테이블 정책
CREATE POLICY "Users can view their own withdrawal requests" ON withdrawal_requests
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own withdrawal requests" ON withdrawal_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own withdrawal requests" ON withdrawal_requests
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 관리자는 모든 withdrawal_requests에 접근 가능 (임시로 모든 사용자 허용)
CREATE POLICY "Admins can manage all withdrawal requests" ON withdrawal_requests
    FOR ALL USING (true);

-- bank_accounts 테이블 정책
CREATE POLICY "Users can view their own bank accounts" ON bank_accounts
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own bank accounts" ON bank_accounts
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own bank accounts" ON bank_accounts
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 관리자는 모든 bank_accounts에 접근 가능 (임시로 모든 사용자 허용)
CREATE POLICY "Admins can manage all bank accounts" ON bank_accounts
    FOR ALL USING (true);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_withdrawal_requests_updated_at 
    BEFORE UPDATE ON withdrawal_requests 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at 
    BEFORE UPDATE ON bank_accounts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO bank_accounts (user_id, bank_name, account_number, account_holder, is_verified) VALUES
('sample_user_1', '국민은행', '123456-78-901234', '홍길동', true),
('sample_user_2', '신한은행', '987654-32-109876', '김철수', true),
('sample_user_3', '우리은행', '555555-55-555555', '이영희', false);

-- 환급 요청 샘플 데이터
INSERT INTO withdrawal_requests (
    user_id, 
    bank_account_id, 
    points_amount, 
    withdrawal_amount, 
    tax_amount, 
    final_amount, 
    status, 
    request_reason
) VALUES
(
    'sample_user_1',
    (SELECT id FROM bank_accounts WHERE user_id = 'sample_user_1' LIMIT 1),
    10000,
    10000,
    330,
    9670,
    'pending',
    '포인트 출금 요청'
),
(
    'sample_user_2',
    (SELECT id FROM bank_accounts WHERE user_id = 'sample_user_2' LIMIT 1),
    5000,
    5000,
    165,
    4835,
    'approved',
    '포인트 출금 요청'
);

-- 뷰 생성 (환급 요청 상세 정보 조회용)
CREATE OR REPLACE VIEW withdrawal_requests_detail AS
SELECT 
    wr.*,
    ba.bank_name,
    ba.account_number,
    ba.account_holder,
    up.name as user_name,
    up.phone as user_phone,
    up.address as user_address,
    up.display_name as user_display_name
FROM withdrawal_requests wr
LEFT JOIN bank_accounts ba ON wr.bank_account_id = ba.id
LEFT JOIN user_profiles up ON wr.user_id = up.user_id;

-- 사용자별 환급 요청 통계 뷰
CREATE OR REPLACE VIEW user_withdrawal_stats AS
SELECT 
    user_id,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_requests,
    COUNT(*) FILTER (WHERE status = 'approved') as approved_requests,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_requests,
    COUNT(*) FILTER (WHERE status = 'rejected') as rejected_requests,
    SUM(points_amount) as total_points_requested,
    SUM(final_amount) as total_amount_received
FROM withdrawal_requests
GROUP BY user_id;

COMMENT ON TABLE withdrawal_requests IS '환급 요청 관리 테이블';
COMMENT ON TABLE bank_accounts IS '사용자 계좌 정보 테이블';
COMMENT ON VIEW withdrawal_requests_detail IS '환급 요청 상세 정보 조회 뷰';
COMMENT ON VIEW user_withdrawal_stats IS '사용자별 환급 요청 통계 뷰';
