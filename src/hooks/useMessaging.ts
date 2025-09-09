
import { useState } from 'react'
import { lumi } from '../lib/lumi'

interface MessageOptions {
  to: string
  subject?: string
  message: string
  type: 'email' | 'sms' | 'kakao' | 'both'
  userInfo?: {
    name: string
    email: string
    phone?: string
  }
}

interface KakaoConfig {
  accessToken: string
  templateId?: string
  plusFriendId?: string
}

export const useMessaging = () => {
  const [loading, setLoading] = useState(false)

  // 🔥 1. 이메일 발송 (Lumi SDK)
  const sendEmail = async (options: {
    to: string
    subject: string
    message: string
    userInfo?: { name: string }
  }) => {
    try {
      console.log('📧 이메일 발송 시작:', options.to)
      
      // 🔥 이메일 설정 (환경변수 또는 기본값)
      const emailConfig = {
        fromName: import.meta.env.VITE_EMAIL_FROM_NAME || '올띵버킷 체험단',
        companyName: import.meta.env.VITE_COMPANY_NAME || '올띵버킷',
        supportEmail: import.meta.env.VITE_SUPPORT_EMAIL || 'support@allthingbucket.com',
        supportPhone: import.meta.env.VITE_SUPPORT_PHONE || '010-7290-7620',
        website: import.meta.env.VITE_WEBSITE_URL || 'https://allthingbucket.com'
      }
      
      // 🔥 디버깅: 이메일 설정값 출력  
      console.log('📧 이메일 설정값:', emailConfig)
      console.log('📧 환경변수 확인:', {
        VITE_EMAIL_FROM_NAME: import.meta.env.VITE_EMAIL_FROM_NAME,
        VITE_COMPANY_NAME: import.meta.env.VITE_COMPANY_NAME,
        VITE_SUPPORT_EMAIL: import.meta.env.VITE_SUPPORT_EMAIL,
        VITE_SUPPORT_PHONE: import.meta.env.VITE_SUPPORT_PHONE,
        VITE_WEBSITE_URL: import.meta.env.VITE_WEBSITE_URL
      })
      
      // ⚠️ 중요: 이메일은 웹사이트에 로그인한 사용자에게만 발송 가능
      const emailPayload = {
        to: options.to,
        subject: options.subject,
        from: emailConfig.supportEmail, // 🔥 발신자 이메일 주소 설정
        fromName: emailConfig.fromName,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0;">
              <h1 style="margin: 0; font-size: 24px;">🎉 ${emailConfig.companyName} 체험단</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">체험단 선정 안내</p>
            </div>
            
            <div style="background: white; padding: 30px; border: 1px solid #e0e0e0; border-top: none; border-radius: 0 0 10px 10px;">
              <h2 style="color: #333; margin-bottom: 20px;">안녕하세요 ${options.userInfo?.name || '고객'}님! 👋</h2>
              
              <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${options.message.replace(/\n/g, '<br>')}
              </div>
              
              <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; text-align: center; color: #666;">
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <h3 style="color: #333; margin-bottom: 15px;">📞 문의 및 고객센터</h3>
                  <p style="margin: 8px 0;"><strong>📧 이메일 문의:</strong> <a href="mailto:${emailConfig.supportEmail}" style="color: #667eea; text-decoration: none;">${emailConfig.supportEmail}</a></p>
                  <p style="margin: 8px 0;"><strong>📱 전화 문의:</strong> ${emailConfig.supportPhone}</p>
                  <p style="margin: 8px 0;"><strong>🌐 웹사이트:</strong> <a href="${emailConfig.website}" style="color: #667eea; text-decoration: none;">${emailConfig.website}</a></p>
                  <p style="margin: 8px 0; font-size: 14px; color: #888;">평일 09:00-18:00 (주말 및 공휴일 휴무)</p>
                </div>
                <p style="margin-top: 20px;"><strong>${emailConfig.companyName} 체험단 팀 드림</strong></p>
                <p style="font-size: 12px; margin-top: 20px; color: #999;">※ 이 메일은 발송전용입니다. 회신이 불가능하니 문의사항은 위 고객센터로 연락해주세요.</p>
              </div>
            </div>
          </div>
        `
      }
      
      // 🔥 디버깅: Lumi SDK에 전달되는 페이로드 출력
      console.log('📧 Lumi SDK 페이로드:', JSON.stringify(emailPayload, null, 2))
      
      // Lumi SDK 이메일 발송
      const result = await lumi.tools.email.send(emailPayload)
      console.log('📧 Lumi SDK 응답:', result)
      
      console.log('✅ 이메일 발송 성공')
      return { success: true, method: 'email' }
      
    } catch (error: any) {
      console.error('❌ 이메일 발송 실패:', error)
      
      if (error.message?.includes('not registered')) {
        throw new Error('이메일 발송 실패: 사용자가 웹사이트에 로그인한 적이 없습니다')
      }
      
      throw new Error(`이메일 발송 실패: ${error.message}`)
    }
  }

  // 🔥 2. SMS 발송 (실제 SMS API)
  const sendSMS = async (options: {
    phone: string
    message: string
    userInfo?: { name: string }
  }) => {
    try {
      console.log('📱 SMS 발송 시작:', options.phone)
      
      const smsConfig = getSMSConfig()
      
      // 🔥 환경변수 설정 확인
      if (!smsConfig.accessKey || !smsConfig.secretKey || !smsConfig.serviceId) {
        console.log('⚠️ SMS API 설정이 불완전합니다. 시뮬레이션 모드로 전환')
        return { success: true, method: 'sms_simulation' }
      }

      // 🔥 실제 SMS 발송을 위한 백엔드 API 호출
      // 프론트엔드에서 직접 네이버 클라우드 API 호출은 보안상 위험하므로
      // 백엔드 API를 통해 SMS 발송하는 것이 권장됩니다
      
      try {
        // 백엔드 SMS API 호출
        const response = await fetch('http://localhost:3001/api/sms/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            to: options.phone.replace(/-/g, ''),
            message: `[올띵버킷] ${options.message}`,
            from: smsConfig.fromNumber
          })
        })

        if (!response.ok) {
          throw new Error('백엔드 SMS API 호출 실패')
        }

        console.log('✅ SMS 발송 성공 (백엔드 API)')
        return { success: true, method: 'sms' }
        
      } catch (backendError) {
        console.log('🔄 백엔드 SMS API 없음, 시뮬레이션 모드로 전환')
        return { success: true, method: 'sms_simulation' }
      }
      
    } catch (error: any) {
      console.error('❌ SMS 발송 실패:', error)
      
      // 🔥 모든 실패 시 시뮬레이션 모드로 전환
      console.log('🔄 SMS 시뮬레이션 모드로 전환')
      return { success: true, method: 'sms_simulation' }
    }
  }

  // 🔥 3. 카카오톡 발송 (비즈니스 API) - 백업 옵션
  const sendKakaoMessage = async (options: {
    phone: string
    message: string
    userInfo?: { name: string }
    config: KakaoConfig
  }) => {
    try {
      console.log('💬 카카오톡 발송 시작:', options.phone)
      
      // 카카오 비즈니스 메시지 API 호출
      const response = await fetch('https://kapi.kakao.com/v2/api/talk/memo/default/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${options.config.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          template_object: JSON.stringify({
            object_type: 'text',
            text: `🎉 올띵버킷 체험단 안내\n\n안녕하세요 ${options.userInfo?.name || '고객'}님!\n\n${options.message}\n\n문의: 올띵버킷 체험단 팀`,
            link: {
              web_url: window.location.origin,
              mobile_web_url: window.location.origin
            }
          })
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(`카카오 API 오류: ${errorData.msg || response.statusText}`)
      }

      console.log('✅ 카카오톡 발송 성공')
      return { success: true, method: 'kakao' }
      
    } catch (error: any) {
      console.error('❌ 카카오톡 발송 실패:', error)
      throw new Error(`카카오톡 발송 실패: ${error.message}`)
    }
  }

  // 🔥 3. 통합 발송 함수
  const sendMessage = async (options: MessageOptions) => {
    setLoading(true)
    const results: Array<{ success: boolean; method: string; error?: string }> = []
    
    try {
      console.log('🚀 메시지 발송 시작:', options.type, options.to)
      
      // 이메일 발송
      if (options.type === 'email' || options.type === 'both') {
        try {
          await sendEmail({
            to: options.to,
            subject: options.subject || '올띵버킷 체험단 안내',
            message: options.message,
            userInfo: options.userInfo
          })
          results.push({ success: true, method: 'email' })
          // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
        } catch (error: any) {
          console.error('이메일 발송 실패:', error)
          
          // 🔥 사용자가 로그인하지 않은 경우 특별 처리
          if (error.message?.includes('로그인한 적이 없습니다')) {
            results.push({ 
              success: false, 
              method: 'email', 
              error: '해당 사용자가 웹사이트에 로그인한 적이 없어 이메일 발송이 불가능합니다. SMS나 카카오 알림톡을 사용해주세요.' 
            })
          } else {
            results.push({ success: false, method: 'email', error: error.message })
          }
          
          // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
          console.log('이메일 발송 실패, 다른 방식으로 계속 진행')
        }
      }

      // SMS 발송 (설정이 있는 경우)
      if ((options.type === 'sms' || options.type === 'both') && options.userInfo?.phone) {
        try {
          const smsResult = await sendSMS({
            phone: options.userInfo.phone,
            message: options.message,
            userInfo: options.userInfo
          })
          
          if (smsResult.method === 'sms_simulation') {
            results.push({ success: true, method: 'sms_simulation' })
            // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
          } else {
            results.push({ success: true, method: 'sms' })
            // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
          }
        } catch (error: any) {
          console.error('SMS 발송 실패:', error)
          results.push({ success: false, method: 'sms', error: error.message })
          
          // SMS 실패 시 카카오톡으로 대체 시도
          const kakaoConfig = getKakaoConfig()
          if (kakaoConfig.accessToken) {
            try {
              await sendKakaoMessage({
                phone: options.userInfo.phone,
                message: options.message,
                userInfo: options.userInfo,
                config: kakaoConfig
              })
              results.push({ success: true, method: 'kakao' })
              // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
            } catch (kakaoError: any) {
              console.error('카카오톡 대체 발송도 실패:', kakaoError)
              results.push({ success: false, method: 'kakao', error: kakaoError.message })
              // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
            }
          } else {
            // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
          }
        }
      }

      // 🔥 카카오 알림톡 발송 (설정이 있는 경우)
      if ((options.type === 'kakao' || options.type === 'both') && options.userInfo?.phone) {
        try {
          const kakaoConfig = getKakaoConfig()
          if (kakaoConfig.accessToken) {
            await sendKakaoMessage({
              phone: options.userInfo.phone,
              message: options.message,
              userInfo: options.userInfo,
              config: kakaoConfig
            })
            results.push({ success: true, method: 'kakao' })
            // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
          } else {
            console.log('카카오 알림톡 설정이 없습니다')
            results.push({ success: false, method: 'kakao', error: '카카오 알림톡 설정이 없습니다' })
          }
        } catch (error: any) {
          console.error('카카오 알림톡 발송 실패:', error)
          results.push({ success: false, method: 'kakao', error: error.message })
          // 🔥 개별 토스트 제거 - 상위 컴포넌트에서 처리
        }
      }

      return results
      
    } finally {
      setLoading(false)
    }
  }

  // 🔥 SMS 설정 가져오기 (환경변수 또는 DB에서)
  const getSMSConfig = () => {
    return {
      accessKey: import.meta.env.VITE_SMS_ACCESS_KEY || '',
      secretKey: import.meta.env.VITE_SMS_SECRET_KEY || '',
      serviceId: import.meta.env.VITE_SMS_SERVICE_ID || '',
      fromNumber: import.meta.env.VITE_SMS_FROM_NUMBER || '01012345678'
    }
  }

  // 🔥 카카오 설정 가져오기 (환경변수 또는 DB에서)
  const getKakaoConfig = (): KakaoConfig => {
    // 실제 구현 시에는 환경변수나 관리자 설정에서 가져옴
    return {
      accessToken: import.meta.env.VITE_KAKAO_ACCESS_TOKEN || '',
      templateId: import.meta.env.VITE_KAKAO_TEMPLATE_ID || '',
      plusFriendId: import.meta.env.VITE_KAKAO_PLUS_FRIEND_ID || ''
    }
  }

  return {
    sendMessage,
    sendEmail,
    sendSMS,
    sendKakaoMessage,
    loading
  }
}

export default useMessaging
