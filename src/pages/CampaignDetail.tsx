
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import { useWishlist } from '../hooks/useWishlist'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { setCampaignOGTags } from '../utils/ogTags'
import {Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, Share2, ChevronLeft, ChevronRight, ChevronUp, Heart, Hash, Info, Gift, Target, MessageSquare, Star, FileText, User} from 'lucide-react'
import toast from 'react-hot-toast'
import { dataService } from '../lib/dataService'

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

// 🔥 상세 이미지 갤러리 컴포넌트
const DetailImageGallery: React.FC<{
  campaign: any
  isExpanded: boolean
  onToggle: () => void
}> = ({ campaign, isExpanded, onToggle }) => {
  const detailImages = safeArray(campaign, 'detail_images')
  
  if (detailImages.length === 0) {
    return null
  }
  
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-gray-900 mb-2">상세 이미지</h2>
        {detailImages.length > 0 && (
          <button
            onClick={onToggle}
            className="flex items-center text-vintage-600 hover:text-vintage-700 font-medium text-sm"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                상세이미지 접기
              </>
            ) : (
              <>
                <span className="mr-1">+</span>
                상세이미지 더보기
              </>
            )}
          </button>
        )}
      </div>
      
      <div className="space-y-4">
        {detailImages.map((image: string, index: number) => (
          <div key={index} className="bg-gray-100 rounded-lg overflow-hidden">
            <img
              src={image}
              alt={`상세 이미지 ${index + 1}`}
              className={`w-full ${isExpanded ? 'h-auto object-contain' : 'h-96 object-cover object-top'}`}
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x300?text=이미지+로딩+실패'
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
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


const CampaignDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const { getCampaignById, checkDuplicateApplication, loading } = useExperiences()
  const { wishlist, toggleWishlist, isWishlisted } = useWishlist()

  const [campaign, setCampaign] = useState<any>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [applicationStatus, setApplicationStatus] = useState<any>(null)
  const [currentMainImageIndex, setCurrentMainImageIndex] = useState(0)
  const [isDetailImagesExpanded, setIsDetailImagesExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'info')
  const [applicantComments, setApplicantComments] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingReviews, setLoadingReviews] = useState(false)
  
  // 🔥 웹에서 찾은 방법: 토글 함수
  const toggleDetailImages = () => {
    console.log('🖼️ 토글 함수 호출:', {
      before: isDetailImagesExpanded,
      after: !isDetailImagesExpanded
    })
    setIsDetailImagesExpanded(!isDetailImagesExpanded)
  }

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({ tab })

    // 탭 변경 시 데이터 로드
    if (tab === 'comments' && applicantComments.length === 0) {
      loadApplicantComments()
    } else if (tab === 'reviews' && reviews.length === 0) {
      loadReviews()
    }
  }

  // 신청자 한마디 로드
  const loadApplicantComments = async () => {
    if (!id) return

    try {
      setLoadingComments(true)
      const applications = await dataService.entities.user_applications.list()

      // 이 캠페인에 대한 신청 중 코멘트가 있는 것만 필터링
      const commentsWithApplicants = applications
        .filter((app: any) =>
          app.campaign_id === id &&
          app.applicant_comment &&
          app.applicant_comment.trim() !== ''
        )
        .sort((a: any, b: any) => {
          const dateA = new Date(a.comment_created_at || a.created_at).getTime()
          const dateB = new Date(b.comment_created_at || b.created_at).getTime()
          return dateB - dateA
        })

      setApplicantComments(commentsWithApplicants)
    } catch (error) {
      console.error('❌ 신청자 한마디 로드 실패:', error)
      toast.error('신청자 한마디를 불러오는데 실패했습니다')
    } finally {
      setLoadingComments(false)
    }
  }

  // 리뷰 로드
  const loadReviews = async () => {
    if (!id) return

    try {
      setLoadingReviews(true)
      const allReviews = await dataService.entities.user_reviews.list()

      // 이 캠페인에 대한 리뷰만 필터링
      const campaignReviews = allReviews
        .filter((review: any) => review.campaign_id === id || review.experience_id === id)
        .sort((a: any, b: any) => {
          const dateA = new Date(a.created_at).getTime()
          const dateB = new Date(b.created_at).getTime()
          return dateB - dateA
        })

      setReviews(campaignReviews)
    } catch (error) {
      console.error('❌ 리뷰 로드 실패:', error)
      toast.error('리뷰를 불러오는데 실패했습니다')
    } finally {
      setLoadingReviews(false)
    }
  }

  // URL 파라미터 변경 시 탭 업데이트
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 🔥 디버깅: 상태 변화 추적
  useEffect(() => {
    console.log('🖼️ isDetailImagesExpanded 상태 변화:', isDetailImagesExpanded)
  }, [isDetailImagesExpanded])

  useEffect(() => {
    const loadCampaign = async () => {
      if (!id) return
      
      try {
        console.log('🔍 캠페인 상세 정보 로딩:', id)
        const campaignData = await getCampaignById(id)
        setCampaign(campaignData)
        
        // 🔥 OG 태그 설정 (카카오톡 링크 공유용)
        if (campaignData) {
          setCampaignOGTags(campaignData)
        }
        
        // 🔥 신청 상태 체크
        if (isAuthenticated && user?.user_id && campaignData) {
          const duplicateCheck = await checkDuplicateApplication(id, user.user_id)
          if (duplicateCheck.isDuplicate) {
            setApplicationStatus(duplicateCheck.existingApplication)
          }
        }
      } catch (error) {
        console.error('❌ 캠페인 상세 정보 로드 실패:', error)
        toast.error('캠페인 정보를 불러오는데 실패했습니다')
      }
    }

    loadCampaign()
  }, [id, getCampaignById, isAuthenticated, user?.user_id, checkDuplicateApplication])

  const handleApplyClick = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다')
      navigate('/login')
      return
    }

    if (!user?.user_id) {
      toast.error('사용자 정보가 없습니다')
      return
    }

    // 🔥 중복 신청 체크
    if (applicationStatus) {
      toast.error('이미 신청하신 체험단입니다')
      return
    }

    setShowApplicationModal(true)
  }


  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: campaign?.campaign_name || campaign?.experience_name || '체험단',
          text: campaign?.description || '',
          url: window.location.href
        })
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(window.location.href)
        toast.success('링크가 클립보드에 복사되었습니다')
      }
    } catch (error: any) {
      // 사용자가 공유를 취소한 경우 (AbortError)는 에러 메시지를 띄우지 않음
      if (error.name === 'AbortError') {
        console.log('공유가 취소되었습니다')
        return
      }

      console.error('공유 실패:', error)
      toast.error('공유에 실패했습니다')
    }
  }

  const handleWishlist = async () => {
    if (!id) return
    
    const success = await toggleWishlist(id)
    if (!success && !isAuthenticated) {
      navigate('/login')
    }
  }

  if (loading || !campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">캠페인 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'active':
        return {
          label: '모집중',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        }
      case 'closed':
        return {
          label: '마감',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        }
      case 'pending':
        return {
          label: '준비중',
          color: 'bg-yellow-100 text-yellow-800',
          icon: AlertCircle
        }
      default:
        return {
          label: '알 수 없음',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle
        }
    }
  }

  const getApplicationStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '승인 대기중',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock
        }
      case 'approved':
        return {
          label: '승인 완료',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        }
      case 'rejected':
        return {
          label: '반려됨',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        }
      default:
        return {
          label: '신청완료',
          color: 'bg-blue-100 text-vintage-800',
          icon: CheckCircle
        }
    }
  }

  const statusInfo = getStatusInfo(safeString(campaign, 'status', 'active'))
  const StatusIcon = statusInfo.icon

  const productName = safeString(campaign, 'product_name', safeString(campaign, 'experience_name', '제품명 없음'))
  const brandName = safeString(campaign, 'brand_name', '브랜드명 없음')
  const description = safeString(campaign, 'description', '설명 없음')
  const recruitmentCount = safeNumber(campaign, 'recruitment_count', safeNumber(campaign, 'max_participants', 10))
  const currentApplicants = safeNumber(campaign, 'current_applicants', 0)
  
  // 🔥 기간 설정에서 마감일 가져오기 - 다양한 필드명 시도
  const applicationDeadline = safeString(campaign, 'application_end_date') || 
                              safeString(campaign, 'application_deadline') ||
                              safeString(campaign, '신청_마감일') ||
                              safeString(campaign, 'application_end') ||
                              safeString(campaign, 'deadline')
                              
  const reviewDeadline = safeString(campaign, 'content_end_date') || 
                        safeString(campaign, 'review_deadline') ||
                        safeString(campaign, '리뷰_마감일') ||
                        safeString(campaign, 'content_end') ||
                        safeString(campaign, 'review_end')
  
  // 🔥 댕댕뷰 스타일 데이터
  const platform = safeString(campaign, 'platform', '인스타그램')
  const deliveryType = safeString(campaign, 'delivery_type', '배송형')
  const rewards = safeNumber(campaign, 'rewards', 0)
  const keywords = safeString(campaign, 'keywords', '').split(' ').filter(k => k.trim() !== '')
  const providedItems = safeString(campaign, 'provided_items', '제품 제공')
  const reviewGuidelines = safeString(campaign, 'review_guidelines', '')
  const additionalGuidelines = safeString(campaign, 'additional_info', '')
  
  // 🔥 디버깅: 실제 데이터 확인
  console.log('📅 캠페인 전체 데이터:', campaign)
  console.log('💰 리워드 데이터:', {
    rewardsRaw: safeNumber(campaign, 'rewards', 0),
    rewards: rewards,
    campaignRewards: campaign?.rewards,
    rewardsType: typeof campaign?.rewards
  })
  console.log('🔑 키워드 데이터:', {
    keywordsRaw: safeString(campaign, 'keywords', ''),
    keywordsArray: keywords,
    keywordsLength: keywords.length
  })
  console.log('📦 제공내역 데이터:', {
    providedItemsRaw: safeString(campaign, 'provided_items', ''),
    providedItems: providedItems
  })
  console.log('📋 리뷰 가이드라인 데이터:', {
    reviewGuidelinesRaw: safeString(campaign, 'review_guidelines', ''),
    reviewGuidelines: reviewGuidelines
  })
  console.log('ℹ️ 추가 정보 데이터:', {
    additionalInfoRaw: safeString(campaign, 'additional_info', ''),
    additionalGuidelines: additionalGuidelines
  })
  console.log('📅 캠페인 날짜 데이터:', {
    application_end: safeString(campaign, 'application_end'),
    content_start: safeString(campaign, 'content_start'),
    review_deadline: safeString(campaign, 'review_deadline'),
    experience_announcement: safeString(campaign, 'experience_announcement'),
    result_announcement: safeString(campaign, 'result_announcement'),
    applicationDeadline,
    reviewDeadline,
    allDateFields: Object.keys(campaign || {}).filter(key => 
      key.includes('date') || key.includes('deadline') || key.includes('announcement') || key.includes('start') || key.includes('end')
    ).reduce((acc, key) => {
      acc[key] = campaign[key]
      return acc
    }, {} as any)
  })
  
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

  // 🔥 상태 배지 디버깅
  console.log('🏷️ 상태 배지 디버깅:', {
    applicationDeadline,
    deadlineDisplay: applicationDeadline ? getDeadlineDisplay(applicationDeadline) : '마감일 미정',
    statusInfo: statusInfo.label,
    finalDisplay: applicationDeadline && getDeadlineDisplay(applicationDeadline) !== '마감일 미정' 
      ? getDeadlineDisplay(applicationDeadline)
      : statusInfo.label
  })
  // 🔥 이미지 관련 데이터
  const mainImages = safeArray(campaign, 'main_images')
  
  // 🔥 호환성을 위한 기본 이미지 처리
  const fallbackImage = safeString(campaign, 'main_image_url') || safeString(campaign, 'image_url')
  const displayMainImages = mainImages.length > 0 ? mainImages : (fallbackImage ? [fallbackImage] : [])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로가기
          </button>
          
          <div className="flex space-x-2">
            <button
              onClick={handleWishlist}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isWishlisted(id || '') 
                  ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Heart className={`w-4 h-4 ${isWishlisted(id || '') ? 'fill-current' : ''}`} />
              <span>찜하기</span>
            </button>
            <button
              onClick={handleShare}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>공유하기</span>
            </button>
          </div>
        </div>

        {/* 탭 네비게이션 */}
        <div className="bg-white rounded-xl shadow-sm mb-6">
          <div className="flex border-b">
            <button
              onClick={() => handleTabChange('info')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'info'
                  ? 'text-navy-600 border-b-2 border-navy-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Info className="w-5 h-5" />
              <span>캠페인정보</span>
            </button>
            <button
              onClick={() => handleTabChange('comments')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'comments'
                  ? 'text-navy-600 border-b-2 border-navy-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span>신청자 한마디</span>
              {applicantComments.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-navy-100 text-navy-700 rounded-full text-xs">
                  {applicantComments.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange('reviews')}
              className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
                activeTab === 'reviews'
                  ? 'text-navy-600 border-b-2 border-navy-600 bg-purple-50'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              <Star className="w-5 h-5" />
              <span>리뷰</span>
              {reviews.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-navy-100 text-navy-700 rounded-full text-xs">
                  {reviews.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        {activeTab === 'info' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 왼쪽: 이미지 및 기본 정보 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* 🔥 메인 이미지 갤러리 */}
              {displayMainImages.length > 0 && (
                <div className="aspect-video bg-gray-200 relative overflow-hidden">
                  <img
                    src={displayMainImages[currentMainImageIndex] || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
                    alt={`${productName} 메인 이미지 ${currentMainImageIndex + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
                    }}
                  />
                  
                  {/* 이미지 네비게이션 */}
                  {displayMainImages.length > 1 && (
                    <>
                      <button
                        onClick={() => setCurrentMainImageIndex(prev => 
                          prev === 0 ? displayMainImages.length - 1 : prev - 1
                        )}
                        className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setCurrentMainImageIndex(prev => 
                          prev === displayMainImages.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                      
                      {/* 이미지 카운터 */}
                      <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full text-sm">
                        {currentMainImageIndex + 1} / {displayMainImages.length}
                      </div>
                    </>
                  )}
                  
                  {/* 상태 배지 */}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      applicationDeadline && getDeadlineDisplay(applicationDeadline) !== '마감일 미정' 
                        ? getDeadlineDisplay(applicationDeadline) === '마감됨' 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-green-100 text-green-800'
                        : statusInfo.color
                    }`}>
                      <StatusIcon className="w-4 h-4 mr-1" />
                      {applicationDeadline && getDeadlineDisplay(applicationDeadline) !== '마감일 미정' 
                        ? getDeadlineDisplay(applicationDeadline)
                        : 'D-7'}
                    </span>
                  </div>
                  
                  {/* 🔥 신청 상태 표시 */}
                  {applicationStatus && (
                    <div className="absolute bottom-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).color}`}>
                        {React.createElement(getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).icon, { className: "w-4 h-4 mr-1" })}
                        {getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 썸네일 갤러리 */}
              {displayMainImages.length > 1 && (
                <div className="bg-gray-50 p-4 border-t">
                  <div className="flex space-x-2 overflow-x-auto pb-2">
                    {displayMainImages.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMainImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                          index === currentMainImageIndex 
                            ? 'border-vintage-500 ring-2 ring-blue-200' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <img
                          src={imageUrl}
                          alt={`썸네일 ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* 브랜드 정보 */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center">
                    <span className="text-lg font-medium text-gray-700">{brandName}</span>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => toggleWishlist(id || '')}
                      className="p-2 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <Heart 
                        className={`w-5 h-5 ${
                          wishlist.some(item => item.campaign_id === id) 
                            ? 'text-red-500 fill-current' 
                            : 'text-gray-400'
                        }`} 
                      />
                    </button>
                  )}
                </div>

                {/* 제품명 */}
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {productName}
                </h1>

                {/* 캠페인 설명 */}
                <p className="text-lg text-gray-600 mb-4">
                  {description}
                </p>

                {/* 플랫폼 및 배송 정보 */}
                <div className="flex items-center space-x-4 mb-4">
                  <span className="px-3 py-1 bg-blue-100 text-vintage-800 rounded-full text-sm font-medium">
                    {platform}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                    {deliveryType}
                  </span>
                </div>
              </div>
            </div>

            {/* 상세 정보 섹션들 */}
            <div className="space-y-6">
              {/* 상세 이미지 갤러리 - 새로 작성 */}
              <DetailImageGallery 
                campaign={campaign} 
                isExpanded={isDetailImagesExpanded} 
                onToggle={toggleDetailImages} 
              />


              {/* 제공내역 */}
              {providedItems && providedItems !== '제품 제공' && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2 text-green-600" />
                    제공내역
                  </h2>
                  <p className="text-gray-700">{providedItems}</p>
                </div>
              )}

              {/* 키워드 */}
              {keywords.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900 flex items-center">
                      <Hash className="w-5 h-5 mr-2 text-navy-600" />
                      키워드
                    </h2>
                    <button
                      onClick={() => {
                        const keywordText = keywords.map(keyword => `#${keyword}`).join(' ')
                        navigator.clipboard.writeText(keywordText)
                        toast.success('키워드가 복사되었습니다!')
                      }}
                      className="px-4 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      키워드복사
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {keywords.map((keyword, index) => (
                      <span key={index} className="px-3 py-1 bg-purple-100 text-navy-800 rounded-full text-sm">
                        #{keyword}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 리뷰 작성시 안내사항 */}
              {reviewGuidelines && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <Target className="w-5 h-5 mr-2 text-orange-600" />
                    리뷰 작성시 안내사항
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {reviewGuidelines}
                    </p>
                  </div>
                </div>
              )}

              {/* 추가 안내사항 */}
              {additionalGuidelines && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                    <AlertCircle className="w-5 h-5 mr-2 text-red-600" />
                    추가 안내사항
                  </h2>
                  <div className="prose prose-gray max-w-none">
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {additionalGuidelines}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 오른쪽 사이드바 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* 캠페인 정보 */}
              <div className="bg-white rounded-xl shadow-sm p-6 min-w-80">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                  <Info className="w-5 h-5 mr-2 text-vintage-600" />
                  캠페인 정보
                </h3>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">신청</span>
                    <span className="font-medium text-gray-900">{currentApplicants} / {recruitmentCount}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">리워드</span>
                    <span className="font-medium text-navy-600">{rewards} P</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex-shrink-0">캠페인 신청기간</span>
                    <div className="text-right min-w-0 flex-1 ml-4">
                      <div className="font-medium text-gray-900 whitespace-nowrap">
                        {(() => {
                          const startDate = safeString(campaign, 'application_start')
                          const endDate = safeString(campaign, 'application_end')
                          
                          const formatDate = (dateStr: string) => {
                            try {
                              const date = new Date(dateStr)
                              if (isNaN(date.getTime())) return '미정'
                              return date.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                              })
                            } catch {
                              return '미정'
                            }
                          }
                          
                          if (startDate && endDate) {
                            return `${formatDate(startDate)} ~ ${formatDate(endDate)}`
                          } else if (startDate) {
                            return `${formatDate(startDate)} ~ 미정`
                          } else if (endDate) {
                            return `미정 ~ ${formatDate(endDate)}`
                          }
                          return '미정'
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600">체험단 발표일</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const dateStr = safeString(campaign, 'experience_announcement')
                        if (!dateStr) return '미정'
                        
                        try {
                          const date = new Date(dateStr)
                          if (isNaN(date.getTime())) return '미정'
                          return date.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })
                        } catch {
                          return '미정'
                        }
                      })()}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 flex-shrink-0">캠페인 리뷰 기간</span>
                    <div className="text-right min-w-0 flex-1 ml-4">
                      <div className="font-medium text-gray-900 whitespace-nowrap">
                        {(() => {
                          const startDate = safeString(campaign, 'content_start')
                          const endDate = safeString(campaign, 'content_end')
                          
                          const formatDate = (dateStr: string) => {
                            try {
                              const date = new Date(dateStr)
                              if (isNaN(date.getTime())) return '미정'
                              return date.toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'numeric',
                                day: 'numeric'
                              })
                            } catch {
                              return '미정'
                            }
                          }
                          
                          if (startDate && endDate) {
                            return `${formatDate(startDate)} ~ ${formatDate(endDate)}`
                          } else if (startDate) {
                            return `${formatDate(startDate)} ~ 미정`
                          } else if (endDate) {
                            return `미정 ~ ${formatDate(endDate)}`
                          }
                          return '미정'
                        })()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600">캠페인 평가 마감일</span>
                    <span className="font-medium text-gray-900">
                      {(() => {
                        const dateStr = safeString(campaign, 'result_announcement')
                        if (!dateStr) return '미정'
                        
                        try {
                          const date = new Date(dateStr)
                          if (isNaN(date.getTime())) return '미정'
                          return date.toLocaleDateString('ko-KR', {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric'
                          })
                        } catch {
                          return '미정'
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>

              {/* 리뷰 신청 */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">리뷰 신청하기</h3>
                  <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
                    <span>신청 {currentApplicants}</span>
                    <span>/</span>
                    <span>모집 {recruitmentCount}</span>
                  </div>
                </div>

                {/* 신청 버튼 */}
                <div className="space-y-3">
                  {applicationStatus ? (
                    <div className="text-center py-4">
                      <div className="mb-4">
                        <span className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).color}`}>
                          {React.createElement(getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).icon, { className: "w-4 h-4 mr-1" })}
                          {getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).label}
                        </span>
                      </div>
                      <p className="text-gray-600 mb-4 text-sm">
                        {(() => {
                          const appliedAt = safeString(applicationStatus, 'applied_at') || safeString(applicationStatus, 'created_at')
                          if (appliedAt) {
                            try {
                              const date = new Date(appliedAt)
                              if (isNaN(date.getTime())) {
                                return '신청하셨습니다'
                              }
                              return `${date.toLocaleDateString('ko-KR')}에 신청하셨습니다`
                            } catch (error) {
                              return '신청하셨습니다'
                            }
                          }
                          return '신청하셨습니다'
                        })()}
                      </p>
                      <button
                        onClick={() => navigate('/my-applications')}
                        className="w-full px-4 py-2 text-vintage-600 hover:text-vintage-700 font-medium text-sm"
                      >
                        내 신청 현황 보기
                      </button>
                    </div>
                  ) : safeString(campaign, 'status') === 'active' ? (
                    <button
                      onClick={handleApplyClick}
                      className="w-full px-6 py-3 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      리뷰 신청하기
                    </button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-gray-600 mb-2 text-sm">현재 모집이 마감되었습니다</p>
                      <button
                        onClick={() => navigate('/experiences')}
                        className="text-vintage-600 hover:text-vintage-700 font-medium text-sm"
                      >
                        다른 캠페인 보기
                      </button>
                    </div>
                  )}
                  
                  <button
                    onClick={handleWishlist}
                    className={`w-full px-6 py-3 rounded-lg transition-colors font-medium ${
                      isWishlisted(id || '') 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 inline mr-2 ${isWishlisted(id || '') ? 'fill-current' : ''}`} />
                    찜하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* 신청자 한마디 탭 */}
        {activeTab === 'comments' && (
          <div className="max-w-4xl mx-auto">
            {loadingComments ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
                <p className="text-gray-600">신청자 한마디를 불러오는 중...</p>
              </div>
            ) : applicantComments.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 신청자 한마디가 없습니다</h3>
                <p className="text-gray-600">첫 번째로 캠페인에 신청하고 한마디를 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applicantComments.map((comment: any) => (
                  <div key={comment.application_id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start space-x-4">
                      {/* 사용자 아바타 */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(comment.applicant_name || comment.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* 코멘트 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {comment.applicant_name || comment.user_name || '익명'}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                const dateStr = comment.comment_created_at || comment.created_at
                                if (!dateStr) return '방금 전'

                                try {
                                  const date = new Date(dateStr)
                                  if (isNaN(date.getTime())) return '방금 전'

                                  const now = new Date()
                                  const diffMs = now.getTime() - date.getTime()
                                  const diffMins = Math.floor(diffMs / 60000)
                                  const diffHours = Math.floor(diffMs / 3600000)
                                  const diffDays = Math.floor(diffMs / 86400000)

                                  if (diffMins < 1) return '방금 전'
                                  if (diffMins < 60) return `${diffMins}분 전`
                                  if (diffHours < 24) return `${diffHours}시간 전`
                                  if (diffDays < 7) return `${diffDays}일 전`

                                  return date.toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                } catch {
                                  return '방금 전'
                                }
                              })()}
                            </span>
                          </div>
                        </div>

                        <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                          {comment.applicant_comment}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 리뷰 탭 */}
        {activeTab === 'reviews' && (
          <div className="max-w-4xl mx-auto">
            {loadingReviews ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
                <p className="text-gray-600">리뷰를 불러오는 중...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Star className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">아직 작성된 리뷰가 없습니다</h3>
                <p className="text-gray-600">캠페인 승인 후 리뷰를 작성하면 이곳에 표시됩니다</p>
              </div>
            ) : (
              <div className="space-y-6">
                {reviews.map((review: any) => (
                  <div key={review.review_id} className="bg-white rounded-xl shadow-sm p-6">
                    <div className="flex items-start space-x-4">
                      {/* 사용자 아바타 */}
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {(review.user_name || 'U').charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* 리뷰 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <h4 className="text-sm font-semibold text-gray-900">
                              {review.user_name || '익명'}
                            </h4>
                            <span className="text-xs text-gray-500">
                              {(() => {
                                const dateStr = review.created_at
                                if (!dateStr) return '방금 전'

                                try {
                                  const date = new Date(dateStr)
                                  if (isNaN(date.getTime())) return '방금 전'

                                  return date.toLocaleDateString('ko-KR', {
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })
                                } catch {
                                  return '방금 전'
                                }
                              })()}
                            </span>
                          </div>

                          {/* 별점 */}
                          {review.rating && (
                            <div className="flex items-center space-x-1">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= review.rating
                                      ? 'text-yellow-400 fill-current'
                                      : 'text-gray-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 리뷰 제목 */}
                        {review.title && (
                          <h5 className="text-base font-semibold text-gray-900 mb-2">
                            {review.title}
                          </h5>
                        )}

                        {/* 리뷰 내용 */}
                        <p className="text-gray-700 leading-relaxed whitespace-pre-line mb-4">
                          {review.content || review.review_content}
                        </p>

                        {/* 리뷰 이미지들 */}
                        {review.images && review.images.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4">
                            {review.images.map((imageUrl: string, index: number) => (
                              <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                                <img
                                  src={imageUrl}
                                  alt={`리뷰 이미지 ${index + 1}`}
                                  className="w-full h-full object-cover hover:scale-105 transition-transform cursor-pointer"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=이미지+로딩+실패'
                                  }}
                                />
                              </div>
                            ))}
                          </div>
                        )}

                        {/* SNS 링크 */}
                        {review.sns_url && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <a
                              href={review.sns_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center space-x-2 text-sm text-vintage-600 hover:text-vintage-700 font-medium"
                            >
                              <FileText className="w-4 h-4" />
                              <span>SNS에서 전체 리뷰 보기</span>
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      {/* 신청서 작성 모달 */}
      <ApplicationFormModal
        isOpen={showApplicationModal}
        onClose={() => setShowApplicationModal(false)}
        campaign={campaign}
        onSuccess={() => {
          setShowApplicationModal(false)
          setApplicationStatus({ status: 'submitted' })
        }}
      />
    </div>
  )
}

export default CampaignDetail
