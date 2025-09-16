# 계좌인증 API 설정 가이드

## 1. 토스페이먼츠 API 설정

### 1.1 토스페이먼츠 개발자 계정 생성
1. [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) 접속
2. 회원가입 및 로그인
3. 새 애플리케이션 생성

### 1.2 API 키 발급
1. 개발자센터 → 애플리케이션 → API 키 관리
2. **시크릿 키**와 **클라이언트 키** 복사
3. 시크릿 키는 서버에서만 사용 (절대 노출 금지)

### 1.3 환경 변수 설정
`backend/.env` 파일에 다음 내용 추가:

```env
# 토스페이먼츠 API 설정
TOSS_PAYMENTS_BASE_URL=https://api.tosspayments.com
TOSS_PAYMENTS_SECRET_KEY=test_sk_your_secret_key_here
TOSS_PAYMENTS_CLIENT_KEY=test_ck_your_client_key_here
```

## 2. 계좌인증 방법

### 2.1 계좌 실명 확인 (즉시 인증)
- 은행 API를 통한 실시간 계좌 정보 확인
- 예금주명과 계좌번호 일치 여부 확인
- 즉시 인증 완료

### 2.2 1원 인증 (더 안전한 방법)
- 계좌로 1원 입금 후 인증 코드 확인
- 사용자가 직접 입금 확인 후 인증 완료
- 더 높은 보안성

## 3. API 엔드포인트

### 3.1 계좌 실명 확인
```
POST /api/account/verify
Content-Type: application/json

{
  "user_id": "user123",
  "bank_name": "국민은행",
  "account_number": "123456-78-901234",
  "account_holder": "홍길동"
}
```

### 3.2 1원 인증 요청
```
POST /api/account/verify-one-won
Content-Type: application/json

{
  "user_id": "user123",
  "bank_name": "국민은행",
  "account_number": "123456-78-901234",
  "account_holder": "홍길동"
}
```

### 3.3 1원 인증 확인
```
POST /api/account/confirm-one-won
Content-Type: application/json

{
  "verification_code": "123456"
}
```

### 3.4 계좌인증 상태 확인
```
GET /api/account/status/:user_id
```

## 4. 지원 은행

- 국민은행 (004)
- 신한은행 (088)
- 우리은행 (020)
- 하나은행 (081)
- 기업은행 (003)
- 농협은행 (011)
- 카카오뱅크 (090)
- 토스뱅크 (092)

## 5. 보안 고려사항

### 5.1 데이터 암호화
- 계좌번호는 마스킹 처리하여 저장
- 예금주명은 해시화하여 저장
- 민감한 정보는 암호화하여 DB 저장

### 5.2 API 보안
- 시크릿 키는 환경 변수로 관리
- HTTPS 통신 필수
- 요청 제한 (Rate Limiting) 적용

### 5.3 개인정보 보호
- 계좌 정보는 최소한으로 수집
- 인증 완료 후 불필요한 정보 삭제
- 개인정보 처리방침 준수

## 6. 테스트 방법

### 6.1 개발 환경 테스트
```bash
# 백엔드 서버 시작
cd backend
npm start

# API 테스트
curl -X POST http://localhost:3001/api/account/verify \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "bank_name": "국민은행",
    "account_number": "123456-78-901234",
    "account_holder": "홍길동"
  }'
```

### 6.2 프론트엔드 테스트
1. 내신청 페이지 접속
2. "계좌인증" 버튼 클릭
3. 계좌 정보 입력 후 인증 요청
4. 인증 결과 확인

## 7. 오류 처리

### 7.1 일반적인 오류
- `지원하지 않는 은행입니다`: 은행명이 잘못됨
- `계좌 정보가 일치하지 않습니다`: 예금주명 또는 계좌번호 오류
- `인증 세션이 만료되었습니다`: 1원 인증 시 세션 만료

### 7.2 API 오류
- `401 Unauthorized`: API 키 오류
- `400 Bad Request`: 요청 데이터 오류
- `500 Internal Server Error`: 서버 내부 오류

## 8. 비용 정보

### 8.1 토스페이먼츠 수수료
- 계좌 실명 확인: 건당 10원
- 1원 인증: 건당 10원 + 1원 입금
- 월 최소 이용료: 10,000원

### 8.2 대안 서비스
- KG이니시스: 건당 5원
- 페이레터: 건당 8원
- 직접 은행 API: 무료 (복잡함)

## 9. 운영 환경 설정

### 9.1 프로덕션 환경
```env
TOSS_PAYMENTS_BASE_URL=https://api.tosspayments.com
TOSS_PAYMENTS_SECRET_KEY=live_sk_your_live_secret_key
TOSS_PAYMENTS_CLIENT_KEY=live_ck_your_live_client_key
```

### 9.2 모니터링
- 인증 성공/실패 로그 수집
- API 응답 시간 모니터링
- 오류율 추적

## 10. 추가 기능

### 10.1 계좌 정보 관리
- 인증된 계좌 정보 조회
- 계좌 정보 수정
- 계좌 인증 해제

### 10.2 포인트 출금 연동
- 인증된 계좌로만 출금 가능
- 출금 시 계좌 정보 자동 입력
- 출금 내역 관리
