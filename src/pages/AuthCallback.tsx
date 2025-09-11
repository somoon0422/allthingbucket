import React, { useEffect, useState } from 'react'
import { SupabaseOAuthService } from '../services/supabaseOAuthService'

const AuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔥 OAuth 콜백 처리 시작...')
        
        // Supabase OAuth 콜백 처리
        const result = await SupabaseOAuthService.handleOAuthCallback()
        
        console.log('✅ OAuth 로그인 성공:', result)
        
        // 토큰을 localStorage에 저장
        localStorage.setItem('auth_token', result.token)
        
        // 부모 창에 성공 메시지 전송
        if (window.opener) {
          window.opener.postMessage({
            type: 'SUPABASE_AUTH_SUCCESS',
            result: result
          }, window.location.origin)
          
          // 팝업 창 닫기
          window.close()
        } else {
          // 팝업이 아닌 경우 홈으로 리다이렉트
          window.location.href = '/'
        }
        
      } catch (error: any) {
        console.error('❌ OAuth 콜백 처리 실패:', error)
        setError(error.message || '인증 처리에 실패했습니다')
        
        // 부모 창에 에러 메시지 전송
        if (window.opener) {
          window.opener.postMessage({
            type: 'SUPABASE_AUTH_ERROR',
            error: error.message || '인증 처리에 실패했습니다'
          }, window.location.origin)
        }
        
        // 에러 발생 시 3초 후 팝업 닫기
        setTimeout(() => {
          window.close()
        }, 3000)
      } finally {
        setIsProcessing(false)
      }
    }

    handleOAuthCallback()
  }, [])

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">올띵버킷 로그인 처리 중...</h2>
          <p className="text-gray-600">잠시만 기다려주세요.</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">올띵버킷 로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <p className="text-sm text-gray-500">이 창은 자동으로 닫힙니다.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">올띵버킷 로그인 성공</h2>
        <p className="text-gray-600">이 창은 자동으로 닫힙니다.</p>
      </div>
    </div>
  )
}

export default AuthCallback
