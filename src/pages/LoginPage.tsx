
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Calendar, Users } from 'lucide-react'
import toast from 'react-hot-toast'
import { GoogleAuthService } from '../services/googleAuthService'

const LoginPage: React.FC = () => {
  const { loginWithCredentials, register, login, loading } = useAuth()
  const navigate = useNavigate()
  const [isLogin, setIsLogin] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    birth_date: '',
    gender: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isLogin) {
      if (!formData.email || !formData.password) {
        toast.error('이메일과 비밀번호를 입력해주세요', { duration: 3000 })
        return
      }
      
      try {
        await loginWithCredentials(formData.email, formData.password)
        navigate('/home')
      } catch (error) {
        // 에러는 useAuth에서 처리됨
      }
    } else {
      if (!formData.email || !formData.password || !formData.name) {
        toast.error('필수 정보를 모두 입력해주세요')
        return
      }
      
      try {
        await register({
          email: formData.email,
          password: formData.password,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          birth_date: formData.birth_date,
          gender: formData.gender as 'male' | 'female' | 'other'
        })
        navigate('/home')
      } catch (error) {
        // 에러는 useAuth에서 처리됨
      }
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleGoogleLogin = async () => {
    try {
      await GoogleAuthService.handleGoogleLogin()
    } catch (error) {
      console.error('Google 로그인 실패:', error)
      toast.error('Google 로그인에 실패했습니다')
    }
  }

  // 개발용 테스트 로그인
  const handleTestLogin = async () => {
    try {
      const testUser = {
        id: 'test-user-123',
        user_id: 'test-user-123',
        name: '테스트 사용자',
        email: 'test@example.com',
        role: 'user'
      }
      
      await login(testUser)
      navigate('/')
    } catch (error) {
      console.error('테스트 로그인 실패:', error)
      toast.error('테스트 로그인에 실패했습니다')
    }
  }

  // Google 로그인 성공 이벤트 리스너
  useEffect(() => {
    let isHandled = false // 중복 실행 방지 플래그
    
    const handleGoogleLoginSuccess = async (event: any) => {
      if (isHandled) return // 이미 처리된 경우 무시
      isHandled = true
      
      const { user, token } = event.detail
      console.log('🔥 Google 로그인 성공:', user)
      
      try {
        // 토큰 저장 (Lumi SDK 토큰인 경우)
        if (token && token !== 'lumi_token') {
          localStorage.setItem('auth_token', token)
        }
        
        // 사용자 정보를 AuthContext 형식으로 변환
        const authUser = {
          id: user._id || user.id || user.user_id,
          user_id: user.user_id || user.id || user._id,
          name: user.name || user.email?.split('@')[0] || '사용자',
          email: user.email || '',
          role: 'user',
          profile: user
        }
        
        console.log('👤 AuthContext용 사용자 정보:', authUser)
        
        // AuthContext에 사용자 정보 설정
        await login(authUser)
        
        // 홈페이지로 이동
        navigate('/')
        
        // 페이지 새로고침으로 인증 상태 업데이트
        setTimeout(() => {
          window.location.reload()
        }, 500)
      } catch (error) {
        console.error('❌ Google 로그인 후 처리 실패:', error)
        toast.error('로그인 후 처리에 실패했습니다')
      }
    }

    window.addEventListener('googleLoginSuccess', handleGoogleLoginSuccess)
    
    return () => {
      window.removeEventListener('googleLoginSuccess', handleGoogleLoginSuccess)
    }
  }, [navigate, login])

  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-400 via-pink-400 to-orange-300 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* 로고 */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="올띵버킷 로고" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">올띵버킷</h1>
          <p className="text-gray-600">체험단 플랫폼</p>
        </div>

        {/* 탭 전환 */}
        <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              isLogin 
                ? 'bg-white text-navy-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            로그인
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              !isLogin 
                ? 'bg-white text-navy-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            회원가입
          </button>
        </div>

        {/* 구글 로그인 버튼 */}
        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 disabled:opacity-50 mb-4 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          구글로 {isLogin ? '로그인' : '회원가입'}
        </button>

        {/* 개발용 테스트 로그인 버튼 */}
        <button
          onClick={handleTestLogin}
          disabled={loading}
          className="w-full bg-green-500 text-white py-3 rounded-xl font-medium hover:bg-green-600 transition-all duration-200 disabled:opacity-50 mb-4 flex items-center justify-center gap-2"
        >
          <User className="w-5 h-5" />
          테스트 로그인 (개발용)
        </button>

        {/* 구분선 */}
        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">또는</span>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 이메일 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              이메일
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                placeholder="이메일을 입력하세요"
              />
            </div>
          </div>

          {/* 비밀번호 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              비밀번호
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleInputChange}
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                placeholder="비밀번호를 입력하세요"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* 회원가입시 추가 필드 */}
          {!isLogin && (
            <>
              {/* 이름 */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  이름
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                    placeholder="이름을 입력하세요"
                  />
                </div>
              </div>

              {/* 전화번호 */}
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  전화번호
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                    placeholder="010-1234-5678"
                  />
                </div>
              </div>

              {/* 주소 */}
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="address"
                    name="address"
                    type="text"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                    placeholder="주소를 입력하세요"
                  />
                </div>
              </div>

              {/* 생년월일 */}
              <div>
                <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
                  생년월일
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="birth_date"
                    name="birth_date"
                    type="date"
                    value={formData.birth_date}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  />
                </div>
              </div>

              {/* 성별 */}
              <div>
                <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                  성별
                </label>
                <div className="relative">
                  <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
                  >
                    <option value="">성별을 선택하세요</option>
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                    <option value="other">기타</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* 제출 버튼 */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-navy-500 to-pink-500 text-white py-4 rounded-xl font-medium hover:from-navy-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? '처리 중...' : (isLogin ? '로그인' : '회원가입')}
          </button>
        </form>

        {/* 관리자 로그인 링크 */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate('/admin/login')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            관리자 로그인
          </button>
        </div>
      </div>
    </div>
  )
}

export default LoginPage
