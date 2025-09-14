import React from 'react'
import { SupabaseOAuthService } from '../services/supabaseOAuthService'
import toast from 'react-hot-toast'

interface KakaoLoginButtonProps {
  onError?: (error: string) => void
  className?: string
  children?: React.ReactNode
}

export const KakaoLoginButton: React.FC<KakaoLoginButtonProps> = ({
  onError,
  className = '',
  children
}) => {
  const handleKakaoLogin = async () => {
    try {
      console.log('🔥 Supabase Kakao OAuth 로그인 시작...')
      
      // 직접 리다이렉트 방식이므로 Promise는 resolve되지 않음
      await SupabaseOAuthService.signInWithKakao()
      
    } catch (error: any) {
      console.error('❌ Kakao OAuth 로그인 실패:', error)
      
      // 에러 메시지 표시
      const errorMessage = error.message || 'Kakao 로그인에 실패했습니다'
      toast.error(errorMessage)
      
      onError?.(error.message || 'Kakao 로그인에 실패했습니다')
    }
  }

  return (
    <button
      onClick={handleKakaoLogin}
      className={`flex items-center justify-center w-full px-4 py-3 bg-yellow-400 hover:bg-yellow-500 text-gray-800 rounded-lg transition-colors ${className}`}
    >
      {children || (
        <>
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.52 1.6 4.8 4.1 6.2L5.4 19.2c-.1.2.1.4.3.3l2.8-1.4c.8.2 1.6.3 2.5.3 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
          </svg>
          <span className="font-medium">Kakao로 계속하기</span>
        </>
      )}
    </button>
  )
}

export default KakaoLoginButton
