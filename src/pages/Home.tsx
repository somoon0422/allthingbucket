import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { dataService } from '../lib/dataService'
import { setHomeOGTags } from '../utils/ogTags'
import {
  Gift, Star, Users, ArrowRight, Calendar, MapPin,
  Coins, Sparkles, Award, Zap, Target, CheckCircle, Heart, TrendingUp
} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useWishlist } from '../hooks/useWishlist'
import ChatBot from '../components/ChatBot'

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
    const deadline = experience.application_end_date ||
                    experience.application_deadline ||
                    experience.end_date ||
                    experience.deadline ||
                    experience.신청_마감일 ||
                    experience.application_end

    const status = experience.status || experience.campaign_status

    if (status === 'closed' || status === 'inactive') {
      return '마감됨'
    }

    const maxParticipants = experience.max_participants
    const currentParticipants = experience.current_participants || 0
    if (maxParticipants && currentParticipants >= maxParticipants) {
      return '마감됨'
    }

    if (!deadline) {
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

  // 캠페인이 마감되었는지 확인하는 함수
  const isCampaignClosed = (experience: any) => {
    const status = experience.status || experience.campaign_status
    const maxParticipants = experience.max_participants
    const currentParticipants = experience.current_participants || 0

    if (status === 'closed' || status === 'inactive') {
      return true
    }

    if (maxParticipants && currentParticipants >= maxParticipants) {
      return true
    }

    const deadline = experience.application_end_date ||
                    experience.application_deadline ||
                    experience.end_date ||
                    experience.deadline ||
                    experience.신청_마감일 ||
                    experience.application_end

    if (deadline) {
      try {
        const deadlineDate = new Date(deadline)
        const today = new Date()
        today.setHours(23, 59, 59, 999)

        if (deadlineDate < today) {
          return true
        }
      } catch (error) {
        console.error('날짜 계산 오류:', error)
      }
    }

    return false
  }

  const updateFeaturedExperiences = (campaigns: any[]) => {
    try {
      const safeCampaigns = Array.isArray(campaigns) ? campaigns : []
      const featured = safeCampaigns
        .filter(campaign => campaign && (campaign.status === 'recruiting' || campaign.status === 'active'))
        .slice(0, 6)

      setFeaturedExperiences(featured)
    } catch (error) {
      console.error('추천 체험단 업데이트 실패:', error)
      setFeaturedExperiences([])
    }
  }

  const updateStats = (campaigns: any[], users: any[], reviews: any[]) => {
    try {
      setStats({
        totalExperiences: Array.isArray(campaigns) ? campaigns.length : 0,
        totalUsers: Array.isArray(users) ? users.length : 0,
        totalReviews: Array.isArray(reviews) ? reviews.length : 0
      })
    } catch (error) {
      console.error('통계 업데이트 실패:', error)
    }
  }

  const updateReviews = (reviews: any[]) => {
    try {
      const safeReviews = Array.isArray(reviews) ? reviews : []
      const approvedReviews = safeReviews
        .filter(review => review && review.status === 'approved')
        .slice(0, 5)

      setReviews(approvedReviews)
    } catch (error) {
      console.error('리뷰 업데이트 실패:', error)
      setReviews([])
    }
  }

  useEffect(() => {
    setHomeOGTags()

    const loadData = async () => {
      setLoading(true)
      try {
        let campaigns = [], users = [], reviews = []

        const [campaignsResult, usersResult, reviewsResult] = await Promise.allSettled([
          (dataService.entities as any).campaigns.list().catch(() => []),
          (dataService.entities as any).users.list().catch(() => []),
          (dataService.entities as any).review_submissions.list().catch(() => [])
        ])

        campaigns = campaignsResult.status === 'fulfilled' ? campaignsResult.value : []
        users = usersResult.status === 'fulfilled' ? usersResult.value : []
        reviews = reviewsResult.status === 'fulfilled' ? reviewsResult.value : []

        updateFeaturedExperiences(campaigns)
        updateStats(campaigns, users, reviews)
        updateReviews(reviews)

      } catch (error) {
        console.error('홈페이지 데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [isAuthenticated])

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
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gold-50 to-navy-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">올띵버킷을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-gold-50 to-navy-50">
      {/* Hero Section - 더 현대적이고 세련된 디자인 */}
      <section className="relative overflow-hidden pt-20 pb-32">
        {/* 배경 장식 */}
        <div className="absolute inset-0">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-navy-400/20 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/80 backdrop-blur-sm rounded-full px-4 py-2 mb-8 shadow-lg">
              <TrendingUp className="w-4 h-4 text-primary-600" />
              <span className="text-sm font-semibold text-gray-700">대한민국 No.1 체험단 플랫폼</span>
            </div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-gray-900 mb-6 tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 via-navy-600 to-gold-600">
                올띵버킷
              </span>
            </h1>

            <p className="text-xl sm:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed">
              최고의 체험단 플랫폼에서<br className="sm:hidden" />
              <span className="font-semibold text-gray-900"> 특별한 경험</span>을 시작하세요
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/experiences"
                className="inline-flex items-center justify-center bg-gradient-to-r from-primary-600 to-navy-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 shadow-lg"
              >
                체험단 둘러보기
                <ArrowRight className="w-5 h-5 ml-2" />
              </Link>
              {!isAuthenticated && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                  className="inline-flex items-center justify-center bg-white text-gray-900 px-8 py-4 rounded-2xl font-semibold text-lg hover:shadow-xl hover:scale-105 transition-all duration-300 border-2 border-gray-200"
                >
                  지금 시작하기
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section - 글래스모피즘 효과 */}
      <section className="py-16 -mt-20 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              <Link to="/experiences" className="text-center group cursor-pointer">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-2xl shadow-lg shadow-primary-500/30 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Gift className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.totalExperiences}</h3>
                <p className="text-gray-600 font-medium">진행 중인 체험단</p>
              </Link>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-navy-500 to-navy-700 rounded-2xl shadow-lg shadow-navy-500/30 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Users className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.totalUsers}</h3>
                <p className="text-gray-600 font-medium">활성 사용자</p>
              </div>
              <div className="text-center group">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gold-500 to-gold-700 rounded-2xl shadow-lg shadow-gold-500/30 mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-4xl font-bold text-gray-900 mb-2">{stats.totalReviews}</h3>
                <p className="text-gray-600 font-medium">완료된 리뷰</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Experiences - 개선된 카드 디자인 */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-700 text-white rounded-full px-4 py-2 mb-4 shadow-lg">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold">HOT</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              인기 체험단
            </h2>
            <p className="text-xl text-gray-600">
              지금 가장 인기 있는 체험단들을 만나보세요
            </p>
          </div>

          {featuredExperiences.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredExperiences.map((experience, index) => (
                <Link
                  key={experience.id || index}
                  to={`/campaign/${experience.id}`}
                  className={`group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden ${
                    isCampaignClosed(experience) ? 'opacity-60' : 'hover:scale-105'
                  }`}
                >
                  <div className="relative h-56 bg-gradient-to-br from-primary-400 to-navy-400 overflow-hidden">
                    {(() => {
                      const imageSources = [
                        (experience.main_images && Array.isArray(experience.main_images) && experience.main_images.length > 0) ? experience.main_images[0] : null,
                        (experience.detail_images && Array.isArray(experience.detail_images) && experience.detail_images.length > 0) ? experience.detail_images[0] : null,
                        experience.image_url,
                        experience.main_image,
                        experience.thumbnail
                      ].filter(Boolean)

                      const imageSrc = imageSources[0]

                      if (imageSrc) {
                        return (
                          <img
                            src={imageSrc}
                            alt={experience.campaign_name || ''}
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => e.currentTarget.style.display = 'none'}
                          />
                        )
                      } else {
                        return (
                          <div className="w-full h-full flex items-center justify-center">
                            <Gift className="w-16 h-16 text-white/50" />
                          </div>
                        )
                      }
                    })()}

                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>

                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-lg backdrop-blur-sm ${
                        isCampaignClosed(experience)
                          ? 'bg-red-500/90 text-white'
                          : 'bg-white/90 text-primary-600'
                      }`}>
                        {getDeadlineDisplay(experience)}
                      </span>
                      {isAuthenticated && (
                        <button
                          onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            toggleWishlist(experience.id)
                          }}
                          className="bg-white/90 backdrop-blur-sm hover:bg-white p-2 rounded-full transition-all shadow-lg"
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

                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="bg-white/90 backdrop-blur-sm rounded-2xl px-3 py-2 inline-flex items-center gap-2 shadow-lg">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-600 to-navy-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                          {(experience.brand || 'B').charAt(0)}
                        </div>
                        <span className="text-gray-900 font-semibold text-sm">
                          {experience.brand || experience.brand_name || '브랜드'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
                      {experience.campaign_name ||
                       experience.title ||
                       experience.experience_name ||
                       '제목 없음'}
                    </h3>
                    <p className="text-gray-600 mb-4 line-clamp-2 leading-relaxed">
                      {experience.description || '설명이 없습니다.'}
                    </p>

                    <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{experience.experience_location || '전국'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>{experience.experience_period || '2주'}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1 text-primary-600 font-bold">
                        <Coins className="w-5 h-5" />
                        <span>{experience.rewards || 0} P</span>
                      </div>
                      <div className="inline-flex items-center gap-1 text-primary-600 font-semibold group-hover:gap-2 transition-all">
                        <span>자세히 보기</span>
                        <ArrowRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-white/50 backdrop-blur-sm rounded-3xl">
              <Gift className="w-20 h-20 text-gray-400 mx-auto mb-4" />
              <h3 className="text-2xl font-semibold text-gray-600 mb-2">
                아직 등록된 체험단이 없습니다
              </h3>
              <p className="text-gray-500 text-lg">
                곧 멋진 체험단들이 등록될 예정입니다!
              </p>
            </div>
          )}

          <div className="text-center mt-16">
            <Link
              to="/experiences"
              className="inline-flex items-center bg-gradient-to-r from-primary-600 to-navy-600 text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-lg"
            >
              모든 체험단 보기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      {reviews.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                사용자 리뷰
              </h2>
              <p className="text-xl text-gray-600">
                실제 사용자들의 솔직한 후기를 확인해보세요
              </p>
            </div>

            <div className="relative">
              <div className="bg-gradient-to-br from-primary-50 to-navy-50 rounded-3xl shadow-xl p-10 max-w-4xl mx-auto border border-white">
                <div className="flex items-center mb-6">
                  <div className="flex text-yellow-400">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-6 h-6 fill-current" />
                    ))}
                  </div>
                  <span className="ml-3 text-gray-700 font-bold text-lg">
                    {reviews[currentReviewIndex]?.rating || 5}점
                  </span>
                </div>
                <blockquote className="text-xl text-gray-800 mb-8 italic leading-relaxed">
                  "{reviews[currentReviewIndex]?.review_content || '훌륭한 체험단이었습니다!'}"
                </blockquote>
                <div className="flex items-center">
                  <div className="w-14 h-14 bg-gradient-to-br from-primary-600 to-navy-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {reviews[currentReviewIndex]?.user_name?.charAt(0) || 'U'}
                  </div>
                  <div className="ml-4">
                    <p className="font-bold text-gray-900 text-lg">
                      {reviews[currentReviewIndex]?.user_name || '익명 사용자'}
                    </p>
                    <p className="text-gray-600">
                      {reviews[currentReviewIndex]?.experience_name || '체험단 참여자'}
                    </p>
                  </div>
                </div>
              </div>

              {reviews.length > 1 && (
                <div className="flex justify-center mt-8 gap-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentReviewIndex(index)}
                      className={`w-3 h-3 rounded-full transition-all duration-300 ${
                        index === currentReviewIndex
                          ? 'bg-primary-600 w-8'
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
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
              올띵버킷의 특별함
            </h2>
            <p className="text-xl text-gray-600">
              왜 올띵버킷을 선택해야 할까요?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: Zap, title: '빠른 신청', desc: '간편한 신청 과정으로 빠르게 체험단에 참여하세요', gradient: 'from-primary-500 to-primary-700' },
              { icon: Award, title: '품질 보장', desc: '엄선된 브랜드와 제품으로 만족스러운 경험을 제공합니다', gradient: 'from-navy-500 to-navy-700' },
              { icon: Target, title: '맞춤 추천', desc: '당신의 관심사에 맞는 체험단을 추천해드립니다', gradient: 'from-gold-500 to-gold-700' },
              { icon: CheckCircle, title: '안전한 거래', desc: '안전하고 투명한 시스템으로 보호받으세요', gradient: 'from-primary-600 to-navy-600' }
            ].map((feature, index) => (
              <div key={index} className="text-center group">
                <div className={`inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br ${feature.gradient} rounded-3xl shadow-lg mx-auto mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="w-10 h-10 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-navy-600 to-gold-600"></div>
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-72 h-72 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            지금 시작하세요!
          </h2>
          <p className="text-xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
            특별한 체험단과 함께 새로운 경험을 시작해보세요
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/experiences"
              className="inline-flex items-center justify-center bg-white text-gray-900 px-10 py-5 rounded-2xl font-semibold text-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 shadow-xl"
            >
              체험단 둘러보기
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            {!isAuthenticated && (
              <button
                onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                className="inline-flex items-center justify-center border-2 border-white text-white px-10 py-5 rounded-2xl font-semibold text-lg hover:bg-white hover:text-gray-900 transition-all duration-300"
              >
                회원가입하기
              </button>
            )}
          </div>
        </div>
      </section>

      <ChatBot />
    </div>
  )
}

export default Home
