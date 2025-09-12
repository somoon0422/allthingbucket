import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE'

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseKey)

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
      list: async () => {
        try {
          console.log('🔥 Supabase user_profiles.list 호출됨')
          
          // Supabase 연결 상태 확인
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }
          
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_profiles 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_profiles.list 결과:', data)
          return Array.isArray(data) ? data : []
        } catch (error) {
          console.error('❌ 사용자 프로필 목록 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', id)
            .limit(1)
          
          if (error) {
            console.error('user_profiles 조회 실패:', error)
            return null
          }
          
          return data && data.length > 0 ? data[0] : null
        } catch (error) {
          console.error('사용자 프로필 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 Supabase user_profiles.create 호출됨:', data)
          const { data: result, error } = await supabase
            .from('user_profiles')
            .insert([data])
            .select()
          
          if (error) {
            console.error('❌ user_profiles 생성 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase user_profiles.create 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 사용자 프로필 생성 실패:', error)
          return { success: false, message: '사용자 프로필 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 Supabase user_profiles.update 호출됨:', id, data)
          const { data: result, error } = await supabase
            .from('user_profiles')
            .update(data)
            .eq('id', id)
            .select()
          
          if (error) {
            console.error('❌ user_profiles 수정 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase user_profiles.update 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 사용자 프로필 수정 실패:', error)
          return { success: false, message: '사용자 프로필 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_profiles')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('user_profiles 삭제 실패:', error)
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          console.error('사용자 프로필 삭제 실패:', error)
          return { success: false, message: '사용자 프로필 삭제에 실패했습니다' }
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
          console.error('❌ 사용자 목록 조회 실패:', error)
          return []
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 생성에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id)
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, message: '사용자 삭제에 실패했습니다' }
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
          
          if (error) {
            console.error('❌ user_applications 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_applications.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 사용자 신청 목록 조회 실패:', error)
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
        return null
          }
          
          return data
        } catch (error) {
          return null
        }
      },
      create: async (data: any) => {
        try {
          // 현재 테이블 구조에 맞게 데이터 변환
          const transformedData = {
            user_id: data.user_id,
            campaign_id: data.experience_id, // experience_id를 campaign_id로 매핑
            status: data.status || 'pending',
            application_data: {
              name: data.name,
              email: data.email,
              phone: data.phone,
              address: data.address,
              detailed_address: data.detailed_address,
              instagram_handle: data.instagram_handle,
              blog_url: data.blog_url,
              youtube_channel: data.youtube_channel,
              application_reason: data.application_reason,
              experience_plan: data.experience_plan,
              platform_type: data.platform_type,
              submitted_by_role: data.submitted_by_role,
              submitted_by_admin_role: data.submitted_by_admin_role,
              debug_info: data.debug_info
            },
            applied_at: data.applied_at || new Date().toISOString()
          }
          
          console.log('🔥 user_applications.create 호출됨:', transformedData)
          
          const { data: result, error } = await supabase
            .from('user_applications')
            .insert([transformedData])
            .select()
            .single()
          
          if (error) {
            console.error('❌ user_applications 생성 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ user_applications 생성 성공:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ user_applications 생성 실패:', error)
          return { success: false, message: '사용자 신청 생성에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 신청 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_applications')
            .delete()
            .eq('id', id)
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, message: '사용자 신청 삭제에 실패했습니다' }
        }
      }
    },

    // 체험단 코드
    experience_codes: {
      list: async () => {
        try {
          console.log('🔥 Supabase experience_codes.list 호출됨')
          const { data, error } = await supabase
            .from('experience_codes')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ experience_codes 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase experience_codes.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 체험단 코드 목록 조회 실패:', error)
          return []
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('experience_codes')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '체험단 코드 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('experience_codes')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '체험단 코드 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('experience_codes')
            .delete()
            .eq('id', id)
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, message: '체험단 코드 삭제에 실패했습니다' }
        }
      }
    },

    // 관리자 알림
    admin_notifications: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('admin_notifications')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('admin_notifications 조회 실패:', error)
        return []
          }
          
          return data || []
        } catch (error) {
          console.error('관리자 알림 조회 실패:', error)
          return []
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '관리자 알림 생성에 실패했습니다' }
        }
      }
    },

    // 사용자 포인트
    user_points: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('user_points')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('user_points 조회 실패:', error)
        return []
          }
          
          return data || []
        } catch (error) {
          console.error('사용자 포인트 조회 실패:', error)
          return []
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 포인트 생성에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 포인트 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_points')
            .delete()
            .eq('id', id)
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, message: '사용자 포인트 삭제에 실패했습니다' }
        }
      }
    },

    // 포인트 내역
    points_history: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('points_history')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('points_history 조회 실패:', error)
        return []
          }
          
          return data || []
        } catch (error) {
          console.error('포인트 내역 조회 실패:', error)
          return []
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '포인트 내역 생성에 실패했습니다' }
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
          
          if (error) {
            console.error('❌ review_submissions 조회 실패:', error)
        return []
          }
          
          console.log('✅ Supabase review_submissions.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 리뷰 제출 목록 조회 실패:', error)
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
        return null
          }
          
          return data
        } catch (error) {
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '리뷰 제출 생성에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '리뷰 제출 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('review_submissions')
            .delete()
            .eq('id', id)
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, message: '리뷰 제출 삭제에 실패했습니다' }
        }
      }
    },

    // 사용자 코드
    user_codes: {
      list: async () => {
        try {
          console.log('🔥 Supabase user_codes.list 호출됨')
          const { data, error } = await supabase
            .from('user_codes')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ user_codes 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase user_codes.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 사용자 코드 목록 조회 실패:', error)
          return []
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_codes')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 코드 생성에 실패했습니다' }
        }
      }
    },

    // 인플루언서 프로필
    influencer_profiles: {
      list: async () => {
        try {
          console.log('🔥 Supabase influencer_profiles.list 호출됨')
          const { data, error } = await supabase
            .from('influencer_profiles')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ influencer_profiles 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase influencer_profiles.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 인플루언서 프로필 목록 조회 실패:', error)
          return []
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('influencer_profiles')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '인플루언서 프로필 생성에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '인플루언서 프로필 수정에 실패했습니다' }
        }
      }
    },

    // 사용자 리뷰
    user_reviews: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('user_reviews')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('user_reviews 조회 실패:', error)
        return []
          }
          
          return data || []
        } catch (error) {
          console.error('사용자 리뷰 조회 실패:', error)
          return []
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 리뷰 생성에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          return { success: false, message: '사용자 리뷰 업데이트에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('user_reviews')
            .delete()
            .eq('id', id)
          
          if (error) {
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          return { success: false, message: '사용자 리뷰 삭제에 실패했습니다' }
        }
      }
    },

    // 캠페인 (체험단)
    campaigns: {
      list: async () => {
        try {
          console.log('🔥 Supabase campaigns.list 호출됨')
          const { data, error } = await supabase
            .from('campaigns')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ campaigns 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase campaigns.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 캠페인 목록 조회 실패:', error)
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
            console.error('campaigns 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('캠페인 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 Supabase campaigns.create 호출됨:', data)
          const { data: result, error } = await supabase
            .from('campaigns')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ campaigns 생성 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase campaigns.create 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 캠페인 생성 실패:', error)
          return { success: false, message: '캠페인 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 Supabase campaigns.update 호출됨:', id, data)
          const { data: result, error } = await supabase
            .from('campaigns')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ campaigns 수정 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase campaigns.update 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 캠페인 수정 실패:', error)
          return { success: false, message: '캠페인 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          console.log('🔥 Supabase campaigns.delete 호출됨:', id)
          const { error } = await supabase
            .from('campaigns')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ campaigns 삭제 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase campaigns.delete 성공')
          return { success: true }
        } catch (error) {
          console.error('❌ 캠페인 삭제 실패:', error)
          return { success: false, message: '캠페인 삭제에 실패했습니다' }
        }
      }
    },

    // 관리자 사용자
    admin_users: {
      list: async () => {
        try {
          console.log('🔥 Supabase admin_users.list 호출됨')
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (error) {
            console.error('❌ admins 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase admins.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 관리자 사용자 목록 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', id)
            .single()
          
          if (error) {
            return null
          }
          
          return data
        } catch (error) {
          return null
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 Supabase admins.create 호출됨:', data)
          const { data: result, error } = await supabase
            .from('admins')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ admins 생성 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase admins.create 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 관리자 사용자 생성 실패:', error)
          return { success: false, message: '관리자 사용자 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 Supabase admins.update 호출됨:', id, data)
          const { data: result, error } = await supabase
            .from('admins')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ admins 수정 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase admins.update 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 관리자 사용자 수정 실패:', error)
          return { success: false, message: '관리자 사용자 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          console.log('🔥 Supabase admins.delete 호출됨:', id)
          const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ admins 삭제 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase admins.delete 성공')
          return { success: true }
        } catch (error) {
          console.error('❌ 관리자 사용자 삭제 실패:', error)
          return { success: false, message: '관리자 사용자 삭제에 실패했습니다' }
        }
      }
    },

    // 찜하기
    wishlist: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase wishlist.list 호출됨')
          let query = supabase
            .from('wishlist')
            .select('*')
            .order('created_at', { ascending: false })
          
          if (options?.filter) {
            Object.keys(options.filter).forEach(key => {
              query = query.eq(key, options.filter[key])
            })
          }
          
          const { data, error } = await query
          
          if (error) {
            console.error('❌ wishlist 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase wishlist.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 찜목록 조회 실패:', error)
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
            console.error('wishlist 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('찜목록 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          console.log('🔥 Supabase wishlist.create 호출됨:', data)
          const { data: result, error } = await supabase
            .from('wishlist')
            .insert([data])
            .select()
            .single()
          
          if (error) {
            console.error('❌ wishlist 생성 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase wishlist.create 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 찜목록 생성 실패:', error)
          return { success: false, message: '찜목록 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          console.log('🔥 Supabase wishlist.update 호출됨:', id, data)
          const { data: result, error } = await supabase
            .from('wishlist')
            .update(data)
            .eq('id', id)
            .select()
            .single()
          
          if (error) {
            console.error('❌ wishlist 수정 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase wishlist.update 결과:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 찜목록 수정 실패:', error)
          return { success: false, message: '찜목록 수정에 실패했습니다' }
        }
      },
      delete: async (id: string) => {
        try {
          console.log('🔥 Supabase wishlist.delete 호출됨:', id)
          const { error } = await supabase
            .from('wishlist')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ wishlist 삭제 실패:', error)
            return { success: false, message: error.message }
          }
          
          console.log('✅ Supabase wishlist.delete 성공')
          return { success: true }
        } catch (error) {
          console.error('❌ 찜목록 삭제 실패:', error)
          return { success: false, message: '찜목록 삭제에 실패했습니다' }
        }
      }
    },

    // 출금 요청
    withdrawal_requests: {
      list: async () => {
        try {
          console.log('🔥 Supabase withdrawal_requests.list 호출됨')
          const { data, error } = await supabase
            .from('withdrawal_requests')
            .select('*')
          
          if (error) {
            console.error('❌ withdrawal_requests 조회 실패:', error)
            return []
          }
          
          console.log('✅ Supabase withdrawal_requests.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ 출금 요청 목록 조회 실패:', error)
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
            console.error('withdrawal_requests 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('출금 요청 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('withdrawal_requests')
            .insert([data])
            .select()
          
          if (error) {
            console.error('❌ withdrawal_requests 생성 실패:', error)
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 출금 요청 생성 실패:', error)
          return { success: false, message: '출금 요청 생성에 실패했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('withdrawal_requests')
            .update(data)
            .eq('id', id)
            .select()
          
          if (error) {
            console.error('❌ withdrawal_requests 수정 실패:', error)
            return { success: false, message: error.message }
          }
          
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ 출금 요청 수정 실패:', error)
          return { success: false, message: '출금 요청 수정에 실패했습니다' }
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
            return { success: false, message: error.message }
          }
          
          return { success: true }
        } catch (error) {
          console.error('❌ 출금 요청 삭제 실패:', error)
          return { success: false, message: '출금 요청 삭제에 실패했습니다' }
        }
      }
    }
  },

  // Supabase 인증
  auth: {
    signIn: async (provider?: string) => {
      try {
        if (provider === 'google') {
          const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: `${window.location.origin}/auth/google/callback`
            }
          })
          
          if (error) {
            console.error('Google 로그인 실패:', error)
            return null
          }
          
          return data
        }
        
        return null
      } catch (error) {
        console.error('인증 실패:', error)
        return null
      }
    },
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword(credentials)
        
        if (error) {
          console.error('로그인 실패:', error)
          return { data: null, error }
        }
        
        return { data, error: null }
      } catch (error) {
        console.error('로그인 실패:', error)
        return { data: null, error }
      }
    },
    signUp: async (credentials: { email: string; password: string }) => {
      try {
        const { data, error } = await supabase.auth.signUp(credentials)
        
        if (error) {
          console.error('회원가입 실패:', error)
          return { data: null, error }
        }
        
        return { data, error: null }
      } catch (error) {
        console.error('회원가입 실패:', error)
        return { data: null, error }
      }
    },
    getSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('세션 조회 실패:', error)
          return { data: { session: null }, error }
        }
        
        return { data, error: null }
      } catch (error) {
        console.error('세션 조회 실패:', error)
        return { data: { session: null }, error }
      }
    },
    signInWithOAuth: async (options: { provider: string; options?: any }) => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth({
          provider: options.provider as any,
          options: options.options
        })
        
        if (error) {
          console.error('OAuth 로그인 실패:', error)
          return { data: null, error }
        }
        
        return { data, error: null }
      } catch (error) {
        console.error('OAuth 로그인 실패:', error)
        return { data: null, error }
      }
    },
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut()
        
        if (error) {
          console.error('로그아웃 실패:', error)
          return false
        }
        
        return true
      } catch (error) {
        console.error('로그아웃 실패:', error)
        return false
      }
    },
    user: null
  },

  // Supabase Storage
  storage: {
    upload: async (file: File, bucket: string, path: string) => {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(path, file)
        
        if (error) {
          console.error('파일 업로드 실패:', error)
        return null
        }
        
        return data
      } catch (error) {
        console.error('파일 업로드 실패:', error)
        return null
      }
    },
    getPublicUrl: (bucket: string, path: string) => {
      const { data } = supabase.storage
        .from(bucket)
        .getPublicUrl(path)
      
      return data.publicUrl
    }
  },

  // 출금 요청
  withdrawal_requests: {
    list: async () => {
      try {
        console.log('🔥 Supabase withdrawal_requests.list 호출됨')
        const { data, error } = await supabase
          .from('withdrawal_requests')
          .select('*')
        
        if (error) {
          console.error('❌ withdrawal_requests 조회 실패:', error)
          return []
        }
        
        console.log('✅ Supabase withdrawal_requests.list 결과:', data)
        return data || []
      } catch (error) {
        console.error('❌ 출금 요청 목록 조회 실패:', error)
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
          console.error('withdrawal_requests 조회 실패:', error)
          return null
        }
        
        return data
        } catch (error) {
        console.error('출금 요청 조회 실패:', error)
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
          return { success: false, message: error.message }
        }
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, message: '출금 요청 생성에 실패했습니다' }
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
          return { success: false, message: error.message }
        }
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, message: '출금 요청 수정에 실패했습니다' }
      }
    },
    delete: async (id: string) => {
      try {
        const { error } = await supabase
          .from('withdrawal_requests')
          .delete()
          .eq('id', id)
        
        if (error) {
          return { success: false, message: error.message }
        }
        
        return { success: true }
      } catch (error) {
        return { success: false, message: '출금 요청 삭제에 실패했습니다' }
      }
    }
  },

  // 포인트 히스토리
  points_history: {
    list: async () => {
      try {
        console.log('🔥 Supabase points_history.list 호출됨')
        const { data, error } = await supabase
          .from('points_history')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('❌ points_history 조회 실패:', error)
          return []
        }
        
        console.log('✅ Supabase points_history.list 결과:', data)
        return data || []
      } catch (error) {
        console.error('❌ 포인트 히스토리 목록 조회 실패:', error)
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
          console.error('points_history 조회 실패:', error)
          return null
        }
        
        return data
      } catch (error) {
        console.error('포인트 히스토리 조회 실패:', error)
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
          return { success: false, message: error.message }
        }
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, message: '포인트 히스토리 생성에 실패했습니다' }
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
          return { success: false, message: error.message }
        }
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, message: '포인트 히스토리 수정에 실패했습니다' }
      }
    },
    delete: async (id: string) => {
      try {
        const { error } = await supabase
          .from('points_history')
          .delete()
          .eq('id', id)
        
        if (error) {
          return { success: false, message: error.message }
        }
        
        return { success: true }
      } catch (error) {
        return { success: false, message: '포인트 히스토리 삭제에 실패했습니다' }
      }
    }
  },

  // 사용자 포인트
  user_points: {
    list: async () => {
      try {
        console.log('🔥 Supabase user_points.list 호출됨')
        const { data, error } = await supabase
          .from('user_points')
          .select('*')
          .order('created_at', { ascending: false })
        
        if (error) {
          console.error('❌ user_points 조회 실패:', error)
          return []
        }
        
        console.log('✅ Supabase user_points.list 결과:', data)
        return data || []
      } catch (error) {
        console.error('❌ 사용자 포인트 목록 조회 실패:', error)
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
          console.error('user_points 조회 실패:', error)
          return null
        }
        
        return data
      } catch (error) {
        console.error('사용자 포인트 조회 실패:', error)
        return null
      }
    },
    getByUserId: async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from('user_points')
          .select('*')
          .eq('user_id', userId)
          .single()
        
        if (error) {
          console.error('user_points 조회 실패:', error)
          return null
        }
        
        return data
      } catch (error) {
        console.error('사용자 포인트 조회 실패:', error)
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
          return { success: false, message: error.message }
        }
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, message: '사용자 포인트 생성에 실패했습니다' }
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
          return { success: false, message: error.message }
        }
        
        return { success: true, data: result }
      } catch (error) {
        return { success: false, message: '사용자 포인트 수정에 실패했습니다' }
      }
    },
    delete: async (id: string) => {
      try {
        const { error } = await supabase
          .from('user_points')
          .delete()
          .eq('id', id)
        
        if (error) {
          return { success: false, message: error.message }
        }
        
        return { success: true }
      } catch (error) {
        return { success: false, message: '사용자 포인트 삭제에 실패했습니다' }
      }
    }
  }
}

// Supabase 클라이언트 내보내기
export { supabase }