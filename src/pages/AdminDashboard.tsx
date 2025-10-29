import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dataService, supabase } from '../lib/dataService'
import ApprovalModal from '../components/ApprovalModal'
import RejectionModal from '../components/RejectionModal'
import CampaignCreationModal from '../components/CampaignCreationModal'
import CampaignEditModal from '../components/CampaignEditModal'
import ShippingModal from '../components/ShippingModal'
import ConsultationManager from '../components/ConsultationManager'
import {CheckCircle, XCircle, Clock, Home, RefreshCw, FileText, UserCheck, Gift, Plus, Trash2, Edit3, X, AlertTriangle, Eye, Bell, Settings, Banknote, Download, MessageCircle, MessageSquare, User, Calculator, Truck, Package, Edit, Phone, Mail, Tag, DollarSign, ChevronLeft, ChevronRight} from 'lucide-react'
import toast from 'react-hot-toast'
// 이메일 및 카카오 알림톡 서비스
import { emailNotificationService } from '../services/emailNotificationService'
import { alimtalkService } from '../services/alimtalkService'

const AdminDashboard: React.FC = () => {
  const { isAuthenticated, isAdminUser } = useAuth()
  const navigate = useNavigate()
  
  const [applications, setApplications] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // 모달 상태들
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showApplicationDetailModal, setShowApplicationDetailModal] = useState(false)
  const [showShippingModal, setShowShippingModal] = useState(false)

  // 🔥 리뷰 승인/반려 모달 상태
  const [showReviewApprovalModal, setShowReviewApprovalModal] = useState(false)
  const [showReviewRejectionModal, setShowReviewRejectionModal] = useState(false)
  const [reviewRejectionReason, setReviewRejectionReason] = useState('')
  const [selectedReviewApplication, setSelectedReviewApplication] = useState<any>(null)
  
  // 선택 상태들
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  
  // 필터링 상태들
  const [applicationFilter, setApplicationFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  const [reviewFilter, setReviewFilter] = useState('all')
  const [pointRequestFilter, setPointRequestFilter] = useState('all')
  
  // 검색 상태들
  const [applicationSearch, setApplicationSearch] = useState('')
  const [experienceSearch, setExperienceSearch] = useState('')
  const [reviewSearch, setReviewSearch] = useState('')
  
  // 로딩 상태들
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // 알림 상태들
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [showNotifications, setShowNotifications] = useState(false)
  
  // 🔥 알림 설정
  const [emailFromName, setEmailFromName] = useState<string>('올띵버킷')
  const [emailFromAddress, setEmailFromAddress] = useState<string>('support@allthingbucket.com')
  


  // 포인트 지급 요청 모달 상태
  const [showPointRequestModal, setShowPointRequestModal] = useState(false)
  const [selectedPointApplication, setSelectedPointApplication] = useState<any>(null)

  // 포인트 수정 모달 상태
  const [showEditPointModal, setShowEditPointModal] = useState(false)
  const [editingApplication, setEditingApplication] = useState<any>(null)
  const [editPointAmount, setEditPointAmount] = useState(0)

  // 출금 수정 모달 상태
  const [showEditWithdrawalModal, setShowEditWithdrawalModal] = useState(false)
  const [editingWithdrawal, setEditingWithdrawal] = useState<any>(null)
  const [editWithdrawalAmount, setEditWithdrawalAmount] = useState(0)
  const [editWithdrawalMethod, setEditWithdrawalMethod] = useState('')
  const [editAccountInfo, setEditAccountInfo] = useState('')

  // 관리자 탭 상태
  const [activeTab, setActiveTab] = useState('applications')
  
  // 회원 관리 상태
  const [users, setUsers] = useState<any[]>([])
  const [userSearch, setUserSearch] = useState('')

  // 채팅 관리 상태
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [selectedChatRoom, setSelectedChatRoom] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatNotifications, setChatNotifications] = useState<any[]>([])
  const [unreadChatCount, setUnreadChatCount] = useState(0)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])

  // 이미지 모달 상태
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [imageGallery, setImageGallery] = useState<string[]>([])
  
  // 회원 상세보기 모달 상태
  const [showUserDetailModal, setShowUserDetailModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<any>(null)
  const [userApplications, setUserApplications] = useState<any[]>([])
  const [loadingUserApplications, setLoadingUserApplications] = useState(false)
  
  // 회원 관리 모달 상태
  const [showUserManagementModal, setShowUserManagementModal] = useState(false)
  const [selectedUserForManagement, setSelectedUserForManagement] = useState<any>(null)
  
  // 출금 요청 관리 상태
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([])
  const [withdrawalFilter, setWithdrawalFilter] = useState('all')
  const [withdrawalSearch, setWithdrawalSearch] = useState('')
  const [showWithdrawalDetailModal, setShowWithdrawalDetailModal] = useState(false)
  const [selectedWithdrawalRequest, setSelectedWithdrawalRequest] = useState<any>(null)
  const [showWithdrawalApprovalModal, setShowWithdrawalApprovalModal] = useState(false)
  const [showCompletedWithdrawals, setShowCompletedWithdrawals] = useState(true) // 완료된 내역 표시 여부
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null) // 특정 사용자 필터

  // 은행 정보 및 주민등록번호 편집 상태
  const [isEditingBankInfo, setIsEditingBankInfo] = useState(false)
  const [editBankInfo, setEditBankInfo] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    resident_number: ''
  })

  // 출금 정보 편집 상태
  const [isEditingWithdrawalInfo, setIsEditingWithdrawalInfo] = useState(false)
  const [editWithdrawalInfo, setEditWithdrawalInfo] = useState({
    points_amount: 0,
    withdrawal_amount: 0,
    exchange_rate: 1,
    status: '',
    request_reason: ''
  })

  // 출금 요청 상세 모달 편집 상태 (4개 섹션)
  const [isEditingUserInfo, setIsEditingUserInfo] = useState(false)
  const [editUserInfo, setEditUserInfo] = useState({
    name: '',
    phone: '',
    address: ''
  })

  const [isEditingAccountInfo, setIsEditingAccountInfo] = useState(false)
  const [editWithdrawalAccountInfo, setEditWithdrawalAccountInfo] = useState({
    bank_name: '',
    account_number: '',
    account_holder: '',
    is_verified: false
  })

  const [isEditingRefundInfo, setIsEditingRefundInfo] = useState(false)
  const [editRefundInfo, setEditRefundInfo] = useState({
    points_amount: 0
  })

  const [isEditingRequestInfo, setIsEditingRequestInfo] = useState(false)
  const [editRequestInfo, setEditRequestInfo] = useState({
    status: '',
    request_reason: ''
  })

  // 사용자 포인트 내역 모달 상태
  const [showUserPointsModal, setShowUserPointsModal] = useState(false)
  const [selectedUserPoints, setSelectedUserPoints] = useState<any>(null)
  const [userPointsHistory, setUserPointsHistory] = useState<any[]>([])
  const [showWithdrawalRejectionModal, setShowWithdrawalRejectionModal] = useState(false)

  // 상담 접수 관리 상태
  const [consultationRequests, setConsultationRequests] = useState<any[]>([])
  const [consultationFilter, setConsultationFilter] = useState('all')
  const [consultationSearch, setConsultationSearch] = useState('')
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null)
  const [showConsultationDetail, setShowConsultationDetail] = useState(false)
  const [selectedConsultationIds, setSelectedConsultationIds] = useState<string[]>([])
  const [editingConsultationMemo, setEditingConsultationMemo] = useState<string | null>(null)
  const [tempMemo, setTempMemo] = useState('')

  // 컬럼명 한글 번역 함수
  const translateFieldName = (fieldName: string): string => {
    const translations: { [key: string]: string } = {
      // 기본 정보
      'name': '이름',
      'email': '이메일',
      'phone': '연락처',
      'user_name': '사용자명',
      'user_email': '사용자 이메일',
      'user_phone': '사용자 연락처',
      'age': '나이',
      'gender': '성별',
      'birth_date': '생년월일',
      'address': '주소',
      'postal_code': '우편번호',
      
      // 소셜미디어 정보
      'instagram_id': '인스타그램 ID',
      'instagram_followers': '인스타그램 팔로워 수',
      'instagram_handle': '인스타그램 핸들',
      'youtube_id': '유튜브 ID',
      'youtube_subscribers': '유튜브 구독자 수',
      'youtube_channel': '유튜브 채널',
      'tiktok_id': '틱톡 ID',
      'tiktok_followers': '틱톡 팔로워 수',
      'blog_url': '블로그 URL',
      'blog_visitors': '블로그 방문자 수',
      
      // 체험 관련
      'experience_reason': '체험 신청 이유',
      'experience_expectation': '체험 기대사항',
      'experience_plan': '체험 계획',
      'review_plan': '리뷰 작성 계획',
      'content_style': '콘텐츠 스타일',
      'shooting_environment': '촬영 환경',
      'previous_experience': '이전 체험 경험',
      'product_interest': '제품 관심도',
      'brand_awareness': '브랜드 인지도',
      'application_reason': '신청 이유',
      
      // 개인정보
      'personal_info_consent': '개인정보 수집 동의',
      'marketing_consent': '마케팅 정보 수신 동의',
      'terms_agreement': '이용약관 동의',
      'privacy_policy_agreement': '개인정보처리방침 동의',
      
      // 기타
      'additional_info': '추가 정보',
      'special_requests': '특별 요청사항',
      'questions': '질문사항',
      'suggestions': '제안사항',
      'feedback': '피드백',
      'comments': '댓글',
      'notes': '메모',
      'remarks': '비고',
      'memo': '메모',
      'description': '설명',
      'details': '상세내용',
      'detailed_address': '상세 주소',
      'content': '내용',
      'message': '메시지',
      'text': '텍스트',
      'data': '데이터',
      'info': '정보',
      'information': '정보',
      'debug_info': '디버그 정보',
      'submitted_by_role': '제출자 역할',
      'submitted_by_admin_role': '관리자 제출자 역할'
    }
    
    // 정확한 매칭이 있으면 반환
    if (translations[fieldName]) {
      return translations[fieldName]
    }
    
    // 언더스코어를 공백으로 바꾸고 각 단어의 첫 글자를 대문자로
    const formatted = fieldName
      .replace(/_/g, ' ')
      .replace(/\b\w/g, l => l.toUpperCase())
    
    return formatted
  }

  // 데이터 로드 함수들
  const loadApplications = async () => {
    try {
      const applicationsData = await (dataService.entities as any).user_applications.list()
      
      // 타임아웃 방지를 위해 순차적으로 로드
      let allUsers = []
      let allUserProfiles = []
      let allCampaigns = []
      let allReviewSubmissions = []

      try {
        allUsers = await (dataService.entities as any).users.list()
      } catch (error) {
        console.warn('⚠️ users 로드 실패:', error)
      }

      try {
        allUserProfiles = await (dataService.entities as any).user_profiles.list()
      } catch (error) {
        console.warn('⚠️ user_profiles 로드 실패:', error)
      }

      try {
        allCampaigns = await (dataService.entities as any).campaigns.list()
      } catch (error) {
        console.warn('⚠️ campaigns 로드 실패:', error)
      }

      try {
        allReviewSubmissions = await (dataService.entities as any).review_submissions.list()
      } catch (error) {
        console.warn('⚠️ review_submissions 로드 실패:', error)
      }
      
      // 각 신청에 사용자 정보와 캠페인 정보 추가
      const enrichedApplications = (applicationsData || []).map((app: any) => {
        try {
          let userInfo = null
          let userProfile = null
          let campaignInfo = null
          let reviewSubmissionInfo = null

          // 사용자 정보 찾기
          if (app.user_id) {
            userInfo = allUsers.find((user: any) => user.user_id === app.user_id || user.id === app.user_id)
            userProfile = allUserProfiles.find((profile: any) => profile.user_id === app.user_id)
          }
          
          // 캠페인 정보 찾기
          if (app.campaign_id) {
            campaignInfo = allCampaigns.find((campaign: any) => campaign.id === app.campaign_id)
          }
          
          // 리뷰 제출 정보 찾기 (review_submission_id로 매칭)
          if (app.review_submission_id) {
            reviewSubmissionInfo = allReviewSubmissions.find((submission: any) => 
              submission.id === app.review_submission_id || submission._id === app.review_submission_id
            )
          }
            
            // application_data에서 기본 정보 추출
            const appData = app.application_data || {}
            
            return {
              ...app,
              // 사용자 정보 매핑 (userProfile 우선, 그 다음 application_data, userInfo, 마지막으로 app 필드)
              name: userProfile?.name || appData.name || userInfo?.name || userInfo?.user_name || app.name || '이름 없음',
              email: userProfile?.email || appData.email || userInfo?.email || userInfo?.user_email || app.email || '이메일 없음',
              phone: userProfile?.phone || appData.phone || userInfo?.phone || userInfo?.user_phone || app.phone || '',
              address: userProfile?.address || appData.address || userInfo?.address || app.address || '',
              detailed_address: userProfile?.detailed_address || appData.detailed_address || userInfo?.detailed_address || app.detailed_address || '',
              // 날짜 정보 매핑
              applied_at: appData.applied_at || app.applied_at || app.created_at,
              review_submitted_at: reviewSubmissionInfo?.submitted_at || appData.review_submitted_at || app.review_submitted_at,
              created_at: app.created_at,
              updated_at: app.updated_at,
                   // 캠페인 정보 매핑
                   campaign_name: campaignInfo?.campaign_name || campaignInfo?.product_name || campaignInfo?.name || '캠페인명 없음',
                   campaign_description: campaignInfo?.description || '',
                   experience_name: campaignInfo?.campaign_name || campaignInfo?.product_name || '체험단 정보 없음',
                   // 🔥 포인트 정보 매핑 (캠페인의 리워드 포인트)
                   reward_points: campaignInfo?.rewards || campaignInfo?.reward_points || campaignInfo?.points || 0,
                   points: campaignInfo?.rewards || campaignInfo?.reward_points || campaignInfo?.points || 0,
              // 원본 데이터 보존
              userInfo,
              userProfile,
              user_profile: userProfile,
              campaignInfo,
              reviewSubmissionInfo,
              application_data: appData
            }
        } catch (error) {
          console.warn('신청 정보 처리 실패:', app.id, error)
          return {
            ...app,
            name: app.name || '이름 없음',
            email: app.email || '이메일 없음',
            phone: app.phone || '',
            address: app.address || '',
            detailed_address: app.detailed_address || '',
            applied_at: app.applied_at || app.created_at,
            review_submitted_at: app.review_submitted_at,
            created_at: app.created_at,
            updated_at: app.updated_at,
            campaign_name: '캠페인명 없음',
            campaign_description: '',
            userInfo: null,
            campaignInfo: null,
            application_data: app.application_data || {}
          }
        }
      })
      
      setApplications(enrichedApplications)
    } catch (error) {
      console.error('신청 내역 로드 실패:', error)
      setApplications([])
    }
  }

  const loadExperiences = async () => {
    try {
      // 캠페인 수정을 위해 모든 필드 조회
      const experiencesData = await (dataService.entities as any).campaigns.list()
      console.log('🔥 어드민 대시보드 - 체험단 데이터 로드:', experiencesData)
      
      // 🔥 디버깅: 첫 번째 체험단의 필드 확인
      if (Array.isArray(experiencesData) && experiencesData.length > 0) {
        console.log('🔍 어드민 - 첫 번째 체험단 상세 데이터:', {
          campaign: experiencesData[0],
          campaign_name: experiencesData[0]?.campaign_name,
          title: experiencesData[0]?.title,
          status: experiencesData[0]?.status,
          main_images: experiencesData[0]?.main_images,
          detail_images: experiencesData[0]?.detail_images,
          allFields: Object.keys(experiencesData[0] || {})
        })
      }
      
      setExperiences(experiencesData || [])
    } catch (error) {
      console.error('체험단 데이터 로드 실패:', error)
      setExperiences([])
    }
  }

  // 상태 동기화 함수
  const syncReviewStatus = async (applicationId: string, newStatus: string) => {
    try {
      // user_applications에서 해당 신청 찾기
      const applications = await (dataService.entities as any).user_applications.list()
      const targetApp = applications.find((app: any) => app.id === applicationId || app._id === applicationId)
      
      if (!targetApp) {
        console.error('❌ 신청 정보를 찾을 수 없음:', { applicationId, availableIds: applications.map((app: any) => app.id || app._id) })
        throw new Error('신청 정보를 찾을 수 없습니다')
      }
      
      const app = targetApp

      // 상태 매핑 정의
      const statusMapping: { [key: string]: { [key: string]: string } } = {
        'review_completed': {
          user_applications: 'review_completed',
          review_submissions: 'approved',
          user_reviews: 'approved'
        },
        'rejected': {
          user_applications: 'rejected',
          review_submissions: 'rejected',
          user_reviews: 'rejected'
        },
        'point_requested': {
          user_applications: 'point_requested',
          review_submissions: 'approved', // 리뷰는 승인된 상태 유지
          user_reviews: 'approved'
        },
        'point_completed': {
          user_applications: 'point_completed',
          review_submissions: 'completed',
          user_reviews: 'completed'
        }
      }

      const mapping = statusMapping[newStatus]
      if (!mapping) {
        throw new Error(`알 수 없는 상태: ${newStatus}`)
      }

      // 1. user_applications 업데이트 (임시로 건너뛰기)
      console.log('🔍 현재 신청 데이터 구조 확인:', app)
      console.log('⚠️ user_applications 업데이트를 임시로 건너뛰고 다른 테이블만 업데이트')
      
      // TODO: user_applications 테이블 스키마 확인 후 수정 필요
      // 현재는 400 에러 방지를 위해 user_applications 업데이트를 건너뛰기

      // 2. review_submissions 업데이트
      if (app.review_submission_id) {
        try {
          const submissionUpdateData: any = {
            status: mapping.review_submissions
          }
          
          if (newStatus === 'review_completed' || newStatus === 'rejected') {
            submissionUpdateData.reviewed_at = new Date().toISOString()
          }
          
          console.log('📝 review_submissions 업데이트 데이터:', { 
            submissionId: app.review_submission_id, 
            updateData: submissionUpdateData 
          })
          await (dataService.entities as any).review_submissions.update(app.review_submission_id, submissionUpdateData)

          // 3. user_reviews 업데이트
          const reviewSubmissions = await (dataService.entities as any).review_submissions.list()
          const targetSubmission = reviewSubmissions.find((sub: any) => sub.id === app.review_submission_id)
          
          if (targetSubmission && targetSubmission.review_id) {
            console.log('📝 user_reviews 업데이트 데이터:', { 
              reviewId: targetSubmission.review_id, 
              status: mapping.user_reviews 
            })
            await (dataService.entities as any).user_reviews.update(targetSubmission.review_id, {
              status: mapping.user_reviews
            })
          }
        } catch (submissionError) {
          console.warn('⚠️ review_submissions 또는 user_reviews 업데이트 실패 (무시):', submissionError)
          // submission 업데이트 실패해도 application 업데이트는 성공한 것으로 처리
        }
      }

      return true
    } catch (error) {
      console.error('상태 동기화 실패:', error)
      throw error
    }
  }

  // 배송 정보 등록 모달 열기
  const handleShippingModal = (application: any) => {
    setSelectedApplication(application)
    setShowShippingModal(true)
  }

  // 🔥 리뷰 승인 모달 열기
  const handleApproveReview = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId || app._id === applicationId)
    if (application) {
      setSelectedReviewApplication(application)
      setShowReviewApprovalModal(true)
    }
  }

  // 🔥 리뷰 승인 확정 처리
  const handleConfirmApproveReview = async () => {
    if (!selectedReviewApplication) return

    try {
      const applicationId = selectedReviewApplication.id || selectedReviewApplication._id
      const userId = selectedReviewApplication.user_id
      const campaignId = selectedReviewApplication.campaign_id || selectedReviewApplication.experience_id

      // 🔥 포인트 금액 가져오기
      const pointAmount = selectedReviewApplication.campaignInfo?.rewards ||
                         selectedReviewApplication.experience?.rewards ||
                         selectedReviewApplication.rewards ||
                         0

      console.log('💰 리뷰 승인 및 포인트 자동 지급 시작:', {
        applicationId,
        userId,
        campaignId,
        pointAmount
      })

      // 🔥 1. user_applications 상태를 point_completed로 업데이트 (포인트 자동 지급)
      await dataService.entities.user_applications.update(applicationId, {
        status: 'point_completed',
        updated_at: new Date().toISOString()
      })

      console.log('✅ user_applications 상태 업데이트 완료: point_completed')

      // 🔥 2. 포인트 지급 처리 (points_history에 레코드 생성)
      if (pointAmount > 0 && userId) {
        try {
          await (dataService.entities as any).points_history.create({
            user_id: userId,
            campaign_id: campaignId,
            application_id: applicationId,
            points: pointAmount,
            points_amount: pointAmount,
            type: 'earned',
            points_type: 'earned',
            status: 'success',
            payment_status: '지급완료',
            description: `리뷰 승인 - 포인트 자동 지급`,
            transaction_date: new Date().toISOString(),
            created_at: new Date().toISOString()
          })
          console.log('✅ 포인트 지급 완료 레코드 생성 완료:', pointAmount)
        } catch (pointError) {
          console.error('⚠️ 포인트 지급 실패:', pointError)
          // 포인트 지급 실패해도 리뷰 승인은 유지
        }
      }

      // 🔥 3. 알림톡 발송 (리뷰 승인 + 포인트 지급)
      const userPhone = selectedReviewApplication.phone || selectedReviewApplication.user_profile?.phone
      const userName = selectedReviewApplication.name || '회원'
      const campaignName = selectedReviewApplication.experience?.campaign_name ||
                          selectedReviewApplication.campaign_name ||
                          '캠페인'

      if (userPhone && pointAmount > 0) {
        try {
          // 현재 포인트 잔액 조회
          const userPointsRecords = await (dataService.entities as any).user_points.list()
          const userPointRecord = userPointsRecords.find((p: any) => p.user_id === userId)
          const totalPoints = userPointRecord?.total_points || pointAmount

          const paymentDate = new Date().toLocaleDateString('ko-KR')

          await alimtalkService.sendReviewApprovedWithPointsAlimtalk(
            userPhone,
            userName,
            campaignName,
            pointAmount,
            totalPoints,
            paymentDate
          )
          console.log('✅ 리뷰 승인 + 포인트 지급 알림톡 발송 완료')
        } catch (alimtalkError) {
          console.error('⚠️ 알림톡 발송 실패 (승인/지급은 완료됨):', alimtalkError)
        }
      }

      // 🔥 4. 이메일 발송 (리뷰 승인 이메일)
      const userEmail = selectedReviewApplication.email
      if (userEmail) {
        try {
          await emailNotificationService.sendReviewApprovalEmail(userEmail, userName, campaignName)
          console.log('✅ 리뷰 승인 이메일 발송 완료')
        } catch (emailError) {
          console.error('⚠️ 이메일 발송 실패 (승인은 완료됨):', emailError)
        }
      }

      toast.success(`리뷰가 승인되고 ${pointAmount.toLocaleString()}P가 지급되었습니다! 🎉`)
      setShowReviewApprovalModal(false)
      setSelectedReviewApplication(null)
      loadAllData()
    } catch (error) {
      console.error('리뷰 승인 실패:', error)
      toast.error('리뷰 승인에 실패했습니다.')
    }
  }

  // 🔥 리뷰 반려 모달 열기
  const handleRejectReview = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId || app._id === applicationId)
    if (application) {
      setSelectedReviewApplication(application)
      setReviewRejectionReason('')
      setShowReviewRejectionModal(true)
    }
  }

  // 🔥 리뷰 반려 확정 처리
  const handleConfirmRejectReview = async () => {
    if (!selectedReviewApplication) return
    if (!reviewRejectionReason.trim()) {
      toast.error('반려 사유를 입력해주세요.')
      return
    }

    try {
      const applicationId = selectedReviewApplication.id || selectedReviewApplication._id

      // user_applications에 반려 사유 저장
      await dataService.entities.user_applications.update(applicationId, {
        status: 'review_rejected',
        rejection_reason: reviewRejectionReason.trim(),
        rejected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      console.log('✅ 리뷰 반려 완료 - user_applications 업데이트됨')

      const userPhone = selectedReviewApplication.phone || selectedReviewApplication.user_profile?.phone
      const userEmail = selectedReviewApplication.email
      const userName = selectedReviewApplication.name || '회원'
      const campaignName = selectedReviewApplication.experience?.campaign_name ||
                          selectedReviewApplication.campaign_name ||
                          '캠페인'

      // 🔥 알림톡 발송 (리뷰 반려)
      if (userPhone) {
        try {
          await alimtalkService.sendReviewRejectedDetailAlimtalk(
            userPhone,
            userName,
            campaignName,
            reviewRejectionReason.trim()
          )
          console.log('✅ 리뷰 반려 알림톡 발송 완료')
        } catch (alimtalkError) {
          console.error('⚠️ 알림톡 발송 실패 (반려는 완료됨):', alimtalkError)
        }
      }

      // 🔥 이메일 발송
      if (userEmail) {
        try {
          await emailNotificationService.sendReviewRejectionEmail(
            userEmail,
            userName,
            campaignName,
            reviewRejectionReason.trim()
          )
          console.log('✅ 리뷰 반려 이메일 발송 완료')
        } catch (emailError) {
          console.error('⚠️ 이메일 발송 실패 (반려는 완료됨):', emailError)
        }
      }

      toast.success('리뷰가 반려되었습니다.')
      setShowReviewRejectionModal(false)
      setSelectedReviewApplication(null)
      setReviewRejectionReason('')
      loadAllData()
    } catch (error) {
      console.error('리뷰 반려 실패:', error)
      toast.error('리뷰 반려에 실패했습니다.')
    }
  }

  // 포인트 지급 요청 모달 열기
  const handleRequestPoints = (applicationId: string) => {
    const application = applications.find(app => app.id === applicationId || app._id === applicationId)
    if (application) {
      setSelectedPointApplication(application)
      setShowPointRequestModal(true)
    }
  }

  // 포인트 지급 요청 최종 처리
  const handleConfirmPointRequest = async () => {
    if (!selectedPointApplication) return
    
    // 최종 확인
    if (!window.confirm('신청을 완료하시겠습니까?')) {
      return
    }
    
    try {
      const applicationId = selectedPointApplication.id || selectedPointApplication._id
      
      // 1. review_submissions 및 user_reviews 테이블 상태 업데이트
      if (selectedPointApplication.review_submission_id) {
        try {
          // review_submissions 상태를 'approved'로 업데이트
          await (dataService.entities as any).review_submissions.update(selectedPointApplication.review_submission_id, {
            status: 'approved'
          })
          console.log('✅ review_submissions 상태 업데이트 완료')
          
          // user_reviews 상태도 'approved'로 업데이트
          const reviewSubmissions = await (dataService.entities as any).review_submissions.list()
          const targetSubmission = reviewSubmissions.find((sub: any) => sub.id === selectedPointApplication.review_submission_id)
          
          if (targetSubmission && targetSubmission.review_id) {
            await (dataService.entities as any).user_reviews.update(targetSubmission.review_id, {
              status: 'approved'
            })
            console.log('✅ user_reviews 상태 업데이트 완료')
          }
        } catch (error) {
          console.warn('⚠️ review_submissions/user_reviews 업데이트 실패 (무시):', error)
        }
      }
      
      // 2. user_applications 상태를 point_requested로 변경
      try {
        await (dataService.entities as any).user_applications.update(applicationId, {
          status: 'point_requested',
          updated_at: new Date().toISOString()
        })
        console.log('✅ user_applications 상태 업데이트 완료: point_requested')
      } catch (updateError) {
        console.warn('⚠️ user_applications 업데이트 실패 (무시):', updateError)
      }
      
      // 3. points_history 테이블에 요청 기록 추가 (실제 지급은 아님)
      try {
        const pointAmount = selectedPointApplication.campaignInfo?.rewards || 0
        await (dataService.entities as any).points_history.create({
          user_id: selectedPointApplication.user_id,
          campaign_id: selectedPointApplication.campaign_id,
          points_amount: pointAmount,
          points_type: 'pending', // 'earned' 대신 'pending'으로 변경
          status: 'pending',
          payment_status: '지급대기중',
          description: `캠페인 "${selectedPointApplication.campaign_name}" 포인트 지급 요청`,
          transaction_date: new Date().toISOString(),
          created_at: new Date().toISOString()
        })
        console.log('✅ points_history 요청 기록 추가 완료')
      } catch (pointsError) {
        console.warn('⚠️ points_history 요청 기록 추가 실패 (무시):', pointsError)
      }
      
      // 4. 관리자에게 포인트 지급 요청 알림 생성
      try {
        await (dataService.entities as any).admin_notifications.create({
          type: 'point_request',
          title: '포인트 지급 요청',
          message: `${selectedPointApplication.name || '사용자'}님이 포인트 지급을 요청했습니다.`,
          data: {
            application_id: applicationId,
            user_name: selectedPointApplication.name,
            user_email: selectedPointApplication.email,
            campaign_name: selectedPointApplication.campaign_name,
            point_amount: selectedPointApplication.campaignInfo?.rewards || 0
          },
          read: false,
          created_at: new Date().toISOString()
        })
        console.log('✅ 관리자 알림 생성 완료: 포인트 지급 요청')
      } catch (notificationError) {
        console.warn('⚠️ 관리자 알림 생성 실패 (무시):', notificationError)
      }
      
      toast.success('포인트 지급이 요청되었습니다.')
      setShowPointRequestModal(false)
      setSelectedPointApplication(null)
      loadAllData()
    } catch (error) {
      console.error('포인트 지급 요청 실패:', error)
      toast.error('포인트 지급 요청에 실패했습니다.')
    }
  }

  // 포인트 지급 완료 처리
  const handleCompletePoints = async (applicationId: string) => {
    if (window.confirm('포인트 지급을 완료하시겠습니까?')) {
      try {
        console.log('포인트 지급 완료 시작:', applicationId)
        
        // 1. user_applications 상태를 point_completed로 변경 (포인트 지급 완료)
        try {
          await (dataService.entities as any).user_applications.update(applicationId, {
            status: 'point_completed',
            updated_at: new Date().toISOString()
          })
          console.log('✅ user_applications 상태 업데이트 완료: point_completed')
        } catch (updateError) {
          console.warn('⚠️ user_applications 업데이트 실패 (무시):', updateError)
        }

        await syncReviewStatus(applicationId, 'point_completed')
        
        // 2. points_history에서 해당 신청의 pending 상태를 success로 변경
        try {
          const application = applications.find(app => (app.id || app._id) === applicationId)
          const pointAmount = application?.campaignInfo?.rewards || application?.experience?.rewards || 0
          
          const pointsHistory = await (dataService.entities as any).points_history.list()
          console.log('🔍 전체 points_history:', pointsHistory)
          console.log('🔍 찾고 있는 applicationId:', applicationId)
          
          // 각 레코드의 필드들을 자세히 확인
          pointsHistory.forEach((record: any, index: number) => {
            console.log(`🔍 points_history[${index}]:`, {
              id: record.id,
              campaign_id: record.campaign_id,
              application_id: record.application_id,
              user_id: record.user_id,
              points_amount: record.points_amount,
              status: record.status,
              payment_status: record.payment_status
            })
          })
          
          // 더 정확한 points_history 레코드 찾기
          const targetPointRecord = pointsHistory.find((record: any) => {
            const recordCampaignId = record.campaign_id || record.campaignId
            const recordApplicationId = record.application_id || record.applicationId
            const recordUserId = record.user_id || record.userId
            
            console.log('🔍 points_history 레코드 매칭 시도:', {
              recordId: record.id,
              recordCampaignId,
              recordApplicationId,
              recordUserId,
              targetApplicationId: applicationId,
              application: applications.find(app => (app.id || app._id) === applicationId)
            })
            
            // applicationId가 campaign_id와 일치하거나, application_id와 일치하는 경우
            return recordCampaignId === applicationId || 
                   recordApplicationId === applicationId ||
                   (record.data && record.data.application_id === applicationId)
          })
          
          console.log('🔍 찾은 targetPointRecord:', targetPointRecord)
          
          if (targetPointRecord) {
            // 🔥 새로운 포인트 지급 완료 레코드만 생성 (기존 레코드는 그대로 유지)
            await (dataService.entities as any).points_history.create({
              user_id: targetPointRecord.user_id,
              campaign_id: targetPointRecord.campaign_id,
              points: pointAmount,
              points_amount: pointAmount,
              type: 'earned',
              points_type: 'earned',
              status: 'success',
              payment_status: '지급완료',
              description: `캠페인 포인트 지급 완료 (관리자 승인)`,
              transaction_date: new Date().toISOString(),
              created_at: new Date().toISOString()
            })
            console.log('✅ 새로운 포인트 지급 완료 레코드 생성 완료')
            
            // 3. user_points 테이블 업데이트는 트리거가 자동으로 처리
            console.log('✅ user_points 업데이트는 트리거가 자동으로 처리됩니다')
            
            // 4. user_profiles 테이블에서 체험단 참여 횟수 증가
            try {
              const userProfiles = await (dataService.entities as any).user_profiles.list()
              const targetUserProfile = userProfiles.find((profile: any) => 
                profile.user_id === targetPointRecord.user_id
              )
              
              console.log('🔍 체험단 참여 횟수 업데이트 정보:', {
                userId: targetPointRecord.user_id,
                existingProfile: targetUserProfile
              })
              
              if (targetUserProfile) {
                const newExperienceCount = (targetUserProfile.experience_count || 0) + 1
                await (dataService.entities as any).user_profiles.update(targetUserProfile.id || targetUserProfile._id, {
                  experience_count: newExperienceCount,
                  updated_at: new Date().toISOString()
                })
                console.log('✅ 체험단 참여 횟수 증가 완료:', {
                  before: targetUserProfile.experience_count || 0,
                  after: newExperienceCount
                })
              } else {
                // user_profiles 레코드가 없으면 새로 생성
                await (dataService.entities as any).user_profiles.create({
                  user_id: targetPointRecord.user_id,
                  experience_count: 1,
                  created_at: new Date().toISOString()
                })
                console.log('✅ user_profiles 새로 생성 완료 (체험단 참여 횟수: 1)')
              }
            } catch (profileError: any) {
              console.error('❌ user_profiles 업데이트 실패:', profileError)
            }
          } else {
            console.warn('⚠️ 해당 신청의 points_history 레코드를 찾을 수 없음. 새로 생성합니다.')
            
            // points_history 레코드가 없으면 새로 생성
            const application = applications.find(app => (app.id || app._id) === applicationId)
            if (application) {
              const pointAmount = application.campaignInfo?.rewards || application.experience?.rewards || 0
              
              // 🔥 포인트 지급 완료 레코드 생성
              await (dataService.entities as any).points_history.create({
                user_id: application.user_id,
                campaign_id: application.campaign_id,
                points: pointAmount,
                points_amount: pointAmount,
                type: 'earned',
                points_type: 'earned',
                status: 'success',
                payment_status: '지급완료',
                description: `캠페인 "${application.campaign_name || application.experience_name}" 포인트 지급 완료 (관리자 승인)`,
                transaction_date: new Date().toISOString(),
                created_at: new Date().toISOString()
              })
              console.log('✅ points_history 새 레코드 생성 완료')
              
              // user_points 테이블 업데이트
              try {
                const userPoints = await (dataService.entities as any).user_points.list()
                const targetUserPoints = userPoints.find((points: any) => 
                  points.user_id === application.user_id
                )
                
                if (targetUserPoints) {
                  // user_points 업데이트 (실제 컬럼명 사용)
                  const currentPoints = targetUserPoints.points || 0
                  const currentEarned = targetUserPoints.earned_points || 0
                  
                  const updatedPoints = {
                    points: currentPoints + pointAmount, // 사용 가능한 포인트 증가
                    earned_points: currentEarned + pointAmount, // 총 적립 포인트 증가
                    updated_at: new Date().toISOString()
                  }
                  
                  console.log('🔍 user_points 업데이트 전 (fallback):', {
                    id: targetUserPoints.id,
                    currentPoints,
                    currentEarned,
                    pointAmount
                  })
                  
                  await (dataService.entities as any).user_points.update(targetUserPoints.id || targetUserPoints._id, updatedPoints)
                  console.log('✅ user_points 업데이트 완료 (fallback):', pointAmount, '포인트 적립')
                } else {
                  await (dataService.entities as any).user_points.create({
                    user_id: application.user_id,
                    points: pointAmount, // 사용 가능한 포인트
                    earned_points: pointAmount, // 총 적립 포인트
                    used_points: 0 // 출금된 포인트
                  })
                  console.log('✅ user_points 새로 생성 완료:', pointAmount, '포인트')
                }
              } catch (userPointsError: any) {
                console.error('❌ user_points 업데이트 실패:', userPointsError)
              }
            }
          }
        } catch (pointsError: any) {
          console.error('❌ points_history 상태 업데이트 실패:', pointsError)
          console.error('에러 상세:', {
            message: pointsError.message,
            details: pointsError.details,
            hint: pointsError.hint,
            code: pointsError.code
          })
        }
        
        // 5. 사용자에게 포인트 지급 완료 알림 생성 (admin_notifications에 기록)
        try {
          const application = applications.find(app => (app.id || app._id) === applicationId)
          if (application) {
            await (dataService.entities as any).admin_notifications.create({
              type: 'point_completed',
              title: '포인트 지급 완료',
              message: `사용자 ${application.name || '알 수 없음'}님의 캠페인 "${application.campaign_name || application.experience_name}" 포인트 지급이 완료되었습니다.`,
              data: {
                user_id: application.user_id,
                user_name: application.name,
                campaign_name: application.campaign_name || application.experience_name,
                application_id: applicationId
              },
              read: false,
              created_at: new Date().toISOString()
            })
            console.log('✅ 관리자 알림 생성 완료: 포인트 지급 완료')
          }
        } catch (notificationError: any) {
          console.error('❌ 관리자 알림 생성 실패:', notificationError)
        }
        
        toast.success('포인트 지급이 완료되었습니다.')
        
        // 데이터 새로고침 후 포인트 지급 요청 관리 탭으로 이동
        await loadAllData()
        setActiveTab('point_requests')
      } catch (error) {
        console.error('포인트 지급 완료 실패:', error)
        toast.error('포인트 지급 완료에 실패했습니다.')
      }
    }
  }

  // 알림 로드
  const loadNotifications = async () => {
    try {
      const notificationsData = await (dataService.entities as any).admin_notifications.list()
      const sortedNotifications = (notificationsData || []).sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      setNotifications(sortedNotifications)
      
      const unreadCount = sortedNotifications.filter((n: any) => !n.is_read).length
      setUnreadNotifications(unreadCount)
    } catch (error) {
      console.error('알림 로드 실패:', error)
    }
  }

  // 알림 읽음 처리 (클릭 이벤트에서 사용됨)
  const markNotificationAsRead = async (notificationId: string) => {
    try {
      await (dataService.entities as any).admin_notifications.update(notificationId, {
        is_read: true
      })
      
      // 로컬 상태 업데이트
      setNotifications(prev => prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true, read: true }
          : notification
      ))
      
      // 미읽음 개수 업데이트
      setUnreadNotifications(prev => Math.max(0, prev - 1))
      
      console.log('✅ 알림 읽음 처리 완료:', notificationId)
    } catch (error) {
      console.error('❌ 알림 읽음 처리 실패:', error)
      toast.error('알림 처리에 실패했습니다')
    }
  }

  // 모든 알림 읽음 처리
  const markAllNotificationsAsRead = async () => {
    try {
      const unreadNotificationIds = notifications
        .filter(n => !n.is_read)
        .map(n => n.id)
      
      if (unreadNotificationIds.length === 0) {
        toast('읽지 않은 알림이 없습니다', { icon: 'ℹ️' })
        return
      }
      
      // 모든 미읽음 알림을 읽음으로 처리
      await Promise.all(
        unreadNotificationIds.map(id => 
          (dataService.entities as any).admin_notifications.update(id, {
            is_read: true
          })
        )
      )
      
      // 로컬 상태 업데이트
      setNotifications(prev => prev.map(notification => ({
        ...notification,
        is_read: true,
        read: true
      })))
      
      setUnreadNotifications(0)
      toast.success(`${unreadNotificationIds.length}개의 알림을 모두 읽음 처리했습니다`)
      
    } catch (error) {
      console.error('❌ 모든 알림 읽음 처리 실패:', error)
      toast.error('알림 처리에 실패했습니다')
    }
  }

  // 회원 데이터 로드 (public.users 테이블만 사용)
  const loadUsers = async () => {
    try {
      // public.users 테이블에서 조회
      const usersData = await (dataService.entities as any).users.list()
      console.log('🔥 public.users 데이터 로드:', usersData)

      // 사용자 데이터 포맷팅
      const formattedUsers = (usersData || []).map((user: any) => {
        return {
          id: user.id,
          user_id: user.user_id || user.id,
          email: user.email,
          name: user.name || user.display_name || '이름 없음',
          display_name: user.display_name || user.name || '이름 없음',
          created_at: user.created_at,
          email_confirmed_at: user.email_confirmed_at,
          last_login: user.last_login,
          phone: user.phone,
          avatar_url: user.avatar_url,
          provider: user.provider
        }
      })

      console.log('✅ 사용자 데이터:', formattedUsers.length, '명')
      setUsers(formattedUsers || [])
    } catch (error) {
      console.error('❌ 회원 데이터 로드 실패:', error)
      setUsers([])
    }
  }

  // 사용자 신청 정보 로드 함수
  const loadUserApplications = async (userId: string) => {
    setLoadingUserApplications(true)
    try {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🔥 사용자 신청 정보 로드 시작')
      console.log('🎯 조회할 사용자 ID:', userId)
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      // 1. users 테이블에서 해당 사용자 정보 가져오기
      const allUsers = await (dataService.entities as any).users.list()
      const targetUser = allUsers.find((u: any) => u.id === userId || u.user_id === userId)

      if (!targetUser) {
        console.error('❌ 사용자를 찾을 수 없습니다:', userId)
        setUserApplications([])
        return
      }

      console.log('👤 찾은 사용자:', {
        id: targetUser.id,
        user_id: targetUser.user_id,
        name: targetUser.name,
        email: targetUser.email
      })

      // 2. 항상 전체 데이터를 가져와서 클라이언트에서 확실하게 필터링
      const allApplications = await (dataService.entities as any).user_applications.list()
      console.log('📦 전체 신청 데이터 개수:', allApplications?.length || 0)

      // 전체 데이터 구조 확인
      if (allApplications && allApplications.length > 0) {
        console.log('📋 첫 번째 신청 데이터 샘플:', {
          id: allApplications[0].id,
          user_id: allApplications[0].user_id,
          campaign_id: allApplications[0].campaign_id
        })
      }

      // 3. 이메일 기준으로 필터링 - 신청 관리(line 331)와 동일한 로직
      const userApplications = (allApplications || []).filter((app: any) => {
        // 먼저 해당 신청의 사용자 정보를 찾기
        let appUserInfo = null
        if (app.user_id) {
          appUserInfo = allUsers.find((user: any) =>
            user.user_id === app.user_id || user.id === app.user_id
          )
        }

        // 신청 관리와 동일한 우선순위로 이메일 추출
        const appData = app.application_data || {}
        const appEmail = appData.email || appUserInfo?.email || appUserInfo?.user_email || app.email
        const targetEmail = targetUser.email

        const isMatch = appEmail && targetEmail &&
                       appEmail.toLowerCase().trim() === targetEmail.toLowerCase().trim()

        console.log('🔍 이메일 기준 필터링:', {
          신청ID: app.id,
          'app.user_id': app.user_id,
          'appUserInfo 찾음': !!appUserInfo,
          '신청의 이메일': appEmail,
          '사용자 이메일': targetEmail,
          '매칭 여부': isMatch ? '✅' : '❌'
        })

        return isMatch
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('🎯 필터링 결과:', userApplications.length, '개')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      if (userApplications.length === 0) {
        console.warn('⚠️ 해당 사용자의 신청이 없습니다')
        setUserApplications([])
        return
      }

      // 모든 캠페인 정보를 한 번에 가져오기
      const allCampaigns = await (dataService.entities as any).campaigns.list()
      console.log('📦 전체 캠페인 데이터 개수:', allCampaigns?.length || 0)

      // 각 신청에 대해 캠페인 정보 매칭
      const applicationsWithCampaigns = userApplications.map((app: any) => {
        const campaignId = app.campaign_id || app.experience_id

        // 캠페인 정보 찾기
        const campaign = allCampaigns.find((c: any) =>
          c.id === campaignId || c._id === campaignId
        )

        console.log('🔗 신청-캠페인 매칭:', {
          신청ID: app.id,
          캠페인ID: campaignId,
          캠페인명: campaign?.campaign_name || campaign?.name || '❌ 찾을 수 없음'
        })

        return {
          ...app,
          campaign_name: campaign?.campaign_name || campaign?.product_name || campaign?.name || '캠페인 정보 없음',
          campaign_status: campaign?.campaign_status || campaign?.status || '알 수 없음',
          campaign_type: campaign?.type || '일반',
          campaign_description: campaign?.description || '',
          // application_data도 함께 포함
          application_data: app.application_data || {}
        }
      })

      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('✅ 최종 결과:', applicationsWithCampaigns.length, '개 신청')
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

      setUserApplications(applicationsWithCampaigns || [])
    } catch (error) {
      console.error('❌ 사용자 신청 정보 로드 실패:', error)
      setUserApplications([])
    } finally {
      setLoadingUserApplications(false)
    }
  }

  // 출금 요청 데이터 로드
  const loadWithdrawalRequests = async () => {
    try {
      const requests = await (dataService.entities as any).withdrawal_requests.list()
      console.log('🔍 로드된 출금 요청 원본 데이터:', requests)

      // 모든 데이터를 한 번에 가져오기 (성능 최적화)
      const [allUserProfiles, allUsers, allApplications] = await Promise.all([
        (dataService.entities as any).user_profiles.list(),
        (dataService.entities as any).users.list(),
        (dataService.entities as any).user_applications.list()
      ])

      console.log('🔍 전체 user_profiles:', allUserProfiles)
      console.log('🔍 전체 users:', allUsers)

      // 계좌 정보와 사용자 정보와 함께 조회
      const requestsWithDetails = await Promise.all(
        (requests || []).map(async (request: any, index: number) => {
          try {
            // JavaScript로 필터링
            const userProfile = allUserProfiles.find((p: any) => p.user_id === request.user_id)
            const userData = allUsers.find((u: any) => u.user_id === request.user_id)
            const userApplications = allApplications.filter((app: any) => app.user_id === request.user_id)

            console.log(`🔍 출금 요청 ${request.id} 매칭:`, {
              request_user_id: request.user_id,
              userProfile,
              userData,
              user_name: userProfile?.name || userProfile?.real_name || userData?.name
            })

            // 계좌 정보 조회
            const account = request.bank_account_id
              ? await (dataService.entities as any).bank_accounts.get(request.bank_account_id)
              : null

            // 사용자별 환급 요청 누적 횟수 계산
            const userWithdrawalCount = (requests || []).filter((r: any) => r.user_id === request.user_id).length

            return {
              ...request,
              bank_account: account,
              user_profile: userProfile,
              user_data: userData, // users 테이블에서 가져온 데이터
              user_applications: userApplications || [],
              withdrawal_count: userWithdrawalCount,
              index: index + 1
            }
          } catch (error) {
            console.error('상세 정보 조회 실패:', error)
            return request
          }
        })
      )
      
      // 중복 제거 (ID 기준)
      const uniqueRequests = requestsWithDetails.filter((request, index, self) => 
        index === self.findIndex(r => (r.id === request.id || r._id === request._id))
      )
      
      console.log('🔍 중복 제거 후 출금 요청:', uniqueRequests)
      
      setWithdrawalRequests(uniqueRequests.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ))
    } catch (error) {
      console.error('출금 요청 조회 실패:', error)
      setWithdrawalRequests([])
    }
  }

  // 상담 접수 데이터 로드
  const loadConsultationRequests = async () => {
    try {
      const { data, error } = await supabase
        .from('consultation_requests')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('상담 접수 조회 실패:', error)
        setConsultationRequests([])
        return
      }

      console.log('🔍 로드된 상담 접수:', data)
      setConsultationRequests(data || [])
    } catch (error) {
      console.error('상담 접수 조회 실패:', error)
      setConsultationRequests([])
    }
  }

  // 사용자 포인트 내역 조회 함수
  const handleViewUserPoints = async (userId: string, applicationId?: string) => {
    try {
      console.log('🔍 사용자 포인트 조회 시작:', { userId, applicationId })

      // 사용자 정보 조회 - Supabase auth.users 테이블에서 조회
      let user = null
      try {
        const usersResult = await dataService.entities.users.list({
          filter: { user_id: userId }
        })
        user = usersResult && usersResult.length > 0 ? usersResult[0] : null
        console.log('✅ 사용자 조회 결과:', user)
      } catch (userError) {
        console.error('❌ 사용자 조회 실패:', userError)
      }

      // 사용자 정보를 찾지 못한 경우, application에서 정보 가져오기
      if (!user && applicationId) {
        const application = applications.find(app =>
          (app.id || app._id) === applicationId
        )
        if (application) {
          user = {
            user_id: userId,
            name: application.name,
            email: application.email,
            phone: application.phone
          }
          console.log('✅ Application에서 사용자 정보 추출:', user)
        }
      }

      if (!user) {
        toast.error('사용자 정보를 찾을 수 없습니다.')
        return
      }

      // 사용자 포인트 정보 조회
      const userPoints = await dataService.entities.user_points.list({
        filter: { user_id: userId }
      })
      console.log('✅ 사용자 포인트 정보:', userPoints)

      // 포인트 내역 조회
      const pointsHistory = await dataService.entities.points_history.list({
        filter: { user_id: userId }
      })
      console.log('✅ 포인트 내역:', pointsHistory)

      // 현재 포인트 계산
      const currentPoints = userPoints && userPoints.length > 0 ? userPoints[0].points || 0 : 0

      // 이번 적립 포인트 (해당 application의 포인트)
      let addPoints = 0
      if (applicationId) {
        const application = applications.find(app =>
          (app.id || app._id) === applicationId
        )
        if (application) {
          addPoints = application.experience?.rewards ||
                     application.experience?.reward_points ||
                     application.campaignInfo?.rewards ||
                     0
        }
      }

      setSelectedUserPoints({
        ...user,
        ...(userPoints && userPoints.length > 0 ? userPoints[0] : {}),
        currentPoints, // 현재 포인트
        addPoints, // 적립될 포인트
        afterPoints: currentPoints + addPoints // 적립 후 포인트
      })
      setUserPointsHistory(pointsHistory || [])
      setShowUserPointsModal(true)
    } catch (error) {
      console.error('사용자 포인트 내역 조회 실패:', error)
      toast.error('사용자 포인트 내역을 불러오는데 실패했습니다.')
    }
  }

  // 출금 요청 수정 함수
  const handleEditWithdrawal = async (requestId: string) => {
    const request = withdrawalRequests.find(req => (req.id || req._id) === requestId)
    if (!request) {
      toast.error('출금 요청 정보를 찾을 수 없습니다.')
      return
    }

    setEditingWithdrawal(request)
    setEditWithdrawalAmount(request.amount || 0)
    setEditWithdrawalMethod(request.withdrawal_method || '')
    setEditAccountInfo(request.account_info || '')
    setShowEditWithdrawalModal(true)
  }

  // 출금 수정 저장
  const handleSaveEditWithdrawal = async () => {
    if (!editingWithdrawal) return

    try {
      const requestId = editingWithdrawal.id || editingWithdrawal._id

      await (dataService.entities as any).withdrawal_requests.update(requestId, {
        amount: editWithdrawalAmount,
        withdrawal_method: editWithdrawalMethod,
        account_info: editAccountInfo,
        updated_at: new Date().toISOString()
      })

      toast.success('출금 요청이 수정되었습니다.')
      setShowEditWithdrawalModal(false)
      setEditingWithdrawal(null)
      setEditWithdrawalAmount(0)
      setEditWithdrawalMethod('')
      setEditAccountInfo('')
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('출금 수정 실패:', error)
      toast.error('출금 수정에 실패했습니다.')
    }
  }

  // 출금 요청 삭제 함수
  const handleDeleteWithdrawal = async (requestId: string) => {
    if (window.confirm('정말로 이 출금 요청을 삭제하시겠습니까?')) {
      try {
        await dataService.entities.withdrawal_requests.delete(requestId)
        toast.success('출금 요청이 삭제되었습니다.')
        loadWithdrawalRequests()
      } catch (error) {
        console.error('출금 요청 삭제 실패:', error)
        toast.error('출금 요청 삭제에 실패했습니다.')
      }
    }
  }

  // 포인트 지급 요청 거절 함수
  const handleRejectPointRequest = async (applicationId: string) => {
    if (window.confirm('정말로 이 포인트 지급 요청을 거절하시겠습니까?')) {
      try {
        await dataService.entities.user_applications.update(applicationId, {
          status: 'point_rejected',
          updated_at: new Date().toISOString()
        })
        
        // 관리자 알림 생성
        await dataService.entities.admin_notifications.create({
          type: 'point_rejection',
          title: '포인트 지급 거절',
          message: `포인트 지급 요청이 거절되었습니다. (ID: ${applicationId})`,
          is_read: false,
          created_at: new Date().toISOString()
        })
        
        toast.success('포인트 지급 요청이 거절되었습니다.')
        loadApplications()
      } catch (error) {
        console.error('포인트 지급 요청 거절 실패:', error)
        toast.error('포인트 지급 요청 거절에 실패했습니다.')
      }
    }
  }

  // 포인트 지급 요청 수정 함수
  const handleEditPointRequest = async (applicationId: string) => {
    const application = applications.find(app => (app.id || app._id) === applicationId)
    if (!application) {
      toast.error('신청 정보를 찾을 수 없습니다.')
      return
    }

    // 현재 포인트 금액 가져오기
    const currentPoints = application.experience?.rewards ||
                         application.experience?.reward_points ||
                         application.campaignInfo?.rewards || 0

    setEditingApplication(application)
    setEditPointAmount(currentPoints)
    setShowEditPointModal(true)
  }

  // 포인트 수정 저장
  const handleSaveEditPoint = async () => {
    if (!editingApplication) return

    try {
      const applicationId = editingApplication.id || editingApplication._id
      const oldPoints = editingApplication.experience?.rewards ||
                       editingApplication.experience?.reward_points ||
                       editingApplication.campaignInfo?.rewards || 0
      const pointDifference = editPointAmount - oldPoints

      // user_applications의 포인트 정보 업데이트
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      // experience 또는 campaignInfo 객체를 업데이트
      if (editingApplication.experience) {
        updateData.experience = {
          ...editingApplication.experience,
          rewards: editPointAmount,
          reward_points: editPointAmount
        }
      }

      if (editingApplication.campaignInfo) {
        updateData.campaignInfo = {
          ...editingApplication.campaignInfo,
          rewards: editPointAmount
        }
      }

      await (dataService.entities as any).user_applications.update(applicationId, updateData)

      // 이미 포인트가 지급된 경우(point_completed 상태)에만 실제 포인트 업데이트
      if (editingApplication.status === 'point_completed' && pointDifference !== 0) {
        console.log('🔧 포인트 수정:', {
          oldPoints,
          newPoints: editPointAmount,
          difference: pointDifference,
          userId: editingApplication.user_id
        })

        // 1. points_history 업데이트 - 기존 레코드 찾기
        const pointsHistory = await (dataService.entities as any).points_history.list()
        const relatedHistory = pointsHistory.find((record: any) =>
          (record.campaign_id === applicationId ||
           record.application_id === applicationId) &&
          record.user_id === editingApplication.user_id &&
          record.status === 'success'
        )

        if (relatedHistory) {
          // 기존 레코드 업데이트
          await (dataService.entities as any).points_history.update(relatedHistory.id || relatedHistory._id, {
            points: editPointAmount,
            points_amount: editPointAmount,
            updated_at: new Date().toISOString()
          })
          console.log('✅ points_history 업데이트 완료')
        } else {
          console.warn('⚠️ 관련 points_history 레코드를 찾을 수 없음')
        }

        // 2. user_points 업데이트 - 포인트 차이만큼 증감
        const userPoints = await (dataService.entities as any).user_points.list()
        const targetUserPoints = userPoints.find((points: any) =>
          points.user_id === editingApplication.user_id
        )

        if (targetUserPoints) {
          const currentPoints = targetUserPoints.points || 0
          const currentEarned = targetUserPoints.earned_points || 0

          await (dataService.entities as any).user_points.update(targetUserPoints.id || targetUserPoints._id, {
            points: currentPoints + pointDifference,
            earned_points: currentEarned + pointDifference,
            updated_at: new Date().toISOString()
          })
          console.log('✅ user_points 업데이트 완료:', {
            before: currentPoints,
            difference: pointDifference,
            after: currentPoints + pointDifference
          })
        } else {
          console.warn('⚠️ user_points 레코드를 찾을 수 없음')
        }

        toast.success(`포인트가 ${pointDifference > 0 ? '+' : ''}${pointDifference}P 조정되었습니다.`)
      } else {
        toast.success('포인트 금액이 수정되었습니다.')
      }

      setShowEditPointModal(false)
      setEditingApplication(null)
      setEditPointAmount(0)
      await loadAllData()
    } catch (error) {
      console.error('포인트 수정 실패:', error)
      toast.error('포인트 수정에 실패했습니다.')
    }
  }

  // 포인트 지급 요청 삭제 함수
  const handleDeletePointRequest = async (applicationId: string) => {
    if (window.confirm('정말로 이 포인트 지급 요청을 삭제하시겠습니까?')) {
      try {
        await dataService.entities.user_applications.delete(applicationId)
        toast.success('포인트 지급 요청이 삭제되었습니다.')
        loadApplications()
      } catch (error) {
        console.error('포인트 지급 요청 삭제 실패:', error)
        toast.error('포인트 지급 요청 삭제에 실패했습니다.')
      }
    }
  }



  // 전체 데이터 로드
  // 채팅방 목록 로드
  const loadChatRooms = async () => {
    try {
      const rooms = await dataService.entities.chat_rooms.list()
      setChatRooms(rooms || [])
    } catch (error) {
      console.error('채팅방 목록 로드 실패:', error)
    }
  }

  // 채팅 알림 로드
  const loadChatNotifications = async () => {
    try {
      const notifications = await dataService.entities.admin_chat_notifications.list()
      const unreadNotifications = notifications.filter(n => !n.is_read)
      setChatNotifications(notifications || [])
      setUnreadChatCount(unreadNotifications.length)
    } catch (error) {
      console.error('채팅 알림 로드 실패:', error)
    }
  }

  // 온라인 사용자 로드
  const loadOnlineUsers = async () => {
    try {
      const onlineUsers = await dataService.entities.user_online_status.getOnlineUsers()
      setOnlineUsers(onlineUsers)
    } catch (error) {
      console.error('온라인 사용자 로드 실패:', error)
    }
  }

  // 특정 채팅방의 메시지 로드 (새로운 JSON 구조)
  const loadChatMessages = async (chatRoomId: string) => {
    try {
      const conversations = await dataService.entities.chat_conversations.list({
        filter: { chat_room_id: chatRoomId }
      })
      
      // 모든 대화의 메시지를 하나의 배열로 합치기
      const allMessages: any[] = []
      
      conversations.forEach(conversation => {
        if (conversation.conversation_data && Array.isArray(conversation.conversation_data)) {
          conversation.conversation_data.forEach((msg: any, msgIndex: number) => {
            // 모든 메시지 ID를 강제로 고유하게 생성 (기존 ID 무시)
            const safeId = `msg_${conversation.id}_${msgIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            allMessages.push({
              id: safeId,
              chat_room_id: chatRoomId,
              sender_type: msg.sender_type,
              sender_id: msg.sender_name,
              sender_name: msg.sender_name,
              message: msg.message_text,
              message_type: 'text',
              is_read: true,
              created_at: msg.timestamp
            })
          })
        }
      })

      // 시간순으로 정렬
      allMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      
      // 중복 ID 제거 및 최종 안전장치
      const uniqueMessages = allMessages.reduce((acc: any[], current: any, index: number) => {
        // ID가 여전히 중복되는 경우를 대비해 인덱스 추가
        const existingIndex = acc.findIndex(msg => msg.id === current.id)
        if (existingIndex >= 0) {
          // 중복된 ID가 있으면 새로운 고유 ID로 변경
          const newId = `${current.id}_dup_${index}_${Math.random().toString(36).substr(2, 9)}`
          acc.push({ ...current, id: newId })
        } else {
          acc.push(current)
        }
        return acc
      }, [])
      
      // 최종 안전장치: 메시지 배열에서 중복 ID 제거
      const finalMessages = uniqueMessages.filter((message, index, array) => {
        return array.findIndex(msg => msg.id === message.id) === index
      })
      
      setChatMessages(finalMessages)
    } catch (error) {
      console.error('채팅 메시지 로드 실패:', error)
    }
  }

  // 관리자 메시지 전송 (새로운 JSON 구조)
  const sendAdminMessage = async () => {
    if (!chatInput.trim() || !selectedChatRoom) return

    try {
      const now = new Date().toISOString()
      const adminMessageId = `admin_${Date.now()}`
      
      // 관리자 메시지만 포함된 새로운 대화 생성
      const conversationData = [
        {
          id: adminMessageId,
          sender_type: 'admin',
          sender_name: '관리자',
          message_text: chatInput,
          timestamp: now
        }
      ]

      const newConversation = await dataService.entities.chat_conversations.create({
        chat_room_id: selectedChatRoom.id,
        conversation_data: conversationData,
        message_count: 1,
        first_message_at: now,
        last_message_at: now,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (newConversation) {
        setChatInput('')
        await loadChatMessages(selectedChatRoom.id)
        toast.success('메시지가 전송되었습니다')
      }
    } catch (error) {
      console.error('관리자 메시지 전송 실패:', error)
      toast.error('메시지 전송에 실패했습니다')
    }
  }

  // 채팅방 선택
  const selectChatRoom = async (room: any) => {
    setSelectedChatRoom(room)
    await loadChatMessages(room.id)
    
    // 해당 채팅방의 알림을 읽음으로 표시
    try {
      const roomNotifications = chatNotifications.filter(n => n.chat_room_id === room.id)
      await Promise.all(
        roomNotifications.map(notification =>
          dataService.entities.admin_chat_notifications.update(notification.id, { is_read: true })
        )
      )
      await loadChatNotifications()
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      // 순차적으로 로드하여 브라우저 리소스 부족 방지
      await loadApplications()
      await loadExperiences()
      await loadNotifications()
      await loadUsers()
      await loadWithdrawalRequests()
      await loadConsultationRequests()
      await loadChatRooms()
      await loadChatNotifications()
      await loadOnlineUsers()
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      toast.error('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 새로고침
  const handleRefresh = async () => {
    setRefreshing(true)
    await loadAllData()
    setRefreshing(false)
    toast.success('데이터가 새로고침되었습니다')
  }

  // 실시간 온라인 상태 업데이트
  useEffect(() => {
    const interval = setInterval(() => {
      loadOnlineUsers()
    }, 30000) // 30초마다 업데이트 (브라우저 리소스 절약)

    return () => clearInterval(interval)
  }, [])

  // 환급 요청 엑셀 다운로드
  const exportWithdrawalRequestsToExcel = () => {
    try {
      // 필터링된 환급 요청 데이터 가져오기
      const filteredRequests = getFilteredWithdrawalRequests()
      
      // CSV 헤더
      const headers = [
        '번호',
        '이름',
        'USER_ID',
        '전화번호',
        '계좌번호',
        '주소',
        '해당 캠페인',
        '포인트',
        '입금금액 (3.3% 공제)',
        '환급 요청 횟수',
        '요청일',
        '상태'
      ]
      
      // CSV 데이터 생성
      const csvData = filteredRequests.map((request, index) => {
        const taxRate = 0.033 // 3.3%
        const taxAmount = Math.floor(request.points_amount * taxRate)
        const finalAmount = request.points_amount - taxAmount
        
        return [
          index + 1,
          request.user_data?.name || request.user_profile?.name || '정보 없음',
          request.user_id,
          request.user_data?.phone || request.user_profile?.phone || '정보 없음',
          `${request.bank_account?.bank_name || ''} ${request.bank_account?.account_number || ''}`,
          request.user_data?.address || request.user_profile?.address || '정보 없음',
          request.user_applications?.[0]?.campaign_name || '정보 없음',
          request.points_amount.toLocaleString() + 'P',
          finalAmount.toLocaleString() + '원',
          request.withdrawal_count,
          new Date(request.created_at).toLocaleDateString('ko-KR'),
          request.status === 'pending' ? '대기' : 
          request.status === 'approved' ? '승인' :
          request.status === 'completed' ? '완료' :
          request.status === 'rejected' ? '거부' : request.status
        ]
      })
      
      // CSV 문자열 생성
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')
      
      // BOM 추가 (한글 깨짐 방지)
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      
      // 다운로드
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `환급요청_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('환급 요청 데이터가 다운로드되었습니다.')
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error)
      toast.error('다운로드 중 오류가 발생했습니다.')
    }
  }

  // 환급 요청 필터링
  const getFilteredWithdrawalRequests = () => {
    let filtered = withdrawalRequests

    // 완료된 내역 표시 옵션
    if (!showCompletedWithdrawals) {
      filtered = filtered.filter(request => 
        request.status !== 'completed' && request.status !== 'approved'
      )
    }

    // 특정 사용자 필터
    if (selectedUserId) {
      filtered = filtered.filter(request => request.user_id === selectedUserId)
    }

    // 상태 필터
    if (withdrawalFilter !== 'all') {
      filtered = filtered.filter(request => request.status === withdrawalFilter)
    }

    // 검색 필터
    if (withdrawalSearch) {
      const searchLower = withdrawalSearch.toLowerCase()
      filtered = filtered.filter(request => 
        request.user_data?.name?.toLowerCase().includes(searchLower) ||
        request.user_profile?.name?.toLowerCase().includes(searchLower) ||
        request.user_id.toLowerCase().includes(searchLower) ||
        request.user_data?.phone?.includes(searchLower) ||
        request.user_profile?.phone?.includes(searchLower) ||
        request.bank_account?.account_number?.includes(searchLower)
      )
    }

    return filtered
  }

  // 환급 요청 승인
  const handleApproveWithdrawal = async (requestId: string, adminNotes?: string) => {
    if (loading) {
      console.log('⚠️ 이미 처리 중입니다. 중복 실행 방지.')
      return
    }
    
    setLoading(true)
    let rollbackData: any = null
    
    try {
      console.log('🚀 출금 승인 프로세스 시작:', requestId)
      
      // 1. 출금 요청 정보 조회
      const withdrawalRequests = await dataService.entities.withdrawal_requests.list()
      const withdrawalRequest = withdrawalRequests.find((req: any) => req.id === requestId)
      
      if (!withdrawalRequest) {
        toast.error('출금 요청을 찾을 수 없습니다.')
        return
      }

      const userId = withdrawalRequest.user_id
      const withdrawalAmount = withdrawalRequest.points_amount
      const currentStatus = withdrawalRequest.status

      console.log('📋 출금 요청 정보:', {
        requestId,
        userId,
        withdrawalAmount,
        currentStatus,
        adminNotes
      })

      // 이미 처리된 요청인지 확인
      if (currentStatus !== 'pending') {
        toast.error(`이미 처리된 출금 요청입니다. (현재 상태: ${currentStatus})`)
        return
      }

      // 2. 사용자 포인트 정보 조회
      const userPointsList = await dataService.entities.user_points.list()
      const userPoints = userPointsList.find((up: any) => up.user_id === userId)
      
      if (!userPoints) {
        toast.error('사용자 포인트 정보를 찾을 수 없습니다.')
        return
      }

      // 롤백을 위한 원본 데이터 저장
      rollbackData = {
        userPointsId: userPoints.id || userPoints._id,
        originalAvailablePoints: userPoints.points || 0,
        originalWithdrawnPoints: userPoints.used_points || 0
      }

      console.log('💰 사용자 포인트 정보:', {
        userId,
        currentAvailablePoints: rollbackData.originalAvailablePoints,
        currentWithdrawnPoints: rollbackData.originalWithdrawnPoints,
        withdrawalAmount
      })

      // 3. 포인트 차감 계산 및 유효성 검사
      if (rollbackData.originalAvailablePoints < withdrawalAmount) {
        toast.error(`사용자의 가용 포인트가 부족합니다. (보유: ${rollbackData.originalAvailablePoints}P, 요청: ${withdrawalAmount}P)`)
        return
      }

      const newAvailablePoints = rollbackData.originalAvailablePoints - withdrawalAmount
      const newWithdrawnPoints = rollbackData.originalWithdrawnPoints + withdrawalAmount

      console.log('🔄 포인트 차감 계산:', {
        기존가용포인트: rollbackData.originalAvailablePoints,
        출금요청금액: withdrawalAmount,
        신규가용포인트: newAvailablePoints,
        기존출금포인트: rollbackData.originalWithdrawnPoints,
        신규출금포인트: newWithdrawnPoints
      })

      // 4. user_points 테이블 업데이트
      const updateResult = await dataService.entities.user_points.update(rollbackData.userPointsId, {
        points: newAvailablePoints,
        used_points: newWithdrawnPoints,
        updated_at: new Date().toISOString()
      })
      
      if (!updateResult) {
        throw new Error('포인트 차감 업데이트 실패')
      }

      console.log('✅ 포인트 차감 완료:', {
        차감금액: `${withdrawalAmount}P`,
        가용포인트변화: `${rollbackData.originalAvailablePoints}P → ${newAvailablePoints}P`,
        출금포인트변화: `${rollbackData.originalWithdrawnPoints}P → ${newWithdrawnPoints}P`
      })

      // 5. points_history에 출금 기록 추가
      const historyResult = await dataService.entities.points_history.create({
        user_id: userId,
        points_amount: -withdrawalAmount,
        type: 'withdrawn',
        points_type: 'withdrawn',
        status: 'success',
        payment_status: '출금승인',
        description: `포인트 출금 승인 - 관리자 처리${adminNotes ? ` (${adminNotes})` : ''}`,
        transaction_date: new Date().toISOString(),
        created_at: new Date().toISOString()
      })

      if (!historyResult) {
        throw new Error('포인트 히스토리 기록 실패')
      }

      console.log('📝 출금 히스토리 기록 완료:', withdrawalAmount)

      // 6. 출금 요청 상태 업데이트
      const withdrawalUpdateResult = await dataService.entities.withdrawal_requests.update(requestId, {
        status: 'approved',
        processed_by: 'admin',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes || '출금 요청 승인'
      })

      if (!withdrawalUpdateResult) {
        throw new Error('출금 요청 상태 업데이트 실패')
      }

      // 7. 성공 알림 및 데이터 새로고침
      toast.success(`출금 요청이 승인되었습니다. (${withdrawalAmount}P 차감 완료)`)
      await loadWithdrawalRequests()
      
      // 8. 알림톡 발송
      try {
        const userProfile = await dataService.entities.user_profiles.get(userId)
        if (userProfile?.phone) {
          await alimtalkService.sendWithdrawalApprovalAlimtalk(
            userProfile.phone,
            userProfile.name || '사용자',
            withdrawalAmount
          )
          console.log('✅ 출금 승인 알림톡 발송 완료')
        }
      } catch (alimtalkError) {
        console.error('⚠️ 알림톡 발송 실패 (승인은 완료됨):', alimtalkError)
      }
      
      // 9. 관리자 알림 생성
      await dataService.entities.admin_notifications.create({
        type: 'withdrawal_approved',
        title: '출금 요청 승인',
        message: `출금 요청이 승인되었습니다. (사용자: ${userId}, 금액: ${withdrawalAmount}P)`,
        is_read: false,
        created_at: new Date().toISOString()
      })

      console.log('🎉 출금 승인 프로세스 완료!')

    } catch (error) {
      console.error('❌ 출금 승인 실패:', error)
      
      // 롤백 처리 (포인트 차감이 이미 이루어진 경우)
      if (rollbackData) {
        try {
          console.log('🔄 포인트 차감 롤백 시도...')
          await dataService.entities.user_points.update(rollbackData.userPointsId, {
            points: rollbackData.originalAvailablePoints,
            used_points: rollbackData.originalWithdrawnPoints,
            updated_at: new Date().toISOString()
          })
          console.log('✅ 포인트 차감 롤백 완료')
        } catch (rollbackError) {
          console.error('❌ 롤백 실패:', rollbackError)
          toast.error('포인트 차감 롤백에 실패했습니다. 관리자에게 문의하세요.')
        }
      }
      
      toast.error(`출금 승인 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`)
    } finally {
      setLoading(false)
    }
  }

  // 출금 요청 거부
  const handleRejectWithdrawal = async (requestId: string, adminNotes?: string) => {
    try {
      const result = await dataService.entities.withdrawal_requests.update(requestId, {
        status: 'rejected',
        processed_by: 'admin',
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes || '출금 요청 거부'
      })

      if (result) {
        toast.success('출금 요청이 거부되었습니다.')
        await loadWithdrawalRequests()
        
        // 관리자 알림 생성 (priority 필드 제거)
        await dataService.entities.admin_notifications.create({
          type: 'withdrawal_rejected',
          title: '출금 요청 거부',
          message: `출금 요청이 거부되었습니다. (ID: ${requestId})`,
          is_read: false,
          created_at: new Date().toISOString()
        })
      } else {
        toast.error('출금 요청 거부에 실패했습니다.')
      }
    } catch (error) {
      console.error('출금 요청 거부 실패:', error)
      toast.error('출금 요청 거부 중 오류가 발생했습니다.')
    }
  }

  // 출금 요청 완료 처리
  // 출금 정보 저장
  const handleSaveWithdrawalInfo = async () => {
    if (!selectedWithdrawalRequest) return

    try {
      const updateData = {
        points_amount: editWithdrawalInfo.points_amount,
        withdrawal_amount: editWithdrawalInfo.withdrawal_amount,
        exchange_rate: editWithdrawalInfo.exchange_rate,
        status: editWithdrawalInfo.status,
        request_reason: editWithdrawalInfo.request_reason
      }

      const { error } = await supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', selectedWithdrawalRequest.id)

      if (error) throw error

      toast.success('출금 정보가 저장되었습니다.')
      setIsEditingWithdrawalInfo(false)
      await loadWithdrawalRequests()

      // 모달 업데이트를 위해 선택된 요청 다시 가져오기
      const updatedRequests = await (dataService.entities as any).withdrawal_requests.list()
      const updatedRequest = updatedRequests.find((r: any) => r.id === selectedWithdrawalRequest.id)
      if (updatedRequest) {
        setSelectedWithdrawalRequest({...selectedWithdrawalRequest, ...updateData})
      }
    } catch (error) {
      console.error('저장 실패:', error)
      toast.error('출금 정보 저장에 실패했습니다.')
    }
  }

  // 은행 정보 및 주민등록번호 저장
  const handleSaveBankInfo = async () => {
    if (!selectedWithdrawalRequest) return

    try {
      const userId = selectedWithdrawalRequest.user_id

      // 은행 계좌 정보 업데이트 또는 생성
      if (editBankInfo.bank_name || editBankInfo.account_number || editBankInfo.account_holder) {
        const bankData = {
          user_id: userId,
          bank_name: editBankInfo.bank_name,
          account_number: editBankInfo.account_number,
          account_holder: editBankInfo.account_holder,
          is_verified: false
        }

        // 기존 계좌가 있으면 업데이트, 없으면 생성
        if (selectedWithdrawalRequest.bank_account?.id) {
          await supabase
            .from('bank_accounts')
            .update(bankData)
            .eq('id', selectedWithdrawalRequest.bank_account.id)
        } else {
          await supabase
            .from('bank_accounts')
            .insert(bankData)
        }
      }

      // 주민등록번호 업데이트 (influencer_profiles 테이블)
      if (editBankInfo.resident_number) {
        await supabase
          .from('influencer_profiles')
          .update({ resident_number: editBankInfo.resident_number.replace(/-/g, '') })
          .eq('user_id', userId)
      }

      toast.success('정보가 저장되었습니다.')
      setIsEditingBankInfo(false)
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('저장 실패:', error)
      toast.error('정보 저장에 실패했습니다.')
    }
  }

  // 출금 요청 상세 모달 - 사용자 정보 저장
  const handleSaveUserInfo = async () => {
    if (!selectedWithdrawalRequest) return
    try {
      const userId = selectedWithdrawalRequest.user_id

      // users 테이블 업데이트
      await supabase
        .from('users')
        .update({
          name: editUserInfo.name,
          phone: editUserInfo.phone,
          address: editUserInfo.address
        })
        .eq('user_id', userId)

      // user_profiles 테이블도 업데이트
      await supabase
        .from('user_profiles')
        .update({
          name: editUserInfo.name,
          phone: editUserInfo.phone,
          address: editUserInfo.address
        })
        .eq('user_id', userId)

      toast.success('사용자 정보가 저장되었습니다.')
      setIsEditingUserInfo(false)
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('사용자 정보 저장 실패:', error)
      toast.error('사용자 정보 저장에 실패했습니다.')
    }
  }

  // 출금 요청 상세 모달 - 계좌 정보 저장
  const handleSaveAccountInfo = async () => {
    if (!selectedWithdrawalRequest) return
    try {
      const userId = selectedWithdrawalRequest.user_id
      const bankData = {
        user_id: userId,
        bank_name: editWithdrawalAccountInfo.bank_name,
        account_number: editWithdrawalAccountInfo.account_number,
        account_holder: editWithdrawalAccountInfo.account_holder,
        is_verified: editWithdrawalAccountInfo.is_verified
      }

      if (selectedWithdrawalRequest.bank_account?.id) {
        await supabase
          .from('bank_accounts')
          .update(bankData)
          .eq('id', selectedWithdrawalRequest.bank_account.id)
      } else {
        await supabase
          .from('bank_accounts')
          .insert(bankData)
      }

      toast.success('계좌 정보가 저장되었습니다.')
      setIsEditingAccountInfo(false)
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('계좌 정보 저장 실패:', error)
      toast.error('계좌 정보 저장에 실패했습니다.')
    }
  }

  // 출금 요청 상세 모달 - 환급 정보 저장
  const handleSaveRefundInfo = async () => {
    if (!selectedWithdrawalRequest) return
    try {
      await supabase
        .from('withdrawal_requests')
        .update({
          points_amount: editRefundInfo.points_amount,
          withdrawal_amount: editRefundInfo.points_amount - Math.floor(editRefundInfo.points_amount * 0.033)
        })
        .eq('id', selectedWithdrawalRequest.id)

      toast.success('환급 정보가 저장되었습니다.')
      setIsEditingRefundInfo(false)
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('환급 정보 저장 실패:', error)
      toast.error('환급 정보 저장에 실패했습니다.')
    }
  }

  // 출금 요청 상세 모달 - 요청 정보 저장
  const handleSaveRequestInfo = async () => {
    if (!selectedWithdrawalRequest) return
    try {
      await supabase
        .from('withdrawal_requests')
        .update({
          status: editRequestInfo.status,
          request_reason: editRequestInfo.request_reason
        })
        .eq('id', selectedWithdrawalRequest.id)

      toast.success('요청 정보가 저장되었습니다.')
      setIsEditingRequestInfo(false)
      await loadWithdrawalRequests()
    } catch (error) {
      console.error('요청 정보 저장 실패:', error)
      toast.error('요청 정보 저장에 실패했습니다.')
    }
  }

  const handleCompleteWithdrawal = async (requestId: string, adminNotes?: string) => {
    try {
      const result = await dataService.entities.withdrawal_requests.update(requestId, {
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_notes: adminNotes || '출금 완료 처리'
      })

      if (result) {
        toast.success('출금이 완료되었습니다.')
        await loadWithdrawalRequests()
        
        // 관리자 알림 생성 (priority 필드 제거)
        await dataService.entities.admin_notifications.create({
          type: 'withdrawal_completed',
          title: '출금 완료',
          message: `출금이 완료되었습니다. (ID: ${requestId})`,
          is_read: false,
          created_at: new Date().toISOString()
        })
      } else {
        toast.error('출금 완료 처리에 실패했습니다.')
      }
    } catch (error) {
      console.error('출금 완료 처리 실패:', error)
      toast.error('출금 완료 처리 중 오류가 발생했습니다.')
    }
  }

  // 일괄 처리 함수들
  const handleBulkApprove = async () => {
    try {
      if (selectedApplications.size === 0) {
        toast.error('승인할 신청을 선택해주세요')
        return
      }

      setBulkActionLoading(true)

      // 선택된 신청들을 승인 상태로 업데이트
      let successCount = 0
      let failCount = 0

      for (const applicationId of selectedApplications) {
        try {
          console.log('📝 신청 승인 처리:', applicationId)

          // 신청 정보 가져오기 (알림톡 발송을 위해)
          const application = applications.find(app => (app.id || app._id) === applicationId)

          await supabase
            .from('user_applications')
            .update({
              status: 'approved',
              updated_at: new Date().toISOString()
            })
            .eq('id', applicationId)

          // 🔥 알림톡 발송 (체험단 선정)
          if (application) {
            const userPhone = application.phone || application.user_profile?.phone
            const userName = application.name || '회원'
            const campaignName = application.campaign_name || application.experience_name || '체험단'
            const rewardPoints = application.points || application.reward_points || 0

            if (userPhone) {
              try {
                await alimtalkService.sendApplicationApprovedAlimtalk(
                  userPhone,
                  userName,
                  campaignName,
                  rewardPoints
                )
                console.log('✅ 체험단 선정 알림톡 발송 완료:', userName)
              } catch (alimtalkError) {
                console.error('⚠️ 알림톡 발송 실패 (승인은 완료됨):', alimtalkError)
              }
            }
          }

          successCount++
        } catch (error) {
          console.error(`신청 ${applicationId} 승인 실패:`, error)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(`${successCount}개의 신청이 승인되었습니다`)
      }
      if (failCount > 0) {
        toast.error(`${failCount}개의 신청 승인에 실패했습니다`)
      }

      setSelectedApplications(new Set())
      await loadApplications()
    } catch (error) {
      console.error('일괄 승인 실패:', error)
      toast.error('일괄 승인에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 체험단 삭제
  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('정말로 이 체험단을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      await (dataService.entities as any).campaigns.delete(experienceId)
      toast.success('체험단이 삭제되었습니다')
      await loadExperiences()
    } catch (error) {
      console.error('체험단 삭제 실패:', error)
      toast.error('체험단 삭제에 실패했습니다')
    }
  }

  // 🔥 개별 체험단 신청 승인
  const handleApproveApplication = async (applicationId: string) => {
    try {
      console.log('📝 체험단 신청 승인 처리:', applicationId)

      // 신청 정보 가져오기
      const application = applications.find(app => (app.id || app._id) === applicationId)
      if (!application) {
        toast.error('신청 정보를 찾을 수 없습니다')
        return
      }

      // DB 업데이트
      await supabase
        .from('user_applications')
        .update({
          status: 'approved',
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      // 🔥 알림톡 발송 (체험단 선정)
      const userPhone = application.phone || application.user_profile?.phone
      const userName = application.name || '회원'
      const campaignName = application.campaign_name || application.experience_name || '체험단'
      const rewardPoints = application.points || application.reward_points || 0

      if (userPhone) {
        try {
          await alimtalkService.sendApplicationApprovedAlimtalk(
            userPhone,
            userName,
            campaignName,
            rewardPoints
          )
          console.log('✅ 체험단 선정 알림톡 발송 완료:', userName)
        } catch (alimtalkError) {
          console.error('⚠️ 알림톡 발송 실패 (승인은 완료됨):', alimtalkError)
        }
      }

      toast.success(`${userName}님의 신청이 승인되었습니다`)
      await loadApplications()
    } catch (error) {
      console.error('체험단 신청 승인 실패:', error)
      toast.error('신청 승인에 실패했습니다')
    }
  }

  // 🔥 개별 체험단 신청 반려
  const handleRejectApplication = async (applicationId: string, reason: string) => {
    try {
      if (!reason || reason.trim() === '') {
        toast.error('반려 사유를 입력해주세요')
        return
      }

      console.log('📝 체험단 신청 반려 처리:', applicationId)

      // 신청 정보 가져오기
      const application = applications.find(app => (app.id || app._id) === applicationId)
      if (!application) {
        toast.error('신청 정보를 찾을 수 없습니다')
        return
      }

      // DB 업데이트
      await supabase
        .from('user_applications')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim(),
          rejected_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', applicationId)

      // 🔥 알림톡 발송 (체험단 신청 반려)
      const userPhone = application.phone || application.user_profile?.phone
      const userName = application.name || '회원'
      const campaignName = application.campaign_name || application.experience_name || '체험단'

      if (userPhone) {
        try {
          await alimtalkService.sendApplicationRejectedAlimtalk(
            userPhone,
            userName,
            campaignName,
            reason.trim()
          )
          console.log('✅ 체험단 신청 반려 알림톡 발송 완료:', userName)
        } catch (alimtalkError) {
          console.error('⚠️ 알림톡 발송 실패 (반려는 완료됨):', alimtalkError)
        }
      }

      toast.success(`${userName}님의 신청이 반려되었습니다`)
      setShowRejectionModal(false)
      await loadApplications()
    } catch (error) {
      console.error('체험단 신청 반려 실패:', error)
      toast.error('신청 반려에 실패했습니다')
    }
  }

  // 필터링된 데이터
  const filteredApplications = applications.filter(app => {
    if (applicationFilter !== 'all' && app.status !== applicationFilter) return false
    if (applicationSearch && !app.name?.toLowerCase().includes(applicationSearch.toLowerCase())) return false
    return true
  })

  // 필터링된 회원 데이터
  const filteredUsers = users.filter(user => {
    if (userSearch && !user.name?.toLowerCase().includes(userSearch.toLowerCase()) && 
        !user.email?.toLowerCase().includes(userSearch.toLowerCase())) return false
    return true
  })

  const filteredExperiences = experiences.filter(exp => {
    const currentStatus = exp.status || exp.campaign_status || 'active'
    
    // 상태 필터링 - status 값 기반으로 수정
    if (experienceFilter === 'recruiting' && !(currentStatus === 'active' || currentStatus === 'recruiting')) return false
    if (experienceFilter === 'closed' && !(currentStatus === 'closed' || currentStatus === 'completed')) return false
    
    // 검색 필터링 - 모든 가능한 제목 필드 검색 (campaign_name 우선)
    if (experienceSearch) {
      const searchTerm = experienceSearch.toLowerCase()
      const title = (exp.campaign_name || exp.product_name || exp.title || exp.experience_name || exp.name || '').toLowerCase()
      const description = (exp.description || '').toLowerCase()
      if (!title.includes(searchTerm) && !description.includes(searchTerm)) return false
    }
    return true
  })

  // 통계 계산
  const stats = {
    totalApplications: applications.length,
    pendingApplications: applications.filter(app => app.status === 'pending').length,
    approvedApplications: applications.filter(app => app.status === 'approved').length,
    reviewInProgressApplications: applications.filter(app => app.status === 'review_in_progress').length,
    reviewCompletedApplications: applications.filter(app => app.status === 'review_completed').length,
    pointRequestedApplications: applications.filter(app => app.status === 'point_requested').length,
    pointCompletedApplications: applications.filter(app => app.status === 'point_completed').length,
    rejectedApplications: applications.filter(app => app.status === 'rejected').length,
    totalExperiences: experiences.length
  }

  useEffect(() => {
    if (isAuthenticated && isAdminUser()) {
      loadAllData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 대시보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center gap-8">
              <div>
                <h1 className="text-xl font-bold text-gray-900">관리자 대시보드</h1>
              </div>

              {/* 네비게이션 탭 */}
              <nav className="flex gap-1">
                <button
                  onClick={() => setActiveTab('users')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'users'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  회원
                </button>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'campaigns'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  캠페인
                </button>
                <button
                  onClick={() => setActiveTab('consultations')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'consultations'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  상담 접수
                </button>
                <button
                  onClick={() => navigate('/admin/chat')}
                  className="px-4 py-2 text-sm font-medium rounded-lg transition-colors text-gray-600 hover:bg-gray-100"
                >
                  실시간 채팅
                </button>
                <button
                  onClick={() => setActiveTab('withdrawals')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === 'withdrawals'
                      ? 'bg-purple-100 text-purple-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  출금 관리
                </button>
              </nav>
            </div>

            <div className="flex gap-2">
              {/* 알림 아이콘 */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="flex items-center gap-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                >
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                      {unreadNotifications}
                    </span>
                  )}
                </button>
              </div>

              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 text-sm"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-1 px-3 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm"
              >
                <Home className="w-4 h-4" />
                홈
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 패널 */}
      {showNotifications && (
        <div className="backdrop-blur-sm bg-white/95 shadow-2xl border-b border-white/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">관리자 알림</h2>
              <div className="flex items-center gap-3">
                {unreadNotifications > 0 && (
                  <button
                    onClick={markAllNotificationsAsRead}
                    className="px-4 py-2 text-sm bg-gradient-to-r from-primary-100 to-primary-200 text-primary-700 hover:scale-105 hover:shadow-lg rounded-xl transition-all duration-200 font-medium"
                  >
                    모두 읽음
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600 hover:scale-110 transition-all duration-200 p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>
            
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">알림이 없습니다.</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    onClick={() => !notification.is_read && markNotificationAsRead(notification.id)}
                    className={`p-6 rounded-2xl border-2 cursor-pointer transition-all duration-200 hover:scale-[1.02] hover:shadow-xl ${
                      notification.is_read ? 'bg-gray-50/50 backdrop-blur-sm border-gray-200' :
                      notification.type === 'point_request' ? 'bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-300 hover:shadow-orange-200' : 'bg-gradient-to-br from-primary-50 to-primary-100/50 border-blue-300 hover:shadow-blue-200'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          {!notification.is_read && (
                            <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                          )}
                          <h3 className="font-medium text-gray-900">{notification.title}</h3>
                          {notification.type === 'point_request' && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 text-xs rounded-full font-semibold shadow-sm">
                              포인트 요청
                            </span>
                          )}
                          {notification.type === 'email_sent' && (
                            <span className="px-3 py-1.5 bg-gradient-to-r from-green-100 to-green-200 text-green-800 text-xs rounded-full font-semibold shadow-sm">
                              이메일 발송
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                        {notification.type === 'point_request' && notification.data && (
                          <div className="mt-2 p-2 bg-orange-100 rounded text-xs">
                            <p><strong>캠페인:</strong> {notification.data.campaign_name}</p>
                            <p><strong>포인트:</strong> {notification.data.point_amount}P</p>
                            <p><strong>사용자:</strong> {notification.data.user_name}</p>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(notification.created_at).toLocaleString('ko-KR')}
                        </p>
                      </div>
                      {!notification.read && (
                        <div className={`w-2 h-2 rounded-full ml-2 ${
                          notification.type === 'point_request' ? 'bg-orange-500' : 'bg-primary-500'
                        }`}></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 gap-3 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('all')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <FileText className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">총 신청</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('pending')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-4 h-4 text-yellow-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">대기중</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('approved')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('product_purchased')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Package className="w-4 h-4 text-primary-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">제품구매완료</p>
                <p className="text-2xl font-bold text-gray-900">{applications.filter(app => app.status === 'product_purchased').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('shipping')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-100 rounded-lg">
                <Truck className="w-4 h-4 text-navy-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">배송중</p>
                <p className="text-2xl font-bold text-gray-900">{applications.filter(app => app.status === 'shipping').length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('review_in_progress')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-navy-100 rounded-lg">
                <FileText className="w-4 h-4 text-navy-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">리뷰제출완료</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reviewInProgressApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('review_completed')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">리뷰승인완료</p>
                <p className="text-2xl font-bold text-gray-900">{stats.reviewCompletedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('point_requested')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Gift className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">포인트지급요청</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pointRequestedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('point_completed')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">포인트지급완료</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pointCompletedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setApplicationFilter('rejected')}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <p className="text-xs text-gray-500">거절됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedApplications}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 메인 탭 메뉴 (업무 흐름 순서) */}
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8 overflow-hidden">
          <div className="border-b border-white/50">
            <nav className="-mb-px flex space-x-2 px-8 py-2" aria-label="Tabs">
              <button
                onClick={() => setActiveTab('applications')}
                className={`py-4 px-6 rounded-t-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-200 ${
                  activeTab === 'applications'
                    ? 'bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <FileText className="w-5 h-5" />
                <span>1. 신청 관리</span>
              </button>
              <button
                onClick={() => setActiveTab('reviews')}
                className={`py-4 px-6 rounded-t-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-200 ${
                  activeTab === 'reviews'
                    ? 'bg-gradient-to-br from-navy-500 to-navy-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <UserCheck className="w-5 h-5" />
                <span>2. 리뷰 검수</span>
              </button>
              <button
                onClick={() => setActiveTab('point-requests')}
                className={`py-4 px-6 rounded-t-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-200 ${
                  activeTab === 'point-requests'
                    ? 'bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Gift className="w-5 h-5" />
                <span>3. 포인트 지급</span>
                {stats.pointRequestedApplications > 0 && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                    activeTab === 'point-requests' ? 'bg-white text-orange-600' : 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800'
                  }`}>
                    {stats.pointRequestedApplications}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('withdrawal-requests')}
                className={`py-4 px-6 rounded-t-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-200 ${
                  activeTab === 'withdrawal-requests'
                    ? 'bg-gradient-to-br from-navy-500 to-navy-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>4. 출금 요청</span>
                {withdrawalRequests.filter(req => req.status === 'pending').length > 0 && (
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-lg ${
                    activeTab === 'withdrawal-requests' ? 'bg-white text-navy-600' : 'bg-gradient-to-r from-navy-100 to-navy-200 text-navy-800'
                  }`}>
                    {withdrawalRequests.filter(req => req.status === 'pending').length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`py-4 px-6 rounded-t-2xl font-semibold text-sm flex items-center gap-3 transition-all duration-200 ${
                  activeTab === 'settings'
                    ? 'bg-gradient-to-br from-gray-500 to-gray-600 text-white shadow-lg scale-105'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Settings className="w-5 h-5" />
                <span>5. 설정</span>
              </button>
            </nav>
          </div>
        </div>

        {/* Applications Section */}
        {activeTab === 'applications' && (
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
          <div className="px-8 py-6 border-b border-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">신청 관리</h2>
              <div className="flex gap-3">
          <button
                  onClick={handleBulkApprove}
                  disabled={selectedApplications.size === 0 || bulkActionLoading}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 font-medium"
          >
                  <CheckCircle className="w-5 h-5" />
                  일괄 승인
          </button>
          <button
                  onClick={() => setShowRejectionModal(true)}
                  disabled={selectedApplications.size === 0}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:hover:scale-100 font-medium"
                >
                  <XCircle className="w-5 h-5" />
                  일괄 거절
          </button>
        </div>
            </div>
            </div>
            
          <div className="p-8">
            <div className="flex gap-4 mb-6">
            <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl focus:border-primary-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium text-gray-700 bg-white hover:border-primary-400"
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
                <option value="review_in_progress">리뷰제출완료</option>
                <option value="review_resubmitted">리뷰보완제출</option>
                <option value="review_rejected">리뷰반려</option>
                <option value="review_completed">리뷰승인완료</option>
                <option value="point_requested">포인트지급요청</option>
                <option value="point_completed">포인트지급완료</option>
                <option value="rejected">거절됨</option>
            </select>
              <input
                type="text"
                placeholder="신청자 검색..."
                value={applicationSearch}
                onChange={(e) => setApplicationSearch(e.target.value)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl flex-1 focus:border-primary-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 font-medium text-gray-700 placeholder-gray-400"
              />
        </div>

              <div className="overflow-x-auto rounded-2xl border-2 border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedApplications(new Set(filteredApplications.map(app => app.id)))
                          } else {
                            setSelectedApplications(new Set())
                          }
                        }}
                        className="rounded border-gray-300 w-5 h-5 cursor-pointer"
                        />
                      </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">신청자</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">체험단</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">신청일</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-blue-50 transition-colors duration-150">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                          checked={selectedApplications.has(application.id)}
                          onChange={(e) => {
                            const newSelected = new Set(selectedApplications)
                            if (e.target.checked) {
                              newSelected.add(application.id)
                            } else {
                              newSelected.delete(application.id)
                            }
                            setSelectedApplications(newSelected)
                          }}
                          className="rounded border-gray-300 w-5 h-5 cursor-pointer"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div 
                                className="cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setShowApplicationDetailModal(true)
                                }}
                              >
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                          {(application.address || application.detailed_address) && (
                            <div className="text-xs text-gray-600 mt-1">
                              {application.address && <div>{application.address}</div>}
                              {application.detailed_address && <div>{application.detailed_address}</div>}
                            </div>
                          )}
                          <div className="text-xs text-primary-600 mt-1">클릭하여 상세보기</div>
                              </div>
                            </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium">{application.campaign_name}</div>
                          <div className="text-xs text-gray-500 truncate max-w-48">
                            {application.campaign_description}
                          </div>
                        </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm ${
                          application.status === 'approved' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                          application.status === 'review_in_progress' ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800' :
                          application.status === 'review_completed' ? 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' :
                          application.status === 'product_purchased' ? 'bg-gradient-to-r from-primary-100 to-primary-200 text-primary-800' :
                          application.status === 'shipping' ? 'bg-gradient-to-r from-navy-100 to-navy-200 text-navy-800' :
                          application.status === 'delivered' ? 'bg-gradient-to-r from-navy-100 to-navy-200 text-navy-800' :
                          application.status === 'point_requested' ? 'bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800' :
                          application.status === 'point_completed' ? 'bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800' :
                          application.status === 'rejected' ? 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' :
                          'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800'
                        }`}>
                          {application.status === 'approved' ? '승인됨' :
                           application.status === 'product_purchased' ? '제품구매완료' :
                           application.status === 'shipping' ? '제품배송중' :
                           application.status === 'delivered' ? '제품수령완료' :
                           application.status === 'review_in_progress' ? '리뷰제출완료' :
                           application.status === 'review_resubmitted' ? '리뷰보완제출' :
                           application.status === 'review_rejected' ? '리뷰반려' :
                           application.status === 'review_completed' ? '리뷰승인완료' :
                           application.status === 'point_requested' ? '포인트지급요청' :
                           application.status === 'point_completed' ? '포인트지급완료' :
                           application.status === 'rejected' ? '거절됨' : '대기중'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {(() => {
                          const dateStr = application.applied_at || application.created_at
                          if (!dateStr) return '날짜 없음'
                          try {
                            const date = new Date(dateStr)
                            if (isNaN(date.getTime())) return '날짜 없음'
                            return date.toLocaleDateString('ko-KR')
                          } catch {
                            return '날짜 없음'
                          }
                        })()}
                            </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          {/* 승인/거절 버튼 (대기중인 경우만) */}
                          {application.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setShowApprovalModal(true)
                                }}
                                className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                                title="승인"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setShowRejectionModal(true)
                                }}
                                className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                                title="거절"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}

                          {/* 배송 정보 등록/수정 버튼 (제품 구매 완료 또는 배송중인 경우) */}
                          {(application.status === 'product_purchased' || application.status === 'shipping') && (
                            <button
                              onClick={() => handleShippingModal(application)}
                              className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                              title={application.status === 'shipping' ? '배송 정보 수정' : '배송 정보 등록'}
                            >
                              <Truck className="w-5 h-5" />
                            </button>
                          )}
                          
                          {/* 배송 추적 정보 (배송중인 경우) */}
                          {application.status === 'shipping' && (
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">
                                {application.courier && application.tracking_number ? 
                                  `${application.courier}: ${application.tracking_number}` : 
                                  '배송중'
                                }
                              </span>
                            </div>
                          )}
                        </div>
                            </td>
                          </tr>
                  ))}
                  </tbody>
                </table>
            </div>
          </div>
        </div>
        )}

        {/* 포인트 지급 요청 Section */}
        {activeTab === 'point-requests' && (
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
          <div className="px-8 py-6 border-b border-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">포인트 지급 요청 관리</h2>
              <div className="text-sm font-semibold text-gray-700 bg-gradient-to-r from-orange-100 to-orange-200 px-4 py-2 rounded-xl">
                총 {stats.pointRequestedApplications}개의 요청
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-4 mb-6">
              <select
                value={pointRequestFilter}
                onChange={(e) => setPointRequestFilter(e.target.value)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200 font-medium text-gray-700 bg-white hover:border-orange-400"
              >
                <option value="all">전체</option>
                <option value="point_requested">포인트 지급 요청</option>
                <option value="point_approved">포인트 지급 승인</option>
                <option value="point_completed">포인트 지급 완료</option>
              </select>
            </div>
            
            {(() => {
              const filteredPointRequests = applications.filter(app => {
                if (pointRequestFilter === 'all') {
                  return app.status === 'point_requested' || app.status === 'point_approved' || app.status === 'point_completed'
                }
                return app.status === pointRequestFilter
              })
              
              return filteredPointRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">
                    {pointRequestFilter === 'all' ? '포인트 지급 요청이 없습니다.' :
                     pointRequestFilter === 'point_requested' ? '포인트 지급 요청이 없습니다.' :
                     pointRequestFilter === 'point_approved' ? '포인트 지급 승인 내역이 없습니다.' :
                     '포인트 지급 완료 내역이 없습니다.'}
                  </p>
                </div>
              ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">사용자</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">캠페인</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">포인트</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">요청일</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPointRequests.map((application) => (
                        <tr key={application.id || application._id} className="hover:bg-orange-50 transition-colors duration-150">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{application.name || '이름 없음'}</div>
                              <div className="text-sm text-gray-500">{application.email || '이메일 없음'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{application.campaign_name || '캠페인명 없음'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-bold bg-gradient-to-r from-orange-100 to-orange-200 text-orange-800 shadow-sm">
                              {(() => {
                                const pointAmount = application.experience?.rewards || 
                                                   application.experience?.reward_points || 
                                                   application.campaignInfo?.rewards ||
                                                   0;
                                console.log('🔍 포인트 정보 디버깅:', {
                                  applicationId: application.id || application._id,
                                  experience: application.experience,
                                  campaignInfo: application.campaignInfo,
                                  rewards: application.campaignInfo?.rewards,
                                  finalAmount: pointAmount
                                });
                                console.log('🔍 campaignInfo 전체 필드:', application.campaignInfo);
                                console.log('🔍 campaignInfo의 모든 키:', Object.keys(application.campaignInfo || {}));
                                console.log('🔍 rewards 필드 내용:', application.campaignInfo?.rewards);
                                console.log('🔍 rewards 타입:', typeof application.campaignInfo?.rewards);
                                return pointAmount;
                              })()}P
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {application.updated_at ? new Date(application.updated_at).toLocaleDateString('ko-KR') : 
                             application.created_at ? new Date(application.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                          <button
                            onClick={() => handleViewUserPoints(application.user_id, application.id || application._id)}
                            className="p-2 bg-gradient-to-r from-navy-500 to-navy-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                            title="사용자 포인트 내역"
                          >
                            <Gift className="w-5 h-5" />
                          </button>
                          {application.status === 'point_requested' && (
                            <>
                              <button
                                onClick={() => handleCompletePoints(application.id || application._id)}
                                className="p-2 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                                title="포인트 지급 승인"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleRejectPointRequest(application.id || application._id)}
                                className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                                title="포인트 지급 거절"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          {(application.status === 'point_approved' || application.status === 'point_completed') && (
                            <>
                              <button
                                onClick={() => handleEditPointRequest(application.id || application._id)}
                                className="p-2 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                                title="수정"
                              >
                                <Edit className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => handleDeletePointRequest(application.id || application._id)}
                                className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                              {application.status === 'point_approved' && (
                                <span className="text-navy-600" title="지급 승인됨">
                                  <CheckCircle className="w-4 h-4" />
                                </span>
                              )}
                              {application.status === 'point_completed' && (
                                <span className="text-green-600" title="지급 완료">
                                  <CheckCircle className="w-4 h-4" />
                                </span>
                              )}
                            </div>
                            </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
              )
            })()}
          </div>
        </div>
        )}

        {/* Experiences Section */}
        {activeTab === 'campaigns' && (
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
          <div className="px-8 py-6 border-b border-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">캠페인 관리</h2>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-600 to-navy-600 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 font-medium"
              >
                <Plus className="w-5 h-5" />
                새 체험단
              </button>
                </div>
            </div>

          <div className="p-8">
            <div className="flex gap-4 mb-6">
                  <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 font-medium text-gray-700 bg-white hover:border-green-400"
              >
                <option value="all">전체</option>
                <option value="recruiting">모집중</option>
                <option value="closed">마감</option>
                  </select>
                        <input
                type="text"
                placeholder="체험단 검색..."
                value={experienceSearch}
                onChange={(e) => setExperienceSearch(e.target.value)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl flex-1 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 font-medium text-gray-700 placeholder-gray-400"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredExperiences.map((experience) => {
                // 🔥 체험단명 우선 표시 (campaign_name이 있으면 사용, 없으면 다른 필드들 확인)
                const displayName = experience.campaign_name ||
                                  experience.product_name ||
                                  experience.title ||
                                  experience.experience_name ||
                                  experience.name ||
                                  '제목 없음'

                // 🔥 status 값 기반으로 상태 표시
                const getStatusInfo = (status: string) => {
                  switch (status) {
                    case 'active':
                    case 'recruiting':
                      return { label: '모집중', color: 'bg-gradient-to-r from-green-100 to-green-200 text-green-800' }
                    case 'closed':
                    case 'completed':
                      return { label: '마감', color: 'bg-gradient-to-r from-red-100 to-red-200 text-red-800' }
                    case 'pending':
                      return { label: '준비중', color: 'bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800' }
                    case 'cancelled':
                      return { label: '취소', color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800' }
                    default:
                      return { label: '알 수 없음', color: 'bg-gradient-to-r from-gray-100 to-gray-200 text-gray-800' }
                  }
                }

                const statusInfo = getStatusInfo(experience.status || experience.campaign_status || 'active')

                return (
                  <div key={experience.id} className="backdrop-blur-sm bg-white/90 border-2 border-gray-200 rounded-2xl p-6 hover:scale-105 hover:shadow-2xl transition-all duration-200">
                    <h3 className="font-bold text-gray-900 mb-3 text-lg">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                      {experience.description || '설명이 없습니다.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`px-4 py-2 text-xs font-bold rounded-xl shadow-sm ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={async () => {
                            console.log('🔧 캠페인 수정 버튼 클릭 - 전달할 데이터:', experience)
                            console.log('🔧 캠페인 ID:', experience.id || experience._id)
                            console.log('🔧 캠페인 이름:', experience.campaign_name || experience.title)
                            
                            // 🔥 개별 캠페인 데이터를 다시 조회하여 완전한 데이터 전달
                            try {
                              const fullCampaignData = await dataService.entities.campaigns.get(experience.id || experience._id)
                              console.log('🔧 개별 캠페인 조회 결과:', fullCampaignData)
                              setSelectedCampaign(fullCampaignData)
                            } catch (error) {
                              console.error('🔧 개별 캠페인 조회 실패:', error)
                              setSelectedCampaign(experience)
                            }
                            setShowEditModal(true)
                          }}
                          className="p-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                        >
                          <Edit3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(experience.id)}
                          className="p-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:scale-110 hover:shadow-lg transition-all duration-200"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
        )}

        {/* 회원 관리 Section */}
        {activeTab === 'users' && (
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
          <div className="px-8 py-6 border-b border-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">회원 관리</h2>
              <div className="text-sm font-semibold text-gray-700 bg-gradient-to-r from-navy-100 to-navy-200 px-4 py-2 rounded-xl">
                총 {filteredUsers.length}명의 회원
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-4 mb-6">
              <input
                type="text"
                placeholder="회원 검색 (이름, 이메일)..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="px-5 py-3 border-2 border-gray-300 rounded-xl flex-1 focus:border-navy-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 font-medium text-gray-700 placeholder-gray-400"
              />
            </div>

            <div className="overflow-x-auto rounded-2xl border-2 border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">이메일</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">가입일</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">마지막 로그인</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                        회원이 없습니다.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id || user._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          <div className="flex items-center">
                            {user.avatar_url ? (
                              <img 
                                className="w-8 h-8 rounded-full mr-3" 
                                src={user.avatar_url} 
                                alt={user.name}
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none'
                                }}
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full mr-3 bg-gray-200 flex items-center justify-center">
                                <span className="text-xs text-gray-500">
                                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                                </span>
                              </div>
                            )}
                            <div>
                              <div>{user.name || user.display_name || '이름 없음'}</div>
                              {user.provider && (
                                <div className="text-xs text-gray-400">
                                  {user.provider === 'google' ? 'Google' : 
                                   user.provider === 'kakao' ? 'Kakao' : 
                                   user.provider}
                                </div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.email || '이메일 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.last_login ? new Date(user.last_login).toLocaleDateString('ko-KR') : '로그인 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            user.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {user.email_confirmed_at ? '인증됨' : '미인증'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button
                              onClick={async () => {
                                // ⚠️ 먼저 신청 정보 초기화
                                setUserApplications([])

                                // 본인인증 정보 조회
                                try {
                                  const { data: identityInfo } = await supabase
                                    .from('user_identity_info')
                                    .select('*')
                                    .eq('user_id', user.user_id || user.id)
                                    .maybeSingle()

                                  setSelectedUser({
                                    ...user,
                                    identity_info: identityInfo
                                  })
                                } catch (error) {
                                  console.error('본인인증 정보 조회 실패:', error)
                                  setSelectedUser(user)
                                }

                                // 모달 열기
                                setShowUserDetailModal(true)
                                // 사용자 신청 정보 로드 (비동기)
                                loadUserApplications(user.user_id || user.id)
                              }}
                              className="text-primary-600 hover:text-primary-900"
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedUserForManagement(user)
                                setShowUserManagementModal(true)
                              }}
                              className="text-orange-600 hover:text-orange-900"
                              title="관리"
                            >
                              <Settings className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}

        {/* 실시간 채팅 관리 Section - 별도 페이지로 이동 */}
        {false && activeTab === 'chat' && (
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">실시간 채팅 관리</h2>
              <div className="text-sm text-gray-600">
                총 {chatRooms.length}개의 채팅방 | 미읽음 {unreadChatCount}개
              </div>
            </div>
          </div>
          
          <div className="flex h-96">
            {/* 채팅방 목록 */}
            <div className="w-1/3 border-r border-gray-200">
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-3">채팅방 목록</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {chatRooms.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>채팅방이 없습니다</p>
                    </div>
                  ) : (
                    chatRooms.map((room) => {
                      const hasUnread = chatNotifications.some(n => 
                        n.chat_room_id === room.id && !n.is_read
                      )
                      return (
                        <div
                          key={room.id}
                          onClick={() => selectChatRoom(room)}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedChatRoom?.id === room.id
                              ? 'bg-green-100 border border-green-300'
                              : 'bg-gray-50 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <div className="font-medium text-sm text-gray-900">
                                  {room.user_name || '사용자'}
                                </div>
                                {(() => {
                                  const userStatus = onlineUsers.find(u => u.user_id === room.user_id)
                                  return userStatus?.is_online ? (
                                    <div className="w-2 h-2 bg-green-500 rounded-full" title="온라인"></div>
                                  ) : (
                                    <div className="w-2 h-2 bg-gray-300 rounded-full" title="오프라인"></div>
                                  )
                                })()}
                              </div>
                              <div className="text-xs text-gray-500">
                                {room.user_email}
                              </div>
                              {room.last_message_at && (
                                <div className="text-xs text-gray-400">
                                  {new Date(room.last_message_at).toLocaleString('ko-KR', {
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </div>
                              )}
                            </div>
                            {hasUnread && (
                              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 flex flex-col">
              {selectedChatRoom ? (
                <>
                  {/* 채팅방 헤더 */}
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-gray-900">
                            {selectedChatRoom.user_name || '사용자'}
                          </h3>
                          {(() => {
                            const userStatus = onlineUsers.find(u => u.user_id === selectedChatRoom.user_id)
                            return userStatus?.is_online ? (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <span className="text-xs text-green-600">온라인</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-1">
                                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                <span className="text-xs text-gray-500">오프라인</span>
                              </div>
                            )
                          })()}
                        </div>
                        <p className="text-sm text-gray-500">
                          {selectedChatRoom.user_email}
                        </p>
                      </div>
                      <div className="text-xs text-gray-400">
                        {selectedChatRoom.status === 'active' ? (
                          <span className="text-green-600">● 온라인</span>
                        ) : (
                          <span className="text-gray-400">● 오프라인</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* 메시지 영역 */}
                  <div className="flex-1 p-4 overflow-y-auto space-y-3">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                        <p>아직 메시지가 없습니다</p>
                      </div>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                        >
                          <div
                            className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                              message.sender_type === 'user'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-green-500 text-white'
                            }`}
                          >
                            <div className="whitespace-pre-line">{message.message}</div>
                            <div className={`text-xs mt-1 ${
                              message.sender_type === 'user' ? 'text-gray-500' : 'text-green-100'
                            }`}>
                              {new Date(message.created_at).toLocaleTimeString('ko-KR', { 
                                hour: '2-digit', 
                                minute: '2-digit' 
                              })}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* 메시지 입력 영역 */}
                  <div className="p-4 border-t border-gray-200">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendAdminMessage()
                          }
                        }}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                      <button
                        onClick={sendAdminMessage}
                        disabled={!chatInput.trim()}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-4 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
                      >
                        전송
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500">
                  <div className="text-center">
                    <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                    <p>채팅방을 선택해주세요</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        )}

        {/* 환급 요청 관리 Section */}
        {activeTab === 'withdrawal-requests' && (
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
          <div className="px-8 py-6 border-b border-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">출금 요청 관리</h2>
              <div className="flex items-center gap-4">
                <div className="text-sm font-medium text-gray-600">
                  총 {withdrawalRequests.length}개의 요청
                </div>
                <button
                  onClick={exportWithdrawalRequestsToExcel}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-navy-600 to-navy-700 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 font-medium"
                >
                  <Download className="w-5 h-5" />
                  엑셀 다운로드
                </button>
              </div>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-4 mb-6">
              <select
                value={withdrawalFilter}
                onChange={(e) => setWithdrawalFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">전체</option>
                <option value="pending">대기</option>
                <option value="approved">승인</option>
                <option value="completed">완료</option>
                <option value="rejected">거부</option>
              </select>
              <input
                type="text"
                placeholder="이름, USER_ID, 계좌번호로 검색..."
                value={withdrawalSearch}
                onChange={(e) => setWithdrawalSearch(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
              />
              <button
                onClick={() => setShowCompletedWithdrawals(!showCompletedWithdrawals)}
                className={`px-4 py-2 rounded-lg border transition-colors ${
                  showCompletedWithdrawals
                    ? 'bg-green-100 border-green-300 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 border-gray-300 text-gray-700 hover:bg-gray-200'
                }`}
                title={showCompletedWithdrawals ? '완료된 내역 숨기기' : '완료된 내역 보기'}
              >
                {showCompletedWithdrawals ? '완료내역 숨김' : '완료내역 보기'}
              </button>
              {selectedUserId && (
                <button
                  onClick={() => {
                    setSelectedUserId(null)
                    setWithdrawalSearch('')
                  }}
                  className="px-4 py-2 bg-red-100 border border-red-300 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  title="사용자 필터 해제"
                >
                  필터 해제
                </button>
              )}
            </div>
            
            {selectedUserId && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-primary-700">
                  <strong>사용자 필터 활성화:</strong> {selectedUserId}의 출금 내역만 표시 중
                </p>
              </div>
            )}
            
            {(() => {
              const filteredRequests = getFilteredWithdrawalRequests()
              
              return filteredRequests.length === 0 ? (
                <div className="text-center py-8">
                  <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">출금 요청이 없습니다.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">번호</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">USER_ID</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">전화번호</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">계좌번호</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">포인트</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">입금금액</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">횟수</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">요청일</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {filteredRequests.map((request, index) => {
                        const taxRate = 0.033 // 3.3%
                        const taxAmount = Math.floor(request.points_amount * taxRate)
                        const finalAmount = request.points_amount - taxAmount
                        
                        return (
                          <tr key={request.id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {index + 1}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.user_data?.name || request.user_profile?.name || '정보 없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                              <button
                                onClick={() => {
                                  setSelectedUserId(request.user_id)
                                  setWithdrawalSearch('')
                                  setWithdrawalFilter('all')
                                  setShowCompletedWithdrawals(true)
                                }}
                                className="text-primary-600 hover:text-primary-800 hover:underline font-mono text-xs"
                                title="이 사용자의 모든 출금 내역 보기"
                              >
                                {request.user_id}
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.user_data?.phone || request.user_profile?.phone || '정보 없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.bank_account?.bank_name} {request.bank_account?.account_number}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.points_amount.toLocaleString()}P
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <div>
                                <div className="font-medium">{finalAmount.toLocaleString()}원</div>
                                <div className="text-xs text-gray-500">(세금 {taxAmount.toLocaleString()}원 공제)</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {request.withdrawal_count}회
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                request.status === 'approved' ? 'bg-blue-100 text-primary-800' :
                                request.status === 'completed' ? 'bg-green-100 text-green-800' :
                                request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {request.status === 'pending' ? '대기' : 
                                 request.status === 'approved' ? '승인' :
                                 request.status === 'completed' ? '완료' :
                                 request.status === 'rejected' ? '거부' : request.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(request.created_at).toLocaleDateString('ko-KR')}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => {
                                    setSelectedWithdrawalRequest(request)
                                    setShowWithdrawalDetailModal(true)
                                  }}
                                  className="text-navy-600 hover:text-navy-900"
                                  title="상세보기"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleViewUserPoints(request.user_id)}
                                  className="text-navy-600 hover:text-navy-900"
                                  title="사용자 포인트 내역"
                                >
                                  <Gift className="w-4 h-4" />
                                </button>
                                {request.status === 'pending' && (
                                  <>
                                    <button
                                      onClick={() => {
                                        if (window.confirm('이 출금 요청을 승인하시겠습니까?')) {
                                          handleApproveWithdrawal(request.id)
                                        }
                                      }}
                                      disabled={loading}
                                      className="text-green-600 hover:text-green-900 disabled:opacity-50 disabled:cursor-not-allowed"
                                      title="승인"
                                    >
                                      <CheckCircle className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleRejectWithdrawal(request.id)}
                                      className="text-red-600 hover:text-red-900"
                                      title="거절"
                                    >
                                      <XCircle className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                                {request.status === 'approved' && (
                                  <button
                                    onClick={() => handleCompleteWithdrawal(request.id)}
                                    className="text-primary-600 hover:text-primary-900"
                                    title="완료처리"
                                  >
                                    완료처리
                                  </button>
                                )}
                                {(request.status === 'completed' || request.status === 'rejected') && (
                                  <>
                                    <button
                                      onClick={() => handleEditWithdrawal(request.id)}
                                      className="text-yellow-600 hover:text-yellow-900"
                                      title="수정"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={() => handleDeleteWithdrawal(request.id)}
                                      className="text-red-600 hover:text-red-900"
                                      title="삭제"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })()}
          </div>
        </div>
        )}

        {/* 리뷰 검수 관리 Section */}
        {activeTab === 'reviews' && (
        <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
          <div className="px-8 py-6 border-b border-white/50">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-gray-900">리뷰 검수 관리</h2>
            </div>
          </div>

          <div className="p-8">
            <div className="flex gap-4 mb-6">
              <select
                value={reviewFilter}
                onChange={(e) => setReviewFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">전체</option>
                <option value="submitted">제출됨</option>
                <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
              </select>
              <input
                type="text"
                placeholder="리뷰 검색..."
                value={reviewSearch}
                onChange={(e) => setReviewSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
              />
            </div>
            
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리뷰어</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">캠페인</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">리뷰 상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">제출일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(() => {
                    // 리뷰 제출된 신청들만 필터링
                    const reviewApplications = applications.filter(app => 
                      app.status === 'review_in_progress' || 
                      app.status === 'review_completed' ||
                      app.review_submission_id
                    )
                    
                    if (reviewApplications.length === 0) {
                      return (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                            아직 제출된 리뷰가 없습니다.
                          </td>
                        </tr>
                      )
                    }
                    
                    return reviewApplications.map((application) => (
                      <tr key={application.id || application._id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {application.applicant_name || application.name || '이름 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {application.campaign_name || '캠페인명 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                            application.status === 'review_in_progress' ? 'bg-blue-100 text-primary-800' :
                            application.status === 'review_completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {application.status === 'review_in_progress' ? '검수중' :
                             application.status === 'review_completed' ? '검수완료' : '대기중'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {(() => {
                            console.log('🔍 리뷰 날짜 디버깅:', {
                              id: application.id,
                              review_submitted_at: application.review_submitted_at,
                              created_at: application.created_at,
                              updated_at: application.updated_at,
                              applied_at: application.applied_at,
                              reviewSubmissionInfo: application.reviewSubmissionInfo,
                              review_submission_id: application.review_submission_id,
                              allFields: Object.keys(application)
                            })
                            
                            // 리뷰 제출일을 우선적으로 표시
                            if (application.review_submitted_at) {
                              return new Date(application.review_submitted_at).toLocaleDateString()
                            } 
                            // reviewSubmissionInfo에서 submitted_at 확인
                            else if (application.reviewSubmissionInfo && application.reviewSubmissionInfo.submitted_at) {
                              return new Date(application.reviewSubmissionInfo.submitted_at).toLocaleDateString()
                            }
                            // 리뷰 제출일이 없으면 신청일 표시 (임시)
                            else if (application.applied_at) {
                              return new Date(application.applied_at).toLocaleDateString() + ' (신청일)'
                            } else if (application.created_at) {
                              return new Date(application.created_at).toLocaleDateString() + ' (신청일)'
                            } else if (application.updated_at) {
                              return new Date(application.updated_at).toLocaleDateString() + ' (수정일)'
                            } else {
                              return '날짜 없음'
                            }
                          })()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {/* 상세보기 버튼 (항상 표시) */}
                          <button
                            onClick={() => {
                              setSelectedApplication(application)
                              setShowApplicationDetailModal(true)
                            }}
                            className="text-navy-600 hover:text-navy-900 mr-3"
                            title="상세보기"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          
                          {/* 상태별 액션 버튼 */}
                          {(application.status === 'review_in_progress' || application.status === 'review_resubmitted') && (
                            <>
                              <button
                                onClick={() => handleApproveReview(application.id || application._id)}
                                className="text-green-600 hover:text-green-900 mr-3"
                                title="리뷰 승인"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRejectReview(application.id || application._id)}
                                className="text-red-600 hover:text-red-900"
                                title="리뷰 거절"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          
                          {application.status === 'review_completed' && (
                            <button
                              onClick={() => handleRequestPoints(application.id || application._id)}
                              className="text-orange-600 hover:text-orange-900"
                              title="포인트 지급 요청"
                            >
                              <Gift className="w-4 h-4" />
                            </button>
                          )}
                          
                          {application.status === 'point_requested' && (
                            <button
                              onClick={() => handleCompletePoints(application.id || application._id)}
                              className="text-emerald-600 hover:text-emerald-900"
                              title="포인트 지급 완료"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          )}
                          
                          {application.status === 'point_completed' && (
                            <span className="text-gray-400" title="완료됨">
                              <CheckCircle className="w-4 h-4" />
                            </span>
                          )}
                          
                          {application.status === 'rejected' && (
                            <span className="text-gray-400" title="거절됨">
                              <XCircle className="w-4 h-4" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))
                  })()}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        )}
      </div>

      {/* Modals */}
      {showApprovalModal && (
        <ApprovalModal
          isOpen={showApprovalModal}
          application={selectedApplication}
          onClose={() => setShowApprovalModal(false)}
          onApprovalComplete={async () => {
            if (selectedApplication) {
              await handleApproveApplication(selectedApplication.id || selectedApplication._id)
            }
            setShowApprovalModal(false)
          }}
        />
      )}

      {showRejectionModal && (
        <RejectionModal
          isOpen={showRejectionModal}
          application={selectedApplication}
          onClose={() => setShowRejectionModal(false)}
          onRejectionComplete={async (reason: string) => {
            if (selectedApplication) {
              await handleRejectApplication(selectedApplication.id || selectedApplication._id, reason)
            }
          }}
        />
      )}

      {showCampaignModal && (
      <CampaignCreationModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
          onSuccess={async () => {
            toast.success('체험단이 생성되었습니다')
            await loadExperiences()
            setShowCampaignModal(false)
          }}
        />
      )}

      {showEditModal && (
      <CampaignEditModal
          isOpen={showEditModal}
        campaign={selectedCampaign}
          onClose={() => {
            setShowEditModal(false)
            setSelectedCampaign(null)
          }}
          onSuccess={async () => {
            toast.success('체험단이 수정되었습니다')
            await loadExperiences()
            setShowEditModal(false)
            setSelectedCampaign(null)
          }}
        />
                    )}

      {/* 신청 상세 정보 모달 */}
      {showApplicationDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">신청 상세 정보</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {selectedApplication.name} - {selectedApplication.campaign_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowApplicationDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">신청자:</span>
                      <span className="ml-2 font-medium">{selectedApplication.name}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">이메일:</span>
                      <span className="ml-2 font-medium">{selectedApplication.email}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">연락처:</span>
                      <span className="ml-2 font-medium">{selectedApplication.phone || '없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">신청일:</span>
                      <span className="ml-2 font-medium">
                        {(() => {
                          const dateStr = selectedApplication.applied_at || selectedApplication.created_at
                          if (!dateStr) return '날짜 없음'
                          try {
                            const date = new Date(dateStr)
                            if (isNaN(date.getTime())) return '날짜 없음'
                            return date.toLocaleDateString('ko-KR')
                          } catch {
                            return '날짜 없음'
                          }
                        })()}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">상태:</span>
                      <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                        selectedApplication.status === 'product_purchased' ? 'bg-blue-100 text-primary-800' :
                        selectedApplication.status === 'shipping' ? 'bg-purple-100 text-navy-800' :
                        selectedApplication.status === 'delivered' ? 'bg-indigo-100 text-navy-800' :
                        selectedApplication.status === 'review_in_progress' ? 'bg-blue-100 text-primary-800' :
                        selectedApplication.status === 'review_completed' ? 'bg-green-100 text-green-800' :
                        selectedApplication.status === 'point_requested' ? 'bg-orange-100 text-orange-800' :
                        selectedApplication.status === 'point_completed' ? 'bg-emerald-100 text-emerald-800' :
                        selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedApplication.status === 'approved' ? '승인됨' :
                         selectedApplication.status === 'product_purchased' ? '제품구매완료' :
                         selectedApplication.status === 'shipping' ? '제품배송중' :
                         selectedApplication.status === 'delivered' ? '제품수령완료' :
                         selectedApplication.status === 'review_in_progress' ? '리뷰제출완료' :
                         selectedApplication.status === 'review_completed' ? '리뷰승인완료' :
                         selectedApplication.status === 'point_requested' ? '포인트지급요청' :
                         selectedApplication.status === 'point_completed' ? '포인트지급완료' :
                         selectedApplication.status === 'rejected' ? '거절됨' : '대기중'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">캠페인:</span>
                      <span className="ml-2 font-medium">{selectedApplication.campaign_name}</span>
                    </div>
                  </div>
                </div>

                {/* 신청자 정보 */}
                <div className="bg-gray-50 border rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                    <User className="w-5 h-5 mr-2" />
                    신청자 정보
                  </h4>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">이름:</span>
                      <span className="ml-2 font-medium">{selectedApplication.applicant_name || selectedApplication.name || '정보 없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">연락처:</span>
                      <span className="ml-2 font-medium">{selectedApplication.phone || selectedApplication.contact || '정보 없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">이메일:</span>
                      <span className="ml-2 font-medium">{selectedApplication.email || '정보 없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">네이버 ID:</span>
                      <span className="ml-2 font-medium">{selectedApplication.naver_id || selectedApplication.application_data?.naver_id || '정보 없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">주소:</span>
                      <span className="ml-2 font-medium">{selectedApplication.address || selectedApplication.application_data?.address || '정보 없음'}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">우편번호:</span>
                      <span className="ml-2 font-medium">{selectedApplication.postal_code || selectedApplication.application_data?.postal_code || '정보 없음'}</span>
                    </div>
                  </div>
                </div>

                {/* 신청 데이터 */}
                {selectedApplication.application_data && Object.keys(selectedApplication.application_data).length > 0 && (
                  <div className="bg-white border rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">신청 내용</h4>
                    <div className="space-y-3">
                      {Object.entries(selectedApplication.application_data).map(([key, value]: [string, any]) => (
                        <div key={key} className="border-b border-gray-100 pb-2">
                          <div className="text-sm font-medium text-gray-700 mb-1">
                            {translateFieldName(key)}
                          </div>
                          <div className="text-sm text-gray-600 whitespace-pre-wrap">
                            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 신청 데이터가 없는 경우 */}
                {(!selectedApplication.application_data || Object.keys(selectedApplication.application_data).length === 0) && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-800">신청 상세 정보가 없습니다.</span>
                    </div>
                    <p className="text-yellow-700 text-sm mt-1">
                      신청자가 추가 정보를 입력하지 않았거나 데이터가 저장되지 않았습니다.
                    </p>
                  </div>
                )}

                {/* 리뷰 정보 (리뷰 제출된 경우) */}
                {(selectedApplication.status === 'review_in_progress' || selectedApplication.status === 'review_completed') && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-medium text-primary-900 mb-3 flex items-center">
                      <FileText className="w-5 h-5 mr-2" />
                      제출된 리뷰 정보
                    </h4>
                    <div className="space-y-4">
                      {/* 리뷰 이미지 */}
                      {selectedApplication.review_images && selectedApplication.review_images.length > 0 && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-2">리뷰 이미지</div>
                          <div className="grid grid-cols-2 gap-2">
                            {selectedApplication.review_images.map((img: string, idx: number) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`리뷰 이미지 ${idx + 1}`}
                                className="w-full h-48 object-cover rounded-lg border cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={() => {
                                  setSelectedImage(img)
                                  setImageGallery(selectedApplication.review_images)
                                  setSelectedImageIndex(idx)
                                }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 블로그 URL */}
                      {selectedApplication.blog_url && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">블로그 URL</div>
                          <a
                            href={selectedApplication.blog_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:underline flex items-center"
                          >
                            {selectedApplication.blog_url}
                            <ExternalLink className="w-4 h-4 ml-1" />
                          </a>
                        </div>
                      )}

                      {/* 추가 메모 */}
                      {selectedApplication.additional_notes && (
                        <div>
                          <div className="text-sm font-medium text-gray-700 mb-1">추가 메모</div>
                          <div className="text-sm text-gray-600 bg-white p-3 rounded border">
                            {selectedApplication.additional_notes}
                          </div>
                        </div>
                      )}

                      {/* 리워드 금액 */}
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">리워드 금액</div>
                        <div className="text-lg font-bold text-green-600">
                          {selectedApplication.experience?.rewards ||
                           selectedApplication.experience?.reward_points ||
                           selectedApplication.campaignInfo?.rewards ||
                           '정보 없음'}P
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 액션 버튼 */}
                <div className="flex space-x-3 pt-4 border-t">
                  <button
                    onClick={() => {
                      setShowApplicationDetailModal(false)
                      setShowApprovalModal(true)
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>승인</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowApplicationDetailModal(false)
                      setShowRejectionModal(true)
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>거절</span>
                  </button>
                  <button
                    onClick={() => setShowApplicationDetailModal(false)}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 지급 요청 모달 */}
      {showPointRequestModal && selectedPointApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">포인트 지급 요청</h3>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>사용자:</strong> {selectedPointApplication.name || '이름 없음'}
              </p>
              <p className="text-sm text-gray-600 mb-2">
                <strong>캠페인:</strong> {selectedPointApplication.campaign_name || '캠페인명 없음'}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                <strong>포인트:</strong> {
                  selectedPointApplication.experience?.rewards || 
                  selectedPointApplication.experience?.reward_points || 
                  selectedPointApplication.campaignInfo?.rewards || 
                  0
                }P
              </p>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-primary-800">
                이 사용자에게 포인트 지급을 요청하시겠습니까?
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleConfirmPointRequest}
                className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
              >
                신청하기
              </button>
              <button
                onClick={() => {
                  setShowPointRequestModal(false)
                  setSelectedPointApplication(null)
                }}
                className="flex-1 px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 회원 상세보기 모달 */}
      {showUserDetailModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">회원 상세 정보</h3>
                <button
                  onClick={() => {
                    setShowUserDetailModal(false)
                    setSelectedUser(null)
                    setUserApplications([])
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">기본 정보</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이름</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.name || '이름 없음'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이메일</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">연락처</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || '연락처 없음'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">프로바이더</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.provider === 'google' ? 'Google' : 
                         selectedUser.provider === 'kakao' ? 'Kakao' : 
                         selectedUser.provider || '알 수 없음'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 계정 상태 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">계정 상태</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">이메일 인증</label>
                      <div className="mt-1">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          selectedUser.email_confirmed_at ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedUser.email_confirmed_at ? '인증됨' : '미인증'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">가입일</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">마지막 로그인</label>
                      <p className="mt-1 text-sm text-gray-900">
                        {selectedUser.last_login ? new Date(selectedUser.last_login).toLocaleDateString('ko-KR') : '로그인 없음'}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">사용자 ID</label>
                      <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.user_id || selectedUser.id}</p>
                    </div>
                  </div>
                </div>

                {/* 본인인증 및 계좌 정보 */}
                {selectedUser.identity_info && (
                  <div className="bg-gradient-to-r from-green-50 to-primary-50 rounded-lg p-4 border-2 border-green-200">
                    <div className="flex items-center space-x-2 mb-4">
                      <Shield className="w-5 h-5 text-green-600" />
                      <h4 className="text-lg font-semibold text-gray-900">본인인증 및 계좌 정보</h4>
                      {selectedUser.identity_info.identity_verified && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                          인증 완료
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">본인인증 이름</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.identity_info.identity_name || '미인증'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">생년월일</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.identity_info.identity_birth || '미인증'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">전화번호</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedUser.identity_info.identity_phone || '미인증'}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">인증일시</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedUser.identity_info.identity_verified_at ? new Date(selectedUser.identity_info.identity_verified_at).toLocaleDateString('ko-KR') : '미인증'}
                        </p>
                      </div>
                      <div className="md:col-span-2 pt-3 border-t border-green-200">
                        <label className="block text-sm font-medium text-gray-700 mb-2">계좌 정보</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div>
                            <label className="block text-xs text-gray-500">은행</label>
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.identity_info.bank_name || '미등록'}</p>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">계좌번호</label>
                            <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.identity_info.bank_account || '미등록'}</p>
                          </div>
                          <div>
                            <label className="block text-xs text-gray-500">예금주</label>
                            <p className="mt-1 text-sm text-gray-900 font-medium">{selectedUser.identity_info.account_holder || '미등록'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 아바타 이미지 */}
                {selectedUser.avatar_url && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">프로필 이미지</h4>
                    <div className="flex justify-center">
                      <img 
                        src={selectedUser.avatar_url} 
                        alt={selectedUser.name}
                        className="w-24 h-24 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* 신청한 캠페인 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">신청한 캠페인</h4>
                  {loadingUserApplications ? (
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
                    </div>
                  ) : userApplications.length > 0 ? (
                    <div className="space-y-4">
                      <div className="text-sm text-gray-500 mb-2">
                        총 {userApplications.length}개의 신청이 있습니다.
                      </div>
                      {userApplications.map((app, index) => (
                        <div
                          key={index}
                          onClick={() => {
                            if (app.campaign_id || app.experience_id) {
                              navigate(`/campaign/${app.campaign_id || app.experience_id}`)
                            }
                          }}
                          className="bg-white rounded-lg p-4 border border-gray-200 cursor-pointer hover:border-primary-500 hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <h5 className="font-semibold text-gray-900 hover:text-primary-600 transition-colors">{app.campaign_name}</h5>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                              app.status === 'approved' ? 'bg-green-100 text-green-800' :
                              app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                              app.status === 'point_requested' ? 'bg-blue-100 text-primary-800' :
                              app.status === 'point_completed' ? 'bg-purple-100 text-navy-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {app.status === 'approved' ? '승인됨' :
                               app.status === 'pending' ? '대기중' :
                               app.status === 'rejected' ? '거절됨' :
                               app.status === 'point_requested' ? '포인트 요청' :
                               app.status === 'point_completed' ? '포인트 완료' :
                               app.status || '알 수 없음'}
                            </span>
                          </div>
                          
                          {/* 기본 신청 정보 */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                            <div>
                              <span className="font-medium">캠페인 상태:</span> {app.campaign_status}
                            </div>
                            <div>
                              <span className="font-medium">캠페인 타입:</span> {app.campaign_type}
                            </div>
                            <div>
                              <span className="font-medium">신청일:</span> {app.created_at ? new Date(app.created_at).toLocaleDateString('ko-KR') : '날짜 없음'}
                            </div>
                            <div>
                              <span className="font-medium">신청 ID:</span> {app.id || app._id}
                            </div>
                          </div>
                          
                          {/* 신청서 상세 정보 (application_data) */}
                          {app.application_data && Object.keys(app.application_data).length > 0 && (
                            <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                              <h6 className="font-medium text-gray-900 mb-2 text-sm">신청서 상세 정보</h6>
                              <div className="space-y-2 text-xs">
                                {Object.entries(app.application_data).map(([key, value]: [string, any]) => (
                                  <div key={key} className="flex">
                                    <span className="font-medium text-gray-700 w-24 flex-shrink-0">
                                      {translateFieldName(key)}:
                                    </span>
                                    <span className="text-gray-600 flex-1">
                                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* 신청 사유 (기존) */}
                          {app.reason && (
                            <div className="mt-2 text-sm text-gray-600">
                              <span className="font-medium">신청 사유:</span> {app.reason}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      <p>신청한 캠페인이 없습니다.</p>
                      <p className="text-xs mt-2 text-gray-400">
                        사용자 ID: {selectedUser?.user_id || selectedUser?.id}
                      </p>
                      <p className="text-xs text-gray-400">
                        로드된 신청 수: {userApplications?.length || 0}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowUserDetailModal(false)
                    setSelectedUser(null)
                    setUserApplications([])
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  닫기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 회원 관리 모달 */}
      {showUserManagementModal && selectedUserForManagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">회원 관리</h3>
                <button
                  onClick={() => {
                    setShowUserManagementModal(false)
                    setSelectedUserForManagement(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 mb-2">
                  <strong>{selectedUserForManagement.name || '이름 없음'}</strong> 회원을 관리합니다.
                </p>
                <p className="text-sm text-gray-500">
                  이메일: {selectedUserForManagement.email}
                </p>
              </div>
              
              <div className="space-y-4">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <h4 className="font-semibold text-yellow-800 mb-2">⚠️ 주의사항</h4>
                  <p className="text-sm text-yellow-700">
                    회원 차단 시 해당 사용자는 로그인할 수 없게 됩니다. 신중하게 결정해주세요.
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      // 회원 차단 기능 구현
                      if (window.confirm(`${selectedUserForManagement.name} 회원을 차단하시겠습니까?`)) {
                        // TODO: 회원 차단 API 호출
                        console.log('회원 차단:', selectedUserForManagement)
                        toast.success('회원이 차단되었습니다.')
                        setShowUserManagementModal(false)
                        setSelectedUserForManagement(null)
                        loadAllData() // 데이터 새로고침
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                  >
                    회원 차단
                  </button>
                  <button
                    onClick={() => {
                      // 회원 활성화 기능 구현
                      if (window.confirm(`${selectedUserForManagement.name} 회원을 활성화하시겠습니까?`)) {
                        // TODO: 회원 활성화 API 호출
                        console.log('회원 활성화:', selectedUserForManagement)
                        toast.success('회원이 활성화되었습니다.')
                        setShowUserManagementModal(false)
                        setSelectedUserForManagement(null)
                        loadAllData() // 데이터 새로고침
                      }
                    }}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    회원 활성화
                  </button>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setShowUserManagementModal(false)
                    setSelectedUserForManagement(null)
                  }}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                >
                  취소
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* 중복 제거: 출금 요청 관리는 withdrawal-requests 탭으로 통합됨 */}
        {activeTab === 'withdrawals' && (
          <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
            <div className="px-8 py-6 border-b border-white/50">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Banknote className="w-6 h-6" />
                  출금 관리
                </h2>
                <div className="text-sm font-medium text-gray-600">
                  총 {withdrawalRequests.length}개의 요청
                </div>
              </div>
            </div>

            <div className="p-8">
              {/* 필터 및 검색 */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="사용자명, 계좌번호로 검색..."
                    value={withdrawalSearch}
                    onChange={(e) => setWithdrawalSearch(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-2">
                  <select
                    value={withdrawalFilter}
                    onChange={(e) => setWithdrawalFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="all">전체</option>
                    <option value="pending">대기중</option>
                    <option value="approved">승인됨</option>
                    <option value="rejected">거절됨</option>
                    <option value="completed">완료됨</option>
                    <option value="failed">실패</option>
                  </select>
                </div>
              </div>

              {/* 출금 요청 목록 */}
              <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      출금 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      계좌 정보
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      요청일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {withdrawalRequests
                    .filter(request => {
                      if (withdrawalFilter !== 'all' && request.status !== withdrawalFilter) return false
                      if (withdrawalSearch) {
                        const searchLower = withdrawalSearch.toLowerCase()
                        const userName = request.user_profile?.name || request.user_profile?.display_name || ''
                        const accountNumber = request.bank_account?.account_number || ''
                        return userName.toLowerCase().includes(searchLower) || 
                               accountNumber.includes(searchLower)
                      }
                      return true
                    })
                    .map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.user_profile?.name || request.user_profile?.display_name || '이름 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.user_profile?.email || '이메일 없음'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.points_amount.toLocaleString()}P
                          </div>
                          <div className="text-sm text-gray-500">
                            → {request.withdrawal_amount.toLocaleString()}원
                          </div>
                          {request.request_reason && (
                            <div className="text-xs text-gray-400 mt-1">
                              {request.request_reason}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {request.bank_account?.bank_name || '은행 정보 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.bank_account?.account_number || '계좌번호 없음'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {request.bank_account?.account_holder || '예금주 없음'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          request.status === 'approved' ? 'bg-blue-100 text-primary-800' :
                          request.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          request.status === 'completed' ? 'bg-green-100 text-green-800' :
                          request.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {request.status === 'pending' ? '대기중' :
                           request.status === 'approved' ? '승인됨' :
                           request.status === 'rejected' ? '거절됨' :
                           request.status === 'completed' ? '완료됨' :
                           request.status === 'failed' ? '실패' :
                           '알 수 없음'}
                        </span>
                        {request.admin_notes && (
                          <div className="text-xs text-gray-500 mt-1">
                            관리자 메모: {request.admin_notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(request.created_at).toLocaleDateString('ko-KR')}
                        <div className="text-xs text-gray-400">
                          {new Date(request.created_at).toLocaleTimeString('ko-KR')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setSelectedWithdrawalRequest(request)
                              setShowWithdrawalDetailModal(true)
                            }}
                            className="text-primary-600 hover:text-primary-900"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {request.status === 'pending' && (
                            <>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawalRequest(request)
                                  setShowWithdrawalApprovalModal(true)
                                }}
                                className="text-green-600 hover:text-green-900"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedWithdrawalRequest(request)
                                  setShowWithdrawalRejectionModal(true)
                                }}
                                className="text-red-600 hover:text-red-900"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          {request.status === 'approved' && (
                            <button
                              onClick={() => handleCompleteWithdrawal(request.id)}
                              className="text-primary-600 hover:text-primary-900"
                            >
                              완료 처리
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {withdrawalRequests.length === 0 && (
                <div className="text-center py-12">
                  <Banknote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">출금 요청이 없습니다</h3>
                  <p className="text-gray-500">사용자들이 출금을 요청하면 여기에 표시됩니다.</p>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        {/* 출금 요청 상세 모달 */}
        {showWithdrawalDetailModal && selectedWithdrawalRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">출금 요청 상세</h3>
                <button
                  onClick={() => {
                    setShowWithdrawalDetailModal(false)
                    setSelectedWithdrawalRequest(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* 사용자 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">사용자 정보</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><span className="font-medium">이름:</span> {selectedWithdrawalRequest.user_profile?.name || '이름 없음'}</div>
                    <div><span className="font-medium">이메일:</span> {selectedWithdrawalRequest.user_profile?.email || '이메일 없음'}</div>
                    <div><span className="font-medium">연락처:</span> {selectedWithdrawalRequest.user_profile?.phone || '연락처 없음'}</div>
                    <div><span className="font-medium">사용자 ID:</span> {selectedWithdrawalRequest.user_id}</div>
                  </div>
                </div>

                {/* 출금 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">출금 정보</h4>
                    {!isEditingWithdrawalInfo ? (
                      <button
                        onClick={() => {
                          setIsEditingWithdrawalInfo(true)
                          setEditWithdrawalInfo({
                            points_amount: selectedWithdrawalRequest.points_amount,
                            withdrawal_amount: selectedWithdrawalRequest.withdrawal_amount,
                            exchange_rate: selectedWithdrawalRequest.exchange_rate,
                            status: selectedWithdrawalRequest.status,
                            request_reason: selectedWithdrawalRequest.request_reason || ''
                          })
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveWithdrawalInfo}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          저장
                        </button>
                        <button
                          onClick={() => setIsEditingWithdrawalInfo(false)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          취소
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingWithdrawalInfo ? (
                    // 읽기 모드
                    <>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div><span className="font-medium">포인트:</span> {selectedWithdrawalRequest.points_amount.toLocaleString()}P</div>
                        <div><span className="font-medium">출금 금액:</span> {selectedWithdrawalRequest.withdrawal_amount.toLocaleString()}원</div>
                        <div><span className="font-medium">환율:</span> {selectedWithdrawalRequest.exchange_rate}</div>
                        <div><span className="font-medium">상태:</span>
                          <span className={`ml-2 px-2 py-1 rounded-full text-xs ${
                            selectedWithdrawalRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedWithdrawalRequest.status === 'approved' ? 'bg-blue-100 text-primary-800' :
                            selectedWithdrawalRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            selectedWithdrawalRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedWithdrawalRequest.status === 'pending' ? '대기중' :
                             selectedWithdrawalRequest.status === 'approved' ? '승인됨' :
                             selectedWithdrawalRequest.status === 'rejected' ? '거절됨' :
                             selectedWithdrawalRequest.status === 'completed' ? '완료됨' :
                             '알 수 없음'}
                          </span>
                        </div>
                      </div>
                      {selectedWithdrawalRequest.request_reason && (
                        <div className="mt-2">
                          <span className="font-medium">출금 사유:</span>
                          <p className="text-sm text-gray-600 mt-1">{selectedWithdrawalRequest.request_reason}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    // 편집 모드
                    <div className="space-y-3 text-sm">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-medium text-gray-700 block mb-1">포인트:</label>
                          <input
                            type="number"
                            value={editWithdrawalInfo.points_amount}
                            onChange={(e) => setEditWithdrawalInfo({...editWithdrawalInfo, points_amount: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 block mb-1">출금 금액 (원):</label>
                          <input
                            type="number"
                            value={editWithdrawalInfo.withdrawal_amount}
                            onChange={(e) => setEditWithdrawalInfo({...editWithdrawalInfo, withdrawal_amount: parseInt(e.target.value) || 0})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 block mb-1">환율:</label>
                          <input
                            type="number"
                            step="0.1"
                            value={editWithdrawalInfo.exchange_rate}
                            onChange={(e) => setEditWithdrawalInfo({...editWithdrawalInfo, exchange_rate: parseFloat(e.target.value) || 1})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div>
                          <label className="font-medium text-gray-700 block mb-1">상태:</label>
                          <select
                            value={editWithdrawalInfo.status}
                            onChange={(e) => setEditWithdrawalInfo({...editWithdrawalInfo, status: e.target.value})}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="pending">대기중</option>
                            <option value="approved">승인됨</option>
                            <option value="rejected">거절됨</option>
                            <option value="completed">완료됨</option>
                            <option value="failed">실패</option>
                          </select>
                        </div>
                      </div>
                      <div>
                        <label className="font-medium text-gray-700 block mb-1">출금 사유:</label>
                        <textarea
                          value={editWithdrawalInfo.request_reason}
                          onChange={(e) => setEditWithdrawalInfo({...editWithdrawalInfo, request_reason: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          rows={2}
                          placeholder="출금 사유를 입력하세요..."
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 계좌 정보 및 개인정보 (보안) */}
                <div className="bg-yellow-50 rounded-lg p-4 border-2 border-yellow-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <h4 className="font-bold text-gray-900">계좌 정보 및 개인정보 (보안)</h4>
                    </div>
                    {!isEditingBankInfo ? (
                      <button
                        onClick={() => {
                          setIsEditingBankInfo(true)
                          setEditBankInfo({
                            bank_name: selectedWithdrawalRequest.bank_account?.bank_name || '',
                            account_number: selectedWithdrawalRequest.bank_account?.account_number || '',
                            account_holder: selectedWithdrawalRequest.bank_account?.account_holder || '',
                            resident_number: selectedWithdrawalRequest.user_profile?.resident_number || ''
                          })
                        }}
                        className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-700 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        수정
                      </button>
                    ) : (
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveBankInfo}
                          className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors"
                        >
                          <CheckCircle className="w-4 h-4" />
                          저장
                        </button>
                        <button
                          onClick={() => setIsEditingBankInfo(false)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white text-sm rounded-lg hover:bg-gray-600 transition-colors"
                        >
                          <XCircle className="w-4 h-4" />
                          취소
                        </button>
                      </div>
                    )}
                  </div>

                  {!isEditingBankInfo ? (
                    // 읽기 모드
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium text-gray-700">은행:</span>
                        <p className="text-gray-900 mt-1">{selectedWithdrawalRequest.bank_account?.bank_name || '은행 정보 없음'}</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium text-gray-700">계좌번호:</span>
                        <p className="text-gray-900 mt-1 font-mono">{selectedWithdrawalRequest.bank_account?.account_number || '계좌번호 없음'}</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium text-gray-700">예금주:</span>
                        <p className="text-gray-900 mt-1">{selectedWithdrawalRequest.bank_account?.account_holder || '예금주 없음'}</p>
                      </div>
                      <div className="bg-white p-2 rounded">
                        <span className="font-medium text-gray-700">주민등록번호:</span>
                        <p className="text-gray-900 mt-1 font-mono">
                          {selectedWithdrawalRequest.user_profile?.resident_number ?
                            `${selectedWithdrawalRequest.user_profile.resident_number.slice(0, 6)}-${selectedWithdrawalRequest.user_profile.resident_number.slice(6)}` :
                            '정보 없음'}
                        </p>
                      </div>
                      <div className="bg-white p-2 rounded col-span-2">
                        <span className="font-medium text-gray-700">인증 상태:</span>
                        <span className={`ml-2 px-3 py-1 rounded-full text-xs font-medium ${
                          selectedWithdrawalRequest.bank_account?.is_verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {selectedWithdrawalRequest.bank_account?.is_verified ? '✓ 인증완료' : '⚠ 미인증'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    // 편집 모드
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="bg-white p-2 rounded">
                        <label className="font-medium text-gray-700 block mb-1">은행:</label>
                        <input
                          type="text"
                          value={editBankInfo.bank_name}
                          onChange={(e) => setEditBankInfo({...editBankInfo, bank_name: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="예: 국민은행"
                        />
                      </div>
                      <div className="bg-white p-2 rounded">
                        <label className="font-medium text-gray-700 block mb-1">계좌번호:</label>
                        <input
                          type="text"
                          value={editBankInfo.account_number}
                          onChange={(e) => setEditBankInfo({...editBankInfo, account_number: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="123456-78-901234"
                        />
                      </div>
                      <div className="bg-white p-2 rounded">
                        <label className="font-medium text-gray-700 block mb-1">예금주:</label>
                        <input
                          type="text"
                          value={editBankInfo.account_holder}
                          onChange={(e) => setEditBankInfo({...editBankInfo, account_holder: e.target.value})}
                          className="w-full px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="홍길동"
                        />
                      </div>
                      <div className="bg-white p-2 rounded">
                        <label className="font-medium text-gray-700 block mb-1">주민등록번호:</label>
                        <input
                          type="text"
                          value={editBankInfo.resident_number}
                          onChange={(e) => {
                            let value = e.target.value.replace(/[^0-9]/g, '')
                            if (value.length > 13) value = value.slice(0, 13)
                            if (value.length > 6) {
                              value = value.slice(0, 6) + '-' + value.slice(6)
                            }
                            setEditBankInfo({...editBankInfo, resident_number: value})
                          }}
                          className="w-full px-2 py-1 border border-gray-300 rounded font-mono focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          placeholder="123456-1234567"
                          maxLength={14}
                        />
                      </div>
                    </div>
                  )}

                  <p className="text-xs text-yellow-700 mt-3 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    개인정보는 출금 처리 목적으로만 사용되며 엄격히 보호됩니다.
                  </p>
                </div>

                {/* 처리 정보 */}
                {(selectedWithdrawalRequest.processed_at || selectedWithdrawalRequest.admin_notes) && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-2">처리 정보</h4>
                    <div className="space-y-2 text-sm">
                      {selectedWithdrawalRequest.processed_at && (
                        <div><span className="font-medium">처리일:</span> {new Date(selectedWithdrawalRequest.processed_at).toLocaleString('ko-KR')}</div>
                      )}
                      {selectedWithdrawalRequest.completed_at && (
                        <div><span className="font-medium">완료일:</span> {new Date(selectedWithdrawalRequest.completed_at).toLocaleString('ko-KR')}</div>
                      )}
                      {selectedWithdrawalRequest.admin_notes && (
                        <div>
                          <span className="font-medium">관리자 메모:</span>
                          <p className="text-gray-600 mt-1">{selectedWithdrawalRequest.admin_notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 출금 승인 모달 */}
        {showWithdrawalApprovalModal && selectedWithdrawalRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">출금 요청 승인 확인</h3>
                <button
                  onClick={() => {
                    setShowWithdrawalApprovalModal(false)
                    setSelectedWithdrawalRequest(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 승인 대상 요약 */}
              <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <User className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-green-800">
                      {selectedWithdrawalRequest.user_data?.name || selectedWithdrawalRequest.user_profile?.name || '사용자'}
                    </h4>
                    <p className="text-sm text-green-600">
                      ID: {selectedWithdrawalRequest.user_id}
                    </p>
                  </div>
                </div>
                <div className="text-center py-3 bg-white rounded-lg border border-green-200">
                  <p className="text-2xl font-bold text-green-700">
                    {selectedWithdrawalRequest.points_amount.toLocaleString()}P
                  </p>
                  <p className="text-sm text-green-600">출금 요청 포인트</p>
                </div>
              </div>

              {/* 상세 정보 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* 회원 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    회원 정보
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">전화번호:</span>
                      <span className="font-medium">{selectedWithdrawalRequest.user_data?.phone || selectedWithdrawalRequest.user_profile?.phone || '정보 없음'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">주소:</span>
                      <span className="font-medium text-right text-xs">
                        {selectedWithdrawalRequest.user_data?.address || selectedWithdrawalRequest.user_profile?.address || '정보 없음'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">요청 횟수:</span>
                      <span className="font-medium text-primary-600">
                        {selectedWithdrawalRequest.withdrawal_count || 1}번째
                      </span>
                    </div>
                  </div>
                </div>

                {/* 계좌 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h5 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Banknote className="w-4 h-4 mr-2" />
                    입금 계좌
                  </h5>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">은행:</span>
                      <span className="font-medium">{selectedWithdrawalRequest.bank_account?.bank_name || '정보 없음'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">계좌번호:</span>
                      <span className="font-medium">{selectedWithdrawalRequest.bank_account?.account_number || '정보 없음'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">예금주:</span>
                      <span className="font-medium">{selectedWithdrawalRequest.bank_account?.account_holder || '정보 없음'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">인증상태:</span>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        selectedWithdrawalRequest.bank_account?.is_verified 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {selectedWithdrawalRequest.bank_account?.is_verified ? '인증완료' : '미인증'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 금액 정보 */}
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <h5 className="font-semibold text-yellow-800 mb-3 flex items-center">
                  <Calculator className="w-4 h-4 mr-2" />
                  정확한 입금 금액 (세금 3.3% 공제)
                </h5>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-white p-3 rounded border">
                    <p className="text-lg font-bold text-gray-900">
                      {selectedWithdrawalRequest.points_amount.toLocaleString()}P
                    </p>
                    <p className="text-xs text-gray-600">요청 포인트</p>
                  </div>
                  <div className="bg-white p-3 rounded border">
                    <p className="text-lg font-bold text-red-600">
                      -{Math.floor(selectedWithdrawalRequest.points_amount * 0.033).toLocaleString()}원
                    </p>
                    <p className="text-xs text-gray-600">세금 (3.3%)</p>
                  </div>
                  <div className="bg-green-100 p-3 rounded border border-green-300">
                    <p className="text-xl font-bold text-green-700">
                      {(selectedWithdrawalRequest.points_amount - Math.floor(selectedWithdrawalRequest.points_amount * 0.033)).toLocaleString()}원
                    </p>
                    <p className="text-xs text-green-600">실제 입금액</p>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  관리자 메모 (선택사항)
                </label>
                <textarea
                  id="approvalNotes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="승인 관련 메모를 입력하세요"
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawalApprovalModal(false)
                    setSelectedWithdrawalRequest(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    const notes = (document.getElementById('approvalNotes') as HTMLTextAreaElement)?.value || ''
                    handleApproveWithdrawal(selectedWithdrawalRequest.id, notes)
                  }}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  승인
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 출금 거절 모달 */}
        {showWithdrawalRejectionModal && selectedWithdrawalRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">출금 요청 거절</h3>
                <button
                  onClick={() => {
                    setShowWithdrawalRejectionModal(false)
                    setSelectedWithdrawalRequest(null)
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-red-50 rounded-lg">
                <p className="text-sm text-red-800">
                  <strong>{selectedWithdrawalRequest.user_profile?.name || '사용자'}</strong>님의 
                  <strong> {selectedWithdrawalRequest.points_amount.toLocaleString()}P</strong> 
                  출금 요청을 거절하시겠습니까?
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  거절 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  id="rejectionNotes"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                  placeholder="거절 사유를 입력하세요"
                  required
                />
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowWithdrawalRejectionModal(false)
                    setSelectedWithdrawalRequest(null)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={() => {
                    const notes = (document.getElementById('rejectionNotes') as HTMLTextAreaElement)?.value
                    if (!notes?.trim()) {
                      alert('거절 사유를 입력해주세요.')
                      return
                    }
                    handleRejectWithdrawal(selectedWithdrawalRequest.id, notes)
                  }}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  거절
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 출금 요청 상세 모달 */}
        {showWithdrawalDetailModal && selectedWithdrawalRequest && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-900">출금 요청 상세 정보</h2>
                  <button
                    onClick={() => {
                      setShowWithdrawalDetailModal(false)
                      setSelectedWithdrawalRequest(null)
                    }}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 사용자 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">사용자 정보</h3>
                      {!isEditingUserInfo ? (
                        <button
                          onClick={() => {
                            setIsEditingUserInfo(true)
                            setEditUserInfo({
                              name: selectedWithdrawalRequest.user_data?.name || selectedWithdrawalRequest.user_profile?.name || '',
                              phone: selectedWithdrawalRequest.user_data?.phone || selectedWithdrawalRequest.user_profile?.phone || '',
                              address: selectedWithdrawalRequest.user_data?.address || selectedWithdrawalRequest.user_profile?.address || ''
                            })
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          수정
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveUserInfo}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            저장
                          </button>
                          <button
                            onClick={() => setIsEditingUserInfo(false)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                    {!isEditingUserInfo ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">이름:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.user_data?.name || selectedWithdrawalRequest.user_profile?.name || '정보 없음'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">USER_ID:</span>
                          <span className="ml-2 text-sm text-gray-900">{selectedWithdrawalRequest.user_id}</span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">전화번호:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.user_data?.phone || selectedWithdrawalRequest.user_profile?.phone || '정보 없음'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">주소:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.user_data?.address || selectedWithdrawalRequest.user_profile?.address || '정보 없음'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">이름:</label>
                          <input
                            type="text"
                            value={editUserInfo.name}
                            onChange={(e) => setEditUserInfo({...editUserInfo, name: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">USER_ID:</span>
                          <span className="ml-2 text-sm text-gray-900">{selectedWithdrawalRequest.user_id}</span>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">전화번호:</label>
                          <input
                            type="text"
                            value={editUserInfo.phone}
                            onChange={(e) => setEditUserInfo({...editUserInfo, phone: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">주소:</label>
                          <input
                            type="text"
                            value={editUserInfo.address}
                            onChange={(e) => setEditUserInfo({...editUserInfo, address: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 계좌 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">계좌 정보</h3>
                      {!isEditingAccountInfo ? (
                        <button
                          onClick={() => {
                            setIsEditingAccountInfo(true)
                            setEditWithdrawalAccountInfo({
                              bank_name: selectedWithdrawalRequest.bank_account?.bank_name || '',
                              account_number: selectedWithdrawalRequest.bank_account?.account_number || '',
                              account_holder: selectedWithdrawalRequest.bank_account?.account_holder || '',
                              is_verified: selectedWithdrawalRequest.bank_account?.is_verified || false
                            })
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          수정
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveAccountInfo}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            저장
                          </button>
                          <button
                            onClick={() => setIsEditingAccountInfo(false)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                    {!isEditingAccountInfo ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">은행:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.bank_account?.bank_name || '정보 없음'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">계좌번호:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.bank_account?.account_number || '정보 없음'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">예금주:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.bank_account?.account_holder || '정보 없음'}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">인증 상태:</span>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedWithdrawalRequest.bank_account?.is_verified
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {selectedWithdrawalRequest.bank_account?.is_verified ? '인증됨' : '미인증'}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">은행:</label>
                          <input
                            type="text"
                            value={editWithdrawalAccountInfo.bank_name}
                            onChange={(e) => setEditWithdrawalAccountInfo({...editWithdrawalAccountInfo, bank_name: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">계좌번호:</label>
                          <input
                            type="text"
                            value={editWithdrawalAccountInfo.account_number}
                            onChange={(e) => setEditWithdrawalAccountInfo({...editWithdrawalAccountInfo, account_number: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">예금주:</label>
                          <input
                            type="text"
                            value={editWithdrawalAccountInfo.account_holder}
                            onChange={(e) => setEditWithdrawalAccountInfo({...editWithdrawalAccountInfo, account_holder: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-500">인증 상태:</label>
                          <select
                            value={editWithdrawalAccountInfo.is_verified ? 'true' : 'false'}
                            onChange={(e) => setEditWithdrawalAccountInfo({...editWithdrawalAccountInfo, is_verified: e.target.value === 'true'})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          >
                            <option value="false">미인증</option>
                            <option value="true">인증됨</option>
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 환급 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">환급 정보</h3>
                      {!isEditingRefundInfo ? (
                        <button
                          onClick={() => {
                            setIsEditingRefundInfo(true)
                            setEditRefundInfo({
                              points_amount: selectedWithdrawalRequest.points_amount
                            })
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          수정
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveRefundInfo}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            저장
                          </button>
                          <button
                            onClick={() => setIsEditingRefundInfo(false)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                    {!isEditingRefundInfo ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">포인트:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.points_amount.toLocaleString()}P
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">세금 (3.3%):</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {Math.floor(selectedWithdrawalRequest.points_amount * 0.033).toLocaleString()}원
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">실지급액:</span>
                          <span className="ml-2 text-sm font-bold text-green-600">
                            {(selectedWithdrawalRequest.points_amount - Math.floor(selectedWithdrawalRequest.points_amount * 0.033)).toLocaleString()}원
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">환급 횟수:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.withdrawal_count}회
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">포인트:</label>
                          <input
                            type="number"
                            value={editRefundInfo.points_amount}
                            onChange={(e) => setEditRefundInfo({...editRefundInfo, points_amount: parseInt(e.target.value) || 0})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          />
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">세금 (3.3%):</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {Math.floor(editRefundInfo.points_amount * 0.033).toLocaleString()}원
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">실지급액:</span>
                          <span className="ml-2 text-sm font-bold text-green-600">
                            {(editRefundInfo.points_amount - Math.floor(editRefundInfo.points_amount * 0.033)).toLocaleString()}원
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">환급 횟수:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {selectedWithdrawalRequest.withdrawal_count}회
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 요청 정보 */}
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">요청 정보</h3>
                      {!isEditingRequestInfo ? (
                        <button
                          onClick={() => {
                            setIsEditingRequestInfo(true)
                            setEditRequestInfo({
                              status: selectedWithdrawalRequest.status,
                              request_reason: selectedWithdrawalRequest.request_reason || ''
                            })
                          }}
                          className="flex items-center gap-1 px-2 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                        >
                          <Edit className="w-3 h-3" />
                          수정
                        </button>
                      ) : (
                        <div className="flex gap-1">
                          <button
                            onClick={handleSaveRequestInfo}
                            className="flex items-center gap-1 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          >
                            <CheckCircle className="w-3 h-3" />
                            저장
                          </button>
                          <button
                            onClick={() => setIsEditingRequestInfo(false)}
                            className="flex items-center gap-1 px-2 py-1 bg-gray-500 text-white text-xs rounded hover:bg-gray-600 transition-colors"
                          >
                            <XCircle className="w-3 h-3" />
                            취소
                          </button>
                        </div>
                      )}
                    </div>
                    {!isEditingRequestInfo ? (
                      <div className="space-y-2">
                        <div>
                          <span className="text-sm font-medium text-gray-500">상태:</span>
                          <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            selectedWithdrawalRequest.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            selectedWithdrawalRequest.status === 'approved' ? 'bg-blue-100 text-primary-800' :
                            selectedWithdrawalRequest.status === 'completed' ? 'bg-green-100 text-green-800' :
                            selectedWithdrawalRequest.status === 'rejected' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {selectedWithdrawalRequest.status === 'pending' ? '대기' :
                             selectedWithdrawalRequest.status === 'approved' ? '승인' :
                             selectedWithdrawalRequest.status === 'completed' ? '완료' :
                             selectedWithdrawalRequest.status === 'rejected' ? '거부' : selectedWithdrawalRequest.status}
                          </span>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">요청일:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(selectedWithdrawalRequest.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        {selectedWithdrawalRequest.processed_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">처리일:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(selectedWithdrawalRequest.processed_at).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        )}
                        {selectedWithdrawalRequest.completed_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">완료일:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(selectedWithdrawalRequest.completed_at).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        )}
                        {selectedWithdrawalRequest.request_reason && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">요청 사유:</span>
                            <span className="ml-2 text-sm text-gray-900">{selectedWithdrawalRequest.request_reason}</span>
                          </div>
                        )}
                        {selectedWithdrawalRequest.admin_notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">관리자 메모:</span>
                            <span className="ml-2 text-sm text-gray-900">{selectedWithdrawalRequest.admin_notes}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div>
                          <label className="text-sm font-medium text-gray-500">상태:</label>
                          <select
                            value={editRequestInfo.status}
                            onChange={(e) => setEditRequestInfo({...editRequestInfo, status: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                          >
                            <option value="pending">대기</option>
                            <option value="approved">승인</option>
                            <option value="completed">완료</option>
                            <option value="rejected">거부</option>
                          </select>
                        </div>
                        <div>
                          <span className="text-sm font-medium text-gray-500">요청일:</span>
                          <span className="ml-2 text-sm text-gray-900">
                            {new Date(selectedWithdrawalRequest.created_at).toLocaleString('ko-KR')}
                          </span>
                        </div>
                        {selectedWithdrawalRequest.processed_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">처리일:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(selectedWithdrawalRequest.processed_at).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        )}
                        {selectedWithdrawalRequest.completed_at && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">완료일:</span>
                            <span className="ml-2 text-sm text-gray-900">
                              {new Date(selectedWithdrawalRequest.completed_at).toLocaleString('ko-KR')}
                            </span>
                          </div>
                        )}
                        <div>
                          <label className="text-sm font-medium text-gray-500">요청 사유:</label>
                          <textarea
                            value={editRequestInfo.request_reason}
                            onChange={(e) => setEditRequestInfo({...editRequestInfo, request_reason: e.target.value})}
                            className="ml-2 px-2 py-1 border border-gray-300 rounded text-sm w-full mt-1"
                            rows={2}
                            placeholder="요청 사유를 입력하세요..."
                          />
                        </div>
                        {selectedWithdrawalRequest.admin_notes && (
                          <div>
                            <span className="text-sm font-medium text-gray-500">관리자 메모:</span>
                            <span className="ml-2 text-sm text-gray-900">{selectedWithdrawalRequest.admin_notes}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* 관리 버튼 */}
                <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                  {selectedWithdrawalRequest.status === 'pending' && (
                    <>
                      <button
                        onClick={() => {
                          handleApproveWithdrawal(selectedWithdrawalRequest.id)
                          setShowWithdrawalDetailModal(false)
                          setSelectedWithdrawalRequest(null)
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                      >
                        승인
                      </button>
                      <button
                        onClick={() => {
                          handleRejectWithdrawal(selectedWithdrawalRequest.id)
                          setShowWithdrawalDetailModal(false)
                          setSelectedWithdrawalRequest(null)
                        }}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        거부
                      </button>
                    </>
                  )}
                  {selectedWithdrawalRequest.status === 'approved' && (
                    <button
                      onClick={() => {
                        handleCompleteWithdrawal(selectedWithdrawalRequest.id)
                        setShowWithdrawalDetailModal(false)
                        setSelectedWithdrawalRequest(null)
                      }}
                      className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      완료 처리
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setShowWithdrawalDetailModal(false)
                      setSelectedWithdrawalRequest(null)
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                  >
                    닫기
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 배송 정보 등록 모달 */}
        <ShippingModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          application={selectedApplication}
          onSuccess={() => {
            loadApplications()
            setShowShippingModal(false)
          }}
        />

      {/* 사용자 포인트 내역 모달 */}
      {showUserPointsModal && selectedUserPoints && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">사용자 포인트 내역</h3>
              <button
                onClick={() => {
                  setShowUserPointsModal(false)
                  setSelectedUserPoints(null)
                  setUserPointsHistory([])
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="space-y-6">
              {/* 사용자 프로필 정보 */}
              <div className="bg-gradient-to-r from-primary-50 to-navy-50 border border-blue-200 p-6 rounded-xl">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-primary-500 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                    {selectedUserPoints.name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-bold text-xl text-gray-900">{selectedUserPoints.name || '이름 없음'}</h4>
                    <p className="text-sm text-gray-600">{selectedUserPoints.email || '이메일 없음'}</p>
                    {selectedUserPoints.phone && (
                      <p className="text-sm text-gray-600">{selectedUserPoints.phone}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* 포인트 적립 정보 */}
              {selectedUserPoints.addPoints > 0 && (
                <div className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 p-6 rounded-xl">
                  <h4 className="font-bold text-lg text-emerald-900 mb-4 flex items-center">
                    <Gift className="w-5 h-5 mr-2" />
                    이번 포인트 적립 정보
                  </h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-gray-600 mb-1">현재 포인트</div>
                      <div className="text-2xl font-bold text-gray-700">
                        {selectedUserPoints.currentPoints?.toLocaleString() || 0}<span className="text-lg">P</span>
                      </div>
                    </div>
                    <div className="text-center bg-emerald-100 p-4 rounded-lg shadow-sm">
                      <div className="text-sm text-emerald-800 mb-1">적립 포인트</div>
                      <div className="text-2xl font-bold text-emerald-600">
                        +{selectedUserPoints.addPoints?.toLocaleString() || 0}<span className="text-lg">P</span>
                      </div>
                    </div>
                    <div className="text-center bg-blue-100 p-4 rounded-lg shadow-sm border-2 border-primary-400">
                      <div className="text-sm text-primary-800 mb-1 font-semibold">적립 후 포인트</div>
                      <div className="text-2xl font-bold text-primary-600">
                        {selectedUserPoints.afterPoints?.toLocaleString() || 0}<span className="text-lg">P</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 현재 포인트 현황 */}
              <div className="bg-gradient-to-r from-navy-50 to-pink-50 border border-purple-200 p-6 rounded-xl">
                <h4 className="font-bold text-lg text-gray-900 mb-4">전체 포인트 현황</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">사용 가능</div>
                    <div className="text-2xl font-bold text-primary-600">
                      {selectedUserPoints.available_points?.toLocaleString() || selectedUserPoints.currentPoints?.toLocaleString() || 0}<span className="text-lg">P</span>
                    </div>
                  </div>
                  <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">총 적립</div>
                    <div className="text-2xl font-bold text-green-600">
                      {selectedUserPoints.total_points?.toLocaleString() || 0}<span className="text-lg">P</span>
                    </div>
                  </div>
                  <div className="text-center bg-white p-4 rounded-lg shadow-sm">
                    <div className="text-sm text-gray-600 mb-1">출금 완료</div>
                    <div className="text-2xl font-bold text-orange-600">
                      {selectedUserPoints.withdrawn_points?.toLocaleString() || 0}<span className="text-lg">P</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 포인트 내역 */}
              <div>
                <h4 className="font-medium text-gray-900 mb-3">포인트 내역</h4>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">날짜</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">유형</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">포인트</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">설명</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {userPointsHistory.map((history) => (
                        <tr key={history.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {new Date(history.created_at).toLocaleDateString('ko-KR')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {history.points_type === 'earned' ? '적립' : 
                             history.points_type === 'withdrawal' ? '출금' : 
                             history.points_type === 'pending' ? '대기' : history.points_type}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className={history.points_amount > 0 ? 'text-green-600' : 'text-red-600'}>
                              {history.points_amount > 0 ? '+' : ''}{history.points_amount.toLocaleString()}P
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {history.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              history.status === 'completed' ? 'bg-green-100 text-green-800' :
                              history.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              history.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {history.status === 'completed' ? '완료' :
                               history.status === 'pending' ? '대기' :
                               history.status === 'cancelled' ? '취소' : history.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 수정 모달 */}
      {showEditPointModal && editingApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">포인트 금액 수정</h3>
              <button
                onClick={() => {
                  setShowEditPointModal(false)
                  setEditingApplication(null)
                  setEditPointAmount(0)
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 캠페인 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">캠페인</p>
                <p className="font-semibold text-gray-900">
                  {editingApplication.campaign_name || editingApplication.experience_name || '알 수 없음'}
                </p>
              </div>

              {/* 사용자 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">신청자</p>
                <p className="font-semibold text-gray-900">{editingApplication.name || '알 수 없음'}</p>
              </div>

              {/* 포인트 입력 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  지급 포인트
                </label>
                <input
                  type="number"
                  value={editPointAmount}
                  onChange={(e) => setEditPointAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="포인트를 입력하세요"
                  min="0"
                />
                <p className="mt-2 text-sm text-gray-500">
                  현재: {editingApplication.experience?.rewards || editingApplication.campaignInfo?.rewards || 0}P
                </p>
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditPointModal(false)
                    setEditingApplication(null)
                    setEditPointAmount(0)
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEditPoint}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 출금 수정 모달 */}
      {showEditWithdrawalModal && editingWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold">출금 요청 수정</h3>
              <button
                onClick={() => {
                  setShowEditWithdrawalModal(false)
                  setEditingWithdrawal(null)
                  setEditWithdrawalAmount(0)
                  setEditWithdrawalMethod('')
                  setEditAccountInfo('')
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              {/* 사용자 정보 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">신청자</p>
                <p className="font-semibold text-gray-900">{editingWithdrawal.user_name || '알 수 없음'}</p>
              </div>

              {/* 출금 금액 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출금 금액
                </label>
                <input
                  type="number"
                  value={editWithdrawalAmount}
                  onChange={(e) => setEditWithdrawalAmount(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="출금 금액을 입력하세요"
                  min="0"
                />
                <p className="mt-2 text-sm text-gray-500">
                  현재: {editingWithdrawal.amount?.toLocaleString()}원
                </p>
              </div>

              {/* 출금 방법 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출금 방법
                </label>
                <input
                  type="text"
                  value={editWithdrawalMethod}
                  onChange={(e) => setEditWithdrawalMethod(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="예: 계좌이체"
                />
              </div>

              {/* 계좌 정보 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  계좌 정보
                </label>
                <input
                  type="text"
                  value={editAccountInfo}
                  onChange={(e) => setEditAccountInfo(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  placeholder="예: 국민은행 123-456-789"
                />
              </div>

              {/* 버튼 */}
              <div className="flex space-x-3 pt-4">
                <button
                  onClick={() => {
                    setShowEditWithdrawalModal(false)
                    setEditingWithdrawal(null)
                    setEditWithdrawalAmount(0)
                    setEditWithdrawalMethod('')
                    setEditAccountInfo('')
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveEditWithdrawal}
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 상담 접수 관리 섹션 */}
      {activeTab === 'consultations' && (
        <ConsultationManager
          consultationRequests={consultationRequests}
          onRefresh={loadConsultationRequests}
        />
      )}

      {/* 🔥 설정 탭 */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              이메일 알림 설정
            </h3>
            
            <div className="space-y-6">
              {/* 발신자 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발신자 이름
                </label>
                <input
                  type="text"
                  value={emailFromName}
                  onChange={(e) => setEmailFromName(e.target.value)}
                  placeholder="올띵버킷"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  이메일 발신자로 표시될 이름입니다.
                </p>
              </div>

              {/* 발신자 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  발신자 이메일
                </label>
                <input
                  type="email"
                  value={emailFromAddress}
                  onChange={(e) => setEmailFromAddress(e.target.value)}
                  placeholder="support@allthingbucket.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                />
                <p className="mt-1 text-xs text-gray-500">
                  이메일 발신자 주소입니다. (Supabase SMTP 설정 필요)
                </p>
              </div>

              {/* 이메일 템플릿 정보 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-primary-900 mb-2">📧 이메일 템플릿</h4>
                <div className="text-xs text-primary-700 space-y-2">
                  <div>
                    <p className="font-semibold text-primary-900 mb-1">체험단 신청 관련:</p>
                    <p>• <strong>신청 승인</strong>: 체험단명과 다음 단계 안내</p>
                    <p>• <strong>신청 거절</strong>: 거절 사유와 다음 기회 안내</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary-900 mb-1">리뷰 검수 관련:</p>
                    <p>• <strong>리뷰 승인</strong>: 리뷰 승인 축하 및 리워드 안내 (진행 상태 포함)</p>
                    <p>• <strong>리뷰 반려</strong>: 검토 의견 및 수정 가이드 (재제출 안내)</p>
                  </div>
                  <div>
                    <p className="font-semibold text-primary-900 mb-1">포인트 관련:</p>
                    <p>• <strong>포인트 출금</strong>: 출금 금액과 승인일 포함</p>
                  </div>
                  <p className="mt-2 font-medium text-primary-900">✨ 모든 이메일은 최신 트렌드를 반영한 반응형 HTML 디자인으로 전송됩니다.</p>
                </div>
              </div>

              {/* Supabase SMTP 정보 */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-900 mb-2">🔧 Supabase SMTP</h4>
                <div className="text-xs text-green-700 space-y-1">
                  <p>• <strong>무료</strong>: Supabase Edge Functions 사용</p>
                  <p>• <strong>안정성</strong>: Supabase 인프라 활용</p>
                  <p>• <strong>설정</strong>: Edge Function 배포 필요</p>
                  <p className="mt-2 font-medium">Supabase 프로젝트에서 SMTP 설정이 필요합니다.</p>
                </div>
              </div>

              {/* 설정 저장 버튼 */}
              <div className="flex justify-end">
                <button
                  onClick={async () => {
                    try {
                      // 설정 저장 (로컬 상태만 업데이트)
                      toast.success('이메일 설정이 저장되었습니다!')
                    } catch (error) {
                      toast.error('이메일 설정 저장에 실패했습니다.')
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  설정 저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 리뷰 승인 확인 모달 */}
      {showReviewApprovalModal && selectedReviewApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">리뷰 승인 확인</h3>
              <p className="text-gray-600 mb-6">
                정말 이 리뷰를 승인하시겠습니까?<br />
                승인 후 리워드 지급 절차가 진행됩니다.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <p className="text-sm text-gray-700">
                  <strong>신청자:</strong> {selectedReviewApplication.name || '정보 없음'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>캠페인:</strong> {selectedReviewApplication.experience?.campaign_name || '정보 없음'}
                </p>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowReviewApprovalModal(false)
                    setSelectedReviewApplication(null)
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmApproveReview}
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  승인하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 리뷰 반려 모달 */}
      {showReviewRejectionModal && selectedReviewApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">리뷰 반려</h3>
              <p className="text-gray-600 mb-4">
                반려 사유를 입력해주세요.<br />
                회원은 반려 사유를 확인 후 리뷰를 수정하여 재제출할 수 있습니다.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <p className="text-sm text-gray-700">
                  <strong>신청자:</strong> {selectedReviewApplication.name || '정보 없음'}
                </p>
                <p className="text-sm text-gray-700 mt-1">
                  <strong>캠페인:</strong> {selectedReviewApplication.experience?.campaign_name || '정보 없음'}
                </p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={reviewRejectionReason}
                  onChange={(e) => setReviewRejectionReason(e.target.value)}
                  placeholder="반려 사유를 상세히 입력해주세요..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => {
                    setShowReviewRejectionModal(false)
                    setSelectedReviewApplication(null)
                    setReviewRejectionReason('')
                  }}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={handleConfirmRejectReview}
                  disabled={!reviewRejectionReason.trim()}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  반려하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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


export default AdminDashboard
