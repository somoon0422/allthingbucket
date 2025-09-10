
import { useState, useCallback } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

interface Experience {
  _id: string
  code: string
  experience_name: string
  status: string
  max_participants: number
  current_participants: number
  reward_points: number
  created_by: string
  created_at: string
  expires_at: string
}

export const useAdmin = () => {
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [totalExperiences, setTotalExperiences] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchExperiences = useCallback(async () => {
    try {
      setLoading(true)
      const result = await dataService.entities.experience_codes.list()
      const expList = result?.list || []
      
      // Entity 타입을 Experience 타입으로 변환
      const typedExperiences: Experience[] = expList.map((entity: any) => ({
        _id: entity._id || entity.id || '',
        code: entity.code || '',
        experience_name: entity.experience_name || entity.title || '',
        status: entity.status || 'active',
        max_participants: entity.max_participants || entity.recruitment_count || 0,
        current_participants: entity.current_participants || entity.current_applicants || 0,
        reward_points: entity.reward_points || entity.points_reward || 0,
        created_by: entity.created_by || '',
        created_at: entity.created_at || new Date().toISOString(),
        expires_at: entity.expires_at || entity.end_date || new Date().toISOString()
      }))
      
      setExperiences(typedExperiences)
      setTotalExperiences(typedExperiences.length)
      
      console.log('✅ 체험단 데이터 로드 완료:', typedExperiences.length)
    } catch (error) {
      console.error('❌ 체험단 데이터 로드 실패:', error)
      // 에러가 발생해도 빈 배열로 설정
      setExperiences([])
      setTotalExperiences(0)
    } finally {
      setLoading(false)
    }
  }, [])

  const createExperience = async (expData: Partial<Experience>) => {
    try {
      const newExp = await dataService.entities.experience_codes.create({
        ...expData,
        created_at: new Date().toISOString(),
        status: 'active'
      })
      
      await fetchExperiences() // 목록 새로고침
      toast.success('체험단이 생성되었습니다')
      return newExp
    } catch (error) {
      console.error('❌ 체험단 생성 실패:', error)
      toast.error('체험단 생성에 실패했습니다')
      throw error
    }
  }

  const updateExperience = async (expId: string, updates: Partial<Experience>) => {
    try {
      const updatedExp = await dataService.entities.experience_codes.update(expId, updates)
      await fetchExperiences() // 목록 새로고침
      toast.success('체험단이 업데이트되었습니다')
      return updatedExp
    } catch (error) {
      console.error('❌ 체험단 업데이트 실패:', error)
      toast.error('체험단 업데이트에 실패했습니다')
      throw error
    }
  }

  const deleteExperience = async (expId: string) => {
    try {
      await dataService.entities.experience_codes.delete(expId)
      await fetchExperiences() // 목록 새로고침
      toast.success('체험단이 삭제되었습니다')
    } catch (error) {
      console.error('❌ 체험단 삭제 실패:', error)
      toast.error('체험단 삭제에 실패했습니다')
      throw error
    }
  }

  return {
    experiences,
    totalExperiences,
    loading,
    fetchExperiences,
    createExperience,
    updateExperience,
    deleteExperience
  }
}
