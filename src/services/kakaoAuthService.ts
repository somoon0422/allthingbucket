export interface KakaoUserInfo {
  id: string
  email?: string
  name?: string
  profile_image?: string
  verified_email?: boolean
}

export class KakaoAuthService {
  private static readonly KAKAO_CLIENT_ID = import.meta.env.VITE_KAKAO_CLIENT_ID || 'your-kakao-client-id'
  
  // 카카오 OAuth URL 생성
  static getKakaoAuthUrl(): string {
    const redirectUri = `${window.location.origin}/auth/kakao/callback`
    
    console.log('카카오 OAuth 설정:', {
      client_id: this.KAKAO_CLIENT_ID,
      redirect_uri: redirectUri,
      current_origin: window.location.origin
    })
    
    const params = new URLSearchParams({
      client_id: this.KAKAO_CLIENT_ID,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'profile_nickname profile_image account_email'
    })
    
    return `https://kauth.kakao.com/oauth/authorize?${params.toString()}`
  }
  
  // 카카오 로그인 시작
  static startKakaoLogin(): void {
    const authUrl = this.getKakaoAuthUrl()
    console.log('카카오 로그인 URL:', authUrl)
    window.location.href = authUrl
  }
  
  // 카카오 사용자 정보 가져오기
  static async getUserInfo(accessToken: string): Promise<KakaoUserInfo> {
    try {
      const response = await fetch('https://kapi.kakao.com/v2/user/me', {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
        }
      })
      
      if (!response.ok) {
        throw new Error('카카오 사용자 정보 조회 실패')
      }
      
      const data = await response.json()
      console.log('카카오 사용자 정보:', data)
      
      return {
        id: data.id.toString(),
        email: data.kakao_account?.email,
        name: data.kakao_account?.profile?.nickname || data.properties?.nickname,
        profile_image: data.kakao_account?.profile?.profile_image_url || data.properties?.profile_image,
        verified_email: data.kakao_account?.email_verified
      }
    } catch (error) {
      console.error('카카오 사용자 정보 조회 실패:', error)
      throw error
    }
  }
  
  // 카카오 OAuth 로그인 처리
  static async handleKakaoCallback(code: string): Promise<{ success: boolean; user?: any; error?: string }> {
    try {
      console.log('카카오 OAuth 콜백 처리 시작:', code)
      
      // 1. 백엔드에서 토큰 교환
      const tokenResponse = await fetch('/api/auth/kakao/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      })
      
      if (!tokenResponse.ok) {
        throw new Error('토큰 교환 실패')
      }
      
      const { access_token } = await tokenResponse.json()
      console.log('토큰 교환 성공:', access_token)
      
      // 2. 사용자 정보 가져오기
      const userInfo = await this.getUserInfo(access_token)
      console.log('사용자 정보:', userInfo)
      
      // 3. 백엔드에서 Supabase 로그인 처리
      const loginResponse = await fetch('/api/auth/kakao/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userInfo),
      })
      
      if (!loginResponse.ok) {
        throw new Error('Supabase 로그인 처리 실패')
      }
      
      const loginResult = await loginResponse.json()
      console.log('Supabase 로그인 결과:', loginResult)
      
      return {
        success: true,
        user: loginResult.user
      }
    } catch (error) {
      console.error('카카오 OAuth 콜백 처리 실패:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }
    }
  }
}
