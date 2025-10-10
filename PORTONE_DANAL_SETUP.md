# 포트원 다날 본인인증 설정 가이드

## 1. 포트원 회원가입 및 로그인

1. [포트원 콘솔](https://admin.portone.io)에 접속
2. 회원가입 또는 로그인

## 2. 가맹점(Store) 생성

1. 콘솔 대시보드에서 **"새 가맹점 만들기"** 클릭
2. 가맹점 정보 입력
3. 생성 후 **Store ID** 확인 및 복사

## 3. 다날 본인인증 채널 설정

### 3-1. 다날과 계약
1. [다날](https://www.danal.co.kr) 홈페이지 접속
2. 본인인증 서비스 계약 진행
3. 계약 완료 후 **CP ID**, **상점 ID** 등 발급받은 정보 확보

### 3-2. 포트원 콘솔에서 채널 추가
1. 포트원 콘솔 좌측 메뉴에서 **"결제 연동"** → **"채널 관리"** 클릭
2. **"채널 추가하기"** 클릭
3. 다음 정보 입력:
   - **채널 유형**: 본인인증
   - **PG사**: 다날(Danal) 선택
   - **채널명**: 원하는 이름 입력 (예: "다날 본인인증")
   - **다날에서 발급받은 정보** 입력:
     - CP ID
     - 상점 ID
     - 기타 인증 정보

4. 채널 생성 후 **채널 키(Channel Key)** 확인 및 복사

## 4. 환경변수 설정

프로젝트의 `.env` 파일을 열어 다음 정보를 입력하세요:

```bash
# 포트원 다날 본인인증 설정
VITE_PORTONE_STORE_ID=store-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
VITE_PORTONE_CHANNEL_KEY=channel-key-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

- `VITE_PORTONE_STORE_ID`: 2단계에서 생성한 가맹점의 Store ID
- `VITE_PORTONE_CHANNEL_KEY`: 3-2단계에서 생성한 채널의 Channel Key

## 5. 테스트

### 5-1. 개발 서버 재시작
환경변수를 변경했으므로 개발 서버를 재시작해야 합니다:

```bash
npm run dev
```

### 5-2. 본인인증 테스트
1. 애플리케이션에 로그인
2. 프로필 페이지 또는 본인인증 페이지로 이동
3. "휴대폰 본인인증 시작" 버튼 클릭
4. 다날 본인인증 팝업이 정상적으로 열리는지 확인

## 6. 다날 특화 옵션 (선택사항)

필요에 따라 다음 옵션을 추가할 수 있습니다.

### 6-1. 연령 제한 설정
특정 연령 이상만 본인인증을 할 수 있도록 설정:

```typescript
// src/pages/IdentityVerification.tsx의 handleIdentityVerification 함수에서
const response = await PortOne.requestIdentityVerification({
  storeId: storeId,
  identityVerificationId: `identity-${user.user_id}-${Date.now()}`,
  channelKey: channelKey,
  bypass: {
    danal: {
      AGELIMIT: 19, // 19세 이상만 인증 가능
    }
  }
})
```

### 6-2. 통신사 제한 설정
특정 통신사만 사용하도록 설정:

```typescript
bypass: {
  danal: {
    IsCarrier: "SKT;KTF", // SKT, KTF만 허용 (여러 개는 세미콜론으로 구분)
    // 가능한 값: SKT, KTF, LGT, MVNO
  }
}
```

### 6-3. 서비스 URL 설정
본인인증 화면에 표시될 서비스 URL:

```typescript
bypass: {
  danal: {
    CPTITLE: "www.allthingbucket.com"
  }
}
```

## 7. 문제 해결

### 7-1. "포트원 설정이 필요합니다" 오류
- `.env` 파일에 `VITE_PORTONE_STORE_ID`와 `VITE_PORTONE_CHANNEL_KEY`가 올바르게 설정되었는지 확인
- 개발 서버를 재시작했는지 확인

### 7-2. 본인인증 팝업이 열리지 않음
- 브라우저에서 팝업 차단을 해제했는지 확인
- 포트원 콘솔에서 채널이 활성화되어 있는지 확인

### 7-3. 인증 실패 오류
- 다날과의 계약 상태 확인 (테스트/운영 모드 확인)
- 포트원 콘솔의 다날 채널 설정 정보가 올바른지 확인

## 8. 참고 자료

- [포트원 공식 문서](https://developers.portone.io)
- [포트원 다날 본인인증 가이드](https://developers.portone.io/opi/ko/integration/pg/v2/danal-identity-verification?v=v2)
- [다날 고객센터](https://www.danal.co.kr/support)

## 9. 운영 환경 배포 시 주의사항

1. **운영 채널 생성**: 개발/테스트용과 별도로 운영용 채널을 생성해야 합니다
2. **환경변수 분리**: `.env.production` 파일에 운영 환경용 Store ID와 Channel Key 설정
3. **보안**: `.env` 파일은 절대 Git에 커밋하지 마세요 (`.gitignore`에 추가됨)
