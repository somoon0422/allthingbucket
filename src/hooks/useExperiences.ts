
import { useState, useCallback } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { ultraSafeArray, extractAllUserIds } from '../utils/arrayUtils'

export const useExperiences = () => {
  const [loading, setLoading] = useState(false)

  // 체험단 목록 조회
  const getExperiences = useCallback(async () => {
    try {
      setLoading(true)
      
      const response = await lumi.entities.experience_codes.list({
        sort: { created_at: -1 }
      })
      
      const experiences = ultraSafeArray(response)
      return experiences
    } catch (error) {
      console.error('체험단 목록 조회 실패:', error)
      toast.error('체험단 목록을 불러오는데 실패했습니다')
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  // 특정 체험단 조회
  const getCampaignById = useCallback(async (id: string) => {
    try {
      setLoading(true)
      
      const experience = await lumi.entities.experience_codes.get(id)
      return experience
    } catch (error) {
      console.error('체험단 상세 조회 실패:', error)
      toast.error('체험단 정보를 불러오는데 실패했습니다')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 중복 신청 체크 함수
  const checkDuplicateApplication = useCallback(async (experienceId: string, userId: string, originalUser?: any) => {
    try {
      // 모든 가능한 사용자 ID 수집
      const allUserIds = originalUser ? extractAllUserIds(originalUser) : [userId]
      
      for (const checkUserId of allUserIds) {
        if (!checkUserId) continue
        
        const existingApplications = await lumi.entities.user_applications.list({
          filter: { 
            user_id: checkUserId,
            experience_id: experienceId 
          }
        })
        
        const applications = ultraSafeArray(existingApplications)
        if (applications.length > 0) {
          return {
            isDuplicate: true,
            existingApplication: applications[0]
          }
        }
      }
      
      return { isDuplicate: false, existingApplication: null }
    } catch (error) {
      console.error('중복 체크 실패:', error)
      return { isDuplicate: false, existingApplication: null }
    }
  }, [])

  // 🔥 안전한 체험단 신청
  const applyForCampaign = useCallback(async (experienceId: string, userId: string, additionalData: any = {}) => {
    try {
      setLoading(true)

      if (!userId || typeof userId !== 'string') {
        throw new Error('사용자 ID가 없습니다')
      }

      // 🔥 중복 신청 체크
      const duplicateCheck = await checkDuplicateApplication(experienceId, userId, additionalData.original_user_object)
      
      if (duplicateCheck.isDuplicate) {
        toast.error('이미 신청하신 체험단입니다')
        return { success: false, reason: 'duplicate', existingApplication: duplicateCheck.existingApplication }
      }

      // 🔥 모집인원 체크
      try {
        const experience = await lumi.entities.experience_codes.get(experienceId)
        if (experience && experience.max_participants) {
          // 현재 승인된 신청자 수 확인
          const applicationsResponse = await lumi.entities.user_applications.list({
            filter: { 
              experience_id: experienceId,
              status: 'approved'
            }
          })
          const approvedApplications = (applicationsResponse as any).data || []
          
          if (approvedApplications.length >= experience.max_participants) {
            toast.error('모집인원이 마감되었습니다')
            return { success: false, reason: 'full' }
          }
        }
      } catch (error) {
        console.warn('모집인원 체크 실패:', error)
        // 모집인원 체크 실패해도 신청은 진행 (기존 체험단 호환성)
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
        debug_info: additionalData.debug_info || {},
        
        user_id_mapping: {
          primary_id: userId,
          all_user_ids: additionalData.original_user_object ? extractAllUserIds(additionalData.original_user_object) : [userId],
          original_user_object: additionalData.original_user_object || null
        }
      }

      const result = await lumi.entities.user_applications.create(applicationData)
      
      toast.success('체험단 신청이 완료되었습니다!')
      return { success: true, application: result }
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
      
      return { success: false, reason: 'error' }
    } finally {
      setLoading(false)
    }
  }, [checkDuplicateApplication])

  // 🔥 신청 취소 함수 (상태 변경으로 수정)
  const cancelApplication = useCallback(async (applicationId: string) => {
    try {
      setLoading(true)
      
      // 삭제 대신 상태를 'cancelled'로 변경
      await lumi.entities.user_applications.update(applicationId, {
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      toast.success('신청이 취소되었습니다')
      return true
    } catch (error) {
      console.error('신청 취소 실패:', error)
      toast.error('신청 취소에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }, [])

  // 🔥 완전히 안전한 사용자 신청 내역 조회
  const getUserApplications = useCallback(async (userId?: string, currentUser?: any, forceRefresh = false) => {
    try {
      setLoading(true)

      if (!userId && !currentUser) {
        return []
      }

      // 🔥 모든 가능한 검색 기준 수집
      const searchCriteria: Array<{field: string, value: string}> = []
      
      if (userId && typeof userId === 'string') {
        searchCriteria.push({ field: 'user_id', value: userId })
      }
      
      if (currentUser && typeof currentUser === 'object') {
        const userIds = extractAllUserIds(currentUser)
        userIds.forEach(id => {
          if (id && !searchCriteria.some(c => c.field === 'user_id' && c.value === id)) {
            searchCriteria.push({ field: 'user_id', value: id })
          }
        })
        
        if (currentUser.email && typeof currentUser.email === 'string') {
          searchCriteria.push({ field: 'email', value: currentUser.email })
        }
        
        if (currentUser.name && typeof currentUser.name === 'string') {
          searchCriteria.push({ field: 'name', value: currentUser.name })
        }
      }

      if (searchCriteria.length === 0) {
        return []
      }

      let allApplications: any[] = []

      // 🔥 각 기준으로 신청 내역 검색 (안전한 배열 처리)
      for (const criteria of searchCriteria) {
        try {
          const filter: any = {}
          filter[criteria.field] = criteria.value
          
          const response = await lumi.entities.user_applications.list({
            filter: filter,
            sort: { applied_at: -1, created_at: -1 },
            ...(forceRefresh && { _t: Date.now() }) // 캐시 무효화
          })

          const applications = ultraSafeArray(response)
          if (applications.length > 0) {
            allApplications = [...allApplications, ...applications]
          }
        } catch {
          // 개별 검색 실패시 계속 진행
          continue
        }
      }

      // 🔥 중복 제거 (안전한 ID 접근)
      const uniqueApplications = allApplications.reduce((acc: any[], current: any) => {
        try {
          if (!current || typeof current !== 'object') {
            return acc
          }

          const currentId = current._id || current.id
          if (!currentId) {
            return acc
          }

          const existingIndex = acc.findIndex(item => {
            try {
              const itemId = item._id || item.id
              return itemId === currentId
            } catch {
              return false
            }
          })
          
          if (existingIndex === -1) {
            acc.push(current)
          }
          
          return acc
        } catch {
          return acc
        }
      }, [])

      // 🔥 각 신청에 체험단 정보 추가 (안전한 처리)
      const enrichedApplications = await Promise.all(
        uniqueApplications.map(async (app: any) => {
          try {
            if (!app || typeof app !== 'object' || !app.experience_id) {
              return {
                ...app,
                experience: null,
                campaign: null
              }
            }

            const experience = await lumi.entities.experience_codes.get(app.experience_id)
            return {
              ...app,
              experience: experience || null,
              campaign: experience || null
            }
          } catch {
            return {
              ...app,
              experience: null,
              campaign: null
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

  return {
    loading,
    getExperiences,
    getCampaignById,
    applyForCampaign,
    getUserApplications,
    getStatusLabel,
    getStatusColor,
    checkDuplicateApplication,
    cancelApplication
  }
}
