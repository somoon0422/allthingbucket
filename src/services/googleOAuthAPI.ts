// Google OAuth API 서비스
export class GoogleOAuthAPI {
  private static readonly API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'
  
  // Google OAuth 토큰 교환
  static async exchangeCodeForToken(code: string): Promise<{
    access_token: string
    refresh_token?: string
    expires_in: number
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/google/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code })
      })
      
      if (!response.ok) {
        throw new Error('토큰 교환에 실패했습니다')
      }
      
      return await response.json()
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
  
  // 백엔드에 사용자 정보 전송 및 로그인 처리
  static async loginWithGoogle(googleUserInfo: any): Promise<{
    user: any
    token: string
  }> {
    try {
      const response = await fetch(`${this.API_BASE_URL}/auth/google/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(googleUserInfo)
      })
      
      if (!response.ok) {
        throw new Error('Google 로그인에 실패했습니다')
      }
      
      return await response.json()
    } catch (error) {
      console.error('Google 로그인 API 호출 실패:', error)
      throw error
    }
  }
}
