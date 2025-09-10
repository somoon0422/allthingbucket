-- Supabase에 기본 데이터 삽입
-- 이 스크립트를 Supabase SQL Editor에서 실행하세요

-- 1. 기본 관리자 계정 생성
INSERT INTO admins (username, password, email, role) 
VALUES ('admin', 'admin123', 'admin@allthingbucket.com', 'admin')
ON CONFLICT (username) DO NOTHING;

-- 2. 기본 캠페인 데이터 생성
INSERT INTO campaigns (title, description, type, status, max_participants, current_participants, start_date, end_date, application_start, application_end, content_start, content_end, requirements, rewards, main_images, detail_images) 
VALUES 
('뷰티 제품 체험단 모집', '새로운 뷰티 제품을 체험해보실 분들을 모집합니다. 피부에 자극이 적고 효과가 뛰어난 제품을 무료로 체험해보세요!', 'beauty', 'active', 50, 15, '2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-15T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-20T00:00:00Z', '인스타그램 팔로워 1만명 이상', '제품 무료 제공 + 포인트 1000P', '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500"]', '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800", "https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800"]'),

('테크 가전 제품 리뷰', '최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다. 스마트홈 기기를 체험하고 솔직한 리뷰를 작성해주세요!', 'tech', 'active', 30, 8, '2024-01-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-10T00:00:00Z', '2024-01-01T00:00:00Z', '2024-12-15T00:00:00Z', '유튜브 구독자 5천명 이상', '제품 무료 제공 + 포인트 2000P', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500"]', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800"]'),

('패션 브랜드 체험단', '새로운 패션 브랜드의 의류를 체험해보실 분들을 모집합니다. 트렌디한 스타일을 경험해보세요!', 'fashion', 'active', 25, 5, '2024-02-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-02-01T00:00:00Z', '2024-12-20T00:00:00Z', '2024-02-01T00:00:00Z', '2024-12-25T00:00:00Z', '인스타그램 팔로워 5천명 이상', '의류 무료 제공 + 포인트 1500P', '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500"]', '["https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800", "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800"]'),

('푸드 브랜드 체험단', '맛있는 푸드 브랜드의 제품을 체험해보실 분들을 모집합니다. 새로운 맛을 경험하고 리뷰를 작성해주세요!', 'food', 'active', 40, 12, '2024-03-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-03-01T00:00:00Z', '2024-12-25T00:00:00Z', '2024-03-01T00:00:00Z', '2024-12-30T00:00:00Z', '블로그 또는 SNS 활동자', '제품 무료 제공 + 포인트 800P', '["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500"]', '["https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800"]'),

