# 토스페이먼츠 MCP 서버 설정 가이드

## 1. MCP 서버 개요

MCP(Model Context Protocol) 서버를 통해 토스페이먼츠 API와 안전하게 연동하여 포인트 출금 기능을 구현합니다.

## 2. 환경 변수 설정

### 2.1 백엔드 환경 변수
`backend/.env` 파일에 다음 내용 추가:

```env
# 토스페이먼츠 MCP 서버 설정
TOSS_PAYMENTS_MCP_SERVER_URL=http://localhost:3002
TOSS_PAYMENTS_SECRET_KEY=test_sk_your_secret_key_here
TOSS_PAYMENTS_CLIENT_KEY=test_ck_your_client_key_here

# 기존 Supabase 설정
SUPABASE_URL=your_supabase_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

## 3. MCP 서버 API 엔드포인트

### 3.1 출금 처리
```
POST /api/withdrawal/process
Content-Type: application/json
Authorization: Bearer {secret_key}
X-MCP-Service: toss-payments

{
  "bankCode": "004",
  "accountNumber": "123456789012",
  "accountHolder": "홍길동",
  "amount": 10000,
  "description": "포인트 출금",
  "transferType": "TRANSFER"
}
```

**응답:**
```json
{
  "success": true,
  "transferId": "transfer_123456",
  "status": "completed",
  "amount": 10000,
  "fee": 100,
  "netAmount": 9900,
  "mcpTransactionId": "mcp_789012"
}
```

### 3.2 출금 상태 확인
```
GET /api/withdrawal/status/{transferId}
Authorization: Bearer {secret_key}
X-MCP-Service: toss-payments
```

**응답:**
```json
{
  "success": true,
  "status": "completed",
  "transferId": "transfer_123456",
  "amount": 10000,
  "fee": 100,
  "netAmount": 9900,
  "completedAt": "2024-01-15T10:30:00Z",
  "mcpTransactionId": "mcp_789012"
}
```

### 3.3 세금 계산
```
POST /api/tax/calculate
Content-Type: application/json
Authorization: Bearer {secret_key}
X-MCP-Service: toss-payments

{
  "amount": 10000,
  "taxType": "INCOME_TAX",
  "taxRate": 0.033
}
```

**응답:**
```json
{
  "success": true,
  "originalAmount": 10000,
  "taxRate": 0.033,
  "taxAmount": 330,
  "finalAmount": 9670,
  "taxBreakdown": {
    "incomeTax": 330,
    "localTax": 0
  }
}
```

### 3.4 출금 가능 여부 확인
```
POST /api/withdrawal/check
Content-Type: application/json
Authorization: Bearer {secret_key}
X-MCP-Service: toss-payments

{
  "amount": 10000,
  "availableBalance": 15000,
  "includeTax": true,
  "includeFees": true
}
```

**응답:**
```json
{
  "success": true,
  "canWithdraw": true,
  "requiredAmount": 10430,
  "availableBalance": 15000,
  "shortfall": 0,
  "breakdown": {
    "withdrawalAmount": 10000,
    "transferFee": 100,
    "taxAmount": 330,
    "totalRequired": 10430
  }
}
```

## 4. 세금 처리 상세

### 4.1 소득세 원천징수 (3.3%)
- **기준**: 출금 금액의 3.3%
- **처리**: 자동 차감 후 실지급
- **신고**: 연간 300만원 이상 시 원천징수 신고 필요

### 4.2 세금 계산 예시
```
출금 요청: 10,000원
- 소득세 (3.3%): 330원
- 실지급액: 9,670원
```

### 4.3 세무 신고 의무
- **연간 300만원 미만**: 신고 불필요
- **연간 300만원 이상**: 원천징수 신고 필요
- **사업자 등록 시**: 부가세 신고 필요

## 5. 출금 프로세스

### 5.1 사용자 출금 요청
1. 사용자가 포인트 페이지에서 출금 요청
2. 계좌인증 확인
3. 출금 가능 여부 검증
4. 세금 및 수수료 계산

### 5.2 관리자 승인
1. 관리자가 출금 요청 승인
2. MCP 서버를 통한 실제 출금 처리
3. 포인트 차감 및 히스토리 기록

### 5.3 출금 완료
1. 토스페이먼츠를 통한 계좌 이체
2. 출금 상태 업데이트
3. 사용자에게 완료 알림

## 6. 보안 고려사항

### 6.1 API 보안
- Bearer 토큰 인증
- MCP 서비스 헤더 검증
- 요청 제한 (Rate Limiting)

### 6.2 데이터 보안
- 계좌번호 마스킹 처리
- 개인정보 암호화 저장
- 감사 로그 기록

### 6.3 금융 보안
- 이중 인증 (계좌인증 + 관리자 승인)
- 출금 한도 설정
- 의심 거래 모니터링

## 7. 오류 처리

### 7.1 MCP 서버 오류
- 서버 연결 실패 시 로컬 계산으로 대체
- 타임아웃 설정 (30초)
- 재시도 로직 구현

### 7.2 토스페이먼츠 오류
- API 키 오류: 401 Unauthorized
- 계좌 정보 오류: 400 Bad Request
- 잔액 부족: 402 Payment Required

## 8. 모니터링 및 로깅

### 8.1 로그 수집
- 출금 요청/승인/완료 로그
- 오류 및 예외 로그
- 성능 메트릭 수집

### 8.2 알림 설정
- 출금 완료 시 사용자 알림
- 오류 발생 시 관리자 알림
- 일일 출금 현황 리포트

## 9. 테스트 방법

### 9.1 개발 환경 테스트
```bash
# MCP 서버 시작
cd mcp-server
npm start

# 백엔드 서버 시작
cd backend
npm start

# 출금 테스트
curl -X POST http://localhost:3001/api/withdrawal/request \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "amount": 10000,
    "bank_name": "국민은행",
    "account_number": "123456-78-901234",
    "account_holder": "홍길동"
  }'
```

### 9.2 프론트엔드 테스트
1. 포인트 페이지 접속
2. 출금 버튼 클릭
3. 계좌 정보 입력
4. 출금 요청 제출
5. 관리자 승인 대기

## 10. 운영 환경 설정

### 10.1 프로덕션 환경
```env
TOSS_PAYMENTS_MCP_SERVER_URL=https://mcp-server.yourdomain.com
TOSS_PAYMENTS_SECRET_KEY=live_sk_your_live_secret_key
TOSS_PAYMENTS_CLIENT_KEY=live_ck_your_live_client_key
```

### 10.2 모니터링 설정
- MCP 서버 상태 모니터링
- 출금 성공률 추적
- 평균 처리 시간 측정

## 11. 비용 정보

### 11.1 토스페이먼츠 수수료
- 계좌 이체: 건당 100원
- API 호출: 월 10,000원 (기본료)

### 11.2 MCP 서버 비용
- 서버 운영비: 월 50,000원
- 데이터베이스: 월 30,000원

## 12. 추가 기능

### 12.1 자동 출금
- 정기 출금 설정
- 출금 스케줄링
- 자동 승인 조건 설정

### 12.2 출금 내역 관리
- 출금 내역 조회
- 출금 영수증 발급
- 세금 계산서 발급
