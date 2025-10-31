-- user_profiles와 influencer_profiles 테이블에 닉네임과 프로필 이미지 필드 추가

-- user_profiles 테이블에 추가
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- influencer_profiles 테이블에 추가
ALTER TABLE influencer_profiles
ADD COLUMN IF NOT EXISTS nickname VARCHAR(50),
ADD COLUMN IF NOT EXISTS profile_image_url TEXT;

-- 닉네임 유니크 인덱스 추가 (중복 방지, NULL 허용)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_nickname
ON user_profiles(nickname)
WHERE nickname IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_influencer_profiles_nickname
ON influencer_profiles(nickname)
WHERE nickname IS NOT NULL;

-- 닉네임 검색을 위한 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_user_profiles_nickname_search
ON user_profiles(nickname)
WHERE nickname IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_influencer_profiles_nickname_search
ON influencer_profiles(nickname)
WHERE nickname IS NOT NULL;

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name IN ('user_profiles', 'influencer_profiles')
  AND column_name IN ('nickname', 'profile_image_url')
ORDER BY table_name, ordinal_position;
