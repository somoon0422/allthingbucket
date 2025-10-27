
import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import ReviewSubmissionManager from '../components/ReviewSubmissionManager'
import {Calendar, Gift, Clock, AlertCircle, CheckCircle, XCircle, Eye, FileText, Coins, User, Instagram, MessageSquare, ExternalLink, Trash2, Edit3, CalendarDays, RefreshCw, Package, AlertTriangle} from 'lucide-react'
import toast from 'react-hot-toast'
import { dataService } from '../lib/dataService'
import ChatBot from '../components/ChatBot'

// 🔥 ULTRA SAFE 배열 변환 - undefined.length 완전 차단
function ultraSafeArray<T>(value: any): T[] {
  try {
    // 1. null/undefined 즉시 차단
    if (value === null || value === undefined) {
      console.log('🛡️ ultraSafeArray: null/undefined → 빈 배열')
      return []
    }
    
    // 2. 이미 배열인 경우
    if (Array.isArray(value)) {
      try {
        const filtered = value.filter(item => item != null)
        console.log('🛡️ ultraSafeArray: 유효한 배열 →', filtered.length, '개 항목')
        return filtered
      } catch (filterError) {
        console.warn('⚠️ 배열 필터링 실패:', filterError)
        return []
      }
    }
    
    // 3. 객체에서 배열 속성 찾기
    if (typeof value === 'object' && value !== null) {
      console.log('🔍 ultraSafeArray: 객체에서 배열 속성 검색...')
      
      // 일반적인 배열 속성명들
      const arrayKeys = ['list', 'data', 'items', 'results', 'applications', 'experiences']
      
      for (const key of arrayKeys) {
        try {
          const candidate = value[key]
          if (candidate && Array.isArray(candidate)) {
            const filtered = candidate.filter((item: any) => item != null)
            console.log(`🛡️ ultraSafeArray: ${key}에서 배열 발견 →`, filtered.length, '개 항목')
            return filtered
          }
        } catch (keyError) {
          console.warn(`⚠️ ${key} 접근 실패:`, keyError)
          continue
        }
      }
      
      // Object.values로 배열 찾기
      try {
        const values = Object.values(value)
        for (const val of values) {
          if (Array.isArray(val)) {
            try {
              const filtered = val.filter((item: any) => item != null)
              console.log('🛡️ ultraSafeArray: Object.values에서 배열 발견 →', filtered.length, '개 항목')
              return filtered
            } catch (filterError) {
              console.warn('⚠️ Object.values 배열 필터링 실패:', filterError)
              continue
            }
          }
        }
      } catch (valuesError) {
        console.warn('⚠️ Object.values 실패:', valuesError)
      }
      
      console.log('❌ 객체에서 배열 속성을 찾지 못함')
      return []
    }
    
    // 4. 다른 타입들
    console.log('❌ 배열로 변환할 수 없는 타입:', typeof value)
    return []
    
  } catch (error) {
    console.error('❌ ultraSafeArray 완전 실패:', error)
    return []
  }
}

// 🔥 안전한 문자열 추출 - undefined 접근 차단
function safeString(obj: any, field: string, fallback = ''): string {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    return typeof value === 'string' ? value : fallback
  } catch {
    return fallback
  }
}

// 🔥 안전한 객체 접근 - undefined 차단
function safeObject(obj: any, field: string): any {
  try {
    if (!obj || typeof obj !== 'object') return null
    return obj[field] || null
  } catch {
    return null
  }
}

interface MyApplicationsProps {
  embedded?: boolean
}

