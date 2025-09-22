
import { useState, useCallback } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'
import { ultraSafeArray } from '../utils/arrayUtils'

interface PointsHistory {
  _id: string
  user_id: string
  points_amount: number
  points_type: string
  status: string
  payment_status?: string
  description: string
  created_at: string
  campaign_id?: string
  campaign_name?: string
}

interface UserPoints {
  _id: string
  user_id: string
  total_points: number
  available_points: number
  withdrawn_points: number
  pending_points: number
  experience_count?: number
}

// Entity를 UserPoints 타입으로 변환
function convertToUserPoints(entity: any): UserPoints {
  console.log('🔍 convertToUserPoints - 입력 엔티티:', entity)
  console.log('🔍 convertToUserPoints - 엔티티의 모든 키:', Object.keys(entity || {}))
  
  // 🔥 실제 DB 컬럼명에 맞게 매핑 (DB 구조: points, earned_points, used_points)
  return {
    _id: entity._id || entity.id || '',
    user_id: entity.user_id || '',
    total_points: entity.earned_points || 0,  // earned_points → total_points
    available_points: entity.points || 0,     // points → available_points  
    withdrawn_points: entity.used_points || 0, // used_points → withdrawn_points
    pending_points: entity.pending_points || 0,
    experience_count: entity.experience_count || 0
  }
}

// Entity를 PointsHistory 타입으로 변환
function convertToPointsHistory(entity: any): PointsHistory {
  return {
    _id: entity._id || entity.id || '',
    user_id: entity.user_id || '',
    points_amount: entity.points_amount || entity.points || 0,
    points_type: entity.points_type || entity.type || '',
    status: entity.status || 'pending',
    payment_status: entity.payment_status,
    description: entity.description || '',
    created_at: entity.created_at || new Date().toISOString(),
    campaign_id: entity.campaign_id,
    campaign_name: entity.campaign_name
  }
}

