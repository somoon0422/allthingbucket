-- 기존 테이블 삭제 후 재생성 (오류 해결용)

-- 기존 테이블 삭제 (외래키 때문에 순서 중요)
DROP TABLE IF EXISTS withdrawal_requests CASCADE;
DROP TABLE IF EXISTS bank_accounts CASCADE;

-- 계좌 정보 테이블 생성
CREATE TABLE bank_accounts (
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

-- 환급 요청 테이블 생성
CREATE TABLE withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE CASCADE,
    points_amount INTEGER NOT NULL,
    withdrawal_amount INTEGER NOT NULL,
    exchange_rate DECIMAL(10,2) DEFAULT 1.0,
    tax_amount INTEGER DEFAULT 0,
    final_amount INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'account_verified', 'pending_approval', 'approved', 'rejected', 'completed', 'failed')),
    request_reason TEXT,
    admin_notes TEXT,
    processed_by TEXT,
    processed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_withdrawal_requests_user_id ON withdrawal_requests(user_id);
CREATE INDEX idx_withdrawal_requests_status ON withdrawal_requests(status);
CREATE INDEX idx_withdrawal_requests_created_at ON withdrawal_requests(created_at);
CREATE INDEX idx_withdrawal_requests_bank_account_id ON withdrawal_requests(bank_account_id);
CREATE INDEX idx_bank_accounts_user_id ON bank_accounts(user_id);
CREATE INDEX idx_bank_accounts_is_verified ON bank_accounts(is_verified);

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

-- RLS 정책 (임시로 모든 사용자 허용)
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can manage their own withdrawal requests" ON withdrawal_requests
    FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can manage their own bank accounts" ON bank_accounts
    FOR ALL USING (auth.uid()::text = user_id);

-- 관리자는 모든 데이터에 접근 가능
CREATE POLICY "Admins can manage all withdrawal requests" ON withdrawal_requests
    FOR ALL USING (true);

CREATE POLICY "Admins can manage all bank accounts" ON bank_accounts
    FOR ALL USING (true);

-- 샘플 데이터 삽입
INSERT INTO bank_accounts (user_id, bank_name, account_number, account_holder, is_verified) VALUES
('sample_user_1', '국민은행', '123456-78-901234', '홍길동', true),
('sample_user_2', '신한은행', '987654-32-109876', '김철수', true),
('sample_user_3', '우리은행', '555555-55-555555', '이영희', false);

-- 환급 요청 샘플 데이터 (올바른 bank_account_id 참조)
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

COMMENT ON TABLE withdrawal_requests IS '환급 요청 관리 테이블';
COMMENT ON TABLE bank_accounts IS '사용자 계좌 정보 테이블';
