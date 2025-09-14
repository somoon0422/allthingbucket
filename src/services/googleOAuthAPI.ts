// Google OAuth API 서비스
import { dataService } from '../lib/dataService'

export class GoogleOAuthAPI {
  // Google OAuth 토큰 교환 (Supabase Auth 사용)
  static async exchangeCodeForToken(_code: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }> {
    try {
      // Supabase Auth를 사용한 Google OAuth 처리
      const result = await dataService.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      
      if (result.error) {
        throw new Error('Google OAuth 인증에 실패했습니다')
      }
      
      // 임시 토큰 반환 (실제로는 Supabase에서 처리)
      return {
        access_token: 'google_token_' + Date.now(),
        expires_in: 3600
      }
    } catch (error) {
      console.error('Google OAuth 토큰 교환 실패:', error)
      throw error
    }
  }
  
  // Google 사용자 정보 가져오기
  static async getUserInfo(accessToken: string): Promise<{
    id: string
    email: string
    name: string
    picture?: string
    verified_email: boolean
  }> {
    try {
      const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })
      
      if (!response.ok) {
        throw new Error('사용자 정보를 가져올 수 없습니다')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Google 사용자 정보 조회 실패:', error)
      throw error
    }
  }
  
  // Supabase를 사용한 Google 로그인 처리
  static async loginWithGoogle(googleUserInfo: any): Promise<{
    user: any
    token: string
  }> {
    try {
      // Supabase Auth를 사용한 Google 로그인
      const result = await dataService.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/auth/callback'
        }
      })
      
      if (result.error) {
        throw new Error('Google 로그인에 실패했습니다')
      }
      
      // 사용자 프로필 생성 또는 업데이트
      const profileData = {
        id: googleUserInfo.id,
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        profile_picture: googleUserInfo.picture,
        verified_email: googleUserInfo.verified_email,
        created_at: new Date().toISOString()
      }
      
      // public.users 테이블에 사용자 정보 저장
      const userData = {
        id: googleUserInfo.id,
        user_id: googleUserInfo.id,
        name: googleUserInfo.name,
        email: googleUserInfo.email,
        avatar_url: googleUserInfo.picture,
        provider: 'google',
        created_at: new Date().toISOString()
      }
      
      // 기존 사용자 확인
      const existingUsers = await (dataService.entities as any).users.list()
      const existingUser = existingUsers.find((user: any) => user.user_id === googleUserInfo.id)
      
      if (!existingUser) {
        await (dataService.entities as any).users.create(userData)
        console.log('✅ public.users에 새 사용자 생성:', userData)
      } else {
        await (dataService.entities as any).users.update(existingUser.id, userData)
        console.log('✅ public.users 사용자 정보 업데이트:', userData)
      }
      
      // 기존 프로필 확인
      const existingProfile = await (dataService.entities as any).user_profiles.get(googleUserInfo.id)
      
      if (!existingProfile) {
        await (dataService.entities as any).user_profiles.create(profileData)
      } else {
        await (dataService.entities as any).user_profiles.update(googleUserInfo.id, profileData)
      }
      
      return {
        user: {
          id: googleUserInfo.id,
          email: googleUserInfo.email,
          name: googleUserInfo.name,
          profile: profileData
        },
        token: 'google_token_' + Date.now()
      }
    } catch (error) {
      console.error('Google 로그인 처리 실패:', error)
      throw error
    }
  }
}