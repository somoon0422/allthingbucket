-- 기존 채팅 테이블 삭제 후 JSON 최적화된 테이블로 재생성

-- 기존 테이블 삭제 (외래키 때문에 순서 중요)
DROP TABLE IF EXISTS admin_chat_notifications CASCADE;
DROP TABLE IF EXISTS chat_conversations CASCADE;
DROP TABLE IF EXISTS chat_messages CASCADE;
DROP TABLE IF EXISTS chat_rooms CASCADE;
DROP TABLE IF EXISTS user_online_status CASCADE;

-- 최적화된 채팅방 테이블 생성
CREATE TABLE chat_rooms (
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

-- JSON 형태로 메시지를 저장하는 최적화된 테이블
CREATE TABLE chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    conversation_data JSONB NOT NULL, -- 질문과 답변을 JSON으로 저장
    message_count INTEGER DEFAULT 0, -- 이 대화에 포함된 메시지 수
    first_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    last_message_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 관리자 알림 테이블 (간소화)
CREATE TABLE admin_chat_notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_room_id UUID NOT NULL REFERENCES chat_rooms(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    user_name TEXT,
    last_message_preview TEXT,
    unread_count INTEGER DEFAULT 1, -- 읽지 않은 메시지 수
    is_read BOOLEAN DEFAULT FALSE,
    last_notification_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 온라인 상태 테이블
CREATE TABLE user_online_status (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL UNIQUE,
    is_online BOOLEAN DEFAULT FALSE,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    connection_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_chat_rooms_user_id ON chat_rooms(user_id);
CREATE INDEX idx_chat_rooms_status ON chat_rooms(status);
CREATE INDEX idx_chat_rooms_last_message_at ON chat_rooms(last_message_at);

CREATE INDEX idx_chat_conversations_room_id ON chat_conversations(chat_room_id);
CREATE INDEX idx_chat_conversations_last_message_at ON chat_conversations(last_message_at);
CREATE INDEX idx_chat_conversations_message_count ON chat_conversations(message_count);

-- JSONB 인덱스 (메시지 검색용)
CREATE INDEX idx_chat_conversations_conversation_data ON chat_conversations USING GIN (conversation_data);

CREATE INDEX idx_admin_chat_notifications_is_read ON admin_chat_notifications(is_read);

-- 온라인 상태 테이블 인덱스
CREATE INDEX idx_user_online_status_user_id ON user_online_status(user_id);
CREATE INDEX idx_user_online_status_is_online ON user_online_status(is_online);
CREATE INDEX idx_admin_chat_notifications_created_at ON admin_chat_notifications(created_at);
CREATE INDEX idx_admin_chat_notifications_chat_room_id ON admin_chat_notifications(chat_room_id);

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

CREATE TRIGGER update_chat_conversations_updated_at 
    BEFORE UPDATE ON chat_conversations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 채팅방 마지막 메시지 시간 업데이트 트리거
CREATE OR REPLACE FUNCTION update_chat_room_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE chat_rooms 
    SET last_message_at = NEW.last_message_at,
        updated_at = NOW()
    WHERE id = NEW.chat_room_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_chat_room_last_message_trigger
    AFTER INSERT OR UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION update_chat_room_last_message();

-- 관리자 알림 생성/업데이트 트리거
CREATE OR REPLACE FUNCTION create_or_update_admin_chat_notification()
RETURNS TRIGGER AS $$
DECLARE
    room_user_id TEXT;
    room_user_name TEXT;
    existing_notification UUID;
BEGIN
    -- 채팅방 정보 가져오기
    SELECT user_id, user_name INTO room_user_id, room_user_name
    FROM chat_rooms 
    WHERE id = NEW.chat_room_id;
    
    -- 기존 알림이 있는지 확인
    SELECT id INTO existing_notification
    FROM admin_chat_notifications 
    WHERE chat_room_id = NEW.chat_room_id AND is_read = FALSE
    LIMIT 1;
    
    IF existing_notification IS NOT NULL THEN
        -- 기존 알림 업데이트
        UPDATE admin_chat_notifications 
        SET 
            unread_count = unread_count + 1,
            last_notification_at = NEW.last_message_at,
            last_message_preview = (
                SELECT elem->>'message_text' 
                FROM jsonb_array_elements(NEW.conversation_data) AS elem 
                WHERE elem->>'sender_type' = 'user' 
                ORDER BY (elem->>'timestamp')::timestamp DESC 
                LIMIT 1
            )
        WHERE id = existing_notification;
    ELSE
        -- 새 알림 생성
        INSERT INTO admin_chat_notifications (
            chat_room_id, 
            user_id, 
            user_name, 
            last_message_preview,
            unread_count,
            is_read,
            last_notification_at
        ) VALUES (
            NEW.chat_room_id,
            room_user_id,
            room_user_name,
            (
                SELECT elem->>'message_text' 
                FROM jsonb_array_elements(NEW.conversation_data) AS elem 
                WHERE elem->>'sender_type' = 'user' 
                ORDER BY (elem->>'timestamp')::timestamp DESC 
                LIMIT 1
            ),
            1,
            FALSE,
            NEW.last_message_at
        );
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER create_or_update_admin_chat_notification_trigger
    AFTER INSERT OR UPDATE ON chat_conversations
    FOR EACH ROW EXECUTE FUNCTION create_or_update_admin_chat_notification();

-- RLS 정책 (Row Level Security)
ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_chat_notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 채팅방만 볼 수 있음
CREATE POLICY "Users can view their own chat rooms" ON chat_rooms
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own chat rooms" ON chat_rooms
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

-- 사용자는 자신의 채팅방의 대화만 볼 수 있음
CREATE POLICY "Users can view conversations in their chat rooms" ON chat_conversations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_conversations.chat_room_id 
            AND chat_rooms.user_id = auth.uid()::text
        )
    );

CREATE POLICY "Users can create conversations in their chat rooms" ON chat_conversations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM chat_rooms 
            WHERE chat_rooms.id = chat_room_id 
            AND chat_rooms.user_id = auth.uid()::text
        )
    );

