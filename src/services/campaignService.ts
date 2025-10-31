import { supabase } from '../lib/dataService'

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
  // 승인 안내 메시지 커스터마이징
  approval_email_subject?: string
  approval_email_content?: string
  approval_sms_content?: string
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
      const endpoint = `/api/db/campaigns${queryString ? `?${queryString}` : ''}`
      
      const response = await fetch(endpoint)
      const result = await response.json()
      
      if (result.success) {
        return result.data || []
      } else {
        throw new Error(result.error || '캠페인 조회 실패')
      }
    } catch (error) {
      console.error('체험단 캠페인 조회 실패:', error)
      throw error
    }
  }

  // 특정 체험단 캠페인 조회
  async getCampaignById(campaignId: string): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('id', campaignId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('체험단 캠페인 조회 실패:', error)
      throw error
    }
  }

  // 새로운 체험단 캠페인 생성
  async createCampaign(campaignData: CampaignData): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .insert(campaignData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('체험단 캠페인 생성 실패:', error)
      throw error
    }
  }

  // 체험단 캠페인 수정
  async updateCampaign(campaignId: string, updateData: Partial<CampaignData>): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', campaignId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('체험단 캠페인 수정 실패:', error)
      throw error
    }
  }

  // 체험단 캠페인 삭제
  async deleteCampaign(campaignId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('campaigns')
        .delete()
        .eq('id', campaignId)

      if (error) throw error
      return true
    } catch (error) {
      console.error('체험단 캠페인 삭제 실패:', error)
      throw error
    }
  }

  // 체험단 신청
  async applyToCampaign(campaignId: string, userId: string, applicationData: any): Promise<any> {
    try {
      const { data, error } = await supabase
        .from('user_applications')
        .insert({
          campaign_id: campaignId,
          user_id: userId,
          application_data: applicationData
        })
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('체험단 신청 실패:', error)
      throw error
    }
  }

  // 사용자의 체험단 신청 목록 조회
  async getUserApplications(userId: string): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('user_applications')
        .select('*')
        .eq('user_id', userId)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('사용자 체험단 신청 목록 조회 실패:', error)
      throw error
    }
  }

  // 인기 체험단 캠페인 조회 (신청자 수 기준)
  async getPopularCampaigns(limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('current_participants', { ascending: false })
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('인기 체험단 캠페인 조회 실패:', error)
      throw error
    }
  }

  // 카테고리별 체험단 캠페인 조회
  async getCampaignsByCategory(category: string, limit: number = 20): Promise<any[]> {
    try {
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .eq('category', category)
        .limit(limit)

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('카테고리별 체험단 캠페인 조회 실패:', error)
      throw error
    }
  }
}

export const campaignService = new CampaignService()
