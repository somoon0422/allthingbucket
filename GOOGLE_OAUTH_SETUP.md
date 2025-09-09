# Google OAuth 설정 가이드

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택

### 1.2 OAuth 2.0 클라이언트 ID 생성
1. **API 및 서비스** > **사용자 인증 정보**로 이동
2. **사용자 인증 정보 만들기** > **OAuth 2.0 클라이언트 ID** 선택
3. 애플리케이션 유형: **웹 애플리케이션**
4. 이름: `올띵버킷 웹앱`
5. 승인된 자바스크립트 원본:
   - `http://localhost:5173` (개발용)
   - `https://yourdomain.com` (프로덕션용)
6. 승인된 리디렉션 URI:
   - `http://localhost:5173/auth/google/callback` (개발용)
   - `https://yourdomain.com/auth/google/callback` (프로덕션용)

**⚠️ 중요**: 리디렉션 URI는 정확히 일치해야 합니다. 끝에 슬래시(/)가 있거나 없거나도 중요합니다.

### 1.3 OAuth 동의 화면 설정 (중요!)
1. **OAuth 동의 화면**으로 이동
2. 사용자 유형: **외부** 선택
3. 앱 정보 입력:
   - 앱 이름: `올띵버킷`
   - 사용자 지원 이메일: `your-email@example.com`
   - 개발자 연락처 정보: `your-email@example.com`
4. 범위 추가:
   - `../auth/userinfo.email`
   - `../auth/userinfo.profile`
   - `openid`
5. **테스트 사용자 추가** (중요!):
   - 테스트 사용자 섹션에서 로그인할 Google 계정 이메일 추가
   - 이 단계를 건너뛰면 "액세스 차단됨: 승인 오류" 발생

**⚠️ 중요**: OAuth 동의 화면이 "테스트 중" 상태일 때는 테스트 사용자만 로그인할 수 있습니다. 프로덕션에서는 "게시됨" 상태로 변경해야 합니다.

## 2. 환경 변수 설정

### 2.1 .env 파일 생성
프로젝트 루트에 `.env` 파일을 생성하고 다음 내용을 추가:

```env
# Google OAuth 설정
REACT_APP_GOOGLE_CLIENT_ID=your-google-client-id-here

# Lumi SDK 설정
REACT_APP_LUMI_API_KEY=your-lumi-api-key-here
REACT_APP_LUMI_PROJECT_ID=your-lumi-project-id-here
```

### 2.2 Google Client ID 설정
1. Google Cloud Console에서 생성한 OAuth 2.0 클라이언트 ID를 복사
2. `.env` 파일의 `REACT_APP_GOOGLE_CLIENT_ID`에 붙여넣기

## 3. 백엔드 API 설정 (선택사항)

### 3.1 Node.js 백엔드 예시
```javascript
// server.js
const express = require('express');
const { OAuth2Client } = require('google-auth-library');

const app = express();
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Google OAuth 토큰 교환
app.post('/api/auth/google/token', async (req, res) => {
  try {
    const { code } = req.body;
    const { tokens } = await client.getToken(code);
    res.json(tokens);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Google 로그인 처리
app.post('/api/auth/google/login', async (req, res) => {
  try {
    const { access_token } = req.body;
    const ticket = await client.verifyIdToken({
      idToken: access_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    
    // 사용자 정보를 데이터베이스에 저장/업데이트
    // JWT 토큰 생성 및 반환
    
    res.json({ user: payload, token: 'jwt-token' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
```

## 4. 테스트

### 4.1 개발 서버 실행
```bash
npm run dev
```

### 4.2 Google 로그인 테스트
1. 브라우저에서 `http://localhost:5173` 접속
2. 로그인 모달에서 "구글로 로그인" 버튼 클릭
3. Google OAuth 인증 페이지로 리디렉션
4. Google 계정으로 로그인
5. 애플리케이션으로 리디렉션되어 로그인 완료

## 5. 문제 해결

### 5.1 "액세스 차단됨: 승인 오류" 해결 방법

#### 가장 일반적인 원인과 해결책:

1. **테스트 사용자 추가 안됨**
   - Google Cloud Console > OAuth 동의 화면 > 테스트 사용자
   - 로그인할 Google 계정 이메일을 테스트 사용자로 추가

2. **OAuth 동의 화면이 "테스트 중" 상태**
   - 테스트 중일 때는 테스트 사용자만 로그인 가능
   - 프로덕션에서는 "게시됨" 상태로 변경 필요

3. **리디렉션 URI 불일치**
   - Google Console의 승인된 리디렉션 URI와 정확히 일치해야 함
   - `http://localhost:5173/auth/google/callback` (슬래시 포함/미포함 주의)

4. **클라이언트 ID 오류**
   - .env 파일의 REACT_APP_GOOGLE_CLIENT_ID 확인
   - Google Console의 클라이언트 ID와 정확히 일치해야 함

### 5.2 일반적인 오류
- **redirect_uri_mismatch**: 리디렉션 URI가 Google Console 설정과 일치하지 않음
- **invalid_client**: 클라이언트 ID가 잘못됨
- **access_denied**: 사용자가 권한을 거부함
- **unauthorized_client**: 클라이언트가 승인되지 않음

### 5.3 디버깅
- 브라우저 개발자 도구의 콘솔에서 오류 메시지 확인
- Network 탭에서 API 호출 상태 확인
- Google Cloud Console의 OAuth 동의 화면에서 설정 확인
- 콘솔에서 "Google OAuth 설정" 로그 확인

## 6. 보안 고려사항

1. **환경 변수 보안**: `.env` 파일을 `.gitignore`에 추가
2. **HTTPS 사용**: 프로덕션에서는 반드시 HTTPS 사용
3. **토큰 보안**: JWT 토큰을 안전하게 저장하고 전송
4. **CORS 설정**: 적절한 CORS 정책 설정

## 7. 추가 기능

### 7.1 사용자 정보 동기화
- Google 프로필 이미지 자동 업데이트
- 이메일 주소 변경 감지
- 계정 연결/해제 기능

### 7.2 소셜 로그인 확장
- Facebook 로그인
- Kakao 로그인
- Naver 로그인
