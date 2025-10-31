import crypto from 'crypto';

// HMAC-SHA256 서명 생성
function makeSignature(timestamp, method, url, secretKey) {
  const space = ' ';
  const newLine = '\n';
  const message = method + space + url + newLine + timestamp + newLine + process.env.VITE_NCP_ACCESS_KEY;
  
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
    console.log('📧 이메일 발송 요청 시작:', req.body);
    
    const { to, toName, subject, html, text } = req.body;

    if (!to || !toName || !subject) {
      console.log('❌ 필수 필드 누락:', { to, toName, subject });
      return res.status(400).json({ 
        success: false, 
        message: '필수 필드가 누락되었습니다 (to, toName, subject)' 
      });
    }

    // 환경 변수 확인
    const NCP_ACCESS_KEY = process.env.VITE_NCP_ACCESS_KEY;
    const NCP_SECRET_KEY = process.env.VITE_NCP_SECRET_KEY;
    const NCP_EMAIL_SENDER_ADDRESS = process.env.VITE_SUPPORT_EMAIL || 'support@allthingbucket.com';

    console.log('🔑 환경 변수 확인:', {
      hasAccessKey: !!NCP_ACCESS_KEY,
      hasSecretKey: !!NCP_SECRET_KEY,
      senderEmail: NCP_EMAIL_SENDER_ADDRESS
    });

    if (!NCP_ACCESS_KEY || !NCP_SECRET_KEY) {
      console.log('❌ 인증 정보 누락');
      return res.status(500).json({ 
        success: false, 
        message: '네이버 클라우드 인증 정보가 설정되지 않았습니다' 
      });
    }

    // 네이버 클라우드 Cloud Outbound Mailer API 호출
    const timestamp = Date.now().toString();
    const method = 'POST';
    const url = `/api/v1/mails`;
    const signature = makeSignature(timestamp, method, url, NCP_SECRET_KEY);

    const emailData = {
      senderAddress: NCP_EMAIL_SENDER_ADDRESS,
      title: subject,
      body: html || text,
      recipientList: [
        {
          address: to,
          name: toName,
          type: 'R'
        }
      ]
    };

    console.log('📧 이메일 API 호출 데이터:', emailData);

    const response = await fetch(`https://mail.apigw.ntruss.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature
      },
      body: JSON.stringify(emailData)
    });

    const responseData = await response.json();
    console.log('📧 이메일 API 응답:', responseData);

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: '이메일이 성공적으로 발송되었습니다',
        requestId: responseData.requestId || Date.now().toString(),
        data: responseData
      });
    } else {
      throw new Error(`이메일 API 오류: ${responseData.errorMessage || response.statusText}`);
    }

  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: `이메일 발송 중 오류가 발생했습니다: ${error.message}`
    });
  }
}