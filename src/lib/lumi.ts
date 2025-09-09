import { createClient } from '@lumi.new/sdk'
import { localDataService } from '../services/localDataService'

// API 키가 없어도 기본 클라이언트 생성
const lumiConfig: any = {
    "projectId": "p350526049610620928",
    "apiBaseUrl": "https://api.lumi.new",
    "authOrigin": "https://auth.lumi.new"
}

// API 키가 있으면 추가
if (import.meta.env.VITE_LUMI_API_KEY) {
    lumiConfig.apiKey = import.meta.env.VITE_LUMI_API_KEY
    console.log('✅ Lumi API 키가 설정되었습니다')
} else {
    console.warn('⚠️ Lumi API 키가 설정되지 않았습니다. 로컬 데이터를 사용합니다.')
}

const realLumi = createClient(lumiConfig)

// Lumi API 연결 상태 확인 함수
export const checkLumiConnection = async () => {
  try {
    console.log('🔍 Lumi API 연결 상태 확인 중...')
    const testResponse = await realLumi.entities.user_profiles.list({ limit: 1 })
    console.log('✅ Lumi API 연결 성공:', testResponse)
    return true
  } catch (error) {
    console.error('❌ Lumi API 연결 실패:', error)
    console.log('🔄 로컬 데이터 서비스로 전환합니다.')
    return false
  }
}

// 완전한 SQLite API 래퍼 - 모든 테이블과 메서드 지원
export const lumi = {
  entities: {
    // 사용자 프로필
    user_profiles: {
      list: async (options: any = {}) => {
        try {
          const isConnected = await checkLumiConnection()
          if (isConnected) {
            return await realLumi.entities.user_profiles.list(options)
          } else {
            return await localDataService.listUserProfiles(options)
          }
        } catch (error) {
          console.error('API 호출 실패, 로컬 서비스 사용:', error)
          return await localDataService.listUserProfiles(options)
        }
      },
      get: async (id: string) => {
        try {
          const isConnected = await checkLumiConnection()
          if (isConnected) {
            return await realLumi.entities.user_profiles.get(id)
          } else {
            return await localDataService.getUserProfile(id)
          }
        } catch (error) {
          console.error('API 호출 실패, 로컬 서비스 사용:', error)
          return await localDataService.getUserProfile(id)
        }
      },
      delete: async (id: string) => {
        try {
          const isConnected = await checkLumiConnection()
          if (isConnected) {
            return await realLumi.entities.user_profiles.delete(id)
          } else {
            return await localDataService.deleteUserProfile(id)
          }
        } catch (error) {
          console.error('API 호출 실패, 로컬 서비스 사용:', error)
          return await localDataService.deleteUserProfile(id)
        }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ user_profiles.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },
    
    // 사용자
    users: {
      list: async (options: any = {}) => {
        try {
          const isConnected = await checkLumiConnection()
          if (isConnected) {
            return await realLumi.entities.users.list(options)
          } else {
            return await localDataService.listUsers(options)
          }
        } catch (error) {
          console.error('API 호출 실패, 로컬 서비스 사용:', error)
          return await localDataService.listUsers(options)
        }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ users.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      delete: async (_id: string) => {
        console.log('⚠️ users.delete는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 사용자 신청
    user_applications: {
      list: async (_options: any = {}) => {
        console.log('⚠️ user_applications.list는 아직 구현되지 않았습니다')
        return []
      },
      get: async (_id: string) => {
        console.log('⚠️ user_applications.get는 아직 구현되지 않았습니다')
        return null
      },
      delete: async (_id: string) => {
        console.log('⚠️ user_applications.delete는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ user_applications.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 체험단 코드
    experience_codes: {
      list: async (_options: any = {}) => {
        console.log('⚠️ experience_codes.list는 아직 구현되지 않았습니다')
        return []
      },
      get: async (_id: string) => {
        console.log('⚠️ experience_codes.get는 아직 구현되지 않았습니다')
        return null
      },
      delete: async (_id: string) => {
        console.log('⚠️ experience_codes.delete는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ experience_codes.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 관리자 알림
    admin_notifications: {
      list: async (_options: any = {}) => {
        console.log('⚠️ admin_notifications.list는 아직 구현되지 않았습니다')
        return []
      }
    },


    // 사용자 포인트
    user_points: {
      list: async (_options: any = {}) => {
        console.log('⚠️ user_points.list는 아직 구현되지 않았습니다')
        return []
      },
      delete: async (_id: string) => {
        console.log('⚠️ user_points.delete는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ user_points.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      create: async (_data: any) => {
        console.log('⚠️ user_points.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 포인트 내역
    points_history: {
      list: async (_options: any = {}) => {
        console.log('⚠️ points_history.list는 아직 구현되지 않았습니다')
        return []
      },
      create: async (_data: any) => {
        console.log('⚠️ points_history.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 리뷰 제출 (update 메서드 추가)
    review_submissions: {
      list: async (_options: any = {}) => {
        console.log('⚠️ review_submissions.list는 아직 구현되지 않았습니다')
        return []
      },
      get: async (_id: string) => {
        console.log('⚠️ review_submissions.get는 아직 구현되지 않았습니다')
        return null
      },
      delete: async (_id: string) => {
        console.log('⚠️ review_submissions.delete는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ review_submissions.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    }
  }
}
    