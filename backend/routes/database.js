const express = require('express');
const router = express.Router();
const databaseService = require('../services/databaseService');

// 사용자 프로필 목록 조회
router.get('/user-profiles', async (req, res) => {
  try {
    console.log('📋 사용자 프로필 목록 조회 요청:', req.query);
    
    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.user_id ? { user_id: req.query.user_id } : undefined
    };
    
    const profiles = await databaseService.getUserProfiles(options);
    
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
    
    const profile = await databaseService.getUserProfile(req.params.id);
    
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
    
    const result = await databaseService.deleteUserProfile(req.params.id);
    
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

// 데이터베이스 상태 확인
router.get('/status', async (req, res) => {
  try {
    const profiles = await databaseService.getUserProfiles({ limit: 1 });
    
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
