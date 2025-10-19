import crypto from 'crypto';

// HMAC-SHA256 서명 생성
function makeSignature(timestamp, method, url, secretKey) {
  const space = ' ';
  const newLine = '\n';
  const message = method + space + url + newLine + timestamp + newLine + process.env.VITE_SMS_ACCESS_KEY;
  
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(message)
    .digest('base64');
    
  return signature;
}

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    console.log('💬 알림톡 발송 요청 시작:', req.body);

    const { to, templateCode, variables, failoverConfig } = req.body;

    if (!to || !templateCode || !variables) {
      console.log('❌ 필수 필드 누락:', { to, templateCode, variables });
      return res.status(400).json({
        success: false,
        message: '필수 필드가 누락되었습니다 (to, templateCode, variables)'
      });
    }

    // 환경 변수 확인
    const NCP_ACCESS_KEY = process.env.VITE_SMS_ACCESS_KEY;
    const NCP_SECRET_KEY = process.env.VITE_SMS_SECRET_KEY;
    const NCP_ALIMTALK_SERVICE_ID = 'ncp:kkobizmsg:kr:359104915298:allthingbucket'; // 실제 서비스 ID
    const NCP_PLUS_FRIEND_ID = '@올띵버킷'; // 플러스친구 ID

    console.log('🔑 알림톡 환경 변수 확인:', {
      hasAccessKey: !!NCP_ACCESS_KEY,
      hasSecretKey: !!NCP_SECRET_KEY,
      serviceId: NCP_ALIMTALK_SERVICE_ID,
      plusFriendId: NCP_PLUS_FRIEND_ID
    });

    if (!NCP_ACCESS_KEY || !NCP_SECRET_KEY) {
      console.log('❌ 알림톡 인증 정보 누락');
      return res.status(500).json({ 
        success: false, 
        message: '네이버 클라우드 알림톡 인증 정보가 설정되지 않았습니다' 
      });
    }

    // 네이버 클라우드 알림톡 API 호출
    const timestamp = Date.now().toString();
    const method = 'POST';
    const url = `/alimtalk/v2/services/${NCP_ALIMTALK_SERVICE_ID}/messages`;
    const signature = makeSignature(timestamp, method, url, NCP_SECRET_KEY);

    // 알림톡 메시지 구성
    // content: 변수가 치환된 실제 메시지 내용
    // templateParameter는 사용하지 않음 (content에 이미 치환된 값 포함)
    const content = `🎉 '${variables.campaignName}' 최종 선정 안내

안녕하세요, ${variables.userName}님.

더 나은 체험, 더 진실한 리뷰 올띵버킷 입니다.

'${variables.campaignName}'에 ${variables.userName}님이 최종 선정 되셨음을 진심으로 축하드립니다! 🎉

이메일을 통해 체험단 가이드를 발송해 드렸습니다. 확인 하시고 다음 단계를 진행해주세요.

* 메시지 확인 어려우실 경우, 스팸함을 확인 부탁드립니다.
그래도 확인이 어려우시면 올띵버킷 고객센터로 문의 주시면 감사 드리겠습니다.

올띵버킷 (All Thing Bucket)
체험단 운영팀


📧 Email: support@allthingbucket.com
📱 고객센터: 010-2212-9245 (평일 09:00 ~ 18:00)
📱 카카오톡: @올띵버킷

⚠️ 본 메일은 체험단 선정자에게만 발송되는 메일 입니다.
문의사항은 고객센터 또는 카카오톡으로 연락 주세요.`;

    const message = {
      to: to.replace(/-/g, ''), // 하이픈 제거
      content: content  // 변수가 이미 치환된 실제 메시지
      // templateParameter는 제거 (content에 이미 포함됨)
    };

    // Failover 설정이 있는 경우 추가
    if (failoverConfig) {
      message.failoverConfig = failoverConfig;
    }

    const alimtalkData = {
      plusFriendId: NCP_PLUS_FRIEND_ID,
      templateCode: templateCode,
      messages: [message]
    };

    console.log('💬 알림톡 API 호출 데이터:', JSON.stringify(alimtalkData, null, 2));

    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature
      },
      body: JSON.stringify(alimtalkData)
    });

    const responseData = await response.json();
    console.log('💬 알림톡 API 응답:', JSON.stringify(responseData, null, 2));
    console.log('📊 응답 상태:', response.status, response.statusText);

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: '알림톡이 성공적으로 발송되었습니다',
        requestId: responseData.requestId || Date.now().toString(),
        data: responseData
      });
    } else {
      // 더 자세한 오류 정보 반환
      const errorDetail = responseData.errors ? JSON.stringify(responseData.errors) : responseData.errorMessage || response.statusText;
      console.error('❌ 상세 오류:', errorDetail);
      throw new Error(`알림톡 API 오류: ${errorDetail}`);
    }

  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: `알림톡 발송 중 오류가 발생했습니다: ${error.message}`
    });
  }
}