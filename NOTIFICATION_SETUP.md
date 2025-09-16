# 알림 서비스 설정 가이드

## 📱 네이버 클라우드 플랫폼 SMS 서비스

### 1. 네이버 클라우드 플랫폼 가입 및 서비스 신청
1. [네이버 클라우드 플랫폼](https://www.ncloud.com/) 가입
2. SENS (Simple & Easy Notification Service) 서비스 신청
3. SMS 서비스 활성화

### 2. API 키 발급
1. 네이버 클라우드 플랫폼 콘솔 → 마이페이지 → 인증키 관리
2. Access Key ID와 Secret Key 발급

### 3. SMS 서비스 ID 확인
1. SENS 콘솔 → SMS → 서비스 관리
2. 서비스 ID 확인

### 4. 발신번호 등록
1. SENS 콘솔 → SMS → 발신번호 관리
2. 사업자등록증 등 필요 서류 제출
3. 발신번호 승인 후 사용 가능

### 5. 환경변수 설정
```bash
# backend/.env 파일에 추가
NAVER_ACCESS_KEY=your_access_key_here
NAVER_SECRET_KEY=your_secret_key_here
NAVER_SERVICE_ID=your_service_id_here
NAVER_SMS_FROM_NUMBER=01012345678
```

## 📱 카카오 알림톡 서비스 (선택사항)

### 1. 카카오 개발자 계정 준비
1. [카카오 개발자 사이트](https://developers.kakao.com/) 가입
2. 애플리케이션 생성
3. 플랫폼 설정 (웹/앱)

### 2. 알림톡 서비스 신청
1. 카카오 비즈니스 계정 필요
2. 알림톡 서비스 신청
3. 템플릿 승인 받기

### 3. API 키 발급
1. 카카오 개발자 콘솔 → 앱 설정 → 앱 키
2. REST API 키 확인

### 4. 템플릿 코드 확인
1. 카카오 비즈니스 → 알림톡 → 템플릿 관리
2. 승인된 템플릿의 템플릿 코드 확인

### 5. 환경변수 설정
```bash
# backend/.env 파일에 추가
KAKAO_APP_KEY=your_rest_api_key_here
KAKAO_TEMPLATE_CODE=your_template_code_here
KAKAO_SENDER_KEY=your_sender_key_here
```

## 📧 Gmail 이메일 서비스

### 1. Gmail 계정 준비
- Gmail 계정이 필요합니다
- 2단계 인증이 활성화되어 있어야 합니다

### 2. 앱 비밀번호 생성
1. Google 계정 설정 → 보안
2. 2단계 인증 활성화
3. 앱 비밀번호 생성
4. "메일" 선택 후 비밀번호 생성

### 3. 환경변수 설정
```bash
# backend/.env 파일에 추가
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here
```

## 🔧 전체 환경변수 설정

### backend/.env
```bash
# Supabase 설정 (필수)
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key

# 네이버 클라우드 플랫폼 SMS (선택사항)
NAVER_ACCESS_KEY=your_access_key_here
NAVER_SECRET_KEY=your_secret_key_here
NAVER_SERVICE_ID=your_service_id_here
NAVER_SMS_FROM_NUMBER=01012345678

# Gmail 이메일 (선택사항)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password_here

# 카카오 알림톡 (선택사항)
KAKAO_APP_KEY=your_rest_api_key_here
KAKAO_TEMPLATE_CODE=your_template_code_here
KAKAO_SENDER_KEY=your_sender_key_here

# 서버 설정
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

**⚠️ 중요**: 
- `backend/.env` 파일을 직접 생성해야 합니다
- Supabase 설정은 필수입니다 (SMS/이메일은 선택사항)
- 환경변수가 없어도 서버는 실행되지만 해당 기능은 비활성화됩니다

## 🚀 서비스 테스트

### 1. 서비스 상태 확인
```bash
curl http://localhost:3001/api/notification/status
```

### 2. 인증번호 발송 테스트
```bash
curl -X POST http://localhost:3001/api/notification/send-verification \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_id_here", "type": "phone"}'
```

### 3. 승인 알림 발송 테스트
```bash
curl -X POST http://localhost:3001/api/notification/send-approval \
  -H "Content-Type: application/json" \
  -d '{"userId": "user_id_here", "campaignName": "테스트 캠페인"}'
```

## 📋 API 엔드포인트

### 인증번호 발송
- **POST** `/api/notification/send-verification`
- **Body**: `{"userId": "string", "type": "phone|email"}`

### 승인 알림 발송
- **POST** `/api/notification/send-approval`
- **Body**: `{"userId": "string", "campaignName": "string"}`

### 거절 알림 발송
- **POST** `/api/notification/send-rejection`
- **Body**: `{"userId": "string", "campaignName": "string"}`

### 서비스 상태 확인
- **GET** `/api/notification/status`

## ⚠️ 주의사항

### SMS 서비스
- 발신번호는 사업자등록증 등록 후 사용 가능
- 월 무료 제공량 초과 시 과금 발생
- 스팸 방지를 위한 발송 제한 있음

### 이메일 서비스
- Gmail 앱 비밀번호는 계정 비밀번호와 다름
- 일일 발송 제한 있음 (Gmail 정책)
- 스팸 필터링에 주의

### 보안
- API 키는 절대 공개하지 마세요
- 환경변수 파일(.env)은 .gitignore에 포함
- 프로덕션에서는 HTTPS 사용 필수

## 🔍 문제 해결

### SMS 발송 실패
1. API 키 확인
2. 서비스 ID 확인
3. 발신번호 승인 상태 확인
4. 잔액 확인

### 이메일 발송 실패
1. Gmail 계정 2단계 인증 확인
2. 앱 비밀번호 재생성
3. Gmail 보안 설정 확인

### 일반적인 오류
- 환경변수 누락 확인
- 네트워크 연결 상태 확인
- 서비스 상태 API로 확인
