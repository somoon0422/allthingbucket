# Gmail API 설정 가이드

Gmail API를 사용하여 무료로 이메일을 발송할 수 있습니다.

## 1. Google Cloud Console 설정

### 1.1 프로젝트 생성
1. [Google Cloud Console](https://console.cloud.google.com/) 접속
2. "프로젝트 만들기" 클릭
3. 프로젝트 이름 입력 (예: "allthingbucket-email")
4. "만들기" 클릭

### 1.2 Gmail API 활성화
1. 왼쪽 메뉴에서 "API 및 서비스" → "라이브러리" 클릭
2. "Gmail API" 검색
3. "Gmail API" 클릭 후 "사용" 버튼 클릭

### 1.3 서비스 계정 생성
1. "API 및 서비스" → "사용자 인증 정보" 클릭
2. "사용자 인증 정보 만들기" → "서비스 계정" 클릭
3. 서비스 계정 이름 입력 (예: "allthingbucket-email-service")
4. "만들기" 클릭
5. 역할: "편집자" 또는 "Gmail API 사용자" 선택
6. "완료" 클릭

### 1.4 키 생성
1. 생성된 서비스 계정 클릭
2. "키" 탭 클릭
3. "키 추가" → "새 키 만들기" 클릭
4. "JSON" 선택 후 "만들기" 클릭
5. 다운로드된 JSON 파일에서 `private_key`와 `client_email` 확인

## 2. Gmail 계정 설정

### 2.1 Gmail 계정 준비
- 이메일 발송에 사용할 Gmail 계정 준비
- 2단계 인증이 활성화되어 있어야 함

### 2.2 앱 비밀번호 생성
1. [Google 계정 설정](https://myaccount.google.com/) 접속
2. "보안" 탭 클릭
3. "2단계 인증" 활성화 (아직 안 되어 있다면)
4. "앱 비밀번호" 클릭
5. "앱 선택" → "기타(맞춤 이름)" 선택
6. 이름 입력 (예: "allthingbucket-email")
7. "생성" 클릭
8. 생성된 16자리 비밀번호 복사

## 3. Supabase 환경변수 설정

다음 명령어로 환경변수를 설정하세요:

```bash
# Gmail 계정 정보
npx supabase secrets set GMAIL_USER=support@allthingbucket.com
npx supabase secrets set GMAIL_APP_PASSWORD=your-16-digit-app-password

# Gmail API 키 (서비스 계정 JSON에서 가져온 값)
npx supabase secrets set GMAIL_API_KEY=your-gmail-api-key
```

## 4. Edge Function 배포

```bash
npx supabase functions deploy send-email
```

## 5. 테스트

관리자 대시보드에서 이메일 발송을 테스트해보세요.

## 장점

- ✅ **완전 무료**: Gmail 계정만 있으면 됨
- ✅ **안정적**: Google의 인프라 사용
- ✅ **제한 없음**: Gmail의 일일 발송 한도 내에서 무제한
- ✅ **도메인 인증 불필요**: Gmail이 이미 인증된 도메인
- ✅ **빠른 발송**: Gmail의 빠른 전송 속도

## 주의사항

- Gmail 계정의 일일 발송 한도: 500통/일 (무료 계정)
- 2단계 인증이 활성화되어 있어야 함
- 앱 비밀번호는 16자리 문자열
- 서비스 계정 JSON 파일은 안전하게 보관

## 문제 해결

### "Gmail API Key not configured" 오류
- `GMAIL_API_KEY` 환경변수가 설정되어 있는지 확인
- 서비스 계정 JSON에서 올바른 키를 복사했는지 확인

### "Gmail SMTP not configured" 오류
- `GMAIL_USER`와 `GMAIL_APP_PASSWORD` 환경변수가 설정되어 있는지 확인
- 앱 비밀번호가 올바른지 확인 (16자리)

### 이메일이 발송되지 않는 경우
1. Gmail 계정이 활성화되어 있는지 확인
2. 2단계 인증이 활성화되어 있는지 확인
3. 앱 비밀번호가 올바른지 확인
4. Gmail API가 활성화되어 있는지 확인

## 대안: 간단한 SMTP 방식

만약 Gmail API 설정이 복잡하다면, 더 간단한 SMTP 방식을 사용할 수도 있습니다:

```bash
# SMTP 방식 (더 간단)
npx supabase secrets set GMAIL_USER=your-email@gmail.com
npx supabase secrets set GMAIL_APP_PASSWORD=your-16-digit-app-password
```

이 경우 Edge Function에서 SMTP 라이브러리를 사용하여 직접 Gmail SMTP 서버에 연결합니다.
