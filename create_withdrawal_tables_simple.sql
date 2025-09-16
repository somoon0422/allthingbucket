-- 간단한 환급 요청 테이블 생성 (오류 방지용)

-- 환급 요청 테이블 생성
CREATE TABLE IF NOT EXISTS withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    bank_account_id UUID,
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
('sample_user_3', '우리은행', '555555-55-555555', '이영희', false)
ON CONFLICT DO NOTHING;

-- 환급 요청 샘플 데이터 (bank_account_id는 UUID 타입이므로 직접 참조)
INSERT INTO withdrawal_requests (
    user_id, 
    points_amount, 
    withdrawal_amount, 
    tax_amount, 
    final_amount, 
    status, 
    request_reason
) VALUES
(
    'sample_user_1',
    10000,
    10000,
    330,
    9670,
    'pending',
    '포인트 출금 요청'
),
(
    'sample_user_2',
    5000,
    5000,
    165,
    4835,
    'approved',
    '포인트 출금 요청'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE withdrawal_requests IS '환급 요청 관리 테이블';
COMMENT ON TABLE bank_accounts IS '사용자 계좌 정보 테이블';
