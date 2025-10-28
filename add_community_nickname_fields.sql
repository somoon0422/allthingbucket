-- community_posts와 community_comments 테이블에 닉네임과 프로필 이미지 필드 추가

-- community_posts 테이블에 추가
ALTER TABLE community_posts
ADD COLUMN IF NOT EXISTS user_nickname VARCHAR(50),
ADD COLUMN IF NOT EXISTS user_profile_image_url TEXT;

-- community_comments 테이블에 추가
ALTER TABLE community_comments
ADD COLUMN IF NOT EXISTS user_nickname VARCHAR(50),
ADD COLUMN IF NOT EXISTS user_profile_image_url TEXT;

-- 인덱스 추가 (닉네임으로 검색 가능하도록)
CREATE INDEX IF NOT EXISTS idx_community_posts_nickname
ON community_posts(user_nickname)
WHERE user_nickname IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_community_comments_nickname
ON community_comments(user_nickname)
WHERE user_nickname IS NOT NULL;

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name IN ('community_posts', 'community_comments')
  AND column_name IN ('user_nickname', 'user_profile_image_url')
ORDER BY table_name, ordinal_position;
