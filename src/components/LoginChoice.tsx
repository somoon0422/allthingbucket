import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'
import {ArrowLeft, Home, Users} from 'lucide-react'
import { KakaoAuthService } from '../services/kakaoAuthService'

const LoginChoice: React.FC = () => {
  // 🛡️ 훅을 최상단에서만 호출
  const authHook = useAuth()
  const [loading, setLoading] = useState(false)

  // 🔐 안전한 로그인 처리
  const handleGoogleLogin = () => {
    setLoading(true)
    
    // 비동기 처리를 Promise로 안전하게 래핑
    Promise.resolve().then(async () => {
      try {
        console.log('🔐 구글 로그인 시도')
        
        // 안전한 함수 호출
        if (authHook && typeof authHook.login === 'function') {
          await authHook.login({})
          console.log('✅ 로그인 성공, 홈으로 이동')
          setTimeout(() => {
            window.location.href = '/home'
          }, 1000)
        } else {
          throw new Error('로그인 함수를 찾을 수 없습니다')
        }
      } catch (error) {
        console.error('❌ 구글 로그인 오류:', error)
        toast.error('로그인 중 오류가 발생했습니다')
      } finally {
        setLoading(false)
      }
    }).catch((error) => {
      console.error('❌ 로그인 처리 실패:', error)
      toast.error('로그인 처리 중 오류가 발생했습니다')
      setLoading(false)
    })
  }

  // 🟡 카카오 로그인 처리
  const handleKakaoLogin = () => {
    setLoading(true)
    
    try {
      console.log('🟡 카카오 로그인 시도')
      KakaoAuthService.startKakaoLogin()
    } catch (error) {
      console.error('❌ 카카오 로그인 오류:', error)
      toast.error('카카오 로그인 중 오류가 발생했습니다')
      setLoading(false)
    }
  }

  // 🛡️ 안전한 네비게이션 함수들
  const handleGoBack = () => {
    try {
      window.history.back()
    } catch (error) {
      console.error('뒤로가기 실패:', error)
      window.location.href = '/'
    }
  }

  const handleGoHome = () => {
    try {
      window.location.href = '/'
    } catch (error) {
      console.error('홈 이동 실패:', error)
    }
  }

  const handleAdminLogin = () => {
    try {
      window.location.href = '/admin/login'
    } catch (error) {
      console.error('관리자 로그인 이동 실패:', error)
    }
  }


  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-400 via-pink-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        {/* 🏠 네비게이션 버튼들 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors"
            title="뒤로가기"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleGoHome}
            className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors"
            title="홈으로"
            type="button"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* 🎨 새로운 로고 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="올띵버킷 로고" className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-navy-600 to-pink-600 bg-clip-text text-transparent mb-2">
            올띵버킷
          </h1>
          <p className="text-gray-600 mb-6">체험단 플랫폼</p>
        </div>

        {/* 🔐 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed mb-4"
          type="button"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>{loading ? '로그인 중...' : 'Google로 계속하기'}</span>
        </button>

        {/* 🟡 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          disabled={loading}
          className="w-full bg-yellow-400 text-gray-800 py-4 rounded-xl font-medium hover:bg-yellow-500 transition-all duration-200 flex items-center justify-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed mb-6"
          type="button"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#3C1E1E" d="M12 3C6.48 3 2 6.48 2 10.8c0 2.52 1.6 4.8 4.1 6.2L5.4 19.2c-.1.2.1.4.3.3l2.8-1.4c.8.2 1.6.3 2.5.3 5.52 0 10-3.48 10-7.8S17.52 3 12 3z"/>
          </svg>
          <span>{loading ? '로그인 중...' : '카카오로 계속하기'}</span>
        </button>

        {/* 🔧 관리자 로그인 링크 */}
        <div className="text-center">
          <button
            onClick={handleAdminLogin}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center space-x-1 mx-auto"
            type="button"
          >
            <Users className="w-4 h-4" />
            <span>관리자 로그인</span>
          </button>
        </div>

        {/* 🎯 디버깅 정보 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-sm font-semibold text-primary-800 mb-2">🔧 시스템 상태</h3>
          <ul className="text-xs text-primary-700 space-y-1">
            <li>• 훅 상태: {authHook ? '정상' : '오류'}</li>
            <li>• 로그인 함수: {typeof authHook?.login === 'function' ? '사용가능' : '불가'}</li>
            <li>• 로딩 상태: {loading ? '진행중' : '대기중'}</li>
            <li>• 런타임 오류 방지 모드 활성화</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default LoginChoice