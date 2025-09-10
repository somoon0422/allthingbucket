-- Supabase PostgreSQL 스키마
-- AllThingBucket 데이터베이스 구조

-- 1. 캠페인 테이블
CREATE TABLE campaigns (
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

-- 2. 사용자 테이블
CREATE TABLE users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(100),
    phone VARCHAR(20),
    google_id VARCHAR(255) UNIQUE,
    profile_image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 사용자 프로필 테이블
CREATE TABLE user_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    nickname VARCHAR(100),
    bio TEXT,
    instagram_handle VARCHAR(100),
    youtube_channel VARCHAR(100),
    tiktok_handle VARCHAR(100),
    follower_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    interests JSONB DEFAULT '[]',
    location VARCHAR(100),
    age_range VARCHAR(20),
    gender VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 사용자 신청 테이블
CREATE TABLE user_applications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'pending',
    application_data JSONB DEFAULT '{}',
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    reviewed_by UUID,
    notes TEXT
);

-- 5. 사용자 리뷰 테이블
CREATE TABLE user_reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    title VARCHAR(255),
    content TEXT,
    images JSONB DEFAULT '[]',
    video_url TEXT,
    social_media_links JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'pending',
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID
);

-- 6. 포인트 테이블
CREATE TABLE user_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    earned_points INTEGER DEFAULT 0,
    used_points INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. 포인트 히스토리 테이블
CREATE TABLE points_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE SET NULL,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'earned', 'used', 'bonus'
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. 관리자 테이블
CREATE TABLE admins (
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

-- 9. 알림 테이블
CREATE TABLE notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. 관리자 알림 테이블
CREATE TABLE admin_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. 출금 요청 테이블
CREATE TABLE withdrawal_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    bank_name VARCHAR(100),
    account_number VARCHAR(50),
    account_holder VARCHAR(100),
    status VARCHAR(20) DEFAULT 'pending',
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by UUID
);

-- 12. 체험단 코드 테이블
CREATE TABLE experience_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. 체험단 배정 테이블
CREATE TABLE experience_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    code_id UUID REFERENCES experience_codes(id) ON DELETE SET NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'assigned'
);

-- 14. 체험단 캠페인 테이블
CREATE TABLE experience_campaigns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    experience_type VARCHAR(50),
    duration_days INTEGER,
    requirements TEXT,
    benefits TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. 사용자 체험단 테이블
CREATE TABLE user_experiences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
    experience_id UUID REFERENCES experience_campaigns(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'active',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- 16. 사용자 코드 테이블
CREATE TABLE user_codes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) DEFAULT 'referral',
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 17. 인플루언서 프로필 테이블
CREATE TABLE influencer_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    platform VARCHAR(50) NOT NULL,
    handle VARCHAR(100) NOT NULL,
    follower_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) DEFAULT 0,
    verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_campaigns_status ON campaigns(status);
CREATE INDEX idx_campaigns_type ON campaigns(type);
CREATE INDEX idx_campaigns_created_at ON campaigns(created_at);
CREATE INDEX idx_user_applications_user_id ON user_applications(user_id);
CREATE INDEX idx_user_applications_campaign_id ON user_applications(campaign_id);
CREATE INDEX idx_user_reviews_user_id ON user_reviews(user_id);
CREATE INDEX idx_user_reviews_campaign_id ON user_reviews(campaign_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_points_history_user_id ON points_history(user_id);
CREATE INDEX idx_experience_codes_code ON experience_codes(code);
CREATE INDEX idx_experience_codes_campaign_id ON experience_codes(campaign_id);

-- 기본 관리자 계정 생성
INSERT INTO admins (username, password, email, role) 
VALUES ('admin', 'admin123', 'admin@allthingbucket.com', 'admin');

-- 기본 캠페인 데이터 생성
INSERT INTO campaigns (title, description, type, status, max_participants, current_participants, start_date, end_date, application_start, application_end, content_start, content_end, requirements, rewards, main_images, detail_images) 
VALUES 
('뷰티 제품 체험단 모집', '새로운 뷰티 제품을 체험해보실 분들을 모집합니다.', 'beauty', 'active', 50, 15, '2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-15T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-20T00:00:00Z', '인스타그램 팔로워 1만명 이상', '제품 무료 제공 + 포인트 1000P', '["https://example.com/image1.jpg"]', '["https://example.com/detail1.jpg", "https://example.com/detail2.jpg"]'),
('테크 가전 제품 리뷰', '최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다.', 'tech', 'active', 30, 8, '2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-10T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-15T00:00:00Z', '유튜브 구독자 5천명 이상', '제품 무료 제공 + 포인트 2000P', '["https://example.com/image2.jpg"]', '["https://example.com/detail3.jpg"]');

-- RLS (Row Level Security) 정책 설정
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experience_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_experiences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;

-- 공개 읽기 정책 (캠페인은 모든 사용자가 읽을 수 있음)
CREATE POLICY "Anyone can read campaigns" ON campaigns FOR SELECT USING (true);
CREATE POLICY "Anyone can read user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Anyone can read experience_campaigns" ON experience_campaigns FOR SELECT USING (true);

-- 사용자별 데이터 접근 정책
CREATE POLICY "Users can read their own data" ON user_applications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own reviews" ON user_reviews FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own points" ON user_points FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own notifications" ON notifications FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own withdrawal requests" ON withdrawal_requests FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own experiences" ON user_experiences FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own codes" ON user_codes FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their own influencer profiles" ON influencer_profiles FOR SELECT USING (auth.uid()::text = user_id::text);

-- 관리자 정책 (모든 데이터 접근 가능)
CREATE POLICY "Admins can do everything" ON campaigns FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON users FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON user_profiles FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON user_applications FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON user_reviews FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON user_points FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON points_history FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON notifications FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON withdrawal_requests FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON experience_codes FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON experience_assignments FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON experience_campaigns FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON user_experiences FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON user_codes FOR ALL USING (true);
CREATE POLICY "Admins can do everything" ON influencer_profiles FOR ALL USING (true);
