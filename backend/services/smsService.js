const crypto = require('crypto');
const axios = require('axios');

// 🔥 네이버 클라우드 SMS API 설정
const SMS_CONFIG = {
  accessKey: process.env.SMS_ACCESS_KEY,
  secretKey: process.env.SMS_SECRET_KEY,
  serviceId: process.env.SMS_SERVICE_ID,
  fromNumber: process.env.SMS_FROM_NUMBER || '01012345678'
};

// 🔥 API 서명 생성 함수
function generateSignature(method, url, timestamp, accessKey, secretKey) {
  const message = `${method} ${url}\n${timestamp}\n${accessKey}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
  return signature;
}

// 🔥 SMS 발송 함수
async function sendSMS({ to, message, from }) {
  try {
    // 🔥 설정 검증
    if (!SMS_CONFIG.accessKey || !SMS_CONFIG.secretKey || !SMS_CONFIG.serviceId) {
      throw new Error('SMS API 설정이 완료되지 않았습니다. 환경변수를 확인해주세요.');
    }

    // 🔥 전화번호 정리 (하이픈 제거)
    const cleanTo = to.replace(/-/g, '');
    const cleanFrom = (from || SMS_CONFIG.fromNumber).replace(/-/g, '');

    // 🔥 전화번호 형식 검증
    if (!/^010\d{8}$/.test(cleanTo)) {
      throw new Error('올바른 휴대폰 번호 형식이 아닙니다. (010-1234-5678)');
    }

    // 🔥 API 요청 데이터 준비
    const timestamp = Date.now().toString();
    const url = `/sms/v2/services/${SMS_CONFIG.serviceId}/messages`;
    const fullUrl = `https://sens.apigw.ntruss.com${url}`;
    
    const signature = generateSignature(
      'POST',
      url,
      timestamp,
      SMS_CONFIG.accessKey,
      SMS_CONFIG.secretKey
    );

    const requestData = {
      type: 'SMS',
      contentType: 'COMM',
      countryCode: '82',
      from: cleanFrom,
      content: `[올띵버킷] ${message}`,
      messages: [{
        to: cleanTo,
        content: `[올띵버킷] ${message}`
      }]
    };

    console.log('📤 SMS API 요청 데이터:', {
      to: cleanTo,
      from: cleanFrom,
      messageLength: message.length,
      serviceId: SMS_CONFIG.serviceId
    });

    // 🔥 네이버 클라우드 SMS API 호출
    const response = await axios.post(fullUrl, requestData, {
      headers: {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': SMS_CONFIG.accessKey,
        'x-ncp-apigw-signature-v2': signature
      },
      timeout: 10000 // 10초 타임아웃
    });

    console.log('✅ SMS API 응답:', response.data);

    return {
      success: true,
      requestId: response.data.requestId,
      statusCode: response.data.statusCode,
      statusName: response.data.statusName,
      to: cleanTo,
      from: cleanFrom,
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ SMS 발송 오류:', error.response?.data || error.message);
    
    // 🔥 네이버 클라우드 API 에러 처리
    if (error.response?.data) {
      const apiError = error.response.data;
      throw new Error(`SMS API 오류: ${apiError.errorMessage || apiError.message || '알 수 없는 오류'}`);
    }
    
    // 🔥 네트워크 오류 등
    throw new Error(`SMS 발송 실패: ${error.message}`);
  }
}

// 🔥 SMS 발송 테스트 함수
async function testSMS() {
  try {
    console.log('🧪 SMS 발송 테스트 시작...');
    
    const result = await sendSMS({
      to: '01012345678', // 테스트 번호
      message: 'SMS 발송 테스트입니다.',
      from: SMS_CONFIG.fromNumber
    });
    
    console.log('✅ SMS 발송 테스트 성공:', result);
    return result;
    
  } catch (error) {
    console.error('❌ SMS 발송 테스트 실패:', error.message);
    throw error;
  }
}

module.exports = {
  sendSMS,
  testSMS,
  SMS_CONFIG
};
