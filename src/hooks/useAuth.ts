
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
// Lumi SDK 제거됨 - Supabase API 사용
// lumiAuthService 제거됨 - Supabase API 사용
import { getUserFromToken } from '../utils/auth'
import toast from 'react-hot-toast'

interface User {
  id: string
  user_id: string
  name: string
  email: string
  role: string
  user_code?: string
  profile?: any
  admin_name?: string
  admin_role?: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (userData: any) => void
  loginWithCredentials: (email: string, password: string) => Promise<void>
  register: (userData: any) => Promise<void>
  logout: () => void
  loading: boolean
  updateUser: (userData: Partial<User>) => void
  isAdminUser: () => boolean
  adminLogin: (adminData: any) => void
  adminLoginWithCredentials: (adminName: string, password: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// ultraSafeArray 함수 제거됨 - 사용하지 않음

// safeDataAccess, safeFindInArray 함수 제거됨 - 사용하지 않음

// 🔥 안전한 사용자 데이터 처리
function processUserData(userData: any): User | null {
  try {
    if (!userData || typeof userData !== 'object') {
      return null
    }

    const processedUser = {
      id: String(userData.id || userData._id || userData.user_id || ''),
      user_id: String(userData.user_id || userData.id || userData._id || ''),
      name: String(userData.name || userData.userName || userData.user_name || '사용자'),
      email: String(userData.email || userData.user_email || ''),
      role: String(userData.role || userData.user_role || 'user'),
      user_code: userData.user_code ? String(userData.user_code) : '',
      profile: userData.profile || userData.user_profile || null,
      admin_name: userData.admin_name ? String(userData.admin_name) : '',
      admin_role: userData.admin_role ? String(userData.admin_role) : ''
    }

    return processedUser
  } catch {
    return null
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const login = async (userData: any) => {
    try {
      setLoading(true)
      
      const processedUser = processUserData(userData)
      if (processedUser) {
        setUser(processedUser)
        toast.success(`환영합니다, ${processedUser.name}님!`)
      } else {
        toast.error('로그인 정보 처리에 실패했습니다')
      }
    } catch (error) {
      console.error('로그인 실패:', error)
      toast.error('로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const loginWithCredentials = async (email: string, password: string) => {
    try {
      setLoading(true)
      
      // Supabase API로 사용자 로그인
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://allthingbucket.com'
      const response = await fetch(`${apiBaseUrl}/api/auth/user/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password })
      })
      
      const result = await response.json()
      
      if (result.success && result.data.user) {
        // 토큰을 localStorage에 저장
        if (result.data.token) {
          localStorage.setItem('auth_token', result.data.token)
        }
        
        const processedUser = processUserData(result.data.user)
        if (processedUser) {
          setUser(processedUser)
          toast.success(`환영합니다, ${processedUser.name}님!`)
        }
      } else {
        throw new Error(result.error || '로그인에 실패했습니다')
      }
    } catch (error: any) {
      console.error('로그인 실패:', error)
      toast.error(error.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any) => {
    try {
      setLoading(true)
      
      // Supabase API로 사용자 등록
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://allthingbucket.com'
      const response = await fetch(`${apiBaseUrl}/api/db/user-register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData)
      })
      
      const result = await response.json()
      
      if (result.success && result.data.user) {
        // 토큰을 localStorage에 저장
        if (result.data.token) {
          localStorage.setItem('auth_token', result.data.token)
        }
        
        const processedUser = processUserData(result.data.user)
        if (processedUser) {
          setUser(processedUser)
          toast.success(`회원가입이 완료되었습니다, ${processedUser.name}님!`)
        }
      } else {
        throw new Error(result.error || '회원가입에 실패했습니다')
      }
    } catch (error: any) {
      console.error('회원가입 실패:', error)
      toast.error(error.message || '회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const adminLogin = async (adminData: any) => {
    try {
      setLoading(true)
      
      const processedAdmin = processUserData({
        ...adminData,
        role: 'admin',
        admin_name: adminData.admin_name || adminData.name,
        admin_role: adminData.admin_role || 'admin'
      })
      
      if (processedAdmin) {
        setUser(processedAdmin)
        localStorage.setItem('admin_session', JSON.stringify(processedAdmin))
        toast.success(`관리자 로그인 성공: ${processedAdmin.admin_name}님`)
      } else {
        toast.error('관리자 로그인 정보 처리에 실패했습니다')
      }
    } catch (error) {
      console.error('관리자 로그인 실패:', error)
      toast.error('관리자 로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const adminLoginWithCredentials = async (adminName: string, password: string) => {
    try {
      setLoading(true)
      
      // Supabase API로 관리자 로그인
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://allthingbucket.com'
      const response = await fetch(`${apiBaseUrl}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: adminName,
          password: password
        })
      })
      
      const result = await response.json()
      
      if (result.success && result.data.admin) {
        const admin = result.data.admin
        
        const processedAdmin = processUserData({
          _id: admin._id,
          name: admin.username,
          email: admin.email,
          role: 'admin',
          admin_name: admin.username,
          admin_role: admin.role,
          is_active: admin.is_active
        })
        
        if (processedAdmin) {
          setUser(processedAdmin)
          localStorage.setItem('admin_session', JSON.stringify(processedAdmin))
          toast.success(`관리자 로그인 성공: ${processedAdmin.admin_name}님`, { duration: 2000 })
        }
      } else {
        throw new Error(result.error || '관리자 로그인에 실패했습니다')
      }
    } catch (error: any) {
      console.error('관리자 로그인 실패:', error)
      toast.error(error.message || '관리자 로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      
      // Lumi SDK 제거됨 - Supabase API 사용으로 대체
      
      // 로컬 세션 정리
      localStorage.removeItem('admin_session')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin_token')
      
      toast.success('로그아웃되었습니다')
    } catch (error) {
      console.error('로그아웃 실패:', error)
    }
  }

  const updateUser = (userData: Partial<User>) => {
    try {
      if (user) {
        const updatedUser = { ...user, ...userData }
        setUser(updatedUser)
      }
    } catch (error) {
      console.error('사용자 정보 업데이트 실패:', error)
    }
  }

  const isAdminUser = () => {
    try {
      const adminSession = localStorage.getItem('admin_session')
      const adminToken = localStorage.getItem('admin_token')
      
      const isAdmin = !!(
        user?.role === 'admin' || 
        user?.admin_role || 
        user?.admin_name ||
        adminSession || 
        adminToken
      )
      
      return isAdmin
    } catch (error) {
      console.error('관리자 권한 체크 실패:', error)
      return false
    }
  }

  useEffect(() => {
    const checkAutoLogin = async () => {
      try {
        setLoading(true)
        
        // lumiAuthService 제거됨 - Supabase API 사용으로 대체
        
        // 관리자 토큰 체크
        const adminToken = localStorage.getItem('admin_token')
        if (adminToken) {
          try {
            const adminData = getUserFromToken(adminToken)
            if (adminData && adminData.type === 'admin') {
              const processedAdmin = processUserData(adminData)
              if (processedAdmin) {
                setUser(processedAdmin)
                return
              }
            }
          } catch {
            localStorage.removeItem('admin_token')
            localStorage.removeItem('admin_session')
          }
        }
        
        // 관리자 세션 체크 (기존 방식)
        const adminSession = localStorage.getItem('admin_session')
        if (adminSession) {
          try {
            const adminData = JSON.parse(adminSession)
            const processedAdmin = processUserData(adminData)
            if (processedAdmin) {
              setUser(processedAdmin)
              return
            }
          } catch {
            localStorage.removeItem('admin_session')
          }
        }
        
        // 일반 사용자 토큰 체크
        const authToken = localStorage.getItem('auth_token')
        if (authToken) {
          try {
            const userData = getUserFromToken(authToken)
            if (userData && userData.type === 'user') {
              const processedUser = processUserData(userData)
              if (processedUser) {
                setUser(processedUser)
                return
              }
            }
          } catch {
            localStorage.removeItem('auth_token')
          }
        }
        
        // Lumi SDK 제거됨 - Supabase API 사용으로 대체
      } catch (error) {
        console.error('자동 로그인 체크 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(() => {
      checkAutoLogin().catch(() => {
        setLoading(false)
      })
    }, 100)

    // Google 로그인 성공 이벤트 리스너
    const handleGoogleLoginSuccess = (event: CustomEvent) => {
      try {
        console.log('Google 로그인 성공 이벤트 수신:', event.detail)
        const { user: googleUser, token } = event.detail
        
        if (googleUser) {
          const processedUser = processUserData(googleUser)
          if (processedUser) {
            setUser(processedUser)
            // 토큰 저장
            if (token) {
              localStorage.setItem('auth_token', token)
            }
            console.log('Google 로그인 사용자 설정 완료:', processedUser)
          }
        }
      } catch (error) {
        console.error('Google 로그인 성공 이벤트 처리 실패:', error)
      }
    }

    window.addEventListener('googleLoginSuccess', handleGoogleLoginSuccess as EventListener)

    return () => {
      clearTimeout(timer)
      window.removeEventListener('googleLoginSuccess', handleGoogleLoginSuccess as EventListener)
    }
  }, [])

  const isAuthenticated = !!user

  const contextValue: AuthContextType = {
    user,
    isAuthenticated,
    login,
    loginWithCredentials,
    register,
    logout,
    loading,
    updateUser,
    isAdminUser,
    adminLogin,
    adminLoginWithCredentials
  }

  return React.createElement(
    AuthContext.Provider,
    { value: contextValue },
    children
  )
}
