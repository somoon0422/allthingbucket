# 🎯 Supabase 최종 설정 가이드

## 1. Supabase 대시보드에서 테이블 생성

1. [Supabase 대시보드](https://supabase.com) 접속
2. 프로젝트 `allthingbucket` 선택
3. 좌측 메뉴에서 **"SQL Editor"** 클릭
4. **"New query"** 클릭
5. `supabase_schema_from_entities.sql` 파일의 내용을 복사하여 붙여넣기
6. **"Run"** 버튼 클릭하여 실행

## 2. 생성되는 테이블 목록

✅ **18개 테이블이 생성됩니다:**

1. `campaigns` - 캠페인 정보
2. `users` - 사용자 정보  
3. `user_profiles` - 사용자 프로필
4. `user_applications` - 사용자 신청
5. `user_reviews` - 사용자 리뷰
6. `user_points` - 사용자 포인트
7. `points_history` - 포인트 히스토리
8. `admins` - 관리자 계정
9. `notifications` - 알림
10. `admin_notifications` - 관리자 알림
11. `withdrawal_requests` - 출금 요청
12. `experience_codes` - 체험단 코드
13. `experience_assignments` - 체험단 배정
14. `experience_campaigns` - 체험단 캠페인
15. `user_experiences` - 사용자 체험단
16. `user_codes` - 사용자 코드
17. `influencer_profiles` - 인플루언서 프로필
18. `review_submissions` - 리뷰 제출

## 3. 기본 데이터

- **관리자 계정**: `admin` / `admin123`
- **캠페인 데이터**: 없음 (사이트에서 직접 추가)
- **사용자 데이터**: 없음 (사이트에서 직접 추가)

## 4. 테이블 생성 확인

1. 좌측 메뉴에서 **"Table Editor"** 클릭
2. `campaigns` 테이블 선택
3. 테이블 구조가 올바르게 생성되었는지 확인

## 5. 웹사이트 테스트

1. https://allthingbucket.com 접속
2. 체험단 목록이 비어있는지 확인 (정상)
3. 관리자 로그인 (admin/admin123) 테스트
4. 관리자 페이지에서 캠페인 추가 테스트

## 6. 데이터 추가 방법

### 관리자 페이지에서:
- 캠페인 생성/수정/삭제
- 사용자 관리
- 신청 승인/거부
- 리뷰 관리

### 사용자 페이지에서:
- 회원가입
- 캠페인 신청
- 리뷰 작성
- 포인트 조회

## 7. 완료 확인

✅ Supabase 테이블 생성 완료  
✅ 관리자 로그인 정상 작동  
✅ 웹사이트 정상 접속  
✅ 데이터 추가/수정 기능 정상  

## 8. MongoDB Atlas 완전 제거

이제 MongoDB Atlas는 더 이상 사용하지 않습니다:
- 모든 데이터는 Supabase PostgreSQL에 저장
- API는 Supabase 서비스 사용
- 프론트엔드는 Supabase API 호출

**🎉 Supabase 마이그레이션 완료!**

이제 안정적이고 확장 가능한 PostgreSQL 데이터베이스로 웹사이트를 운영할 수 있습니다.
