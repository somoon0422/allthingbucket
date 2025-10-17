import { supabase, dataService } from '../lib/dataService'

export interface OAuthUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider: 'google' | 'kakao'
}

export class SupabaseOAuthService {
  // 로그를 localStorage에 저장하는 헬퍼 함수
  private static saveLog(message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const logEntry = {
      timestamp,
      message,
      data: data ? JSON.stringify(data, null, 2) : null
    }
    
    try {
      const existingLogs = JSON.parse(localStorage.getItem('oauth_logs') || '[]')
      existingLogs.push(logEntry)
      
      // 최대 100개 로그만 유지
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100)
      }
      
      localStorage.setItem('oauth_logs', JSON.stringify(existingLogs))
      
      // 콘솔에도 출력
      console.log(`[${timestamp}] ${message}`, data)
      
      // 중요한 로그는 sessionStorage에도 저장 (페이지 리다이렉트 후에도 유지)
      if (message.includes('❌') || message.includes('✅') || message.includes('🔥')) {
        const sessionLogs = JSON.parse(sessionStorage.getItem('oauth_session_logs') || '[]')
        sessionLogs.push(logEntry)
        if (sessionLogs.length > 20) {
          sessionLogs.splice(0, sessionLogs.length - 20)
        }
        sessionStorage.setItem('oauth_session_logs', JSON.stringify(sessionLogs))
      }
    } catch (error) {
      console.error('로그 저장 실패:', error)
    }
  }
  // Google OAuth 로그인
  static async signInWithGoogle(): Promise<{ user: OAuthUser; token: string }> {
    try {
      console.log('🔥 Supabase Google OAuth 로그인 시작...')

      // 🔥 Google OAuth "보안 브라우저 사용" 정책 준수를 위해 앱의 실제 URL로 리다이렉트
      // 개발 환경에서는 localhost, 프로덕션에서는 도메인 사용
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const redirectTo = isDevelopment
        ? `${window.location.origin}/`
        : 'https://allthingbucket.com/'

      console.log('🔍 Supabase OAuth 설정:', {
        currentOrigin: window.location.origin,
        redirectTo,
        hostname: window.location.hostname,
        isDevelopment
      })

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',  // 구글: 매번 동의 화면 표시 (select_account보다 더 안전)
          },
          scopes: 'openid email profile'
        }
      })

      if (error) {
        console.error('❌ Google OAuth 로그인 실패:', error)
        throw new Error(`Google 로그인에 실패했습니다: ${error.message}`)
      }

      console.log('✅ Google OAuth 리다이렉트 URL:', data.url)
      console.log('🔍 리다이렉트 URL 분석:', {
        url: data.url,
        containsLocalhost: data.url.includes('localhost'),
        contains5173: data.url.includes('5173'),
        containsAllthingbucket: data.url.includes('allthingbucket.com')
      })
      
      // 직접 리다이렉트 방식으로 OAuth 진행 (팝업 제거)
      window.location.href = data.url
      
      // 리다이렉트되므로 Promise는 resolve되지 않음
      return new Promise(() => {})

    } catch (error) {
      console.error('❌ Supabase Google OAuth 실패:', error)
      throw error
    }
  }

  // Kakao OAuth 로그인
  static async signInWithKakao(): Promise<{ user: OAuthUser; token: string }> {
    try {
      console.log('🔥 Supabase Kakao OAuth 로그인 시작...')

      // 개발 환경에서는 localhost, 프로덕션에서는 도메인 사용
      const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const redirectTo = isDevelopment
        ? `${window.location.origin}/`
        : 'https://allthingbucket.com/'

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: redirectTo,
          queryParams: {
            prompt: 'login',  // 카카오: 매번 로그인 화면 표시
          }
        }
      })

      if (error) {
        console.error('❌ Kakao OAuth 로그인 실패:', error)
        throw new Error(`Kakao 로그인에 실패했습니다: ${error.message}`)
      }

      console.log('✅ Kakao OAuth 리다이렉트 URL:', data.url)
      
      // 직접 리다이렉트 방식으로 OAuth 진행 (팝업 제거)
      window.location.href = data.url
      
      // 리다이렉트되므로 Promise는 resolve되지 않음
      return new Promise(() => {})

    } catch (error) {
      console.error('❌ Supabase Kakao OAuth 실패:', error)
      throw error
    }
  }

  // OAuth 콜백 처리 (콜백 페이지에서 호출)
  static async handleOAuthCallback(): Promise<{ user: OAuthUser; token: string }> {
    try {
      this.saveLog('🔥 Supabase OAuth 콜백 처리 시작...')
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        this.saveLog('❌ 세션 가져오기 실패:', error)
        throw new Error(`인증 처리에 실패했습니다: ${error.message}`)
      }

      if (!data.session) {
        this.saveLog('❌ 인증 세션을 찾을 수 없습니다')
        throw new Error('인증 세션을 찾을 수 없습니다')
      }

      const supabaseUser = data.session.user
      this.saveLog('✅ Supabase 사용자 정보:', supabaseUser)
      this.saveLog('🔍 Supabase 사용자 메타데이터:', {
        user_metadata: supabaseUser.user_metadata,
        app_metadata: supabaseUser.app_metadata,
        email: supabaseUser.email,
        id: supabaseUser.id
      })

      // OAuth 사용자 정보 변환
      const oauthUser: OAuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '사용자',
        avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
        provider: supabaseUser.app_metadata?.provider as 'google' | 'kakao' || 'google'
      }
      
      this.saveLog('🔄 OAuth 사용자 이름 처리:', {
        full_name: supabaseUser.user_metadata?.full_name,
        name: supabaseUser.user_metadata?.name,
        email: supabaseUser.email,
        final_name: oauthUser.name
      })
      
      this.saveLog('🔄 변환된 OAuth 사용자 정보:', oauthUser)

      // 로컬 데이터베이스에 사용자 정보 저장/업데이트
      this.saveLog('🔄 1단계: 사용자 정보 동기화 시작...', oauthUser)
      try {
        await this.syncUserToLocalDatabase(oauthUser)
        this.saveLog('✅ 1단계: 사용자 정보 동기화 완료')
      } catch (syncError) {
        this.saveLog('❌ 1단계: 사용자 정보 동기화 실패:', syncError)
        throw syncError
      }
      
      // users 테이블에서 사용자 정보 검증
      this.saveLog('🔄 2단계: 사용자 정보 검증 시작...')
      await this.validateUserInDatabase(oauthUser)
      this.saveLog('✅ 2단계: 사용자 정보 검증 완료')
      
      // 사용자 프로필이 없으면 생성
      this.saveLog('🔄 3단계: 사용자 프로필 확인/생성 시작...')
      await this.ensureUserProfile(oauthUser)
      this.saveLog('✅ 3단계: 사용자 프로필 확인/생성 완료')

      // 토큰 생성
      const token = this.generateToken({
        type: 'user',
        user_id: oauthUser.id,
        email: oauthUser.email,
        name: oauthUser.name,
        role: 'user',
        provider: oauthUser.provider
      })

      console.log('✅ OAuth 로그인 완료:', { user: oauthUser, token })

      return { user: oauthUser, token }

    } catch (error) {
      console.error('❌ OAuth 콜백 처리 실패:', error)
      throw error
    }
  }

  // 로컬 데이터베이스에 사용자 정보 동기화
  private static async syncUserToLocalDatabase(oauthUser: OAuthUser): Promise<void> {
    try {
      this.saveLog('🔄 로컬 데이터베이스에 사용자 정보 동기화 중...', oauthUser)

      // 기존 사용자 확인 (email로 검색)
      this.saveLog('🔍 기존 사용자 목록 조회 중...')
      const existingUsersResponse = await (dataService.entities as any).users.list()
      this.saveLog('📋 기존 사용자 목록 응답:', existingUsersResponse)
      
      const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : []
      this.saveLog('📊 기존 사용자 수:', existingUsers.length)
      
      const existingUser = existingUsers.find((u: any) => u.email === oauthUser.email)
      this.saveLog('🔍 기존 사용자 검색 결과:', existingUser)

      if (existingUser) {
        // 기존 사용자 업데이트
        console.log('✅ 기존 사용자 업데이트:', existingUser)
        const updateData: any = {
          // updated_at은 Supabase에서 자동으로 처리됨
        }
        
        // Google ID 업데이트 (Google 로그인인 경우)
        if (oauthUser.provider === 'google') {
          updateData.google_id = oauthUser.id
        }
        
        // 프로필 이미지 업데이트
        if (oauthUser.avatar_url) {
          updateData.profile_image_url = oauthUser.avatar_url
        }
        
        // 이름 업데이트 (기존 이름이 없거나 비어있는 경우)
        if (!existingUser.name && oauthUser.name) {
          updateData.name = oauthUser.name
          this.saveLog('🔄 기존 사용자 이름 업데이트:', {
            existingName: existingUser.name,
            newName: oauthUser.name,
            email: oauthUser.email
          })
        }

        await (dataService.entities as any).users.update(existingUser.id, updateData)
        console.log('✅ 기존 사용자 업데이트 완료')
        
        // 기존 사용자 프로필도 업데이트
        try {
          const existingProfiles = await (dataService.entities as any).user_profiles.list()
          const profiles = Array.isArray(existingProfiles) ? existingProfiles : []
          const existingProfile = profiles.find((p: any) => p.user_id === oauthUser.id)
          
          if (existingProfile && (!existingProfile.name && oauthUser.name)) {
            await (dataService.entities as any).user_profiles.update(existingProfile.id, {
              name: oauthUser.name,
              updated_at: new Date().toISOString()
            })
            this.saveLog('✅ 기존 사용자 프로필 이름 업데이트 완료:', oauthUser.name)
          }
        } catch (profileUpdateError) {
          this.saveLog('⚠️ 기존 사용자 프로필 업데이트 실패 (무시):', profileUpdateError)
        }
      } else {
        // 새 사용자 생성 (Supabase users 테이블 스키마에 맞게)
        const newUser = {
          user_id: oauthUser.id, // Supabase auth.users.id와 동일
          email: oauthUser.email,
          name: oauthUser.name || null, // name이 비어있으면 null로 설정
          phone: null, // OAuth에서는 전화번호를 받지 않음
          google_id: oauthUser.provider === 'google' ? oauthUser.id : null,
          profile_image_url: oauthUser.avatar_url || null,
          is_active: true
          // created_at, updated_at은 Supabase에서 자동으로 처리됨
        }
        
        this.saveLog('📝 새 사용자 생성 데이터 (이름 확인):', {
          oauthUserName: oauthUser.name,
          newUserName: newUser.name,
          email: oauthUser.email
        })

        this.saveLog('📝 새 사용자 생성 데이터:', newUser)
        this.saveLog('🚀 users.create 호출 시작...')
        
        try {
          this.saveLog('🚀 users.create 직접 호출 시작...')
          
          // dataService를 통한 시도
          try {
            const createResult = await (dataService.entities as any).users.create(newUser)
            this.saveLog('✅ dataService users.create 결과:', createResult)
            
            if (!createResult || !createResult.success) {
              this.saveLog('❌ dataService 사용자 생성 실패:', createResult)
              throw new Error(createResult?.message || 'dataService 사용자 생성에 실패했습니다')
            }
            
            this.saveLog('🎉 dataService 사용자 생성 성공! 생성된 데이터:', createResult.data)
          } catch (dataServiceError: any) {
            this.saveLog('❌ dataService 실패, 직접 Supabase 시도:', dataServiceError)
            
            // dataService 실패 시 직접 Supabase 호출
            const { data: directResult, error: directError } = await supabase
              .from('users')
              .insert([newUser])
              .select()
            
            if (directError) {
              this.saveLog('❌ 직접 Supabase 사용자 생성 실패:', directError)
              throw new Error(`직접 Supabase 사용자 생성 실패: ${directError.message}`)
            }
            
            this.saveLog('🎉 직접 Supabase 사용자 생성 성공! 생성된 데이터:', directResult)
          }
          
        } catch (createError: any) {
          this.saveLog('❌ users.create 최종 실패:', createError)
          this.saveLog('❌ 에러 타입:', typeof createError)
          this.saveLog('❌ 에러 메시지:', createError?.message)
          this.saveLog('❌ 에러 스택:', createError?.stack)
          throw createError
        }

        // 사용자 프로필 생성
        await (dataService.entities as any).user_profiles.create({
          user_id: oauthUser.id,
          name: oauthUser.name
        })
        
        this.saveLog('✅ 사용자 프로필 생성 완료 - 이름:', oauthUser.name)

        // 사용자 포인트 초기화 (실패해도 로그인은 계속 진행)
        try {
          this.saveLog('🔄 사용자 포인트 초기화 중...')

          // users 테이블에 사용자가 존재하는지 한 번 더 확인
          const usersCheck = await (dataService.entities as any).users.list()
          const userExists = Array.isArray(usersCheck) && usersCheck.some((u: any) => u.user_id === oauthUser.id || u.email === oauthUser.email)

          if (!userExists) {
            this.saveLog('⚠️ users 테이블에 사용자가 없어서 user_points 생성 건너뜀')
            console.log('⚠️ users 테이블에 사용자가 없어서 user_points 생성을 건너뜁니다.')
          } else {
            await (dataService.entities as any).user_points.create({
              user_id: oauthUser.id,
              points: 0,
              earned_points: 0,
              used_points: 0
            })
            this.saveLog('✅ 사용자 포인트 초기화 완료')
          }
        } catch (pointsError: any) {
          this.saveLog('⚠️ 사용자 포인트 초기화 실패 (무시):', pointsError)
          console.warn('⚠️ 사용자 포인트 초기화 실패 (무시):', pointsError?.message || pointsError)
        }

        console.log('✅ 새 사용자 및 관련 데이터 생성 완료')
      }

    } catch (error) {
      console.error('❌ 사용자 정보 동기화 실패:', error)
      // 동기화 실패해도 로그인은 계속 진행
    }
  }

  // 토큰 생성
  private static generateToken(payload: any): string {
    try {
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const userType = payload.type || 'user'
      const userId = payload.user_id || 'unknown'
      
      return `token_${userType}_${userId}_${timestamp}_${random}`
    } catch (error) {
      console.error('토큰 생성 실패:', error)
      return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // users 테이블에서 사용자 정보 검증
  private static async validateUserInDatabase(oauthUser: OAuthUser): Promise<void> {
    try {
      this.saveLog('🔍 users 테이블에서 사용자 정보 검증 중...', oauthUser)

      // users 테이블에서 사용자 확인
      this.saveLog('🔄 users.list() 호출 중...')
      const usersResponse = await (dataService.entities as any).users.list()
      this.saveLog('📋 users.list() 응답:', usersResponse)
      
      const users = Array.isArray(usersResponse) ? usersResponse : []
      this.saveLog('📊 전체 사용자 수:', users.length)
      this.saveLog('📋 전체 사용자 목록:', users)
      
      // 이메일로 우선 검색 (구글 로그인 시 정확한 매칭)
      let dbUser = users.find((u: any) => u.email === oauthUser.email)
      
      // 이메일로 찾지 못한 경우 user_id로 검색
      if (!dbUser) {
        dbUser = users.find((u: any) => u.user_id === oauthUser.id)
      }
      
      this.saveLog('🔍 검색된 사용자 (이메일 우선):', {
        foundByEmail: users.find((u: any) => u.email === oauthUser.email),
        foundByUserId: users.find((u: any) => u.user_id === oauthUser.id),
        finalDbUser: dbUser
      })

      if (!dbUser) {
        this.saveLog('❌ users 테이블에서 사용자를 찾을 수 없음:', { 
          oauthUserId: oauthUser.id, 
          oauthUserEmail: oauthUser.email,
          searchCriteria: {
            byUserId: users.find((u: any) => u.user_id === oauthUser.id),
            byEmail: users.find((u: any) => u.email === oauthUser.email)
          }
        })
        throw new Error('사용자 정보가 데이터베이스에 저장되지 않았습니다. 다시 로그인해주세요.')
      }

      this.saveLog('✅ users 테이블에서 사용자 확인됨:', dbUser)
      
      // 사용자 정보가 올바른지 검증
      if (dbUser.email !== oauthUser.email) {
        this.saveLog('⚠️ 이메일 불일치:', { dbEmail: dbUser.email, oauthEmail: oauthUser.email })
      }

      if (oauthUser.provider === 'google' && dbUser.google_id !== oauthUser.id) {
        this.saveLog('⚠️ Google ID 불일치:', { dbGoogleId: dbUser.google_id, oauthId: oauthUser.id })
      }

    } catch (error) {
      this.saveLog('❌ 사용자 정보 검증 실패:', error)
      throw error
    }
  }

  // 사용자 프로필 확인 및 생성
  private static async ensureUserProfile(oauthUser: OAuthUser): Promise<void> {
    try {
      console.log('🔍 사용자 프로필 확인 중...', oauthUser)

      // 기존 프로필 확인
      const existingProfiles = await (dataService.entities as any).user_profiles.list()
      const profiles = Array.isArray(existingProfiles) ? existingProfiles : []
      const existingProfile = profiles.find((p: any) => p.user_id === oauthUser.id)

      if (!existingProfile) {
        console.log('📝 새 사용자 프로필 생성 중...')

        // 새 프로필 생성
        await (dataService.entities as any).user_profiles.create({
          user_id: oauthUser.id,
          name: oauthUser.name
        })
        
        console.log('✅ 사용자 프로필 생성 완료 - 이름:', oauthUser.name)

        console.log('✅ 사용자 프로필 생성 완료')
      } else {
        console.log('✅ 기존 사용자 프로필 확인됨')
        
        // 기존 프로필의 이름이 없거나 비어있는 경우 업데이트
        if (!existingProfile.name && oauthUser.name) {
          console.log('🔄 기존 프로필 이름 업데이트 중...')
          try {
            await (dataService.entities as any).user_profiles.update(existingProfile.id, {
              name: oauthUser.name,
              updated_at: new Date().toISOString()
            })
            console.log('✅ 기존 프로필 이름 업데이트 완료:', oauthUser.name)
          } catch (updateError) {
            console.warn('⚠️ 기존 프로필 이름 업데이트 실패 (무시):', updateError)
          }
        }
      }
    } catch (error) {
      console.error('❌ 사용자 프로필 생성 실패:', error)
      // 프로필 생성 실패해도 로그인은 계속 진행
    }
  }

  // 로그아웃
  static async signOut(): Promise<void> {
    try {
      console.log('🔥 Supabase 로그아웃 시작...')
      
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ 로그아웃 실패:', error)
        throw new Error(`로그아웃에 실패했습니다: ${error.message}`)
      }

      // 로컬 토큰 제거
      localStorage.removeItem('auth_token')
      
      console.log('✅ 로그아웃 완료')
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error)
      throw error
    }
  }

  // 현재 세션 확인
  static async getCurrentSession(): Promise<any> {
    try {
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ 세션 확인 실패:', error)
        return null
      }

      return data.session
    } catch (error) {
      console.error('❌ 세션 확인 실패:', error)
      return null
    }
  }

  // 저장된 로그 확인
  static getStoredLogs(): any[] {
    try {
      return JSON.parse(localStorage.getItem('oauth_logs') || '[]')
    } catch (error) {
      console.error('로그 조회 실패:', error)
      return []
    }
  }

  // 세션 로그 확인 (페이지 리다이렉트 후에도 유지)
  static getSessionLogs(): any[] {
    try {
      return JSON.parse(sessionStorage.getItem('oauth_session_logs') || '[]')
    } catch (error) {
      console.error('세션 로그 조회 실패:', error)
      return []
    }
  }

  // 저장된 로그 삭제
  static clearStoredLogs(): void {
    localStorage.removeItem('oauth_logs')
    sessionStorage.removeItem('oauth_session_logs')
  }

  // 디버깅용: 현재 저장된 모든 로그 출력
  static debugLogs(): void {
    console.log('=== OAuth 로그 디버깅 ===')
    console.log('localStorage 로그:', this.getStoredLogs())
    console.log('sessionStorage 로그:', this.getSessionLogs())
    console.log('========================')
  }

  // 디버깅용: users 테이블 직접 테스트
  static async testUsersTable(): Promise<void> {
    try {
      console.log('🧪 users 테이블 테스트 시작...')
      
      // 1. 현재 users 테이블 상태 확인
      const { data: existingUsers, error: listError } = await supabase
        .from('users')
        .select('*')
      
      if (listError) {
        console.error('❌ users 테이블 조회 실패:', listError)
        return
      }
      
      console.log('📋 현재 users 테이블 데이터:', existingUsers)
      
      // 2. 테스트 데이터 삽입 시도
      const testUser = {
        user_id: `test_${Date.now()}`,
        email: `test_${Date.now()}@example.com`,
        name: '테스트 사용자',
        phone: null,
        google_id: null,
        profile_image_url: null,
        is_active: true
      }
      
      console.log('📝 테스트 데이터 삽입 시도:', testUser)
      
      const { data: insertResult, error: insertError } = await supabase
        .from('users')
        .insert([testUser])
        .select()
      
      if (insertError) {
        console.error('❌ users 테이블 삽입 실패:', insertError)
        console.error('❌ 에러 상세:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code
        })
      } else {
        console.log('✅ users 테이블 삽입 성공:', insertResult)
        
        // 3. 삽입된 데이터 삭제 (정리)
        if (insertResult && insertResult.length > 0) {
          const { error: deleteError } = await supabase
            .from('users')
            .delete()
            .eq('id', insertResult[0].id)
          
          if (deleteError) {
            console.error('❌ 테스트 데이터 삭제 실패:', deleteError)
          } else {
            console.log('✅ 테스트 데이터 삭제 완료')
          }
        }
      }
      
    } catch (error) {
      console.error('❌ users 테이블 테스트 실패:', error)
    }
  }

  // 디버깅용: dataService vs 직접 Supabase 비교 테스트
  static async compareDataServiceVsDirect(): Promise<void> {
    try {
      console.log('🔍 dataService vs 직접 Supabase 비교 테스트 시작...')
      
      const testUser = {
        user_id: `compare_${Date.now()}`,
        email: `compare_${Date.now()}@example.com`,
        name: '비교 테스트 사용자',
        phone: null,
        google_id: null,
        profile_image_url: null,
        is_active: true
      }
      
      console.log('📝 테스트 데이터:', testUser)
      
      // 1. dataService를 통한 삽입
      console.log('🔄 1단계: dataService.entities.users.create 테스트...')
      try {
        const dataServiceResult = await (dataService.entities as any).users.create(testUser)
        console.log('✅ dataService 결과:', dataServiceResult)
      } catch (dataServiceError) {
        console.error('❌ dataService 실패:', dataServiceError)
      }
      
      // 2. 직접 Supabase를 통한 삽입
      console.log('🔄 2단계: 직접 Supabase 테스트...')
      try {
        const { data: directResult, error: directError } = await supabase
          .from('users')
          .insert([{...testUser, user_id: `direct_${Date.now()}`}])
          .select()
        
        if (directError) {
          console.error('❌ 직접 Supabase 실패:', directError)
        } else {
          console.log('✅ 직접 Supabase 성공:', directResult)
        }
      } catch (directException) {
        console.error('❌ 직접 Supabase 예외:', directException)
      }
      
    } catch (error) {
      console.error('❌ 비교 테스트 실패:', error)
    }
  }
}

export const supabaseOAuthService = new SupabaseOAuthService()
