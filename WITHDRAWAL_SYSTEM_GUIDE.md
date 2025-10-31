# 포인트 출금 시스템 구축 가이드

## 📋 개요

포인트 출금 시스템이 법적 안정성과 전문성을 갖추도록 전면 개선되었습니다.

### 주요 개선 사항

1. **법적 안정성 강화**
   - 개인정보보호법 준수
   - 소득세법 준수 (원천징수 3.3%)
   - 법적 동의 절차 추가
   - 증빙 자료 자동 저장 (IP, 타임스탬프)

2. **사용자 경험 개선**
   - 3단계 출금 신청 프로세스
   - 실시간 세금 계산 미리보기
   - 지급 예정일 자동 안내

3. **관리자 기능 강화**
   - 구글 시트 스타일 출금 관리 테이블
   - 엑셀 다운로드 기능
   - 주민등록번호 마스킹 처리
   - 상세 정보 모달

---

## 🗂️ 파일 구조

### 새로 추가된 파일

```
upgrade_withdrawal_requests.sql           # 데이터베이스 마이그레이션
src/
├── components/
│   ├── WithdrawalLegalNotice.tsx        # 법적 고지사항 및 동의 컴포넌트
│   ├── WithdrawalRequestModal.tsx       # 새로운 출금 신청 모달
│   └── AdminWithdrawalManager.tsx       # 관리자 출금 관리 컴포넌트
└── pages/
    └── Points.tsx                        # 출금 로직 통합 (수정됨)
```

---

## 🛠️ 설치 및 설정

### 1. 데이터베이스 마이그레이션

```bash
# Supabase SQL 에디터에서 실행
upgrade_withdrawal_requests.sql
```

**추가된 필드:**
- `resident_number` - 주민등록번호 (암호화 필수)
- `tax_agreement` - 세금 신고 동의
- `privacy_agreement` - 개인정보 동의
- `tax_withholding_agreement` - 원천징수 동의
- `agreement_timestamp` - 동의 시각
- `agreement_ip` - 동의 시 IP (법적 증빙)
- `payment_schedule_date` - 예상 지급일
- `actual_payment_date` - 실제 지급일
- `payment_method` - 지급 방법
- `tax_report_status` - 세무 신고 상태

### 2. NPM 패키지 설치

```bash
npm install xlsx
```

---

## 💡 사용 방법

### 사용자 출금 신청 흐름

1. **1단계: 금액 입력**
   - 출금 가능 포인트 확인
   - 최소 1,000P 이상
   - 세금 3.3% 자동 계산
   - 예상 지급일 표시

2. **2단계: 계좌 정보**
   - 기존 인증된 계좌 자동 로드
   - 또는 새 계좌 정보 입력
   - 본인 명의 계좌만 가능

3. **3단계: 법적 동의**
   - 주민등록번호 입력 (세금 신고용)
   - 개인정보 수집·이용 동의
   - 세금 신고 동의
   - 원천징수 3.3% 공제 동의

### 관리자 출금 관리

#### AdminWithdrawalManager 컴포넌트 사용

```tsx
import AdminWithdrawalManager from './components/AdminWithdrawalManager'

// 관리자 페이지에서 사용
<AdminWithdrawalManager
  onApprove={async (requestId) => {
    // 승인 로직
    const { dataService } = await import('./lib/dataService')
    await dataService.entities.withdrawal_requests.update(requestId, {
      status: 'approved',
      processed_at: new Date().toISOString()
    })
  }}
  onReject={async (requestId) => {
    // 거절 로직
    const { dataService } = await import('./lib/dataService')
    await dataService.entities.withdrawal_requests.update(requestId, {
      status: 'rejected',
      processed_at: new Date().toISOString()
    })
  }}
/>
```

#### 주요 기능

1. **검색 및 필터**
   - 이름, 사용자ID, 계좌정보로 검색
   - 상태별 필터 (대기중, 승인됨, 완료, 거절됨)

2. **엑셀 다운로드**
   - 클릭 한 번으로 전체 출금 내역 엑셀 다운로드
   - 신청일자, 이름, 계좌번호, 포인트, 주민번호 등 모든 정보 포함
   - 주민등록번호 자동 마스킹 (뒤 6자리)

3. **상세 보기 모달**
   - 출금 요청 상세 정보
   - 법적 동의 내역
   - 체험한 브랜드 목록
   - 승인/거절 액션 버튼

---

## 📊 데이터베이스 스키마

### withdrawal_requests 테이블

```sql
CREATE TABLE withdrawal_requests (
  id UUID PRIMARY KEY,
  user_id VARCHAR NOT NULL,
  bank_account_id UUID,
  points_amount INTEGER NOT NULL,
  requested_amount INTEGER NOT NULL,
  withdrawal_amount INTEGER NOT NULL,
  tax_amount INTEGER NOT NULL,
  final_amount INTEGER NOT NULL,
  status VARCHAR DEFAULT 'pending',
  request_reason TEXT,
  admin_note TEXT,

  -- 새로 추가된 법적 필드
  resident_number VARCHAR(13),
  tax_agreement BOOLEAN DEFAULT false,
  privacy_agreement BOOLEAN DEFAULT false,
  tax_withholding_agreement BOOLEAN DEFAULT false,
  agreement_timestamp TIMESTAMPTZ,
  agreement_ip VARCHAR(45),
  payment_schedule_date DATE,
  actual_payment_date DATE,
  payment_method VARCHAR(50) DEFAULT 'bank_transfer',
  tax_report_status VARCHAR(50) DEFAULT 'pending',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 🔒 보안 및 개인정보 보호

### 1. 주민등록번호 암호화

⚠️ **중요: 실제 운영 시 반드시 암호화 필요**

```typescript
// TODO: 실제 운영 시 주민번호 암호화
// PostgreSQL pgcrypto 사용 예시
import { supabase } from './lib/supabase'