-- 관리자는 모든 채팅에 접근 가능
CREATE POLICY "Admins can manage all chat rooms" ON chat_rooms
    FOR ALL USING (true);

CREATE POLICY "Admins can manage all conversations" ON chat_conversations
    FOR ALL USING (true);

CREATE POLICY "Admins can manage all chat notifications" ON admin_chat_notifications
    FOR ALL USING (true);

-- 온라인 상태 테이블 RLS 정책
ALTER TABLE user_online_status ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 온라인 상태만 관리 가능
CREATE POLICY "Users can manage their own online status" ON user_online_status
    FOR ALL USING (user_id = auth.uid()::text);

-- 관리자는 모든 사용자의 온라인 상태 조회 가능
CREATE POLICY "Admins can view all online status" ON user_online_status
    FOR SELECT USING (true);

-- 샘플 데이터 (테스트용)
INSERT INTO chat_rooms (user_id, user_name, user_email, status) VALUES
('sample_user_1', 'Hong Gil Dong', 'hong@example.com', 'active'),
('sample_user_2', 'Kim Chul Soo', 'kim@example.com', 'active'),
('sample_user_3', 'Lee Young Hee', 'lee@example.com', 'closed')
ON CONFLICT DO NOTHING;

-- 샘플 대화 데이터 (JSON 형태)
INSERT INTO chat_conversations (
    chat_room_id, 
    conversation_data, 
    message_count,
    first_message_at,
    last_message_at
) VALUES
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_1' LIMIT 1),
    '[
        {
            "id": "msg_1",
            "sender_type": "user",
            "sender_name": "Hong Gil Dong",
            "message_text": "안녕하세요! 포인트 출금 관련해서 문의드립니다.",
            "timestamp": "2024-01-15T10:00:00Z"
        },
        {
            "id": "msg_2", 
            "sender_type": "admin",
            "sender_name": "Admin",
            "message_text": "안녕하세요! 포인트 출금 문의를 도와드리겠습니다. 어떤 부분이 궁금하신가요?",
            "timestamp": "2024-01-15T10:01:00Z"
        },
        {
            "id": "msg_3",
            "sender_type": "user", 
            "sender_name": "Hong Gil Dong",
            "message_text": "1원 인증이 제대로 안되는 것 같아요.",
            "timestamp": "2024-01-15T10:02:00Z"
        },
        {
            "id": "msg_4",
            "sender_type": "admin",
            "sender_name": "Admin", 
            "message_text": "1원 인증은 입금자명이 정확해야 합니다. 입금자명이 ''AllThingBucket''으로 되어있는지 확인해주세요.",
            "timestamp": "2024-01-15T10:03:00Z"
        }
    ]'::jsonb,
    4,
    '2024-01-15T10:00:00Z',
    '2024-01-15T10:03:00Z'
),
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_2' LIMIT 1),
    '[
        {
            "id": "msg_5",
            "sender_type": "user",
            "sender_name": "Kim Chul Soo", 
            "message_text": "체험단 신청은 어떻게 하나요?",
            "timestamp": "2024-01-15T11:00:00Z"
        },
        {
            "id": "msg_6",
            "sender_type": "admin",
            "sender_name": "Admin",
            "message_text": "체험단 신청은 홈페이지의 체험단 신청 탭에서 가능합니다. 선정되면 개별 연락드리겠습니다.",
            "timestamp": "2024-01-15T11:01:00Z"
        }
    ]'::jsonb,
    2,
    '2024-01-15T11:00:00Z', 
    '2024-01-15T11:01:00Z'
)
ON CONFLICT DO NOTHING;

-- 샘플 알림 데이터
INSERT INTO admin_chat_notifications (
    chat_room_id,
    user_id,
    user_name,
    last_message_preview,
    unread_count,
    is_read,
    last_notification_at
) VALUES
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_1' LIMIT 1),
    'sample_user_1',
    'Hong Gil Dong',
    '1원 인증이 제대로 안되는 것 같아요.',
    2,
    FALSE,
    '2024-01-15T10:03:00Z'
),
(
    (SELECT id FROM chat_rooms WHERE user_id = 'sample_user_2' LIMIT 1),
    'sample_user_2', 
    'Kim Chul Soo',
    '체험단 신청은 어떻게 하나요?',
    1,
    FALSE,
    '2024-01-15T11:01:00Z'
)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE chat_rooms IS 'User-Admin Chat Rooms Table (Optimized)';
COMMENT ON TABLE chat_conversations IS 'Chat Conversations Data (JSON Message Storage)';
COMMENT ON TABLE admin_chat_notifications IS 'Admin Chat Notifications Table (Simplified)';
