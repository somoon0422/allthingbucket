import React, { useEffect, useState } from 'react'
import { SupabaseOAuthService } from '../services/supabaseOAuthService'
import { useAuth } from '../hooks/useAuth'

const AuthCallback: React.FC = () => {
  const [isProcessing, setIsProcessing] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { login } = useAuth()

  useEffect(() => {
    const handleOAuthCallback = async () => {
      try {
        console.log('🔥 OAuth 콜백 처리 시작...')
        
        // Supabase OAuth 콜백 처리
        const result = await SupabaseOAuthService.handleOAuthCallback()
        
        console.log('✅ OAuth 로그인 성공:', result)
        
        // 기존 관리자 세션 완전 정리 (구글 로그인 시 일반 사용자로 로그인)
        localStorage.removeItem('admin_token')
        localStorage.removeItem('admin_session')
        sessionStorage.removeItem('admin_token')
        sessionStorage.removeItem('admin_session')
        
        console.log('✅ 어드민 세션 완전 정리 완료')
        
        // 토큰을 localStorage에 저장
        localStorage.setItem('auth_token', result.token)
        
        // 사용자 정보를 AuthContext에 설정 (role을 명시적으로 'user'로 설정)
        const authUser = {
          id: result.user.id,
          user_id: result.user.id,
          name: result.user.name || result.user.email?.split('@')[0] || '사용자',
          email: result.user.email,
          role: 'user', // 명시적으로 user role 설정
          profile: null
        }
        
        console.log('✅ AuthCallback에서 설정할 사용자 정보:', authUser)
        
        await login(authUser)
        
        // 직접 리다이렉트 방식이므로 홈으로 이동
        window.location.href = '/'
        
      } catch (error: any) {
        console.error('❌ OAuth 콜백 처리 실패:', error)
        setError(error.message || '인증 처리에 실패했습니다')
        
        // 에러 발생 시 3초 후 홈으로 리다이렉트
        setTimeout(() => {
          window.location.href = '/'
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
