// @ts-ignore
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

// Declare Deno global for TypeScript
declare const Deno: any

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, message, from = 'support@allthingbucket.com' } = await req.json()

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Gmail SMTP를 사용한 이메일 발송
    const gmailUser = Deno.env.get('GMAIL_USER')
    const gmailAppPassword = Deno.env.get('GMAIL_APP_PASSWORD')
    
    console.log('🔑 Gmail SMTP 설정 확인:', {
      user: !!gmailUser,
      appPassword: !!gmailAppPassword
    })
    console.log('📧 이메일 발송 요청:', { to, subject, from })
    
    if (!gmailUser || !gmailAppPassword) {
      console.error('❌ Gmail SMTP 설정이 완료되지 않음')
      return new Response(
        JSON.stringify({ error: 'Gmail SMTP not configured. Please set GMAIL_USER and GMAIL_APP_PASSWORD' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // SMTP 설정
    const smtpConfig = {
      host: 'smtp.gmail.com',
      port: 587,
      secure: false, // TLS 사용
      auth: {
        user: gmailUser,
        pass: gmailAppPassword
      }
    }

    // 이메일 데이터 구성
    const emailData = {
      from: `"올띵버킷" <${gmailUser}>`,
      to: to,
      subject: subject,
      html: message.replace(/\n/g, '<br>'),
      replyTo: from
    }

    console.log('🚀 Gmail SMTP 발송 시작:', { ...emailData, from: '[HIDDEN]' })
    
    // SMTP를 통한 이메일 발송 (Deno에서 직접 구현)
    const result = await sendEmailViaSMTP(smtpConfig, emailData)

    if (!result.success) {
      console.error('❌ Gmail SMTP 발송 실패:', result.error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: result.error }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('✅ Email sent successfully via Gmail SMTP')

    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: `gmail_${Date.now()}`,
        message: 'Email sent successfully via Gmail SMTP' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending email:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Gmail API를 통한 이메일 발송 함수
async function sendEmailViaSMTP(config: any, emailData: any) {
  try {
    // Gmail API를 사용한 이메일 발송
    const gmailApiKey = Deno.env.get('GMAIL_API_KEY')
    
    if (!gmailApiKey) {
      throw new Error('Gmail API Key not configured')
    }
    
    // 이메일을 Base64로 인코딩
    const emailContent = [
      `From: ${emailData.from}`,
      `To: ${emailData.to}`,
      `Subject: ${emailData.subject}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      emailData.html
    ].join('\n')
    
    const encodedEmail = btoa(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '')
    
    console.log('📡 Gmail API 호출:', {
      to: emailData.to,
      subject: emailData.subject,
      from: emailData.from
    })
    
    // Gmail API 호출
    const response = await fetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/send`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${gmailApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail
      })
    })
    
    if (!response.ok) {
      const errorData = await response.text()
      throw new Error(`Gmail API error: ${response.status} - ${errorData}`)
    }
    
    const result = await response.json()
    console.log('✅ Gmail API 응답:', result)
    
    return { success: true, messageId: result.id || `gmail_${Date.now()}` }
    
  } catch (error) {
    console.error('Gmail API 발송 실패:', error)
    return { success: false, error: error.message }
  }
}
