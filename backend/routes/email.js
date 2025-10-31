const express = require('express');
const router = express.Router();
const naverEmailService = require('../services/naverEmailService');

// 이메일 전송 API (Gmail SMTP 폴백 포함)
router.post('/send-email', async (req, res) => {
  try {
    const { to, subject, message, userInfo } = req.body;

    if (!to || !subject || !message) {
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다 (to, subject, message)'
      });
    }

    console.log('📧 이메일 발송 요청:', { to, subject, messageLength: message.length });

    // 먼저 네이버 SENS 이메일 시도
    try {
      const naverResult = await naverEmailService.sendHtmlEmail({
        to: to,
        subject: subject,
        htmlContent: message,
        fromEmail: 'support@allthingbucket.com'
      });

      if (naverResult.success) {
        console.log('✅ 네이버 SENS 이메일 발송 성공:', naverResult.messageId);
        return res.json({
          success: true,
          messageId: naverResult.messageId,
          message: naverResult.message
        });
      }
    } catch (naverError) {
      console.warn('⚠️ 네이버 SENS 실패, Gmail로 폴백:', naverError.message);
    }

    // 네이버 SENS 실패 시 Gmail SMTP로 폴백
    const emailService = require('../services/emailService');
    const gmailResult = await emailService.sendEmail(to, subject, message);

    if (gmailResult.success) {
      console.log('✅ Gmail 이메일 발송 성공:', gmailResult.messageId);
      return res.json({
        success: true,
        messageId: gmailResult.messageId,
        message: '이메일이 성공적으로 발송되었습니다'
      });
    } else {
      throw new Error(gmailResult.error);
    }

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message || '이메일 발송 중 오류가 발생했습니다'
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
