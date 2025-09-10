# 🚀 Supabase 빠른 설정 가이드

## 1. Supabase 대시보드 접속
1. [Supabase](https://supabase.com) 로그인
2. 프로젝트 `allthingbucket` 선택
3. 좌측 메뉴에서 **"SQL Editor"** 클릭

## 2. 데이터베이스 스키마 실행
1. **"New query"** 클릭
2. 아래 SQL 코드를 복사하여 붙여넣기:

```sql
-- 1. 캠페인 테이블
CREATE TABLE IF NOT EXISTS campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    max_participants INTEGER DEFAULT 0,
    current_participants INTEGER DEFAULT 0,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    application_start TIMESTAMP WITH TIME ZONE,
    application_end TIMESTAMP WITH TIME ZONE,
    content_start TIMESTAMP WITH TIME ZONE,
    content_end TIMESTAMP WITH TIME ZONE,
    requirements TEXT,
    rewards TEXT,
    main_images JSONB DEFAULT '[]',
    detail_images JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 관리자 테이블
CREATE TABLE IF NOT EXISTS admins (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    role VARCHAR(20) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 기본 데이터 삽입
INSERT INTO campaigns (title, description, type, status, max_participants, current_participants, start_date, end_date, application_start, application_end, content_start, content_end, requirements, rewards, main_images, detail_images) 
VALUES 
('뷰티 제품 체험단 모집', '새로운 뷰티 제품을 체험해보실 분들을 모집합니다. 피부에 자극이 적고 효과가 뛰어난 제품을 무료로 체험해보세요!', 'beauty', 'active', 50, 15, '2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-15T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-20T00:00:00Z', '인스타그램 팔로워 1만명 이상', '제품 무료 제공 + 포인트 1000P', '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500"]', '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800", "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800"]'),
('테크 가전 제품 리뷰', '최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다. 스마트홈 기기를 체험하고 솔직한 리뷰를 작성해주세요!', 'tech', 'active', 30, 8, '2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-10T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-15T00:00:00Z', '유튜브 구독자 5천명 이상', '제품 무료 제공 + 포인트 2000P', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"]', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"]'),
('패션 브랜드 체험단', '새로운 패션 브랜드의 의류를 체험해보실 분들을 모집합니다. 트렌디한 스타일을 경험해보세요!', 'fashion', 'active', 25, 5, '2024-02-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-02-01T00:00:00Z', '2024-12-20T00:00:00Z', '2024-02-01T00:00:00Z', '2024-12-25T00:00:00Z', '인스타그램 팔로워 5천명 이상', '의류 무료 제공 + 포인트 1500P', '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500"]', '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800", "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800"]'),
('푸드 브랜드 체험단', '맛있는 푸드 브랜드의 제품을 체험해보실 분들을 모집합니다. 새로운 맛을 경험하고 리뷰를 작성해주세요!', 'food', 'active', 40, 12, '2024-03-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-03-01T00:00:00Z', '2024-12-25T00:00:00Z', '2024-03-01T00:00:00Z', '2024-12-30T00:00:00Z', '블로그 또는 SNS 활동자', '제품 무료 제공 + 포인트 800P', '["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500"]', '["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800"]'),
('홈데코 제품 체험단', '아름다운 홈데코 제품을 체험해보실 분들을 모집합니다. 집을 더 예쁘게 꾸며보세요!', 'home', 'active', 20, 3, '2024-04-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-04-01T00:00:00Z', '2024-12-28T00:00:00Z', '2024-04-01T00:00:00Z', '2024-12-31T00:00:00Z', '인스타그램 팔로워 3천명 이상', '제품 무료 제공 + 포인트 1200P', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"]', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]')
ON CONFLICT (id) DO NOTHING;

INSERT INTO admins (username, password, email, role) 
VALUES ('admin', 'admin123', 'admin@allthingbucket.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 4. RLS 정책 설정
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Admins can do everything" ON campaigns FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON admins FOR ALL USING (true);
```

3. **"Run"** 버튼 클릭하여 실행

## 3. 데이터 확인
1. 좌측 메뉴에서 **"Table Editor"** 클릭
2. `campaigns` 테이블 선택
3. 5개의 캠페인 데이터가 생성되었는지 확인

## 4. 웹사이트 테스트
1. https://allthingbucket.com 접속
2. 체험단 목록이 정상적으로 표시되는지 확인
3. 관리자 로그인 (admin/admin123) 테스트

## 5. 문제 해결
- **데이터가 보이지 않는 경우**: RLS 정책이 올바르게 설정되었는지 확인
- **API 오류**: Vercel 로그에서 Supabase 연결 상태 확인
- **권한 오류**: Supabase 프로젝트 설정에서 API 키 권한 확인

## 6. 완료 확인
✅ 캠페인 목록이 웹사이트에 표시됨  
✅ 관리자 로그인이 정상 작동함  
✅ API 엔드포인트가 데이터를 반환함  

이제 MongoDB Atlas 문제 없이 Supabase로 완전히 마이그레이션되었습니다! 🎉
