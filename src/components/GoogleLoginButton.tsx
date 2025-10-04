import React from 'react'
import { SupabaseOAuthService } from '../services/supabaseOAuthService'
import toast from 'react-hot-toast'

interface GoogleLoginButtonProps {
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({
  onError,
  className = '',
  children
}) => {
  const handleGoogleLogin = async () => {
    try {
      // 환경 확인
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const isProduction = window.location.hostname === 'allthingbucket.com'
      
      console.log('🔥 Google OAuth 로그인 시작...', { isDevelopment, isProduction })
      
      // 기존 관리자 세션 정리 (구글 로그인 시 일반 사용자로 로그인)
      localStorage.removeItem('admin_token')
      localStorage.removeItem('admin_session')
      
      // 모달 닫기 이벤트 발생
      window.dispatchEvent(new CustomEvent('closeLoginModal'))
      
      // 모든 환경에서 Supabase OAuth 사용 (안정적이고 에러 없음)
      console.log('🔄 Supabase OAuth 사용 (모든 환경)')
      
      // 사용자에게 친근한 메시지 표시
      toast.loading('올띵버킷으로 로그인 중...', { id: 'google-login' })
      
      await SupabaseOAuthService.signInWithGoogle()
      
      // 로딩 토스트 제거 (성공/실패는 다른 곳에서 처리)
      toast.dismiss('google-login')
      
    } catch (error) {
      console.error('❌ Google OAuth 로그인 실패:', error)

      // 에러 메시지 표시
      const errorMessage = error instanceof Error ? error.message : 'Google 로그인에 실패했습니다'
      toast.error(errorMessage)

      onError?.(errorMessage)
    }
  }

  // Google 로그인 성공 이벤트 리스너는 제거 (중복 처리 방지)

  return (
    <button
      onClick={handleGoogleLogin}
      className={`flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors ${className}`}
    >
      {children || (
        <>
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          <span className="text-gray-700 font-medium">Google로 계속하기</span>
        </>
      )}
    </button>
  )
}

export default GoogleLoginButton
