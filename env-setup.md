# .env 파일 설정 가이드

## 1. 프론트엔드 .env 파일 생성

프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 복사하세요:

```bash
# 프론트엔드 환경 변수 설정

# 나이스평가정보 API 설정
VITE_NICE_API_URL=https://nice.checkplus.co.kr
VITE_NICE_CLIENT_ID=your_client_id_here
VITE_NICE_CLIENT_SECRET=your_client_secret_here
VITE_NICE_RETURN_URL=https://allthingbucket.com/verification/callback

# Supabase 설정
VITE_SUPABASE_URL=https://nwwwesxzlpotabtcvkgj.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE

# 이메일 설정
VITE_EMAIL_FROM_NAME=올띵버킷 체험단
VITE_COMPANY_NAME=올띵버킷
VITE_SUPPORT_EMAIL=support@allthingbucket.com
VITE_SUPPORT_PHONE=02-1234-5678
VITE_WEBSITE_URL=https://allthingbucket.com

# SMS 설정 (네이버 클라우드)
VITE_SMS_ACCESS_KEY=your_sms_access_key_here
VITE_SMS_SECRET_KEY=your_sms_secret_key_here
VITE_SMS_SERVICE_ID=your_sms_service_id_here
VITE_SMS_FROM_NUMBER=01012345678

# Google OAuth 설정
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# 개발 환경 설정
VITE_NODE_ENV=development

# API 서버 URL 설정
VITE_API_BASE_URL=http://localhost:3001
```

## 2. 백엔드 .env 파일 생성

`backend` 폴더에 `.env` 파일을 생성하고 다음 내용을 복사하세요:

```bash
# 백엔드 환경 변수 설정

# 나이스평가정보 API 설정
NICE_API_URL=https://nice.checkplus.co.kr
NICE_CLIENT_ID=your_client_id_here
NICE_CLIENT_SECRET=your_client_secret_here
NICE_RETURN_URL=https://allthingbucket.com/verification/callback

# 암호화 키 (주민등록번호 암호화용) - 32자리 랜덤 문자열
ENCRYPTION_KEY=MySecretKey12345678901234567890

# 서버 설정
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Supabase 설정
SUPABASE_URL=https://nwwwesxzlpotabtcvkgj.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE

# SMS 설정 (네이버 클라우드)
SMS_ACCESS_KEY=your_sms_access_key_here
SMS_SECRET_KEY=your_sms_secret_key_here
SMS_SERVICE_ID=your_sms_service_id_here
SMS_FROM_NUMBER=01012345678

# 카카오 알림톡 설정
KAKAO_PLUS_FRIEND_ID=your_plus_friend_id_here
KAKAO_TEMPLATE_CODE=your_template_code_here

# MongoDB 설정 (기존)
MONGODB_URI=your_mongodb_uri_here
```

## 3. 파일 생성 방법

### 터미널에서:
```bash
# 프로젝트 루트로 이동
cd "/Users/shkim/Library/Mobile Documents/com~apple~CloudDocs/Documents/GitHub/allthingbucket"

# 프론트엔드 .env 파일 생성
touch .env

# 백엔드 .env 파일 생성  
touch backend/.env
```

### VS Code에서:
1. 프로젝트 루트에서 우클릭 → "새 파일" → `.env`
2. `backend` 폴더에서 우클릭 → "새 파일" → `.env`

## 4. 중요 사항

- **`.env` 파일은 `.gitignore`에 포함되어 Git에 업로드되지 않습니다**
- **실제 값으로 교체하세요** (`your_client_id_here` → 실제 발급받은 ID)
- **프론트엔드는 `VITE_` 접두사가 필요합니다**
- **백엔드는 접두사 없이 사용합니다**

## 5. 나이스평가정보 설정 완료 후

나이스평가정보에서 발급받은 실제 값으로 다음 항목들을 교체하세요:

- `your_client_id_here` → 실제 Client ID
- `your_client_secret_here` → 실제 Client Secret
- `ENCRYPTION_KEY` → 32자리 랜덤 문자열로 변경
