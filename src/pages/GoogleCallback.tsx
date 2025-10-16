import React, { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { GoogleAuthService } from '../services/googleAuthService'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

const GoogleCallback: React.FC = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { login } = useAuth()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleGoogleCallback = async () => {
      try {
        const code = searchParams.get('code')
        const error = searchParams.get('error')
        const errorDescription = searchParams.get('error_description')

        console.log('Google OAuth 콜백 파라미터:', {
          code: code ? '있음' : '없음',
          error,
          errorDescription,
          allParams: Object.fromEntries(searchParams.entries())
        })

        if (error) {
          const errorMessage = errorDescription || error
          console.error('Google OAuth 오류:', errorMessage)
          throw new Error(`Google 로그인 오류: ${errorMessage}`)
        }

        if (!code) {
          throw new Error('인증 코드를 받지 못했습니다')
        }

        // Google OAuth 콜백 처리
        const result = await GoogleAuthService.handleGoogleCallback(code)
        
        if (result.user && result.token) {
          // 팝업에서 부모 창으로 성공 메시지 전송
          if (window.opener) {
            window.opener.postMessage({
              type: 'GOOGLE_LOGIN_SUCCESS',
              payload: { user: result.user, token: result.token }
            }, window.location.origin)
            window.close()
            return
          }
          
          // 일반 페이지인 경우 (팝업이 아닌 경우)
          // 토큰을 localStorage에 저장
          localStorage.setItem('auth_token', result.token)
          
          // 사용자 정보를 AuthContext에 설정
          await login(result.user)
          
          navigate('/')
        } else {
          throw new Error('사용자 정보를 가져올 수 없습니다')
        }
      } catch (error: any) {
        console.error('Google OAuth 콜백 처리 실패:', error)
        
        // 팝업에서 부모 창으로 에러 메시지 전송
        if (window.opener) {
          window.opener.postMessage({
            type: 'GOOGLE_LOGIN_ERROR',
            error: error.message || 'Google 로그인에 실패했습니다'
          }, window.location.origin)
          window.close()
          return
        }
        
        setError(error.message || 'Google 로그인에 실패했습니다')
        toast.error(error.message || 'Google 로그인에 실패했습니다')
      } finally {
        setLoading(false)
      }
    }

    handleGoogleCallback()
  }, [searchParams, navigate, login])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Google 로그인 처리 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인 실패</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-4 py-2 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            홈으로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return null
}

export default GoogleCallback
