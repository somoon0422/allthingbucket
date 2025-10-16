// 간단한 이메일 전송 API (Gmail SMTP 사용)
// 실제 프로덕션에서는 더 안전한 방법 사용 권장

const nodemailer = require('nodemailer')

module.exports = async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // 🔍 환경 변수 확인 로그 (디버그용)
  console.log('🔑 GMAIL_USER:', process.env.GMAIL_USER ? '설정됨' : '❌ 없음')
  console.log('🔑 GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '설정됨' : '❌ 없음')

  try {
    const { to, toName, subject, html, text } = req.body

    if (!to || !subject || !html) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      })
    }

    // 🔥 환경 변수 확인
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ 환경 변수 누락!')
      return res.status(500).json({
        success: false,
        error: 'Gmail credentials not configured',
        envCheck: {
          hasGmailUser: !!process.env.GMAIL_USER,
          hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD
        },
        message: 'Gmail 인증 정보가 설정되지 않았습니다. Vercel 환경 변수를 확인하세요.'
      })
    }

    // 🔥 Gmail SMTP transporter 생성 (함수 내부에서)
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    console.log('📧 Transporter 생성 완료')

    // 이메일 전송
    const info = await transporter.sendMail({
      from: `"올띵버킷" <${process.env.GMAIL_USER || 'noreply@allthingbucket.com'}>`,
      to: to,
      subject: subject,
      html: html,
      text: text
    })

    console.log('✅ 이메일 전송 성공:', info.messageId)

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `${toName}님에게 이메일을 전송했습니다.`
    })

  } catch (error) {
    console.error('❌ 이메일 전송 실패:', error)

    // 🔍 상세한 에러 정보 반환 (디버그용)
    return res.status(500).json({
      success: false,
      error: error.message,
      errorCode: error.code,
      errorDetails: {
        command: error.command,
        response: error.response,
        responseCode: error.responseCode
      },
      envCheck: {
        hasGmailUser: !!process.env.GMAIL_USER,
        hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
        gmailUserLength: process.env.GMAIL_USER?.length || 0,
        gmailPasswordLength: process.env.GMAIL_APP_PASSWORD?.length || 0
      },
      message: '이메일 전송 중 오류가 발생했습니다.'
    })
  }
}
