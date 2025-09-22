const CryptoJS = require('crypto-js');

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
    const { to, content, subject } = req.body;

    if (!to || !content) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 필드가 누락되었습니다 (to, content)' 
      });
    }

    // 환경 변수
    const NCP_ACCESS_KEY = process.env.VITE_SMS_ACCESS_KEY;
    const NCP_SECRET_KEY = process.env.VITE_SMS_SECRET_KEY;
    const NCP_SMS_SERVICE_ID = process.env.VITE_SMS_SERVICE_ID;
    const NCP_SMS_FROM_NUMBER = process.env.VITE_SMS_FROM_NUMBER || '01072907620';

    if (!NCP_ACCESS_KEY || !NCP_SECRET_KEY || !NCP_SMS_SERVICE_ID) {
      return res.status(500).json({ 
        success: false, 
        message: '네이버 클라우드 SMS 인증 정보가 설정되지 않았습니다' 
      });
    }

    // 서명 생성
    const makeSignature = (method, url, timestamp) => {
      const space = ' ';
      const newLine = '\n';
      const message = method + space + url + newLine + timestamp + newLine + NCP_ACCESS_KEY;
      const signature = CryptoJS.HmacSHA256(message, NCP_SECRET_KEY);
      return CryptoJS.enc.Base64.stringify(signature);
    };

    // 네이버 클라우드 SENS SMS API 호출
    const timestamp = Date.now().toString();
    const url = `/sms/v2/services/${NCP_SMS_SERVICE_ID}/messages`;
    const signature = makeSignature('POST', url, timestamp);

    const smsData = {
      type: 'SMS',
      from: NCP_SMS_FROM_NUMBER,
      content: content,
      messages: [{
        to: to.replace(/[^0-9]/g, ''), // 숫자만 추출
        subject: subject || '올띵버킷 알림'
      }]
    };

    const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature
      },
      body: JSON.stringify(smsData)
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: 'SMS가 성공적으로 발송되었습니다',
        requestId: result.requestId || Date.now().toString()
      });
    } else {
      return res.status(response.status).json({
        success: false,
        message: `SMS 발송 실패: ${result.message || response.statusText}`,
        error: result
      });
    }

  } catch (error) {
    console.error('SMS 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: `SMS 발송 중 오류가 발생했습니다: ${error.message}`
    });
  }
}
