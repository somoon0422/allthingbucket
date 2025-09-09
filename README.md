
# 올띵버킷 체험단 플랫폼

체험단 코드 기반 회원가입, 리뷰 인증, 포인트 지급 및 출금이 가능한 완전한 체험단 관리 플랫폼입니다.

## 🚀 주요 기능

### 👥 회원 관리
- **코드 기반 회원가입**: 체험단 코드 또는 회원 코드로 가입
- **회원 코드 시스템**: 관리자가 발급하는 회원 전용 코드
- **사용자 프로필**: 포인트, 체험 기록, 개인정보 관리

### 🎁 체험단 관리
- **체험단 생성/편집**: 관리자가 체험단을 생성하고 관리
- **신청 시스템**: 배송 정보 입력 및 신청 관리
- **신청 취소**: 승인 전 신청 취소 가능
- **참여자 관리**: 최대 참여자 수, 현재 참여자 수 추적

### 📸 리뷰 인증 시스템
- **실제 파일 업로드**: 모바일(카메라/갤러리), PC(파일 탐색기) 자동 감지
- **별점 및 텍스트 리뷰**: 5점 만점 별점과 상세 후기
- **관리자 승인**: 리뷰 승인 시 자동 포인트 적립
- **이미지 인증**: 여러 장의 인증 사진 업로드 가능

### 💰 포인트 시스템
- **자동 포인트 적립**: 리뷰 승인 시 자동으로 포인트 적립
- **포인트 출금**: 사용자가 출금 요청, 자동 세금 계산 (3.3%)
- **출금 관리**: 관리자 승인 후 실제 계좌 이체
- **포인트 내역**: 적립/출금 내역 상세 조회

### 🛠️ 관리자 백오피스
- **통합 대시보드**: 회원, 체험단, 포인트, 출금 통계
- **체험단 관리**: 생성, 편집, 활성화/비활성화
- **신청 관리**: 체험단 신청 승인/거절
- **리뷰 관리**: 리뷰 승인 시 자동 포인트 적립
- **출금 관리**: 출금 요청 승인/거절
- **회원 코드 발급**: 새로운 회원 코드 생성

## 🔧 환경 설정

