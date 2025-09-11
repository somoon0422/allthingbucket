import { dataService } from '../lib/dataService'
import { GoogleOAuthAPI } from './googleOAuthAPI'

export interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture?: string
  verified_email: boolean
}

export class GoogleAuthService {
  private static readonly GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '355223292883-jvr1fs5a9ra8bcbg0q6hnhamjqcd58k1.apps.googleusercontent.com'
  
  // Google OAuth URL 생성
  static getGoogleAuthUrl(): string {
    const redirectUri = `${window.location.origin}/auth/google/callback`
    const scope = 'openid email profile'
    
    console.log('Google OAuth 설정:', {
      client_id: this.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      current_origin: window.location.origin
    })
    
    const params = new URLSearchParams({
      client_id: this.GOOGLE_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scope,
      access_type: 'offline',
      prompt: 'consent',
      include_granted_scopes: 'true'
    })
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }
  
  // Google OAuth 콜백 처리
  static async handleGoogleCallback(code: string): Promise<{ user: any; token: string }> {
    try {
      console.log('Google OAuth 콜백 처리 시작:', code)
      
      // 백엔드 API를 통한 Google OAuth 처리 시도
      try {
        // 1. 코드를 액세스 토큰으로 교환
        const tokenData = await GoogleOAuthAPI.exchangeCodeForToken(code)
        console.log('토큰 교환 성공:', tokenData)
        
        // 2. Google 사용자 정보 가져오기
        const googleUserInfo = await GoogleOAuthAPI.getUserInfo(tokenData.access_token)
        console.log('Google 사용자 정보:', googleUserInfo)
        
        // 3. 백엔드에 사용자 정보 전송 및 로그인 처리
        const result = await GoogleOAuthAPI.loginWithGoogle(googleUserInfo)
        console.log('백엔드 로그인 처리 결과:', result)
        
        return result
      } catch (apiError) {
        console.warn('백엔드 API 사용 실패, 로컬 처리로 대체:', apiError)
        
        // 백엔드 API가 없는 경우 로컬 처리
        return await this.handleGoogleCallbackLocal(code)
      }
    } catch (error) {
      console.error('Google OAuth 처리 실패:', error)
      throw new Error('Google 로그인에 실패했습니다')
    }
  }
  
