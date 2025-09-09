import { apiCall } from '../config/database'

export interface CampaignFilters {
  status?: string
  category?: string
  brand?: string
  limit?: number
  skip?: number
}

export interface CampaignData {
  title: string
  brand: string
  category: 'beauty' | 'food' | 'lifestyle' | 'tech' | 'fashion' | 'health'
  description: string
  product_value?: number
  points_reward?: number
  recruitment_count: number
  application_deadline: string
  experience_period: string
  requirements?: string[]
  image_url?: string
}

export class CampaignService {
  // 모든 체험단 캠페인 조회
  async getCampaigns(filters: CampaignFilters = {}): Promise<any[]> {
    try {
      const queryParams = new URLSearchParams()
      
      if (filters.status) {
        queryParams.append('status', filters.status)
      }
      
      if (filters.category) {
        queryParams.append('category', filters.category)
      }
      
      if (filters.brand) {
        queryParams.append('brand', filters.brand)
      }

      if (filters.limit) {
        queryParams.append('limit', filters.limit.toString())
      }

      if (filters.skip) {
        queryParams.append('skip', filters.skip.toString())
      }

      const queryString = queryParams.toString()
      const endpoint = `/campaigns${queryString ? `?${queryString}` : ''}`
      
      const result = await apiCall(endpoint)
      return result.campaigns || result || []
    } catch (error) {
      console.error('체험단 캠페인 조회 실패:', error)
      throw error
    }
  }

  // 특정 체험단 캠페인 조회
  async getCampaignById(campaignId: string): Promise<any> {
    try {
      const result = await apiCall(`/campaigns/${campaignId}`)
      return result
    } catch (error) {
      console.error('체험단 캠페인 조회 실패:', error)
      throw error
    }
  }

  // 새로운 체험단 캠페인 생성
  async createCampaign(campaignData: CampaignData): Promise<any> {
    try {
      const result = await apiCall('/campaigns', {
        method: 'POST',
        body: JSON.stringify(campaignData)
      })
      return result
    } catch (error) {
      console.error('체험단 캠페인 생성 실패:', error)
      throw error
    }
  }

  // 체험단 캠페인 수정
  async updateCampaign(campaignId: string, updateData: Partial<CampaignData>): Promise<any> {
    try {
      const result = await apiCall(`/campaigns/${campaignId}`, {
        method: 'PUT',
        body: JSON.stringify(updateData)
      })
      return result
    } catch (error) {
      console.error('체험단 캠페인 수정 실패:', error)
      throw error
    }
  }

  // 체험단 캠페인 삭제
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      await apiCall(`/campaigns/${campaignId}`, {
        method: 'DELETE'
      })
      return true
    } catch (error) {
      console.error('체험단 캠페인 삭제 실패:', error)
      throw error
    }
  }

  // 체험단 신청
  async applyToCampaign(campaignId: string, userId: string, applicationData: any): Promise<any> {
    try {
      const result = await apiCall('/applications', {
        method: 'POST',
        body: JSON.stringify({
          campaign_id: campaignId,
          user_id: userId,
          application_data: applicationData
        })
      })
      return result
    } catch (error) {
      console.error('체험단 신청 실패:', error)
      throw error
    }
  }

  // 사용자의 체험단 신청 목록 조회
  async getUserApplications(userId: string): Promise<any[]> {
    try {
      const result = await apiCall(`/users/${userId}/applications`)
      return result.applications || result || []
    } catch (error) {
      console.error('사용자 체험단 신청 목록 조회 실패:', error)
      throw error
    }
  }

  // 인기 체험단 캠페인 조회 (신청자 수 기준)
  async getPopularCampaigns(limit: number = 10): Promise<any[]> {
    try {
      const result = await apiCall(`/campaigns/popular?limit=${limit}`)
      return result.campaigns || result || []
    } catch (error) {
      console.error('인기 체험단 캠페인 조회 실패:', error)
      throw error
    }
  }

  // 카테고리별 체험단 캠페인 조회
  async getCampaignsByCategory(category: string, limit: number = 20): Promise<any[]> {
    try {
      const result = await apiCall(`/campaigns/category/${category}?limit=${limit}`)
      return result.campaigns || result || []
    } catch (error) {
      console.error('카테고리별 체험단 캠페인 조회 실패:', error)
      throw error
    }
  }
}

export const campaignService = new CampaignService()
