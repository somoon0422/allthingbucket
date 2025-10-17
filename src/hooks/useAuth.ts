
import React, { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { dataService, supabase } from '../lib/dataService'
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
  is_profile_completed?: boolean
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
      admin_role: userData.admin_role ? String(userData.admin_role) : '',
      is_profile_completed: userData.is_profile_completed ?? true
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
      const result = await supabase.auth.signInWithPassword({
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
            name: result.data.user.user_metadata?.full_name || result.data.user.user_metadata?.name || profile?.name || result.data.user.email?.split('@')[0] || '사용자',
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
            name: result.data.user.user_metadata?.full_name || result.data.user.user_metadata?.name || result.data.user.email?.split('@')[0] || '사용자',
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
      const result = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (result.data?.user) {
        // users 테이블에 사용자 생성
        try {
          await (dataService.entities as any).users.create({
            user_id: result.data.user.id,
            email: userData.email,
            name: userData.name,
            phone: userData.phone || null,
            is_active: true,
            created_at: new Date().toISOString()
          })
          console.log('✅ users 테이블에 사용자 생성 완료')
        } catch (userError) {
          console.warn('⚠️ users 테이블 사용자 생성 실패 (무시):', userError)
        }

        // 사용자 프로필 생성 (기본 정보만)
        const profileData = {
          user_id: result.data.user.id,
          name: userData.name,
          phone: userData.phone,
          address: userData.address,
          birth_date: userData.birth_date,
          gender: userData.gender
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
          setTimeout(() => {
            toast('프로필을 완성하면 캠페인에 신청할 수 있어요!', {
              icon: '👋',
              duration: 5000
            })
          }, 1000)
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
      const admins = await dataService.entities.admins.list()
      const admin = admins.find((a: any) => a.username === adminName)
      
      console.log('🔍 관리자 조회 결과:', { adminName, admins, foundAdmin: admin })
      
      if (!admin) {
        throw new Error('관리자를 찾을 수 없습니다')
      }
      
      // 활성 상태 확인
      if (!admin.is_active) {
        throw new Error('비활성화된 관리자 계정입니다')
      }
      
      // 비밀번호 확인 (password 필드 사용)
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
      console.log('🚀 로그아웃 시작 - 강력한 방식 v3 (캐시 무시)')
      
      // 1. 사용자 상태 즉시 초기화
      setUser(null)
      
      // 2. 모든 로컬 스토리지 완전 삭제
      localStorage.clear()
      sessionStorage.clear()
      
      // 3. 모든 쿠키 삭제 (도메인 내)
      document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
      })
      
      // 4. Supabase 세션 정리 (안전하게)
      try {
        await supabase.auth.signOut()
      } catch (supabaseError) {
        console.warn('⚠️ Supabase 로그아웃 실패 (무시):', supabaseError)
      }
      
      console.log('✅ 모든 세션 데이터 완전 삭제 완료')
      
      // 5. 강제 페이지 새로고침 (캐시 무시 + 랜덤 파라미터)
      const randomParam = Math.random().toString(36).substring(2, 11)
      window.location.href = window.location.origin + '?logout=' + randomParam + '&t=' + Date.now()
      
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error)
      // 오류가 발생해도 강제 새로고침
      const randomParam = Math.random().toString(36).substring(2, 11)
      window.location.href = window.location.origin + '?logout=' + randomParam + '&t=' + Date.now()
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
        const sessionData = await dataService.auth.getSession()
        const session = sessionData?.data?.session
        if (session?.user) {
          // Supabase 세션이 있으면 어드민 세션을 완전히 무시하고 일반 사용자로 처리
          console.log('🔍 Supabase 세션 발견 - 어드민 세션 무시하고 일반 사용자로 처리:', session.user)
          console.log('🔍 Supabase 세션 이메일:', session.user.email)
          console.log('🔍 Supabase 세션 이름:', session.user.user_metadata?.full_name || session.user.user_metadata?.name)
          
          // 어드민 세션 정리 (구글 로그인 시 어드민 세션 완전 삭제)
          localStorage.removeItem('admin_token')
          localStorage.removeItem('admin_session')
          sessionStorage.removeItem('admin_token')
          sessionStorage.removeItem('admin_session')
          
          console.log('✅ 어드민 세션 완전 정리 완료')
          
          // Supabase Auth 세션 처리
          
          try {
            // users 테이블에서 사용자 정보 검증 (이메일로 우선 검색)
            const usersResponse = await (dataService.entities as any).users.list()
            const users = Array.isArray(usersResponse) ? usersResponse : []
            
            console.log('🔍 users 테이블 검색:', {
              sessionUserEmail: session.user.email,
              sessionUserId: session.user.id,
              totalUsers: users.length
            })
            
            // 이메일로 우선 검색 (구글 로그인 시 정확한 매칭)
            let dbUser = users.find((u: any) => u.email === session.user.email)
            
            // 이메일로 찾지 못한 경우 user_id로 검색
            if (!dbUser) {
              dbUser = users.find((u: any) => u.user_id === session.user.id)
            }
            
            console.log('🔍 users 테이블 검색 결과:', {
              foundByEmail: users.find((u: any) => u.email === session.user.email),
              foundByUserId: users.find((u: any) => u.user_id === session.user.id),
              finalDbUser: dbUser
            })
            
            if (dbUser) {
              console.log('✅ users 테이블에서 사용자 확인됨:', dbUser)
              console.log('✅ 사용자 이메일:', dbUser.email)
              console.log('✅ 사용자 이름:', dbUser.name)

              // users 테이블의 이름이 없거나 비어있는 경우 업데이트
              if (!dbUser.name && (session.user.user_metadata?.full_name || session.user.user_metadata?.name)) {
                const newName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
                try {
                  await (dataService.entities as any).users.update(dbUser.id, {
                    name: newName,
                    updated_at: new Date().toISOString()
                  })
                  console.log('✅ users 테이블 이름 업데이트 완료:', newName)
                  dbUser.name = newName // 업데이트된 이름으로 dbUser 객체 수정
                } catch (updateError) {
                  console.warn('⚠️ users 테이블 이름 업데이트 실패 (무시):', updateError)
                }
              }

              // 프로필 완성 여부 체크는 필요할 때만 influencer_profiles 존재 여부로 확인

              // 사용자 프로필 정보 가져오기
              try {
                const profile = await (dataService.entities as any).user_profiles.get(session.user.id)

                // 프로필이 있지만 이름이 없는 경우 업데이트
                if (profile && !profile.name && (session.user.user_metadata?.full_name || session.user.user_metadata?.name)) {
                  const newName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
                  try {
                    await (dataService.entities as any).user_profiles.update(profile.id, {
                      name: newName,
                      updated_at: new Date().toISOString()
                    })
                    console.log('✅ 프로필 이름 업데이트 완료:', newName)
                    profile.name = newName // 업데이트된 이름으로 프로필 객체 수정
                  } catch (updateError) {
                    console.warn('⚠️ 프로필 이름 업데이트 실패 (무시):', updateError)
                  }
                }

                const processedUser = processUserData({
                  id: session.user.id,
                  user_id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || dbUser.name || profile?.name || session.user.email?.split('@')[0] || '사용자',
                  role: 'user',
                  profile: profile
                })

                if (processedUser) {
                  console.log('✅ 최종 사용자 로그인 성공 (프로필 있음):', processedUser)
                  setUser(processedUser)
                  return
                }
              } catch (profileError) {
                console.log('사용자 프로필을 찾을 수 없습니다. 기본 사용자 정보로 진행합니다.')

                // 프로필이 없는 경우 기본 사용자 정보로 처리
                const processedUser = processUserData({
                  id: session.user.id,
                  user_id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || dbUser.name || session.user.email?.split('@')[0] || '사용자',
                  role: 'user',
                  profile: null
                })

                if (processedUser) {
                  setUser(processedUser)
                  return
                }
              }
            } else {
              console.warn('⚠️ users 테이블에서 사용자를 찾을 수 없음. 자동으로 생성합니다:', session.user.id, session.user.email)
              
              try {
                // users 테이블에 사용자가 없으면 자동으로 생성
                const newUser = {
                  user_id: session.user.id,
                  email: session.user.email,
                  name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자',
                  phone: null,
                  provider: session.user.app_metadata?.provider || 'google',
                  google_id: session.user.app_metadata?.provider === 'google' ? session.user.id : null,
                  profile_image_url: session.user.user_metadata?.avatar_url || null,
                  is_active: true
                }

                console.log('📝 users 테이블에 새 사용자 생성 중:', newUser)
                const createResult = await (dataService.entities as any).users.create(newUser)

                if (createResult) {
                  console.log('✅ users 테이블에 사용자 생성 완료')

                  // 사용자 프로필도 생성 (기본 정보만)
                  try {
                    await (dataService.entities as any).user_profiles.create({
                      user_id: session.user.id,
                      name: newUser.name
                    })
                    console.log('✅ 사용자 프로필 생성 완료 - 이름:', newUser.name)
                  } catch (profileError) {
                    console.warn('⚠️ 사용자 프로필 생성 실패 (무시):', profileError)
                  }

                  // 생성된 사용자 정보로 로그인 처리
                  const processedUser = processUserData({
                    id: session.user.id,
                    user_id: session.user.id,
                    email: session.user.email,
                    name: newUser.name,
                    role: 'user',
                    profile: null
                  })

                  if (processedUser) {
                    setUser(processedUser)
                    // 프로필 완성 필요 메시지
                    toast.success(`${processedUser.name}님, 환영합니다!`)
                    setTimeout(() => {
                      toast('프로필을 완성하면 캠페인에 신청할 수 있어요!', {
                        icon: '👋',
                        duration: 5000
                      })
                    }, 1000)
                    return
                  }
                } else {
                  console.error('❌ users 테이블 사용자 생성 실패:', createResult)
                  await supabase.auth.signOut()
                  toast.error('사용자 정보 생성에 실패했습니다. 다시 로그인해주세요.')
                }
              } catch (createError) {
                console.error('❌ users 테이블 사용자 생성 중 오류:', createError)
                await supabase.auth.signOut()
                toast.error('사용자 정보 생성 중 오류가 발생했습니다. 다시 로그인해주세요.')
              }
            }
          } catch (usersError) {
            console.error('users 테이블 조회 실패:', usersError)
            // users 테이블 조회 실패 시 기존 방식으로 진행
            console.log('🔄 users 테이블 조회 실패 - user_profiles로 직접 진행')
            try {
              const profile = await (dataService.entities as any).user_profiles.get(session.user.id)
              
              // 프로필이 있지만 이름이 없는 경우 업데이트
              if (profile && !profile.name && (session.user.user_metadata?.full_name || session.user.user_metadata?.name)) {
                const newName = session.user.user_metadata?.full_name || session.user.user_metadata?.name
                try {
                  await (dataService.entities as any).user_profiles.update(profile.id, {
                    name: newName,
                    updated_at: new Date().toISOString()
                  })
                  console.log('✅ 프로필 이름 업데이트 완료 (users 테이블 조회 실패 시):', newName)
                  profile.name = newName // 업데이트된 이름으로 프로필 객체 수정
                } catch (updateError) {
                  console.warn('⚠️ 프로필 이름 업데이트 실패 (무시):', updateError)
                }
              }
              
              const processedUser = processUserData({
                id: session.user.id,
                user_id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || profile?.name || session.user.email?.split('@')[0] || '사용자',
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
                user_id: session.user.id,
                email: session.user.email,
                name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split('@')[0] || '사용자',
                role: 'user',
                profile: null
              })
              
              if (processedUser) {
                setUser(processedUser)
                return
              }
            }
          }
        } else {
          // Supabase 세션이 없는 경우에만 관리자 세션 체크
          console.log('🔍 Supabase 세션 없음 - 어드민 세션 체크')
          
          // 관리자 토큰 체크
          const adminToken = localStorage.getItem('admin_token')
          if (adminToken) {
            console.log('🔍 어드민 토큰 발견:', adminToken)
            try {
              const adminData = getUserFromToken(adminToken)
              if (adminData && adminData.type === 'admin') {
                console.log('🔍 어드민 데이터 처리:', adminData)
                const processedAdmin = processUserData(adminData)
                if (processedAdmin) {
                  console.log('✅ 어드민 로그인 성공:', processedAdmin)
                  setUser(processedAdmin)
                  return
                }
              }
            } catch {
              console.log('⚠️ 어드민 토큰 무효 - 삭제')
              localStorage.removeItem('admin_token')
              localStorage.removeItem('admin_session')
            }
          }
          
          // 관리자 세션 체크 (기존 방식)
          const adminSession = localStorage.getItem('admin_session')
          if (adminSession) {
            console.log('🔍 어드민 세션 발견:', adminSession)
            try {
              const adminData = JSON.parse(adminSession)
              console.log('🔍 어드민 세션 데이터:', adminData)
              const processedAdmin = processUserData(adminData)
              if (processedAdmin) {
                console.log('✅ 어드민 세션 로그인 성공:', processedAdmin)
                setUser(processedAdmin)
                return
              }
            } catch {
              console.log('⚠️ 어드민 세션 무효 - 삭제')
              localStorage.removeItem('admin_session')
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

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // 🔥 Google 로그인 이벤트 처리
  useEffect(() => {
    const handleGoogleLoginSuccess = (event: CustomEvent) => {
      try {
        console.log('🎉 Google 로그인 성공 이벤트 수신:', event.detail)
        
        const { user: googleUser, token } = event.detail
        
        if (googleUser && token) {
          // 사용자 정보 처리
          const processedUser = processUserData(googleUser)
          if (processedUser) {
            setUser(processedUser)
            console.log('✅ Google 로그인 사용자 설정 완료:', processedUser)
            toast.success(`${processedUser.name}님, 환영합니다!`)
          }
        }
      } catch (error) {
        console.error('❌ Google 로그인 성공 이벤트 처리 실패:', error)
        toast.error('로그인 처리 중 오류가 발생했습니다.')
      }
    }

    const handleGoogleLoginError = (event: CustomEvent) => {
      try {
        console.log('❌ Google 로그인 오류 이벤트 수신:', event.detail)
        
        const { error: errorMessage } = event.detail
        toast.error(errorMessage || 'Google 로그인에 실패했습니다.')
      } catch (error) {
        console.error('❌ Google 로그인 오류 이벤트 처리 실패:', error)
        toast.error('로그인 처리 중 오류가 발생했습니다.')
      }
    }

    // 이벤트 리스너 등록
    window.addEventListener('googleLoginSuccess', handleGoogleLoginSuccess as EventListener)
    window.addEventListener('googleLoginError', handleGoogleLoginError as EventListener)

    // 클린업
    return () => {
      window.removeEventListener('googleLoginSuccess', handleGoogleLoginSuccess as EventListener)
      window.removeEventListener('googleLoginError', handleGoogleLoginError as EventListener)
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