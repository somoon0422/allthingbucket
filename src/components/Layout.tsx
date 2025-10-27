
import React, { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import {Menu, X, Home, Gift, FileText, Coins, User, LogOut, Shield, Heart, MessageSquare} from 'lucide-react'
import LoginModal from './LoginModal'
import ProfileCompletionModal from './ProfileCompletionModal'
import { dataService } from '../lib/dataService'
import { alimtalkService } from '../services/alimtalkService'
import toast from 'react-hot-toast'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout, isAuthenticated, isAdminUser, updateUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
  // localStorage를 사용하여 체크 상태를 영구 저장
  const [hasCheckedProfile, setHasCheckedProfile] = useState(() => {
    return localStorage.getItem('profileChecked') === 'true'
  })

  const navigationItems = [
    { name: '홈', href: '/', icon: Home },
    { name: '체험단', href: '/experiences', icon: Gift },
    ...(isAuthenticated ? [
      { name: '마이페이지', href: '/mypage', icon: User },
    ] : [])
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
    setIsMobileMenuOpen(false)
    // 프로필 체크 상태 초기화
    localStorage.removeItem('profileChecked')
    setHasCheckedProfile(false)
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

  // 소셜 로그인 후 프로필 완성 체크
  useEffect(() => {
    const checkProfileCompletion = async () => {
      // 이미 체크했거나, 로그인하지 않았거나, 관리자이면 스킵
      if (hasCheckedProfile || !isAuthenticated || !user || isAdminUser()) {
        return
      }

      try {
        // user_profiles 테이블에서 전화번호 확인 (user_id로 검색)
        const profiles = await (dataService.entities as any).user_profiles.list()
        const profile = Array.isArray(profiles)
          ? profiles.find((p: any) => p && p.user_id === user.id)
          : null

        console.log('🔍 프로필 체크:', { userId: user.id, foundProfile: !!profile, phone: profile?.phone })

        // 전화번호가 없으면 모달 띄우기
        if (!profile || !profile.phone) {
          console.log('📞 전화번호 없음 - 프로필 완성 모달 표시')
          setIsProfileModalOpen(true)
        } else {
          console.log('✅ 전화번호 확인됨:', profile.phone)
          // 전화번호가 있으면 localStorage에 체크 완료 표시
          localStorage.setItem('profileChecked', 'true')
        }

        setHasCheckedProfile(true)
      } catch (error) {
        console.error('프로필 체크 실패:', error)
        setHasCheckedProfile(true)
      }
    }

    // 로그인 후 1초 뒤에 체크 (로그인 처리가 완료된 후)
    const timer = setTimeout(() => {
      checkProfileCompletion()
    }, 1000)

    return () => clearTimeout(timer)
  }, [isAuthenticated, user, hasCheckedProfile, isAdminUser])

  // 프로필 완성 완료 핸들러
  const handleProfileComplete = async (data: { name: string, phone: string }) => {
    try {
      if (!user) return

      // user_profiles 테이블 업데이트 (user_id로 검색)
      const profiles = await (dataService.entities as any).user_profiles.list()
      const profile = Array.isArray(profiles)
        ? profiles.find((p: any) => p && p.user_id === user.id)
        : null

      console.log('🔍 프로필 업데이트 대상:', { userId: user.id, foundProfile: !!profile })

      if (profile) {
        await (dataService.entities as any).user_profiles.update(profile.id, {
          phone: data.phone,
          updated_at: new Date().toISOString()
        })
        console.log('✅ user_profiles 업데이트 완료')
      } else {
        console.warn('⚠️ user_profiles에서 프로필을 찾을 수 없음')
      }

      // users 테이블도 업데이트
      try {
        const usersResponse = await (dataService.entities as any).users.list()
        const users = Array.isArray(usersResponse) ? usersResponse : []
        const dbUser = users.find((u: any) => u.user_id === user.id)

        if (dbUser) {
          await (dataService.entities as any).users.update(dbUser.id, {
            phone: data.phone,
            updated_at: new Date().toISOString()
          })
        }
      } catch (error) {
        console.warn('users 테이블 업데이트 실패 (무시):', error)
      }

      // 사용자 상태 업데이트
      updateUser({
        profile: {
          ...user.profile,
          phone: data.phone
        }
      })

      // 환영 알림톡 발송
      try {
        const result = await alimtalkService.sendWelcomeAlimtalk(data.phone, user.name)
        if (result.success) {
          toast.success('환영 알림톡이 발송되었습니다! 📱')
        }
      } catch (error) {
        console.warn('환영 알림톡 발송 실패 (무시):', error)
      }

      toast.success('프로필이 완성되었습니다! 🎉')
      setIsProfileModalOpen(false)

      // 프로필 완성 체크 완료 표시
      setHasCheckedProfile(true)
      localStorage.setItem('profileChecked', 'true')
      console.log('✅ 프로필 완성 및 체크 완료 저장')
    } catch (error) {
      console.error('프로필 업데이트 실패:', error)
      toast.error('프로필 업데이트에 실패했습니다')
    }
  }

  // 프로필 미완성 사용자 자동 리디렉션
  useEffect(() => {
    if (isAuthenticated && user && !isAdminUser()) {
      // 필수 정보(실명)가 없는 경우, 마이페이지가 아니면 리디렉션
      if (!user.name && location.pathname !== '/mypage' && location.pathname !== '/profile') {
        console.log('🔄 프로필 미완성 감지 - /mypage로 리디렉션')
        navigate('/mypage')
      }
    }
  }, [isAuthenticated, user, location.pathname, navigate, isAdminUser])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 상단 네비게이션 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* 로고 */}
            <div className="flex items-center">
              <Link to="/" className="flex items-center space-x-2">
                <img
                  src="/logo.png"
                  alt="올띵버킷 로고"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-cover"
                  style={{ clipPath: 'ellipse(50% 50% at 50% 50%)', objectFit: 'cover' }}
                />
                <span className="text-lg sm:text-xl font-bold text-gray-900">올띵버킷</span>
                <span className="hidden sm:inline text-sm text-gray-500">체험단</span>
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
                        ? 'text-vintage-600 bg-vintage-50'
                        : 'text-gray-700 hover:text-vintage-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}
            </div>

            {/* 광고문의 버튼 */}
            <div className="hidden md:flex items-center">
              <Link
                to="/consultation"
                className="flex items-center space-x-2 px-4 py-2 text-sm font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-lg transition-all shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>광고문의</span>
              </Link>
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
                  className="px-4 py-2 text-sm font-medium text-white bg-vintage-500 hover:bg-vintage-600 rounded-md transition-colors shadow-sm"
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
          <div className="md:hidden border-t bg-white shadow-lg">
            <div className="px-4 pt-4 pb-6 space-y-2">
              {navigationItems.map((item) => {
                const isActive = location.pathname === item.href
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                      isActive
                        ? 'text-vintage-600 bg-vintage-50 border-l-4 border-vintage-600'
                        : 'text-gray-700 hover:text-vintage-600 hover:bg-gray-50'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                )
              })}

              {/* 광고문의 버튼 (모바일) */}
              <Link
                to="/consultation"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center space-x-3 px-4 py-3 rounded-lg text-base font-medium text-white bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all shadow-sm"
              >
                <MessageSquare className="w-5 h-5" />
                <span>광고문의</span>
              </Link>

              {isAuthenticated ? (
                <>
                  <div className="border-t pt-4 mt-4">
                    <div className="px-4 py-3 bg-gray-50 rounded-lg mb-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                          {(user?.name || 'U').charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user?.name || '사용자'}님</p>
                          {isAdminUser() && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mt-1">
                              <Shield className="w-3 h-3 mr-1" />
                              관리자
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {isAdminUser() && (
                      <button
                        onClick={handleAdminAccess}
                        className="flex items-center space-x-3 w-full px-4 py-3 text-left text-base font-medium text-purple-600 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors"
                      >
                        <Shield className="w-5 h-5" />
                        <span>관리자 페이지</span>
                      </button>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-left text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut className="w-5 h-5" />
                      <span>로그아웃</span>
                    </button>
                  </div>
                </>
              ) : (
                <div className="border-t pt-4 mt-4">
                  <button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('openLoginModal'))
                      setIsMobileMenuOpen(false)
                    }}
                    className="w-full px-4 py-3 text-base font-medium text-white bg-vintage-500 hover:bg-vintage-600 rounded-lg transition-colors shadow-sm"
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center space-x-2 mb-3 sm:mb-4">
                <img
                  src="/logo.png"
                  alt="올띵버킷 로고"
                  className="w-6 h-6 sm:w-8 sm:h-8 object-cover"
                  style={{ clipPath: 'ellipse(50% 50% at 50% 50%)', objectFit: 'cover' }}
                />
                <span className="text-base sm:text-lg font-bold text-gray-900">올띵버킷 체험단</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">
                다양한 제품과 서비스를 체험하고 리뷰를 작성하여 포인트를 받아보세요.
              </p>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">서비스</h3>
              <ul className="space-y-2">
                <li><Link to="/experiences" className="text-sm text-gray-600 hover:text-vintage-600 transition-colors">체험단 목록</Link></li>
                <li><Link to="/wishlist" className="text-sm text-gray-600 hover:text-vintage-600 transition-colors">찜 목록</Link></li>
                <li><Link to="/my-applications" className="text-sm text-gray-600 hover:text-vintage-600 transition-colors">내 신청내역</Link></li>
                <li><Link to="/points" className="text-sm text-gray-600 hover:text-vintage-600 transition-colors">포인트 관리</Link></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3 sm:mb-4">고객지원</h3>
              <ul className="space-y-2">
                <li><span className="text-sm text-gray-600">이메일: support@allthingbucket.com</span></li>
                <li><span className="text-sm text-gray-600">운영시간: 평일 09:00-18:00</span></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t mt-6 sm:mt-8 pt-6 sm:pt-8">
            <div className="text-center mb-4">
              <div className="text-xs sm:text-sm text-gray-600 space-y-1">
                <p className="font-semibold">올띵버킷</p>
                <p>사업자번호: 250-14-02600 | 대표자: 김소희</p>
                <p>주소: 서울특별시 마포구 염리동 488-3 401호</p>
              </div>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 text-center">
              © 2025 올띵버킷 체험단. All rights reserved.
            </p>
          </div>
        </div>
      </footer>

      {/* 로그인 모달 */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />

      {/* 프로필 완성 모달 */}
      <ProfileCompletionModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        onComplete={handleProfileComplete}
        requiresPhoneOnly={true}
      />
    </div>
  )
}

export default Layout
