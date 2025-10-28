
import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import { useWishlist } from '../hooks/useWishlist'
import { ApplicationFormModal } from '../components/ApplicationFormModal'
import { setCampaignOGTags } from '../utils/ogTags'
import {Clock, ArrowLeft, CheckCircle, XCircle, AlertCircle, Share2, ChevronLeft, ChevronRight, ChevronUp, Heart, Hash, Info, Gift, Target, MessageSquare, Star, FileText, User, ExternalLink, X} from 'lucide-react'
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
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <div className="mb-4">
        <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center">
          <div className="p-1.5 bg-primary-500 rounded-lg mr-2">
            <FileText className="w-4 h-4 text-white" />
          </div>
          상세 이미지
        </h2>
        {detailImages.length > 0 && (
          <button
            onClick={onToggle}
            className="flex items-center text-primary-600 hover:text-primary-700 font-medium text-xs transition-colors duration-200"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="w-4 h-4 mr-1" />
                접기
              </>
            ) : (
              <>
                <span className="mr-1">+</span>
                더보기
              </>
            )}
          </button>
        )}
      </div>

      <div className="space-y-3">
        {detailImages.map((image: string, index: number) => (
          <div key={index} className="bg-slate-50 rounded-lg overflow-hidden">
            <img
              src={image}
              alt={`상세 이미지 ${index + 1}`}
              className={`w-full ${isExpanded ? 'h-auto object-contain' : 'h-80 object-cover object-top'}`}
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
  const [currentReviewPage, setCurrentReviewPage] = useState(1)
  const reviewsPerPage = 5
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageGallery, setImageGallery] = useState<string[]>([])

  // 이메일에서 사용자명 추출 헬퍼 함수
  const extractUsername = (email: string | null | undefined): string => {
    if (!email || typeof email !== 'string') return '익명'
    const atIndex = email.indexOf('@')
    if (atIndex === -1) return email
    return email.substring(0, atIndex)
  }
  
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
      const users = await dataService.entities.users.list()

      // 이 캠페인에 대한 신청 중 코멘트가 있는 것만 필터링
      const commentsWithApplicants = applications
        .filter((app: any) => {
          if (app.campaign_id !== id) return false

          // 루트 레벨과 application_data 둘 다 체크
          const rootComment = app.applicant_comment
          const dataComment = app.application_data?.applicant_comment

          const comment = rootComment || dataComment
          return comment && comment.trim() !== ''
        })
        .map((app: any) => {
          // user_id로 사용자 정보 찾기
          const user = users.find((u: any) => u.user_id === app.user_id)

          // applicant_comment를 루트 레벨 또는 application_data에서 가져오기
          const rootComment = app.applicant_comment
          const dataComment = app.application_data?.applicant_comment

          return {
            ...app,
            applicant_comment: rootComment || dataComment,
            user_email: user?.email || null
          }
        })
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
      const users = await dataService.entities.users.list()

      // review_submissions에서 blog_url 가져오기
      const reviewSubmissions = await (dataService.entities as any).review_submissions?.list() || []

      // 이 캠페인에 대한 리뷰만 필터링
      const campaignReviews = allReviews
        .filter((review: any) => review.campaign_id === id || review.experience_id === id)
        .map((review: any) => {
          // user_id로 사용자 정보 찾기
          const user = users.find((u: any) => u.user_id === review.user_id)

          // review_id로 submission 데이터 찾기 (blog_url 가져오기)
          const submission = Array.isArray(reviewSubmissions)
            ? reviewSubmissions.find((s: any) => s.review_id === review.review_id)
            : null

          return {
            ...review,
            user_email: user?.email || null,
            blog_url: submission?.blog_url || review.blog_url || null
          }
        })
        .sort((a: any, b: any) => {
          // submitted_at 또는 updated_at 또는 created_at 사용
          const dateA = new Date(a.submitted_at || a.updated_at || a.created_at || 0).getTime()
          const dateB = new Date(b.submitted_at || b.updated_at || b.created_at || 0).getTime()
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

        // 🔥 실제 신청자 수 계산
        const applications = await (dataService.entities as any).user_applications.list()
        const campaignApplications = applications.filter((app: any) =>
          app.campaign_id === id
        )
        const actualCount = campaignApplications.length

        // 캠페인 데이터에 실제 신청자 수 추가
        const campaignWithCount = {
          ...campaignData,
          current_participants: actualCount,
          current_applicants: actualCount
        }

        setCampaign(campaignWithCount)

        // 🔥 OG 태그 설정 (카카오톡 링크 공유용)
        if (campaignWithCount) {
          setCampaignOGTags(campaignWithCount)
        }

        // 🔥 신청 상태 체크
        if (isAuthenticated && user?.user_id && campaignWithCount) {
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <div className="absolute inset-0 rounded-full h-20 w-20 border-t-4 border-indigo-400 mx-auto animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
          </div>
          <p className="text-slate-700 font-semibold text-lg">캠페인 정보를 불러오는 중...</p>
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
          color: 'bg-blue-100 text-primary-800',
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
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-white to-beige-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 뒤로가기 버튼 */}
        <div className="flex justify-between items-center mb-6">
          <button
            onClick={() => navigate(-1)}
            className="group flex items-center text-slate-600 hover:text-primary-600 transition-all duration-200 hover:-translate-x-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:animate-pulse" />
            <span className="font-medium text-sm">뒤로가기</span>
          </button>

          <div className="flex space-x-2">
            <button
              onClick={handleWishlist}
              className={`group flex items-center space-x-1.5 px-3 py-2 rounded-lg transition-all duration-200 text-sm ${
                isWishlisted(id || '')
                  ? 'bg-primary-500 text-white hover:bg-primary-600'
                  : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isWishlisted(id || '') ? 'fill-current' : ''}`} />
              <span className="font-medium">찜</span>
            </button>
            <button
              onClick={handleShare}
              className="group flex items-center space-x-1.5 px-3 py-2 bg-white text-slate-700 rounded-lg hover:bg-slate-50 transition-all duration-200 border border-slate-200 text-sm"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span className="font-medium">공유</span>
            </button>
          </div>
        </div>

        {/* 전체 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼: 탭 네비게이션 + 탭 컨텐츠 */}
          <div className="lg:col-span-2">
            {/* 탭 네비게이션 */}
            <div className="bg-white rounded-xl border border-slate-200 mb-6 overflow-hidden">
              <div className="flex border-b border-slate-200">
                <button
                  onClick={() => handleTabChange('info')}
                  className={`group flex-1 flex items-center justify-center space-x-1.5 px-4 py-3 font-medium transition-all duration-200 relative text-sm ${
                    activeTab === 'info'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {activeTab === 'info' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                  <Info className={`w-4 h-4 ${activeTab === 'info' ? 'text-primary-600' : ''}`} />
                  <span>캠페인정보</span>
                </button>
                <button
                  onClick={() => handleTabChange('comments')}
                  className={`group flex-1 flex items-center justify-center space-x-1.5 px-4 py-3 font-medium transition-all duration-200 relative text-sm ${
                    activeTab === 'comments'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {activeTab === 'comments' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                  <MessageSquare className={`w-4 h-4 ${activeTab === 'comments' ? 'text-primary-600' : ''}`} />
                  <span>신청 한줄평</span>
                  {applicantComments.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-gold-500 text-white rounded-full text-xs font-bold">
                      {applicantComments.length}
                    </span>
                  )}
                </button>
                <button
                  onClick={() => handleTabChange('reviews')}
                  className={`group flex-1 flex items-center justify-center space-x-1.5 px-4 py-3 font-medium transition-all duration-200 relative text-sm ${
                    activeTab === 'reviews'
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  {activeTab === 'reviews' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
                  )}
                  <Star className={`w-4 h-4 ${activeTab === 'reviews' ? 'text-primary-600' : ''}`} />
                  <span>리뷰</span>
                  {reviews.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-gold-500 text-white rounded-full text-xs font-bold">
                      {reviews.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* 캠페인정보 탭에서만 보이는 메인 이미지 및 제품 정보 */}
            {activeTab === 'info' && (
            <div className="bg-white rounded-xl overflow-hidden mb-6 border border-slate-200">
              {/* 🔥 메인 이미지 갤러리 */}
              {displayMainImages.length > 0 && (
                <div className="aspect-video bg-slate-100 relative overflow-hidden group">
                  <img
                    src={displayMainImages[currentMainImageIndex] || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
                    alt={`${productName} 메인 이미지 ${currentMainImageIndex + 1}`}
                    className="w-full h-full object-cover transition-transform duration-500"
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
                        className="absolute left-3 top-1/2 transform -translate-y-1/2 bg-white/80 text-slate-800 p-2 rounded-full hover:bg-white transition-all duration-200"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setCurrentMainImageIndex(prev =>
                          prev === displayMainImages.length - 1 ? 0 : prev + 1
                        )}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-white/80 text-slate-800 p-2 rounded-full hover:bg-white transition-all duration-200"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>

                      {/* 이미지 카운터 */}
                      <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur text-white px-3 py-1 rounded-lg text-xs font-medium">
                        {currentMainImageIndex + 1} / {displayMainImages.length}
                      </div>
                    </>
                  )}

                  {/* 상태 배지 */}
                  <div className="absolute top-4 left-4">
                    <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold backdrop-blur ${
                      applicationDeadline && getDeadlineDisplay(applicationDeadline) !== '마감일 미정'
                        ? getDeadlineDisplay(applicationDeadline) === '마감됨'
                          ? 'bg-slate-800/80 text-white'
                          : 'bg-primary-500/90 text-white'
                        : statusInfo.color
                    }`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {applicationDeadline && getDeadlineDisplay(applicationDeadline) !== '마감일 미정'
                        ? getDeadlineDisplay(applicationDeadline)
                        : 'D-7'}
                    </span>
                  </div>

                  {/* 🔥 신청 상태 표시 */}
                  {applicationStatus && (
                    <div className="absolute bottom-4 right-4">
                      <span className={`inline-flex items-center px-3 py-1 rounded-lg text-xs font-bold backdrop-blur ${getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).color}`}>
                        {React.createElement(getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).icon, { className: "w-3 h-3 mr-1" })}
                        {getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).label}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* 썸네일 갤러리 */}
              {displayMainImages.length > 1 && (
                <div className="bg-slate-50 p-4 border-t border-slate-200">
                  <div className="flex space-x-2 overflow-x-auto pb-1">
                    {displayMainImages.map((imageUrl, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentMainImageIndex(index)}
                        className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden transition-all duration-200 ${
                          index === currentMainImageIndex
                            ? 'ring-2 ring-primary-500'
                            : 'ring-1 ring-slate-200 hover:ring-slate-300'
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
                    <span className="text-base font-bold text-navy-700">{brandName}</span>
                  </div>
                  {isAuthenticated && (
                    <button
                      onClick={() => toggleWishlist(id || '')}
                      className="p-2 rounded-full hover:bg-slate-100 transition-all duration-200"
                    >
                      <Heart
                        className={`w-5 h-5 ${
                          wishlist.some(item => item.campaign_id === id)
                            ? 'text-primary-500 fill-current'
                            : 'text-slate-400'
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* 제품명 */}
                <h1 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                  {productName}
                </h1>

                {/* 캠페인 설명 */}
                <p className="text-sm text-slate-600 mb-4 leading-relaxed">
                  {description}
                </p>

                {/* 플랫폼 및 배송 정보 */}
                <div className="flex items-center space-x-2">
                  <span className="px-3 py-1 bg-navy-50 text-navy-700 rounded-lg text-xs font-medium">
                    {platform}
                  </span>
                  <span className="px-3 py-1 bg-beige-200 text-beige-900 rounded-lg text-xs font-medium">
                    {deliveryType}
                  </span>
                </div>
              </div>
            </div>
            )}

            {/* 캠페인 정보 탭 */}
            {activeTab === 'info' && (
              <div className="space-y-4">
                {/* 상세 이미지 갤러리 */}
                <DetailImageGallery
                  campaign={campaign}
                  isExpanded={isDetailImagesExpanded}
                  onToggle={toggleDetailImages}
                />

                {/* 제공내역 */}
                {providedItems && providedItems !== '제품 제공' && (
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
                      <div className="p-1.5 bg-navy-500 rounded-lg mr-2">
                        <Gift className="w-4 h-4 text-white" />
                      </div>
                      제공내역
                    </h2>
                    <div
                      className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed text-sm"
                      dangerouslySetInnerHTML={{
                        __html: providedItems.includes('<p>') || providedItems.includes('<br>')
                          ? providedItems
                          : providedItems.replace(/\n/g, '<br>')
                      }}
                    />
                  </div>
                )}

                {/* 키워드 */}
                {keywords.length > 0 && (
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-base font-bold text-slate-900 flex items-center">
                        <div className="p-1.5 bg-gold-500 rounded-lg mr-2">
                          <Hash className="w-4 h-4 text-white" />
                        </div>
                        키워드
                      </h2>
                      <button
                        onClick={() => {
                          const keywordText = keywords.map(keyword => `#${keyword}`).join(' ')
                          navigator.clipboard.writeText(keywordText)
                          toast.success('키워드가 복사되었습니다!')
                        }}
                        className="px-3 py-1.5 bg-slate-800 text-white text-xs font-medium rounded-lg hover:bg-slate-900 transition-all duration-200"
                      >
                        복사
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {keywords.map((keyword, index) => (
                        <span key={index} className="px-3 py-1 bg-primary-50 text-primary-700 rounded-lg text-xs font-medium">
                          #{keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 리뷰 작성시 안내사항 */}
                {reviewGuidelines && (
                  <div className="bg-white rounded-xl p-6 border border-slate-200">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
                      <div className="p-1.5 bg-beige-600 rounded-lg mr-2">
                        <Target className="w-4 h-4 text-white" />
                      </div>
                      리뷰 작성 안내
                    </h2>
                    <div className="prose prose-sm prose-slate max-w-none">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm">
                        {reviewGuidelines}
                      </p>
                    </div>
                  </div>
                )}

                {/* 추가 안내사항 */}
                {additionalGuidelines && (
                  <div className="bg-beige-50 rounded-xl p-6 border border-beige-200">
                    <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center">
                      <div className="p-1.5 bg-primary-500 rounded-lg mr-2">
                        <AlertCircle className="w-4 h-4 text-white" />
                      </div>
                      추가 안내사항
                    </h2>
                    <div className="prose prose-sm prose-slate max-w-none">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-line text-sm font-medium">
                        {additionalGuidelines}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 신청 한줄평 탭 */}
            {activeTab === 'comments' && (
              <div>
            {loadingComments ? (
              <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-slate-200/60">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
                <p className="text-slate-600 font-medium text-lg">신청 한줄평을 불러오는 중...</p>
              </div>
            ) : applicantComments.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-slate-50 rounded-2xl shadow-xl p-16 text-center border border-slate-200/60">
                <div className="bg-gradient-to-br from-blue-100 to-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <MessageSquare className="w-12 h-12 text-blue-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">아직 신청 한줄평이 없습니다</h3>
                <p className="text-slate-600 text-lg">첫 번째로 캠페인에 신청하고 한줄평을 남겨보세요!</p>
              </div>
            ) : (
              <div className="space-y-5">
                {applicantComments.map((comment: any) => {
                  const displayName = extractUsername(comment.user_email)
                  return (
                  <div key={comment.application_id} className="bg-white rounded-2xl shadow-lg p-7 border border-slate-200/60 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                    <div className="flex items-start space-x-5">
                      {/* 사용자 아바타 */}
                      <div className="flex-shrink-0">
                        <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                      </div>

                      {/* 코멘트 내용 */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <h4 className="text-base font-bold text-slate-900">
                              {displayName}
                            </h4>
                            <span className="text-sm text-slate-500 font-medium">
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

                        <p className="text-slate-700 leading-relaxed whitespace-pre-line text-base">
                          {comment.applicant_comment}
                        </p>
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
              </div>
            )}

            {/* 리뷰 탭 */}
            {activeTab === 'reviews' && (
              <div>
            {loadingReviews ? (
              <div className="bg-white rounded-2xl shadow-xl p-16 text-center border border-slate-200/60">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-500 mx-auto mb-6"></div>
                <p className="text-slate-600 font-medium text-lg">리뷰를 불러오는 중...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="bg-gradient-to-br from-white to-amber-50 rounded-2xl shadow-xl p-16 text-center border border-slate-200/60">
                <div className="bg-gradient-to-br from-amber-100 to-yellow-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Star className="w-12 h-12 text-amber-600" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-3">아직 작성된 리뷰가 없습니다</h3>
                <p className="text-slate-600 text-lg">캠페인 승인 후 리뷰를 작성하면 이곳에 표시됩니다</p>
              </div>
            ) : (
              <>
                <div className="space-y-5">
                  {reviews
                    .slice((currentReviewPage - 1) * reviewsPerPage, currentReviewPage * reviewsPerPage)
                    .map((review: any) => {
                      const displayName = extractUsername(review.user_email || review.email)
                      return (
                    <div key={review.review_id} className="bg-white rounded-2xl shadow-lg p-7 border border-slate-200/60 transform transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                      <div className="flex items-start space-x-5">
                        {/* 사용자 아바타 */}
                        <div className="flex-shrink-0">
                          <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                        </div>

                        {/* 리뷰 내용 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <h4 className="text-base font-bold text-slate-900">
                                {displayName}
                              </h4>
                            <span className="text-sm text-slate-500 font-medium">
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
                            <div className="flex items-center space-x-1 mb-3">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= review.rating
                                      ? 'text-amber-400 fill-current drop-shadow-sm'
                                      : 'text-slate-300'
                                  }`}
                                />
                              ))}
                            </div>
                          )}
                        </div>

                        {/* 리뷰 제목 */}
                        {review.title && (
                          <h5 className="text-lg font-bold text-slate-900 mb-3">
                            {review.title}
                          </h5>
                        )}

                        {/* 리뷰 내용 */}
                        <p className="text-slate-700 leading-relaxed whitespace-pre-line mb-5 text-base">
                          {review.content || review.review_content}
                        </p>

                        {/* 블로그 URL - 강조 */}
                        {review.blog_url && (
                          <div className="mt-5">
                            <div className="bg-gradient-to-br from-navy-50 to-primary-50 rounded-lg p-5 border-2 border-primary-200">
                              <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center space-x-2">
                                  <div className="p-2 bg-primary-500 rounded-lg">
                                    <FileText className="w-5 h-5 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-sm font-bold text-slate-900">전체 블로그 리뷰</h4>
                                    <p className="text-xs text-slate-600">상세한 리뷰를 확인하세요</p>
                                  </div>
                                </div>
                                <a
                                  href={review.blog_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center space-x-1.5 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm transition-all duration-200"
                                >
                                  <span>블로그 보기</span>
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                              <div className="bg-white rounded-lg p-3 text-sm text-slate-700 break-all">
                                <a href={review.blog_url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                                  {review.blog_url}
                                </a>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* 리뷰 이미지들 - 블러 처리 */}
                        {review.images && review.images.length > 0 && (
                          <div className="mt-5">
                            <div className="bg-beige-50 border border-beige-200 rounded-lg p-4">
                              <div className="flex items-start space-x-3 mb-3">
                                <div className="p-2 bg-primary-100 rounded-lg flex-shrink-0">
                                  <FileText className="w-4 h-4 text-primary-600" />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-sm font-bold text-slate-900 mb-1">구매평 이미지</h4>
                                  <p className="text-xs text-slate-600">개인정보 보호를 위해 블러 처리되었습니다. 전체 리뷰는 블로그/SNS 링크에서 확인하세요.</p>
                                </div>
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                {review.images.slice(0, 3).map((imageUrl: string, index: number) => (
                                  <div key={index} className="aspect-square rounded-lg overflow-hidden bg-slate-100 relative">
                                    <img
                                      src={imageUrl}
                                      alt={`리뷰 이미지 ${index + 1}`}
                                      className="w-full h-full object-cover blur-md"
                                      onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300?text=이미지'
                                      }}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                                      <span className="text-white text-xs font-bold">블러 처리</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              {review.images.length > 3 && (
                                <p className="text-xs text-slate-500 mt-2 text-center">외 {review.images.length - 3}개</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* SNS 링크 - 강조 */}
                        {review.social_media_links && review.social_media_links.length > 0 && (
                          <div className="mt-5">
                            <div className="bg-gradient-to-br from-gold-50 to-beige-50 rounded-lg p-4 border border-gold-200">
                              <div className="flex items-center space-x-2 mb-3">
                                <div className="p-1.5 bg-gold-500 rounded-lg">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                                <h4 className="text-sm font-bold text-slate-900">SNS 리뷰</h4>
                              </div>
                              <div className="space-y-2">
                                {review.social_media_links.map((link: string, index: number) => (
                                  <a
                                    key={index}
                                    href={link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-slate-50 transition-all duration-200 group border border-slate-200"
                                  >
                                    <span className="text-xs text-slate-700 font-medium truncate flex-1">
                                      SNS 리뷰 {review.social_media_links.length > 1 ? `#${index + 1}` : ''}
                                    </span>
                                    <ExternalLink className="w-4 h-4 text-primary-600 group-hover:translate-x-1 transition-transform flex-shrink-0 ml-2" />
                                  </a>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                    )
                  })}
                </div>

                {/* 페이지네이션 */}
                {reviews.length > reviewsPerPage && (
                  <div className="flex justify-center items-center space-x-3 mt-10">
                    {Array.from({ length: Math.ceil(reviews.length / reviewsPerPage) }, (_, i) => i + 1).map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentReviewPage(pageNum)}
                        className={`px-5 py-3 rounded-xl font-bold transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105 ${
                          currentReviewPage === pageNum
                            ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                            : 'bg-white text-slate-700 hover:bg-slate-50 border-2 border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
              </div>
            )}
          </div>

          {/* 오른쪽 사이드바 - 항상 표시 */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-4">
              {/* 캠페인 정보 */}
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <h3 className="text-base font-bold text-slate-900 mb-4 flex items-center">
                  <div className="p-1.5 bg-primary-500 rounded-lg mr-2">
                    <Info className="w-4 h-4 text-white" />
                  </div>
                  캠페인 정보
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium text-xs">신청</span>
                    <span className="font-bold text-sm text-primary-600">{currentApplicants} / {recruitmentCount}</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium text-xs">리워드</span>
                    <span className="font-bold text-sm text-gold-600">{rewards} P</span>
                  </div>

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium flex-shrink-0 text-xs">신청기간</span>
                    <div className="text-right min-w-0 flex-1 ml-2">
                      <div className="font-semibold text-slate-900 whitespace-nowrap text-xs">
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

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium text-xs">발표일</span>
                    <span className="font-semibold text-slate-900 text-xs">
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

                  <div className="flex justify-between items-center py-2 border-b border-slate-100">
                    <span className="text-slate-600 font-medium flex-shrink-0 text-xs">리뷰기간</span>
                    <div className="text-right min-w-0 flex-1 ml-2">
                      <div className="font-semibold text-slate-900 whitespace-nowrap text-xs">
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
                    <span className="text-slate-600 font-medium text-xs">평가 마감</span>
                    <span className="font-semibold text-slate-900 text-xs">
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
              <div className="bg-white rounded-xl p-5 border border-slate-200">
                <div className="text-center mb-5">
                  <h3 className="text-base font-bold text-slate-900 mb-2">리뷰 신청하기</h3>
                  <div className="flex items-center justify-center space-x-2 text-xs font-medium">
                    <span className="text-slate-600">신청 <span className="text-primary-600 font-bold">{currentApplicants}</span></span>
                    <span className="text-slate-400">/</span>
                    <span className="text-slate-600">모집 <span className="text-navy-600 font-bold">{recruitmentCount}</span></span>
                  </div>
                </div>

                {/* 신청 버튼 */}
                <div className="space-y-3">
                  {applicationStatus ? (
                    <div className="text-center py-4">
                      <div className="mb-3">
                        <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold ${getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).color}`}>
                          {React.createElement(getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).icon, { className: "w-3 h-3 mr-1" })}
                          {getApplicationStatusInfo(safeString(applicationStatus, 'status', 'pending')).label}
                        </span>
                      </div>
                      <p className="text-slate-600 mb-3 text-xs font-medium">
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
                        className="w-full px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-medium text-sm"
                      >
                        내 신청 현황 보기
                      </button>
                    </div>
                  ) : safeString(campaign, 'status') === 'active' ? (
                    <button
                      onClick={handleApplyClick}
                      className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 font-bold text-sm"
                    >
                      리뷰 신청하기
                    </button>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-slate-600 mb-3 text-xs font-medium">현재 모집이 마감되었습니다</p>
                      <button
                        onClick={() => navigate('/experiences')}
                        className="px-4 py-2.5 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-all duration-200 font-medium text-sm"
                      >
                        다른 캠페인 보기
                      </button>
                    </div>
                  )}

                  <button
                    onClick={handleWishlist}
                    className={`w-full px-4 py-2.5 rounded-lg transition-all duration-200 font-medium text-sm ${
                      isWishlisted(id || '')
                        ? 'bg-primary-500 text-white hover:bg-primary-600'
                        : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
                    }`}
                  >
                    <Heart className={`w-4 h-4 inline mr-1.5 ${isWishlisted(id || '') ? 'fill-current' : ''}`} />
                    찜하기
                  </button>
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
        campaign={campaign}
        onSuccess={() => {
          setShowApplicationModal(false)
          setApplicationStatus({ status: 'submitted' })
        }}
      />

      {/* 이미지 모달 */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-fade-in"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-[90vh] w-full h-full flex items-center justify-center">
            {/* 닫기 버튼 */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-all duration-300 z-10 hover:scale-110"
            >
              <X className="w-6 h-6" />
            </button>

            {/* 이전 이미지 버튼 */}
            {imageGallery.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newIndex = selectedImageIndex === 0 ? imageGallery.length - 1 : selectedImageIndex - 1
                  setSelectedImageIndex(newIndex)
                  setSelectedImage(imageGallery[newIndex])
                }}
                className="absolute left-4 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-all duration-300 hover:scale-110"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}

            {/* 이미지 */}
            <div className="relative flex items-center justify-center w-full h-full">
              <img
                src={selectedImage}
                alt="전체 이미지"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
              {/* 이미지 카운터 */}
              {imageGallery.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold">
                  {selectedImageIndex + 1} / {imageGallery.length}
                </div>
              )}
            </div>

            {/* 다음 이미지 버튼 */}
            {imageGallery.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  const newIndex = selectedImageIndex === imageGallery.length - 1 ? 0 : selectedImageIndex + 1
                  setSelectedImageIndex(newIndex)
                  setSelectedImage(imageGallery[newIndex])
                }}
                className="absolute right-4 p-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-full transition-all duration-300 hover:scale-110"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default CampaignDetail
