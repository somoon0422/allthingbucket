import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { GoogleAuthService } from '../services/googleAuthService'

const GoogleOAuthCallback = () => {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')

        if (error) {
          throw new Error(`Google OAuth 오류: ${error}`)
        }

        if (!code) {
          throw new Error('인증 코드를 받지 못했습니다')
        }

        console.log('🔄 Google OAuth 콜백 처리 시작...')

        // Google OAuth 콜백 처리
        const userInfo = await GoogleAuthService.handleGoogleCallback(code)
        
        console.log('✅ Google OAuth 콜백 처리 성공:', userInfo)
        
        // 토큰을 localStorage에 저장
        if (userInfo.token) {
          localStorage.setItem('auth_token', userInfo.token)
        }
        
        // 성공 이벤트 발생
        window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
          detail: { user: userInfo.user, token: userInfo.token } 
        }))

        setStatus('success')
        
        // 잠시 후 홈페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)

      } catch (error) {
        console.error('❌ Google OAuth 콜백 처리 실패:', error)
        
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
        setError(errorMessage)
        setStatus('error')

        // 오류 이벤트 발생
        window.dispatchEvent(new CustomEvent('googleLoginError', { 
          detail: { error: errorMessage } 
        }))

        // 잠시 후 홈페이지로 리다이렉트
        setTimeout(() => {
          window.location.href = '/'
        }, 3000)
      }
    }

    handleCallback()
  }, [searchParams])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Google 로그인 처리 중...
              </h2>
              <p className="text-gray-600">
                잠시만 기다려주세요.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-600 text-4xl mb-4">✅</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                로그인 성공!
              </h2>
              <p className="text-gray-600">
                창이 자동으로 닫힙니다.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-600 text-4xl mb-4">❌</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                로그인 실패
              </h2>
              <p className="text-gray-600 mb-4">
                {error}
              </p>
              <p className="text-sm text-gray-500">
                창이 자동으로 닫힙니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default GoogleOAuthCallback
