import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE'

// Supabase 클라이언트 초기화
export const supabase = createClient(supabaseUrl, supabaseKey)

// 인증 토큰 자동 설정 함수
const setAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      // 세션이 있으면 자동으로 토큰이 설정됨
      console.log('✅ Supabase 인증 토큰 자동 설정됨')
    }
  } catch (error) {
    console.warn('⚠️ 인증 토큰 설정 실패:', error)
  }
}

// 초기화 시 인증 토큰 설정
setAuthToken()

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
  // Supabase Auth 래퍼
  auth: {
    signInWithPassword: async (credentials: { email: string; password: string }) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword(credentials)
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        console.error('로그인 실패:', error)
        return { data: null, error }
      }
    },
    
    signUp: async (credentials: { email: string; password: string }) => {
      try {
        const { data, error } = await supabase.auth.signUp(credentials)
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        console.error('회원가입 실패:', error)
        return { data: null, error }
      }
    },
    
    signOut: async () => {
      try {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
        return { error: null }
      } catch (error) {
        console.error('로그아웃 실패:', error)
        return { error }
      }
    },
    
    getSession: async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        console.error('세션 조회 실패:', error)
        return { data: null, error }
      }
    },
    
    signInWithOAuth: async (options: { provider: 'google' | 'kakao' | 'github' | 'discord' | 'twitter' | 'facebook' | 'apple' | 'azure' | 'bitbucket' | 'gitlab' | 'linkedin' | 'notion' | 'twitch' | 'workos' | 'zoom'; options?: any }) => {
      try {
        const { data, error } = await supabase.auth.signInWithOAuth(options)
        if (error) throw error
        return { data, error: null }
      } catch (error) {
        console.error('OAuth 로그인 실패:', error)
        return { data: null, error }
      }
    }
  },
  
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
      list: async (options?: { select?: string; limit?: number }) => {
        try {
          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }

          const selectFields = options?.select || '*'
          let query = supabase.from('campaigns').select(selectFields)

          const limit = options?.limit || 20
          query = query.limit(limit)

          const { data, error } = await query.order('created_at', { ascending: false })

          if (error) {
            console.error('❌ campaigns 조회 실패:', error)
            return []
          }

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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
          console.log('🚀 campaigns 업데이트 시작:', { id, dataKeys: Object.keys(data) })
          
          // 🔥 이미지 데이터 분리 (큰 데이터는 별도 처리)
          const { main_images, detail_images, ...otherData } = data
          
          // 1단계: 기본 데이터 업데이트 (이미지 제외)
          const { data: result, error } = await supabase
            .from('campaigns')
            .update(otherData)
            .eq('id', id)
            .select()
            .maybeSingle()
          
          if (error) {
            console.error('❌ campaigns 기본 데이터 업데이트 실패:', error)
            return null
          }
          
          // 2단계: 이미지 데이터가 있는 경우 별도 업데이트
          if (main_images !== undefined || detail_images !== undefined) {
            console.log('🖼️ 이미지 데이터 별도 업데이트:', { 
              hasMainImages: main_images !== undefined,
              hasDetailImages: detail_images !== undefined,
              mainImagesLength: main_images?.length || 0,
              detailImagesLength: detail_images?.length || 0
            })
            
            const imageUpdateData: any = {}
            if (main_images !== undefined) imageUpdateData.main_images = main_images
            if (detail_images !== undefined) imageUpdateData.detail_images = detail_images
            
            const { error: imageError } = await supabase
              .from('campaigns')
              .update(imageUpdateData)
              .eq('id', id)
            
            if (imageError) {
              console.error('❌ campaigns 이미지 업데이트 실패:', imageError)
              // 이미지 업데이트 실패해도 기본 데이터는 업데이트되었으므로 계속 진행
            } else {
              console.log('✅ campaigns 이미지 업데이트 성공')
            }
          }
          
          console.log('✅ campaigns 업데이트 완료:', result)
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
          console.log('🔥 user_applications.create 호출:', data)
          const { data: result, error } = await supabase
            .from('user_applications')
            .insert([data])
            .select()
            .maybeSingle()
          
          if (error) {
            console.error('❌ user_applications 생성 실패:', error)
            return { success: false, error: error.message }
          }
          
          console.log('✅ user_applications 생성 성공:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ user_applications 생성 실패:', error)
          return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_applications')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()
          
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
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase review_submissions.list 호출됨', options)

          let query = supabase.from('review_submissions').select('*')

          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }

          const { data, error } = await query.order('updated_at', { ascending: false })

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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
          console.log('🔥 user_reviews.create 호출:', data)
          const { data: result, error } = await supabase
            .from('user_reviews')
            .insert([data])
            .select()
            .maybeSingle()

          if (error) {
            console.error('❌ user_reviews 생성 실패:', error)
            return { success: false, error: error.message }
          }

          console.log('✅ user_reviews 생성 성공:', result)
          return { success: true, data: result }
        } catch (error) {
          console.error('❌ user_reviews 생성 실패:', error)
          return { success: false, error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' }
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('user_reviews')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()
          
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

    // 관리자
    admins: {
      list: async () => {
        try {
          console.log('🔥 Supabase admins.list 호출됨')
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
          console.error('❌ admins 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('admins')
            .select('*')
            .eq('id', id)
            .maybeSingle()
          
          if (error) {
            console.error('❌ admins 조회 실패:', error)
            return null
          }
          
          return data
        } catch (error) {
          console.error('❌ admins 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('admins')
            .insert([data])
            .select()
            .maybeSingle()
          
          if (error) {
            console.error('❌ admins 생성 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ admins 생성 실패:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('admins')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()
          
          if (error) {
            console.error('❌ admins 업데이트 실패:', error)
            return null
          }
          
          return result
        } catch (error) {
          console.error('❌ admins 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('admins')
            .delete()
            .eq('id', id)
          
          if (error) {
            console.error('❌ admins 삭제 실패:', error)
            return false
          }
          
          return true
        } catch (error) {
          console.error('❌ admins 삭제 실패:', error)
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle() // single() 대신 maybeSingle() 사용
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
            .maybeSingle()
          
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
    },

    // 채팅방
    chat_rooms: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('chat_rooms')
            .select('*')
            .order('last_message_at', { ascending: false })

          if (error) throw error
          return data || []
        } catch (error) {
          console.error('채팅방 목록 조회 오류:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('chat_rooms')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (error) throw error
          return data
        } catch (error) {
          console.error('채팅방 조회 오류:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('chat_rooms')
            .insert(data)
            .select()
            .maybeSingle()

          if (error) throw error
          return result
        } catch (error) {
          console.error('채팅방 생성 오류:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('chat_rooms')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()

          if (error) throw error
          return result
        } catch (error) {
          console.error('채팅방 업데이트 오류:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('chat_rooms')
            .delete()
            .eq('id', id)

          if (error) throw error
          return true
        } catch (error) {
          console.error('채팅방 삭제 오류:', error)
          return false
        }
      }
    },

    // 채팅 대화 (JSON 형태로 메시지 저장)
    chat_conversations: {
      list: async (options?: { filter?: any }) => {
        try {
          let query = supabase
            .from('chat_conversations')
            .select('*')
            .order('last_message_at', { ascending: false })

          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }

          const { data, error } = await query

          if (error) throw error
          return data || []
        } catch (error) {
          console.error('채팅 대화 목록 조회 오류:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('chat_conversations')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (error) throw error
          return data
        } catch (error) {
          console.error('채팅 대화 조회 오류:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('chat_conversations')
            .insert(data)
            .select()
            .maybeSingle()

          if (error) throw error
          return result
        } catch (error) {
          console.error('채팅 대화 생성 오류:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('chat_conversations')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()

          if (error) throw error
          return result
        } catch (error) {
          console.error('채팅 대화 업데이트 오류:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('chat_conversations')
            .delete()
            .eq('id', id)

          if (error) throw error
          return true
        } catch (error) {
          console.error('채팅 대화 삭제 오류:', error)
          return false
        }
      }
    },

    // 관리자 채팅 알림
    admin_chat_notifications: {
      list: async () => {
        try {
          const { data, error } = await supabase
            .from('admin_chat_notifications')
            .select('*')
            .order('created_at', { ascending: false })

          if (error) throw error
          return data || []
        } catch (error) {
          console.error('관리자 채팅 알림 목록 조회 오류:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('admin_chat_notifications')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (error) throw error
          return data
        } catch (error) {
          console.error('관리자 채팅 알림 조회 오류:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('admin_chat_notifications')
            .insert(data)
            .select()
            .maybeSingle()

          if (error) throw error
          return result
        } catch (error) {
          console.error('관리자 채팅 알림 생성 오류:', error)
          return null
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('admin_chat_notifications')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()

          if (error) throw error
          return result
        } catch (error) {
          console.error('관리자 채팅 알림 업데이트 오류:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('admin_chat_notifications')
            .delete()
            .eq('id', id)

          if (error) throw error
          return true
        } catch (error) {
          console.error('관리자 채팅 알림 삭제 오류:', error)
          return false
        }
      }
    },

    // 캠페인 제품
    campaign_products: {
      list: async (options?: { filter?: any }) => {
        try {
          console.log('🔥 Supabase campaign_products.list 호출됨', options)

          if (!supabase) {
            console.error('❌ Supabase 클라이언트가 초기화되지 않았습니다')
            return []
          }

          let query = supabase.from('campaign_products').select('*')

          if (options?.filter) {
            Object.entries(options.filter).forEach(([key, value]) => {
              query = query.eq(key, value)
            })
          }

          const { data, error } = await query.order('created_at', { ascending: false })

          if (error) {
            console.error('❌ campaign_products 조회 실패:', error)
            return []
          }

          console.log('✅ Supabase campaign_products.list 결과:', data)
          return data || []
        } catch (error) {
          console.error('❌ campaign_products 조회 실패:', error)
          return []
        }
      },
      get: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('campaign_products')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (error) {
            console.error('❌ campaign_products 조회 실패:', error)
            return null
          }

          return data
        } catch (error) {
          console.error('❌ campaign_products 조회 실패:', error)
          return null
        }
      },
      create: async (data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('campaign_products')
            .insert([data])
            .select()
            .maybeSingle()

          if (error) {
            console.error('❌ campaign_products 생성 실패:', error)
            return null
          }

          return result
        } catch (error) {
          console.error('❌ campaign_products 생성 실패:', error)
          return null
        }
      },
      createMany: async (dataArray: any[]) => {
        try {
          const { data: result, error } = await supabase
            .from('campaign_products')
            .insert(dataArray)
            .select()

          if (error) {
            console.error('❌ campaign_products 대량 생성 실패:', error)
            return []
          }

          return result || []
        } catch (error) {
          console.error('❌ campaign_products 대량 생성 실패:', error)
          return []
        }
      },
      update: async (id: string, data: any) => {
        try {
          const { data: result, error } = await supabase
            .from('campaign_products')
            .update(data)
            .eq('id', id)
            .select()
            .maybeSingle()

          if (error) {
            console.error('❌ campaign_products 업데이트 실패:', error)
            return null
          }

          return result
        } catch (error) {
          console.error('❌ campaign_products 업데이트 실패:', error)
          return null
        }
      },
      delete: async (id: string) => {
        try {
          const { error } = await supabase
            .from('campaign_products')
            .delete()
            .eq('id', id)

          if (error) {
            console.error('❌ campaign_products 삭제 실패:', error)
            return false
          }

          return true
        } catch (error) {
          console.error('❌ campaign_products 삭제 실패:', error)
          return false
        }
      },
      deleteByCampaignId: async (campaignId: string) => {
        try {
          const { error } = await supabase
            .from('campaign_products')
            .delete()
            .eq('campaign_id', campaignId)

          if (error) {
            console.error('❌ campaign_products 삭제 실패:', error)
            return false
          }

          return true
        } catch (error) {
          console.error('❌ campaign_products 삭제 실패:', error)
          return false
        }
      }
    },

    // 온라인 상태 관리
    user_online_status: {
      async list() {
        try {
          const { data, error } = await supabase
            .from('user_online_status')
            .select('*')
            .order('last_seen', { ascending: false })
          if (error) throw error
          return data || []
        } catch (error) {
          console.error('온라인 상태 목록 조회 오류:', error)
          return []
        }
      },

      async getByUserId(userId: string) {
        try {
          const { data, error } = await supabase
            .from('user_online_status')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle() // single() 대신 maybeSingle() 사용
          if (error) throw error
          return data
        } catch (error) {
          console.error('사용자 온라인 상태 조회 오류:', error)
          return null
        }
      },

      async setOnline(userId: string, connectionId?: string) {
        try {
          const { data, error } = await supabase
            .from('user_online_status')
            .upsert({
              user_id: userId,
              is_online: true,
              last_seen: new Date().toISOString(),
              connection_id: connectionId,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
            .select()
            .single()

          if (error) {
            // RLS 정책 오류는 무시
            if (error.code === '42501' || error.message?.includes('row-level security policy')) {
              console.warn('⚠️ 온라인 상태 설정 오류 (RLS 정책으로 인한 무시):', error.message)
              return null
            }
            throw error
          }
          return data
        } catch (error) {
          console.warn('⚠️ 온라인 상태 설정 오류:', error)
          return null
        }
      },

      async setOffline(userId: string) {
        try {
          if (!userId) {
            console.warn('⚠️ userId가 없어서 오프라인 상태 설정을 건너뜀')
            return null
          }

          const { data, error } = await supabase
            .from('user_online_status')
            .upsert({
              user_id: userId,
              is_online: false,
              last_seen: new Date().toISOString(),
              connection_id: null,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            })
            .select()
            .single()

          if (error) {
            // RLS 정책 오류는 무시
            if (error.code === '42501' || error.message?.includes('row-level security policy')) {
              console.warn('⚠️ 오프라인 상태 설정 오류 (RLS 정책으로 인한 무시):', error.message)
              return null
            }
            throw error
          }
          return data
        } catch (error) {
          console.warn('⚠️ 오프라인 상태 설정 오류:', error)
          return null
        }
      },

      async updateLastSeen(userId: string) {
        try {
          const { data, error } = await supabase
            .from('user_online_status')
            .update({
              last_seen: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('user_id', userId)
            .select()
            .maybeSingle()
          
          if (error) {
            // RLS 정책 오류나 인증 오류는 무시 (사용자 경험에 영향 없음)
            if (error.message.includes('row-level security') || error.message.includes('RLS') || error.message.includes('401') || error.message.includes('Unauthorized')) {
              console.log('RLS 정책으로 인한 마지막 접속 시간 업데이트 건너뜀 (정상)')
            } else {
              console.warn('마지막 접속 시간 업데이트 실패:', error.message)
            }
            return null
          }
          
          return data
        } catch (error) {
          // 모든 오류를 무시 (사용자 경험에 영향 없음)
          console.log('마지막 접속 시간 업데이트 건너뜀 (정상):', error instanceof Error ? error.message : '알 수 없는 오류')
          return null
        }
      },

      async getOnlineUsers() {
        try {
          const { data, error } = await supabase
            .from('user_online_status')
            .select('*')
            .eq('is_online', true)
            .order('last_seen', { ascending: false })
          if (error) throw error
          return data || []
        } catch (error) {
          console.error('온라인 사용자 목록 조회 오류:', error)
          return []
        }
      }
    },

  // 커뮤니티 기능
  community: {
    // 게시물 목록 조회
    getPosts: async () => {
      try {
        const { data: posts, error: postsError } = await supabase
          .from('community_posts')
          .select('*')
          .order('created_at', { ascending: false })

        if (postsError) throw postsError

        // 각 게시물의 댓글 조회
        const postsWithComments = await Promise.all(
          (posts || []).map(async (post) => {
            const { data: comments } = await supabase
              .from('community_comments')
              .select('*')
              .eq('post_id', post.id)
              .order('created_at', { ascending: true })

            return {
              ...post,
              comments: comments || []
            }
          })
        )

        return { data: postsWithComments, error: null }
      } catch (error) {
        console.error('게시물 조회 실패:', error)
        return { data: null, error }
      }
    },

    // 게시물 작성
    createPost: async (post: { user_id: string; user_email: string; content: string; image_url?: string }) => {
      try {
        const { data, error } = await supabase
          .from('community_posts')
          .insert([post])
          .select()

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        console.error('게시물 작성 실패:', error)
        return { data: null, error }
      }
    },

    // 게시물 좋아요
    likePost: async (postId: string, userId: string, like: boolean) => {
      try {
        const { data: post, error: fetchError } = await supabase
          .from('community_posts')
          .select('likes, liked_by')
          .eq('id', postId)
          .single()

        if (fetchError) throw fetchError

        const likedBy = post.liked_by || []
        const newLikedBy = like
          ? [...likedBy, userId]
          : likedBy.filter((id: string) => id !== userId)

        const { error: updateError } = await supabase
          .from('community_posts')
          .update({
            likes: like ? (post.likes || 0) + 1 : Math.max((post.likes || 0) - 1, 0),
            liked_by: newLikedBy
          })
          .eq('id', postId)

        if (updateError) throw updateError
        return { error: null }
      } catch (error) {
        console.error('좋아요 실패:', error)
        return { error }
      }
    },

    // 댓글 작성
    addComment: async (comment: { post_id: string; user_id: string; user_email: string; content: string }) => {
      try {
        const { data, error } = await supabase
          .from('community_comments')
          .insert([comment])
          .select()

        if (error) throw error
        return { data, error: null }
      } catch (error) {
        console.error('댓글 작성 실패:', error)
        return { data: null, error }
      }
    },

    // 게시물 삭제
    deletePost: async (postId: string) => {
      try {
        const { error } = await supabase
          .from('community_posts')
          .delete()
          .eq('id', postId)

        if (error) throw error
        return { error: null }
      } catch (error) {
        console.error('게시물 삭제 실패:', error)
        return { error }
      }
    }
  }

  }
}