const encryptResidentNumber = async (residentNumber: string) => {
  const { data, error } = await supabase.rpc('encrypt_resident_number', {
    plain_text: residentNumber,
    secret_key: process.env.ENCRYPTION_KEY
  })
  return data
}
```

### 2. 개인정보 보관 기간

- **법적 보관 기간**: 출금 완료 후 5년 (소득세법 시행령 제122조)
- **자동 삭제**: 5년 경과 시 자동 파기 (크론잡 설정 권장)

### 3. 접근 제어

- 주민등록번호는 관리자 페이지에서 마스킹 처리
- 엑셀 다운로드 시에도 마스킹 적용
- 로그인한 관리자만 접근 가능

---

## 📅 지급 일정 자동 계산

```typescript
const calculatePaymentScheduleDate = () => {
  const today = new Date()
  const day = today.getDate()

  if (day <= 10) {
    // 당월 15일
    return new Date(today.getFullYear(), today.getMonth(), 15)
  } else if (day <= 20) {
    // 당월 25일
    return new Date(today.getFullYear(), today.getMonth(), 25)
  } else {
    // 익월 5일
    return new Date(today.getFullYear(), today.getMonth() + 1, 5)
  }
}
```

**지급 일정:**
- 1일 ~ 10일 신청 → 당월 15일 지급
- 11일 ~ 20일 신청 → 당월 25일 지급
- 21일 ~ 말일 신청 → 익월 5일 지급

---

## 🧪 테스트

### 1. 출금 신청 테스트

```bash
# 개발 서버 실행
npm run dev

# 테스트 시나리오
1. 로그인 후 포인트 페이지 이동
2. 1,000P 이상 보유 확인
3. "포인트 출금" 버튼 클릭
4. 3단계 프로세스 진행
   - 금액 입력
   - 계좌 정보 입력/확인
   - 법적 동의
5. "출금 신청 완료" 버튼 클릭
6. 성공 메시지 확인
```

### 2. 관리자 페이지 테스트

```bash
1. 관리자 계정으로 로그인
2. 관리자 대시보드에서 "출금 관리" 탭 클릭
3. 출금 요청 목록 확인
4. "엑셀 다운로드" 버튼 클릭
5. 다운로드된 엑셀 파일 확인
6. 상세 보기 모달 테스트
```

---

## 📝 법적 고지사항 템플릿

### 개인정보 수집·이용 동의

```
수집 목적: 포인트 출금 및 세금 신고
수집 항목: 성명, 주민등록번호, 계좌정보, 연락처
보유 기간: 출금 완료 후 5년 (소득세법 시행령 제122조)
```

### 원천징수 안내

```
원천징수 세율: 3.3% (소득세 3% + 지방소득세 0.3%)
신고 시기: 출금 요청 월의 다음 달 10일까지
지급명세서: 다음 연도 2월 말까지 발급
```

---

## 🚀 배포

### 1. 빌드

```bash
npm run build
```

### 2. 데이터베이스 마이그레이션

```bash
# Supabase 프로젝트에서 SQL 실행
upgrade_withdrawal_requests.sql
```

### 3. 환경 변수 설정

```env
# .env.production
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
ENCRYPTION_KEY=your_encryption_key  # 주민번호 암호화용
```

---

## 📞 고객센터 정보

모든 출금 관련 문의는 다음으로 연락:

- 📧 이메일: support@allthingbucket.com
- 📞 전화: 010-2212-9245 (평일 09:00-18:00)
- 💬 카카오톡: @올띵버킷 (24시간 문의 가능)

---

## ⚠️ 주의사항

1. **주민등록번호 암호화**
   - 실제 운영 환경에서는 반드시 암호화 필수
   - PostgreSQL pgcrypto 확장 사용 권장

2. **백업**
   - 개인정보 포함 데이터베이스 정기 백업
   - 백업 파일도 암호화 필수

3. **접근 로그**
   - 주민번호 접근 시 로그 기록
   - 정기적인 접근 감사

4. **개인정보 파기**
   - 보관기간 경과 시 자동 파기
   - 파기 로그 기록

---

## 🎯 향후 개선 사항

### 1. 실명인증 연동
- NICE 본인인증 API 연동
- 1원 인증 자동화

### 2. 자동 입금
- 은행 API 연동
- 자동 입금 처리

### 3. 세무 자동화
- 국세청 홈택스 연동
- 지급명세서 자동 발급

### 4. 알림 기능
- 출금 승인/거절 알림
- 입금 완료 알림

---

## 📚 참고 자료

- [개인정보보호법](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EA%B0%9C%EC%9D%B8%EC%A0%95%EB%B3%B4%EB%B3%B4%ED%98%B8%EB%B2%95)
- [소득세법 제127조 (원천징수)](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%86%8C%EB%93%9D%EC%84%B8%EB%B2%95/%EC%A0%9C127%EC%A1%B0)
- [소득세법 시행령 제122조](https://www.law.go.kr/%EB%B2%95%EB%A0%B9/%EC%86%8C%EB%93%9D%EC%84%B8%EB%B2%95%EC%8B%9C%ED%96%89%EB%A0%B9/%EC%A0%9C122%EC%A1%B0)

---

## 📌 요약

✅ 법적 안정성 확보
✅ 전문적인 UI/UX
✅ 관리자 편의성 향상
✅ 엑셀 다운로드 기능
✅ 개인정보 보호

포인트 출금 시스템이 완전히 개선되어 안전하고 효율적으로 운영할 수 있습니다.
