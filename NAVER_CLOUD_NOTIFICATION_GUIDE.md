# 네이버 클라우드 알림 서비스 가이드

## 📧 이메일 발송 (Cloud Outbound Mailer)

### **특징:**
- 구글 로그인 사용자에게 이메일 발송 가능
- 이메일 주소만 있으면 발송 가능
- HTML 및 텍스트 형식 지원

### **필요한 설정:**
1. **네이버 클라우드 콘솔**에서 Cloud Outbound Mailer 서비스 활성화
2. **발신자 이메일 주소** 등록 및 인증
3. **환경 변수** 설정:
   ```bash
   VITE_SMS_ACCESS_KEY=your_access_key
   VITE_SMS_SECRET_KEY=your_secret_key
   VITE_SUPPORT_EMAIL=your_verified_email@domain.com
   ```

---

## 📱 SMS 발송 (SENS)

### **특징:**
- 사용자 휴대폰 번호만 있으면 발송 가능
- 구글 로그인과 무관하게 발송 가능
- 발신번호 사전 등록 필요

### **필요한 설정:**
1. **네이버 클라우드 콘솔**에서 SENS 서비스 활성화
2. **발신번호 등록** 및 승인 (010-7290-7620)
3. **환경 변수** 설정:
   ```bash
   VITE_SMS_ACCESS_KEY=your_access_key
   VITE_SMS_SECRET_KEY=your_secret_key
   VITE_SMS_SERVICE_ID=your_sms_service_id
   VITE_SMS_FROM_NUMBER=01072907620
   ```

### **사용자 인증:**
- **구글 로그인 사용자**: 휴대폰 번호만 있으면 SMS 발송 가능
- **카카오 로그인 사용자**: 휴대폰 번호만 있으면 SMS 발송 가능
- **일반 회원가입 사용자**: 휴대폰 번호만 있으면 SMS 발송 가능

---

## 💬 카카오 알림톡 발송 (SENS)

### **특징:**
- 카카오톡 계정이 있는 사용자에게만 발송 가능
- 구글 로그인 사용자도 카카오톡 계정이 있으면 발송 가능
- 템플릿 사전 등록 필요

### **필요한 설정:**
1. **네이버 클라우드 콘솔**에서 SENS 서비스 활성화
2. **카카오 비즈니스 채널** 등록 및 승인
3. **알림톡 템플릿** 등록 및 승인
4. **환경 변수** 설정:
   ```bash
   VITE_SMS_ACCESS_KEY=your_access_key
   VITE_SMS_SECRET_KEY=your_secret_key
   VITE_NCP_ALIMTALK_SERVICE_ID=your_alimtalk_service_id
   VITE_COMPANY_NAME=올띵버킷
   ```

### **사용자 인증:**
- **카카오 로그인 사용자**: 카카오톡 계정으로 알림톡 발송 가능
- **구글 로그인 사용자**: 카카오톡 계정이 있으면 알림톡 발송 가능
- **일반 회원가입 사용자**: 카카오톡 계정이 있으면 알림톡 발송 가능

---

## 🔧 구현 방법

### **1. 사용자별 발송 가능 여부 확인:**

```typescript
// 사용자 정보에서 발송 가능한 채널 확인
const getAvailableChannels = (user) => {
  const channels = [];
  
  // 이메일 - 항상 가능
  if (user.email) {
    channels.push('email');
  }
  
  // SMS - 휴대폰 번호만 있으면 가능
  if (user.phone) {
    channels.push('sms');
  }
  
  // 알림톡 - 카카오톡 계정이 있으면 가능
  if (user.kakaoId || user.hasKakaoAccount) {
    channels.push('alimtalk');
  }
  
  return channels;
};
```

### **2. 발송 전 확인:**

```typescript
// 발송 가능한 채널만 선택하여 발송
const availableChannels = getAvailableChannels(user);
const channelsToSend = selectedChannels.filter(channel => 
  availableChannels.includes(channel)
);

if (channelsToSend.length === 0) {
  toast.error('발송 가능한 알림 채널이 없습니다');
  return;
}
```

---

## 📋 체크리스트

### **네이버 클라우드 콘솔 설정:**
- [ ] Cloud Outbound Mailer 서비스 활성화
- [ ] SENS 서비스 활성화
- [ ] 발신자 이메일 주소 등록 및 인증
- [ ] 발신번호 등록 및 승인
- [ ] 카카오 비즈니스 채널 등록
- [ ] 알림톡 템플릿 등록 및 승인

### **Vercel 환경 변수 설정:**
- [ ] VITE_SMS_ACCESS_KEY
- [ ] VITE_SMS_SECRET_KEY
- [ ] VITE_SMS_SERVICE_ID
- [ ] VITE_SMS_FROM_NUMBER
- [ ] VITE_NCP_ALIMTALK_SERVICE_ID
- [ ] VITE_SUPPORT_EMAIL
- [ ] VITE_COMPANY_NAME

### **코드 구현:**
- [ ] API 엔드포인트 수정
- [ ] 요청 데이터 구조 수정
- [ ] 사용자별 발송 가능 채널 확인 로직
- [ ] 에러 처리 및 로깅
