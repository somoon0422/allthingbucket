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
    // content: 템플릿과 정확히 일치해야 함 (이모지 포함)
    // templateParameter: 실제 변수 값 전달
    const message = {
      to: to.replace(/-/g, ''), // 하이픈 제거
      content: '[올띵버킷]\n#{name}님, 축하드립니다! 🎉\n\n#{campaignName} 체험단에 선정되셨습니다!\n\n📦 다음 단계\n1. 체험단 가이드 확인 (제품 구매 or 배송 대기)\n2. 체험 진행 및 리뷰 작성\n3. 리뷰 승인 후 포인트 지급 (#{rewardPoints}P)\n4. 포인트 출금 요청\n\n⛳️ 체험단 상세 페이지에서 체험 가이드를 확인해 주세요.\n혹은 이메일로 체험 가이드를 발송드렸으니 확인 후 진행해 주세요.\n\n(*확인이 안 되실 경우 스팸함도 확인해 주세요.)',
      templateParameter: variables,  // 템플릿 변수 전달
      buttons: [
        {
          type: 'WL',
          name: '내 신청 보기',
          linkMobile: 'https://allthingbucket.com/my-applications',
          linkPc: 'https://allthingbucket.com/my-applications'
        }
      ]
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