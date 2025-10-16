// Gmail SMTP 이메일 전송 API
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

  console.log('📧 send-email API 호출됨')
  console.log('🔑 환경 변수:', {
    hasGmailUser: !!process.env.GMAIL_USER,
    hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD,
    gmailUser: process.env.GMAIL_USER || '없음'
  })

  try {
    const { to, toName, subject, html, text } = req.body

    // 필수 필드 확인
    if (!to || !subject || !html) {
      console.error('❌ 필수 필드 누락:', { to: !!to, subject: !!subject, html: !!html })
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: to, subject, html'
      })
    }

    // 환경 변수 확인
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ 환경 변수 누락!')
      return res.status(500).json({
        success: false,
        error: 'Gmail credentials not configured',
        envCheck: {
          hasGmailUser: !!process.env.GMAIL_USER,
          hasGmailPassword: !!process.env.GMAIL_APP_PASSWORD
        },
        message: '⚠️ Vercel 환경 변수를 설정하고 Redeploy 해주세요!'
      })
    }

    console.log('📧 Transporter 생성 시작...')

    // Transporter 생성
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    })

    console.log('✅ Transporter 생성 완료')
    console.log('📨 이메일 전송 시작:', { to, subject })

    // 이메일 전송
    const info = await transporter.sendMail({
      from: `"올띵버킷" <${process.env.GMAIL_USER}>`,
      to: to,
      subject: subject,
      html: html,
      text: text || ''
    })

    console.log('✅ 이메일 전송 성공:', info.messageId)

    return res.status(200).json({
      success: true,
      messageId: info.messageId,
      message: `${toName}님에게 이메일을 전송했습니다.`
    })

  } catch (error) {
    console.error('❌ 이메일 전송 오류:', {
      message: error.message,
      code: error.code,
      command: error.command,
      response: error.response
    })

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
