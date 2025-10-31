-- 캠페인 테이블에 승인 안내 메시지 필드 추가
-- 실행 날짜: 2025-10-29

-- 1. 승인 안내 메시지 컬럼 추가
ALTER TABLE campaigns
ADD COLUMN IF NOT EXISTS approval_email_subject TEXT,
ADD COLUMN IF NOT EXISTS approval_email_content TEXT,
ADD COLUMN IF NOT EXISTS approval_sms_content TEXT;

-- 2. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'campaigns'
AND column_name IN (
  'approval_email_subject',
  'approval_email_content',
  'approval_sms_content'
)
ORDER BY ordinal_position;

-- 3. 코멘트 추가 (선택사항)
COMMENT ON COLUMN campaigns.approval_email_subject IS '체험단 선정 시 발송되는 승인 이메일의 제목';
COMMENT ON COLUMN campaigns.approval_email_content IS '체험단 선정 시 발송되는 승인 이메일의 내용';
COMMENT ON COLUMN campaigns.approval_sms_content IS '체험단 선정 시 발송되는 승인 SMS의 내용';
