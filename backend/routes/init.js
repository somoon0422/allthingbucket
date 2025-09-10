const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');

// 초기 데이터 생성 엔드포인트
router.post('/init-data', async (req, res) => {
  try {
    console.log('🚀 Supabase 초기 데이터 생성 시작');

    // 1. 기본 관리자 계정 생성
    const adminData = {
      username: 'admin',
      password: 'admin123',
      email: 'admin@allthingbucket.com',
      role: 'admin'
    };
    
    // 관리자 계정이 이미 있는지 확인
    const existingAdmin = await supabaseService.loginAdmin('admin', 'admin123');
    if (!existingAdmin) {
      await supabaseService.supabase
        .from('admins')
        .insert([adminData])
        .select();
      console.log('✅ 관리자 계정 생성 완료');
    } else {
      console.log('ℹ️ 관리자 계정이 이미 존재합니다');
    }

    // 2. 기본 캠페인 데이터 생성
    const campaigns = [
      {
        title: '뷰티 제품 체험단 모집',
        description: '새로운 뷰티 제품을 체험해보실 분들을 모집합니다. 피부에 자극이 적고 효과가 뛰어난 제품을 무료로 체험해보세요!',
        type: 'beauty',
        status: 'active',
        max_participants: 50,
        current_participants: 15,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        application_start: '2024-01-01T00:00:00Z',
        application_end: '2024-12-15T00:00:00Z',
        content_start: '2024-01-01T00:00:00Z',
        content_end: '2024-12-20T00:00:00Z',
        requirements: '인스타그램 팔로워 1만명 이상',
        rewards: '제품 무료 제공 + 포인트 1000P',
        main_images: ['https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=500'],
        detail_images: [
          'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800',
          'https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=800'
        ]
      },
      {
        title: '테크 가전 제품 리뷰',
        description: '최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다. 스마트홈 기기를 체험하고 솔직한 리뷰를 작성해주세요!',
        type: 'tech',
        status: 'active',
        max_participants: 30,
        current_participants: 8,
        start_date: '2024-01-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        application_start: '2024-01-01T00:00:00Z',
        application_end: '2024-12-10T00:00:00Z',
        content_start: '2024-01-01T00:00:00Z',
        content_end: '2024-12-15T00:00:00Z',
        requirements: '유튜브 구독자 5천명 이상',
        rewards: '제품 무료 제공 + 포인트 2000P',
        main_images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=500'],
        detail_images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800']
      },
      {
        title: '패션 브랜드 체험단',
        description: '새로운 패션 브랜드의 의류를 체험해보실 분들을 모집합니다. 트렌디한 스타일을 경험해보세요!',
        type: 'fashion',
        status: 'active',
        max_participants: 25,
        current_participants: 5,
        start_date: '2024-02-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        application_start: '2024-02-01T00:00:00Z',
        application_end: '2024-12-20T00:00:00Z',
        content_start: '2024-02-01T00:00:00Z',
        content_end: '2024-12-25T00:00:00Z',
        requirements: '인스타그램 팔로워 5천명 이상',
        rewards: '의류 무료 제공 + 포인트 1500P',
        main_images: ['https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=500'],
        detail_images: [
          'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800',
          'https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800'
        ]
      },
      {
        title: '푸드 브랜드 체험단',
        description: '맛있는 푸드 브랜드의 제품을 체험해보실 분들을 모집합니다. 새로운 맛을 경험하고 리뷰를 작성해주세요!',
        type: 'food',
        status: 'active',
        max_participants: 40,
        current_participants: 12,
        start_date: '2024-03-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        application_start: '2024-03-01T00:00:00Z',
        application_end: '2024-12-25T00:00:00Z',
        content_start: '2024-03-01T00:00:00Z',
        content_end: '2024-12-30T00:00:00Z',
        requirements: '블로그 또는 SNS 활동자',
        rewards: '제품 무료 제공 + 포인트 800P',
        main_images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=500'],
        detail_images: ['https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800']
      },
      {
        title: '홈데코 제품 체험단',
        description: '아름다운 홈데코 제품을 체험해보실 분들을 모집합니다. 집을 더 예쁘게 꾸며보세요!',
        type: 'home',
        status: 'active',
        max_participants: 20,
        current_participants: 3,
        start_date: '2024-04-01T00:00:00Z',
        end_date: '2024-12-31T00:00:00Z',
        application_start: '2024-04-01T00:00:00Z',
        application_end: '2024-12-28T00:00:00Z',
        content_start: '2024-04-01T00:00:00Z',
        content_end: '2024-12-31T00:00:00Z',
        requirements: '인스타그램 팔로워 3천명 이상',
        rewards: '제품 무료 제공 + 포인트 1200P',
        main_images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
        detail_images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800']
      }
    ];

    // 캠페인 데이터 삽입
    for (const campaign of campaigns) {
      const existingCampaign = await supabaseService.getCampaigns({ 
        filter: { campaign_id: campaign.title } 
      });
      
      if (existingCampaign.length === 0) {
        await supabaseService.createCampaign(campaign);
        console.log(`✅ 캠페인 생성 완료: ${campaign.title}`);
      } else {
        console.log(`ℹ️ 캠페인이 이미 존재합니다: ${campaign.title}`);
      }
    }

    // 3. 샘플 사용자 생성
    const users = [
      {
        id: 'user_1',
        email: 'test1@example.com',
        name: '김체험',
        phone: '010-1234-5678',
        google_id: 'google_123456789',
        profile_image_url: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
        is_active: true
      },
      {
        id: 'user_2',
        email: 'test2@example.com',
        name: '이리뷰',
        phone: '010-2345-6789',
        google_id: 'google_987654321',
        profile_image_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
        is_active: true
      },
      {
        id: 'user_3',
        email: 'test3@example.com',
        name: '박인플루언서',
        phone: '010-3456-7890',
        google_id: 'google_456789123',
        profile_image_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
        is_active: true
      }
    ];

    for (const user of users) {
      const existingUser = await supabaseService.getUser(user.id);
      if (!existingUser) {
        await supabaseService.createUser(user);
        console.log(`✅ 사용자 생성 완료: ${user.name}`);
      } else {
        console.log(`ℹ️ 사용자가 이미 존재합니다: ${user.name}`);
      }
    }

    res.json({
      success: true,
      message: 'Supabase 초기 데이터가 성공적으로 생성되었습니다!',
      data: {
        campaigns: campaigns.length,
        users: users.length,
        admin: 1
      }
    });

  } catch (error) {
    console.error('❌ Supabase 초기 데이터 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
