const crypto = require('crypto');
const axios = require('axios');

// 🔥 네이버 클라우드 SENS 알림톡 API 설정
const SENS_ALIMTALK_CONFIG = {
  accessKey: process.env.SMS_ACCESS_KEY, // SMS와 동일한 Access Key 사용
  secretKey: process.env.SMS_SECRET_KEY, // SMS와 동일한 Secret Key 사용
  serviceId: process.env.SMS_SERVICE_ID, // SMS와 동일한 Service ID 사용
  plusFriendId: process.env.KAKAO_PLUS_FRIEND_ID, // 카카오톡 채널명
  templateCode: process.env.KAKAO_TEMPLATE_CODE, // 템플릿 코드
  baseUrl: 'https://sens.apigw.ntruss.com'
};

// 🔥 API 서명 생성 함수 (SMS와 동일)
function generateSignature(method, url, timestamp, accessKey, secretKey) {
  const message = `${method} ${url}\n${timestamp}\n${accessKey}`;
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
  return signature;
}

// 🔥 네이버 클라우드 SENS 알림톡 발송 함수
async function sendKakaoAlimtalk({ to, message, templateCode, variables = {} }) {
  try {
    // 🔥 설정 검증
    if (!SENS_ALIMTALK_CONFIG.accessKey || !SENS_ALIMTALK_CONFIG.secretKey || !SENS_ALIMTALK_CONFIG.serviceId) {
      throw new Error('SENS 알림톡 API 설정이 완료되지 않았습니다. 환경변수를 확인해주세요.');
    }

    if (!SENS_ALIMTALK_CONFIG.plusFriendId || !SENS_ALIMTALK_CONFIG.templateCode) {
      throw new Error('카카오톡 채널명(plusFriendId)과 템플릿 코드가 설정되지 않았습니다.');
    }

    // 🔥 전화번호 정리 (하이픈 제거)
    const cleanTo = to.replace(/-/g, '');

    // 🔥 전화번호 형식 검증
    if (!/^010\d{8}$/.test(cleanTo)) {
      throw new Error('올바른 휴대폰 번호 형식이 아닙니다. (010-1234-5678)');
    }

    // 🔥 API 요청 데이터 준비 (SENS 알림톡 v2 API 형식)
    const timestamp = Date.now().toString();
    const url = `/alimtalk/v2/services/${SENS_ALIMTALK_CONFIG.serviceId}/messages`;
    const fullUrl = `${SENS_ALIMTALK_CONFIG.baseUrl}${url}`;
    
    const signature = generateSignature(
      'POST',
      url,
      timestamp,
      SENS_ALIMTALK_CONFIG.accessKey,
      SENS_ALIMTALK_CONFIG.secretKey
    );

    const requestData = {
      plusFriendId: SENS_ALIMTALK_CONFIG.plusFriendId,
      templateCode: templateCode || SENS_ALIMTALK_CONFIG.templateCode,
      messages: [{
        countryCode: '82',
        to: cleanTo,
        content: message,
        buttons: [{
          type: 'WL', // 웹링크
          name: '올띵버킷 바로가기',
          linkMobile: 'https://allthingbucket.com',
          linkPc: 'https://allthingbucket.com'
        }]
      }]
    };

    console.log('📤 SENS 알림톡 API 요청 데이터:', {
      to: cleanTo,
      messageLength: message.length,
      plusFriendId: SENS_ALIMTALK_CONFIG.plusFriendId,
      templateCode: requestData.templateCode
    });

    // 🔥 네이버 클라우드 SENS 알림톡 API 호출
    const response = await axios.post(fullUrl, requestData, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': SENS_ALIMTALK_CONFIG.accessKey,
        'x-ncp-apigw-signature-v2': signature
      },
      timeout: 10000 // 10초 타임아웃
    });

    console.log('✅ SENS 알림톡 API 응답:', response.data);

    return {
      success: true,
      requestId: response.data.requestId,
      statusCode: response.data.statusCode,
      statusName: response.data.statusName,
      to: cleanTo,
      timestamp: new Date().toISOString(),
      service: 'sens_alimtalk'
    };

  } catch (error) {
    console.error('❌ SENS 알림톡 발송 오류:', error.response?.data || error.message);
    
    // 🔥 SENS API 에러 처리
    if (error.response?.data) {
      const apiError = error.response.data;
      throw new Error(`SENS 알림톡 API 오류: ${apiError.errorMessage || apiError.message || '알 수 없는 오류'}`);
    }
    
    // 🔥 네트워크 오류 등
    throw new Error(`SENS 알림톡 발송 실패: ${error.message}`);
  }
}

// 🔥 SENS 알림톡 발송 테스트 함수
async function testKakaoAlimtalk() {
  try {
    console.log('🧪 SENS 알림톡 발송 테스트 시작...');
    
    const result = await sendKakaoAlimtalk({
      to: '01012345678', // 테스트 번호
      message: '올띵버킷 SENS 알림톡 테스트입니다.',
      templateCode: SENS_ALIMTALK_CONFIG.templateCode
    });
    
    console.log('✅ SENS 알림톡 발송 테스트 성공:', result);
    return result;
    
  } catch (error) {
    console.error('❌ SENS 알림톡 발송 테스트 실패:', error.message);
    throw error;
  }
}

module.exports = {
  sendKakaoAlimtalk,
  testKakaoAlimtalk,
  SENS_ALIMTALK_CONFIG
};
