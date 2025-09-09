// SQLite 데이터베이스 API를 사용하는 데이터 서비스
const API_BASE_URL = 'http://localhost:3001/api/db'

export interface UserProfile {
  _id: string
  user_id: string
  name: string
  email: string
  phone?: string
  address?: string
  created_at: string
  updated_at: string
}

export interface User {
  _id: string
  email: string
  name: string
  role: string
  created_at: string
}

class LocalDataService {
  // API 호출 헬퍼
  private async apiCall(endpoint: string, options: RequestInit = {}) {
    const url = `${API_BASE_URL}${endpoint}`
    console.log('🌐 SQLite API 호출:', url, options)
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        },
        ...options
      })
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      console.log('✅ SQLite API 응답:', data)
      return data
    } catch (error) {
      console.error('❌ SQLite API 호출 실패:', error)
      throw error
    }
  }

  // 사용자 프로필 목록 조회
  async listUserProfiles(options: { limit?: number; filter?: any } = {}) {
    console.log('📋 SQLite 사용자 프로필 목록 조회:', options)
    
    const params = new URLSearchParams()
    if (options.limit) params.append('limit', options.limit.toString())
    if (options.filter?.user_id) params.append('user_id', options.filter.user_id)
    
    const endpoint = `/user-profiles${params.toString() ? '?' + params.toString() : ''}`
    const response = await this.apiCall(endpoint)
    
    console.log('✅ 조회된 프로필 수:', response.data.length)
    return response.data
  }

  // 사용자 프로필 조회
  async getUserProfile(id: string) {
    console.log('👤 SQLite 사용자 프로필 조회:', id)
    
    const response = await this.apiCall(`/user-profiles/${id}`)
    console.log('✅ 프로필 조회 결과:', response.data ? '발견됨' : '없음')
    return response.data
  }

  // 사용자 프로필 삭제
  async deleteUserProfile(id: string) {
    console.log('🗑️ SQLite 사용자 프로필 삭제:', id)
    
    const response = await this.apiCall(`/user-profiles/${id}`, {
      method: 'DELETE'
    })
    
    console.log('✅ 삭제 완료:', response.message)
    return { success: true, message: response.message }
  }

  // 사용자 목록 조회
  async listUsers(options: { limit?: number } = {}) {
    console.log('👥 SQLite 사용자 목록 조회:', options)
    
    // 현재는 user_profiles를 사용
    const profiles = await this.listUserProfiles(options)
    const users = profiles.map((profile: any) => ({
      _id: profile._id,
      email: profile.email,
      name: profile.name,
      role: 'user',
      created_at: profile.created_at,
      updated_at: profile.updated_at
    }))
    
    console.log('✅ 조회된 사용자 수:', users.length)
    return users
  }

  // 연결 상태 확인
  async checkConnection() {
    console.log('🔍 SQLite 데이터베이스 연결 확인')
    
    try {
      const response = await this.apiCall('/status')
      console.log('✅ SQLite 데이터베이스 연결 상태:', response.data)
      return response.data.connected
    } catch (error) {
      console.error('❌ SQLite 데이터베이스 연결 실패:', error)
      return false
    }
  }
}

export const localDataService = new LocalDataService()
