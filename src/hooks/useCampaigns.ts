import { useState, useEffect } from 'react'
import { campaignService, CampaignFilters } from '../services/campaignService'
import toast from 'react-hot-toast'

export interface Campaign {
  campaign_id: string
  title: string
  brand: string
  category: string
  description: string
  product_value?: number
  points_reward?: number
  recruitment_count: number
  current_applicants: number
  status: string
  application_deadline: string
  experience_period: string
  requirements?: string[]
  image_url?: string
  created_at: string
  updated_at: string
}

export const useCampaigns = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 모든 캠페인 조회
  const fetchCampaigns = async (filters: CampaignFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await campaignService.getCampaigns(filters)
      setCampaigns(data)
    } catch (err: any) {
      setError(err.message || '캠페인 조회에 실패했습니다')
      toast.error(err.message || '캠페인 조회에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 특정 캠페인 조회
  const fetchCampaignById = async (campaignId: string): Promise<Campaign | null> => {
    try {
      setLoading(true)
      setError(null)
      
      const campaign = await campaignService.getCampaignById(campaignId)
      return campaign
    } catch (err: any) {
      setError(err.message || '캠페인 조회에 실패했습니다')
      toast.error(err.message || '캠페인 조회에 실패했습니다')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 인기 캠페인 조회
  const fetchPopularCampaigns = async (limit: number = 10) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await campaignService.getPopularCampaigns(limit)
      setCampaigns(data)
    } catch (err: any) {
      setError(err.message || '인기 캠페인 조회에 실패했습니다')
      toast.error(err.message || '인기 캠페인 조회에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 카테고리별 캠페인 조회
  const fetchCampaignsByCategory = async (category: string, limit: number = 20) => {
    try {
      setLoading(true)
      setError(null)
      
      const data = await campaignService.getCampaignsByCategory(category, limit)
      setCampaigns(data)
    } catch (err: any) {
      setError(err.message || '카테고리별 캠페인 조회에 실패했습니다')
      toast.error(err.message || '카테고리별 캠페인 조회에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 캠페인 신청
  const applyToCampaign = async (campaignId: string, userId: string, applicationData: any) => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await campaignService.applyToCampaign(campaignId, userId, applicationData)
      toast.success('체험단 신청이 완료되었습니다!')
      return result
    } catch (err: any) {
      setError(err.message || '체험단 신청에 실패했습니다')
      toast.error(err.message || '체험단 신청에 실패했습니다')
      throw err
    } finally {
      setLoading(false)
    }
  }

  // 사용자 신청 목록 조회
  const fetchUserApplications = async (userId: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const applications = await campaignService.getUserApplications(userId)
      return applications
    } catch (err: any) {
      setError(err.message || '신청 목록 조회에 실패했습니다')
      toast.error(err.message || '신청 목록 조회에 실패했습니다')
      return []
    } finally {
      setLoading(false)
    }
  }

  // 컴포넌트 마운트시 기본 캠페인 로드
  useEffect(() => {
    fetchCampaigns({ limit: 20 })
  }, [])

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    fetchCampaignById,
    fetchPopularCampaigns,
    fetchCampaignsByCategory,
    applyToCampaign,
    fetchUserApplications
  }
}