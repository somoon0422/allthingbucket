// API 엔드포인트 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api'

// 컬렉션 이름 상수
export const COLLECTIONS = {
  USERS: 'users',
  ADMINS: 'admins',
  EXPERIENCE_CAMPAIGNS: 'experience_campaigns',
  USER_APPLICATIONS: 'user_applications',
  USER_PROFILES: 'user_profiles',
  POINTS_HISTORY: 'points_history',
  REVIEW_SUBMISSIONS: 'review_submissions',
  NOTIFICATIONS: 'notifications'
} as const

// API 호출 헬퍼 함수
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      throw new Error(`API 호출 실패: ${response.status} ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('API 호출 에러:', error)
    throw error
  }
}

// 데이터베이스 연결 시뮬레이션 (클라이언트에서는 항상 성공)
export const connectToDatabase = async (): Promise<boolean> => {
  try {
    console.log('✅ API 서버 연결 준비 완료')
    return true
  } catch (error) {
    console.error('❌ API 서버 연결 실패:', error)
    return false
  }
}

export const getDatabase = () => {
  return { apiCall }
}

export const closeDatabase = async (): Promise<void> => {
  console.log('API 연결 종료')
}
