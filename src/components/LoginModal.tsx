import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Calendar, Users, X } from 'lucide-react'
import { GoogleLoginButton } from './GoogleLoginButton'
import toast from 'react-hot-toast'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { loginWithCredentials, register, adminLoginWithCredentials, loading } = useAuth()
  const [isLogin, setIsLogin] = useState(true)
  const [isAdminMode, setIsAdminMode] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    address: '',
    birth_date: '',
    gender: '',
    admin_name: 'admin'
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isAdminMode) {
      // 관리자 로그인
      if (!formData.admin_name || !formData.password) {
        toast.error('관리자명과 비밀번호를 입력해주세요')
        return
      }
      
      try {
        await adminLoginWithCredentials(formData.admin_name, formData.password)
        onClose()
      } catch (error) {
        // 에러는 useAuth에서 처리됨
      }
    } else if (isLogin) {
      // 일반 사용자 로그인
      if (!formData.email || !formData.password) {
        toast.error('이메일과 비밀번호를 입력해주세요')
        return
      }
      
      try {
        await loginWithCredentials(formData.email, formData.password)
        onClose()
      } catch (error) {
        // 에러는 useAuth에서 처리됨
      }
    } else {
      // 일반 사용자 회원가입
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
        onClose()
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


  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // 관리자 로그인 모달 이벤트 리스너
  useEffect(() => {
    const handleOpenAdminLoginModal = () => {
      setIsAdminMode(true)
      setIsLogin(true)
    }

    window.addEventListener('openAdminLoginModal', handleOpenAdminLoginModal)
    
    return () => {
      window.removeEventListener('openAdminLoginModal', handleOpenAdminLoginModal)
    }
  }, [])

  if (!isOpen) return null

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-300"
      onClick={handleOverlayClick}
    >
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
        {/* 닫기 버튼 */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* 로고 */}
        <div className="text-center mb-8">
          <img src="/logo.png" alt="올띵버킷 로고" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-800 mb-2">올띵버킷</h1>
          <p className="text-gray-600">체험단 플랫폼</p>
        </div>

        {/* 모드 전환 */}
        <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(false)
              setIsLogin(true)
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              !isAdminMode 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            사용자
          </button>
          <button
            type="button"
            onClick={() => {
              setIsAdminMode(true)
              setIsLogin(true)
            }}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
              isAdminMode 
                ? 'bg-white text-purple-600 shadow-sm' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            관리자
          </button>
        </div>

        {/* 사용자 모드일 때만 탭 전환 */}
        {!isAdminMode && (
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              type="button"
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${
                isLogin 
                  ? 'bg-white text-purple-600 shadow-sm' 
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
                  ? 'bg-white text-purple-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              회원가입
            </button>
          </div>
        )}

        {/* 구글 로그인 버튼 */}
        <GoogleLoginButton
          onSuccess={() => {
            onClose()
          }}
          onError={(error) => {
            toast.error(error)
          }}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-all duration-200 mb-4"
        >
          <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          구글로 {isLogin ? '로그인' : '회원가입'}
        </GoogleLoginButton>


        {/* 관리자 계정 정보 */}
        {isAdminMode && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>관리자 계정:</strong><br />
              관리자명: <span className="font-mono">admin</span><br />
              비밀번호: <span className="font-mono">admin123</span>
            </p>
          </div>
        )}

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
          {/* 관리자 모드일 때 관리자명 필드 */}
          {isAdminMode ? (
            <div>
              <label htmlFor="admin_name" className="block text-sm font-medium text-gray-700 mb-1">
                관리자명
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  id="admin_name"
                  name="admin_name"
                  type="text"
                  required
                  value={formData.admin_name}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="관리자명을 입력하세요"
                />
              </div>
            </div>
          ) : (
            /* 일반 사용자 모드일 때 이메일 필드 */
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
                  className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  placeholder="이메일을 입력하세요"
                />
              </div>
            </div>
          )}

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
                className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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

          {/* 회원가입시 추가 필드 (관리자 모드가 아니고 회원가입 모드일 때만) */}
          {!isAdminMode && !isLogin && (
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
                    className="w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
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
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-4 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50"
          >
            {loading ? '처리 중...' : (isAdminMode ? '관리자 로그인' : (isLogin ? '로그인' : '회원가입'))}
          </button>
        </form>

      </div>
    </div>
  )
}

export default LoginModal
