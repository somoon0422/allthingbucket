// 실제 Google OAuth 서비스 (브라우저 네이티브)

interface GoogleUserInfo {
  id: string
  email: string
  name: string
  picture: string
  verified_email: boolean
}

interface GoogleAuthConfig {
  clientId: string
  redirectUri: string
  scope: string
}

class RealGoogleAuthService {
  private static config: GoogleAuthConfig = {
    clientId: import.meta.env.VITE_GOOGLE_CLIENT_ID || '',
    redirectUri: `${window.location.origin}/auth/google/callback`,
    scope: 'openid email profile'
  }

  // Google OAuth 초기화
  static initialize(): void {
    if (!this.config.clientId) {
      console.error('❌ Google Client ID가 설정되지 않았습니다.')
      console.log('📝 .env 파일에 VITE_GOOGLE_CLIENT_ID를 설정해주세요.')
      return
    }

    console.log('✅ Google OAuth 초기화 완료:', {
      clientId: this.config.clientId.substring(0, 20) + '...',
      redirectUri: this.config.redirectUri
    })
  }

  // Google OAuth URL 생성
  static getGoogleAuthUrl(): string {
    this.initialize()

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: this.config.scope,
      access_type: 'offline',
      prompt: 'select_account'
    })

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    console.log('🔗 Google OAuth URL 생성:', authUrl)
    return authUrl
  }

  // Google 로그인 시작 (팝업 방식)
  static async startGoogleLogin(): Promise<void> {
    try {
      console.log('🚀 실제 Google OAuth 로그인 시작...')
      
      const authUrl = this.getGoogleAuthUrl()
      
      // 팝업 창으로 Google OAuth 열기
      const popup = window.open(
        authUrl,
        'googleAuth',
        'width=500,height=600,scrollbars=yes,resizable=yes,status=yes'
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
            
            // 사용자 정보 처리
            this.handleGoogleUser(event.data.user)
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
      throw error
    }
  }

  // Google 사용자 정보 처리
  private static async handleGoogleUser(googleUser: GoogleUserInfo): Promise<void> {
    try {
      console.log('👤 Google 사용자 정보 처리:', googleUser)

      // Lumi SDK를 사용하여 사용자 정보 저장
      const { lumi } = await import('../lib/lumi')
      
      // 기존 사용자 확인
      const existingUsersResponse = await dataService.entities.users.list({
        filter: { email: googleUser.email }
      })
      
      let user
      const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : existingUsersResponse?.list || []
      
      if (existingUsers.length > 0) {
        // 기존 사용자 업데이트
        user = existingUsers[0]
        console.log('✅ 기존 사용자 업데이트:', user)
        
        await dataService.entities.users.update(user._id, {
          google_id: googleUser.id,
          profile_image: googleUser.picture,
          updated_at: new Date().toISOString()
        })
      } else {
        // 새 사용자 생성
        const newUser = {
          user_id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          email: googleUser.email,
          name: googleUser.name,
          google_id: googleUser.id,
          profile_image: googleUser.picture,
          is_verified: googleUser.verified_email,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('📝 새 사용자 생성:', newUser)
        
        const createdUser = await dataService.entities.users.create(newUser)
        user = createdUser
        console.log('✅ 새 사용자 생성 완료:', createdUser)
      }

      // 사용자 프로필 자동 생성
      await this.ensureUserProfile(user)

      // 성공 이벤트 발생
      window.dispatchEvent(new CustomEvent('googleLoginSuccess', { 
        detail: { user, token: 'google_oauth_token' }
      }))

      console.log('🎉 Google 로그인 완료!')
    } catch (error) {
      console.error('❌ Google 사용자 정보 처리 실패:', error)
      throw error
    }
  }

  // 사용자 프로필 자동 생성
  private static async ensureUserProfile(user: any): Promise<void> {
    try {
      console.log('🔍 사용자 프로필 확인 중...', user)

      const { lumi } = await import('../lib/lumi')
      
      // 기존 프로필 확인
      const existingProfilesResponse = await dataService.entities.user_profiles.list({
        filter: { user_id: user.user_id }
      })
      
      const existingProfiles = Array.isArray(existingProfilesResponse) ? existingProfilesResponse : existingProfilesResponse?.list || []
      
      if (existingProfiles.length === 0) {
        // 새 프로필 생성
        const newProfile = {
          user_id: user.user_id,
          phone: '',
          address: '',
          birth_date: '',
          instagram_id: '',
          youtube_channel: '',
          tiktok_id: '',
          facebook_page: '',
          other_sns: '',
          follower_counts: {
            instagram: 0,
            youtube: 0,
            tiktok: 0,
            naver_blog: 0,
            facebook: 0
          },
          categories: [],
          experience_level: 'beginner',
          bank_name: '',
          account_number: '',
          account_holder: '',
          tax_info: {
            resident_number_encrypted: '',
            business_number: '',
            tax_type: 'individual'
          },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        console.log('📝 새 프로필 생성:', newProfile)
        
        const createdProfile = await dataService.entities.user_profiles.create(newProfile)
        console.log('✅ 새 프로필 생성 완료:', createdProfile)
      } else {
        console.log('⏭️ 이미 존재하는 프로필:', existingProfiles[0])
      }
    } catch (error) {
      console.error('❌ 사용자 프로필 생성 실패:', error)
      // 프로필 생성 실패해도 로그인은 계속 진행
    }
  }

  // Google OAuth 콜백 처리 (콜백 페이지에서 사용)
  static async handleGoogleCallback(code: string): Promise<GoogleUserInfo> {
    try {
      console.log('🔄 Google OAuth 콜백 처리:', code)

      // 인증 코드를 토큰으로 교환
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          code: code,
          grant_type: 'authorization_code',
          redirect_uri: this.config.redirectUri,
        }),
      })

      const tokens = await tokenResponse.json()
      console.log('🔑 토큰 받기 성공:', tokens)

      // 사용자 정보 가져오기
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: {
          'Authorization': `Bearer ${tokens.access_token}`,
        },
      })

      const userInfo: GoogleUserInfo = await userInfoResponse.json()
      console.log('👤 Google 사용자 정보:', userInfo)

      return userInfo
    } catch (error) {
      console.error('❌ Google OAuth 콜백 처리 실패:', error)
      throw error
    }
  }

  // Google 로그아웃
  static async logout(): Promise<void> {
    try {
      console.log('🚪 Google 로그아웃...')
      
      // Lumi SDK 로그아웃
      const { lumi } = await import('../lib/lumi')
      await lumi.auth.signOut()
      
      // 로그아웃 이벤트 발생
      window.dispatchEvent(new CustomEvent('googleLogout'))
      
      console.log('✅ Google 로그아웃 완료')
    } catch (error) {
      console.error('❌ Google 로그아웃 실패:', error)
    }
  }
}

export default RealGoogleAuthService
