import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dataService } from '../lib/dataService'
import { setHomeOGTags } from '../utils/ogTags'
import { 
  Gift, Star, Users, ArrowRight, Calendar, MapPin, 
  Coins, Sparkles, Award, Zap, Target, CheckCircle, Heart
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useWishlist } from '../hooks/useWishlist'

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const { wishlist, toggleWishlist } = useWishlist()
  const [featuredExperiences, setFeaturedExperiences] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalExperiences: 0,
    totalUsers: 0,
    totalReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)

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

  // 추천 체험단 로드
  const loadFeaturedExperiences = async () => {
    try {
      console.log('🔥 추천 체험단 로드 시작...')
      
      // 타임아웃 방지를 위해 더 효율적인 쿼리 시도
      let campaigns = []
      try {
        campaigns = await (dataService.entities as any).campaigns.list()
      } catch (timeoutError) {
        console.warn('⚠️ campaigns 타임아웃, 빈 배열로 처리:', timeoutError)
        campaigns = []
      }
      
      console.log('✅ 체험단 데이터 로드 성공:', campaigns)
      
      const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
      const featured = safeCampaigns
        .filter(campaign => campaign && (campaign.status === 'recruiting' || campaign.status === 'active'))
        .slice(0, 6)
      
      setFeaturedExperiences(featured)
    } catch (error) {
      console.error('추천 체험단 로드 실패:', error)
      setFeaturedExperiences([])
    }
  }

  // 통계 로드
  const loadStats = async () => {
    try {
      console.log('📊 통계 로드 시작...')
      
      // 타임아웃 방지를 위해 개별적으로 로드
      let campaigns = [], users = [], reviews = []
      
      try {
        campaigns = await (dataService.entities as any).campaigns.list()
      } catch (error) {
        console.warn('⚠️ campaigns 통계 로드 실패:', error)
      }
      
      try {
        users = await (dataService.entities as any).users.list()
      } catch (error) {
        console.warn('⚠️ users 통계 로드 실패:', error)
      }
      
      try {
        reviews = await (dataService.entities as any).review_submissions.list()
      } catch (error) {
        console.warn('⚠️ reviews 통계 로드 실패:', error)
      }
      
      setStats({
        totalExperiences: Array.isArray(campaigns) ? campaigns.length : 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalReviews: Array.isArray(reviews) ? reviews.length : 0
      })
    } catch (error) {
      console.error('통계 로드 실패:', error)
    }
  }

  // 리뷰 로드
  const loadReviews = async () => {
    try {
      console.log('💬 리뷰 로드 시작...')
      const reviews = await (dataService.entities as any).review_submissions.list()
      const safeReviews = Array.isArray(reviews) ? reviews : []
      const approvedReviews = safeReviews
        .filter(review => review && review.status === 'approved')
        .slice(0, 5)
      
      setReviews(approvedReviews)
    } catch (error) {
      console.error('리뷰 로드 실패:', error)
      setReviews([])
    }
  }

  useEffect(() => {
    // 🔥 홈페이지 OG 태그 설정 (카카오톡 링크 공유용)
    setHomeOGTags()
    
    const loadData = async () => {
      setLoading(true)
      try {
        await Promise.all([
          loadFeaturedExperiences(),
          loadStats(),
          loadReviews()
        ])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 리뷰 자동 슬라이드
  useEffect(() => {
    if (reviews.length > 1) {
      const interval = setInterval(() => {
        setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [reviews.length])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">올띵버킷을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 opacity-90"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="flex justify-center mb-8">
              <div className="bg-white/20 backdrop-blur-sm rounded-full p-4">
                <Sparkles className="w-16 h-16 text-white" />
              </div>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-6">
              올띵버킷
            </h1>
            <p className="text-xl md:text-2xl text-white/90 mb-8 max-w-3xl mx-auto">
              최고의 체험단 플랫폼에서 특별한 경험을 시작하세요
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/experiences"
                className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
              >
                체험단 둘러보기
                <ArrowRight className="w-5 h-5 ml-2 inline" />
              </Link>
              {!isAuthenticated && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                  className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300"
                >
                  지금 시작하기
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalExperiences}</h3>
              <p className="text-gray-600">진행 중인 체험단</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-pink-500 to-orange-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers}</h3>
              <p className="text-gray-600">활성 사용자</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalReviews}</h3>
              <p className="text-gray-600">완료된 리뷰</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experiences */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              🔥 인기 체험단
            </h2>
            <p className="text-xl text-gray-600">
              지금 가장 인기 있는 체험단들을 만나보세요
            </p>
          </div>

          {featuredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredExperiences.map((experience, index) => (
                <div
                  key={experience.id || index}
                  className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden"
                >
                  {experience.image_url && (
                    <div className="h-48 bg-gradient-to-r from-purple-400 to-pink-400 relative overflow-hidden">
                      <img
                        src={experience.image_url}
                        alt={experience.title || experience.experience_name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <div className="absolute top-4 right-4 flex items-center space-x-2">
                        <span className="bg-white/90 text-purple-600 px-3 py-1 rounded-full text-sm font-semibold">
                          {getDeadlineDisplay(experience)}
                        </span>
                        {isAuthenticated && (
                          <button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              toggleWishlist(experience.id)
                            }}
                            className="bg-white/90 hover:bg-white p-2 rounded-full transition-colors"
                          >
                            <Heart 
                              className={`w-5 h-5 ${
                                wishlist.some(item => item.campaign_id === experience.id) 
                                  ? 'text-red-500 fill-current' 
                                  : 'text-gray-400'
                              }`} 
                            />
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">
                      {experience.title || experience.experience_name || '제목 없음'}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-3">
                      {experience.description || '설명이 없습니다.'}
                    </p>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center text-sm text-gray-500">
                        <MapPin className="w-4 h-4 mr-1" />
                        {experience.experience_location || '전국'}
                      </div>
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="w-4 h-4 mr-1" />
                        {experience.experience_period || '2주'}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-purple-600 font-semibold">
                        <Coins className="w-5 h-5 mr-1" />
                        {experience.rewards || 0} P
                      </div>
                      <Link
                        to={`/campaign/${experience.id}`}
                        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300"
                      >
                        자세히 보기
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                아직 등록된 체험단이 없습니다
              </h3>
              <p className="text-gray-500">
                곧 멋진 체험단들이 등록될 예정입니다!
              </p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/experiences"
              className="inline-flex items-center bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-4 rounded-full font-semibold text-lg hover:from-purple-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              모든 체험단 보기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-16 bg-gradient-to-r from-purple-100 to-pink-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">
                💬 사용자 리뷰
              </h2>
              <p className="text-xl text-gray-600">
                실제 사용자들의 솔직한 후기를 확인해보세요
              </p>
            </div>

            <div className="relative">
              <div className="bg-white rounded-2xl shadow-lg p-8 max-w-4xl mx-auto">
                <div className="flex items-center mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-current" />
                    ))}
                  </div>
                  <span className="ml-2 text-gray-600 font-semibold">
                    {reviews[currentReviewIndex]?.rating || 5}점
                  </span>
                </div>
                <blockquote className="text-lg text-gray-700 mb-6 italic">
                  "{reviews[currentReviewIndex]?.review_content || '훌륭한 체험단이었습니다!'}"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold">
                    {reviews[currentReviewIndex]?.user_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-4">
                    <p className="font-semibold text-gray-900">
                      {reviews[currentReviewIndex]?.user_name || '익명 사용자'}
                    </p>
                    <p className="text-gray-600 text-sm">
                      {reviews[currentReviewIndex]?.experience_name || '체험단 참여자'}
                    </p>
                  </div>
                </div>
              </div>

              {reviews.length > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentReviewIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentReviewIndex
                          ? 'bg-purple-600'
                          : 'bg-gray-300 hover:bg-gray-400'
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              ✨ 올띵버킷의 특별함
            </h2>
            <p className="text-xl text-gray-600">
              왜 올띵버킷을 선택해야 할까요?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">빠른 신청</h3>
              <p className="text-gray-600">간편한 신청 과정으로 빠르게 체험단에 참여하세요</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Award className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">품질 보장</h3>
              <p className="text-gray-600">엄선된 브랜드와 제품으로 만족스러운 경험을 제공합니다</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Target className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">맞춤 추천</h3>
              <p className="text-gray-600">당신의 관심사에 맞는 체험단을 추천해드립니다</p>
            </div>
            <div className="text-center">
              <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">안전한 거래</h3>
              <p className="text-gray-600">안전하고 투명한 시스템으로 보호받으세요</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            지금 시작하세요!
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            특별한 체험단과 함께 새로운 경험을 시작해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/experiences"
              className="bg-white text-purple-600 px-8 py-4 rounded-full font-semibold text-lg hover:bg-gray-100 transition-all duration-300 transform hover:scale-105 shadow-lg"
            >
              체험단 둘러보기
              <ArrowRight className="w-5 h-5 ml-2 inline" />
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                className="border-2 border-white text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white hover:text-purple-600 transition-all duration-300"
              >
                회원가입하기
              </button>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home