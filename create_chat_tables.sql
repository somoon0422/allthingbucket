-- 채팅 시스템을 위한 테이블 생성

-- 채팅방 테이블
CREATE TABLE IF NOT EXISTS chat_rooms (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_email TEXT,
    user_phone TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'archived')),
    last_message_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 채팅 메시지 테이블
CREATE TABLE IF NOT EXISTS chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin')),
    sender_id TEXT, -- user_id 또는 admin_id
    sender_name TEXT NOT NULL,
    message TEXT NOT NULL,
    message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'image', 'file')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 알림 테이블 (새로운 채팅이 있을 때)
CREATE TABLE IF NOT EXISTS admin_chat_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    message_preview TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX IF NOT EXISTS idx_chat_rooms_last_message_at ON chat_rooms(last_message_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room_id ON chat_messages(chat_room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_type ON chat_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_admin_chat_notifications_is_read ON admin_chat_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_chat_notifications_created_at ON admin_chat_notifications(created_at);

-- 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 생성
CREATE TRIGGER update_chat_rooms_updated_at 
    BEFORE UPDATE ON chat_rooms 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_messages_updated_at 
    BEFORE UPDATE ON chat_messages 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 채팅방 마지막 메시지 시간 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms 
    SET last_message_at = NEW.created_at,
        updated_at = NOW()
    WHERE id = NEW.chat_room_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_room_last_message_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION update_chat_room_last_message();

-- 관리자 알림 생성 트리거 (사용자가 메시지를 보낼 때)
CREATE OR REPLACE FUNCTION create_admin_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
    room_user_id TEXT;
    room_user_name TEXT;
BEGIN
    -- 사용자가 메시지를 보낼 때만 알림 생성
    IF NEW.sender_type = 'user' THEN
        -- 채팅방 정보 가져오기
        SELECT user_id, user_name INTO room_user_id, room_user_name
        FROM chat_rooms 
        WHERE id = NEW.chat_room_id;
        
        -- 관리자 알림 생성
        INSERT INTO admin_chat_notifications (
            chat_room_id, 
            user_id, 
            user_name, 
            message_preview,
            is_read
        ) VALUES (
            NEW.chat_room_id,
            room_user_id,
            room_user_name,
            LEFT(NEW.message, 50),
            FALSE
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_admin_chat_notification_trigger
    AFTER INSERT ON chat_messages
    FOR EACH ROW EXECUTE FUNCTION create_admin_chat_notification();

-- RLS 정책 (Row Level Security)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 채팅방만 볼 수 있음
CREATE POLICY "Users can view their own chat rooms" ON chat_rooms
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 채팅방의 메시지만 볼 수 있음
CREATE POLICY "Users can view messages in their chat rooms" ON chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_messages.chat_room_id 
            AND chat_rooms.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can send messages in their chat rooms" ON chat_messages
    FOR INSERT WITH CHECK (
        sender_type = 'user' AND
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_room_id 
            AND chat_rooms.user_id = auth.uid()::text
        )
    );

-- 관리자는 모든 채팅에 접근 가능
CREATE POLICY "Admins can manage all chat rooms" ON chat_rooms
    FOR ALL USING (true);

CREATE POLICY "Admins can manage all chat messages" ON chat_messages
    FOR ALL USING (true);

CREATE POLICY "Admins can manage all chat notifications" ON admin_chat_notifications
    FOR ALL USING (true);

-- 샘플 데이터 (테스트용)
INSERT INTO chat_rooms (user_id, user_name, user_email, status) VALUES
('sample_user_1', '홍길동', 'hong@example.com', 'active'),
('sample_user_2', '김철수', 'kim@example.com', 'active'),
('sample_user_3', '이영희', 'lee@example.com', 'closed')
ON CONFLICT DO NOTHING;

-- 샘플 채팅 메시지
INSERT INTO chat_messages (chat_room_id, sender_type, sender_id, sender_name, message) VALUES
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_1' LIMIT 1),
    'user',
    'sample_user_1',
    '홍길동',
    '안녕하세요! 포인트 출금 관련해서 문의드립니다.'
),
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_1' LIMIT 1),
    'admin',
    'admin_001',
    '관리자',
    '안녕하세요! 포인트 출금 문의를 도와드리겠습니다. 어떤 부분이 궁금하신가요?'
),
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_2' LIMIT 1),
    'user',
    'sample_user_2',
    '김철수',
    '체험단 신청은 어떻게 하나요?'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE chat_rooms IS '사용자-관리자 채팅방 테이블';
COMMENT ON TABLE chat_messages IS '채팅 메시지 테이블';
COMMENT ON TABLE admin_chat_notifications IS '관리자 채팅 알림 테이블';
