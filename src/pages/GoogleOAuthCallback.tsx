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
        
        // 부모 창에 성공 메시지 전송
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_SUCCESS',
            user: userInfo
          }, window.location.origin)
        }

        setStatus('success')
        
        // 잠시 후 창 닫기
        setTimeout(() => {
          window.close()
        }, 1000)

      } catch (error) {
        console.error('❌ Google OAuth 콜백 처리 실패:', error)
        
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
        setError(errorMessage)
        setStatus('error')

        // 부모 창에 오류 메시지 전송
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_AUTH_ERROR',
            error: errorMessage
          }, window.location.origin)
        }

        // 잠시 후 창 닫기
        setTimeout(() => {
          window.close()
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
