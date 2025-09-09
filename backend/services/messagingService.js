const { sendSMS } = require('./smsService');
const { sendKakaoAlimtalk } = require('./kakaoService');

// 🔥 메시지 발송 타입
const MESSAGE_TYPES = {
  SMS: 'sms',
  KAKAO_ALIMTALK: 'kakao_alimtalk',
  BOTH: 'both'
};

// 🔥 통합 메시지 발송 함수
async function sendMessage({ to, message, type = MESSAGE_TYPES.SMS, from, variables = {} }) {
  const results = [];
  const errors = [];

  try {
    console.log(`📱 메시지 발송 시작: ${type}`, { to, messageLength: message.length });

    // 🔥 SMS 발송
    if (type === MESSAGE_TYPES.SMS || type === MESSAGE_TYPES.BOTH) {
      try {
        const smsResult = await sendSMS({ to, message, from });
        results.push({
          service: 'sms',
          success: true,
          data: smsResult
        });
        console.log('✅ SMS 발송 성공');
      } catch (smsError) {
        errors.push({
          service: 'sms',
          error: smsError.message
        });
        console.error('❌ SMS 발송 실패:', smsError.message);
      }
    }

    // 🔥 카카오 알림톡 발송
    if (type === MESSAGE_TYPES.KAKAO_ALIMTALK || type === MESSAGE_TYPES.BOTH) {
      try {
        const kakaoResult = await sendKakaoAlimtalk({ to, message, variables });
        results.push({
          service: 'kakao_alimtalk',
          success: true,
          data: kakaoResult
        });
        console.log('✅ 카카오 알림톡 발송 성공');
      } catch (kakaoError) {
        errors.push({
          service: 'kakao_alimtalk',
          error: kakaoError.message
        });
        console.error('❌ 카카오 알림톡 발송 실패:', kakaoError.message);
      }
    }

    // 🔥 결과 분석
    const successCount = results.length;
    const errorCount = errors.length;

    if (successCount === 0) {
      throw new Error(`모든 메시지 발송이 실패했습니다: ${errors.map(e => e.error).join(', ')}`);
    }

    return {
      success: true,
      message: `${successCount}개 서비스에서 메시지가 발송되었습니다`,
      results,
      errors: errorCount > 0 ? errors : undefined,
      summary: {
        total: successCount + errorCount,
        success: successCount,
        failed: errorCount
      }
    };

  } catch (error) {
    console.error('❌ 메시지 발송 실패:', error);
    throw error;
  }
}

// 🔥 서비스 상태 확인 함수
async function checkServiceStatus() {
  const status = {
    sms: {
      available: false,
      config: {
        hasAccessKey: !!process.env.SMS_ACCESS_KEY,
        hasSecretKey: !!process.env.SMS_SECRET_KEY,
        hasServiceId: !!process.env.SMS_SERVICE_ID,
        fromNumber: process.env.SMS_FROM_NUMBER || '설정되지 않음'
      }
    },
    kakao_alimtalk: {
      available: false,
      config: {
        hasAccessKey: !!process.env.SMS_ACCESS_KEY,
        hasSecretKey: !!process.env.SMS_SECRET_KEY,
        hasServiceId: !!process.env.SMS_SERVICE_ID,
        hasPlusFriendId: !!process.env.KAKAO_PLUS_FRIEND_ID,
        hasTemplateCode: !!process.env.KAKAO_TEMPLATE_CODE
      }
    }
  };

  // 🔥 SMS 설정 확인
  if (status.sms.config.hasAccessKey && status.sms.config.hasSecretKey && status.sms.config.hasServiceId) {
    status.sms.available = true;
  }

  // 🔥 SENS 알림톡 설정 확인
  if (status.kakao_alimtalk.config.hasAccessKey && 
      status.kakao_alimtalk.config.hasSecretKey && 
      status.kakao_alimtalk.config.hasServiceId &&
      status.kakao_alimtalk.config.hasPlusFriendId &&
      status.kakao_alimtalk.config.hasTemplateCode) {
    status.kakao_alimtalk.available = true;
  }

  return status;
}

// 🔥 메시지 발송 테스트 함수
async function testMessaging() {
  console.log('🧪 통합 메시징 서비스 테스트 시작...\n');
  
  const status = await checkServiceStatus();
  console.log('📋 서비스 상태:', JSON.stringify(status, null, 2));
  
  const testResults = [];
  
  // 🔥 SMS 테스트
  if (status.sms.available) {
    try {
      console.log('\n📱 SMS 발송 테스트...');
      const smsResult = await sendSMS({
        to: '01012345678',
        message: '올띵버킷 SMS 테스트입니다.',
        from: process.env.SMS_FROM_NUMBER
      });
      testResults.push({ service: 'sms', success: true, result: smsResult });
      console.log('✅ SMS 테스트 성공');
    } catch (error) {
      testResults.push({ service: 'sms', success: false, error: error.message });
      console.error('❌ SMS 테스트 실패:', error.message);
    }
  } else {
    console.log('⚠️ SMS 서비스 설정이 완료되지 않았습니다');
  }
  
  // 🔥 카카오 알림톡 테스트
  if (status.kakao_alimtalk.available) {
    try {
      console.log('\n💬 카카오 알림톡 발송 테스트...');
      const kakaoResult = await sendKakaoAlimtalk({
        to: '01012345678',
        message: '올띵버킷 카카오 알림톡 테스트입니다.'
      });
      testResults.push({ service: 'kakao_alimtalk', success: true, result: kakaoResult });
      console.log('✅ 카카오 알림톡 테스트 성공');
    } catch (error) {
      testResults.push({ service: 'kakao_alimtalk', success: false, error: error.message });
      console.error('❌ 카카오 알림톡 테스트 실패:', error.message);
    }
  } else {
    console.log('⚠️ 카카오 알림톡 서비스 설정이 완료되지 않았습니다');
  }
  
  console.log('\n📊 테스트 결과 요약:');
  testResults.forEach(result => {
    if (result.success) {
      console.log(`✅ ${result.service}: 성공`);
    } else {
      console.log(`❌ ${result.service}: 실패 - ${result.error}`);
    }
  });
  
  return testResults;
}

module.exports = {
  sendMessage,
  checkServiceStatus,
  testMessaging,
  MESSAGE_TYPES
};
