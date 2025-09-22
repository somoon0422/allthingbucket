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
    const { to, toName, subject, html, text } = req.body;

    if (!to || !toName || !subject) {
      return res.status(400).json({ 
        success: false, 
        message: '필수 필드가 누락되었습니다 (to, toName, subject)' 
      });
    }

    // 환경 변수
    const NCP_ACCESS_KEY = process.env.VITE_SMS_ACCESS_KEY;
    const NCP_SECRET_KEY = process.env.VITE_SMS_SECRET_KEY;
    const NCP_EMAIL_SENDER_ADDRESS = process.env.VITE_SUPPORT_EMAIL || 'support@allthingbucket.com';

    if (!NCP_ACCESS_KEY || !NCP_SECRET_KEY) {
      return res.status(500).json({ 
        success: false, 
        message: '네이버 클라우드 인증 정보가 설정되지 않았습니다' 
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

    // 네이버 클라우드 Cloud Outbound Mailer API 호출
    const timestamp = Date.now().toString();
    const url = '/mail/v2/send';
    const signature = makeSignature('POST', url, timestamp);

    const emailData = {
      senderAddress: NCP_EMAIL_SENDER_ADDRESS,
      senderName: '올띵버킷 체험단',
      title: subject,
      body: html || text,
      recipientList: [{
        address: to,
        name: toName,
        type: 'R'
      }]
    };

    const response = await fetch(`https://mail.apigw.ntruss.com${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature
      },
      body: JSON.stringify(emailData)
    });

    const result = await response.json();

    if (response.ok) {
      return res.status(200).json({
        success: true,
        message: '이메일이 성공적으로 발송되었습니다',
        requestId: result.requestId || Date.now().toString()
      });
    } else {
      return res.status(response.status).json({
        success: false,
        message: `이메일 발송 실패: ${result.message || response.statusText}`,
        error: result
      });
    }

  } catch (error) {
    console.error('이메일 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: `이메일 발송 중 오류가 발생했습니다: ${error.message}`
    });
  }
}
