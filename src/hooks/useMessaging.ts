import { useState } from 'react'
import { supabase } from '../lib/dataService'

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

  // 이메일 발송 (백엔드 API 호출)
  const sendEmail = async (options: {
    to: string
    subject: string
    message: string
    userInfo?: { name: string }
  }) => {
    try {
      console.log('📧 이메일 발송 시작:', options.to)
      
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/send-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: options.to,
          subject: options.subject,
          message: options.message,
          userInfo: options.userInfo
        })
      })

      const data = await response.json()

      if (!response.ok) {
        console.error('❌ 백엔드 API 호출 실패:', data)
        throw new Error(`이메일 발송 실패: ${data.error || 'Unknown error'}`)
      }

      if (!data.success) {
        console.error('❌ 이메일 발송 실패:', data.error)
        console.error('❌ 전체 응답 데이터:', data)
        throw new Error(`이메일 발송 실패: ${data.error}`)
      }
      
      console.log('✅ 이메일 발송 완료:', data.messageId)
      console.log('✅ 전체 응답 데이터:', data)
      return { success: true, method: 'email', messageId: data.messageId }
      
    } catch (error: any) {
      console.error('❌ 이메일 발송 실패:', error)
      throw new Error(`이메일 발송 실패: ${error.message}`)
    }
  }

  // SMS 발송 (실제 API 호출)
  const sendSMS = async (options: {
    phone: string
    message: string
    userInfo?: { name: string }
  }) => {
    try {
      console.log('📱 SMS 발송 시작:', options.phone)
      
      const { data, error } = await supabase.functions.invoke('send-sms', {
        body: {
          to: options.phone,
          message: options.message,
          from: '+821012345678'
        }
      })

      if (error) {
        console.error('❌ Supabase 함수 호출 실패:', error)
        throw new Error(`SMS 발송 실패: ${error.message}`)
      }

      if (!data.success) {
        console.error('❌ SMS 발송 실패:', data.error)
        throw new Error(`SMS 발송 실패: ${data.error}`)
      }
      
      console.log('✅ SMS 발송 완료:', data.messageId)
      return { success: true, method: 'sms', messageId: data.messageId }
      
    } catch (error: any) {
      console.error('❌ SMS 발송 실패:', error)
      throw new Error(`SMS 발송 실패: ${error.message}`)
    }
  }

  // 카카오톡 발송 (시뮬레이션)
  const sendKakaoMessage = async (options: {
    phone: string
    message: string
    userInfo?: { name: string }
    config: KakaoConfig
  }) => {
    try {
      console.log('💬 카카오톡 발송 시뮬레이션:', options.phone)
      
      // 실제 카카오톡 발송은 백엔드에서 처리
      // 여기서는 시뮬레이션만 수행
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      console.log('✅ 카카오톡 발송 시뮬레이션 완료')
      return { success: true, method: 'kakao_simulation' }
      
    } catch (error: any) {
      console.error('❌ 카카오톡 발송 실패:', error)
      return { success: true, method: 'kakao_simulation' }
    }
  }

  // 통합 발송 함수
  const sendMessage = async (options: MessageOptions) => {
    setLoading(true)
    const results: Array<{ success: boolean; method: string; error?: string }> = []
    
    try {
      console.log('🚀 메시지 발송 시작:', options.type, options.to)
      
      // 이메일 발송
      if (options.type === 'email' || options.type === 'both') {
        try {
          const result = await sendEmail({
            to: options.to,
            subject: options.subject || '올띵버킷 체험단 안내',
            message: options.message,
            userInfo: options.userInfo
          })
          results.push({ success: true, method: result.method })
        } catch (error: any) {
          console.error('이메일 발송 실패:', error)
          results.push({ success: false, method: 'email', error: error.message })
        }
      }

      // SMS 발송
      if ((options.type === 'sms' || options.type === 'both') && options.userInfo?.phone) {
        try {
          const result = await sendSMS({
            phone: options.userInfo.phone,
            message: options.message,
            userInfo: options.userInfo
          })
          results.push({ success: true, method: result.method })
        } catch (error: any) {
          console.error('SMS 발송 실패:', error)
          results.push({ success: false, method: 'sms', error: error.message })
        }
      }

      // 카카오 알림톡 발송
      if ((options.type === 'kakao' || options.type === 'both') && options.userInfo?.phone) {
        try {
          const kakaoConfig = getKakaoConfig()
          const result = await sendKakaoMessage({
            phone: options.userInfo.phone,
            message: options.message,
            userInfo: options.userInfo,
            config: kakaoConfig
          })
          results.push({ success: true, method: result.method })
        } catch (error: any) {
          console.error('카카오 알림톡 발송 실패:', error)
          results.push({ success: false, method: 'kakao', error: error.message })
        }
      }

      return results
      
    } finally {
      setLoading(false)
    }
  }

  // SMS 설정 가져오기
  const getSMSConfig = () => {
    return {
      accessKey: import.meta.env.VITE_SMS_ACCESS_KEY || '',
      secretKey: import.meta.env.VITE_SMS_SECRET_KEY || '',
      serviceId: import.meta.env.VITE_SMS_SERVICE_ID || '',
      fromNumber: import.meta.env.VITE_SMS_FROM_NUMBER || '01012345678'
    }
  }

  // 카카오 설정 가져오기
  const getKakaoConfig = (): KakaoConfig => {
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