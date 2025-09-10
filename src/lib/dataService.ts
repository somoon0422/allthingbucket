// Supabase API 래퍼 서비스
const API_BASE_URL = import.meta.env.PROD 
  ? 'https://allthingbucket.com/api/db' 
  : 'http://localhost:3001/api/db'

// Supabase 연결 상태 확인 함수
export const checkDatabaseConnection = async () => {
  try {
    console.log('🔍 Supabase 데이터베이스 연결 상태 확인 중...')
    const response = await fetch(`${API_BASE_URL}/status`)
    const result = await response.json()
    const isConnected = result.success && result.data.connected
    console.log('✅ Supabase 데이터베이스 연결 상태:', isConnected)
    console.log('📊 데이터베이스 상태:', result.data)
    return isConnected
  } catch (error) {
    console.error('❌ Supabase 데이터베이스 연결 실패:', error)
    return false
  }
}

// Supabase API 래퍼 - 모든 엔티티와 메서드 지원
export const dataService = {
  entities: {
    // 사용자 프로필
    user_profiles: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.user_profiles.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/user-profiles`)
          const result = await response.json()
          console.log('✅ dataService.user_profiles.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 사용자 프로필 목록 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/user-profiles?user_id=${id}`)
          const result = await response.json()
          return result.success && result.data.length > 0 ? result.data[0] : null
        } catch (error) {
          console.error('사용자 프로필 조회 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/user-profiles/${id}`, {
            method: 'DELETE'
          })
          const result = await response.json()
          return result.success
        } catch (error) {
          console.error('사용자 프로필 삭제 실패:', error)
          return false
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 dataService.user_profiles.update 호출됨:', id, data)
          const response = await fetch(`${API_BASE_URL}/user-profiles/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          console.log('✅ dataService.user_profiles.update 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 사용자 프로필 수정 실패:', error)
          return { success: false, message: '사용자 프로필 수정에 실패했습니다' }
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 dataService.user_profiles.create 호출됨:', data)
          const response = await fetch(`${API_BASE_URL}/user-profiles`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          console.log('✅ dataService.user_profiles.create 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 사용자 프로필 생성 실패:', error)
          return { success: false, message: '사용자 프로필 생성에 실패했습니다' }
        }
      }
    },
    
    // 사용자
    users: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.users.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/users`)
          const result = await response.json()
          console.log('✅ dataService.users.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 사용자 목록 조회 실패:', error)
          return []
        }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ users.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      delete: async (_id: string) => {
        console.log('⚠️ users.delete는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      create: async (_data: any) => {
        console.log('⚠️ users.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 사용자 신청
    user_applications: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.user_applications.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/user-applications`)
          const result = await response.json()
          console.log('✅ dataService.user_applications.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 사용자 신청 목록 조회 실패:', error)
          return []
        }
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
      },
      create: async (_data: any) => {
        console.log('⚠️ user_applications.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 체험단 코드
    experience_codes: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.experience_codes.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/experience-codes`)
          const result = await response.json()
          console.log('✅ dataService.experience_codes.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 체험단 코드 목록 조회 실패:', error)
          return []
        }
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
      },
      create: async (_data: any) => {
        console.log('⚠️ experience_codes.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 관리자 알림
    admin_notifications: {
      list: async (_options: any = {}) => {
        console.log('⚠️ admin_notifications.list는 아직 구현되지 않았습니다')
        return []
      },
      create: async (_data: any) => {
        console.log('⚠️ admin_notifications.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
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
      },
      create: async (_data: any) => {
        console.log('⚠️ review_submissions.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 사용자 코드
    user_codes: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.user_codes.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/user-codes`)
          const result = await response.json()
          console.log('✅ dataService.user_codes.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 사용자 코드 목록 조회 실패:', error)
          return []
        }
      },
      create: async (_data: any) => {
        console.log('⚠️ user_codes.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 인플루언서 프로필
    influencer_profiles: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.influencer_profiles.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/influencer-profiles`)
          const result = await response.json()
          console.log('✅ dataService.influencer_profiles.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 인플루언서 프로필 목록 조회 실패:', error)
          return []
        }
      },
      create: async (_data: any) => {
        console.log('⚠️ influencer_profiles.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      },
      update: async (_id: string, _data: any) => {
        console.log('⚠️ influencer_profiles.update는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 사용자 리뷰
    user_reviews: {
      list: async (_options: any = {}) => {
        console.log('⚠️ user_reviews.list는 아직 구현되지 않았습니다')
        return []
      },
      create: async (_data: any) => {
        console.log('⚠️ user_reviews.create는 아직 구현되지 않았습니다')
        return { success: false, message: 'Not implemented' }
      }
    },

    // 캠페인
    campaigns: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.campaigns.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/campaigns`)
          const result = await response.json()
          console.log('✅ dataService.campaigns.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 캠페인 목록 조회 실패:', error)
          console.error('❌ 에러 상세:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/campaigns?campaign_id=${id}`)
          const result = await response.json()
          return result.success && result.data.length > 0 ? result.data[0] : null
        } catch (error) {
          console.error('캠페인 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 dataService.campaigns.create 호출됨:', data)
          const response = await fetch(`${API_BASE_URL}/campaigns`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          console.log('✅ dataService.campaigns.create 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 캠페인 생성 실패:', error)
          return { success: false, message: '캠페인 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 dataService.campaigns.update 호출됨:', id, data)
          const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          console.log('✅ dataService.campaigns.update 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 캠페인 수정 실패:', error)
          return { success: false, message: '캠페인 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          console.log('🔥 dataService.campaigns.delete 호출됨:', id)
          const response = await fetch(`${API_BASE_URL}/campaigns/${id}`, {
            method: 'DELETE'
          })
          const result = await response.json()
          console.log('✅ dataService.campaigns.delete 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 캠페인 삭제 실패:', error)
          return { success: false, message: '캠페인 삭제에 실패했습니다' }
        }
      }
    },

    // 관리자 사용자
    admin_users: {
      list: async (options: any = {}) => {
        try {
          console.log('🔥 dataService.admin_users.list 호출됨:', options)
          const response = await fetch(`${API_BASE_URL}/admin-users`)
          const result = await response.json()
          console.log('✅ dataService.admin_users.list 결과:', result)
          return result.success ? result.data : []
        } catch (error) {
          console.error('❌ 관리자 사용자 목록 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const response = await fetch(`${API_BASE_URL}/admin-users/${id}`)
          const result = await response.json()
          return result.success ? result.data : null
        } catch (error) {
          console.error('관리자 사용자 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 dataService.admin_users.create 호출됨:', data)
          const response = await fetch(`${API_BASE_URL}/admin-users`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          console.log('✅ dataService.admin_users.create 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 관리자 사용자 생성 실패:', error)
          return { success: false, message: '관리자 사용자 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 dataService.admin_users.update 호출됨:', id, data)
          const response = await fetch(`${API_BASE_URL}/admin-users/${id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
          })
          const result = await response.json()
          console.log('✅ dataService.admin_users.update 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 관리자 사용자 수정 실패:', error)
          return { success: false, message: '관리자 사용자 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          console.log('🔥 dataService.admin_users.delete 호출됨:', id)
          const response = await fetch(`${API_BASE_URL}/admin-users/${id}`, {
            method: 'DELETE'
          })
          const result = await response.json()
          console.log('✅ dataService.admin_users.delete 결과:', result)
          return result
        } catch (error) {
          console.error('❌ 관리자 사용자 삭제 실패:', error)
          return { success: false, message: '관리자 사용자 삭제에 실패했습니다' }
        }
      }
    }
  },

  // 인증
  auth: {
    signIn: async (_provider?: string) => {
      try {
        console.log('⚠️ SQLite 모드에서는 인증이 지원되지 않습니다')
        return null
      } catch (error) {
        console.error('인증 실패:', error)
        return null
      }
    },
    signOut: async () => {
      try {
        console.log('⚠️ SQLite 모드에서는 인증이 지원되지 않습니다')
        return null
      } catch (error) {
        console.error('로그아웃 실패:', error)
        return null
      }
    },
    user: null
  },

  // 도구
  tools: {
    upload: async (_file: File) => {
      try {
        console.log('⚠️ SQLite 모드에서는 파일 업로드가 지원되지 않습니다')
        return null
      } catch (error) {
        console.error('파일 업로드 실패:', error)
        return null
      }
    },
    file: {
      upload: async (_file: File) => {
        try {
          console.log('⚠️ MongoDB 모드에서는 파일 업로드가 지원되지 않습니다')
          return null
        } catch (error) {
          console.error('파일 업로드 실패:', error)
          return null
        }
      }
    }
  }
}
    