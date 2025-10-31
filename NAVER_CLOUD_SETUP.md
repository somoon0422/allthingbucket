# 네이버 클라우드 플랫폼 알림 서비스 설정 가이드

## 🔧 환경 변수 설정

`.env` 파일에 다음 환경 변수를 추가하세요:

```bash
# 네이버 클라우드 플랫폼 설정
VITE_NCP_ACCESS_KEY=your_access_key_here
VITE_NCP_SECRET_KEY=your_secret_key_here

# SMS 서비스 설정
VITE_NCP_SMS_SERVICE_ID=ncp:sms:kr:359104922813:allthingbucket

# 알림톡 서비스 설정
VITE_NCP_ALIMTALK_SERVICE_ID=ncp:kkobizmsg:kr:359104915298:allthingbucket
VITE_NCP_PLUS_FRIEND_ID=올띵버킷

# Gmail 설정 (기존)
GMAIL_USER=your_gmail@gmail.com
GMAIL_APP_PASSWORD=your_app_password
```

## 📋 해야 할 작업

### 1. 네이버 클라우드 플랫폼 인증키 발급
- [네이버 클라우드 플랫폼 포털](https://console.ncloud.com) 접속
- **마이페이지 > 계정관리 > 인증키 관리** 메뉴
- **신규 API 인증키 생성** 클릭
- Access Key ID와 Secret Key 복사

### 2. SMS 발신번호 설정
- 네이버 클라우드 플랫폼 콘솔에서 SMS 서비스 확인
- 발신번호 등록 및 승인 완료 (이미 완료됨)
- `src/services/naverCloudSmsService.ts`에서 `from` 번호 수정

### 3. 알림톡 템플릿 등록
- [네이버 클라우드 플랫폼 콘솔](https://console.ncloud.com) 접속
- **SENS > Biz Message** 메뉴
- **알림톡 템플릿** 등록
- 승인, 거절, 출금 템플릿 각각 등록
- 템플릿 코드를 서비스 코드에 반영

### 4. 서명 생성 라이브러리 설치
```bash
npm install crypto-js
```

### 5. 서명 생성 함수 구현
각 서비스 파일의 `makeSignature` 함수를 실제 구현으로 교체:

```typescript
import CryptoJS from 'crypto-js'

private makeSignature(method: string, url: string, timestamp: string): string {
  const space = ' '
  const newLine = '\n'
  
  const message = method + space + url + newLine + timestamp + newLine + this.accessKey
  
  const signature = CryptoJS.HmacSHA256(message, this.secretKey)
  return CryptoJS.enc.Base64.stringify(signature)
}
```

## 🚀 서비스별 설정

### 이메일 (Cloud Outbound Mailer)
- ✅ 서비스 활성화됨
- ✅ API 엔드포인트: `https://mail.apigw.ntruss.com/api/v1`
- ✅ 발신자 주소 설정 필요

### SMS (SENS SMS)
- ✅ 서비스 활성화됨
- ✅ 서비스 ID: `ncp:sms:kr:359104922813:allthingbucket`
- ✅ 발신번호 등록 완료
- 🔧 발신번호 코드에 반영 필요

### 알림톡 (SENS Alimtalk)
- ✅ 서비스 활성화됨
- ✅ 서비스 ID: `ncp:kkobizmsg:kr:359104915298:allthingbucket`
- ✅ 카카오톡 채널 등록 완료
- 🔧 템플릿 등록 및 코드 반영 필요

## 📱 테스트 방법

1. 환경 변수 설정
2. 서명 생성 함수 구현
3. 발신번호 및 템플릿 코드 설정
4. AdminDashboard에서 승인 테스트
5. 각 채널별 알림 수신 확인

## 🔍 문제 해결

### 서명 오류
- 타임스탬프가 정확한지 확인
- Access Key와 Secret Key가 올바른지 확인
- 서명 생성 알고리즘이 정확한지 확인

### 템플릿 오류
- 알림톡 템플릿이 승인되었는지 확인
- 템플릿 코드가 정확한지 확인
- 플러스친구 ID가 올바른지 확인

### 발신번호 오류
- SMS 발신번호가 승인되었는지 확인
- 발신번호 형식이 올바른지 확인 (010-1234-5678 → 01012345678)
