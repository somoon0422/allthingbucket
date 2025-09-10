const express = require('express');
const router = express.Router();
const mongodbService = require('../services/mongodbService');

// 캠페인 목록 조회
router.get('/campaigns', async (req, res) => {
  try {
    console.log('📋 캠페인 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.campaign_id ? { _id: req.query.campaign_id } : undefined
    };
    
    const campaigns = await mongodbService.getCampaigns(options);
    
    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('❌ 캠페인 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 목록 조회
router.get('/user-profiles', async (req, res) => {
  try {
    console.log('📋 사용자 프로필 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.user_id ? { user_id: req.query.user_id } : undefined
    };
    
    const profiles = await mongodbService.getUserProfiles(options);
    
    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('❌ 사용자 프로필 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 조회
router.get('/user-profiles/:id', async (req, res) => {
  try {
    console.log('👤 사용자 프로필 조회 요청:', req.params.id);
    
    const profile = await mongodbService.getUserProfile(req.params.id);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      });
    }
    
    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('❌ 사용자 프로필 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 삭제
router.delete('/user-profiles/:id', async (req, res) => {
  try {
    console.log('🗑️ 사용자 프로필 삭제 요청:', req.params.id);
    
    const result = await mongodbService.deleteUserProfile(req.params.id);
    
    res.json({
      success: true,
      message: '사용자가 성공적으로 삭제되었습니다',
      data: result
    });
  } catch (error) {
    console.error('❌ 사용자 프로필 삭제 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 코드 목록 조회
router.get('/user-codes', async (req, res) => {
  try {
    console.log('🏷️ 사용자 코드 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.user_id ? { user_id: req.query.user_id } : undefined
    };
    
    const codes = await mongodbService.getUserCodes(options);
    
    res.json({
      success: true,
      data: codes,
      count: codes.length
    });
  } catch (error) {
    console.error('❌ 사용자 코드 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 인플루언서 프로필 목록 조회
router.get('/influencer-profiles', async (req, res) => {
  try {
    console.log('👤 인플루언서 프로필 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.user_id ? { user_id: req.query.user_id } : undefined
    };
    
    const profiles = await mongodbService.getInfluencerProfiles(options);
    
    res.json({
      success: true,
      data: profiles,
      count: profiles.length
    });
  } catch (error) {
    console.error('❌ 인플루언서 프로필 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 신청 목록 조회
router.get('/user-applications', async (req, res) => {
  try {
    console.log('📋 사용자 신청 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.user_id ? { user_id: req.query.user_id } : undefined
    };
    
    const applications = await mongodbService.getUserApplications(options);
    
    res.json({
      success: true,
      data: applications,
      count: applications.length
    });
  } catch (error) {
    console.error('❌ 사용자 신청 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 체험단 코드 목록 조회
router.get('/experience-codes', async (req, res) => {
  try {
    console.log('🎯 체험단 코드 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.campaign_id ? { campaign_id: req.query.campaign_id } : undefined
    };
    
    const codes = await mongodbService.getExperienceCodes(options);
    
    res.json({
      success: true,
      data: codes,
      count: codes.length
    });
  } catch (error) {
    console.error('❌ 체험단 코드 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 로그인
router.post('/admin-login', async (req, res) => {
  try {
    console.log('🔐 관리자 로그인 요청:', req.body);
    
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '사용자명과 비밀번호를 입력해주세요'
      });
    }
    
    // MongoDB에서 관리자 정보 조회
    const admin = await mongodbService.getAdminByUsername(username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: '존재하지 않는 관리자입니다'
      });
    }
    
    // 비밀번호 확인 (실제로는 해시 비교)
    if (admin.password_hash !== password) {
      return res.status(401).json({
        success: false,
        error: '비밀번호가 일치하지 않습니다'
      });
    }
    
    // 마지막 로그인 시간 업데이트
    await mongodbService.updateAdminLastLogin(admin._id);
    
    console.log('✅ 관리자 로그인 성공:', admin.username);
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        admin: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          is_active: admin.is_active
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 관리자 로그인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 데이터베이스 상태 확인
router.get('/status', async (req, res) => {
  try {
    const profiles = await mongodbService.getUserProfiles({ limit: 1 });
    
    res.json({
      success: true,
      message: '데이터베이스 연결 정상',
      data: {
        connected: true,
        userCount: profiles.length
      }
    });
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
