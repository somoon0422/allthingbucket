
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {Menu, X, Home, Gift, FileText, Coins, User, LogOut, Shield, Heart} from 'lucide-react'
import LoginModal from './LoginModal'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, isAdminUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)

  const navigationItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '체험단', href: '/experiences', icon: Gift },
    ...(isAuthenticated ? [
      { name: '찜목록', href: '/wishlist', icon: Heart },
      { name: '내 신청', href: '/my-applications', icon: FileText },
      { name: '포인트', href: '/points', icon: Coins },
      { name: '프로필', href: '/profile', icon: User },
    ] : [])
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
  }

  const handleAdminAccess = () => {
    if (isAdminUser()) {
      navigate('/admin')
    } else {
      // 관리자 로그인 모달 열기 (관리자 모드로 설정)
      window.dispatchEvent(new CustomEvent('openAdminLoginModal'))
    }
    setIsMobileMenuOpen(false)
  }

  // 로그인 모달 이벤트 리스너
  useEffect(() => {
    const handleOpenLoginModal = () => {
      setIsLoginModalOpen(true)
    }

    const handleOpenAdminLoginModal = () => {
      setIsLoginModalOpen(true)
    }

    const handleCloseLoginModal = () => {
      setIsLoginModalOpen(false)
    }

    window.addEventListener('openLoginModal', handleOpenLoginModal)
    window.addEventListener('openAdminLoginModal', handleOpenAdminLoginModal)
    window.addEventListener('closeLoginModal', handleCloseLoginModal)
    
    return () => {
      window.removeEventListener('openLoginModal', handleOpenLoginModal)
      window.removeEventListener('openAdminLoginModal', handleOpenAdminLoginModal)
      window.removeEventListener('closeLoginModal', handleCloseLoginModal)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="올띵버킷 로고" className="w-8 h-8" />
                <span className="text-xl font-bold text-gray-900">올띵버킷</span>
                <span className="text-sm text-gray-500">체험단</span>
              </Link>
            </div>

            {/* 데스크톱 네비게이션 */}
            <div className="hidden md:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* 사용자 메뉴 */}
            <div className="hidden md:flex items-center space-x-4">
              {isAuthenticated ? (
                <>
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <User className="w-4 h-4" />
                    <span>{user?.name || '사용자'}</span>
                    {isAdminUser() && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        <Shield className="w-3 h-3 mr-1" />
                        관리자
                      </span>
                    )}
                  </div>
                  
                  {isAdminUser() && (
                    <button
                      onClick={handleAdminAccess}
                      className="flex items-center space-x-1 px-3 py-2 text-sm text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md transition-colors"
                    >
                      <Shield className="w-4 h-4" />
                      <span>관리자 페이지</span>
                    </button>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>로그아웃</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    // 모달 열기 이벤트 발생
                    window.dispatchEvent(new CustomEvent('openLoginModal'))
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                >
                  로그인
                </button>
              )}
            </div>

            {/* 모바일 메뉴 버튼 */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="text-gray-700 hover:text-blue-600 p-2"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* 모바일 메뉴 */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium ${
                      isActive
                        ? 'text-blue-600 bg-blue-50'
                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
              
              {isAuthenticated ? (
                <>
                  <div className="border-t pt-2 mt-2">
                    <div className="px-3 py-2 text-sm text-gray-500 flex items-center space-x-2">
                      <span>{user?.name || '사용자'}님으로 로그인됨</span>
                      {isAdminUser() && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield className="w-3 h-3 mr-1" />
                          관리자
                        </span>
                      )}
                    </div>
                    
                    {isAdminUser() && (
                      <button
                        onClick={handleAdminAccess}
                        className="flex items-center space-x-2 w-full px-3 py-2 text-left text-base font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-md"
                      >
                        <Shield className="w-5 h-5" />
                        <span>관리자 페이지</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-2 w-full px-3 py-2 text-left text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t pt-2 mt-2">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openLoginModal'))
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    로그인
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </nav>

      {/* 메인 콘텐츠 */}
      <main className="flex-1">
        {children}
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <img src="/logo.png" alt="올띵버킷 로고" className="w-8 h-8" />
                <span className="text-lg font-bold text-gray-900">올띵버킷 체험단</span>
              </div>
              <p className="text-gray-600 text-sm">
                다양한 제품과 서비스를 체험하고 리뷰를 작성하여 포인트를 받아보세요.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">서비스</h3>
              <ul className="space-y-2">
                <li><Link to="/experiences" className="text-sm text-gray-600 hover:text-blue-600">체험단 목록</Link></li>
                <li><Link to="/wishlist" className="text-sm text-gray-600 hover:text-blue-600">찜 목록</Link></li>
                <li><Link to="/my-applications" className="text-sm text-gray-600 hover:text-blue-600">내 신청내역</Link></li>
                <li><Link to="/points" className="text-sm text-gray-600 hover:text-blue-600">포인트 관리</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4">고객지원</h3>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-600">이메일: support@allthingbucket.com</span></li>
                <li><span className="text-sm text-gray-600">운영시간: 평일 09:00-18:00</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-8 pt-8 text-center">
            <p className="text-sm text-gray-500">
              © 2024 올띵버킷 체험단. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 로그인 모달 */}
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />
    </div>
  )
}

export default Layout
