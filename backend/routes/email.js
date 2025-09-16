const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// 이메일 전송 설정
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER || 'your-email@gmail.com',
      pass: process.env.EMAIL_PASS || 'your-app-password'
    }
  });
};

// 이메일 전송 API
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

    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: to,
      subject: subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h2 style="color: #333; margin-bottom: 20px;">올띵버킷 체험단</h2>
            <div style="background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              ${message}
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
              <p>올띵버킷 체험단에서 발송된 메시지입니다.</p>
              <p>문의사항이 있으시면 support@allthingbucket.com으로 연락해주세요.</p>
            </div>
          </div>
        </div>
      `
    };

    const result = await transporter.sendMail(mailOptions);
    
    console.log('✅ 이메일 발송 성공:', result.messageId);
    
    res.json({
      success: true,
      messageId: result.messageId,
      message: '이메일이 성공적으로 발송되었습니다'
    });

  } catch (error) {
    console.error('❌ 이메일 발송 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 이메일 설정 확인 API
router.get('/email-status', async (req, res) => {
  try {
    const hasEmailUser = !!process.env.EMAIL_USER;
    const hasEmailPass = !!process.env.EMAIL_PASS;
    
    res.json({
      success: true,
      configured: hasEmailUser && hasEmailPass,
      hasUser: hasEmailUser,
      hasPass: hasEmailPass
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
