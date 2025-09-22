// 간단한 이메일 전송 API (Gmail SMTP 사용)
// 실제 프로덕션에서는 더 안전한 방법 사용 권장

const nodemailer = require('nodemailer')

// Gmail SMTP 설정 (앱 비밀번호 사용)
const transporter = nodemailer.createTransporter({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'your-email@gmail.com',
    pass: process.env.GMAIL_APP_PASSWORD || 'your-app-password'
  }
})

export default async function handler(req, res) {
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

  try {
    const { to, toName, subject, html, text } = req.body

    if (!to || !subject || !html) {
      return res.status(400).json({ 
        success: false, 
        error: 'Missing required fields: to, subject, html' 
      })
    }

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
    return res.status(500).json({
      success: false,
      error: error.message,
      message: '이메일 전송 중 오류가 발생했습니다.'
    })
  }
}
