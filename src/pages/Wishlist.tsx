import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useWishlist } from '../hooks/useWishlist'
import { Heart, ArrowLeft, Calendar, Users, Star, Trash2, Eye } from 'lucide-react'
import ChatBot from '../components/ChatBot'

// 🔥 안전한 문자열 추출
function safeString(obj: any, field: string, fallback = ''): string {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    return typeof value === 'string' ? value : fallback
  } catch {
    return fallback
  }
}

// 🔥 안전한 숫자 추출
function safeNumber(obj: any, field: string, fallback = 0): number {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    const parsed = typeof value === 'number' ? value : parseFloat(value)
    return isNaN(parsed) ? fallback : parsed
  } catch {
    return fallback
  }
}

// 🔥 안전한 배열 추출
function safeArray(obj: any, field: string, fallback: any[] = []): any[] {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    return Array.isArray(value) ? value : fallback
  } catch {
    return fallback
  }
}

interface WishlistProps {
  embedded?: boolean
}

const Wishlist: React.FC<WishlistProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()
  const { getWishlistWithCampaigns, removeFromWishlist, loading } = useWishlist()

  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    if (!isAuthenticated && !embedded) {
      navigate('/login')
      return
    }

    loadWishlist()
  }, [isAuthenticated, navigate, embedded])

  const loadWishlist = async () => {
    const items = await getWishlistWithCampaigns()
    setWishlistItems(items)
  }

  const handleRemoveFromWishlist = async (campaignId: string) => {
    const success = await removeFromWishlist(campaignId)
    if (success) {
      setWishlistItems(prev => prev.filter(item => item.campaign_id !== campaignId))
    }
  }

  const handleViewCampaign = (campaignId: string) => {
    navigate(`/campaign/${campaignId}`)
  }

  // 검색 필터링
  const filteredWishlistItems = wishlistItems.filter(item => {
    if (!searchTerm) return true
    
    const campaign = item.campaign
    const searchLower = searchTerm.toLowerCase()
    
    return (
      safeString(campaign, 'campaign_name', '').toLowerCase().includes(searchLower) ||
      safeString(campaign, 'product_name', '').toLowerCase().includes(searchLower) ||
      safeString(campaign, 'brand_name', '').toLowerCase().includes(searchLower) ||
      safeString(campaign, 'description', '').toLowerCase().includes(searchLower)
    )
  })

  if (!isAuthenticated && !embedded) {
    return null
  }

  const content = (
    <div className={embedded ? '' : 'max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8'}>
        {/* 헤더 */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            {!embedded && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mr-4"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                뒤로가기
              </button>
            )}
            <div>
              <h1 className="text-3xl font-bold text-gray-900">찜 목록</h1>
              <p className="text-gray-600 mt-1">관심있는 체험단을 모아보세요</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Heart className="w-4 h-4 text-red-500" />
            <span>{wishlistItems.length}개</span>
          </div>
        </div>

        {/* 검색 바 */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="찜한 체험단 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* 로딩 상태 */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <span className="ml-3 text-gray-600">찜 목록을 불러오는 중...</span>
          </div>
        )}

        {/* 찜 목록이 비어있는 경우 */}
        {!loading && wishlistItems.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">찜한 체험단이 없습니다</h3>
            <p className="text-gray-600 mb-6">관심있는 체험단을 찜해보세요!</p>
            <button
              onClick={() => navigate('/experiences')}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              체험단 둘러보기
            </button>
          </div>
        )}

        {/* 검색 결과가 없는 경우 */}
        {!loading && wishlistItems.length > 0 && filteredWishlistItems.length === 0 && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">검색 결과가 없습니다</h3>
            <p className="text-gray-600">다른 검색어로 시도해보세요.</p>
          </div>
        )}

        {/* 찜 목록 그리드 */}
        {!loading && filteredWishlistItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWishlistItems.map((item) => {
              const campaign = item.campaign
              const campaignName = safeString(campaign, 'campaign_name', safeString(campaign, 'product_name', '제품명 없음'))
              const brandName = safeString(campaign, 'brand_name', '브랜드명 없음')
              const description = safeString(campaign, 'description', '설명 없음')
              const recruitmentCount = safeNumber(campaign, 'recruitment_count', safeNumber(campaign, 'max_participants', 10))
              const currentApplicants = safeNumber(campaign, 'current_applicants', 0)
              
              // 🔥 이미지 처리 - main_images 배열에서 첫 번째 이미지 가져오기
              const mainImages = safeArray(campaign, 'main_images')
              const fallbackImage = safeString(campaign, 'main_image_url') || safeString(campaign, 'image_url')
              const mainImage = mainImages.length > 0 ? mainImages[0] : fallbackImage
              
              // 🔥 종합적인 마감 상태 체크 (실제 DB 스키마 기준)
              const isExpiredCampaign = (() => {
                // 0. 상시 신청이 활성화된 경우 마감되지 않음
                if (campaign.is_always_open_application) {
                  return false
                }

                // 1. 캠페인 상태 체크 (실제 필드명)
                const campaignStatus = campaign.campaign_status || campaign.status || 'recruiting'
                if (campaignStatus === 'completed' || campaignStatus === 'cancelled' || campaignStatus === 'closed' || campaignStatus === 'inactive') {
                  return true
                }

                // 2. 신청 마감일 체크 (실제 필드명)
                const applicationEndDate = campaign.end_date ||
                                         campaign.review_deadline ||
                                         campaign.application_end_date ||
                                         campaign.application_end
                if (applicationEndDate) {
                  const endDate = new Date(applicationEndDate)
                  const today = new Date()
                  today.setHours(0, 0, 0, 0)
                  endDate.setHours(0, 0, 0, 0)
                  if (today > endDate) {
                    return true
                  }
                }

                // 3. 모집인원 체크 (실제 필드명)
                const maxParticipants = campaign.recruitment_count || campaign.max_participants
                const currentParticipants = campaign.current_applicants || campaign.current_participants || 0
                if (maxParticipants && currentParticipants >= maxParticipants) {
                  return true
                }

                return false
              })()
              
              const finalStatus = isExpiredCampaign ? 'closed' : (campaign.status || 'active')
              
              const getStatusColor = (status: string) => {
                switch (status) {
                  case 'active':
                  case 'recruiting':
                    return 'bg-green-100 text-green-800'
                  case 'closed':
                  case 'completed':
                  case 'ended':
                  case 'expired':
                    return 'bg-red-100 text-red-800'
                  case 'pending':
                    return 'bg-yellow-100 text-yellow-800'
                  default:
                    return 'bg-gray-100 text-gray-800'
                }
              }

              const getStatusLabel = (status: string) => {
                switch (status) {
                  case 'active':
                  case 'recruiting':
                    return '모집중'
                  case 'closed':
                  case 'completed':
                  case 'ended':
                  case 'expired':
                    return '마감'
                  case 'pending':
                    return '준비중'
                  default:
                    return '알 수 없음'
                }
              }

              return (
                <div key={item.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                  {/* 이미지 */}
                  <div className="aspect-video bg-gray-200 relative overflow-hidden">
                    <img
                      src={mainImage || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
                      alt={campaignName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
                      }}
                    />
                    
                    {/* 상태 배지 */}
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        campaign.is_always_open_application
                          ? 'bg-green-100 text-green-800'
                          : getStatusColor(finalStatus)
                      }`}>
                        {campaign.is_always_open_application ? '상시모집' : getStatusLabel(finalStatus)}
                      </span>
                    </div>
                    
                    {/* 찜하기 버튼 */}
                    <button
                      onClick={() => handleRemoveFromWishlist(item.campaign_id)}
                      className="absolute top-3 right-3 p-2 bg-white bg-opacity-80 rounded-full hover:bg-opacity-100 transition-all"
                    >
                      <Heart className="w-4 h-4 text-red-500 fill-current" />
                    </button>
                  </div>

                  {/* 내용 */}
                  <div className="p-4">
                    {/* 브랜드명 */}
                    <div className="flex items-center mb-2">
                      <Star className="w-4 h-4 text-yellow-500 mr-1" />
                      <span className="text-sm font-medium text-gray-600">{brandName}</span>
                    </div>

                    {/* 제품명 */}
                    <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                      {campaignName}
                    </h3>

                    {/* 설명 */}
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {description}
                    </p>

                    {/* 신청 정보 */}
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        <span>{currentApplicants} / {recruitmentCount}</span>
                      </div>
                      <div className="flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>{new Date(item.created_at).toLocaleDateString('ko-KR')}</span>
                      </div>
                    </div>

                    {/* 액션 버튼들 */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCampaign(item.campaign_id)}
                        className="flex-1 flex items-center justify-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        자세히 보기
                      </button>
                      <button
                        onClick={() => handleRemoveFromWishlist(item.campaign_id)}
                        className="px-4 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
                        title="찜 목록에서 제거"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* 페이지 하단 정보 */}
        {!loading && filteredWishlistItems.length > 0 && (
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>총 {filteredWishlistItems.length}개의 찜한 체험단이 있습니다</p>
          </div>
        )}
      </div>
  )

  if (embedded) {
    return content
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {content}

      {/* 채팅봇 */}
      <ChatBot />
    </div>
  )
}

export default Wishlist
