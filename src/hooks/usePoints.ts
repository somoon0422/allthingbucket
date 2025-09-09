
import { useState, useCallback } from 'react'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { ultraSafeArray } from '../utils/arrayUtils'

interface PointsHistory {
  _id: string
  user_id: string
  points: number
  type: string
  description: string
  created_at: string
}

interface UserPoints {
  _id: string
  user_id: string
  total_points: number
  available_points: number
  withdrawn_points: number
  pending_points: number
}

// Entity를 UserPoints 타입으로 변환
function convertToUserPoints(entity: any): UserPoints {
  return {
    _id: entity._id || entity.id || '',
    user_id: entity.user_id || '',
    total_points: entity.total_points || 0,
    available_points: entity.available_points || 0,
    withdrawn_points: entity.withdrawn_points || 0,
    pending_points: entity.pending_points || 0
  }
}

// Entity를 PointsHistory 타입으로 변환
function convertToPointsHistory(entity: any): PointsHistory {
  return {
    _id: entity._id || entity.id || '',
    user_id: entity.user_id || '',
    points: entity.points || 0,
    type: entity.type || '',
    description: entity.description || '',
    created_at: entity.created_at || new Date().toISOString()
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
      
      const response = await lumi.entities.user_points.list({
        filter: { user_id: userId }
      })
      
      const pointsList = ultraSafeArray(response)
      const userPointsData = pointsList
        .filter((points: any) => points && points.user_id === userId)[0] || null
      
      if (userPointsData) {
        const convertedPoints = convertToUserPoints(userPointsData)
        setUserPoints(convertedPoints)
        console.log('✅ 포인트 조회 완료:', convertedPoints.total_points)
        return convertedPoints
      } else {
        // 포인트 데이터가 없으면 초기 생성
        const newUserPoints = await lumi.entities.user_points.create({
          user_id: userId,
          total_points: 0,
          available_points: 0,
          withdrawn_points: 0,
          pending_points: 0,
          created_at: new Date().toISOString()
        })
        const convertedNewPoints = convertToUserPoints(newUserPoints)
        setUserPoints(convertedNewPoints)
        console.log('✅ 초기 포인트 생성:', convertedNewPoints)
        return convertedNewPoints
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
      
      const response = await lumi.entities.points_history.list({
        filter: { user_id: userId },
        sort: { created_at: -1 }
      })
      
      const historyList = ultraSafeArray(response)
      const userHistory = historyList
        .filter((history: any) => history && history.user_id === userId)
        .map(convertToPointsHistory)
      
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
      await lumi.entities.points_history.create({
        user_id: userId,
        points: points,
        type: type,
        description: description,
        created_at: new Date().toISOString()
      })
      
      // 사용자 포인트 업데이트
      const currentPoints = await fetchUserPoints(userId)
      if (currentPoints) {
        const updatedPoints = {
          total_points: (currentPoints.total_points || 0) + points,
          available_points: (currentPoints.available_points || 0) + points,
          updated_at: new Date().toISOString()
        }
        
        await lumi.entities.user_points.update(currentPoints._id, updatedPoints)
        setUserPoints(prev => prev ? { ...prev, ...updatedPoints } : null)
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
      if (!currentPoints || currentPoints.available_points < points) {
        toast.error('사용 가능한 포인트가 부족합니다')
        return false
      }
      
      // 포인트 히스토리 추가
      await lumi.entities.points_history.create({
        user_id: userId,
        points: -points,
        type: type,
        description: description,
        created_at: new Date().toISOString()
      })
      
      // 사용자 포인트 업데이트
      const updatedPoints = {
        available_points: currentPoints.available_points - points,
        withdrawn_points: (currentPoints.withdrawn_points || 0) + points,
        updated_at: new Date().toISOString()
      }
      
      await lumi.entities.user_points.update(currentPoints._id, updatedPoints)
      setUserPoints(prev => prev ? { ...prev, ...updatedPoints } : null)
      
      console.log('✅ 포인트 차감 완료:', points)
      toast.success(`${points} 포인트가 차감되었습니다`)
      
      return true
    } catch (error) {
      console.error('❌ 포인트 차감 실패:', error)
      toast.error('포인트 차감에 실패했습니다')
      return false
    }
  }, [fetchUserPoints])

  return {
    userPoints,
    pointsHistory,
    loading,
    fetchUserPoints,
    fetchPointsHistory,
    addPoints,
    deductPoints
  }
}
