import { useState, useCallback } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

export const useExperiences = () => {
  const [loading, setLoading] = useState(false)

  // 체험단 목록 조회 - Supabase API 사용
  const getExperiences = useCallback(async () => {
    try {
      setLoading(true)
      
      // 🔥 성능 최적화: 제한된 수량만 가져오기
      const campaigns = await (dataService.entities as any).campaigns.list({ limit: 20 })
      return campaigns || []
    } catch (error) {
      console.error('체험단 목록 조회 실패:', error)
      toast.error('체험단 목록을 불러오는데 실패했습니다')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 특정 체험단 조회 - Supabase API 사용
  const getCampaignById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      
      const campaign = await (dataService.entities as any).campaigns.get(id)
      return campaign
    } catch (error) {
      console.error('체험단 상세 조회 실패:', error)
      toast.error('체험단 정보를 불러오는데 실패했습니다')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 캠페인 코드로 체험단 조회
  const getCampaignByCode = useCallback(async (code: string) => {
    try {
      setLoading(true)
      
      const campaigns = await (dataService.entities as any).campaigns.list()
      const campaign = campaigns.find((c: any) => 
        c.campaign_code === code || c.code === code
      )
      
      return campaign || null
    } catch (error) {
      console.error('캠페인 코드 조회 실패:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 중복 신청 체크 함수
  const checkDuplicateApplication = useCallback(async (experienceId: string, userId: string) => {
    try {
      const applications = await (dataService.entities as any).user_applications.list()
      const userApplications = applications.filter((app: any) => 
        app.user_id === userId && app.campaign_id === experienceId
      )
      
      if (userApplications.length > 0) {
        return {
          isDuplicate: true,
          existingApplication: userApplications[0]
        }
      }
      
      return { isDuplicate: false, existingApplication: null }
    } catch (error) {
      console.error('중복 체크 실패:', error)
      return { isDuplicate: false, existingApplication: null }
    }
  }, [])

  // 체험단 신청
  const applyForCampaign = useCallback(async (experienceId: string, userId: string, additionalData: any = {}) => {
    try {
      setLoading(true)

      if (!userId || typeof userId !== 'string') {
        throw new Error('사용자 ID가 없습니다')
      }

      // 중복 신청 체크
      const duplicateCheck = await checkDuplicateApplication(experienceId, userId)
      
      if (duplicateCheck.isDuplicate) {
        toast.error('이미 신청하신 체험단입니다')
        return { success: false, reason: 'duplicate', existingApplication: duplicateCheck.existingApplication }
      }

      // 캠페인 상태 및 마감일 체크
      try {
        const experience = await (dataService.entities as any).campaigns.get(experienceId)
        
        if (experience) {
          // 1. 캠페인 상태 체크
          const campaignStatus = experience.status || 'active'
          if (campaignStatus === 'closed' || campaignStatus === 'inactive') {
            toast.error('마감된 캠페인입니다')
            return { success: false, reason: 'closed_status' }
          }
          
          // 2. 신청 마감일 체크
          const applicationEndDate = experience.application_end_date || 
                                   experience.application_end ||
                                   experience.end_date
          if (applicationEndDate) {
            const endDate = new Date(applicationEndDate)
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            endDate.setHours(0, 0, 0, 0)
            
            if (today > endDate) {
              toast.error('신청 마감일이 지났습니다')
              return { success: false, reason: 'deadline_passed' }
            }
          }
          
          // 3. 모집인원 체크
          if (experience.max_participants) {
            const applications = await (dataService.entities as any).user_applications.list()
            const approvedApplications = applications.filter((app: any) => 
              app.campaign_id === experienceId && app.status === 'approved'
            )
            
            if (approvedApplications.length >= experience.max_participants) {
              toast.error('모집인원이 마감되었습니다')
              return { success: false, reason: 'full' }
            }
          }
        }
      } catch (error) {
        console.warn('캠페인 상태 체크 실패:', error)
      }

      // 신청 데이터 생성
      const applicationData = {
        user_id: userId,
        experience_id: experienceId,
        status: 'pending',
        applied_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        
        name: additionalData.name || '',
        email: additionalData.email || '',
        phone: additionalData.phone || '',
        address: additionalData.address || '',
        detailed_address: additionalData.detailed_address || '',
        
        instagram_handle: additionalData.instagram_handle || '',
        blog_url: additionalData.blog_url || '',
        youtube_channel: additionalData.youtube_channel || '',
        
        application_reason: additionalData.application_reason || '',
        experience_plan: additionalData.experience_plan || '',
        additional_info: additionalData.additional_info || '',
        
        submitted_by_role: additionalData.submitted_by_role || '',
        submitted_by_admin_role: additionalData.submitted_by_admin_role || '',
        debug_info: additionalData.debug_info || {}
      }

      // Supabase API로 신청 생성
      const result = await (dataService.entities as any).user_applications.create(applicationData)
      
      if (result.success) {
        toast.success('체험단 신청이 완료되었습니다!')
        return { success: true, application: result.data }
      } else {
        throw new Error(result.message || '신청 생성에 실패했습니다')
      }
    } catch (error) {
      console.error('체험단 신청 실패:', error)
      
      if (error instanceof Error) {
        if (error.message.includes('사용자 ID')) {
          toast.error('사용자 인증에 문제가 있습니다. 다시 로그인해주세요.')
        } else if (error.message.includes('duplicate') || error.message.includes('중복')) {
          toast.error('이미 신청하신 체험단입니다')
        } else {
          toast.error(`체험단 신청에 실패했습니다: ${error.message}`)
        }
      } else {
        toast.error('체험단 신청에 실패했습니다')
      }
      
      return { success: false, reason: 'error', error: error }
    } finally {
      setLoading(false)
    }
  }, [checkDuplicateApplication])

  // 신청 취소 함수
  const cancelApplication = useCallback(async (applicationId: string) => {
    try {
      setLoading(true)
      
      const result = await (dataService.entities as any).user_applications.update(applicationId, {
        status: 'cancelled',
        reviewed_at: new Date().toISOString()
      })
      
      if (result.success) {
        toast.success('신청이 취소되었습니다')
        return true
      } else {
        throw new Error(result.message || '신청 취소에 실패했습니다')
      }
    } catch (error) {
      console.error('신청 취소 실패:', error)
      toast.error('신청 취소에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // 사용자 신청 내역 조회
  const getUserApplications = useCallback(async (userId?: string) => {
    try {
      setLoading(true)

      if (!userId) {
        return []
      }

      console.log('🔍 사용자 신청 내역 조회 시작:', userId)

      const applications = await (dataService.entities as any).user_applications.list()
      console.log('📋 전체 신청 내역:', applications?.length || 0, '개')
      
      const userApplications = applications.filter((app: any) => app.user_id === userId)
      console.log('👤 사용자 신청 내역:', userApplications.length, '개')

      // 각 신청에 체험단 정보 추가
      const enrichedApplications = await Promise.all(
        userApplications.map(async (app: any) => {
          try {
            console.log('🔍 신청 처리 중:', {
              app_id: app.id,
              campaign_id: app.campaign_id,
              user_id: app.user_id
            })

            if (!app.campaign_id) {
              console.log('⚠️ campaign_id가 없음:', app.id)
              return {
                ...app,
                experience: null,
                campaign: null,
                experience_name: '체험단 정보 없음'
              }
            }

            // campaigns 테이블에서 체험단 정보 조회 (필요한 필드만)
            const experience = await (dataService.entities as any).campaigns.get(app.campaign_id, {
              select: 'id,campaign_name,product_name,point_reward,rewards,reward_points,created_at'
            })
            console.log('📦 체험단 정보 조회 결과:', {
              campaign_id: app.campaign_id,
              found: !!experience,
              experience_name: experience?.campaign_name || experience?.product_name || '정보 없음',
              point_reward: experience?.point_reward,
              rewards: experience?.rewards,
              reward_points: experience?.reward_points,
              full_experience_data: experience
            })

            return {
              ...app,
              experience: experience || null,
              campaign: experience || null,
              experience_name: experience?.campaign_name || experience?.product_name || '체험단 정보 없음',
              experience_id: app.campaign_id, // experience_id도 설정
              created_at: app.applied_at || app.created_at // created_at 필드 추가
            }
          } catch (error) {
            console.error('❌ 체험단 정보 조회 실패:', app.id, error)
            return {
              ...app,
              experience: null,
              campaign: null,
              experience_name: '체험단 정보 없음',
              experience_id: app.campaign_id,
              created_at: app.applied_at || app.created_at // created_at 필드 추가
            }
          }
        })
      )

      console.log('✅ 신청 내역 처리 완료:', enrichedApplications.length, '개')
      return enrichedApplications
    } catch (error) {
      console.error('신청 내역 조회 실패:', error)
      toast.error('신청 내역을 불러오는데 실패했습니다')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 상태 라벨 반환
  const getStatusLabel = useCallback((status: string) => {
    const statusMap: { [key: string]: string } = {
      'pending': '승인 대기',
      'approved': '승인 완료',
      'rejected': '승인 거절',
      'cancelled': '신청 취소',
      'in_progress': '진행 중',
      'review_submitted': '리뷰 제출',
      'completed': '완료'
    }
    return statusMap[status] || '알 수 없음'
  }, [])

  // 상태 색상 반환
  const getStatusColor = useCallback((status: string) => {
    const colorMap: { [key: string]: string } = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800',
      'cancelled': 'bg-gray-100 text-gray-800',
      'in_progress': 'bg-blue-100 text-blue-800',
      'review_submitted': 'bg-purple-100 text-purple-800',
      'completed': 'bg-emerald-100 text-emerald-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }, [])

  return {
    loading,
    getExperiences,
    getCampaignById,
    getCampaignByCode,
    applyForCampaign,
    getUserApplications,
    getStatusLabel,
    getStatusColor,
    checkDuplicateApplication,
    cancelApplication
  }
}