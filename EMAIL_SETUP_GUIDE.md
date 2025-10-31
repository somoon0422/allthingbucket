# 📧 이메일 발송 시스템 설정 가이드

## 🔧 1. Supabase Edge Function 배포

### **Edge Function 생성 및 배포**
```bash
# Supabase CLI 설치 (아직 안 했다면)
npm install -g supabase

# Supabase 프로젝트에 로그인
supabase login

# Edge Function 배포
supabase functions deploy send-email

# 환경 변수 설정 (선택사항)
supabase secrets set RESEND_API_KEY=your_resend_api_key
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key
```

## 📧 2. 이메일 서비스 선택 및 설정

### **옵션 1: Resend (추천) - 무료 3,000건/월**
```bash
# 1. https://resend.com 에서 계정 생성
# 2. API 키 발급
# 3. 도메인 인증 (allthingbucket.com)
# 4. Edge Function에서 Resend 사용
```

**장점:**
- 무료 3,000건/월
- 간단한 설정
- 좋은 전송률
- 한국어 지원

### **옵션 2: SendGrid - 무료 100건/일**
```bash
# 1. https://sendgrid.com 에서 계정 생성
# 2. API 키 발급
# 3. 도메인 인증
# 4. Edge Function에서 SendGrid 사용
```

**장점:**
- 무료 100건/일 (3,000건/월)
- 안정적인 서비스
- 상세한 분석

### **옵션 3: AWS SES - 매우 저렴**
```bash
# 1. AWS 계정 생성
# 2. SES 서비스 활성화
# 3. 도메인 인증
# 4. Edge Function에서 SES 사용
```

**장점:**
- 매우 저렴 (건당 $0.10/1,000건)
- AWS 인프라 활용
- 높은 전송률

## 🚀 3. 실제 구현 단계

### **Step 1: Edge Function 수정**
`supabase/functions/send-email/index.ts`에서 선택한 서비스의 코드 주석 해제:

```typescript
// Resend 사용 예시
const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
const result = await resend.emails.send({
  from: 'noreply@allthingbucket.com',
  to: [to],
  subject: subject,
  html: html,
  text: text,
})
```

### **Step 2: 환경 변수 설정**
```bash
# Resend API 키 설정
supabase secrets set RESEND_API_KEY=re_xxxxxxxxx

# 또는 SendGrid API 키 설정
supabase secrets set SENDGRID_API_KEY=SG.xxxxxxxxx
```

### **Step 3: 도메인 인증**
- **Resend**: 도메인 DNS 설정으로 인증
- **SendGrid**: 도메인 인증 및 SPF/DKIM 설정
- **AWS SES**: 도메인 인증 및 MX 레코드 설정

### **Step 4: Edge Function 재배포**
```bash
supabase functions deploy send-email
```

## 🧪 4. 테스트 방법

### **프론트엔드에서 테스트**
1. AdminDashboard → 설정 탭
2. 이메일 전송 활성화
3. 출금 승인 시 이메일 전송 확인

### **Edge Function 직접 테스트**
```bash
# Edge Function 테스트
curl -X POST 'https://your-project.supabase.co/functions/v1/send-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "to": "test@example.com",
    "toName": "테스트 사용자",
    "subject": "테스트 이메일",
    "html": "<h1>테스트</h1>",
    "text": "테스트"
  }'
```

## 📊 5. 모니터링 및 관리

### **전송 현황 확인**
- Resend: 대시보드에서 전송 현황 확인
- SendGrid: Activity Feed에서 전송 로그 확인
- AWS SES: CloudWatch에서 메트릭 확인

### **에러 처리**
- Edge Function 로그 확인: `supabase functions logs send-email`
- 프론트엔드에서 에러 메시지 표시
- 재시도 로직 구현 (선택사항)

## 💰 6. 비용 비교

| 서비스 | 무료 한도 | 유료 가격 | 특징 |
|--------|-----------|-----------|------|
| **Resend** | 3,000건/월 | $20/월 (50,000건) | 추천 |
| **SendGrid** | 100건/일 | $19.95/월 (40,000건) | 안정적 |
| **AWS SES** | 없음 | $0.10/1,000건 | 매우 저렴 |

## 🔒 7. 보안 고려사항

### **API 키 보안**
- Supabase Secrets 사용 (환경 변수에 저장)
- API 키를 프론트엔드에 노출하지 않음
- 정기적인 API 키 로테이션

### **이메일 내용 검증**
- HTML 이스케이핑
- 링크 검증
- 스팸 필터 고려

## 📝 8. 다음 단계

1. **Edge Function 배포** ✅
2. **이메일 서비스 선택 및 설정** ⏳
3. **도메인 인증** ⏳
4. **실제 이메일 전송 테스트** ⏳
5. **모니터링 설정** ⏳

**현재 상태: Edge Function 코드 작성 완료, 실제 SMTP 서비스 설정 필요**
