import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE'

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey)

// Supabase 연결 상태 확인 함수
export const checkDatabaseConnection = async () => {
  try {
    console.log('🔍 Supabase 데이터베이스 연결 상태 확인 중...')
    const { error } = await supabase.from('campaigns').select('count').limit(1)
    
    if (error) {
      console.error('❌ Supabase 연결 실패:', error)
      return false
    }
    
    console.log('✅ Supabase 데이터베이스 연결 성공')
    return true
  } catch (error) {
    console.error('❌ Supabase 데이터베이스 연결 실패:', error)
    return false
  }
}

// Supabase 데이터 확인 함수
export const checkSupabaseData = async () => {
  try {
    console.log('🔍 Supabase 데이터 확인 중...')
    
    // 캠페인 데이터 확인
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
    
    if (campaignsError) {
      console.error('❌ 캠페인 데이터 조회 실패:', campaignsError)
    } else {
      console.log(`📊 캠페인 수: ${campaigns.length}`)
      if (campaigns.length > 0) {
        console.log('📋 캠페인 목록:')
        campaigns.forEach((campaign, index) => {
          console.log(`${index + 1}. ${campaign.title} (${campaign.category})`)
        })
      }
    }
    
    // 사용자 데이터 확인
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
    
    if (usersError) {
      console.error('❌ 사용자 데이터 조회 실패:', usersError)
    } else {
      console.log(`📊 사용자 수: ${users.length}`)
    }
    
    return { campaigns, users }
  } catch (error) {
    console.error('❌ Supabase 데이터 확인 실패:', error)
    return { campaigns: [], users: [] }
  }
}

