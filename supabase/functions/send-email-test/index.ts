import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

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
    const { to, subject, message, from = 'noreply@allthingbucket.com' } = await req.json()

    if (!to || !subject || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: to, subject, message' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // 테스트용 - 실제 이메일 발송 없이 로그만 출력
    console.log('📧 이메일 발송 요청:')
    console.log('  To:', to)
    console.log('  Subject:', subject)
    console.log('  From:', from)
    console.log('  Message:', message)

    // 실제 환경에서는 여기서 Resend API 호출
    // const resendApiKey = Deno.env.get('RESEND_API_KEY')
    // if (resendApiKey) {
    //   // 실제 이메일 발송 로직
    // }

    // 테스트용 응답
    return new Response(
      JSON.stringify({ 
        success: true, 
        messageId: `test_${Date.now()}`,
        message: '이메일 발송 요청이 처리되었습니다 (테스트 모드)',
        details: {
          to,
          subject,
          from,
          messageLength: message.length
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error processing email request:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
