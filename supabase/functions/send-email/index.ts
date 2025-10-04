// Supabase Edge Function for sending emails
// 참고: https://supabase.com/docs/guides/functions/examples/send-email

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  toName: string
  subject: string
  html: string
  text: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Parse request body
    const { to, toName, subject, html, text }: EmailRequest = await req.json()

    if (!to || !subject || !html) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, html' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 🔥 실제 이메일 전송 로직
    // 여기서는 예시로 콘솔에 출력 (실제로는 SMTP 서비스 사용)
    console.log('📧 이메일 전송 요청:', {
      to,
      toName,
      subject,
      htmlLength: html.length,
      textLength: text.length
    })

    // 🔥 실제 구현 시 사용할 SMTP 서비스들:
    
    // 1. Resend (추천)
    // const resend = new Resend(Deno.env.get('RESEND_API_KEY'))
    // const result = await resend.emails.send({
    //   from: 'noreply@allthingbucket.com',
    //   to: [to],
    //   subject: subject,
    //   html: html,
    //   text: text,
    // })

    // 2. SendGrid
    // const sgMail = require('@sendgrid/mail')
    // sgMail.setApiKey(Deno.env.get('SENDGRID_API_KEY'))
    // const msg = {
    //   to: to,
    //   from: 'noreply@allthingbucket.com',
    //   subject: subject,
    //   text: text,
    //   html: html,
    // }
    // await sgMail.send(msg)

    // 3. AWS SES
    // const ses = new AWS.SES({ region: 'us-east-1' })
    // await ses.sendEmail({
    //   Source: 'noreply@allthingbucket.com',
    //   Destination: { ToAddresses: [to] },
    //   Message: {
    //     Subject: { Data: subject },
    //     Body: { Html: { Data: html }, Text: { Data: text } }
    //   }
    // }).promise()

    // 🔥 임시 응답 (실제 구현 전까지)
    const mockResult = {
      success: true,
      messageId: `mock_${Date.now()}`,
      message: `${toName}님에게 이메일을 전송했습니다.`
    }

    console.log('✅ 이메일 전송 성공:', mockResult)

    return new Response(
      JSON.stringify(mockResult),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ 이메일 전송 오류:', error)
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message,
        message: '이메일 전송 중 오류가 발생했습니다.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})