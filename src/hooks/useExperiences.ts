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
      // 사용자의 해당 캠페인 신청 내역 확인 (취소된 신청 제외)
      const userApplications = applications.filter((app: any) =>
        app.user_id === userId &&
        app.campaign_id === experienceId &&
        app.status !== 'cancelled'  // 취소된 신청은 제외
      )

      if (userApplications.length > 0) {
        console.log('🔍 유효한 신청 내역 발견:', userApplications[0])
        return {
          isDuplicate: true,
          existingApplication: userApplications[0]
        }
      }

      console.log('✅ 신청 가능 (중복 없음)')
      return {
        isDuplicate: false,
        existingApplication: null
      }
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

      // 먼저 기존 데이터 구조 확인
      console.log('🔍 데이터베이스 테이블 구조 확인 중...')
      
      let actualColumns: string[] = []
      try {
        const existingApps = await (dataService.entities as any).user_applications.list()
        if (existingApps && existingApps.length > 0) {
          actualColumns = Object.keys(existingApps[0])
          console.log('📋 실제 데이터베이스 컬럼들:', actualColumns)
          console.log('📋 기존 데이터 샘플:', existingApps[0])
        } else {
          console.log('⚠️ 기존 데이터가 없어서 컬럼 구조를 확인할 수 없습니다')
          throw new Error('기존 데이터가 없어서 테이블 구조를 확인할 수 없습니다')
        }
      } catch (error) {
        console.log('❌ 기존 데이터 조회 실패:', error)
        throw new Error('데이터베이스 테이블 구조를 확인할 수 없습니다')
      }

      // 🔥 additionalData에서 전달된 모든 데이터를 포함하여 신청 데이터 생성
      const applicationData: any = {}

      // 🔥 1. additionalData의 모든 필드를 먼저 복사 (name, email, phone, address 등)
      if (additionalData && typeof additionalData === 'object') {
        // application_data 필드가 존재하면 그 안에 저장
        if (actualColumns.includes('application_data')) {
          applicationData.application_data = { ...additionalData }
        } else {
          // application_data 필드가 없으면 루트 레벨에 모든 필드 저장
          Object.keys(additionalData).forEach(key => {
            if (actualColumns.includes(key)) {
              applicationData[key] = additionalData[key]
            }
          })
        }
      }

      // 🔥 2. user_id 확인 및 추가 (덮어쓰기)
      if (actualColumns.includes('user_id')) {
        applicationData.user_id = userId
      } else if (actualColumns.includes('userid')) {
        applicationData.userid = userId
      } else if (actualColumns.includes('user')) {
        applicationData.user = userId
      }

      // 🔥 3. experience_id/campaign_id 확인 및 추가 (덮어쓰기)
      if (actualColumns.includes('experience_id')) {
        applicationData.experience_id = experienceId
      } else if (actualColumns.includes('campaign_id')) {
        applicationData.campaign_id = experienceId
      } else if (actualColumns.includes('experienceid')) {
        applicationData.experienceid = experienceId
      }

      // 🔥 4. 날짜 필드 추가 (존재하는 경우에만)
      const currentDate = new Date().toISOString()
      if (actualColumns.includes('applied_at')) {
        applicationData.applied_at = currentDate
      }
      if (actualColumns.includes('created_at')) {
        applicationData.created_at = currentDate
      }
      if (actualColumns.includes('applied_date')) {
        applicationData.applied_date = currentDate
      }
      if (actualColumns.includes('application_date')) {
        applicationData.application_date = currentDate
      }

      console.log('🔍 최종 신청 데이터 (additionalData 포함):', applicationData)
      console.log('📦 원본 additionalData:', additionalData)

      // Supabase API로 신청 생성
      const result = await (dataService.entities as any).user_applications.create(applicationData)

      if (result && result.success) {
        // 🔥 신청 성공 후 캠페인의 current_participants 카운트 업데이트
        try {
          const experience = await (dataService.entities as any).campaigns.get(experienceId)
          if (experience) {
            const currentCount = experience.current_participants || 0
            await (dataService.entities as any).campaigns.update(experienceId, {
              current_participants: currentCount + 1
            })
            console.log('✅ 캠페인 신청자 수 업데이트 완료:', currentCount + 1)
          }
        } catch (updateError) {
          console.error('⚠️ 신청자 수 업데이트 실패 (신청은 완료됨):', updateError)
        }

        toast.success('체험단 신청이 완료되었습니다!')
        return { success: true, application: result.data }
      } else {
        const errorMessage = result?.error || '신청 생성에 실패했습니다'
        console.error('❌ 신청 실패:', result)
        throw new Error(errorMessage)
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

  // 신청 취소 함수 (상태를 cancelled로 변경)
  const cancelApplication = useCallback(async (applicationId: string) => {
    try {
      setLoading(true)
      console.log('🚫 신청 취소 시작:', applicationId)

      // 신청 상태를 'cancelled'로 변경
      const result = await (dataService.entities as any).user_applications.update(applicationId, {
        status: 'cancelled',
        reviewed_at: new Date().toISOString()
      })

      if (result) {
        console.log('✅ 신청 취소 완료')
        toast.success('신청이 취소되었습니다')
        return true
      } else {
        console.error('❌ 취소 실패')
        toast.error('신청 취소에 실패했습니다')
        return false
      }
    } catch (error) {
      console.error('❌ 신청 취소 실패:', error)
      toast.error('신청 취소에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // 취소된 신청 삭제 함수 (완전 삭제)
  const deleteApplication = useCallback(async (applicationId: string) => {
    try {
      setLoading(true)
      console.log('🗑️ 신청 삭제 시작:', applicationId)

      // 신청 내역을 완전히 삭제
      const deleteResult = await (dataService.entities as any).user_applications.delete(applicationId)
      console.log('🗑️ 삭제 결과:', deleteResult)

      if (deleteResult) {
        console.log('✅ 신청 내역 삭제 완료')
        toast.success('신청 내역이 삭제되었습니다')
        return true
      } else {
        console.error('❌ 삭제 실패: deleteResult가 false')
        toast.error('신청 삭제에 실패했습니다')
        return false
      }
    } catch (error) {
      console.error('❌ 신청 삭제 실패:', error)
      toast.error('신청 삭제에 실패했습니다')
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

      const applications = await (dataService.entities as any).user_applications.list()

      const userApplications = applications.filter((app: any) => app.user_id === userId)

      // 각 신청에 체험단 정보 추가
      const enrichedApplications = await Promise.all(
        userApplications.map(async (app: any) => {
          try {
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

  // 🔥 캠페인의 실제 신청자 수를 계산하여 업데이트
  const syncCampaignParticipants = useCallback(async (campaignId: string) => {
    try {
      const applications = await (dataService.entities as any).user_applications.list()
      const campaignApplications = applications.filter((app: any) =>
        app.campaign_id === campaignId
      )

      const actualCount = campaignApplications.length

      await (dataService.entities as any).campaigns.update(campaignId, {
        current_participants: actualCount
      })

      console.log(`✅ 캠페인 ${campaignId} 신청자 수 동기화 완료:`, actualCount)
      return actualCount
    } catch (error) {
      console.error('❌ 신청자 수 동기화 실패:', error)
      return null
    }
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
    cancelApplication,
    deleteApplication,
    syncCampaignParticipants
  }
}