('홈데코 제품 체험단', '아름다운 홈데코 제품을 체험해보실 분들을 모집합니다. 집을 더 예쁘게 꾸며보세요!', 'home', 'active', 20, 3, '2024-04-01T00:00:00Z', '2024-12-31T00:00:00Z', '2024-04-01T00:00:00Z', '2024-12-28T00:00:00Z', '2024-04-01T00:00:00Z', '2024-12-31T00:00:00Z', '인스타그램 팔로워 3천명 이상', '제품 무료 제공 + 포인트 1200P', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500"]', '["https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800"]')
ON CONFLICT (id) DO NOTHING;

-- 3. 샘플 사용자 생성
INSERT INTO users (id, email, name, phone, google_id, profile_image_url, is_active) 
VALUES 
('user_1', 'test1@example.com', '김체험', '010-1234-5678', 'google_123456789', 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150', true),
('user_2', 'test2@example.com', '이리뷰', '010-2345-6789', 'google_987654321', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150', true),
('user_3', 'test3@example.com', '박인플루언서', '010-3456-7890', 'google_456789123', 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 사용자 프로필 생성
INSERT INTO user_profiles (user_id, nickname, bio, instagram_handle, youtube_channel, tiktok_handle, follower_count, engagement_rate, interests, location, age_range, gender) 
VALUES 
('user_1', '뷰티러버', '뷰티 제품을 사랑하는 사람입니다!', '@beauty_lover', 'BeautyLover Channel', '@beauty_lover_tiktok', 15000, 4.5, '["beauty", "skincare", "makeup"]', '서울', '20-30', 'female'),
('user_2', '테크리뷰어', '최신 테크 제품을 리뷰합니다', '@tech_reviewer', 'TechReview Channel', '@tech_reviewer_tiktok', 8000, 3.8, '["tech", "gadgets", "smartphone"]', '부산', '25-35', 'male'),
('user_3', '패션스타일리스트', '패션과 스타일링을 전문으로 합니다', '@fashion_stylist', 'FashionStyle Channel', '@fashion_stylist_tiktok', 25000, 5.2, '["fashion", "style", "lifestyle"]', '서울', '20-30', 'female')
ON CONFLICT (user_id) DO NOTHING;

-- 5. 사용자 포인트 생성
INSERT INTO user_points (user_id, points, earned_points, used_points) 
VALUES 
('user_1', 2500, 3000, 500),
('user_2', 1800, 2000, 200),
('user_3', 3200, 4000, 800)
ON CONFLICT (user_id) DO NOTHING;

-- 6. 사용자 신청 생성
INSERT INTO user_applications (user_id, campaign_id, status, application_data, applied_at) 
VALUES 
('user_1', (SELECT id FROM campaigns WHERE title = '뷰티 제품 체험단 모집' LIMIT 1), 'approved', '{"reason": "뷰티 제품에 관심이 많아서 신청합니다", "experience": "3년간 뷰티 제품 리뷰 경험"}', '2024-01-15T10:00:00Z'),
('user_2', (SELECT id FROM campaigns WHERE title = '테크 가전 제품 리뷰' LIMIT 1), 'pending', '{"reason": "테크 제품 리뷰 전문가입니다", "experience": "5년간 테크 리뷰 경험"}', '2024-01-20T14:30:00Z'),
('user_3', (SELECT id FROM campaigns WHERE title = '패션 브랜드 체험단' LIMIT 1), 'approved', '{"reason": "패션 스타일링 전문가입니다", "experience": "7년간 패션 업계 경험"}', '2024-02-05T09:15:00Z')
ON CONFLICT (id) DO NOTHING;

-- 7. 사용자 리뷰 생성
INSERT INTO user_reviews (user_id, campaign_id, rating, title, content, images, video_url, social_media_links, status, submitted_at) 
VALUES 
('user_1', (SELECT id FROM campaigns WHERE title = '뷰티 제품 체험단 모집' LIMIT 1), 5, '정말 좋은 뷰티 제품이었어요!', '피부에 정말 좋은 효과가 있었습니다. 특히 수분감이 뛰어나고 자극이 전혀 없었어요. 추천합니다!', '["https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400"]', 'https://youtube.com/watch?v=example1', '["https://instagram.com/p/example1"]', 'approved', '2024-01-25T16:00:00Z'),
('user_2', (SELECT id FROM campaigns WHERE title = '테크 가전 제품 리뷰' LIMIT 1), 4, '편리한 스마트 기기', '사용하기 편리하고 기능이 다양합니다. 다만 배터리 수명이 조금 아쉬워요.', '["https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400"]', 'https://youtube.com/watch?v=example2', '["https://instagram.com/p/example2"]', 'approved', '2024-02-10T11:30:00Z')
ON CONFLICT (id) DO NOTHING;

-- 8. 포인트 히스토리 생성
INSERT INTO points_history (user_id, campaign_id, points, type, description) 
VALUES 
('user_1', (SELECT id FROM campaigns WHERE title = '뷰티 제품 체험단 모집' LIMIT 1), 1000, 'earned', '뷰티 제품 체험단 참여 보상'),
('user_1', null, 500, 'used', '포인트 상품 구매'),
('user_2', (SELECT id FROM campaigns WHERE title = '테크 가전 제품 리뷰' LIMIT 1), 2000, 'earned', '테크 제품 리뷰 참여 보상'),
('user_3', (SELECT id FROM campaigns WHERE title = '패션 브랜드 체험단' LIMIT 1), 1500, 'earned', '패션 브랜드 체험단 참여 보상'),
('user_3', null, 800, 'used', '포인트 상품 구매')
ON CONFLICT (id) DO NOTHING;

-- 9. 알림 생성
INSERT INTO notifications (user_id, title, message, type, is_read) 
VALUES 
('user_1', '캠페인 승인 알림', '뷰티 제품 체험단 신청이 승인되었습니다!', 'success', false),
('user_2', '캠페인 신청 알림', '테크 가전 제품 리뷰 신청이 접수되었습니다.', 'info', false),
('user_3', '캠페인 승인 알림', '패션 브랜드 체험단 신청이 승인되었습니다!', 'success', false),
('user_1', '리뷰 작성 완료', '뷰티 제품 리뷰가 승인되었습니다. 포인트가 지급되었습니다.', 'success', true),
('user_2', '리뷰 작성 완료', '테크 제품 리뷰가 승인되었습니다. 포인트가 지급되었습니다.', 'success', true)
ON CONFLICT (id) DO NOTHING;

-- 10. 체험단 코드 생성
INSERT INTO experience_codes (code, campaign_id, is_used) 
VALUES 
('BEAUTY2024001', (SELECT id FROM campaigns WHERE title = '뷰티 제품 체험단 모집' LIMIT 1), false),
('BEAUTY2024002', (SELECT id FROM campaigns WHERE title = '뷰티 제품 체험단 모집' LIMIT 1), false),
('TECH2024001', (SELECT id FROM campaigns WHERE title = '테크 가전 제품 리뷰' LIMIT 1), false),
('FASHION2024001', (SELECT id FROM campaigns WHERE title = '패션 브랜드 체험단' LIMIT 1), false),
('FOOD2024001', (SELECT id FROM campaigns WHERE title = '푸드 브랜드 체험단' LIMIT 1), false)
ON CONFLICT (code) DO NOTHING;

-- 11. 인플루언서 프로필 생성
INSERT INTO influencer_profiles (user_id, platform, handle, follower_count, engagement_rate, verified) 
VALUES 
('user_1', 'instagram', '@beauty_lover', 15000, 4.5, true),
('user_1', 'youtube', 'BeautyLover Channel', 5000, 3.8, false),
('user_2', 'youtube', 'TechReview Channel', 8000, 4.2, true),
('user_3', 'instagram', '@fashion_stylist', 25000, 5.2, true),
('user_3', 'tiktok', '@fashion_stylist_tiktok', 12000, 4.8, false)
ON CONFLICT (id) DO NOTHING;

-- 데이터 삽입 완료 메시지
SELECT '기본 데이터가 성공적으로 삽입되었습니다!' as message;
