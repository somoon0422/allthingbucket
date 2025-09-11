import { createClient } from '@supabase/supabase-js'
import { dataService } from '../lib/dataService'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE'

// 앱 설정 (필요시 사용)
// const APP_DOMAIN = import.meta.env.VITE_APP_DOMAIN || 'allthingbucket.com'
// const APP_NAME = import.meta.env.VITE_APP_NAME || '올띵버킷'

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseKey)

export interface OAuthUser {
  id: string
  email: string
  name: string
  avatar_url?: string
  provider: 'google' | 'kakao'
}

export class SupabaseOAuthService {
  // Google OAuth 로그인
  static async signInWithGoogle(): Promise<{ user: OAuthUser; token: string }> {
    try {
      console.log('🔥 Supabase Google OAuth 로그인 시작...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('❌ Google OAuth 로그인 실패:', error)
        throw new Error(`Google 로그인에 실패했습니다: ${error.message}`)
      }

      console.log('✅ Google OAuth 리다이렉트 URL:', data.url)
      
      // 팝업으로 OAuth 진행
      return new Promise((resolve, reject) => {
        const popup = window.open(
          data.url,
          'supabase-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // 팝업이 제대로 열렸는지 확인
        if (!popup) {
          console.warn('팝업 창을 열 수 없습니다. 팝업 차단이 활성화되어 있을 수 있습니다.')
          // 팝업이 열리지 않으면 직접 리다이렉트
          window.location.href = data.url
          return
        }

        // 팝업에서 결과를 기다림
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            reject(new Error('로그인이 취소되었습니다'))
          }
        }, 1000)

        // 메시지 리스너로 결과 받기
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'SUPABASE_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            resolve(event.data.result)
          } else if (event.data.type === 'SUPABASE_AUTH_ERROR') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            reject(new Error(event.data.error || 'OAuth 로그인에 실패했습니다'))
          }
        }

        window.addEventListener('message', messageListener)
      })

    } catch (error) {
      console.error('❌ Supabase Google OAuth 실패:', error)
      throw error
    }
  }

  // Kakao OAuth 로그인
  static async signInWithKakao(): Promise<{ user: OAuthUser; token: string }> {
    try {
      console.log('🔥 Supabase Kakao OAuth 로그인 시작...')
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'kakao',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('❌ Kakao OAuth 로그인 실패:', error)
        throw new Error(`Kakao 로그인에 실패했습니다: ${error.message}`)
      }

      console.log('✅ Kakao OAuth 리다이렉트 URL:', data.url)
      
      // 팝업으로 OAuth 진행
      return new Promise((resolve, reject) => {
        const popup = window.open(
          data.url,
          'supabase-oauth',
          'width=500,height=600,scrollbars=yes,resizable=yes'
        )

        // 팝업이 제대로 열렸는지 확인
        if (!popup) {
          console.warn('팝업 창을 열 수 없습니다. 팝업 차단이 활성화되어 있을 수 있습니다.')
          // 팝업이 열리지 않으면 직접 리다이렉트
          window.location.href = data.url
          return
        }

        // 팝업에서 결과를 기다림
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            reject(new Error('로그인이 취소되었습니다'))
          }
        }, 1000)

        // 메시지 리스너로 결과 받기
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return

          if (event.data.type === 'SUPABASE_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            resolve(event.data.result)
          } else if (event.data.type === 'SUPABASE_AUTH_ERROR') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            reject(new Error(event.data.error || 'OAuth 로그인에 실패했습니다'))
          }
        }

        window.addEventListener('message', messageListener)
      })

    } catch (error) {
      console.error('❌ Supabase Kakao OAuth 실패:', error)
      throw error
    }
  }

  // OAuth 콜백 처리 (콜백 페이지에서 호출)
  static async handleOAuthCallback(): Promise<{ user: OAuthUser; token: string }> {
    try {
      console.log('🔥 Supabase OAuth 콜백 처리 시작...')
      
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        console.error('❌ 세션 가져오기 실패:', error)
        throw new Error(`인증 처리에 실패했습니다: ${error.message}`)
      }

      if (!data.session) {
        throw new Error('인증 세션을 찾을 수 없습니다')
      }

      const supabaseUser = data.session.user
      console.log('✅ Supabase 사용자 정보:', supabaseUser)

      // OAuth 사용자 정보 변환
      const oauthUser: OAuthUser = {
        id: supabaseUser.id,
        email: supabaseUser.email || '',
        name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || '사용자',
        avatar_url: supabaseUser.user_metadata?.avatar_url || supabaseUser.user_metadata?.picture,
        provider: supabaseUser.app_metadata?.provider as 'google' | 'kakao' || 'google'
      }

      // 로컬 데이터베이스에 사용자 정보 저장/업데이트
      await this.syncUserToLocalDatabase(oauthUser)
      
      // 사용자 프로필이 없으면 생성
      await this.ensureUserProfile(oauthUser)

      // 토큰 생성
      const token = this.generateToken({
        type: 'user',
        user_id: oauthUser.id,
        email: oauthUser.email,
        name: oauthUser.name,
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
      console.log('🔄 로컬 데이터베이스에 사용자 정보 동기화 중...', oauthUser)

      // 기존 사용자 확인
      const existingUsersResponse = await (dataService.entities as any).users.list()
      const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : []
      const existingUser = existingUsers.find((u: any) => u.email === oauthUser.email)

      if (existingUser) {
        // 기존 사용자 업데이트
        console.log('✅ 기존 사용자 업데이트:', existingUser)
        await (dataService.entities as any).users.update(existingUser.id || existingUser._id, {
          [`${oauthUser.provider}_id`]: oauthUser.id,
          profile_image: oauthUser.avatar_url,
          updated_at: new Date().toISOString()
        })
      } else {
        // 새 사용자 생성
        const newUser = {
          user_id: oauthUser.id,
          email: oauthUser.email,
          name: oauthUser.name,
          [`${oauthUser.provider}_id`]: oauthUser.id,
          profile_image: oauthUser.avatar_url,
          is_verified: true,
          total_points: 0,
          available_points: 0,
          used_points: 0,
          pending_points: 0,
          login_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }

        console.log('📝 새 사용자 생성:', newUser)
        await (dataService.entities as any).users.create(newUser)

        // 사용자 프로필 생성
        await (dataService.entities as any).user_profiles.create({
          user_id: oauthUser.id,
          name: oauthUser.name,
          email: oauthUser.email,
          profile_image: oauthUser.avatar_url,
          total_points: 0,
          available_points: 0,
          used_points: 0,
          pending_points: 0,
          last_login: new Date().toISOString(),
          login_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        // 사용자 포인트 초기화
        await (dataService.entities as any).user_points.create({
          user_id: oauthUser.id,
          total_points: 0,
          available_points: 0,
          withdrawn_points: 0,
          tax_amount: 0,
          bank_account: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

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
          name: oauthUser.name,
          email: oauthUser.email,
          profile_image: oauthUser.avatar_url || '',
          total_points: 0,
          available_points: 0,
          used_points: 0,
          pending_points: 0,
          last_login: new Date().toISOString(),
          login_count: 0,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        console.log('✅ 사용자 프로필 생성 완료')
      } else {
        console.log('✅ 기존 사용자 프로필 확인됨')
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
}

export const supabaseOAuthService = new SupabaseOAuthService()
