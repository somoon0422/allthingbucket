# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 계정 생성
2. "New Project" 클릭
3. 프로젝트 설정:
   - **Name**: `allthingbucket`
   - **Database Password**: 강력한 비밀번호 설정 (기록해두세요)
   - **Region**: `Northeast Asia (Seoul)` 선택
   - **Pricing Plan**: `Free` 선택

## 2. 데이터베이스 스키마 설정

1. Supabase 대시보드에서 "SQL Editor" 클릭
2. `supabase_schema.sql` 파일의 내용을 복사하여 실행
3. 모든 테이블과 기본 데이터가 생성됩니다

## 3. 환경변수 설정

### 로컬 개발환경
`.env` 파일에 추가:
```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

### Vercel 배포환경
```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_ANON_KEY
```

## 4. Supabase 프로젝트 정보 확인

1. Supabase 대시보드 → Settings → API
2. 다음 정보를 복사:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **anon public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

## 5. 데이터베이스 연결 테스트

```bash
# 로컬에서 테스트
npm run dev

# API 엔드포인트 테스트
curl http://localhost:3000/api/db/status
```

## 6. 기본 데이터 확인

Supabase 대시보드 → Table Editor에서 다음 테이블들을 확인:
- `campaigns` - 기본 캠페인 2개
- `admins` - 관리자 계정 (admin/admin123)

## 7. 보안 설정

### Row Level Security (RLS)
- 모든 테이블에 RLS가 활성화되어 있습니다
- 공개 읽기: `campaigns`, `user_profiles`, `experience_campaigns`
- 사용자별 접근: 개인 데이터 (리뷰, 신청, 포인트 등)
- 관리자 접근: 모든 데이터

### API 키 보안
- `SUPABASE_ANON_KEY`는 공개되어도 안전합니다
- `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용하세요

## 8. 트러블슈팅

### 연결 실패
- URL과 API 키가 정확한지 확인
- 네트워크 방화벽 설정 확인
- Supabase 프로젝트가 활성 상태인지 확인

### 데이터 조회 실패
- RLS 정책 확인
- 테이블 권한 확인
- SQL 쿼리 문법 확인

### 성능 최적화
- 인덱스 활용
- 쿼리 최적화
- 연결 풀 설정

## 9. 마이그레이션 체크리스트

- [ ] Supabase 프로젝트 생성
- [ ] 데이터베이스 스키마 실행
- [ ] 환경변수 설정
- [ ] 로컬 테스트
- [ ] Vercel 배포
- [ ] 프로덕션 테스트
- [ ] 기존 데이터 마이그레이션 (필요시)

## 10. Supabase vs MongoDB Atlas 비교

| 기능 | Supabase | MongoDB Atlas |
|------|----------|---------------|
| 무료 티어 | 500MB, 2개 프로젝트 | 512MB, 1개 클러스터 |
| 연결 제한 | 60개 동시 연결 | 500개 동시 연결 |
| 지역 | 전 세계 | 제한적 |
| API | REST + GraphQL | MongoDB 쿼리 |
| 실시간 | WebSocket 지원 | Change Streams |
| 인증 | 내장 인증 시스템 | 별도 구현 필요 |
| 스토리지 | 파일 스토리지 포함 | 별도 서비스 |
| 대시보드 | 웹 기반 관리 | MongoDB Compass |

Supabase가 더 개발자 친화적이고 기능이 풍부합니다!
