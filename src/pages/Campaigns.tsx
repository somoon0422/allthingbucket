
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCampaigns } from '../hooks/useCampaigns'
import {Calendar, Gift, Users, Clock, Star, MapPin, Search} from 'lucide-react'
import toast from 'react-hot-toast'

// 🔥 안전한 배열 보장 함수 (filter 오류 방지)
function ensureArray<T>(value: any): T[] {
  try {
    if (value === null || value === undefined) {
      return []
    }
    
    if (Array.isArray(value)) {
      return value
    }
    
    if (typeof value === 'object' && value !== null) {
      const arrayKeys = ['list', 'data', 'items', 'results', 'campaigns']
      
      for (const key of arrayKeys) {
        if (value[key] && Array.isArray(value[key])) {
          return value[key]
        }
      }
      
      return []
    }
    
    return []
  } catch (error) {
    console.error('배열 변환 실패:', error)
    return []
  }
}

// 🔥 안전한 문자열 추출
function safeString(obj: any, field: string, fallback = ''): string {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    return value ? String(value) : fallback
  } catch {
    return fallback
  }
}

// 🔥 안전한 숫자 추출
function safeNumber(obj: any, field: string, fallback = 0): number {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    const num = Number(value)
    return isNaN(num) ? fallback : num
  } catch {
    return fallback
  }
}

const Campaigns: React.FC = () => {
  const navigate = useNavigate()
  const { campaigns, loading, fetchCampaigns } = useCampaigns()
  
  const [filteredCampaigns, setFilteredCampaigns] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')

  useEffect(() => {
    const loadCampaigns = async () => {
      try {
        console.log('🔄 캠페인 목록 로딩 시작...')
        await fetchCampaigns()
      } catch (error) {
        console.error('❌ 캠페인 목록 로드 실패:', error)
        toast.error('캠페인 목록을 불러오는데 실패했습니다')
      }
    }

    loadCampaigns()
  }, [fetchCampaigns])

  useEffect(() => {
    // campaigns가 변경될 때마다 filteredCampaigns 업데이트
    const safeCampaigns = ensureArray(campaigns)
    setFilteredCampaigns(safeCampaigns)
  }, [campaigns])

  // 검색 및 필터링
  useEffect(() => {
    try {
      let filtered = ensureArray(campaigns)

      // 검색어 필터링
      if (searchTerm) {
        filtered = filtered.filter((campaign: any) => {
          if (!campaign || typeof campaign !== 'object') return false
          
          const title = campaign.title || campaign.experience_name || ''
          const brand = campaign.brand || ''
          const description = campaign.description || ''
          
          return title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
                 description.toLowerCase().includes(searchTerm.toLowerCase())
        })
      }

      // 카테고리 필터링
      if (categoryFilter !== 'all') {
        filtered = filtered.filter((campaign: any) => {
          if (!campaign || typeof campaign !== 'object') return false
          return campaign.category === categoryFilter
        })
      }

      setFilteredCampaigns(filtered)
    } catch (error) {
      console.error('❌ 필터링 실패:', error)
      setFilteredCampaigns([])
    }
  }, [campaigns, searchTerm, categoryFilter])

  const handleCampaignClick = (campaign: any) => {
    if (!campaign?._id && !campaign?.id) {
      toast.error('캠페인 정보가 올바르지 않습니다')
      return
    }
    
    const campaignId = campaign._id || campaign.id
    navigate(`/campaigns/${campaignId}`)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">캠페인 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">체험단 캠페인</h1>
          <p className="mt-2 text-gray-600">
            다양한 브랜드의 캠페인에 참여하고 포인트를 획득하세요
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 bg-white rounded-lg shadow-sm p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="캠페인 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
              />
            </div>
            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
              >
                <option value="all">전체 카테고리</option>
                <option value="beauty">뷰티</option>
                <option value="food">식품</option>
                <option value="lifestyle">라이프스타일</option>
                <option value="fashion">패션</option>
                <option value="tech">테크</option>
              </select>
            </div>
          </div>
        </div>

        {/* 캠페인 목록 */}
        {!filteredCampaigns || filteredCampaigns.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || categoryFilter !== 'all' ? '검색 결과가 없습니다' : '등록된 캠페인이 없습니다'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || categoryFilter !== 'all' 
                ? '다른 검색어나 카테고리를 시도해보세요' 
                : '곧 새로운 캠페인이 등록될 예정입니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ensureArray(filteredCampaigns).map((campaign) => {
              if (!campaign || typeof campaign !== 'object') {
                return null
              }

              return (
                <div
                  key={safeString(campaign, '_id') || safeString(campaign, 'id')}
                  onClick={() => handleCampaignClick(campaign)}
                  className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                >
                  {/* 이미지 */}
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    <img
                      src={safeString(campaign, 'image_url') || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
                      alt={safeString(campaign, 'title') || safeString(campaign, 'experience_name') || '캠페인 이미지'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
                      }}
                    />
                    {safeString(campaign, 'status') === 'active' && (
                      <div className="absolute top-3 left-3">
                        <span className="px-2 py-1 bg-green-500 text-white text-xs font-medium rounded-full">
                          모집중
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    {/* 브랜드 */}
                    {safeString(campaign, 'brand') && (
                      <div className="flex items-center mb-2">
                        <Star className="w-4 h-4 text-yellow-500 mr-1" />
                        <span className="text-sm font-medium text-gray-700">{safeString(campaign, 'brand')}</span>
                      </div>
                    )}

                    {/* 제목 */}
                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                      {safeString(campaign, 'title') || safeString(campaign, 'experience_name') || '캠페인 제목'}
                    </h3>

                    {/* 설명 */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {safeString(campaign, 'description') || '캠페인 설명이 없습니다.'}
                    </p>

                    {/* 정보 */}
                    <div className="space-y-2 mb-4">
                      {safeNumber(campaign, 'points_reward') > 0 && (
                        <div className="flex items-center text-sm text-yellow-600">
                          <Gift className="w-4 h-4 mr-2" />
                          <span className="font-medium">{safeNumber(campaign, 'points_reward').toLocaleString()}P 지급</span>
                        </div>
                      )}
                      
                      {safeString(campaign, 'experience_period') && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>체험 기간: {safeString(campaign, 'experience_period')}</span>
                        </div>
                      )}
                      
                      {safeString(campaign, 'recruitment_deadline') && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>마감: {new Date(safeString(campaign, 'recruitment_deadline')).toLocaleDateString('ko-KR')}</span>
                        </div>
                      )}
                      
                      {safeString(campaign, 'location') && (
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2" />
                          <span>{safeString(campaign, 'location')}</span>
                        </div>
                      )}
                    </div>

                    {/* 신청 버튼 */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCampaignClick(campaign)
                      }}
                      className="w-full py-2 px-4 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      자세히 보기
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 캠페인 참여 안내 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-vintage-900 mb-3">💡 캠페인 참여 방법</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm text-vintage-800">
            <div>
              <div className="font-medium mb-1">1. 캠페인 선택</div>
              <div>관심있는 브랜드의 캠페인을 선택하세요</div>
            </div>
            <div>
              <div className="font-medium mb-1">2. 신청서 작성</div>
              <div>신청 사유와 SNS 정보를 입력하세요</div>
            </div>
            <div>
              <div className="font-medium mb-1">3. 체험 & 리뷰</div>
              <div>승인 후 체험하고 리뷰를 작성하세요</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Campaigns
