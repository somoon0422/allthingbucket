
import { useState, useCallback } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

// ✅ TSX 호환 안전한 배열 보장 함수
function ensureArray(value: any): any[] {
  if (value === null || value === undefined) {
    return []
  }
  
  if (Array.isArray(value)) {
    return value
  }
  
  if (typeof value === 'object' && value !== null) {
    const arrayKeys = ['list', 'data', 'items', 'results', 'users', 'profiles']
    
    for (const key of arrayKeys) {
      if (value[key] && Array.isArray(value[key])) {
        return value[key]
      }
    }
    
    return []
  }
  
  return []
}

// ✅ TSX 호환 안전한 필터링 함수
function safeFilter(array: any, predicate: (item: any) => boolean): any[] {
  const safeArray = ensureArray(array)
  
  if (safeArray.length === 0) {
    return []
  }
  
  try {
    const filtered = safeArray.filter((item: any) => {
      if (item === null || item === undefined) {
        return false
      }
      return predicate(item)
    })
    
    return filtered
  } catch (error) {
    console.error('필터링 실패:', error)
    return []
  }
}

export const useUserManagement = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAllUsers = useCallback(async () => {
    try {
      setLoading(true)
      console.log('👥 전체 사용자 조회 시작...')
      
      // 사용자 기본 정보 조회
      const usersResponse = await (dataService.entities as any).users.list()
      const usersList = ensureArray(usersResponse)
      
      // 사용자 프로필 정보 조회
      const profilesResponse = await (dataService.entities as any).user_profiles.list()
      const profilesList = ensureArray(profilesResponse)
      
      // 사용자와 프로필 매핑
      const enrichedUsers = usersList.map((user: any) => {
        if (!user || !user.id) return user
        
        const profile = safeFilter(profilesList, (p: any) => 
          p && p.user_id === user.id
        )[0] || null
        
        return {
          ...user,
          profile: profile
        }
      })
      
      setUsers(enrichedUsers)
      console.log('✅ 사용자 조회 완료:', enrichedUsers.length, '명')
      
      return enrichedUsers
    } catch (error) {
      console.error('❌ 사용자 조회 실패:', error)
      setUsers([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const updateUserRole = useCallback(async (userId: string, role: string) => {
    try {
      console.log('🔄 사용자 권한 변경:', { userId, role })
      
      await (dataService.entities as any).users.update(userId, {
        role: role,
        updated_at: new Date().toISOString()
      })
      
      // 로컬 상태 업데이트
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, role: role }
          : user
      ))
      
      console.log('✅ 권한 변경 완료:', role)
      toast.success('사용자 권한이 변경되었습니다')
      
      return true
    } catch (error) {
      console.error('❌ 권한 변경 실패:', error)
      toast.error('권한 변경에 실패했습니다')
      return false
    }
  }, [])

  const deleteUser = useCallback(async (userId: string) => {
    try {
      console.log('🗑️ 사용자 삭제 시작:', userId)
      
      // 관련 데이터도 함께 삭제
      try {
        // 사용자 프로필 삭제
        console.log('📋 사용자 프로필 삭제 중...')
        const profilesResponse = await (dataService.entities as any).user_profiles.list()
        const profiles = ensureArray(profilesResponse).filter((p: any) => p.user_id === userId)
        console.log('발견된 프로필 수:', profiles.length)
        
        for (const profile of profiles) {
          if (profile && profile.id) {
            console.log('프로필 삭제:', profile.id)
            await (dataService.entities as any).user_profiles.delete(profile.id)
          }
        }
        
        // 사용자 포인트 삭제
        const pointsResponse = await (dataService.entities as any).user_points.list()
        const points = ensureArray(pointsResponse).filter((p: any) => p.user_id === userId)
        
        for (const point of points) {
          if (point && point.id) {
            await (dataService.entities as any).user_points.delete(point.id)
          }
        }
      } catch (cleanupError) {
        console.warn('⚠️ 관련 데이터 삭제 중 오류:', cleanupError)
      }
      
      // 사용자 삭제
      await (dataService.entities as any).users.delete(userId)
      
      // 로컬 상태 업데이트
      setUsers(prev => prev.filter(user => user.id !== userId))
      
      console.log('✅ 사용자 삭제 완료')
      toast.success('사용자가 삭제되었습니다')
      
      return true
    } catch (error) {
      console.error('❌ 사용자 삭제 실패:', error)
      toast.error('사용자 삭제에 실패했습니다')
      return false
    }
  }, [])

  const searchUsers = useCallback((query: string) => {
    if (!query.trim()) {
      return users
    }
    
    const lowercaseQuery = query.toLowerCase()
    return safeFilter(users, (user: any) => {
      if (!user) return false
      
      const name = (user.name || '').toLowerCase()
      const email = (user.email || '').toLowerCase()
      const userCode = (user.user_code || '').toLowerCase()
      
      return name.includes(lowercaseQuery) || 
             email.includes(lowercaseQuery) || 
             userCode.includes(lowercaseQuery)
    })
  }, [users])

  return {
    users,
    loading,
    fetchAllUsers,
    updateUserRole,
    deleteUser,
    searchUsers
  }
}
