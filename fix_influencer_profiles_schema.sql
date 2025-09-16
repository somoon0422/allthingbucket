-- influencer_profiles 테이블 스키마 수정

-- 1. influencer_profiles 테이블에 필요한 컬럼들 추가
ALTER TABLE influencer_profiles 
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS birth_year TEXT,
ADD COLUMN IF NOT EXISTS birth_month TEXT,
ADD COLUMN IF NOT EXISTS birth_day TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS detailed_address TEXT,
ADD COLUMN IF NOT EXISTS naver_blog TEXT,
ADD COLUMN IF NOT EXISTS instagram_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel TEXT,
ADD COLUMN IF NOT EXISTS tiktok_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_page TEXT,
ADD COLUMN IF NOT EXISTS other_sns TEXT,
ADD COLUMN IF NOT EXISTS follower_counts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawn INTEGER DEFAULT 0;

-- 2. user_profiles 테이블에도 필요한 컬럼들 추가 (이미 추가했지만 확인용)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS account_holder TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS account_number TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS birth_date TEXT,
ADD COLUMN IF NOT EXISTS birth_year TEXT,
ADD COLUMN IF NOT EXISTS birth_month TEXT,
ADD COLUMN IF NOT EXISTS birth_day TEXT,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS detailed_address TEXT,
ADD COLUMN IF NOT EXISTS naver_blog TEXT,
ADD COLUMN IF NOT EXISTS instagram_id TEXT,
ADD COLUMN IF NOT EXISTS youtube_channel TEXT,
ADD COLUMN IF NOT EXISTS tiktok_id TEXT,
ADD COLUMN IF NOT EXISTS facebook_page TEXT,
ADD COLUMN IF NOT EXISTS other_sns TEXT,
ADD COLUMN IF NOT EXISTS follower_counts JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS categories JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS experience_level TEXT DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS tax_info JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS current_balance INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_withdrawn INTEGER DEFAULT 0;

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_user_id ON influencer_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_influencer_profiles_phone ON influencer_profiles(phone);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_phone ON user_profiles(phone);

-- 4. RLS 정책 확인 및 수정
ALTER TABLE influencer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 프로필만 조회/수정 가능
DROP POLICY IF EXISTS "Users can view own influencer profile" ON influencer_profiles;
CREATE POLICY "Users can view own influencer profile" ON influencer_profiles
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own influencer profile" ON influencer_profiles;
CREATE POLICY "Users can update own influencer profile" ON influencer_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own influencer profile" ON influencer_profiles;
CREATE POLICY "Users can insert own influencer profile" ON influencer_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- user_profiles에 대해서도 동일한 정책 적용
DROP POLICY IF EXISTS "Users can view own user profile" ON user_profiles;
CREATE POLICY "Users can view own user profile" ON user_profiles
    FOR SELECT USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can update own user profile" ON user_profiles;
CREATE POLICY "Users can update own user profile" ON user_profiles
    FOR UPDATE USING (auth.uid()::text = user_id);

DROP POLICY IF EXISTS "Users can insert own user profile" ON user_profiles;
CREATE POLICY "Users can insert own user profile" ON user_profiles
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 5. 테이블 코멘트 추가
COMMENT ON TABLE influencer_profiles IS '인플루언서 프로필 정보 (계좌 정보 포함)';
COMMENT ON COLUMN influencer_profiles.account_holder IS '예금주명';
COMMENT ON COLUMN influencer_profiles.bank_name IS '은행명';
COMMENT ON COLUMN influencer_profiles.account_number IS '계좌번호';
COMMENT ON COLUMN influencer_profiles.tax_info IS '세금 관련 정보 (주민등록번호, 인증 정보 등)';

COMMENT ON TABLE user_profiles IS '사용자 프로필 정보 (계좌 정보 포함)';
COMMENT ON COLUMN user_profiles.account_holder IS '예금주명';
COMMENT ON COLUMN user_profiles.bank_name IS '은행명';
COMMENT ON COLUMN user_profiles.account_number IS '계좌번호';
COMMENT ON COLUMN user_profiles.tax_info IS '세금 관련 정보 (주민등록번호, 인증 정보 등)';
