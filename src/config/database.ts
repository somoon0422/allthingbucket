// 중앙화된 Supabase 클라이언트 사용
import { supabase } from '../lib/dataService'

// 테이블 이름 상수
export const TABLES = {
  USERS: 'users',
  ADMIN_USERS: 'admin_users',
  CAMPAIGNS: 'campaigns',
  USER_APPLICATIONS: 'user_applications',
  USER_PROFILES: 'user_profiles',
  POINTS_HISTORY: 'points_history',
  REVIEW_SUBMISSIONS: 'review_submissions',
  ADMIN_NOTIFICATIONS: 'admin_notifications',
  USER_CODES: 'user_codes',
  INFLUENCER_PROFILES: 'influencer_profiles',
  USER_REVIEWS: 'user_reviews',
  WITHDRAWAL_REQUESTS: 'withdrawal_requests'
} as const

// Supabase API 호출 헬퍼 함수
export const supabaseCall = async (table: string, operation: string, data?: any) => {
  try {
    let result
    
    switch (operation) {
      case 'list':
        result = await supabase.from(table).select('*')
        break
      case 'get':
        result = await supabase.from(table).select('*').eq('id', data.id).single()
        break
      case 'create':
        result = await supabase.from(table).insert(data).select().single()
        break
      case 'update':
        result = await supabase.from(table).update(data).eq('id', data.id).select().single()
        break
      case 'delete':
        result = await supabase.from(table).delete().eq('id', data.id)
        break
      default:
        throw new Error(`지원하지 않는 작업: ${operation}`)
    }

    if (result.error) {
      throw new Error(result.error.message)
    }

    return { success: true, data: result.data }
  } catch (error) {
    console.error('Supabase API 호출 에러:', error)
    throw error
  }
}

// 데이터베이스 연결 확인
export const connectToDatabase = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase.from('campaigns').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase 연결 실패:', error)
      return false
    }
    
    console.log('✅ Supabase 연결 성공')
    return true
  } catch (error) {
    console.error('❌ Supabase 연결 실패:', error)
    return false
  }
}

export const getDatabase = () => {
  return { supabaseCall, supabase }
}

export const closeDatabase = async (): Promise<void> => {
  console.log('Supabase 연결 종료')
}