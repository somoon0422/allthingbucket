
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {Shield, Eye, EyeOff} from 'lucide-react'
import toast from 'react-hot-toast'

const AdminLogin: React.FC = () => {
  const { adminLogin, adminLoginWithCredentials, isAdminUser } = useAuth()
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    admin_name: 'admin',
    password: 'admin123'
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  // 이미 관리자로 로그인된 경우 대시보드로 리다이렉트
  React.useEffect(() => {
    if (isAdminUser()) {
      navigate('/admin')
    }
  }, [isAdminUser, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.admin_name || !formData.password) {
      toast.error('관리자명과 비밀번호를 입력해주세요')
      return
    }

    setLoading(true)
    
    try {
      // MongoDB 기반 관리자 인증 시도
      try {
        await adminLoginWithCredentials(formData.admin_name, formData.password)
        navigate('/admin')
        return
      } catch (mongoError) {
        console.log('MongoDB 인증 실패, 기본 인증 시도:', mongoError)
      }

      // 기본 관리자 인증 (MongoDB 연결 실패시 폴백)
      if (formData.admin_name === 'admin' && (formData.password === 'admin123' || formData.password === 'allthingbucket2024')) {
        await adminLogin({
          admin_name: formData.admin_name,
          admin_role: 'super_admin',
          id: `admin_${Date.now()}`,
          name: formData.admin_name,
          email: `${formData.admin_name}@admin.com`,
          role: 'admin'
        })
        
        toast.success('관리자 로그인 성공!')
        // 잠시 후 리다이렉트 (상태 업데이트 시간 확보)
        setTimeout(() => {
          navigate('/admin')
        }, 500)
      } else {
        toast.error('관리자명 또는 비밀번호가 올바르지 않습니다')
      }
    } catch (error) {
      console.error('관리자 로그인 실패:', error)
      toast.error('로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            관리자 로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            올띵버킷 체험단 관리 시스템
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="admin_name" className="block text-sm font-medium text-gray-700">
                관리자명
              </label>
              <input
                id="admin_name"
                name="admin_name"
                type="text"
                required
                value={formData.admin_name}
                onChange={handleInputChange}
                className="mt-1 appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                placeholder="관리자명을 입력하세요"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                비밀번호
              </label>
              <div className="mt-1 relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleInputChange}
                  className="appearance-none relative block w-full px-3 py-3 pr-10 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 focus:z-10"
                  placeholder="비밀번호를 입력하세요"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-lg text-white bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                '로그인'
              )}
            </button>
          </div>

          <div className="text-center">
            <div className="text-sm text-gray-500 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="font-medium mb-2 text-gray-800">🔐 관리자 로그인</p>
              <p className="text-gray-600">관리자 계정으로 로그인하세요</p>
            </div>
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-sm text-gray-600 hover:text-gray-900 underline"
            >
              ← 사용자 페이지로 돌아가기
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
