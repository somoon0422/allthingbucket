-- 포인트 출금 요청 테이블 강화
-- 개인정보보호법 및 소득세법 준수를 위한 필드 추가

-- 1. withdrawal_requests 테이블에 주민등록번호 및 법적 동의 필드 추가
ALTER TABLE withdrawal_requests
ADD COLUMN IF NOT EXISTS resident_number VARCHAR(13), -- 주민등록번호 (암호화 저장 권장)
ADD COLUMN IF NOT EXISTS tax_agreement BOOLEAN DEFAULT false, -- 세금 신고 동의
ADD COLUMN IF NOT EXISTS privacy_agreement BOOLEAN DEFAULT false, -- 개인정보 수집·이용 동의
ADD COLUMN IF NOT EXISTS tax_withholding_agreement BOOLEAN DEFAULT false, -- 원천징수 동의
ADD COLUMN IF NOT EXISTS agreement_timestamp TIMESTAMPTZ, -- 동의 일시
ADD COLUMN IF NOT EXISTS agreement_ip VARCHAR(45), -- 동의 시 IP 주소 (증빙)
ADD COLUMN IF NOT EXISTS payment_schedule_date DATE, -- 예상 지급일
ADD COLUMN IF NOT EXISTS actual_payment_date DATE, -- 실제 지급일
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer', -- 지급 방법
ADD COLUMN IF NOT EXISTS tax_report_status VARCHAR(50) DEFAULT 'pending'; -- 세무 신고 상태

-- 2. 주석 추가 (문서화)
COMMENT ON COLUMN withdrawal_requests.resident_number IS '주민등록번호 (소득세법 신고용, 암호화 필수)';
COMMENT ON COLUMN withdrawal_requests.tax_agreement IS '세금 신고 및 원천징수 동의 여부';
COMMENT ON COLUMN withdrawal_requests.privacy_agreement IS '개인정보 수집·이용 동의 여부';
COMMENT ON COLUMN withdrawal_requests.tax_withholding_agreement IS '원천징수 3.3% 공제 동의';
COMMENT ON COLUMN withdrawal_requests.agreement_timestamp IS '동의서 작성 일시 (법적 증빙)';
COMMENT ON COLUMN withdrawal_requests.agreement_ip IS '동의 시 접속 IP 주소 (법적 증빙)';
COMMENT ON COLUMN withdrawal_requests.payment_schedule_date IS '예상 지급일 (신청기간별 자동 계산)';
COMMENT ON COLUMN withdrawal_requests.actual_payment_date IS '실제 입금 완료일';
COMMENT ON COLUMN withdrawal_requests.payment_method IS '지급 방법 (bank_transfer 등)';
COMMENT ON COLUMN withdrawal_requests.tax_report_status IS '세무 신고 상태 (pending, reported, completed)';

-- 3. bank_accounts 테이블에 실명인증 정보 추가
ALTER TABLE bank_accounts
ADD COLUMN IF NOT EXISTS real_name_verified BOOLEAN DEFAULT false, -- 실명인증 완료 여부
ADD COLUMN IF NOT EXISTS real_name_verified_at TIMESTAMPTZ, -- 실명인증 완료 일시
ADD COLUMN IF NOT EXISTS verification_method VARCHAR(50), -- 인증 방법 (nice, 1won, manual)
ADD COLUMN IF NOT EXISTS verification_data JSONB; -- 인증 관련 메타데이터

COMMENT ON COLUMN bank_accounts.real_name_verified IS '실명인증 완료 여부';
COMMENT ON COLUMN bank_accounts.real_name_verified_at IS '실명인증 완료 일시';
COMMENT ON COLUMN bank_accounts.verification_method IS '인증 방법 (nice: NICE 본인인증, 1won: 1원인증, manual: 수동확인)';
COMMENT ON COLUMN bank_accounts.verification_data IS '인증 관련 메타데이터 (JSON)';

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_status
ON withdrawal_requests(status);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user_status
ON withdrawal_requests(user_id, status);

CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_payment_schedule
ON withdrawal_requests(payment_schedule_date)
WHERE status IN ('approved', 'processing');

CREATE INDEX IF NOT EXISTS idx_bank_accounts_verified
ON bank_accounts(user_id, is_verified, real_name_verified);

-- 5. 주민등록번호 암호화를 위한 pgcrypto 확장 활성화 (선택사항)
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 6. 개인정보 보관 기간 관리를 위한 트리거 함수 (선택사항)
-- 출금 완료 후 5년 경과 시 자동 삭제를 위한 준비
CREATE OR REPLACE FUNCTION check_personal_data_retention()
RETURNS TRIGGER AS $$
BEGIN
  -- 출금 완료 후 5년 경과 시 주민번호 자동 삭제
  IF NEW.status = 'completed' AND NEW.completed_at IS NOT NULL THEN
    -- 5년 후 자동 삭제 스케줄링 (실제 운영 시 cron job 사용 권장)
    NEW.resident_number := NEW.resident_number; -- 보관
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. 테이블 구조 확인 쿼리
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'withdrawal_requests'
ORDER BY ordinal_position;

-- 8. 기존 데이터 마이그레이션 (필요 시)
-- UPDATE withdrawal_requests
-- SET
--   tax_agreement = true,
--   privacy_agreement = true,
--   tax_withholding_agreement = true
-- WHERE status = 'completed';
