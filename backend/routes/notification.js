const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');

// 인증번호 발송
router.post('/send-verification', async (req, res) => {
  try {
    const { userId, type = 'phone' } = req.body;
    
    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // 6자리 인증번호 생성
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // 인증번호 발송
    const result = await notificationService.sendVerificationCode(userId, code, type);
    
    if (result.success) {
      // 인증번호를 세션 또는 임시 저장소에 저장 (실제 구현에서는 Redis 등 사용)
      // 여기서는 간단히 응답에 포함
      res.json({
        success: true,
        message: result.message,
        verificationCode: code, // 개발용 - 실제로는 제거해야 함
        results: result.results
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || '인증번호 발송에 실패했습니다',
        results: result.results
      });
    }

  } catch (error) {
    console.error('인증번호 발송 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 승인 알림 발송
router.post('/send-approval', async (req, res) => {
  try {
    const { userId, campaignName } = req.body;
    
    if (!userId || !campaignName) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 캠페인명이 필요합니다'
      });
    }

    const result = await notificationService.sendApprovalNotification(userId, campaignName);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        results: result.results
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || '승인 알림 발송에 실패했습니다',
        results: result.results
      });
    }

  } catch (error) {
    console.error('승인 알림 발송 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 거절 알림 발송
router.post('/send-rejection', async (req, res) => {
  try {
    const { userId, campaignName } = req.body;
    
    if (!userId || !campaignName) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID와 캠페인명이 필요합니다'
      });
    }

    const result = await notificationService.sendRejectionNotification(userId, campaignName);
    
    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        results: result.results
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error || '거절 알림 발송에 실패했습니다',
        results: result.results
      });
    }

  } catch (error) {
    console.error('거절 알림 발송 API 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 서비스 상태 확인
router.get('/status', (req, res) => {
  try {
    const status = notificationService.getServiceStatus();
    res.json({
      success: true,
      status: status
    });
  } catch (error) {
    console.error('서비스 상태 확인 오류:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
