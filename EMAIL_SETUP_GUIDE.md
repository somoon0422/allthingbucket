# 이메일 발송 설정 가이드

## 1. Resend API 설정 (이메일 발송)

### 1.1 Resend 계정 생성
1. [Resend.com](https://resend.com)에 가입
2. 도메인을 추가하고 DNS 설정 완료
3. API 키 생성

### 1.2 Supabase 환경 변수 설정
Supabase 프로젝트의 Settings > Edge Functions > Environment Variables에서 다음 변수를 추가:

```
RESEND_API_KEY=re_xxxxxxxxxx
```

## 2. Twilio API 설정 (SMS 발송)

### 2.1 Twilio 계정 생성
1. [Twilio.com](https://twilio.com)에 가입
2. 전화번호 구매
3. Account SID와 Auth Token 확인

### 2.2 Supabase 환경 변수 설정
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxxxx
TWILIO_PHONE_NUMBER=+821012345678
```

## 3. Supabase Edge Functions 배포

### 3.1 Supabase CLI 설치
```bash
npm install -g supabase
```

### 3.2 프로젝트 로그인
```bash
supabase login
```

### 3.3 프로젝트 연결
```bash
supabase link --project-ref YOUR_PROJECT_REF
```

### 3.4 Edge Functions 배포
```bash
supabase functions deploy send-email
supabase functions deploy send-sms
```

## 4. 테스트

### 4.1 이메일 테스트
브라우저 콘솔에서:
```javascript
// 테스트 이메일 발송
fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: 'test@example.com',
    subject: '테스트 이메일',
    message: '이것은 테스트 이메일입니다.'
  })
})
```

### 4.2 SMS 테스트
```javascript
// 테스트 SMS 발송
fetch('https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_ANON_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    to: '+821012345678',
    message: '테스트 SMS입니다.'
  })
})
```

## 5. 비용 정보

### Resend (이메일)
- 무료: 월 3,000건
- 유료: $20/월부터

### Twilio (SMS)
- 한국 SMS: 약 $0.05/건
- 무료 크레딧: $15

## 6. 대안 서비스

### 이메일 대안
- SendGrid
- Mailgun
- Amazon SES

### SMS 대안
- AWS SNS
- Firebase Cloud Messaging
- 카카오 알림톡 API

## 7. 문제 해결

### 일반적인 오류
1. **CORS 오류**: Edge Function의 corsHeaders 확인
2. **인증 오류**: API 키가 올바른지 확인
3. **도메인 오류**: Resend에서 도메인 인증 완료 확인

### 로그 확인
Supabase Dashboard > Edge Functions > Logs에서 실시간 로그 확인 가능
