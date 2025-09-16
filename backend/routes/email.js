const express = require('express');
const router = express.Router();
const naverEmailService = require('../services/naverEmailService');

// 이메일 전송 API (네이버 SENS 사용)
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, message, userInfo } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다 (to, subject, message)'
      });
    }

    console.log('📧 네이버 SENS 이메일 발송 요청:', { to, subject, messageLength: message.length });

    // HTML 이메일 발송
    const result = await naverEmailService.sendHtmlEmail({
      to: to,
      subject: subject,
      htmlContent: message,
      fromEmail: 'noreply@allthingbucket.com'
    });

    if (!result.success) {
      console.error('❌ 네이버 SENS 이메일 발송 실패:', result.error);
      return res.status(500).json({
        success: false,
        error: result.error
      });
    }
    
    console.log('✅ 네이버 SENS 이메일 발송 성공:', result.messageId);
    
    res.json({
      success: true,
      messageId: result.messageId,
      message: result.message
    });

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 이메일 설정 확인 API (네이버 SENS)
router.get('/email-status', async (req, res) => {
  try {
    const status = await naverEmailService.checkServiceStatus();
    
    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
