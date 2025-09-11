import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { dataService } from '../lib/dataService'
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

// 안전한 사용자 데이터 처리
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
      
      // Supabase Auth를 사용한 로그인
      const result = await dataService.auth.signInWithPassword({
        email,
        password
      })
      
      if (result.data?.user) {
        // 사용자 프로필 정보 가져오기
        try {
          const profile = await (dataService.entities as any).user_profiles.get(result.data.user.id)
          
          const processedUser = processUserData({
            id: result.data.user.id,
            email: result.data.user.email || '',
            name: profile?.name || result.data.user.email?.split('@')[0] || '사용자',
            role: 'user',
            profile: profile
          })
          
          if (processedUser) {
            setUser(processedUser)
            return
          }
        } catch (profileError) {
          console.log('사용자 프로필을 찾을 수 없습니다. 기본 사용자 정보로 진행합니다.')
          
          // 프로필이 없는 경우 기본 사용자 정보로 처리
          const processedUser = processUserData({
            id: result.data.user.id,
            email: result.data.user.email || '',
            name: result.data.user.email?.split('@')[0] || '사용자',
            role: 'user',
            profile: null
          })
          
          if (processedUser) {
            setUser(processedUser)
            return
          }
        }
      } else {
        throw new Error('로그인에 실패했습니다')
      }
    } catch (error: any) {
      console.error('로그인 실패:', error)
      toast.error(error.message || '로그인에 실패했습니다', { duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const register = async (userData: any) => {
    try {
      setLoading(true)
      
      // Supabase Auth를 사용한 회원가입
      const result = await dataService.auth.signUp({
        email: userData.email,
        password: userData.password
      })
      
      if (result.data?.user) {
        // 사용자 프로필 생성
        const profileData = {
          id: result.data.user.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          address: userData.address,
          birth_date: userData.birth_date,
          gender: userData.gender,
          created_at: new Date().toISOString()
        }
        
        await (dataService.entities as any).user_profiles.create(profileData)
        
        const processedUser = processUserData({
          id: result.data.user.id,
          email: result.data.user.email || '',
          name: userData.name,
          role: 'user',
          profile: profileData
        })
        
        if (processedUser) {
          setUser(processedUser)
          toast.success(`회원가입이 완료되었습니다, ${processedUser.name}님!`)
        }
      } else {
        throw new Error('회원가입에 실패했습니다')
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
      
      // Supabase에서 관리자 정보 조회
      const admins = await dataService.entities.admin_users.list()
      const admin = admins.find((a: any) => a.username === adminName)
      
      console.log('🔍 관리자 조회 결과:', { adminName, admins, foundAdmin: admin })
      
      if (!admin) {
        throw new Error('관리자를 찾을 수 없습니다')
      }
      
      // 활성 상태 확인
      if (!admin.is_active) {
        throw new Error('비활성화된 관리자 계정입니다')
      }
      
      // 비밀번호 확인
      if (admin.password !== password) {
        throw new Error('비밀번호가 일치하지 않습니다')
      }
      
      const processedAdmin = processUserData({
        id: admin.id,
        name: admin.username,
        email: admin.email,
        role: 'admin',
        admin_name: admin.username,
        admin_role: admin.role
      })
      
      if (processedAdmin) {
        setUser(processedAdmin)
        localStorage.setItem('admin_session', JSON.stringify(processedAdmin))
        toast.success(`관리자 로그인 성공: ${processedAdmin.admin_name}님`, { duration: 2000 })
      }
    } catch (error: any) {
      console.error('관리자 로그인 실패:', error)
      toast.error(error.message || '관리자 로그인에 실패했습니다', { duration: 3000 })
    } finally {
      setLoading(false)
    }
  }

  const logout = async () => {
    try {
      setUser(null)
      
      // Supabase Auth 로그아웃
      await dataService.auth.signOut()
      
      // 로컬 세션 정리
      localStorage.removeItem('admin_session')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('admin_token')
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
        
        // Supabase Auth 세션 체크
        const { data: { session } } = await dataService.auth.getSession()
        if (session?.user) {
          try {
            const profile = await (dataService.entities as any).user_profiles.get(session.user.id)
            
            const processedUser = processUserData({
              id: session.user.id,
              email: session.user.email,
              name: profile?.name || session.user.email?.split('@')[0] || '사용자',
              role: 'user',
              profile: profile
            })
            
            if (processedUser) {
              setUser(processedUser)
              return
            }
          } catch (profileError) {
            console.log('사용자 프로필을 찾을 수 없습니다. 기본 사용자 정보로 진행합니다.')
            
            // 프로필이 없는 경우 기본 사용자 정보로 처리
            const processedUser = processUserData({
              id: session.user.id,
              email: session.user.email,
              name: session.user.email?.split('@')[0] || '사용자',
              role: 'user',
              profile: null
            })
            
            if (processedUser) {
              setUser(processedUser)
              return
            }
          }
        }
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