### Google OAuth 설정 (실제 Google 인증)
1. **Google Cloud Console 설정**:
   - [Google Cloud Console](https://console.cloud.google.com/)에서 프로젝트 생성
   - OAuth 2.0 클라이언트 ID 생성 (웹 애플리케이션)
   - 승인된 리디렉션 URI: `http://localhost:5173/auth/google/callback`

2. **환경 변수 설정**:
   ```bash
   # .env 파일 생성
   VITE_GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
   ```

3. **OAuth 동의 화면 설정**:
   - 테스트 사용자에 로그인할 Google 계정 이메일 추가
   - 프로덕션에서는 "게시됨" 상태로 변경

### Lumi SDK 설정 (기존)
```bash
VITE_LUMI_API_KEY=your-lumi-api-key-here
VITE_LUMI_PROJECT_ID=your-lumi-project-id-here
```

## 🔗 접근 방법

### 사용자 페이지
- **메인 URL**: `http://localhost:5173/`
- **페이지 구성**:
  - 홈: 대시보드 및 최근 활동
  - 체험단: 체험단 목록 및 신청
  - 포인트: 포인트 내역 및 출금
  - 프로필: 개인정보 관리

### 관리자 페이지
- **관리자 로그인 URL**: `http://localhost:5173/admin/login`
- **테스트 계정**: 
  - ID: `admin`
  - 비밀번호: `admin123`
- **관리자 대시보드**: `http://localhost:5173/admin/dashboard`

## 📋 사용 가이드

### 1. 회원가입 및 로그인
1. 메인 페이지에서 "회원가입" 클릭
2. 체험단 코드 또는 회원 코드 입력
3. Lumi 플랫폼 인증으로 로그인

### 2. 체험단 신청
1. 체험단 페이지에서 원하는 체험단 선택
2. "신청하기" 버튼 클릭
3. 배송 정보 및 연락처 입력
4. 신청 완료 (관리자 승인 대기)

### 3. 리뷰 인증
1. 승인된 체험단에서 "리뷰 인증" 버튼 클릭
2. 별점 평가 및 후기 작성
3. 인증 사진 업로드 (모바일: 카메라/갤러리, PC: 파일 선택)
4. 리뷰 제출 (관리자 승인 후 포인트 적립)

### 4. 포인트 출금
1. 포인트 페이지에서 "출금 신청" 클릭
2. 출금 금액 및 계좌 정보 입력
3. 자동 세금 계산 (3.3%) 확인
4. 출금 요청 완료 (관리자 승인 대기)

### 5. 관리자 기능
1. 관리자 로그인 후 대시보드 접근
2. **체험단 관리**: 새 체험단 생성/편집
3. **신청 관리**: 체험단 신청 승인/거절
4. **리뷰 관리**: 리뷰 승인 시 자동 포인트 적립
5. **출금 관리**: 출금 요청 승인/거절
6. **회원 코드 발급**: "회원 코드 발급" 버튼으로 새 코드 생성

## 🔧 기술 스택

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Lumi SDK, MongoDB
- **인증**: Lumi 플랫폼 인증
- **파일 업로드**: 실제 파일 업로드 (Base64 인코딩)
- **상태 관리**: React Hooks

## 📊 데이터베이스 구조

### 주요 엔티티
- `experience_codes`: 체험단 정보
- `user_codes`: 회원 코드
- `user_applications`: 체험단 신청
- `user_experiences`: 사용자 체험 기록
- `user_points`: 포인트 내역
- `withdrawal_requests`: 출금 요청
- `admin_users`: 관리자 계정

## 🎯 주요 특징

### 실제 파일 업로드
- 모바일 디바이스: 카메라 촬영 또는 갤러리 선택
- PC: 파일 탐색기를 통한 이미지 선택
- 파일 크기 제한: 5MB
- 지원 형식: 모든 이미지 형식

### 자동화된 포인트 시스템
- 리뷰 승인 시 자동 포인트 적립
- 사용자 프로필 자동 업데이트
- 포인트 출금 시 자동 세금 계산 (3.3%)
- 실시간 포인트 잔액 관리

### 완전한 관리자 백오피스
- 실시간 통계 대시보드
- 체험단 생성/편집 인터페이스
- 신청 및 리뷰 승인 시스템
- 출금 관리 및 승인 프로세스

## 🚀 시작하기

1. 프로젝트 실행:
```bash
npm run dev
```

2. 관리자 페이지 접근:
- URL: `http://localhost:5173/admin/login`
- 계정: `admin` / `admin123`

3. 회원 코드 발급:
- 관리자 대시보드 → "회원 코드 발급" 버튼
- 자동으로 새로운 회원 코드 생성

4. 체험단 생성:
- 관리자 대시보드 → "체험단 관리" → "새 체험단 생성"

## 📱 SMS 발송 설정

SMS 발송 기능을 사용하려면 다음 환경변수를 설정해야 합니다:

### 네이버 클라우드 SMS API 설정:
```bash
# .env 파일에 추가
VITE_SMS_ACCESS_KEY=your_sms_access_key_here
VITE_SMS_SECRET_KEY=your_sms_secret_key_here
VITE_SMS_SERVICE_ID=your_sms_service_id_here
VITE_SMS_FROM_NUMBER=01012345678
```

### 설정 방법:
1. **네이버 클라우드 플랫폼** 가입
2. **SENS (Simple & Easy Notification Service)** 서비스 신청
3. **SMS 서비스** 활성화
4. **API 키** 발급 및 환경변수 설정

### 현재 상태:
- **SMS API 설정 없음**: 시뮬레이션 모드로 동작 (실제 발송 없음)
- **SMS API 설정 완료**: 백엔드 API를 통한 실제 SMS 발송
- **SMS 실패 시**: 카카오톡으로 대체 발송 시도

### ⚠️ 중요: 실제 SMS 발송을 위해서는:
1. **백엔드 API 구현** 필요 (보안상 프론트엔드에서 직접 SMS API 호출 불가)
2. **네이버 클라우드 SMS API** 서명 생성 로직 구현
3. **발신번호 사전 등록** 및 인증 완료

## 🚀 백엔드 서버 실행 방법:

### 1. 백엔드 의존성 설치:
```bash
cd backend
npm install
```

### 2. 백엔드 환경변수 설정:
```bash
# backend/.env 파일 생성
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# 네이버 클라우드 SMS API 설정
SMS_ACCESS_KEY=your_sms_access_key_here
SMS_SECRET_KEY=your_sms_secret_key_here
SMS_SERVICE_ID=your_sms_service_id_here
SMS_FROM_NUMBER=01012345678

# 네이버 클라우드 SENS 알림톡 API 설정 (SMS와 동일한 키 사용)
KAKAO_PLUS_FRIEND_ID=your_plus_friend_id_here
KAKAO_TEMPLATE_CODE=your_template_code_here
```

### 3. 백엔드 서버 실행:
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start
```

### 4. API 엔드포인트:
- **통합 메시지 발송**: `POST http://localhost:3001/api/sms/send`
- **SMS 전용 발송**: `POST http://localhost:3001/api/sms/sms/send`
- **카카오 알림톡 발송**: `POST http://localhost:3001/api/sms/kakao/send`
- **서비스 상태 확인**: `GET http://localhost:3001/api/sms/status`
- **헬스 체크**: `GET http://localhost:3001/health`

### 5. 메시지 발송 타입:
- **SMS**: `type: 'sms'`
- **카카오 알림톡**: `type: 'kakao_alimtalk'`
- **둘 다**: `type: 'both'`

## 📧 이메일 발송 설정

### 프론트엔드 환경변수 설정:
```bash
# .env 파일 생성
VITE_EMAIL_FROM_NAME=올띵버킷 체험단
VITE_COMPANY_NAME=올띵버킷
VITE_SUPPORT_EMAIL=support@allthingbucket.com
VITE_SUPPORT_PHONE=02-1234-5678
VITE_WEBSITE_URL=https://allthingbucket.com
```

### 비즈니스 이메일 설정:
1. **고객센터 이메일 생성**: `support@allthingbucket.com` (또는 원하는 도메인)
2. **환경변수 업데이트**: `VITE_SUPPORT_EMAIL`에 실제 이메일 주소 입력
3. **전화번호 설정**: `VITE_SUPPORT_PHONE`에 실제 고객센터 번호 입력

### 이메일 템플릿 특징:
- ✅ **고객센터 연락처** 자동 포함
- ✅ **회사명** 환경변수로 설정 가능
- ✅ **발신자명** 환경변수로 설정 가능
- ✅ **웹사이트 링크** 자동 포함
- ✅ **전화번호** 클릭 가능한 링크

## 📝 참고사항

- 실제 서비스에서는 파일 업로드를 별도 파일 서버로 처리 필요
- 포인트 출금 시 실제 계좌 이체 API 연동 필요
- 이메일 발송은 Lumi SDK를 사용하며, 웹사이트에 로그인한 사용자에게만 발송 가능
- 세금 계산은 현재 3.3% 고정 (실제 서비스에서는 정확한 세율 적용)
- 모든 기능은 Lumi SDK를 통해 MongoDB와 연동
- SMS 발송은 네이버 클라우드 SMS API 또는 다른 SMS 서비스 연동 필요
#   a l l t h i n g b u c k e t  
 #   a l l t h i n g b u c k e t  
 