// Supabase Client API 래퍼 - 모든 엔티티와 메서드 지원
export const dataService = {
  entities: {
    // 사용자 프로필
    user_profiles: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase user_profiles.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('user_profiles').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_profiles 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_profiles.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ user_profiles 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ user_profiles 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ user_profiles 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_profiles')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_profiles 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_profiles 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_profiles')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_profiles 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_profiles 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ user_profiles 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ user_profiles 삭제 실패:', error)
          return false
        }
      }
    },

    // 사용자 포인트
    user_points: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase user_points.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('user_points').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_points 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_points.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ user_points 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('user_points')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ user_points 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ user_points 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_points')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_points 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_points 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_points')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_points 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_points 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_points')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ user_points 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ user_points 삭제 실패:', error)
          return false
        }
      }
    },

    // 포인트 히스토리
    points_history: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase points_history.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('points_history').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ points_history 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase points_history.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ points_history 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('points_history')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ points_history 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ points_history 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('points_history')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ points_history 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ points_history 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('points_history')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ points_history 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ points_history 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('points_history')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ points_history 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ points_history 삭제 실패:', error)
          return false
        }
      }
    },

    // 캠페인
    campaigns: {
      list: async (options?: { select?: string }) => {
        try {
          console.log('🔥 Supabase campaigns.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('campaigns').select(options?.select || '*')
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ campaigns 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase campaigns.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ campaigns 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ campaigns 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ campaigns 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('campaigns')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ campaigns 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ campaigns 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('campaigns')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ campaigns 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ campaigns 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ campaigns 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ campaigns 삭제 실패:', error)
          return false
        }
      }
    },

    // 사용자 신청
    user_applications: {
      list: async () => {
        try {
          console.log('🔥 Supabase user_applications.list 호출됨')
          const { data, error } = await supabase
            .from('user_applications')
            .select('*')
            .order('updated_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_applications 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_applications.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ user_applications 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('user_applications')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ user_applications 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ user_applications 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_applications')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_applications 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_applications 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_applications')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_applications 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_applications 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_applications')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ user_applications 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ user_applications 삭제 실패:', error)
          return false
        }
      }
    },

    // 리뷰 제출
    review_submissions: {
      list: async () => {
        try {
          console.log('🔥 Supabase review_submissions.list 호출됨')
          const { data, error } = await supabase
            .from('review_submissions')
            .select('*')
            .order('updated_at', { ascending: false })
          
          if (error) {
            console.error('❌ review_submissions 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase review_submissions.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ review_submissions 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('review_submissions')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ review_submissions 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ review_submissions 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('review_submissions')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ review_submissions 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ review_submissions 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('review_submissions')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ review_submissions 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ review_submissions 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('review_submissions')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ review_submissions 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ review_submissions 삭제 실패:', error)
          return false
        }
      }
    },

    // 사용자 리뷰
    user_reviews: {
      list: async () => {
        try {
          console.log('🔥 Supabase user_reviews.list 호출됨')
          const { data, error } = await supabase
            .from('user_reviews')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_reviews 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_reviews.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ user_reviews 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('user_reviews')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ user_reviews 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ user_reviews 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_reviews')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_reviews 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_reviews 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_reviews')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_reviews 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_reviews 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_reviews')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ user_reviews 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ user_reviews 삭제 실패:', error)
          return false
        }
      }
    },

    // 관리자 알림
    admin_notifications: {
      list: async () => {
        try {
          console.log('🔥 Supabase admin_notifications.list 호출됨')
          const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ admin_notifications 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase admin_notifications.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ admin_notifications 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ admin_notifications 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ admin_notifications 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('admin_notifications')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ admin_notifications 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ admin_notifications 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('admin_notifications')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ admin_notifications 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ admin_notifications 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('admin_notifications')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ admin_notifications 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ admin_notifications 삭제 실패:', error)
          return false
        }
      }
    },

    // 사용자
    users: {
      list: async () => {
        try {
          console.log('🔥 Supabase users.list 호출됨')
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ users 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase users.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ users 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ users 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ users 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('users')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ users 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ users 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('users')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ users 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ users 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ users 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ users 삭제 실패:', error)
          return false
        }
      }
    },

    // 은행 계좌
    bank_accounts: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase bank_accounts.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('bank_accounts').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ bank_accounts 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase bank_accounts.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ bank_accounts 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('bank_accounts')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ bank_accounts 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ bank_accounts 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('bank_accounts')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ bank_accounts 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ bank_accounts 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('bank_accounts')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ bank_accounts 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ bank_accounts 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('bank_accounts')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ bank_accounts 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ bank_accounts 삭제 실패:', error)
          return false
        }
      }
    },

    // 출금 요청
    withdrawal_requests: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase withdrawal_requests.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('withdrawal_requests').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ withdrawal_requests 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase withdrawal_requests.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ withdrawal_requests 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ withdrawal_requests 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ withdrawal_requests 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('withdrawal_requests')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ withdrawal_requests 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ withdrawal_requests 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('withdrawal_requests')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ withdrawal_requests 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ withdrawal_requests 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('withdrawal_requests')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ withdrawal_requests 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ withdrawal_requests 삭제 실패:', error)
          return false
        }
      }
    },

    // 찜목록
    wishlist: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase wishlist.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('wishlist').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ wishlist 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase wishlist.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ wishlist 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('wishlist')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ wishlist 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ wishlist 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('wishlist')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ wishlist 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ wishlist 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('wishlist')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ wishlist 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ wishlist 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ wishlist 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ wishlist 삭제 실패:', error)
          return false
        }
      }
    },
    
    // 사용자 코드
    user_codes: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase user_codes.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('user_codes').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_codes 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_codes.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ user_codes 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('user_codes')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ user_codes 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ user_codes 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_codes')
            .insert(data)
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_codes 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_codes 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_codes')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_codes 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ user_codes 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_codes')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ user_codes 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ user_codes 삭제 실패:', error)
          return false
        }
      }
    },
    
    // 인플루언서 프로필
    influencer_profiles: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase influencer_profiles.list 호출됨', options)
          
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          let query = supabase.from('influencer_profiles').select('*')
          
          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }
          
          const { data, error } = await query.order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ influencer_profiles 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase influencer_profiles.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ influencer_profiles 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('influencer_profiles')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            console.error('❌ influencer_profiles 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ influencer_profiles 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('influencer_profiles')
            .insert(data)
            .select()
            .single()
          
          if (error) {
            console.error('❌ influencer_profiles 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ influencer_profiles 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('influencer_profiles')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ influencer_profiles 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ influencer_profiles 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('influencer_profiles')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ influencer_profiles 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ influencer_profiles 삭제 실패:', error)
          return false
        }
      }
    }
  }
}