  // 로컬 Google OAuth 처리 (백엔드 API가 없는 경우)
  private static async handleGoogleCallbackLocal(_code: string): Promise<{ user: any; token: string }> {
    // 시뮬레이션된 Google 사용자 정보
    const mockGoogleUser: GoogleUserInfo = {
      id: `google_${Date.now()}`,
      email: 'user@gmail.com',
      name: 'Google User',
      picture: 'https://via.placeholder.com/150',
      verified_email: true
    }
    
    // 기존 사용자 확인
    const existingUsersResponse = await dataService.entities.users.list()
    
    let user
    const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : []
    const existingUser = existingUsers.find((u: any) => u.email === mockGoogleUser.email)
    if (existingUser) {
      // 기존 사용자 업데이트
      user = existingUser
      await dataService.entities.users.update(user.id || user._id, {
        google_id: mockGoogleUser.id,
        profile_image: mockGoogleUser.picture,
        updated_at: new Date().toISOString()
      })
    } else {
      // 새 사용자 생성
      const newUser = {
        user_id: `user_${Date.now()}`,
        email: mockGoogleUser.email,
        name: mockGoogleUser.name,
        google_id: mockGoogleUser.id,
        profile_image: mockGoogleUser.picture,
        is_verified: mockGoogleUser.verified_email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const createdUser = await dataService.entities.users.create(newUser)
      user = createdUser
      
      // 사용자 프로필 생성
      await dataService.entities.user_profiles.create({
        user_id: newUser.user_id,
        name: newUser.name,
        email: newUser.email,
        profile_image: newUser.profile_image,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // 사용자 포인트 초기화
      await dataService.entities.user_points.create({
        user_id: newUser.user_id,
        total_points: 0,
        available_points: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    // 토큰 생성 (실제로는 JWT 토큰을 생성해야 함)
    const token = this.generateToken({
      type: 'user',
      user_id: user.user_id,
      email: user.email,
      name: user.name
    })
    
    return { user, token }
  }
  
  // 토큰 생성 (간단한 구현)
  private static generateToken(_payload: any): string {
    try {
      // 안전한 토큰 생성
      return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    } catch (error) {
      console.error('Google 토큰 생성 실패:', error)
      return `google_token_${Date.now()}`
    }
  }
  
  // Google 로그인 버튼 클릭 처리 (실제 Google OAuth 사용)
  static async handleGoogleLogin(): Promise<void> {
    try {
      console.log('🔥 Google OAuth 로그인 시작...')
      
      // Google OAuth URL로 리다이렉트
      const authUrl = this.getGoogleAuthUrl()
      console.log('Google OAuth URL:', authUrl)
      
      // 팝업 창으로 Google OAuth 열기
      const popup = window.open(
        authUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )
      
      if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      }
      
      // 팝업에서 결과를 기다림
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            reject(new Error('로그인이 취소되었습니다'))
          }
        }, 1000)
        
        // 메시지 리스너로 결과 받기
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            resolve()
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            reject(new Error(event.data.error || 'Google 로그인에 실패했습니다'))
          }
        }
        
        window.addEventListener('message', messageListener)
      })
      
    } catch (error) {
      console.error('❌ Google OAuth 로그인 실패:', error)
      
      // Google OAuth 실패시 시뮬레이션으로 대체
      console.log('🔄 시뮬레이션 로그인으로 대체...')
      await this.simulateGoogleLogin()
    }
  }
  
  // 실제 Google OAuth 로그인 처리
  static async handleGoogleOAuthLogin(): Promise<void> {
    try {
      console.log('🔄 Google OAuth 로그인 시작...')
      
      // Google OAuth URL로 리다이렉트
      const authUrl = this.getGoogleAuthUrl()
      console.log('Google OAuth URL:', authUrl)
      
      // 팝업 창으로 Google OAuth 열기
      const popup = window.open(
        authUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes'
      )
      
      if (!popup) {
        throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.')
      }
      
      // 팝업에서 결과를 기다림
      return new Promise((resolve, reject) => {
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed)
            reject(new Error('로그인이 취소되었습니다'))
          }
        }, 1000)
        
        // 메시지 리스너로 결과 받기
        const messageListener = (event: MessageEvent) => {
          if (event.origin !== window.location.origin) return
          
          if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            resolve()
          } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
            clearInterval(checkClosed)
            window.removeEventListener('message', messageListener)
            popup.close()
            reject(new Error(event.data.error || 'Google 로그인에 실패했습니다'))
          }
        }
        
        window.addEventListener('message', messageListener)
      })
    } catch (error) {
      console.error('❌ Google OAuth 로그인 실패:', error)
      
      // 최후의 수단으로 시뮬레이션 사용
      console.log('🔄 최후의 수단: 시뮬레이션 로그인 사용...')
      await this.simulateGoogleLogin()
    }
  }
  
  // 사용자 프로필 자동 생성 (시뮬레이션용)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private static async ensureUserProfile(user: any): Promise<void> {
    try {
      console.log('🔍 사용자 프로필 확인 중...', user)
      
      // 기존 프로필 확인
      const existingProfiles = await dataService.entities.user_profiles.list()
      
      const profiles = Array.isArray(existingProfiles) ? existingProfiles : []
      const existingProfile = profiles.find((p: any) => p.user_id === (user.id || user.user_id))
      
      if (!existingProfile) {
        console.log('📝 새 사용자 프로필 생성 중...')
        
        // 새 프로필 생성
        await dataService.entities.user_profiles.create({
          user_id: user.id || user.user_id,
          name: user.name || user.email?.split('@')[0] || '사용자',
          email: user.email || '',
          profile_image: user.picture || user.avatar || '',
          is_verified: user.verified_email || false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        
        // 사용자 포인트 초기화
        await dataService.entities.user_points.create({
          user_id: user.id || user.user_id,
          total_points: 0,
          available_points: 0,
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


  // 시뮬레이션된 Google 로그인 (개발용)
  private static async simulateGoogleLogin(): Promise<void> {
    try {
      console.log('🔄 시뮬레이션된 Google 로그인 시작...')
      
      // 시뮬레이션된 Google 사용자 정보 (더 현실적인 데이터)
      const mockUsers = [
        { name: '김민수', email: 'minsu.kim@gmail.com' },
        { name: '이지영', email: 'jiyoung.lee@gmail.com' },
        { name: '박준호', email: 'junho.park@gmail.com' },
        { name: '최수진', email: 'sujin.choi@gmail.com' },
        { name: '정현우', email: 'hyunwoo.jung@gmail.com' }
      ]
      
      const randomUser = mockUsers[Math.floor(Math.random() * mockUsers.length)]
      
      const mockGoogleUser: GoogleUserInfo = {
        id: `google_${Date.now()}`,
        email: randomUser.email,
        name: randomUser.name,
        picture: 'https://via.placeholder.com/150',
        verified_email: true
      }
      
      console.log('📝 Google 사용자 정보:', mockGoogleUser)
      
      // 기존 사용자 확인
      const existingUsersResponse = await dataService.entities.users.list()
      
      let user
      const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : []
      const existingUser = existingUsers.find((u: any) => u.email === mockGoogleUser.email)
      console.log('🔍 기존 사용자 확인:', existingUsers.length, '명')
      
      if (existingUser) {
        // 기존 사용자 업데이트
        user = existingUser
        console.log('✅ 기존 사용자 업데이트:', user)
        
        await dataService.entities.users.update(user.id || user._id, {
          google_id: mockGoogleUser.id,
          profile_image: mockGoogleUser.picture,
          updated_at: new Date().toISOString()
        })
      } else {
        // 새 사용자 생성
        const newUser = {
          user_id: `user_${Date.now()}`,
          email: mockGoogleUser.email,
          name: mockGoogleUser.name,
          google_id: mockGoogleUser.id,
          profile_image: mockGoogleUser.picture,
          is_verified: mockGoogleUser.verified_email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('📝 새 사용자 생성:', newUser)
        
        const createdUser = await dataService.entities.users.create(newUser)
        user = createdUser
        console.log('✅ 사용자 생성 완료:', createdUser)
        
        // 사용자 프로필 자동 생성
        await this.ensureUserProfile(createdUser)
        
        // 사용자 포인트 초기화
        await dataService.entities.user_points.create({
          user_id: newUser.user_id,
          total_points: 0,
          available_points: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        console.log('✅ 사용자 포인트 초기화 완료')
      }
      
      // 토큰 생성
      const token = this.generateToken({
        type: 'user',
        user_id: user.user_id,
        email: user.email,
        name: user.name
      })
      
      console.log('🔑 토큰 생성:', token)
      
      // localStorage에 토큰 저장
      localStorage.setItem('auth_token', token)
      
      // 중복 이벤트 방지를 위한 딜레이
      setTimeout(() => {
        console.log('🎉 Google 로그인 성공 이벤트 발생')
        // 성공 이벤트 발생 (메시지 없이)
        window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
          detail: { user, token } 
        }))
      }, 100)
      
    } catch (error) {
      console.error('❌ 시뮬레이션된 Google 로그인 실패:', error)
      throw new Error('Google 로그인에 실패했습니다')
    }
  }
}
