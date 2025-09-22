const crypto = require('crypto');

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
    
    const { to, title, content, templateCode, buttons } = req.body;

    if (!to || !content) {
      console.log('❌ 필수 필드 누락:', { to, content });
      return res.status(400).json({ 
        success: false, 
        message: '필수 필드가 누락되었습니다 (to, content)' 
      });
    }

    // 환경 변수 확인
    const NCP_ACCESS_KEY = process.env.VITE_SMS_ACCESS_KEY;
    const NCP_SECRET_KEY = process.env.VITE_SMS_SECRET_KEY;
    const NCP_ALIMTALK_SERVICE_ID = process.env.VITE_NCP_ALIMTALK_SERVICE_ID || 'ncp:kkobizmsg:kr:359104915298:allthingbucket';
    const NCP_PLUS_FRIEND_ID = process.env.VITE_COMPANY_NAME || '올띵버킷';

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

    // 임시로 성공 응답 반환 (실제 알림톡 발송은 나중에 구현)
    console.log('✅ 알림톡 발송 시뮬레이션 완료');
    
    return res.status(200).json({
      success: true,
      message: '알림톡이 성공적으로 발송되었습니다 (시뮬레이션)',
      requestId: Date.now().toString()
    });

  } catch (error) {
    console.error('알림톡 발송 오류:', error);
    return res.status(500).json({
      success: false,
      message: `알림톡 발송 중 오류가 발생했습니다: ${error.message}`
    });
  }
}