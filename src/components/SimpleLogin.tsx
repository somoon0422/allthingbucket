
import React from 'react'
import { GoogleAuthService } from '../services/googleAuthService'

const SimpleLogin: React.FC = () => {
  const [loading, setLoading] = React.useState(false)

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      await GoogleAuthService.handleGoogleLogin()
    } catch (error) {
      console.error('Google 로그인 오류:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="올띵버킷 로고" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">올띵버킷</h1>
          <p className="text-gray-600">체험단 플랫폼</p>
        </div>

        {/* Google 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
        >
          {loading ? '로그인 중...' : 'Google로 시작하기'}
        </button>

        {/* 관리자 로그인 */}
        <div className="text-center mt-6">
          <a 
            href="/admin/login"
            className="text-gray-500 hover:text-gray-700 text-sm"
          >
            관리자 로그인
          </a>
        </div>
      </div>
    </div>
  )
}

export default SimpleLogin
