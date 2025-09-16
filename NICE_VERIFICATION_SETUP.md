# 나이스평가정보 실명인증 연동 설정 가이드

## 개요
체험단 플랫폼에서 3.3% 원천징수 세금 공제를 위한 주민등록번호 수집을 위해 나이스평가정보 본인인증 서비스를 연동합니다.

## 1. 나이스평가정보 서비스 신청

### 1.1 서비스 신청
- **신청 사이트**: https://nice.checkplus.co.kr
- **서비스 유형**: 본인인증 서비스
- **신청 절차**:
  1. 회원가입 및 로그인
  2. 서비스 신청서 작성
  3. 사업자등록증, 통신판매업신고증 등 서류 제출
  4. 심사 및 승인 (약 1-2주 소요)

### 1.2 필요한 서류
- 사업자등록증
- 통신판매업신고증
- 개인정보처리방침
- 서비스 이용약관
- 웹사이트 URL

## 2. 환경 변수 설정

### 2.1 .env 파일에 추가
```bash
# 나이스평가정보 API 설정
NICE_API_URL=https://nice.checkplus.co.kr
NICE_CLIENT_ID=your_client_id_here
NICE_CLIENT_SECRET=your_client_secret_here
NICE_RETURN_URL=https://yourdomain.com/verification/callback

# 암호화 키 (주민등록번호 암호화용)
ENCRYPTION_KEY=your_32_character_encryption_key_here

# 프론트엔드 URL
FRONTEND_URL=https://yourdomain.com
```

### 2.2 보안 설정
- `ENCRYPTION_KEY`: 32자리 랜덤 문자열 생성
- `NICE_CLIENT_SECRET`: 나이스평가정보에서 발급받은 시크릿 키
- 모든 민감한 정보는 환경 변수로 관리

## 3. 데이터베이스 설정

### 3.1 테이블 생성
```sql
-- verification_tables_setup.sql 실행
psql -d your_database -f verification_tables_setup.sql
```

### 3.2 필요한 테이블
- `verification_requests`: 인증 요청 관리
- `user_profiles.tax_info`: 사용자 세금 정보 (JSONB)

## 4. API 엔드포인트

### 4.1 인증 요청
```http
POST /api/verification/request
Content-Type: application/json

{
  "userId": "user123",
  "userName": "홍길동",
  "userPhone": "01012345678",
  "userBirth": "19900101"
}
```

### 4.2 인증 결과 확인
```http
POST /api/verification/result
Content-Type: application/json

{
  "verificationId": "verification_id_from_nice",
  "authCode": "auth_code_from_nice"
}
```

### 4.3 인증 상태 확인
```http
GET /api/verification/status/:userId
```

### 4.4 출금 전 인증 검증
```http
POST /api/verification/check-withdrawal
Content-Type: application/json

{
  "userId": "user123"
}
```

## 5. 프론트엔드 구현

### 5.1 실명인증 컴포넌트
- `IdentityVerification.tsx`: 실명인증 모달 컴포넌트
- 나이스평가정보 팝업 창 연동
- 인증 상태 폴링

### 5.2 출금 요청 페이지
- `WithdrawalRequest.tsx`: 출금 요청 페이지
- 실명인증 상태 확인
- 인증 미완료 시 인증 요구

## 6. 보안 고려사항

### 6.1 주민등록번호 보호
- AES-256-GCM 암호화 사용
- 암호화 키는 환경 변수로 관리
- 데이터베이스에 평문 저장 금지

### 6.2 접근 제어
- RLS (Row Level Security) 적용
- 사용자는 자신의 정보만 접근 가능
- 관리자 권한 분리

### 6.3 로그 관리
- 인증 요청/결과 로그 기록
- 민감한 정보는 마스킹 처리
- 보안 이벤트 모니터링

## 7. 테스트

### 7.1 개발 환경 테스트
```bash
# 백엔드 서버 시작
cd backend
npm start

# 프론트엔드 개발 서버 시작
npm run dev
```

### 7.2 테스트 시나리오
1. 사용자 회원가입
2. 실명인증 요청
3. 나이스평가정보 팝업에서 인증
4. 인증 완료 확인
5. 출금 요청 테스트

## 8. 운영 고려사항

### 8.1 모니터링
- 인증 성공/실패율 모니터링
- API 응답 시간 모니터링
- 에러 로그 모니터링

### 8.2 백업 및 복구
- 암호화된 주민등록번호 백업
- 인증 요청 로그 백업
- 재해 복구 계획 수립

### 8.3 법적 준수
- 개인정보보호법 준수
- 정보통신망법 준수
- 세법 관련 규정 준수

## 9. 문제 해결

### 9.1 일반적인 문제
- **인증 팝업이 열리지 않음**: 팝업 차단 해제 필요
- **인증 시간 초과**: 5분 내에 인증 완료 필요
- **API 연결 실패**: 네트워크 및 인증서 확인

### 9.2 로그 확인
```bash
# 백엔드 로그 확인
tail -f backend/logs/app.log

# 데이터베이스 로그 확인
SELECT * FROM verification_requests ORDER BY created_at DESC LIMIT 10;
```

## 10. 연락처

### 10.1 나이스평가정보 고객센터
- **전화**: 1588-1515
- **이메일**: nice@nice.co.kr
- **사이트**: https://nice.checkplus.co.kr

### 10.2 기술 지원
- API 문서: https://nice.checkplus.co.kr/develop
- 개발자 포럼: https://nice.checkplus.co.kr/community
- 기술 문의: tech@nice.co.kr

---

**주의사항**: 
- 주민등록번호는 개인정보보호법에 따라 엄격하게 보호되어야 합니다.
- 암호화 키는 안전하게 보관하고 정기적으로 변경하세요.
- 모든 인증 관련 로그는 법적 요구사항에 따라 보관하세요.
