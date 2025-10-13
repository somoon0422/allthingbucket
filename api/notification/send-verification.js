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

// 6자리 인증 코드 생성
function generateVerificationCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
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
    console.log('🔐 인증번호 발송 요청 시작:', req.body);

    const { userId, type } = req.body;

    if (!userId || type !== 'email') {
      console.log('❌ 필수 필드 누락:', { userId, type });
      return res.status(400).json({
        success: false,
        error: '필수 필드가 누락되었습니다 (userId, type)'
      });
    }

    // 환경 변수 확인
    const NCP_ACCESS_KEY = process.env.VITE_NCP_ACCESS_KEY;
    const NCP_SECRET_KEY = process.env.VITE_NCP_SECRET_KEY;
    const NCP_EMAIL_SENDER_ADDRESS = process.env.VITE_SUPPORT_EMAIL || 'support@allthingbucket.com';
    const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
    const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

    console.log('🔑 환경 변수 확인:', {
      hasAccessKey: !!NCP_ACCESS_KEY,
      hasSecretKey: !!NCP_SECRET_KEY,
      senderEmail: NCP_EMAIL_SENDER_ADDRESS,
      hasSupabaseUrl: !!SUPABASE_URL,
      hasSupabaseKey: !!SUPABASE_SERVICE_ROLE_KEY
    });

    if (!NCP_ACCESS_KEY || !NCP_SECRET_KEY) {
      console.log('❌ 인증 정보 누락');
      return res.status(500).json({
        success: false,
        error: '네이버 클라우드 인증 정보가 설정되지 않았습니다'
      });
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.log('❌ Supabase 정보 누락');
      return res.status(500).json({
        success: false,
        error: 'Supabase 인증 정보가 설정되지 않았습니다'
      });
    }

    // Supabase에서 사용자 정보 조회
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?user_id=eq.${userId}`, {
      headers: {
        'apikey': SUPABASE_SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!userResponse.ok) {
      throw new Error('사용자 정보 조회 실패');
    }

    const users = await userResponse.json();
    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        error: '사용자를 찾을 수 없습니다'
      });
    }

    const user = users[0];
    const userEmail = user.email;
    const userName = user.name || '사용자';

    if (!userEmail) {
      return res.status(400).json({
        success: false,
        error: '사용자 이메일이 없습니다'
      });
    }

    // 인증 코드 생성
    const verificationCode = generateVerificationCode();
    console.log('🔐 생성된 인증 코드:', verificationCode);

    // 이메일 HTML 템플릿
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="text-align: center; padding: 30px 0;">
          <h1 style="color: #6366f1; margin: 0;">올띵버킷 체험단</h1>
        </div>

        <div style="background: #f9fafb; border-radius: 10px; padding: 30px; margin: 20px 0;">
          <h2 style="color: #111827; margin-top: 0;">이메일 인증 코드</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            안녕하세요, ${userName}님!<br/>
            아래 인증 코드를 입력하여 이메일 인증을 완료해주세요.
          </p>

          <div style="background: white; border: 2px solid #6366f1; border-radius: 8px; padding: 20px; margin: 20px 0; text-align: center;">
            <div style="font-size: 32px; font-weight: bold; color: #6366f1; letter-spacing: 4px;">
              ${verificationCode}
            </div>
          </div>

          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            ⏰ 이 인증 코드는 5분간 유효합니다.<br/>
            🔒 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
          </p>
        </div>

        <div style="text-align: center; color: #9ca3af; font-size: 12px; padding: 20px 0;">
          <p>올띵버킷 체험단 | support@allthingbucket.com</p>
        </div>
      </div>
    `;

    // 네이버 클라우드 Cloud Outbound Mailer API 호출
    const timestamp = Date.now().toString();
    const method = 'POST';
    const url = `/api/v1/mails`;
    const signature = makeSignature(timestamp, method, url, NCP_SECRET_KEY);

    const emailData = {
      senderAddress: NCP_EMAIL_SENDER_ADDRESS,
      title: '[올띵버킷] 이메일 인증 코드',
      body: emailHtml,
      recipientList: [
        {
          address: userEmail,
          name: userName,
          type: 'R'
        }
      ]
    };

    console.log('📧 이메일 API 호출 데이터:', { ...emailData, body: '...' });

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
        message: '인증번호가 이메일로 발송되었습니다',
        verificationCode: verificationCode, // 개발용 - 프로덕션에서는 제거
        requestId: responseData.requestId || Date.now().toString()
      });
    } else {
      throw new Error(`이메일 API 오류: ${responseData.errorMessage || response.statusText}`);
    }

  } catch (error) {
    console.error('❌ 인증번호 발송 오류:', error);
    return res.status(500).json({
      success: false,
      error: `인증번호 발송 중 오류가 발생했습니다: ${error.message}`
    });
  }
}
