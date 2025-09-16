-- 실명인증 관련 테이블 생성

-- 1. 인증 요청 테이블
CREATE TABLE IF NOT EXISTS verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    verification_id TEXT UNIQUE NOT NULL,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    user_birth TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'expired')),
    expires_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    user_info JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 사용자 프로필 테이블에 필요한 컬럼들 추가
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS signup_code TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS current_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawn INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_verification_id ON verification_requests(verification_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 인증 요청만 조회 가능
CREATE POLICY "Users can view own verification requests" ON verification_requests
    FOR SELECT USING (auth.uid()::text = user_id);

-- 사용자는 자신의 인증 요청만 생성 가능
CREATE POLICY "Users can create own verification requests" ON verification_requests
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 인증 요청만 업데이트 가능
CREATE POLICY "Users can update own verification requests" ON verification_requests
    FOR UPDATE USING (auth.uid()::text = user_id);

-- 5. 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_verification_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 생성
CREATE TRIGGER trigger_update_verification_requests_updated_at
    BEFORE UPDATE ON verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_verification_requests_updated_at();

-- 7. 샘플 데이터 (테스트용)
INSERT INTO verification_requests (
    user_id, 
    verification_id, 
    user_name, 
    user_phone, 
    user_birth, 
    status
) VALUES (
    'test-user-123',
    'test-verification-456',
    '홍길동',
    '01012345678',
    '19900101',
    'pending'
) ON CONFLICT (verification_id) DO NOTHING;

-- 8. 사용자 프로필에 세금 정보 업데이트 예시
UPDATE user_profiles 
SET tax_info = jsonb_build_object(
    'resident_number_encrypted', 'encrypted_data_here',
    'tax_type', 'individual',
    'verified_at', NOW(),
    'verification_method', 'nice'
)
WHERE user_id = 'test-user-123';

-- 9. 뷰 생성 (인증 상태 확인용)
CREATE OR REPLACE VIEW user_verification_status AS
SELECT 
    up.user_id,
    COALESCE(up.name, up.nickname) as name,
    up.tax_info,
    CASE 
        WHEN up.tax_info->>'resident_number_encrypted' IS NOT NULL 
        THEN true 
        ELSE false 
    END as is_verified,
    up.tax_info->>'verified_at' as verified_at,
    up.tax_info->>'verification_method' as verification_method
FROM user_profiles up;

-- 10. 함수 생성 (인증 상태 확인)
CREATE OR REPLACE FUNCTION check_user_verification_status(p_user_id TEXT)
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'verified', CASE 
            WHEN tax_info->>'resident_number_encrypted' IS NOT NULL 
            THEN true 
            ELSE false 
        END,
        'verified_at', tax_info->>'verified_at',
        'verification_method', tax_info->>'verification_method',
        'has_resident_number', CASE 
            WHEN tax_info->>'resident_number_encrypted' IS NOT NULL 
            THEN true 
            ELSE false 
        END
    ) INTO result
    FROM user_profiles 
    WHERE user_id = p_user_id;
    
    RETURN COALESCE(result, '{"verified": false, "has_resident_number": false}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 권한 설정
GRANT SELECT ON user_verification_status TO authenticated;
GRANT EXECUTE ON FUNCTION check_user_verification_status(TEXT) TO authenticated;

-- 12. 정리 (만료된 인증 요청 삭제 함수)
CREATE OR REPLACE FUNCTION cleanup_expired_verification_requests()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM verification_requests 
    WHERE expires_at < NOW() 
    AND status = 'pending';
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- 13. 주기적 정리를 위한 스케줄 (선택사항 - pg_cron 확장 필요)
-- SELECT cron.schedule('cleanup-expired-verifications', '0 2 * * *', 'SELECT cleanup_expired_verification_requests();');

COMMENT ON TABLE verification_requests IS '나이스평가정보 실명인증 요청 관리';
COMMENT ON COLUMN verification_requests.verification_id IS '나이스평가정보에서 발급받은 인증 ID';
COMMENT ON COLUMN verification_requests.user_info IS '인증 완료 후 받은 사용자 정보 (주민등록번호 포함)';
COMMENT ON COLUMN user_profiles.tax_info IS '세금 관련 정보 (주민등록번호, 인증 정보 등)';
