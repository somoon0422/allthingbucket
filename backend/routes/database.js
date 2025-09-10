const express = require('express');
const router = express.Router();
const supabaseService = require('../services/supabaseService');

// 캠페인 목록 조회
router.get('/campaigns', async (req, res) => {
  try {
    console.log('📋 Supabase 캠페인 목록 조회 요청:', req.query);

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.campaign_id ? { campaign_id: req.query.campaign_id } : undefined
    };

    console.log('📋 Supabase 조회 옵션:', options);

    const campaigns = await supabaseService.getCampaigns(options);

    console.log('📋 Supabase 최종 반환할 캠페인 수:', campaigns.length);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('❌ Supabase 캠페인 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 생성
router.post('/campaigns', async (req, res) => {
  try {
    console.log('📝 Supabase 캠페인 생성 요청:', req.body);
    
    const campaignData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createCampaign(campaignData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 캠페인이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 캠페인 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 수정
router.put('/campaigns/:id', async (req, res) => {
  try {
    console.log('📝 Supabase 캠페인 수정 요청:', req.params.id, req.body);
    
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.updateCampaign(req.params.id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 캠페인이 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 캠페인 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 삭제
router.delete('/campaigns/:id', async (req, res) => {
  try {
    console.log('🗑️ Supabase 캠페인 삭제 요청:', req.params.id);
    
    const result = await supabaseService.deleteCampaign(req.params.id);
    
    res.json({
      success: true,
      message: 'Supabase 캠페인이 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 캠페인 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 목록 조회
router.get('/user-profiles', async (req, res) => {
  try {
    console.log('👤 Supabase 사용자 프로필 목록 조회 요청:', req.query);

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.user_id ? { user_id: req.query.user_id } : undefined
    };

    const profiles = await supabaseService.getUserProfiles(options);

    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 프로필 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 생성
router.post('/user-profiles', async (req, res) => {
  try {
    console.log('👤 Supabase 사용자 프로필 생성 요청:', req.body);
    
    const profileData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createUserProfile(profileData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 프로필이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 프로필 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 수정
router.put('/user-profiles/:id', async (req, res) => {
  try {
    console.log('👤 Supabase 사용자 프로필 수정 요청:', req.params.id, req.body);
    
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.updateUserProfile(req.params.id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 프로필이 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 프로필 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 리뷰 목록 조회
router.get('/user-reviews', async (req, res) => {
  try {
    console.log('⭐ Supabase 사용자 리뷰 목록 조회 요청:', req.query);

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const reviews = await supabaseService.getUserReviews(options);

    res.json({
      success: true,
      data: reviews,
      count: reviews.length
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 리뷰 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 리뷰 생성
router.post('/user-reviews', async (req, res) => {
  try {
    console.log('⭐ Supabase 사용자 리뷰 생성 요청:', req.body);
    
    const reviewData = {
      ...req.body,
      submitted_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createUserReview(reviewData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 리뷰가 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 리뷰 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 리뷰 수정
router.put('/user-reviews/:id', async (req, res) => {
  try {
    console.log('⭐ Supabase 사용자 리뷰 수정 요청:', req.params.id, req.body);
    
    const result = await supabaseService.updateUserReview(req.params.id, req.body);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 리뷰가 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 리뷰 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 신청 목록 조회
router.get('/user-applications', async (req, res) => {
  try {
    console.log('📝 Supabase 사용자 신청 목록 조회 요청:', req.query);

    const options = {
      user_id: req.query.user_id,
      campaign_id: req.query.campaign_id,
      status: req.query.status
    };

    const applications = await supabaseService.getUserApplications(options);

    res.json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 신청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 신청 생성
router.post('/user-applications', async (req, res) => {
  try {
    console.log('📝 Supabase 사용자 신청 생성 요청:', req.body);
    
    const applicationData = {
      ...req.body,
      applied_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createUserApplication(applicationData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 신청이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 신청 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 신청 수정
router.put('/user-applications/:id', async (req, res) => {
  try {
    console.log('📝 Supabase 사용자 신청 수정 요청:', req.params.id, req.body);
    
    const updateData = {
      ...req.body,
      reviewed_at: new Date().toISOString()
    };
    
    const result = await supabaseService.updateUserApplication(req.params.id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 신청이 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 신청 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 포인트 조회
router.get('/user-points/:userId', async (req, res) => {
  try {
    console.log('💰 Supabase 사용자 포인트 조회 요청:', req.params.userId);

    const points = await supabaseService.getUserPoints(req.params.userId);

    res.json({
      success: true,
      data: points
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 포인트 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 포인트 업데이트
router.put('/user-points/:userId', async (req, res) => {
  try {
    console.log('💰 Supabase 사용자 포인트 업데이트 요청:', req.params.userId, req.body);
    
    const result = await supabaseService.updateUserPoints(req.params.userId, req.body);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 사용자 포인트가 성공적으로 업데이트되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 사용자 포인트 업데이트 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 포인트 히스토리 조회
router.get('/points-history/:userId', async (req, res) => {
  try {
    console.log('📊 Supabase 포인트 히스토리 조회 요청:', req.params.userId);

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const history = await supabaseService.getPointsHistory(req.params.userId, options);

    res.json({
      success: true,
      data: history,
      count: history.length
    });
  } catch (error) {
    console.error('❌ Supabase 포인트 히스토리 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 포인트 히스토리 추가
router.post('/points-history', async (req, res) => {
  try {
    console.log('📊 Supabase 포인트 히스토리 추가 요청:', req.body);
    
    const historyData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const result = await supabaseService.addPointsHistory(historyData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 포인트 히스토리가 성공적으로 추가되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 포인트 히스토리 추가 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 알림 조회
router.get('/notifications/:userId', async (req, res) => {
  try {
    console.log('🔔 Supabase 알림 조회 요청:', req.params.userId);

    const options = {
      is_read: req.query.is_read !== undefined ? req.query.is_read === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit) : undefined
    };

    const notifications = await supabaseService.getUserNotifications(req.params.userId, options);

    res.json({
      success: true,
      data: notifications,
      count: notifications.length
    });
  } catch (error) {
    console.error('❌ Supabase 알림 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 알림 생성
router.post('/notifications', async (req, res) => {
  try {
    console.log('🔔 Supabase 알림 생성 요청:', req.body);
    
    const notificationData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createNotification(notificationData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 알림이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 알림 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 알림 읽음 처리
router.put('/notifications/:id/read', async (req, res) => {
  try {
    console.log('🔔 Supabase 알림 읽음 처리 요청:', req.params.id);
    
    const result = await supabaseService.markNotificationAsRead(req.params.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 알림이 성공적으로 읽음 처리되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 알림 읽음 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 출금 요청 조회
router.get('/withdrawal-requests', async (req, res) => {
  try {
    console.log('💸 Supabase 출금 요청 조회 요청:', req.query);

    const options = {
      user_id: req.query.user_id,
      status: req.query.status
    };

    const requests = await supabaseService.getWithdrawalRequests(options);

    res.json({
      success: true,
      data: requests,
      count: requests.length
    });
  } catch (error) {
    console.error('❌ Supabase 출금 요청 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 출금 요청 생성
router.post('/withdrawal-requests', async (req, res) => {
  try {
    console.log('💸 Supabase 출금 요청 생성 요청:', req.body);
    
    const requestData = {
      ...req.body,
      requested_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createWithdrawalRequest(requestData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 출금 요청이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 출금 요청 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 출금 요청 수정
router.put('/withdrawal-requests/:id', async (req, res) => {
  try {
    console.log('💸 Supabase 출금 요청 수정 요청:', req.params.id, req.body);
    
    const updateData = {
      ...req.body,
      processed_at: new Date().toISOString()
    };
    
    const result = await supabaseService.updateWithdrawalRequest(req.params.id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 출금 요청이 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 출금 요청 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 체험단 코드 조회
router.get('/experience-codes', async (req, res) => {
  try {
    console.log('🎫 Supabase 체험단 코드 조회 요청:', req.query);

    const options = {
      campaign_id: req.query.campaign_id,
      is_used: req.query.is_used !== undefined ? req.query.is_used === 'true' : undefined
    };

    const codes = await supabaseService.getExperienceCodes(options);

    res.json({
      success: true,
      data: codes,
      count: codes.length
    });
  } catch (error) {
    console.error('❌ Supabase 체험단 코드 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 체험단 코드 생성
router.post('/experience-codes', async (req, res) => {
  try {
    console.log('🎫 Supabase 체험단 코드 생성 요청:', req.body);
    
    const codeData = {
      ...req.body,
      created_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createExperienceCode(codeData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 체험단 코드가 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 체험단 코드 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 체험단 코드 사용 처리
router.put('/experience-codes/:id/use', async (req, res) => {
  try {
    console.log('🎫 Supabase 체험단 코드 사용 처리 요청:', req.params.id, req.body);
    
    const result = await supabaseService.useExperienceCode(req.params.id, req.body.user_id);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 체험단 코드가 성공적으로 사용 처리되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 체험단 코드 사용 처리 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 인플루언서 프로필 조회
router.get('/influencer-profiles', async (req, res) => {
  try {
    console.log('🌟 Supabase 인플루언서 프로필 조회 요청:', req.query);

    const options = {
      user_id: req.query.user_id,
      platform: req.query.platform
    };

    const profiles = await supabaseService.getInfluencerProfiles(options);

    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('❌ Supabase 인플루언서 프로필 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 인플루언서 프로필 생성
router.post('/influencer-profiles', async (req, res) => {
  try {
    console.log('🌟 Supabase 인플루언서 프로필 생성 요청:', req.body);
    
    const profileData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createInfluencerProfile(profileData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 인플루언서 프로필이 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 인플루언서 프로필 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 인플루언서 프로필 수정
router.put('/influencer-profiles/:id', async (req, res) => {
  try {
    console.log('🌟 Supabase 인플루언서 프로필 수정 요청:', req.params.id, req.body);
    
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.updateInfluencerProfile(req.params.id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 인플루언서 프로필이 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 인플루언서 프로필 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 데이터베이스 상태 확인
router.get('/status', async (req, res) => {
  try {
    console.log('🔍 Supabase 데이터베이스 상태 확인 요청');
    
    const status = await supabaseService.getDatabaseStatus();
    
    res.json(status);
  } catch (error) {
    console.error('❌ Supabase 데이터베이스 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 사용자 목록 조회
router.get('/admin-users', async (req, res) => {
  try {
    console.log('👑 Supabase 관리자 사용자 목록 조회 요청:', req.query);

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.admin_id ? { admin_id: req.query.admin_id } : undefined
    };

    console.log('👑 Supabase 조회 옵션:', options);

    const admins = await supabaseService.getAdmins(options);

    console.log('👑 Supabase 최종 반환할 관리자 수:', admins.length);

    res.json({
      success: true,
      data: admins,
      count: admins.length
    });
  } catch (error) {
    console.error('❌ Supabase 관리자 사용자 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 사용자 생성
router.post('/admin-users', async (req, res) => {
  try {
    console.log('👑 Supabase 관리자 사용자 생성 요청:', req.body);
    
    const adminData = {
      ...req.body,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.createAdmin(adminData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 관리자 사용자가 성공적으로 생성되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 관리자 사용자 생성 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 사용자 수정
router.put('/admin-users/:id', async (req, res) => {
  try {
    console.log('👑 Supabase 관리자 사용자 수정 요청:', req.params.id, req.body);
    
    const updateData = {
      ...req.body,
      updated_at: new Date().toISOString()
    };
    
    const result = await supabaseService.updateAdmin(req.params.id, updateData);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 관리자 사용자가 성공적으로 수정되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 관리자 사용자 수정 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 사용자 삭제
router.delete('/admin-users/:id', async (req, res) => {
  try {
    console.log('👑 Supabase 관리자 사용자 삭제 요청:', req.params.id);
    
    const result = await supabaseService.deleteAdmin(req.params.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Supabase 관리자 사용자가 성공적으로 삭제되었습니다'
    });
  } catch (error) {
    console.error('❌ Supabase 관리자 사용자 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;