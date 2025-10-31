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
    // templateCode에 따라 다른 content 생성
    let replacedContent = '';
    let buttons = [];

    switch (templateCode) {
      case 'WELCOME':
        replacedContent = `[올띵버킷]
${variables.name}님, 올띵버킷 가입을 환영합니다! 🎉

✨ 다양한 체험단에 신청하고 리뷰 작성을 통해 누구나 인플루언서가 될 수 있는 기회를 잡으세요!

💰 포인트 적립 후 현금으로 출금 신청도 가능합니다.

👉 지금 진행 중인 체험단 보러가기`;
        buttons = [
          {
            type: 'AC',
            name: '채널 추가'
          },
          {
            type: 'WL',
            name: '체험단 둘러보기',
            linkMobile: 'https://allthingbucket.com/experiences',
            linkPc: 'https://allthingbucket.com/experiences'
          }
        ];
        break;

      case 'APPLICATIONAPPROVED':
        replacedContent = `[올띵버킷]
${variables.name}님, 축하드립니다! 🎉

${variables.campaignName} 체험단에 선정되셨습니다!

📦 다음 단계
1. 체험단 가이드 확인 (제품 구매 or 배송 대기)
2. 체험 진행 및 리뷰 작성
3. 리뷰 승인 후 포인트 지급 (${variables.rewardPoints}P)
4. 포인트 출금 요청

⛳️ 체험단 상세 페이지에서 체험 가이드를 확인해 주세요.
혹은 이메일로 체험 가이드를 발송드렸으니 확인 후 진행해 주세요.

(*확인이 안 되실 경우 스팸함도 확인해 주세요.)`;
        buttons = [
          {
            type: 'WL',
            name: '내 신청 보기',
            linkMobile: 'https://allthingbucket.com/my-applications',
            linkPc: 'https://allthingbucket.com/my-applications'
          }
        ];
        break;

      case 'REVIEWAPPROVEDPOINTSPAID':
        replacedContent = `[올띵버킷]
${variables.name}님, 리뷰가 승인되었습니다! ✨

${variables.campaignName} 리뷰 검수가 완료되어 포인트가 지급되었습니다.

💰 포인트 지급 내역
- 지급 포인트: ${variables.amount}P
- 현재 잔액: ${variables.totalPoints}P
- 지급일: ${variables.paymentDate}

📌 출금 안내
마이페이지에서 출금 신청 가능합니다.
출금 시 3.3% 원천징수(소득세) 공제됩니다.
(예시: 10,000P 신청 → 9,670원 입금)

※ 출금을 위해 주민등록번호 수집이 필요합니다. (프리랜서 등록용)`;
        buttons = [
          {
            type: 'WL',
            name: '포인트 확인하기',
            linkMobile: 'https://allthingbucket.com/points',
            linkPc: 'https://allthingbucket.com/points'
          }
        ];
        break;

      case 'APPLICATIONSUBMITTED':
        replacedContent = `[올띵버킷]
${variables.name}님, 신청이 완료되었습니다! ✅

📋 신청 정보
- 캠페인: ${variables.campaignName}
- 브랜드: ${variables.brandName}
- 신청일: ${variables.applicationDate}
- 상태: 승인 대기중

영업일 기준 3일 이내에 결과를 안내드립니다.`;
        buttons = [
          {
            type: 'WL',
            name: '내 신청 확인하기',
            linkMobile: 'https://allthingbucket.com/my-applications',
            linkPc: 'https://allthingbucket.com/my-applications'
          }
        ];
        break;

      case 'APPLICATIONREJECTED':
        replacedContent = `[올띵버킷]
${variables.name}님, 신청 결과를 안내드립니다.

${variables.campaignName} 체험단 신청이 아쉽게도 선정되지 않았습니다.

📝 반려 사유
${variables.reason}

다른 체험단도 둘러보세요!`;
        buttons = [
          {
            type: 'WL',
            name: '다른 체험단 보기',
            linkMobile: 'https://allthingbucket.com/experiences',
            linkPc: 'https://allthingbucket.com/experiences'
          }
        ];
        break;

      case 'REVIEWREJECTION':
        replacedContent = `[올띵버킷]
${variables.name}님, ${variables.campaignName} 리뷰가 반려되었습니다.

📝 반려 사유
${variables.reason}

리뷰를 수정하여 다시 제출해 주세요.`;
        buttons = [
          {
            type: 'WL',
            name: '리뷰 수정하기',
            linkMobile: 'https://allthingbucket.com/my-applications',
            linkPc: 'https://allthingbucket.com/my-applications'
          }
        ];
        break;

      case 'WITHDRAWALAPPROVAL':
        replacedContent = `[올띵버킷]

${variables.userName}님, 출금이 승인되었습니다! 💰

  💰 출금 정보
  - 출금 금액: ${variables.amount}P
  - 입금 예정 금액: ${variables.actualAmount}원
    (원천징수 3.3% 공제)

영업일 기준 3~5일 내에 등록하신 계좌로 입금됩니다.`;
        buttons = [
          {
            type: 'WL',
            name: '포인트 내역 보기',
            linkMobile: 'https://allthingbucket.com/points',
            linkPc: 'https://allthingbucket.com/points'
          }
        ];
        break;

      default:
        // 기타 템플릿은 기존 방식 사용
        console.warn('⚠️ 알 수 없는 템플릿 코드:', templateCode);
        replacedContent = JSON.stringify(variables);
        break;
    }

    const message = {
      to: to.replace(/-/g, ''), // 하이픈 제거
      content: replacedContent,
      buttons: buttons
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