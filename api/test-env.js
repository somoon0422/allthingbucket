// 환경 변수 테스트용 함수

module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  console.log('🔍 환경 변수 테스트 시작')
  console.log('GMAIL_USER:', process.env.GMAIL_USER)
  console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '설정됨' : '없음')

  return res.status(200).json({
    success: true,
    message: '환경 변수 테스트',
    env: {
      hasGmailUser: !!process.env.GMAIL_USER,
      hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
      gmailUser: process.env.GMAIL_USER || '없음',
      gmailUserLength: process.env.GMAIL_USER?.length || 0,
      gmailPasswordLength: process.env.GMAIL_APP_PASSWORD?.length || 0,
      nodeVersion: process.version,
      platform: process.platform
    }
  })
}
