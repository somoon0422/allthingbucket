
import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
// Lumi SDK 제거됨 - MongoDB API 사용
import {Gift, Star, Users, TrendingUp, ArrowRight, Calendar, MapPin, Coins, ChevronLeft, ChevronRight, Heart, MessageCircle} from 'lucide-react'
import { ultraSafeArray, safeString, safeNumber } from '../utils/arrayUtils'
import { useAuth } from '../hooks/useAuth'

const Home: React.FC = () => {
  const { isAuthenticated } = useAuth()
  const [featuredExperiences, setFeaturedExperiences] = useState<any[]>([])
  const [stats, setStats] = useState({
    totalExperiences: 0,
    totalUsers: 0,
    totalReviews: 0
  })
  const [loading, setLoading] = useState(true)
  const [reviews, setReviews] = useState<any[]>([])
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0)

  // 🔥 D-Day 계산 함수
  const getDeadlineDisplay = (deadline: string) => {
    if (!deadline) return '상시모집'
    
    try {
      const deadlineDate = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
      deadlineDate.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
      
      const diffTime = deadlineDate.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return '마감됨'
      } else if (diffDays === 0) {
        return 'D-Day'
      } else if (diffDays === 1) {
        return 'D-1'
      } else {
        return `D-${diffDays}`
      }
    } catch (error) {
      console.error('날짜 계산 오류:', error)
      return '상시모집'
    }
  }

  // 🔥 추천 체험단 로드 - MongoDB API 사용
  const loadFeaturedExperiences = async () => {
    try {
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/db/campaigns?limit=6'
        : 'https://allthingbucket.com/api/db/campaigns?limit=6'
      const response = await fetch(apiUrl)
      const result = await response.json()
      
      if (result.success) {
        const safeExperiences = ultraSafeArray(result.data)
        setFeaturedExperiences(safeExperiences)
      } else {
        setFeaturedExperiences([])
      }
    } catch (error) {
      console.error('추천 체험단 로드 실패:', error)
      setFeaturedExperiences([])
    }
  }

  // 🔥 통계 로드 - MongoDB API 사용
  const loadStats = async () => {
    try {
        const apiBaseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:3001'
          : 'https://allthingbucket.com'
        const [campaignsRes, usersRes, reviewsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/db/campaigns`),
          fetch(`${apiBaseUrl}/api/db/user-profiles`),
          fetch(`${apiBaseUrl}/api/db/user-reviews`)
        ])

      const campaignsResult = await campaignsRes.json()
      const usersResult = await usersRes.json()
      const reviewsResult = await reviewsRes.json()

      const campaigns = campaignsResult.success ? ultraSafeArray(campaignsResult.data) : []
      const users = usersResult.success ? ultraSafeArray(usersResult.data) : []
      const reviews = reviewsResult.success ? ultraSafeArray(reviewsResult.data) : []

      setStats({
        totalExperiences: campaigns.length,
        totalUsers: users.length,
        totalReviews: reviews.length
      })
    } catch (error) {
      console.error('통계 로드 실패:', error)
      setStats({
        totalExperiences: 0,
        totalUsers: 0,
        totalReviews: 0
      })
    }
  }

  // 🔥 체험단 후기 로드 - MongoDB API 사용
  const loadReviews = async () => {
    try {
      const apiUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001/api/db/user-reviews?limit=10'
        : 'https://allthingbucket.com/api/db/user-reviews?limit=10'
      const response = await fetch(apiUrl)
      const result = await response.json()
      
      if (result.success) {
        const safeReviews = ultraSafeArray(result.data)
        setReviews(safeReviews)
      } else {
        setReviews([])
      }
    } catch (error) {
      console.error('리뷰 로드 실패:', error)
      setReviews([])
    }
  }

  // 캐러셀 네비게이션
  const nextReview = () => {
    setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)
  }

  const prevReview = () => {
    setCurrentReviewIndex((prev) => (prev - 1 + reviews.length) % reviews.length)
  }

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        await Promise.all([
          loadFeaturedExperiences(),
          loadStats(),
          loadReviews()
        ])
      } catch (error) {
        console.error('데이터 로드 실패:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [])

  // 자동 캐러셀
  useEffect(() => {
    if (reviews.length <= 1) return

    const interval = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % reviews.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [reviews.length])


  return (
    <div className="min-h-screen bg-white">
      {/* 히어로 섹션 */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-700 text-white">
        <div className="absolute inset-0 bg-black opacity-10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              올띵버킷과 함께하는
              <br />
              <span className="text-yellow-300">특별한 체험</span>
            </h1>
            <p className="text-xl md:text-2xl mb-8 text-blue-100">
              다양한 브랜드의 체험단에 참여하고 리워드를 받아보세요
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/experiences"
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors"
              >
                체험단 둘러보기
              </Link>
              {!isAuthenticated && (
                <button
                  onClick={() => window.dispatchEvent(new CustomEvent('openLoginModal'))}
                  className="border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-blue-600 transition-colors"
                >
                  지금 시작하기
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 통계 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Gift className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalExperiences}+</h3>
              <p className="text-gray-600">진행중인 체험단</p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalUsers}+</h3>
              <p className="text-gray-600">참여 회원</p>
            </div>
            
            <div className="text-center">
              <div className="bg-yellow-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-2">{stats.totalReviews}+</h3>
              <p className="text-gray-600">작성된 리뷰</p>
            </div>
          </div>
        </div>
      </section>

      {/* 체험단 후기 캐러셀 */}
      {reviews.length > 0 && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">체험단 후기</h2>
              <p className="text-xl text-gray-600">실제 참여자들의 생생한 후기를 확인해보세요</p>
            </div>
            
            <div className="relative">
              <div className="overflow-hidden rounded-2xl bg-white shadow-lg">
                <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentReviewIndex * 100}%)` }}>
                  {reviews.map((review, index) => (
                    <div key={review._id || index} className="w-full flex-shrink-0">
                      <div className="p-8 md:p-12">
                        <div className="flex items-center mb-6">
                          <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {safeString(review, 'user_name', 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <h4 className="text-lg font-semibold text-gray-900">
                              {safeString(review, 'user_name', '익명')}
                            </h4>
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-4 h-4 ${
                                    i < (safeNumber(review, 'rating', 5))
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                        
                        <blockquote className="text-lg text-gray-700 mb-6 leading-relaxed">
                          "{safeString(review, 'content', '좋은 체험단이었습니다!')}"
                        </blockquote>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            {new Date(safeString(review, 'created_at', new Date().toISOString())).toLocaleDateString('ko-KR')}
                          </div>
                          <div className="flex items-center space-x-4">
                            <button className="flex items-center text-gray-500 hover:text-red-500 transition-colors">
                              <Heart className="w-4 h-4 mr-1" />
                              <span>{safeNumber(review, 'likes', 0)}</span>
                            </button>
                            <button className="flex items-center text-gray-500 hover:text-blue-500 transition-colors">
                              <MessageCircle className="w-4 h-4 mr-1" />
                              <span>{safeNumber(review, 'comments', 0)}</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* 네비게이션 버튼 */}
              {reviews.length > 1 && (
                <>
                  <button
                    onClick={prevReview}
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <ChevronLeft className="w-6 h-6 text-gray-600" />
                  </button>
                  <button
                    onClick={nextReview}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-3 shadow-lg hover:shadow-xl transition-shadow"
                  >
                    <ChevronRight className="w-6 h-6 text-gray-600" />
                  </button>
                </>
              )}
              
              {/* 인디케이터 */}
              {reviews.length > 1 && (
                <div className="flex justify-center mt-6 space-x-2">
                  {reviews.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentReviewIndex(index)}
                      className={`w-3 h-3 rounded-full transition-colors ${
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

      {/* 추천 체험단 섹션 */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">추천 체험단</h2>
            <p className="text-xl text-gray-600">지금 가장 인기있는 체험단을 확인해보세요</p>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">체험단을 불러오는 중...</p>
            </div>
          ) : !Array.isArray(featuredExperiences) || featuredExperiences.length === 0 ? (
            <div className="text-center py-12">
              <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-2">진행중인 체험단이 없습니다</h3>
              <p className="text-gray-600">곧 새로운 체험단이 등록될 예정입니다</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredExperiences.slice(0, 6).map((experience, index) => {
                try {
                  if (!experience || typeof experience !== 'object') {
                    return null
                  }

                  const experienceId = experience._id || experience.id || `exp-${index}`
                  const experienceName = safeString(experience, 'experience_name', '체험단명 없음')
                  const brandName = safeString(experience, 'brand_name', '브랜드명 없음')
                  const description = safeString(experience, 'description', '설명 없음')
                  const rewardPoints = safeNumber(experience, 'reward_points', 0)
                  const applicationDeadline = safeString(experience, 'application_end_date') || 
                                              safeString(experience, 'application_deadline')
                  const experienceLocation = safeString(experience, 'experience_location')
                  // 🔥 다양한 이미지 필드명 시도
                  const imageUrl = safeString(experience, 'image_url') || 
                                 safeString(experience, 'image') || 
                                 safeString(experience, 'thumbnail') || 
                                 safeString(experience, 'photo') || 
                                 safeString(experience, 'banner_image')
                  
                  // 🔥 기본 이미지 배열 (다양한 이미지로 랜덤 선택)
                  const defaultImages = [
                    'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
                    'https://images.pexels.com/photos/3184465/pexels-photo-3184465.jpeg',
                    'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg',
                    'https://images.pexels.com/photos/3184462/pexels-photo-3184462.jpeg',
                    'https://images.pexels.com/photos/3184461/pexels-photo-3184461.jpeg'
                  ]
                  
                  // 🔥 이미지 URL 디버깅
                  console.log(`체험단 [${experienceName}] 이미지 URL:`, imageUrl)
                  console.log('체험단 전체 데이터:', experience)

                  return (
                    <div
                      key={experienceId}
                      className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow"
                    >
                      <div className="h-48 bg-gray-200 overflow-hidden relative">
                        <img
                          src={imageUrl || defaultImages[index % defaultImages.length]}
                          alt={experienceName}
                          className="w-full h-full object-cover transition-opacity duration-300"
                          onError={(e) => {
                            console.log(`이미지 로딩 실패: ${imageUrl}`)
                            const target = e.target as HTMLImageElement
                            // 실패 시 다른 기본 이미지로 시도
                            const currentSrc = target.src
                            const fallbackIndex = defaultImages.findIndex(img => img === currentSrc)
                            const nextIndex = (fallbackIndex + 1) % defaultImages.length
                            target.src = defaultImages[nextIndex]
                          }}
                          onLoad={() => {
                            console.log(`이미지 로딩 성공: ${imageUrl || '기본 이미지'}`)
                          }}
                        />
                      </div>

                      <div className="p-6">
                        <div className="flex justify-between items-start mb-3">
                          <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                            모집중
                          </span>
                          {rewardPoints > 0 && (
                            <div className="flex items-center text-blue-600">
                              <Coins className="w-4 h-4 mr-1" />
                              <span className="text-sm font-medium">{rewardPoints}P</span>
                            </div>
                          )}
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                          {experienceName}
                        </h3>
                        
                        <p className="text-blue-600 font-medium mb-2">{brandName}</p>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                          {description}
                        </p>

                        <div className="space-y-2 mb-4">
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>
                              {getDeadlineDisplay(applicationDeadline)}
                            </span>
                          </div>
                          
                          {experienceLocation && (
                            <div className="flex items-center text-sm text-gray-500">
                              <MapPin className="w-4 h-4 mr-2" />
                              <span>{experienceLocation}</span>
                            </div>
                          )}
                        </div>

                        <Link
                          to={`/experiences/${experienceId}`}
                          className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                        >
                          자세히 보기
                        </Link>
                      </div>
                    </div>
                  )
                } catch (renderError) {
                  console.error(`체험단 항목 렌더링 실패 [${index}]:`, renderError)
                  return null
                }
              })}
            </div>
          )}

          <div className="text-center mt-12">
            <Link
              to="/experiences"
              className="inline-flex items-center bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              모든 체험단 보기
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 특징 섹션 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">왜 올띵버킷인가요?</h2>
            <p className="text-xl text-gray-600">체험단 참여의 새로운 기준을 제시합니다</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Gift className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">다양한 체험 기회</h3>
              <p className="text-gray-600">
                뷰티, 패션, 식품, 전자제품 등 다양한 분야의 체험단에 참여할 수 있습니다
              </p>
            </div>

            <div className="text-center">
              <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Coins className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">포인트 리워드</h3>
              <p className="text-gray-600">
                체험 후 리뷰 작성시 포인트를 적립받고, 현금으로 출금할 수 있습니다
              </p>
            </div>

            <div className="text-center">
              <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <TrendingUp className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">간편한 관리</h3>
              <p className="text-gray-600">
                신청부터 리뷰 작성까지 모든 과정을 한 곳에서 편리하게 관리할 수 있습니다
              </p>
            </div>
          </div>
        </div>
      </section>

    </div>
  )
}

export default Home
