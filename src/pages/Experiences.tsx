import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dataService, checkSupabaseData } from '../lib/dataService'
import { setExperiencesOGTags } from '../utils/ogTags'
import { useAuth } from '../hooks/useAuth'
import { useWishlist } from '../hooks/useWishlist'
import {
  Gift, Users, Calendar, MapPin, Coins, Clock,
  Search, Grid, List, Heart, ArrowRight
} from 'lucide-react'
import ChatBot from '../components/ChatBot'

const Experiences: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { wishlist, toggleWishlist } = useWishlist()
  const [experiences, setExperiences] = useState<any[]>([])
  const [filteredExperiences, setFilteredExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState<'newest' | 'deadline' | 'points'>('newest')
  const [error, setError] = useState<string | null>(null)
  
  // useWishlist 훅을 try-catch로 감싸서 에러 처리
  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useWishlist()
  } catch (wishlistError) {
    console.error('useWishlist 훅 에러:', wishlistError)
    setError('찜하기 기능을 불러오는데 실패했습니다.')
  }
  
  

  // D-Day 계산 함수 - 실제 날짜 기반
  const getDeadlineDisplay = (experience: any) => {
    // 다양한 날짜 필드명 시도
    const deadline = experience.application_end_date || 
                    experience.application_deadline ||
                    experience.end_date ||
                    experience.deadline ||
                    experience.신청_마감일 ||
                    experience.application_end
    
    if (!deadline) {
      // 날짜가 없으면 기본값 대신 상태 기반으로 표시
      const status = experience.status || experience.campaign_status
      if (status === 'closed' || status === 'completed') return '마감됨'
      if (status === 'active' || status === 'recruiting') return '모집중'
      return '진행중'
    }
    
    try {
      const deadlineDate = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      deadlineDate.setHours(0, 0, 0, 0)
      
      const diffTime = deadlineDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) return '마감됨'
      if (diffDays === 0) return 'D-Day'
      if (diffDays === 1) return 'D-1'
      return `D-${diffDays}`
    } catch (error) {
      console.error('날짜 계산 오류:', error)
      return '진행중'
    }
  }

  // 체험단 데이터 로드
  const loadExperiences = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔥 체험단 로딩 시작...')
      
      // Supabase 데이터 확인
      await checkSupabaseData()
      
      const campaigns = await dataService.entities.campaigns.list()
      console.log('✅ Supabase 체험단 데이터 성공:', campaigns)
      
      // 🔥 디버깅: 각 캠페인의 필드 확인
      if (Array.isArray(campaigns) && campaigns.length > 0) {
        const firstCampaign = campaigns[0] as any
        console.log('🔍 첫 번째 캠페인 상세 데이터:', {
          campaign: firstCampaign,
          campaign_name: firstCampaign?.campaign_name,
          status: firstCampaign?.status,
          main_images: firstCampaign?.main_images,
          detail_images: firstCampaign?.detail_images,
          allFields: Object.keys(firstCampaign || {})
        })
      }
      
      const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
      setExperiences(safeCampaigns)
      setFilteredExperiences(safeCampaigns)
    } catch (error) {
      console.error('체험단 로드 실패:', error)
      setError(`체험단 데이터를 불러오는데 실패했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
      setExperiences([])
      setFilteredExperiences([])
    } finally {
      setLoading(false)
    }
  }

  // 필터링 및 정렬
  useEffect(() => {
    let filtered = [...experiences]

    // 검색어 필터링
    if (searchTerm) {
      filtered = filtered.filter(exp => 
        (exp.campaign_name || exp.title || exp.experience_name || exp.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.description || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (exp.brand || exp.brand_name || '').toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 카테고리 필터링
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(exp => exp.category === selectedCategory)
    }

    // 정렬
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at || b.createdAt || 0).getTime() - new Date(a.created_at || a.createdAt || 0).getTime()
        case 'deadline':
          const aDeadline = new Date(a.application_deadline || a.application_end_date || 0).getTime()
          const bDeadline = new Date(b.application_deadline || b.application_end_date || 0).getTime()
          return aDeadline - bDeadline
        case 'points':
          return (b.reward_points || 0) - (a.reward_points || 0)
        default:
          return 0
      }
    })

    setFilteredExperiences(filtered)
  }, [experiences, searchTerm, selectedCategory, sortBy])

  useEffect(() => {
    // 🔥 체험단 목록 페이지 OG 태그 설정 (카카오톡 링크 공유용)
    setExperiencesOGTags()
    
    loadExperiences()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">체험단 목록을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-red-600 text-2xl">⚠️</span>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
          >
            페이지 새로고침
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
              🎁 체험단 목록
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 px-4">
              다양한 브랜드의 특별한 체험단에 참여해보세요
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-6">
          <div className="flex flex-col gap-4">
            {/* 검색 */}
            <div className="w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
                <input
                  type="text"
                  placeholder="체험단 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
                />
              </div>
            </div>

            {/* 필터 및 정렬 */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              >
                <option value="all">전체</option>
                <option value="beauty">뷰티</option>
                <option value="food">푸드</option>
                <option value="lifestyle">라이프스타일</option>
                <option value="tech">테크</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'newest' | 'deadline' | 'points')}
                className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-sm sm:text-base"
              >
                <option value="newest">최신순</option>
                <option value="deadline">마감임박순</option>
                <option value="points">포인트순</option>
              </select>

              {/* 뷰 모드 */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 sm:p-3 ${viewMode === 'grid' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <Grid className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 sm:p-3 ${viewMode === 'list' ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                >
                  <List className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        {filteredExperiences.length > 0 ? (
          <div className={`grid gap-4 sm:gap-6 ${
            viewMode === 'grid' 
              ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          }`}>
            {filteredExperiences.map((experience, index) => (
              <div
                key={experience.id || index}
                className={`bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden ${
                  viewMode === 'list' ? 'flex' : ''
                }`}
              >
                {/* 이미지 */}
                <div className={`${viewMode === 'grid' ? 'h-40 sm:h-48' : 'w-32 sm:w-48 h-32 sm:h-48 flex-shrink-0'} bg-gradient-to-r from-purple-400 to-pink-400 relative overflow-hidden`}>
                  {(experience.image_url || (experience.main_images && experience.main_images.length > 0)) ? (
                    <img
                      src={experience.image_url || experience.main_images[0]}
                      alt={experience.campaign_name || experience.title || experience.experience_name || experience.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Gift className="w-16 h-16 text-white/50" />
                    </div>
                  )}

                  {/* 상태 배지와 찜하기 */}
                  <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center space-x-2">
                    {(() => {
                      // 🔥 종합적인 마감 상태 체크 (실제 DB 스키마 기준)
                      const isExpiredCampaign = (() => {
                        // 1. 캠페인 상태 체크 (실제 필드명)
                        const campaignStatus = experience.campaign_status || experience.status || 'recruiting'
                        if (campaignStatus === 'completed' || campaignStatus === 'cancelled' || campaignStatus === 'closed' || campaignStatus === 'inactive') {
                          return true
                        }
                        
                        // 2. 신청 마감일 체크 (실제 필드명)
                        const applicationEndDate = experience.end_date || 
                                                 experience.review_deadline ||
                                                 experience.application_end_date || 
                                                 experience.application_end
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
                        const maxParticipants = experience.recruitment_count || experience.max_participants
                        const currentParticipants = experience.current_applicants || experience.current_participants || 0
                        if (maxParticipants && currentParticipants >= maxParticipants) {
                          return true
                        }
                        
                        return false
                      })()
                      
                      return (
                        <span className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${
                          isExpiredCampaign
                            ? 'bg-gray-500 text-white'
                            : 'bg-green-500 text-white'
                        }`}>
                          {isExpiredCampaign ? '마감' : '모집중'}
                        </span>
                      )
                    })()}
                    {isAuthenticated && (
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleWishlist(experience.id)
                        }}
                        className="bg-white/90 hover:bg-white p-1.5 sm:p-2 rounded-full transition-colors"
                      >
                        <Heart 
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${
                            wishlist.some(item => item.campaign_id === experience.id) 
                              ? 'text-red-500 fill-current' 
                              : 'text-gray-400'
                          }`} 
                        />
                      </button>
                    )}
                  </div>

                  {/* D-Day 배지 */}
                  <div className="absolute top-3 sm:top-4 left-3 sm:left-4">
                    <span className="bg-white/90 text-purple-600 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold">
                      {getDeadlineDisplay(experience)}
                    </span>
                  </div>
                </div>

                {/* 내용 */}
                <div className={`p-4 sm:p-6 ${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className="flex items-start justify-between mb-2 sm:mb-3">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900 line-clamp-2 flex-1">
                      {experience.campaign_name || experience.title || experience.experience_name || experience.name || '제목 없음'}
                    </h3>
                    <button 
                      onClick={() => toggleWishlist(experience.id)}
                      className={`ml-2 p-1.5 sm:p-2 transition-colors ${
                        wishlist.some(item => item.campaign_id === experience.id)
                          ? 'text-red-500' 
                          : 'text-gray-400 hover:text-red-500'
                      }`}
                    >
                      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${wishlist.some(item => item.campaign_id === experience.id) ? 'fill-current' : ''}`} />
                    </button>
                  </div>

                  <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4 line-clamp-3">
                    {experience.description || '설명이 없습니다.'}
                  </p>

                  {/* 브랜드 정보 */}
                  <div className="flex items-center mb-3 sm:mb-4">
                    <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                      {(experience.brand || experience.brand_name || 'B').charAt(0)}
                    </div>
                    <span className="ml-2 text-xs sm:text-sm font-semibold text-gray-700">
                      {experience.brand || experience.brand_name || '브랜드'}
                    </span>
                  </div>

                  {/* 상세 정보 */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <MapPin className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {experience.experience_location || '전국'}
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {experience.experience_period || '2주'}
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {experience.current_applicants || 0}/{experience.max_participants || experience.recruitment_count || 0}명
                    </div>
                    <div className="flex items-center text-xs sm:text-sm text-gray-500">
                      <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                      {getDeadlineDisplay(experience)}
                    </div>
                  </div>

                  {/* 포인트 및 버튼 */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
                    <div className="flex items-center text-purple-600 font-bold text-base sm:text-lg">
                      <Coins className="w-5 h-5 sm:w-6 sm:h-6 mr-1 sm:mr-2" />
                      {experience.rewards || 0} P
                    </div>
                    
                    {/* 마감된 캠페인인지 확인 */}
                    {(() => {
                      const status = experience.status || experience.campaign_status
                      const maxParticipants = experience.max_participants
                      const currentParticipants = experience.current_participants || 0
                      const isClosed = status === 'closed' || status === 'inactive' || 
                                     (maxParticipants && currentParticipants >= maxParticipants)
                      
                      return isClosed ? (
                        <div className="bg-gray-400 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold text-sm sm:text-base opacity-60 cursor-not-allowed flex items-center justify-center">
                          마감된 캠페인
                        </div>
                      ) : (
                        <Link
                          to={`/campaign/${experience.id}`}
                          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-full font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 flex items-center justify-center text-sm sm:text-base"
                        >
                          자세히 보기
                          <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                        </Link>
                      )
                    })()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {searchTerm ? '검색 결과가 없습니다' : '아직 등록된 체험단이 없습니다'}
              </h3>
              <p className="text-gray-500 mb-6">
                {searchTerm
                  ? '다른 검색어로 시도해보세요'
                  : '곧 멋진 체험단들이 등록될 예정입니다!'
                }
              </p>
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="bg-purple-500 text-white px-6 py-3 rounded-full font-semibold hover:bg-purple-600 transition-colors"
                >
                  전체 보기
                </button>
              )}
            </div>
          </div>
        )}

        {/* 결과 개수 표시 */}
        {filteredExperiences.length > 0 && (
          <div className="text-center mt-8">
            <p className="text-gray-600">
              총 <span className="font-semibold text-purple-600">{filteredExperiences.length}</span>개의 체험단을 찾았습니다
            </p>
          </div>
        )}
      </div>
      
      {/* 채팅봇 */}
      <ChatBot />
    </div>
  )
}

export default Experiences