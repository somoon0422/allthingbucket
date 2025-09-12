-- 찜하기 테이블 생성
CREATE TABLE IF NOT EXISTS wishlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    campaign_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 중복 방지를 위한 유니크 제약조건
    UNIQUE(user_id, campaign_id)
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_campaign_id ON wishlist(campaign_id);
CREATE INDEX IF NOT EXISTS idx_wishlist_created_at ON wishlist(created_at);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 찜목록만 볼 수 있음
CREATE POLICY "Users can view their own wishlist" ON wishlist
    FOR SELECT USING (auth.uid()::text = user_id);

-- 사용자는 자신의 찜목록만 추가할 수 있음
CREATE POLICY "Users can insert their own wishlist" ON wishlist
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 찜목록만 삭제할 수 있음
CREATE POLICY "Users can delete their own wishlist" ON wishlist
    FOR DELETE USING (auth.uid()::text = user_id);

-- 업데이트 시 updated_at 자동 갱신을 위한 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_wishlist_updated_at 
    BEFORE UPDATE ON wishlist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
