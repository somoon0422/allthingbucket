const express = require('express');
const { sendMessage, checkServiceStatus, MESSAGE_TYPES } = require('../services/messagingService');
const { validateSMSRequest } = require('../middleware/validation');

const router = express.Router();

// 🔥 메시지 발송 엔드포인트 (SMS + 카카오 알림톡)
router.post('/send', validateSMSRequest, async (req, res, next) => {
  try {
    const { to, message, from, type = MESSAGE_TYPES.SMS } = req.body;
    
    console.log('📱 메시지 발송 요청:', { 
      to, 
      message: message.substring(0, 50) + '...', 
      from, 
      type 
    });
    
    const result = await sendMessage({
      to,
      message,
      from,
      type
    });
    
    console.log('✅ 메시지 발송 성공:', result);
    
    res.json({
      success: true,
      message: '메시지가 성공적으로 발송되었습니다',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 메시지 발송 실패:', error);
    next(error);
  }
});

// 🔥 서비스 상태 확인 엔드포인트
router.get('/status', async (req, res) => {
  try {
    const status = await checkServiceStatus();
    
    res.json({
      success: true,
      message: '메시징 서비스 상태 확인 완료',
      services: status,
      availableTypes: Object.values(MESSAGE_TYPES)
    });
  } catch (error) {
    console.error('❌ 서비스 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '서비스 상태 확인에 실패했습니다'
    });
  }
});

// 🔥 SMS 전용 발송 엔드포인트 (하위 호환성)
router.post('/sms/send', validateSMSRequest, async (req, res, next) => {
  try {
    const { to, message, from } = req.body;
    
    console.log('📱 SMS 전용 발송 요청:', { to, message: message.substring(0, 50) + '...', from });
    
    const result = await sendMessage({
      to,
      message,
      from,
      type: MESSAGE_TYPES.SMS
    });
    
    console.log('✅ SMS 발송 성공:', result);
    
    res.json({
      success: true,
      message: 'SMS가 성공적으로 발송되었습니다',
      data: result
    });
    
  } catch (error) {
    console.error('❌ SMS 발송 실패:', error);
    next(error);
  }
});

// 🔥 카카오 알림톡 전용 발송 엔드포인트
router.post('/kakao/send', validateSMSRequest, async (req, res, next) => {
  try {
    const { to, message, variables = {} } = req.body;
    
    console.log('💬 카카오 알림톡 발송 요청:', { to, message: message.substring(0, 50) + '...' });
    
    const result = await sendMessage({
      to,
      message,
      type: MESSAGE_TYPES.KAKAO_ALIMTALK,
      variables
    });
    
    console.log('✅ 카카오 알림톡 발송 성공:', result);
    
    res.json({
      success: true,
      message: '카카오 알림톡이 성공적으로 발송되었습니다',
      data: result
    });
    
  } catch (error) {
    console.error('❌ 카카오 알림톡 발송 실패:', error);
    next(error);
  }
});

module.exports = router;