export const usePoints = () => {
  const [userPoints, setUserPoints] = useState<UserPoints | null>(null)
  const [pointsHistory, setPointsHistory] = useState<PointsHistory[]>([])
  const [loading, setLoading] = useState(false)

  const fetchUserPoints = useCallback(async (userId: string): Promise<UserPoints | null> => {
    try {
      setLoading(true)
      console.log('💰 사용자 포인트 조회:', userId)
      
      // user_points와 user_profiles를 병렬로 조회 (필터링 없이 전체 조회 후 클라이언트에서 필터링)
      const [pointsResponse, profileResponse] = await Promise.all([
        (dataService.entities as any).user_points.list(),
        (dataService.entities as any).user_profiles.list()
      ])
      
      // 🔍 실제 user_points 테이블 구조 확인
      if (pointsResponse && pointsResponse.length > 0) {
        console.log('🔍 실제 user_points 테이블 구조 (첫 번째 레코드):', pointsResponse[0])
        console.log('🔍 user_points 테이블의 모든 컬럼명:', Object.keys(pointsResponse[0]))
      } else {
        console.log('🔍 user_points 테이블이 비어있음 - 테이블 구조를 확인할 수 없음')
      }
      
      const pointsList = ultraSafeArray(pointsResponse)
      console.log('🔍 전체 user_points 데이터:', pointsList)
      
      const userPointsData = pointsList
        .filter((points: any) => points && points.user_id === userId)[0] || null
      
      console.log('🔍 필터링된 user_points 데이터:', userPointsData)
      
      const profileList = ultraSafeArray(profileResponse)
      console.log('🔍 전체 user_profiles 데이터:', profileList)
      
      const userProfileData = profileList
        .filter((profile: any) => profile && profile.user_id === userId)[0] || null
      
      console.log('🔍 필터링된 user_profiles 데이터:', userProfileData)
      
      if (userPointsData) {
        const convertedPoints = convertToUserPoints(userPointsData)
        
        // 🔥 포인트 히스토리에서 실제 포인트 금액 계산
        const pointsHistory = await (dataService.entities as any).points_history.list()
        console.log('🔍 전체 포인트 히스토리:', pointsHistory)
        
        const userPointsHistory = pointsHistory.filter((history: any) => 
          history.user_id === userId && 
          history.payment_status === 'completed'
        )
        
        console.log('🔍 사용자 포인트 히스토리 (지급완료):', userPointsHistory)
        
        const totalEarnedFromHistory = userPointsHistory.reduce((sum: number, history: any) => 
          sum + (history.points_amount || 0), 0
        )
        
        console.log('🔍 계산된 총 적립 포인트:', totalEarnedFromHistory)
        
        // 🔥 출금된 포인트 계산 (withdrawal 타입이거나 payment_status가 '출금완료'인 경우)
        const withdrawalHistory = pointsHistory.filter((history: any) => 
          history.user_id === userId && (
            history.points_type === 'withdrawn' || 
            history.payment_status === 'completed' && history.points_type === 'withdrawn'
          )
        )
        
        // 출금 히스토리는 음수로 저장되므로 절댓값으로 변환
        const totalWithdrawnFromHistory = withdrawalHistory.reduce((sum: number, history: any) => 
          sum + Math.abs(history.points_amount || 0), 0
        )
        
        console.log('🔍 포인트 히스토리에서 계산된 총 적립 포인트:', totalEarnedFromHistory)
        console.log('🔍 포인트 히스토리에서 계산된 총 출금 포인트:', totalWithdrawnFromHistory)
        console.log('🔍 포인트 히스토리 상세:', userPointsHistory)
        console.log('🔍 출금 히스토리 상세:', withdrawalHistory)
        
        // 🔥 디버깅을 위한 상세 로그
        withdrawalHistory.forEach((history: any, index: number) => {
          console.log(`🔍 출금 히스토리 ${index + 1}:`, {
            points_amount: history.points_amount,
            points_type: history.points_type,
            payment_status: history.payment_status,
            description: history.description,
            절댓값: Math.abs(history.points_amount || 0)
          })
        })
        
        // user_points 테이블에서 직접 포인트 가져오기 (실제 DB 컬럼명 사용)
        const currentTotalPoints = (userPointsData as any)?.total_points || (userPointsData as any)?.earned_points || 0  // 총 적립
        const currentAvailablePoints = (userPointsData as any)?.available_points || (userPointsData as any)?.points || 0  // 사용 가능
        const currentWithdrawnPoints = (userPointsData as any)?.withdrawn_points || (userPointsData as any)?.used_points || 0 // 출금됨
        
        console.log('🔍 user_points 테이블에서 가져온 포인트 (올바른 필드명):', {
          total_points: currentTotalPoints,
          available_points: currentAvailablePoints,
          withdrawn_points: currentWithdrawnPoints
        })
        
        // 🔥 user_points 테이블에 데이터가 있으면 우선 사용 (더 정확함)
        let finalTotalPoints, finalAvailablePoints, finalWithdrawnPoints
        
        if (currentAvailablePoints > 0 || currentTotalPoints > 0 || currentWithdrawnPoints > 0) {
          // user_points 테이블 데이터 사용 (더 정확함)
          finalTotalPoints = currentTotalPoints || totalEarnedFromHistory
          finalAvailablePoints = currentAvailablePoints
          finalWithdrawnPoints = currentWithdrawnPoints
          console.log('✅ user_points 테이블 데이터 사용:', { finalTotalPoints, finalAvailablePoints, finalWithdrawnPoints })
        } else {
          // 히스토리 기반 계산 사용
          finalTotalPoints = totalEarnedFromHistory
          finalAvailablePoints = Math.max(0, totalEarnedFromHistory - totalWithdrawnFromHistory)
          finalWithdrawnPoints = totalWithdrawnFromHistory
          console.log('✅ 히스토리 기반 계산 사용:', { finalTotalPoints, finalAvailablePoints, finalWithdrawnPoints })
        }
        
        const pointsWithExperience: UserPoints = { 
          ...convertedPoints, 
          total_points: finalTotalPoints,
          available_points: finalAvailablePoints,
          withdrawn_points: finalWithdrawnPoints,
          experience_count: (userProfileData as any)?.experience_count || userPointsHistory.length || 0
        }
        setUserPoints(pointsWithExperience)
        console.log('✅ 포인트 조회 완료:', pointsWithExperience.total_points, '체험단 참여:', pointsWithExperience.experience_count)
        return pointsWithExperience
      } else {
        // 포인트 데이터가 없으면 초기 생성
        console.log('🔄 초기 포인트 데이터 생성 시도:', userId)
        // 🔥 실제 컬럼명으로 초기 포인트 생성
        const createResult = await (dataService.entities as any).user_points.create({
          user_id: userId,
          points: 0, // 사용 가능한 포인트
          earned_points: 0, // 총 적립 포인트
          used_points: 0 // 출금된 포인트
        })
        
        console.log('🔍 user_points.create 결과:', createResult)
        
        if (createResult.success && createResult.data) {
          const convertedNewPoints = convertToUserPoints(createResult.data)
          // experience_count 추가
          const newPointsWithExperience: UserPoints = { 
            ...convertedNewPoints, 
            experience_count: (userProfileData as any)?.experience_count || 0 
          }
          setUserPoints(newPointsWithExperience)
          console.log('✅ 초기 포인트 생성 성공:', newPointsWithExperience)
          return newPointsWithExperience
        } else {
          console.error('❌ 초기 포인트 생성 실패:', createResult.message)
          // 생성 실패 시 기본값 반환
          const defaultPoints: UserPoints = {
            _id: '',
            user_id: userId,
            total_points: 0,
            available_points: 0,
            withdrawn_points: 0,
            pending_points: 0,
            experience_count: (userProfileData as any)?.experience_count || 0
          }
          setUserPoints(defaultPoints)
          return defaultPoints
        }
      }
    } catch (error) {
      console.error('❌ 포인트 조회 실패:', error)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPointsHistory = useCallback(async (userId: string) => {
    try {
      console.log('📜 포인트 히스토리 조회:', userId)
      
      const response = await (dataService.entities as any).points_history.list()
      
      console.log('🔍 전체 포인트 히스토리 응답:', response)
      
      const historyList = ultraSafeArray(response)
      const userHistory = historyList
        .filter((history: any) => history && history.user_id === userId)
        .map(convertToPointsHistory)
      
      console.log('🔍 필터링된 사용자 히스토리:', userHistory)
      console.log('🔍 각 히스토리 항목의 payment_status:', userHistory.map(h => ({ 
        id: h._id, 
        description: h.description, 
        payment_status: h.payment_status, 
        status: h.status,
        points_amount: h.points_amount 
      })))
      
      setPointsHistory(userHistory)
      console.log('✅ 히스토리 조회 완료:', userHistory.length, '건')
      
      return userHistory
    } catch (error) {
      console.error('❌ 히스토리 조회 실패:', error)
      setPointsHistory([])
      return []
    }
  }, [])

  const addPoints = useCallback(async (userId: string, points: number, description: string, type: string = 'earned') => {
    try {
      console.log('➕ 포인트 추가:', { userId, points, description, type })
      
      // 포인트 히스토리 추가
      await (dataService.entities as any).points_history.create({
        user_id: userId,
        points_amount: points,
        points_type: type,
        status: 'success',
        payment_status: '지급완료',
        description: description,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      
      // 사용자 포인트 업데이트 (실제 컬럼명 사용)
      const currentPoints = await fetchUserPoints(userId)
      if (currentPoints) {
        const updatedPoints = {
          points: (currentPoints.available_points || 0) + points, // 사용 가능한 포인트 증가
          earned_points: (currentPoints.total_points || 0) + points, // 총 적립 포인트 증가
          updated_at: new Date().toISOString()
        }
        
        await (dataService.entities as any).user_points.update(currentPoints._id, updatedPoints)
        setUserPoints(prev => prev ? { 
          ...prev, 
          total_points: (prev.total_points || 0) + points,
          available_points: (prev.available_points || 0) + points
        } : null)
      }
      
      console.log('✅ 포인트 추가 완료:', points)
      toast.success(`${points} 포인트가 적립되었습니다!`)
      
      return true
    } catch (error) {
      console.error('❌ 포인트 추가 실패:', error)
      toast.error('포인트 적립에 실패했습니다')
      return false
    }
  }, [fetchUserPoints])

  const deductPoints = useCallback(async (userId: string, points: number, description: string, type: string = 'withdrawn') => {
    try {
      console.log('➖ 포인트 차감:', { userId, points, description, type })
      
      const currentPoints = await fetchUserPoints(userId)
      if (!currentPoints || (currentPoints.available_points || currentPoints.total_points) < points) {
        toast.error('사용 가능한 포인트가 부족합니다')
        return false
      }
      
      // 포인트 히스토리 추가
      await (dataService.entities as any).points_history.create({
        user_id: userId,
        points_amount: -points,
        points_type: type,
        status: 'success',
        payment_status: '출금완료',
        description: description,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      })
      
      // 사용자 포인트 업데이트 (실제 컬럼명 사용)
      const updatedPoints = {
        points: (currentPoints.available_points || 0) - points, // 사용 가능한 포인트 감소
        used_points: (currentPoints.withdrawn_points || 0) + points, // 출금된 포인트 증가
        updated_at: new Date().toISOString()
      }
      
      await (dataService.entities as any).user_points.update(currentPoints._id, updatedPoints)
      setUserPoints(prev => prev ? { 
        ...prev, 
        available_points: (prev.available_points || 0) - points,
        withdrawn_points: (prev.withdrawn_points || 0) + points
      } : null)
      
      console.log('✅ 포인트 차감 완료:', points)
      toast.success(`${points} 포인트가 차감되었습니다`)
      
      return true
    } catch (error) {
      console.error('❌ 포인트 차감 실패:', error)
      toast.error('포인트 차감에 실패했습니다')
      return false
    }
  }, [fetchUserPoints])

  const refreshPointsData = useCallback(async (userId: string) => {
    try {
      console.log('🔄 포인트 데이터 새로고침:', userId)
      await Promise.all([
        fetchUserPoints(userId),
        fetchPointsHistory(userId)
      ])
      console.log('✅ 포인트 데이터 새로고침 완료')
    } catch (error) {
      console.error('❌ 포인트 데이터 새로고침 실패:', error)
    }
  }, [fetchUserPoints, fetchPointsHistory])

  return {
    userPoints,
    pointsHistory,
    loading,
    fetchUserPoints,
    fetchPointsHistory,
    addPoints,
    deductPoints,
    refreshPointsData,
    setUserPoints
  }
}
