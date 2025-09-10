import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KakaoAuthService } from '../services/kakaoAuthService'

export default function KakaoCallback() {
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const handleKakaoCallback = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get('code')
        const error = urlParams.get('error')

        if (error) {
          setStatus('error')
          setMessage('카카오 로그인이 취소되었습니다.')
          return
        }

        if (!code) {
          setStatus('error')
          setMessage('인증 코드를 받지 못했습니다.')
          return
        }

        console.log('카카오 OAuth 코드:', code)

        const result = await KakaoAuthService.handleKakaoCallback(code)

        if (result.success) {
          setStatus('success')
          setMessage('카카오 로그인이 성공했습니다!')
          
          // 사용자 정보를 localStorage에 저장
          localStorage.setItem('user', JSON.stringify(result.user))
          localStorage.setItem('token', result.user?.token || '')
          
          // 2초 후 홈페이지로 이동
          setTimeout(() => {
            navigate('/')
          }, 2000)
        } else {
          setStatus('error')
          setMessage(result.error || '카카오 로그인에 실패했습니다.')
        }
      } catch (error) {
        console.error('카카오 콜백 처리 실패:', error)
        setStatus('error')
        setMessage('카카오 로그인 처리 중 오류가 발생했습니다.')
      }
    }

    handleKakaoCallback()
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8">
        <div className="text-center">
          {status === 'loading' && (
            <>
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                카카오 로그인 처리 중...
              </h2>
              <p className="text-gray-600">
                잠시만 기다려주세요.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                로그인 성공!
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <p className="text-sm text-gray-500">
                잠시 후 홈페이지로 이동합니다...
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                로그인 실패
              </h2>
              <p className="text-gray-600 mb-4">
                {message}
              </p>
              <button
                onClick={() => navigate('/')}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-yellow-500 hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
              >
                홈페이지로 돌아가기
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