const MyApplications: React.FC<MyApplicationsProps> = ({ embedded = false }) => {
  const navigate = useNavigate()
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { getUserApplications, cancelApplication } = useExperiences()
  
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  
  // 포인트 지급 요청 모달 상태
  const [showPointRequestModal, setShowPointRequestModal] = useState(false)
  const [selectedPointApplication, setSelectedPointApplication] = useState<any>(null)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  

  // 🔥 신청내역 로드 함수 - undefined.length 완전 차단
  const loadApplications = useCallback(async () => {
    try {
      setLoading(true)
      console.log('🔄 ===== 신청내역 로드 시작 =====')
      
      // 사용자 검증
      if (!user?.user_id) {
        console.log('❌ 사용자 ID 없음 - 로딩 중단')
        setApplications([])
        setLoading(false)
        return
      }

      console.log('👤 사용자 ID:', user.user_id)

      const userApplications = await getUserApplications(user.user_id)
      
      console.log('✅ 최종 데이터 처리 완료:', userApplications.length, '개')

      // 🔥 최종 안전 검증 후 설정
      const finalApplications = ultraSafeArray(userApplications)
      setApplications(finalApplications)
      
      console.log('🎯 ===== 신청내역 로드 완료 =====')
      console.log('📊 최종 설정된 신청내역:', finalApplications.length, '개')

    } catch (error) {
      console.error('❌ 신청내역 로드 실패:', error)
      toast.error('신청 내역을 불러오는데 실패했습니다')
      setApplications([]) // 오류 시에도 빈 배열로 안전하게 설정
    } finally {
      setLoading(false)
    }
  }, [user?.user_id, getUserApplications])

  // 🔥 컴포넌트 마운트 시 실행
  useEffect(() => {
    console.log('🔄 useEffect 실행:', { isAuthenticated, userId: user?.user_id, authLoading })
    
    // 인증 체크가 완료될 때까지 기다림
    if (authLoading) {
      console.log('⏳ 인증 체크 중...')
      return
    }
    
    if (isAuthenticated && user?.user_id) {
      loadApplications()
    } else {
      console.log('❌ 인증되지 않았거나 사용자 ID 없음')
      setApplications([]) // 안전한 초기화
      setLoading(false)
    }
  }, [isAuthenticated, user?.user_id, authLoading, loadApplications])

  // 🔥 자동 새로고침 (30초마다)
  useEffect(() => {
    if (!isAuthenticated || !user?.user_id) return

    const interval = setInterval(async () => {
      console.log('🔄 자동 새로고침 실행')
      try {
        const userApplications = await getUserApplications(user?.user_id)
        const finalApplications = ultraSafeArray(userApplications)
        setApplications(finalApplications)
        setLastRefresh(new Date())
      } catch (error) {
        console.error('자동 새로고침 실패:', error)
      }
    }, 30000) // 30초마다

    return () => clearInterval(interval)
  }, [isAuthenticated, user?.user_id, loadApplications])

  // 🔥 필터링된 신청 목록
  const filteredApplications = React.useMemo(() => {
    try {
      const safeApplicationsArray = ultraSafeArray(applications)
      
      if (statusFilter === 'all') {
        return safeApplicationsArray
      }
      
      return safeApplicationsArray.filter(app => {
        try {
          const status = safeString(app, 'status', 'pending')
          
          // 포인트 지급이 완료된 경우 "종료" 상태로 분류
          if (status === 'point_completed' || status === 'point_approved') {
            return statusFilter === 'completed'
          }
          
          // 기존 상태 매핑
          if (statusFilter === 'completed') {
            return status === 'completed' || status === 'point_completed' || status === 'point_approved'
          }
          
          return status === statusFilter
        } catch {
          return false
        }
      })
    } catch (error) {
      console.error('필터링 실패:', error)
      return []
    }
  }, [applications, statusFilter])


  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          label: '승인 대기',
          color: 'bg-yellow-100 text-yellow-800',
          icon: Clock
        }
      case 'approved':
        return {
          label: '선정완료',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        }
      case 'product_purchase_required':
        return {
          label: '제품구매 필요',
          color: 'bg-orange-100 text-orange-800',
          icon: Gift
        }
      case 'product_purchased':
        return {
          label: '제품구매완료',
          color: 'bg-blue-100 text-vintage-800',
          icon: CheckCircle
        }
      case 'shipping':
        return {
          label: '제품배송중',
          color: 'bg-purple-100 text-navy-800',
          icon: Calendar
        }
      case 'delivered':
        return {
          label: '제품수령완료',
          color: 'bg-indigo-100 text-navy-800',
          icon: CheckCircle
        }
      case 'review_verification':
        return {
          label: '리뷰인증 필요',
          color: 'bg-pink-100 text-pink-800',
          icon: FileText
        }
      case 'registered':
        return {
          label: '등록',
          color: 'bg-blue-100 text-vintage-800',
          icon: User
        }
      case 'completed':
        return {
          label: '종료',
          color: 'bg-purple-100 text-navy-800',
          icon: CheckCircle
        }
      case 'in_progress':
        return {
          label: '진행중',
          color: 'bg-blue-100 text-vintage-800',
          icon: CheckCircle
        }
      case 'review_submitted':
        return {
          label: '리뷰 제출됨',
          color: 'bg-blue-100 text-vintage-800',
          icon: FileText
        }
      case 'review_in_progress':
        return {
          label: '리뷰 검수중',
          color: 'bg-purple-100 text-navy-800',
          icon: FileText
        }
      case 'review_approved':
        return {
          label: '리뷰 승인됨',
          color: 'bg-green-100 text-green-800',
          icon: CheckCircle
        }
      case 'review_rejected':
        return {
          label: '리뷰 반려됨',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        }
      case 'review_resubmitted':
        return {
          label: '리뷰 보완 제출',
          color: 'bg-orange-100 text-orange-800',
          icon: RefreshCw
        }
      case 'review_completed':
        return {
          label: '리뷰 승인 완료 (포인트 지급 요청 가능)',
          color: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle
        }
      case 'point_requested':
        return {
          label: '포인트 지급 요청됨 (승인 대기중)',
          color: 'bg-orange-100 text-orange-800',
          icon: Coins
        }
      case 'point_approved':
        return {
          label: '포인트 지급 승인됨',
          color: 'bg-purple-100 text-navy-800',
          icon: CheckCircle
        }
      case 'point_completed':
        return {
          label: '🎉 캠페인 체험 종료 (포인트 지급 완료)',
          color: 'bg-gradient-to-r from-navy-100 to-pink-100 text-navy-900',
          icon: CheckCircle
        }
      case 'cancelled':
        return {
          label: '취소됨',
          color: 'bg-gray-100 text-gray-800',
          icon: XCircle
        }
      case 'rejected':
        return {
          label: '반려됨',
          color: 'bg-red-100 text-red-800',
          icon: XCircle
        }
      default:
        return {
          label: '알 수 없음',
          color: 'bg-gray-100 text-gray-800',
          icon: AlertCircle
        }
    }
  }

  // 🔥 D-day 계산 함수
  const calculateDDay = (approvedAt: string) => {
    try {
      const approvedDate = new Date(approvedAt)
      const today = new Date()
      
      // 승인일로부터 7일 후가 마감일
      const deadline = new Date(approvedDate.getTime() + 7 * 24 * 60 * 60 * 1000)
      
      const diffTime = deadline.getTime() - today.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      
      if (diffDays < 0) {
        return { days: 0, status: 'expired', text: '마감됨' }
      } else if (diffDays === 0) {
        return { days: 0, status: 'today', text: '오늘 마감' }
      } else if (diffDays <= 3) {
        return { days: diffDays, status: 'urgent', text: `D-${diffDays}` }
      } else {
        return { days: diffDays, status: 'normal', text: `D-${diffDays}` }
      }
    } catch (error) {
      return { days: 0, status: 'error', text: '계산 오류' }
    }
  }

  // 🔥 제품 구매 완료 처리
  const handleProductPurchaseComplete = async (application: any) => {
    try {
      if (!user?.user_id) {
        toast.error('로그인이 필요합니다')
        return
      }

      // 확인 다이얼로그
      if (!confirm('제품을 구매하셨나요?\n\n구매 완료 후에는 리뷰 작성이 가능합니다.\n이 작업은 되돌릴 수 없습니다.')) {
        return
      }

      const applicationId = application._id || application.id
      if (!applicationId) {
        toast.error('신청 정보를 찾을 수 없습니다')
        return
      }

      // 상태를 'product_purchased'로 업데이트
      const result = await dataService.entities.user_applications.update(applicationId, {
        status: 'product_purchased',
        updated_at: new Date().toISOString()
      })

      if (result) {
        toast.success('제품 구매 완료가 등록되었습니다!')
        // 신청 목록 새로고침
        loadApplications()
      } else {
        toast.error('제품 구매 완료 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('❌ 제품 구매 완료 처리 실패:', error)
      toast.error('제품 구매 완료 등록에 실패했습니다')
    }
  }

  // 🔥 제품 수령 완료 처리
  const handleProductDelivered = async (application: any) => {
    // 확인 다이얼로그
    if (!confirm('제품을 수령하셨나요?\n\n수령 완료 후에는 리뷰 작성이 가능합니다.\n이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      if (!user?.user_id) {
        toast.error('로그인이 필요합니다')
        return
      }

      const applicationId = application._id || application.id
      if (!applicationId) {
        toast.error('신청 정보를 찾을 수 없습니다')
        return
      }

      // 상태를 'delivered'로 업데이트
      const result = await dataService.entities.user_applications.update(applicationId, {
        status: 'delivered',
        updated_at: new Date().toISOString()
      })

      if (result) {
        toast.success('제품 수령 완료가 등록되었습니다!')
        // 신청 목록 새로고침
        loadApplications()
      } else {
        toast.error('제품 수령 완료 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('❌ 제품 수령 완료 처리 실패:', error)
      toast.error('제품 수령 완료 등록에 실패했습니다')
    }
  }

  // 🔥 리뷰 작성 모달 열기
  const handleWriteReview = (application: any) => {
    try {
      setSelectedApplication(application)
      setShowReviewModal(true)
    } catch (error) {
      console.error('❌ 리뷰 작성 모달 열기 실패:', error)
      toast.error('리뷰 작성 모달을 열 수 없습니다')
    }
  }


  const handleViewDetail = (application: any) => {
    try {
      if (!application || typeof application !== 'object') {
        console.warn('⚠️ 잘못된 신청 데이터:', application)
        toast.error('신청 정보를 불러올 수 없습니다')
        return
      }
      
      setSelectedApplication(application)
      setShowDetailModal(true)
    } catch (error) {
      console.error('❌ 상세보기 실패:', error)
      toast.error('상세 정보를 불러올 수 없습니다')
    }
  }

  // 🔥 캠페인 상세페이지로 이동 (수정됨)
  const handleViewCampaign = (application: any) => {
    try {
      // campaign_id 또는 experience_id 중 하나라도 있으면 사용
      const campaignId = safeString(application, 'campaign_id') || safeString(application, 'experience_id')
      
      if (campaignId) {
        console.log('🎯 캠페인 상세페이지로 이동:', campaignId)
        // CampaignDetail 컴포넌트로 이동
        navigate(`/campaign/${campaignId}`)
      } else {
        console.error('❌ campaign_id 또는 experience_id 없음:', application)
        toast.error('체험단 정보를 찾을 수 없습니다')
      }
    } catch (error) {
      console.error('❌ 캠페인 상세페이지 이동 실패:', error)
      toast.error('캠페인 페이지로 이동할 수 없습니다')
    }
  }

  const handleCancelClick = (application: any) => {
    try {
      if (!application || typeof application !== 'object') {
        toast.error('신청 정보를 불러올 수 없습니다')
        return
      }

      const status = safeString(application, 'status', 'pending')
      if (status !== 'pending') {
        toast.error('승인 대기중인 신청만 취소할 수 있습니다')
        return
      }
      
      setSelectedApplication(application)
      setShowCancelModal(true)
    } catch (error) {
      console.error('❌ 취소 모달 열기 실패:', error)
      toast.error('취소 기능을 사용할 수 없습니다')
    }
  }

  const handleConfirmCancel = async () => {
    try {
      if (!selectedApplication) return

      const applicationId = selectedApplication._id || selectedApplication.id
      if (!applicationId) {
        toast.error('신청 ID를 찾을 수 없습니다')
        return
      }

      const success = await cancelApplication(applicationId)
      if (success) {
        // 상태를 'cancelled'로 업데이트
        setApplications(prev => prev.map(app => 
          (app._id || app.id) === applicationId 
            ? { ...app, status: 'cancelled', cancelled_at: new Date().toISOString() }
            : app
        ))
        setShowCancelModal(false)
        setSelectedApplication(null)
        
        // 강제 새로고침으로 최신 상태 확인
        setTimeout(async () => {
          try {
            const userApplications = await getUserApplications(user?.user_id)
            const finalApplications = ultraSafeArray(userApplications)
            setApplications(finalApplications)
            setLastRefresh(new Date())
          } catch (error) {
            console.error('취소 후 새로고침 실패:', error)
          }
        }, 1000)
      }
    } catch (error) {
      console.error('❌ 신청 취소 실패:', error)
      toast.error('신청 취소에 실패했습니다')
    }
  }

  // 포인트 지급 요청 모달 열기
  const handleRequestPoints = (application: any) => {
    console.log('🔍 포인트 지급 요청 모달 열기 - 신청 데이터:', application)
    console.log('🔍 experience 데이터:', application.experience)
    console.log('🔍 campaignInfo 데이터:', application.campaignInfo)
    
    setSelectedPointApplication(application)
    setShowPointRequestModal(true)
  }

  // 포인트 지급 요청 최종 처리
  const handleConfirmPointRequest = async () => {
    if (!selectedPointApplication) return
    
    try {
      console.log('포인트 지급 요청 시작:', selectedPointApplication)
      
      const applicationId = selectedPointApplication.id || selectedPointApplication._id
      if (!applicationId) {
        toast.error('신청 ID를 찾을 수 없습니다')
        return
      }

      // 1. user_applications 테이블 상태 업데이트 (point_requested)
      try {
        const updateResult = await (dataService.entities as any).user_applications.update(applicationId, {
          status: 'point_requested',
          updated_at: new Date().toISOString()
        })
        console.log('✅ user_applications 상태 업데이트 완료: point_requested', updateResult)
      } catch (appUpdateError: any) {
        console.error('❌ user_applications 상태 업데이트 실패:', appUpdateError)
        console.error('에러 상세:', {
          message: appUpdateError.message,
          details: appUpdateError.details,
          hint: appUpdateError.hint,
          code: appUpdateError.code
        })
        toast.error('신청 상태 업데이트에 실패했습니다.')
        return
      }

      // 2. points_history 테이블에 요청 기록 추가
      try {
        const pointAmount = selectedPointApplication.experience?.rewards || 
                          selectedPointApplication.experience?.reward_points || 
                          selectedPointApplication.campaignInfo?.rewards ||
                          selectedPointApplication.campaignInfo?.point_reward || 
                          selectedPointApplication.point_reward || 
                          0
        
        const pointsData = {
          user_id: selectedPointApplication.user_id || user?.user_id,
          campaign_id: selectedPointApplication.campaign_id || selectedPointApplication.experience_id,
          points_amount: pointAmount,
          points_type: 'pending',
          status: 'pending',
          payment_status: '지급대기중', // 포인트 지급 상태 명시
          description: `캠페인 "${selectedPointApplication.experience_name || selectedPointApplication.campaign_name}" 포인트 지급 요청`,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        }
        
        console.log('📝 points_history 생성 데이터:', pointsData)
        const pointsResult = await (dataService.entities as any).points_history.create(pointsData)
        console.log('✅ points_history 요청 기록 추가 완료', pointsResult)
      } catch (pointsError: any) {
        console.error('❌ points_history 요청 기록 추가 실패:', pointsError)
        console.error('에러 상세:', {
          message: pointsError.message,
          details: pointsError.details,
          hint: pointsError.hint,
          code: pointsError.code
        })
        toast.error('포인트 기록 추가에 실패했습니다.')
        return
      }

      // 3. 관리자에게 포인트 지급 요청 알림 생성
      try {
        const notificationData = {
          type: 'point_request',
          title: '포인트 지급 요청',
          message: `${selectedPointApplication.name || user?.name || '사용자'}님이 포인트 지급을 요청했습니다.`,
          data: {
            application_id: applicationId,
            user_name: selectedPointApplication.name || user?.name,
            user_email: selectedPointApplication.email || user?.email,
            campaign_name: selectedPointApplication.experience_name || selectedPointApplication.campaign_name,
            point_amount: selectedPointApplication.experience?.rewards || 
                         selectedPointApplication.experience?.reward_points || 
                         selectedPointApplication.campaignInfo?.rewards ||
                         selectedPointApplication.campaignInfo?.point_reward || 
                         selectedPointApplication.point_reward || 
                         0
          },
          read: false,
          created_at: new Date().toISOString()
        }
        
        console.log('📝 admin_notifications 생성 데이터:', notificationData)
        const notificationResult = await (dataService.entities as any).admin_notifications.create(notificationData)
        console.log('✅ 관리자 알림 생성 완료: 포인트 지급 요청', notificationResult)
      } catch (notificationError: any) {
        console.error('❌ 관리자 알림 생성 실패:', notificationError)
        console.error('에러 상세:', {
          message: notificationError.message,
          details: notificationError.details,
          hint: notificationError.hint,
          code: notificationError.code
        })
        toast.error('관리자 알림 생성에 실패했습니다.')
        return
      }
      
      toast.success('포인트 지급 요청이 전송되었습니다.')
      setShowPointRequestModal(false)
      setSelectedPointApplication(null)
      
      // 신청 내역 새로고침
      setTimeout(async () => {
        try {
          const userApplications = await getUserApplications(user?.user_id)
          const finalApplications = ultraSafeArray(userApplications)
          setApplications(finalApplications)
          setLastRefresh(new Date())
        } catch (error) {
          console.error('신청 내역 새로고침 실패:', error)
        }
      }, 1000)
    } catch (error) {
      console.error('포인트 지급 요청 실패:', error)
      toast.error('포인트 지급 요청에 실패했습니다.')
    }
  }

  if (!isAuthenticated && !embedded) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600">신청 내역을 확인하려면 로그인해주세요.</p>
        </div>
      </div>
    )
  }

  if (loading || authLoading) {
    return (
      <div className={embedded ? 'flex justify-center items-center py-12' : 'min-h-screen bg-gray-50 flex items-center justify-center'}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">신청 내역을 불러오는 중...</p>
        </div>
      </div>
    )
  }

  const content = (
    <>
    <div className={embedded ? '' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8'}>
        {/* 헤더 */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">내 신청 내역</h1>
              <p className="mt-2 text-sm sm:text-base text-gray-600">
                체험단 신청 현황을 확인하고 관리하세요
              </p>
              <p className="mt-1 text-xs sm:text-sm text-gray-500">
                마지막 업데이트: {lastRefresh.toLocaleTimeString('ko-KR')}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                <User className="w-4 h-4" />
                <span>프로필 관리</span>
              </button>
              <button
                onClick={async () => {
                  try {
                    setLoading(true)
                    const userApplications = await getUserApplications(user?.user_id)
                    const finalApplications = ultraSafeArray(userApplications)
                    setApplications(finalApplications)
                    setLastRefresh(new Date())
                    toast.success('신청 내역을 새로고침했습니다')
                  } catch (error) {
                    console.error('새로고침 실패:', error)
                    toast.error('새로고침에 실패했습니다')
                  } finally {
                    setLoading(false)
                  }
                }}
                disabled={loading}
                className="flex items-center space-x-2 px-3 sm:px-4 py-2 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors text-sm sm:text-base"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>새로고침</span>
              </button>
            </div>
          </div>
        </div>

        {/* 상태 탭 */}
        <div className="mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {[
              { value: 'all', label: '전체', count: applications.length },
              { value: 'pending', label: '신청', count: applications.filter(app => app.status === 'pending').length },
              { value: 'approved', label: '선정완료', count: applications.filter(app => app.status === 'approved').length },
              { value: 'product_purchase_required', label: '제품구매', count: applications.filter(app => app.status === 'product_purchase_required').length },
              { value: 'product_purchased', label: '구매완료', count: applications.filter(app => app.status === 'product_purchased').length },
              { value: 'shipping', label: '배송중', count: applications.filter(app => app.status === 'shipping').length },
              { value: 'delivered', label: '수령완료', count: applications.filter(app => app.status === 'delivered').length },
              { value: 'review_verification', label: '리뷰인증', count: applications.filter(app => app.status === 'review_verification').length },
              { value: 'completed', label: '종료', count: applications.filter(app => 
                app.status === 'completed' || app.status === 'point_completed' || app.status === 'point_approved'
              ).length }
            ].map((tab) => (
              <button
                key={tab.value}
                onClick={() => setStatusFilter(tab.value)}
                className={`px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-200 ${
                  statusFilter === tab.value
                    ? 'bg-vintage-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  statusFilter === tab.value
                    ? 'bg-vintage-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>
          
          <div className="text-sm sm:text-base text-gray-600">
            {statusFilter === 'all' ? (
              <>총 <span className="font-semibold text-vintage-600">{filteredApplications.length}</span>개 신청</>
            ) : (
              <>{getStatusInfo(statusFilter).label} <span className="font-semibold text-vintage-600">{filteredApplications.length}</span>개</>
            )}
          </div>
        </div>

        {/* 프로세스 안내 박스 */}
        {filteredApplications.length > 0 && (
          <div className="bg-gradient-to-r from-vintage-50 to-navy-50 border border-blue-200 rounded-xl p-4 sm:p-6 mb-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-vintage-500 rounded-full flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3">
                  체험단 진행 프로세스 안내
                </h3>
                <div className="space-y-2.5 text-sm sm:text-base">
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-100 text-yellow-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                      1
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">선정완료:</span>
                      <span className="text-gray-700 ml-1">제품을 구매하신 후 '제품 구매 완료' 버튼을 클릭해주세요.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                      2
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">제품구매완료:</span>
                      <span className="text-gray-700 ml-1">관리자가 배송 정보를 등록하면 송장번호를 확인하실 수 있습니다.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-vintage-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                      3
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">제품배송중:</span>
                      <span className="text-gray-700 ml-1">제품을 받으시면 '제품 수령 완료' 버튼을 클릭해주세요.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                      4
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">제품수령완료:</span>
                      <span className="text-gray-700 ml-1">'리뷰 인증하기' 버튼을 통해 리뷰를 인증해주세요.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-100 text-navy-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                      5
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">리뷰 검수중:</span>
                      <span className="text-gray-700 ml-1">관리자가 리뷰를 검수합니다. 승인될 때까지 기다려주세요.</span>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-700 flex items-center justify-center text-xs font-semibold mt-0.5">
                      6
                    </div>
                    <div>
                      <span className="font-semibold text-gray-900">🎉 리뷰 승인 및 포인트 지급:</span>
                      <span className="text-gray-700 ml-1">관리자가 리뷰를 승인하면 포인트가 자동으로 지급됩니다!</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔥 안전한 배열 길이 체크 */}
        {!Array.isArray(filteredApplications) || filteredApplications.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-8 sm:p-12 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400" />
            </div>
            <h3 className="text-lg sm:text-xl font-medium text-gray-900 mb-2">
              {statusFilter === 'all' ? '신청 내역이 없습니다' : `${getStatusInfo(statusFilter).label} 신청이 없습니다`}
            </h3>
            <p className="text-sm sm:text-base text-gray-600 mb-6">
              {statusFilter === 'all' ? '아직 체험단에 신청하지 않으셨습니다.' : '다른 상태의 신청을 확인해보세요.'}
            </p>
            {statusFilter === 'all' && (
              <a
                href="/experiences"
                className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 bg-vintage-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                체험단 둘러보기
                <ExternalLink className="ml-2 w-4 h-4 sm:w-5 sm:h-5" />
              </a>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filteredApplications.map((application, index) => {
              try {
                if (!application || typeof application !== 'object') {
                  console.warn(`⚠️ 잘못된 신청 데이터 [${index}]:`, application)
                  return null
                }

                const applicationId = (application as any)._id || (application as any).id || `app-${index}`
                const status = safeString(application, 'status', 'pending')
                const statusInfo = getStatusInfo(status)
                const StatusIcon = statusInfo.icon
                
                const experienceData = safeObject(application, 'experience')
                const experienceName = experienceData ? 
                  (safeString(experienceData, 'campaign_name') || safeString(experienceData, 'product_name') || safeString(experienceData, 'experience_name', '체험단 정보 없음')) :
                  safeString(application, 'experience_name', '체험단 정보 없음')
                
                // 🔥 캠페인 마감 상태 체크
                const isExpiredCampaign = experienceData ? (() => {
                  // 1. 캠페인 상태 체크
                  const campaignStatus = experienceData.status || 'active'
                  if (campaignStatus === 'closed' || campaignStatus === 'inactive') {
                    return true
                  }
                  
                  // 2. 신청 마감일 체크
                  const applicationEndDate = experienceData.application_end_date || 
                                           experienceData.application_end ||
                                           experienceData.end_date
                  if (applicationEndDate) {
                    const endDate = new Date(applicationEndDate)
                    const today = new Date()
                    today.setHours(0, 0, 0, 0)
                    endDate.setHours(0, 0, 0, 0)
                    return today > endDate
                  }
                  
                  return false
                })() : false
                
                const brandName = experienceData ? safeString(experienceData, 'brand_name') : ''
                const rewardPoints = experienceData ? (experienceData.rewards || experienceData.reward_points || experienceData.point_reward || 0) : 0
                const imageUrl = experienceData ? safeString(experienceData, 'main_image_url') || safeString(experienceData, 'image_url') : ''
                
                const appliedAt = safeString(application, 'applied_at') || safeString(application, 'created_at')
                const processedAt = safeString(application, 'processed_at')
                const applicationReason = safeString(application, 'application_reason')
                
                // 🔥 D-day 계산 (승인된 경우만)
                const dDayInfo = (status === 'approved' || status === 'in_progress') && processedAt ? 
                  calculateDDay(processedAt) : null
                
                return (
                  <div
                    key={applicationId}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    <div className="p-4 sm:p-6">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                        <div className="flex-1">
                          {/* 체험단 정보 */}
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 mb-3">
                            <div className="flex items-center space-x-2 sm:space-x-3">
                              <Gift className="w-4 h-4 sm:w-5 sm:h-5 text-vintage-600 flex-shrink-0" />
                              <h3 className={`text-base sm:text-lg font-semibold line-clamp-2 ${isExpiredCampaign ? 'text-gray-500' : 'text-gray-900'}`}>
                                {experienceName}
                                {isExpiredCampaign && (
                                  <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                    마감
                                  </span>
                                )}
                              </h3>
                            </div>
                            <span className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${statusInfo.color} self-start`}>
                              <StatusIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                              {statusInfo.label}
                            </span>
                          </div>
                          
                          {brandName && (
                            <p className="text-sm sm:text-base text-gray-600 mb-2">
                              브랜드: {brandName}
                            </p>
                          )}
                          
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 mb-4">
                            {appliedAt && (
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>
                                  신청일: {new Date(appliedAt).toLocaleDateString('ko-KR')}
                                </span>
                              </div>
                            )}
                            
                            {rewardPoints > 0 && (
                              <div className="flex items-center space-x-1">
                                <Coins className="w-3 h-3 sm:w-4 sm:h-4" />
                                <span>리워드: {rewardPoints}P</span>
                              </div>
                            )}

                            {/* 🔥 D-day 표시 (승인된 경우만) */}
                            {dDayInfo && (
                              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                                dDayInfo.status === 'expired' ? 'bg-red-100 text-red-800' :
                                dDayInfo.status === 'today' ? 'bg-orange-100 text-orange-800' :
                                dDayInfo.status === 'urgent' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-vintage-800'
                              }`}>
                                <CalendarDays className="w-3 h-3" />
                                <span>리뷰 마감: {dDayInfo.text}</span>
                              </div>
                            )}
                          </div>
                          
                          {/* 신청 사유 미리보기 */}
                          {applicationReason && (
                            <div className="bg-gray-50 rounded-lg p-3 sm:p-4 mb-4 min-h-[60px] sm:min-h-[80px]">
                              <p className="text-xs sm:text-sm text-gray-700 line-clamp-3 sm:line-clamp-4 leading-relaxed">
                                {applicationReason}
                              </p>
                            </div>
                          )}
                        </div>
                        
                        {/* 이미지 */}
                        {imageUrl && (
                          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0 self-start">
                            <img
                              src={imageUrl}
                              alt={experienceName}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement
                                target.style.display = 'none'
                              }}
                            />
                          </div>
                        )}
                      </div>
                      
                      {/* 액션 버튼들 */}
                      <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => handleViewDetail(application)}
                            className="inline-flex items-center px-3 py-2 bg-vintage-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            <Eye className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">상세보기</span>
                            <span className="sm:hidden">상세</span>
                          </button>
                          
                          <button
                            onClick={() => handleViewCampaign(application)}
                            className="inline-flex items-center px-3 py-2 bg-gray-100 text-gray-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
                          >
                            <ExternalLink className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">체험단 보기</span>
                            <span className="sm:hidden">체험단</span>
                          </button>

                          {/* 🔥 포인트 지급 신청 버튼 (리뷰 승인완료된 경우) */}
                          {status === 'review_completed' && (
                            <button
                              onClick={() => handleRequestPoints(application)}
                              className="inline-flex items-center px-3 py-2 bg-yellow-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors"
                            >
                              <Gift className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">포인트 지급 신청</span>
                              <span className="sm:hidden">포인트</span>
                            </button>
                          )}

                          {/* 🔥 제품 구매 완료 버튼 (선정완료된 경우) */}
                          {status === 'approved' && (
                            <button
                              onClick={() => handleProductPurchaseComplete(application)}
                              className="inline-flex items-center px-3 py-2 bg-orange-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-orange-700 transition-colors"
                            >
                              <Gift className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">제품 구매 완료</span>
                              <span className="sm:hidden">구매완료</span>
                            </button>
                          )}

                          {/* 🔥 리뷰 수정 버튼 (리뷰 제출된 경우만) */}
                          {status === 'review_in_progress' && (
                            <button
                              onClick={() => handleWriteReview(application)}
                              className="inline-flex items-center px-3 py-2 bg-navy-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
                            >
                              <Edit3 className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">리뷰 수정하기</span>
                              <span className="sm:hidden">수정</span>
                            </button>
                          )}

                          {/* 🔥 배송 추적 정보 (배송중인 경우) */}
                          {status === 'shipping' && (application as any).tracking_number && (
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                              <div className="flex items-center space-x-2">
                                <Package className="w-4 h-4 text-vintage-600" />
                                <div>
                                  <p className="text-sm font-medium text-vintage-800">배송 추적 정보</p>
                                  <p className="text-xs text-vintage-600">
                                    {(application as any).courier && (application as any).courier !== 'other' ? 
                                      `${(application as any).courier}: ${(application as any).tracking_number}` : 
                                      `송장번호: ${(application as any).tracking_number}`
                                    }
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 🔥 제품 수령 완료 버튼 (배송중인 경우) */}
                          {status === 'shipping' && (
                            <button
                              onClick={() => handleProductDelivered(application)}
                              className="inline-flex items-center px-3 py-2 bg-navy-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                              <CheckCircle className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">제품 수령 완료</span>
                              <span className="sm:hidden">수령완료</span>
                            </button>
                          )}

                          {/* 🔥 리뷰 인증 버튼 (제품 수령 완료된 경우) */}
                          {status === 'delivered' && (
                            <button
                              onClick={() => handleWriteReview(application)}
                              className="inline-flex items-center px-3 py-2 bg-pink-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-pink-700 transition-colors"
                            >
                              <FileText className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">리뷰 인증하기</span>
                              <span className="sm:hidden">리뷰인증</span>
                            </button>
                          )}

                          {/* 🔥 반려 사유 표시 (리뷰 반려된 경우) */}
                          {status === 'review_rejected' && (application as any).rejection_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                              <div className="flex items-start space-x-2">
                                <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-red-800 mb-1">반려 사유</p>
                                  <p className="text-sm text-red-700 whitespace-pre-wrap">
                                    {(application as any).rejection_reason}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* 🔥 리뷰 수정 버튼 (리뷰 반려된 경우) */}
                          {status === 'review_rejected' && (
                            <button
                              onClick={() => handleWriteReview(application)}
                              className="inline-flex items-center px-3 py-2 bg-red-600 text-white text-xs sm:text-sm font-medium rounded-lg hover:bg-red-700 transition-colors"
                            >
                              <RefreshCw className="w-4 h-4 mr-1 sm:mr-2" />
                              <span className="hidden sm:inline">리뷰 수정하기</span>
                              <span className="sm:hidden">수정</span>
                            </button>
                          )}
                        </div>

                        {/* 취소 버튼 (승인 대기중인 경우만) */}
                        {status === 'pending' && (
                          <button
                            onClick={() => handleCancelClick(application)}
                            className="inline-flex items-center px-3 py-2 bg-red-100 text-red-700 text-xs sm:text-sm font-medium rounded-lg hover:bg-red-200 transition-colors self-start"
                          >
                            <Trash2 className="w-4 h-4 mr-1 sm:mr-2" />
                            <span className="hidden sm:inline">신청 취소</span>
                            <span className="sm:hidden">취소</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              } catch (renderError) {
                console.error(`❌ 신청 항목 렌더링 실패 [${index}]:`, renderError)
                return null
              }
            })}
          </div>
        )}
      </div>

      {/* 상세보기 모달 */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900">신청 상세 정보</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <XCircle className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>
              </div>
            </div>

            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* 체험단 정보 */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-bold mb-3 flex items-center text-sm sm:text-base text-gray-900">
                  <Gift className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-700" />
                  체험단 정보
                </h4>
                <div className="space-y-2">
                  <div className="text-sm sm:text-base text-gray-900">
                    <span className="font-medium text-gray-900">체험단명:</span>{' '}
                    <span className="text-gray-700">
                      {safeObject(selectedApplication, 'experience') ?
                        (safeString(safeObject(selectedApplication, 'experience'), 'campaign_name') ||
                         safeString(safeObject(selectedApplication, 'experience'), 'product_name') ||
                         safeString(safeObject(selectedApplication, 'experience'), 'experience_name', '정보 없음')) :
                        safeString(selectedApplication, 'experience_name', '정보 없음')}
                    </span>
                  </div>
                  {safeObject(selectedApplication, 'experience') && safeString(safeObject(selectedApplication, 'experience'), 'brand_name') && (
                    <div className="text-sm sm:text-base text-gray-900">
                      <span className="font-medium text-gray-900">브랜드:</span>{' '}
                      <span className="text-gray-700">{safeString(safeObject(selectedApplication, 'experience'), 'brand_name')}</span>
                    </div>
                  )}
                  {safeObject(selectedApplication, 'experience') && (() => {
                    const exp = safeObject(selectedApplication, 'experience')
                    const points = exp?.rewards || exp?.reward_points || 0
                    return points > 0 ? (
                      <div className="text-sm sm:text-base text-gray-900">
                        <span className="font-medium text-gray-900">리워드:</span>{' '}
                        <span className="text-gray-700">{points}P</span>
                      </div>
                    ) : null
                  })()}
                </div>
              </div>

              {/* 신청자 정보 */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-bold mb-3 flex items-center text-sm sm:text-base text-gray-900">
                  <User className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-gray-700" />
                  신청자 정보
                </h4>
                <div className="space-y-2">
                  <div className="text-sm sm:text-base text-gray-900"><span className="font-medium text-gray-900">이름:</span> <span className="text-gray-700">{safeString(selectedApplication, 'name', user?.name || '정보 없음')}</span></div>
                  <div className="text-sm sm:text-base text-gray-900"><span className="font-medium text-gray-900">이메일:</span> <span className="text-gray-700">{safeString(selectedApplication, 'email', user?.email || '정보 없음')}</span></div>
                  {safeString(selectedApplication, 'phone') && (
                    <div className="text-sm sm:text-base text-gray-900"><span className="font-medium text-gray-900">연락처:</span> <span className="text-gray-700">{safeString(selectedApplication, 'phone')}</span></div>
                  )}
                  {safeString(selectedApplication, 'address') && (
                    <div className="text-sm sm:text-base text-gray-900"><span className="font-medium text-gray-900">주소:</span> <span className="text-gray-700">{safeString(selectedApplication, 'address')}</span></div>
                  )}
                </div>
              </div>

              {/* SNS 정보 */}
              {(safeString(selectedApplication, 'instagram_handle') || safeString(selectedApplication, 'blog_url') || safeString(selectedApplication, 'youtube_channel')) && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-bold mb-3 text-sm sm:text-base text-gray-900">SNS 정보</h4>
                  <div className="space-y-2">
                    {safeString(selectedApplication, 'instagram_handle') && (
                      <div className="flex items-center space-x-2 text-sm sm:text-base text-gray-900">
                        <Instagram className="w-4 h-4 text-gray-700" />
                        <span className="text-gray-700">@{safeString(selectedApplication, 'instagram_handle')}</span>
                      </div>
                    )}
                    {safeString(selectedApplication, 'blog_url') && (
                      <div className="flex items-center space-x-2 text-sm sm:text-base text-gray-900">
                        <MessageSquare className="w-4 h-4 text-gray-700" />
                        <a
                          href={safeString(selectedApplication, 'blog_url')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vintage-600 hover:text-vintage-800 break-all"
                        >
                          {safeString(selectedApplication, 'blog_url')}
                        </a>
                      </div>
                    )}
                    {safeString(selectedApplication, 'youtube_channel') && (
                      <div className="flex items-center space-x-2 text-sm sm:text-base text-gray-900">
                        <ExternalLink className="w-4 h-4 text-gray-700" />
                        <a
                          href={safeString(selectedApplication, 'youtube_channel')}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-vintage-600 hover:text-vintage-800 break-all"
                        >
                          {safeString(selectedApplication, 'youtube_channel')}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 신청 사유 */}
              {safeString(selectedApplication, 'application_reason') && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-bold mb-3 text-sm sm:text-base text-gray-900">신청 사유</h4>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {safeString(selectedApplication, 'application_reason')}
                  </p>
                </div>
              )}

              {/* 체험 계획 */}
              {safeString(selectedApplication, 'experience_plan') && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-bold mb-3 text-sm sm:text-base text-gray-900">체험 계획</h4>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {safeString(selectedApplication, 'experience_plan')}
                  </p>
                </div>
              )}

              {/* 추가 정보 */}
              {safeString(selectedApplication, 'additional_info') && (
                <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                  <h4 className="font-bold mb-3 text-sm sm:text-base text-gray-900">추가 정보</h4>
                  <p className="text-sm sm:text-base text-gray-700 leading-relaxed">
                    {safeString(selectedApplication, 'additional_info')}
                  </p>
                </div>
              )}

              {/* 신청 상태 */}
              <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
                <h4 className="font-bold mb-3 text-sm sm:text-base text-gray-900">신청 상태</h4>
                <div className="space-y-2">
                  <div className="text-sm sm:text-base text-gray-900">
                    <span className="font-medium text-gray-900">현재 상태:</span>{' '}
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs sm:text-sm font-medium ${getStatusInfo(safeString(selectedApplication, 'status', 'pending')).color}`}>
                      {getStatusInfo(safeString(selectedApplication, 'status', 'pending')).label}
                    </span>
                  </div>
                  <div className="text-sm sm:text-base text-gray-900">
                    <span className="font-medium text-gray-900">신청일:</span>{' '}
                    <span className="text-gray-700">
                      {new Date(safeString(selectedApplication, 'applied_at') || safeString(selectedApplication, 'created_at') || Date.now()).toLocaleString('ko-KR')}
                    </span>
                  </div>
                  {safeString(selectedApplication, 'processed_at') && (
                    <div className="text-sm sm:text-base text-gray-900">
                      <span className="font-medium text-gray-900">처리일:</span>{' '}
                      <span className="text-gray-700">
                        {new Date(safeString(selectedApplication, 'processed_at')).toLocaleString('ko-KR')}
                      </span>
                    </div>
                  )}
                  {safeString(selectedApplication, 'admin_message') && (
                    <div className="text-sm sm:text-base text-gray-900">
                      <span className="font-medium text-gray-900">관리자 메시지:</span>
                      <p className="text-gray-700 bg-blue-50 p-3 rounded mt-1 text-sm sm:text-base">
                        {safeString(selectedApplication, 'admin_message')}
                      </p>
                    </div>
                  )}
                  {safeString(selectedApplication, 'rejection_reason') && (
                    <div className="text-sm sm:text-base text-gray-900">
                      <span className="font-medium text-gray-900">반려 사유:</span>
                      <p className="text-red-700 bg-red-50 p-3 rounded mt-1 text-sm sm:text-base">
                        {safeString(selectedApplication, 'rejection_reason')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 취소 확인 모달 */}
      {showCancelModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <AlertCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-3" />
                <h3 className="text-base sm:text-lg font-bold">신청 취소</h3>
              </div>
              
              <p className="text-sm sm:text-base text-gray-600 mb-6">
                정말로 이 신청을 취소하시겠습니까? 취소된 신청은 복구할 수 없습니다.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm sm:text-base"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmCancel}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm sm:text-base"
                >
                  신청 취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 리뷰 작성 모달 */}
      {showReviewModal && selectedApplication && (
        <ReviewSubmissionManager
          isOpen={showReviewModal}
          onClose={() => {
            setShowReviewModal(false)
            setSelectedApplication(null)
          }}
          onSubmitComplete={() => {
            setShowReviewModal(false)
            setSelectedApplication(null)
            loadApplications() // 신청 목록 새로고침
          }}
          applicationId={selectedApplication._id || selectedApplication.id || ''}
          experienceId={selectedApplication.campaign_id || selectedApplication.experience_id || ''}
          experienceName={selectedApplication.experience?.campaign_name || selectedApplication.experience?.product_name || selectedApplication.experience_name || ''}
        />
      )}

      {/* 포인트 지급 요청 모달 */}
      {showPointRequestModal && selectedPointApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-4 sm:p-6">
              <div className="flex items-center mb-4">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500 mr-3" />
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">포인트 지급 요청</h3>
              </div>
              
              <div className="mb-6">
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  <strong>캠페인:</strong> {selectedPointApplication.experience_name || '캠페인명 없음'}
                </p>
                <p className="text-sm sm:text-base text-gray-600 mb-4">
                  <strong>예상 포인트:</strong> {
                    selectedPointApplication.experience?.rewards || 
                    selectedPointApplication.experience?.reward_points || 
                    selectedPointApplication.campaignInfo?.rewards ||
                    selectedPointApplication.campaignInfo?.point_reward || 
                    selectedPointApplication.point_reward || 
                    0
                  }P
                </p>
                <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                  <p className="text-sm sm:text-base text-orange-800">
                    리뷰가 승인되었습니다. 포인트 지급을 요청하시겠습니까?
                  </p>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmPointRequest}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm sm:text-base"
                >
                  요청하기
                </button>
                <button
                  onClick={() => {
                    setShowPointRequestModal(false)
                    setSelectedPointApplication(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors text-sm sm:text-base"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
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

export default MyApplications
