import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import ApplicationFormModal from '../components/ApplicationFormModal'
import ReviewSubmissionManager from '../components/ReviewSubmissionManager'
import {Calendar, Gift, Clock, ArrowLeft, Target, Hash, Link, Info, Users, Coins, MapPin, ChevronDown, ChevronUp} from 'lucide-react'
import toast from 'react-hot-toast'


function ExperienceDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const { getCampaignById, getUserApplications } = useExperiences()
  
  const [loading, setLoading] = useState(true)
  const [experience, setExperience] = useState<any>(null)
  const [userApplication, setUserApplication] = useState<any>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [isApplicationClosed, setIsApplicationClosed] = useState(false)
  const [showAllDetailImages, setShowAllDetailImages] = useState(false)

  // 자동 스크롤 함수
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  // 🔥 D-Day 계산 함수
  const getDeadlineDisplay = (deadline: string) => {
    if (!deadline) {
      return '마감일 미정'
    }
    
    try {
      const deadlineDate = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      deadlineDate.setHours(0, 0, 0, 0)
      
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
      return '마감일 미정'
    }
  }

  // 체험단 정보 로드
  useEffect(() => {
    const loadExperience = async () => {
      if (!id) return
      
      try {
        console.log('🔍 체험단 상세 정보 로딩:', id)
        const experienceData = await getCampaignById(id)
        setExperience(experienceData)
        
        // 🔥 디버깅: 날짜 데이터 확인
        console.log('📅 체험단 날짜 데이터:', {
          application_end_date: (experienceData as any)?.application_end_date,
          application_deadline: (experienceData as any)?.application_deadline,
          content_end_date: (experienceData as any)?.content_end_date,
          review_deadline: (experienceData as any)?.review_deadline,
          end_date: (experienceData as any)?.end_date,
          allDateFields: Object.keys(experienceData || {}).filter(key => 
            key.includes('date') || key.includes('deadline')
          ).reduce((acc, key) => {
            acc[key] = (experienceData as any)?.[key]
            return acc
          }, {} as any)
        })
        
        // 🔥 캠페인 상태 체크 - status 필드 기준으로 수정
        const campaignStatus = (experienceData as any)?.status || 'active'
        
        console.log('🔍 캠페인 상태 체크:', {
          status: campaignStatus,
          application_end_date: (experienceData as any)?.application_end_date,
          application_end: (experienceData as any)?.application_end,
          max_participants: (experienceData as any)?.max_participants,
          current_participants: (experienceData as any)?.current_participants
        })
        
        // 캠페인 상태가 'closed'이거나 'inactive'인 경우에만 마감 처리
        if (campaignStatus === 'closed' || campaignStatus === 'inactive') {
          setIsApplicationClosed(true)
          console.log('🚫 캠페인 상태로 인한 신청 마감:', campaignStatus)
        } else if (campaignStatus === 'active' || campaignStatus === 'recruiting') {
          // 활성 상태인 경우 신청 가능
          setIsApplicationClosed(false)
          console.log('✅ 캠페인 활성 상태 - 신청 가능:', campaignStatus)
        } else {
          // 신청 마감일 체크
          const applicationEndDate = (experienceData as any)?.application_end_date || (experienceData as any)?.application_end
          if (applicationEndDate) {
            const endDate = new Date(applicationEndDate)
            const today = new Date()
            today.setHours(23, 59, 59, 999) // 오늘 마지막 시간으로 설정
            
            if (endDate < today) {
              setIsApplicationClosed(true)
              console.log('🚫 신청 마감일 초과로 인한 신청 마감:', applicationEndDate)
            }
          }
          
          // 최대 참가자 수 체크 (현재 참가자 수 기준)
          const maxParticipants = (experienceData as any)?.max_participants
          const currentParticipants = (experienceData as any)?.current_participants || 0
          
          if (maxParticipants && currentParticipants >= maxParticipants) {
            setIsApplicationClosed(true)
            console.log('🚫 최대 참가자 수 도달로 인한 신청 마감:', { currentParticipants, maxParticipants })
          }
        }
        
        console.log('✅ 체험단 상세 정보 로드 완료:', experienceData)
        console.log('🔍 체험단 상세 필드 확인:', {
          campaign_name: experienceData?.campaign_name,
          status: experienceData?.status,
          main_images: experienceData?.main_images,
          detail_images: experienceData?.detail_images,
          allFields: Object.keys(experienceData || {})
        })
      } catch (error) {
        console.error('❌ 체험단 정보 로드 실패:', error)
        toast.error('체험단 정보를 불러오는데 실패했습니다.')
      } finally {
        setLoading(false)
      }
    }

    loadExperience()
  }, [id, getCampaignById, getUserApplications])

  // 사용자 신청 상태 확인
  useEffect(() => {
    const checkApplicationStatus = async () => {
      if (!user?.user_id || !experience) return
      
      try {
        console.log('🔍 신청 상태 확인:', { userId: user.user_id, experienceId: experience._id })
        
        const applications = await getUserApplications(user.user_id)
        const userApp = applications.find((app: any) => 
          app.experience_id === experience._id || app.experience_id === experience.id
        )
        
        if (userApp) {
          console.log('✅ 기존 신청 발견:', userApp)
          setUserApplication(userApp)
        } else {
          console.log('ℹ️ 신청 내역 없음')
          setUserApplication(null)
        }
      } catch (error) {
        console.error('❌ 신청 상태 확인 실패:', error)
      }
    }

    checkApplicationStatus()
  }, [user, experience, getUserApplications])

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.')
      navigate('/login')
      return
    }
    setShowApplicationModal(true)
  }


  if (loading || !experience) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">체험단 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          뒤로가기
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* 체험단 이미지 */}
          <div className="aspect-video bg-gray-200 relative overflow-hidden">
            <img
              src={experience.image_url || experience.main_image || (experience.main_images && experience.main_images.length > 0 ? experience.main_images[0] : null) || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
              alt={experience.title || experience.experience_name || '체험단 이미지'}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
              }}
            />
            </div>

              {/* 체험단 정보 */}
              <div className="p-8">
                <div className="mb-6">
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {experience.campaign_name || experience.title || experience.experience_name || experience.name || '체험단 제목'}
            </h1>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      <span>모집마감: {getDeadlineDisplay(experience.application_end_date || experience.end_date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      <span>모집인원: {experience.max_participants || '제한없음'}명</span>
                    </div>
                    <div className="flex items-center">
                      <Coins className="w-4 h-4 mr-1" />
                      <span>리워드: {experience.reward_points || 0}P</span>
                    </div>
              </div>
            </div>

            {/* 캠페인 일정 정보 - 메인 영역 */}
            {(experience.application_start_date || experience.application_end_date || 
              experience.influencer_announcement_date || experience.content_start_date || 
              experience.content_end_date || experience.result_announcement_date) && (
              <div id="campaign-schedule" className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">캠페인 일정</h2>
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-xl p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* 리뷰어 신청기간 */}
                    {(experience.application_start_date || experience.application_end_date) && (
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">리뷰어 신청기간</span>
                        <span className="text-sm font-bold text-blue-600">
                          {experience.application_start_date && experience.application_end_date
                            ? `${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~ ${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                            : experience.application_start_date
                              ? `${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~`
                              : `~ ${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                          }
                        </span>
                      </div>
                    )}

                    {/* 선정자 발표 */}
                    {experience.influencer_announcement_date && (
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">선정자 발표</span>
                        <span className="text-sm font-bold text-green-600">
                          {new Date(experience.influencer_announcement_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}({new Date(experience.influencer_announcement_date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                        </span>
                      </div>
                    )}

                    {/* 리뷰 등록기간 */}
                    {(experience.content_start_date || experience.content_end_date) && (
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">리뷰 등록기간</span>
                        <span className="text-sm font-bold text-purple-600">
                          {experience.content_start_date && experience.content_end_date
                            ? `${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~ ${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                            : experience.content_start_date
                              ? `${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~`
                              : `~ ${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                          }
                        </span>
                      </div>
                    )}

                    {/* 캠페인 결과발표 */}
                    {experience.result_announcement_date && (
                      <div className="flex items-center justify-between py-3 px-4 bg-white rounded-lg shadow-sm">
                        <span className="text-sm font-semibold text-gray-700">캠페인 결과발표</span>
                        <span className="text-sm font-bold text-orange-600">
                          {new Date(experience.result_announcement_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}({new Date(experience.result_announcement_date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 체험단 설명 */}
            <div id="campaign-info" className="mb-8">
              <h2 className="text-xl font-bold text-gray-900 mb-4">체험단 소개</h2>
              <div className="prose prose-gray max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                  {experience.description || '체험단 설명이 없습니다.'}
                </p>
              </div>
            </div>

            {/* 상세 이미지 갤러리 - 댕댕뷰 스타일 */}
            {experience.detail_images && experience.detail_images.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-4">상세 이미지</h2>
                <div className="space-y-4">
                  {(showAllDetailImages ? experience.detail_images : experience.detail_images.slice(0, 5)).map((image: string, index: number) => (
                    <div key={index} className="w-full bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={image}
                        alt={`상세 이미지 ${index + 1}`}
                        className="w-full h-auto object-contain cursor-pointer hover:opacity-90 transition-opacity duration-300"
                        onClick={() => {
                          // 이미지 확대 보기
                          window.open(image, '_blank')
                        }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </div>
                  ))}
                </div>
                {experience.detail_images.length > 5 && (
                  <div className="text-center mt-4">
                    <button
                      onClick={() => setShowAllDetailImages(!showAllDetailImages)}
                      className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      {showAllDetailImages ? (
                        <>
                          <ChevronUp className="w-4 h-4 mr-2" />
                          상세이미지 접기
                        </>
                      ) : (
                        <>
                          <ChevronDown className="w-4 h-4 mr-2" />
                          상세이미지 더보기 ({experience.detail_images.length - 5}장 더)
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

                {/* 추가 정보 */}
                {(experience.application_deadline || experience.review_deadline || 
                  experience.experience_location || experience.experience_period) && (
            <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">추가 정보</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 신청 마감일 */}
                        {(experience.application_end_date || experience.application_deadline) && (
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-red-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">신청 마감일</p>
                              <p className="text-sm text-gray-600">
                                {new Date(experience.application_end_date || experience.application_deadline).toLocaleDateString('ko-KR', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit' 
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 리뷰 마감일 */}
                        {(experience.content_end_date || experience.review_deadline) && (
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-orange-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">리뷰 마감일</p>
                              <p className="text-sm text-gray-600">
                                {new Date(experience.content_end_date || experience.review_deadline).toLocaleDateString('ko-KR', { 
                                  year: 'numeric', 
                                  month: '2-digit', 
                                  day: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        )}

                        {/* 체험 지역 */}
                        {experience.experience_location && (
                          <div className="flex items-center space-x-3">
                            <MapPin className="w-5 h-5 text-blue-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">체험 지역</p>
                              <p className="text-sm text-gray-600">{experience.experience_location}</p>
                            </div>
                          </div>
                        )}

                        {/* 체험 기간 */}
                        {experience.experience_period && (
                          <div className="flex items-center space-x-3">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">체험 기간</p>
                              <p className="text-sm text-gray-600">{experience.experience_period}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}


                {/* 리치 텍스트 콘텐츠 섹션들 */}
                {experience.provided_items && (
                  <div id="provided-items" className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Gift className="w-5 h-5 mr-2 text-green-600" />
                      제공내역
                    </h2>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                      <div 
                        className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: experience.provided_items }}
                      />
                    </div>
                  </div>
                )}

                {experience.campaign_mission && (
                  <div id="campaign-mission" className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Target className="w-5 h-5 mr-2 text-blue-600" />
                      캠페인 미션
                    </h2>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                      <div 
                        className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: experience.campaign_mission }}
                      />
                    </div>
                  </div>
                )}

                {experience.keywords && (
                  <div id="keywords" className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Hash className="w-5 h-5 mr-2 text-purple-600" />
                      키워드
                    </h2>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                      <div className="flex flex-wrap gap-2">
                        {experience.keywords.split(',').map((keyword: string, index: number) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800"
                          >
                            #{keyword.trim()}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {experience.product_links && (
                  <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Link className="w-5 h-5 mr-2 text-indigo-600" />
                      링크
                    </h2>
                    <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6">
                      <a
                        href={experience.product_links}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-indigo-600 hover:text-indigo-800 underline break-all"
                      >
                        {experience.product_links}
                      </a>
                    </div>
                  </div>
                )}

                {experience.additional_guidelines && (
                  <div id="additional-guidelines" className="mb-8">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                      <Info className="w-5 h-5 mr-2 text-gray-600" />
                      추가 안내사항
                    </h2>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                      <div 
                        className="text-gray-700 leading-relaxed prose prose-sm max-w-none"
                        dangerouslySetInnerHTML={{ __html: experience.additional_guidelines }}
                      />
                    </div>
                  </div>
                )}

                {/* 액션 버튼 영역 */}
                <div className="border-t border-gray-200 pt-8">
                  <div className="flex flex-col sm:flex-row gap-4">
                    {isApplicationClosed ? (
                      <button
                        disabled
                        className="flex-1 px-8 py-4 bg-gray-400 text-white rounded-lg cursor-not-allowed font-medium text-lg"
                      >
                        신청 마감
                      </button>
                    ) : (
                      <button
                        onClick={handleApplyClick}
                        className="flex-1 px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-lg"
                      >
                        체험단 신청하기
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 오른쪽 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* 캠페인 일정 정보 - 댕댕뷰 스타일 */}
              {(experience.application_start_date || experience.application_end_date || 
                experience.influencer_announcement_date || experience.content_start_date || 
                experience.content_end_date || experience.result_announcement_date || 
                experience.current_applicants !== undefined) && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">캠페인 일정</h3>
                  <div className="space-y-3">
                    {/* 리뷰어 신청기간 */}
                    {(experience.application_start_date || experience.application_end_date) && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">리뷰어 신청기간</span>
                        <span className="text-sm text-gray-600 font-medium">
                          {experience.application_start_date && experience.application_end_date
                            ? `${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~ ${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                            : experience.application_start_date
                              ? `${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~`
                              : `~ ${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.application_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                          }
                        </span>
                      </div>
                    )}

                    {/* 선정자 발표 */}
                    {experience.influencer_announcement_date && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">선정자 발표</span>
                        <span className="text-sm text-gray-600 font-medium">
                          {new Date(experience.influencer_announcement_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}({new Date(experience.influencer_announcement_date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                        </span>
                      </div>
                    )}

                    {/* 리뷰 등록기간 */}
                    {(experience.content_start_date || experience.content_end_date) && (
                      <div className="flex items-center justify-between py-2 border-b border-gray-100">
                        <span className="text-sm font-medium text-gray-700">리뷰 등록기간</span>
                        <span className="text-sm text-gray-600 font-medium">
                          {experience.content_start_date && experience.content_end_date
                            ? `${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~ ${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                            : experience.content_start_date
                              ? `${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_start_date).toLocaleDateString('ko-KR', { weekday: 'short' })}) ~`
                              : `~ ${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}(${new Date(experience.content_end_date).toLocaleDateString('ko-KR', { weekday: 'short' })})`
                          }
                        </span>
                      </div>
                    )}

                    {/* 캠페인 결과발표 */}
                    {experience.result_announcement_date && (
                      <div className="flex items-center justify-between py-2">
                        <span className="text-sm font-medium text-gray-700">캠페인 결과발표</span>
                        <span className="text-sm text-gray-600 font-medium">
                          {new Date(experience.result_announcement_date).toLocaleDateString('ko-KR', { month: '2-digit', day: '2-digit' })}({new Date(experience.result_announcement_date).toLocaleDateString('ko-KR', { weekday: 'short' })})
                        </span>
                      </div>
                    )}

                    {/* 신청자 수 */}
                    {experience.current_applicants !== undefined && experience.max_participants && (
                      <div className="flex items-center justify-between py-2 border-t border-gray-200 mt-3 pt-3">
                        <span className="text-sm font-medium text-gray-700">신청자</span>
                        <span className="text-sm text-gray-600 font-medium">
                          <span className="text-blue-600 font-bold">{experience.current_applicants}</span> / <span className="font-bold">{experience.max_participants}</span>명
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 빠른 링크 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">빠른 링크</h3>
                <div className="space-y-2">
                  {/* 캠페인 일정 */}
                  {(experience.application_start_date || experience.application_end_date || 
                    experience.influencer_announcement_date || experience.content_start_date || 
                    experience.content_end_date || experience.result_announcement_date) && (
                    <button
                      onClick={() => scrollToSection('campaign-schedule')}
                      className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-indigo-50 transition-colors group"
                    >
                      <Calendar className="w-4 h-4 text-indigo-600 group-hover:text-indigo-700" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-indigo-700">캠페인 일정</span>
                    </button>
                  )}
                  
                  {/* 캠페인정보 */}
                  <button
                    onClick={() => scrollToSection('campaign-info')}
                    className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-blue-50 transition-colors group"
                  >
                    <Info className="w-4 h-4 text-blue-600 group-hover:text-blue-700" />
                    <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">캠페인정보</span>
                  </button>
                  
                  {experience.provided_items && (
                    <button
                      onClick={() => scrollToSection('provided-items')}
                      className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-green-50 transition-colors group"
                    >
                      <Gift className="w-4 h-4 text-green-600 group-hover:text-green-700" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-green-700">제공내역</span>
                    </button>
                  )}
                  {experience.keywords && (
                    <button
                      onClick={() => scrollToSection('keywords')}
                      className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-purple-50 transition-colors group"
                    >
                      <Hash className="w-4 h-4 text-purple-600 group-hover:text-purple-700" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-purple-700">키워드</span>
                    </button>
                  )}
                  {experience.campaign_mission && (
                    <button
                      onClick={() => scrollToSection('campaign-mission')}
                      className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-orange-50 transition-colors group"
                    >
                      <Target className="w-4 h-4 text-orange-600 group-hover:text-orange-700" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700">리뷰작성시 안내사항</span>
                    </button>
                  )}
                  {experience.additional_guidelines && (
                    <button
                      onClick={() => scrollToSection('additional-guidelines')}
                      className="w-full text-left flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors group"
                    >
                      <Info className="w-4 h-4 text-gray-600 group-hover:text-gray-700" />
                      <span className="text-sm font-medium text-gray-700 group-hover:text-gray-700">추가 안내사항</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 신청서 작성 모달 */}
      <ApplicationFormModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        experience={experience}
        onSuccess={() => {
          setShowApplicationModal(false)
          // 신청 상태 새로고침
          if (user?.user_id) {
            getUserApplications(user.user_id).then(applications => {
              const updatedApplication = applications.find((app: any) => 
                app.experience_id === experience._id
              )
              setUserApplication(updatedApplication)
            })
          }
        }}
      />

      {/* 리뷰 작성 모달 */}
      {showReviewModal && userApplication && (
        <ReviewSubmissionManager
          isOpen={showReviewModal}
          onClose={() => setShowReviewModal(false)}
          onSubmitComplete={() => {
            setShowReviewModal(false)
            // 신청 상태 새로고침
            if (user?.user_id) {
              getUserApplications(user.user_id).then(applications => {
                const updatedApplication = applications.find((app: any) => 
                  app.experience_id === experience._id
                )
                setUserApplication(updatedApplication)
              })
            }
          }}
          applicationId={userApplication._id}
          experienceId={experience._id}
          experienceName={experience.title || experience.experience_name}
        />
      )}
    </div>
  )
}

export default ExperienceDetail
