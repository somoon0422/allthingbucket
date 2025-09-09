
import React from 'react'
import {ArrowLeft, Home, Users} from 'lucide-react'

// 🛡️ 완전히 안전한 로그인 컴포넌트
const SafeLoginChoice: React.FC = () => {
  // 🔧 상태 없는 안전한 함수들만 사용
  const handleGoogleLogin = () => {
    try {
      console.log('🔐 안전한 구글 로그인 시도')
      
      // 직접 Lumi SDK 호출 (훅 사용 안함)
      if (window && (window as any).lumi) {
        const lumi = (window as any).lumi
        lumi.auth.signIn().then((result: any) => {
          if (result?.user) {
            console.log('✅ 로그인 성공:', result.user)
            localStorage.setItem('temp_login_success', 'true')
            localStorage.setItem('temp_user_data', JSON.stringify(result.user))
            window.location.href = '/home'
          } else {
            console.error('❌ 로그인 실패')
            alert('로그인에 실패했습니다')
          }
        }).catch((error: any) => {
          console.error('❌ 로그인 오류:', error)
          alert('로그인 중 오류가 발생했습니다')
        })
      } else {
        console.error('❌ Lumi SDK 없음')
        alert('시스템 오류가 발생했습니다')
      }
    } catch (error) {
      console.error('❌ 로그인 처리 실패:', error)
      alert('로그인 처리 중 오류가 발생했습니다')
    }
  }

  const handleGoBack = () => {
    try {
      window.history.back()
    } catch (error) {
      window.location.href = '/'
    }
  }

  const handleGoHome = () => {
    window.location.href = '/'
  }

  const handleAdminLogin = () => {
    window.location.href = '/admin/login'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 w-full max-w-sm">
        {/* 🏠 네비게이션 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={handleGoBack}
            className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors"
            type="button"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
          <button
            onClick={handleGoHome}
            className="p-2 rounded-full bg-white/50 hover:bg-white/70 transition-colors"
            type="button"
          >
            <Home className="w-5 h-5 text-gray-700" />
          </button>
        </div>

        {/* 🎨 로고 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img src="/logo.png" alt="올띵버킷 로고" className="w-20 h-20" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
            올띵버킷
          </h1>
          <p className="text-gray-600 mb-6">체험단 플랫폼</p>
        </div>

        {/* 🔐 구글 로그인 */}
        <button
          onClick={handleGoogleLogin}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-4 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 flex items-center justify-center space-x-3 mb-6"
          type="button"
        >
          <svg className="w-6 h-6" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          <span>Google로 계속하기</span>
        </button>

        {/* 🔧 관리자 로그인 */}
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

        {/* 🎯 안전 모드 표시 */}
        <div className="mt-6 p-4 bg-green-50 rounded-lg border border-green-200">
          <h3 className="text-sm font-semibold text-green-800 mb-2">🛡️ 안전 모드</h3>
          <ul className="text-xs text-green-700 space-y-1">
            <li>• 훅 사용 최소화</li>
            <li>• 직접 SDK 호출</li>
            <li>• 런타임 오류 방지</li>
            <li>• 안전한 패턴만 사용</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

export default SafeLoginChoice
