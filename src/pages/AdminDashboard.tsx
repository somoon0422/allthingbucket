import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import ApprovalModal from '../components/ApprovalModal'
import RejectionModal from '../components/RejectionModal'
import CampaignCreationModal from '../components/CampaignCreationModal'
import CampaignEditModal from '../components/CampaignEditModal'
import CampaignTypeUpdateModal from '../components/CampaignTypeUpdateModal'
// Lumi SDK 제거됨 - MongoDB API 사용
import {CheckCircle, XCircle, Clock, AlertCircle, Eye, Home, RefreshCw, Bell, FileText, UserCheck, Gift, Plus, BarChart3, CheckSquare, Download, Search, Filter, Trash2, X, Edit3} from 'lucide-react'
import toast from 'react-hot-toast'

// 🔥 ULTRA SAFE 배열 변환 - undefined.length 완전 차단
function ultraSafeArray<T>(value: any): T[] {
  try {
    if (value === null || value === undefined) {
      return []
    }
    
    if (Array.isArray(value)) {
      try {
        return value.filter(item => item != null)
      } catch {
        return []
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      const arrayKeys = ['list', 'data', 'items', 'results', 'applications', 'users', 'experiences']
      
      for (const key of arrayKeys) {
        try {
          const candidate = value[key]
          if (candidate && Array.isArray(candidate)) {
            return candidate.filter((item: any) => item != null)
          }
        } catch {
          continue
        }
      }
      
      try {
        const values = Object.values(value)
        for (const val of values) {
          if (Array.isArray(val)) {
            try {
              return val.filter((item: any) => item != null)
            } catch {
              continue
            }
          }
        }
      } catch {
        // Object.values 실패
      }
    }
    
    return []
  } catch {
    return []
  }
}

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

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated, isAdminUser } = useAuth()
  const navigate = useNavigate()
  
  const [applications, setApplications] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [experiences, setExperiences] = useState<any[]>([])
  const [notifications, setNotifications] = useState<any[]>([])
  const [reviews, setReviews] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  
  // 🔥 모달 상태들
  const [selectedApplication, setSelectedApplication] = useState<any>(null)
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [showBulkModal, setBulkModal] = useState(false)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [showNotificationModal, setShowNotificationModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showCampaignEditModal, setShowCampaignEditModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [showCampaignTypeUpdateModal, setShowCampaignTypeUpdateModal] = useState(false)
  const [isEditingMemo, setIsEditingMemo] = useState(false)
  const [memoText, setMemoText] = useState('')
  const [isEditingMetadata, setIsEditingMetadata] = useState(false)
  const [editingData, setEditingData] = useState<any>({})
  
  // 🔥 전체선택 및 일괄처리 상태
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())
  const [selectedExperiences, setSelectedExperiences] = useState<Set<string>>(new Set())
  const [selectedReviews, setSelectedReviews] = useState<string[]>([])
  const [selectedReview, setSelectedReview] = useState<any>(null)
  const [showReviewDetailModal, setShowReviewDetailModal] = useState(false)
  const [showReviewApprovalModal, setShowReviewApprovalModal] = useState(false)
  const [showReviewRejectionModal, setShowReviewRejectionModal] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  
  // 🔥 탭 및 필터 상태
  const [activeTab, setActiveTab] = useState('applications')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  
  // 🔥 포인트 신청 관련 상태
  const [pointRequests, setPointRequests] = useState<any[]>([])
  const [selectedPointRequest, setSelectedPointRequest] = useState<any>(null)
  const [showPointRequestDetail, setShowPointRequestDetail] = useState(false)
  const [showPointConfirmationModal, setShowPointConfirmationModal] = useState(false)
  const [pendingPointApproval, setPendingPointApproval] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState('all')
  const [experienceTypeFilter, setExperienceTypeFilter] = useState('all') // 새로 추가: 체험단 타입 필터
  
  // 🔥 실시간 동기화를 위한 상태
  const [lastSync, setLastSync] = useState<Date>(new Date())
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [isInitialLoad, setIsInitialLoad] = useState(true)

  // 🔥 실시간 데이터 동기화 함수
  const syncAllData = async (showLoader = true, showToast = false) => {
    try {
      if (showLoader) setRefreshing(true)
      
      await Promise.all([
        loadApplications(),
        loadUsers(),
        loadExperiences(),
        loadNotifications(),
        loadReviews(),
        loadPointRequests()
      ])
      
      setLastSync(new Date())
      
      // 🔥 토스트 메시지는 수동 새로고침이나 특별한 경우에만 표시
      if (showToast && !isInitialLoad) {
        toast.success('데이터가 동기화되었습니다', { duration: 2000 })
      }
      
      // 초기 로드 완료 표시
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }
    } catch (error) {
      console.error('데이터 동기화 실패:', error)
      if (showToast && !isInitialLoad) {
        toast.error('동기화에 실패했습니다')
      }
    } finally {
      if (showLoader) setRefreshing(false)
    }
  }

  // 🔥 자동 새로고침 설정
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !isAdminUser()) return

    const interval = setInterval(() => {
      syncAllData(false, false) // 🔥 자동 새로고침에서는 토스트 표시 안함
    }, 30000) // 30초마다 자동 동기화

    return () => clearInterval(interval)
  }, [autoRefresh, isAuthenticated, isAdminUser])

  // 🔥 데이터 로드 함수들 - 완전 안전화
  const loadApplications = async () => {
    try {
      const response = await lumi.entities.user_applications.list({
        sort: { applied_at: -1, created_at: -1 },
        ...({ _t: Date.now() } as any) // 🔥 캐시 무효화
      })
      
      const safeApplications = ultraSafeArray(response)
      
      // 디버깅: 신청 데이터 구조 확인
      console.log('📋 신청 데이터 샘플:', safeApplications.slice(0, 2))
      if (safeApplications.length > 0) {
        console.log('📋 첫 번째 신청의 모든 필드:', Object.keys(safeApplications[0] as any))
        console.log('📋 첫 번째 신청의 상세 데이터:', safeApplications[0])
      }
      
      // 체험단 정보 추가
      const enrichedApplications = await Promise.all(
        safeApplications.map(async (app: any) => {
          try {
            if (!app || typeof app !== 'object' || !app.experience_id) {
              return { ...app, experience: null }
            }

            const experience = await lumi.entities.experience_codes.get(app.experience_id)
            return { ...app, experience: experience || null }
          } catch {
            return { ...app, experience: null }
          }
        })
      )
      
      setApplications(enrichedApplications)
    } catch (error) {
      console.error('신청 목록 로드 실패:', error)
      setApplications([])
    }
  }

  const loadUsers = async () => {
    try {
      // users 엔티티와 user_profiles 엔티티 모두 가져오기
      const [usersResponse, profilesResponse] = await Promise.all([
        lumi.entities.users.list({
          sort: { created_at: -1 },
          ...({ _t: Date.now() } as any) // 🔥 캐시 무효화
        }),
        lumi.entities.user_profiles.list({
          sort: { created_at: -1 },
          ...({ _t: Date.now() } as any) // 🔥 캐시 무효화
        })
      ])
      
      const safeUsers = ultraSafeArray(usersResponse)
      const safeProfiles = ultraSafeArray(profilesResponse)
      
      // 사용자 정보와 프로필 정보를 병합 (user_id로 정확히 매칭)
      const mergedUsers = safeUsers.map((user: any) => {
        // user_id로 프로필 찾기 (여러 가능한 필드명 확인)
        const profile = safeProfiles.find((p: any) => 
          p.user_id === user.user_id || 
          p.user_id === user._id || 
          p.user_id === user.id ||
          p._id === user.user_id ||
          p._id === user._id
        )
        
        console.log(`🔍 사용자 ${user.name || user.email} 프로필 매칭:`, {
          userId: (user as any).user_id,
          user_id: (user as any)._id,
          profileFound: !!profile,
          profileUserId: (profile as any)?.user_id
        })
        
        return {
          ...user,
          profile: profile || null,
          // Google 로그인 여부 확인
          is_google_user: !!user.google_id,
          login_method: user.google_id ? 'Google' : '일반'
        }
      })
      
      // 디버깅: 사용자 데이터 구조 확인
      console.log('👥 전체 사용자 수:', mergedUsers.length)
      console.log('👥 Google 로그인 사용자 수:', mergedUsers.filter(u => u.is_google_user).length)
      console.log('👥 사용자 데이터 샘플:', mergedUsers.slice(0, 2))
      if (mergedUsers.length > 0) {
        console.log('👥 첫 번째 사용자의 모든 필드:', Object.keys(mergedUsers[0] as any))
        console.log('👥 첫 번째 사용자의 상세 데이터:', mergedUsers[0])
      }
      
      setUsers(mergedUsers)
    } catch (error) {
      console.error('사용자 목록 로드 실패:', error)
      setUsers([])
    }
  }

  const loadExperiences = async () => {
    try {
      const response = await lumi.entities.experience_codes.list({
        sort: { created_at: -1 }
      })
      
      const safeExperiences = ultraSafeArray(response)
      setExperiences(safeExperiences)
    } catch (error) {
      console.error('체험단 목록 로드 실패:', error)
      setExperiences([])
    }
  }

  const loadNotifications = async () => {
    try {
      const response = await lumi.entities.admin_notifications.list({
        sort: { created_at: -1 },
        limit: 20
      })
      
      const safeNotifications = ultraSafeArray(response)
      setNotifications(safeNotifications)
    } catch (error) {
      console.error('알림 목록 로드 실패:', error)
      setNotifications([])
    }
  }

  const loadReviews = async () => {
    try {
      const response = await lumi.entities.review_submissions.list({
        sort: { submitted_at: -1, created_at: -1 }
      })
      
      const safeReviews = ultraSafeArray(response)
      console.log('🔍 로드된 리뷰 데이터:', safeReviews)
      setReviews(safeReviews)
    } catch (error) {
      console.error('리뷰 목록 로드 실패:', error)
      setReviews([])
    }
  }

  const loadPointRequests = async () => {
    try {
      const response = await lumi.entities.user_applications.list({
        filter: { status: 'point_pending' },
        sort: { point_requested_at: -1, created_at: -1 }
      })
      
      const safePointRequests = ultraSafeArray(response)
      console.log('💰 로드된 포인트 신청 데이터:', safePointRequests)
      setPointRequests(safePointRequests)
    } catch (error) {
      console.error('포인트 신청 목록 로드 실패:', error)
      setPointRequests([])
    }
  }

  const loadAllData = async () => {
    try {
      setLoading(true)
      await syncAllData(false, false)
    } catch (error) {
      console.error('데이터 로드 실패:', error)
      toast.error('데이터를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && isAdminUser()) {
      loadAllData()
    }
  }, [isAuthenticated, isAdminUser])



  // 🔥 일괄 처리 함수들
  const handleBulkApprove = async () => {
    try {
      if (selectedApplications.size === 0) {
        toast.error('선택된 항목이 없습니다')
        return
      }

      setBulkActionLoading(true)
      const promises = Array.from(selectedApplications).map(id => 
        lumi.entities.user_applications.update(id, {
          status: 'approved',
          admin_message: '일괄 승인',
          processed_at: new Date().toISOString(),
          processed_by: user?.id || user?.user_id || ''
        })
      )

      await Promise.all(promises)
      toast.success(`${selectedApplications.size}개 신청이 승인되었습니다`)
      setSelectedApplications(new Set())
      setBulkModal(false)
      
      // 🔥 강력한 데이터 새로고침
      await syncAllData(false, false)
      
      // 🔥 추가 새로고침 (캐시 무효화)
      setTimeout(async () => {
        await syncAllData(false, false)
        console.log('🔄 승인 후 추가 새로고침 완료')
      }, 1000)
    } catch (error) {
      console.error('일괄 승인 실패:', error)
      toast.error('일괄 승인에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkReject = async (reason: string) => {
    try {
      if (selectedApplications.size === 0) {
        toast.error('선택된 항목이 없습니다')
        return
      }

      setBulkActionLoading(true)
      const promises = Array.from(selectedApplications).map(id => 
        lumi.entities.user_applications.update(id, {
          status: 'rejected',
          rejection_reason: reason,
          processed_at: new Date().toISOString(),
          processed_by: user?.id || user?.user_id || ''
        })
      )

      await Promise.all(promises)
      toast.success(`${selectedApplications.size}개 신청이 반려되었습니다`)
      setSelectedApplications(new Set())
      setBulkModal(false)
      
      // 🔥 강력한 데이터 새로고침
      await syncAllData(false, false)
      
      // 🔥 추가 새로고침 (캐시 무효화)
      setTimeout(async () => {
        await syncAllData(false, false)
        console.log('🔄 반려 후 추가 새로고침 완료')
      }, 1000)
    } catch (error) {
      console.error('일괄 반려 실패:', error)
      toast.error('일괄 반려에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 🔥 엑셀 내보내기 함수
  const exportToExcel = () => {
    try {
      const filteredData = getFilteredApplications()
      
      const csvContent = [
        ['신청자명', '이메일', '휴대폰', '주소', '체험단명', '상태', '신청일', '처리일', '관리자 메모'].join(','),
        ...filteredData.map((app: any) => [
          safeString(app, 'name', '정보없음'),
          safeString(app, 'email', '정보없음'),
          safeString(app, 'phone', '정보없음'),
          safeString(app, 'address', '정보없음'),
          app.experience ? safeString(app.experience, 'experience_name', '정보없음') : '정보없음',
          safeString(app, 'status', 'pending'),
          safeString(app, 'applied_at') || safeString(app, 'created_at', '정보없음'),
          safeString(app, 'processed_at', '미처리'),
          safeString(app, 'admin_message', '없음')
        ].join(','))
      ].join('\n')

      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
      const link = document.createElement('a')
      const url = URL.createObjectURL(blob)
      link.setAttribute('href', url)
      link.setAttribute('download', `관리자_신청목록_${new Date().toISOString().split('T')[0]}.csv`)
      link.style.visibility = 'hidden'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      toast.success('엑셀 파일이 다운로드되었습니다')
    } catch (error) {
      console.error('엑셀 내보내기 실패:', error)
      toast.error('엑셀 내보내기에 실패했습니다')
    }
  }

  // 🔥 필터링 함수
  const getFilteredApplications = () => {
    const safeApplicationsArray = ultraSafeArray(applications)
    
    return safeApplicationsArray.filter(app => {
      if (!app || typeof app !== 'object') return false

      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const name = safeString(app, 'name', '').toLowerCase()
        const email = safeString(app, 'email', '').toLowerCase()
        const experienceName = (app as any).experience ? 
          safeString((app as any).experience, 'experience_name', '').toLowerCase() : ''
        
        if (!name.includes(searchLower) && 
            !email.includes(searchLower) && 
            !experienceName.includes(searchLower)) {
          return false
        }
      }

      // 상태 필터
      if (statusFilter !== 'all') {
        const status = safeString(app, 'status', 'pending')
        if (status !== statusFilter) return false
      }

      // 날짜 필터
      if (dateFilter !== 'all') {
        const appliedAt = safeString(app, 'applied_at') || safeString(app, 'created_at')
        if (appliedAt) {
          const appDate = new Date(appliedAt)
          const now = new Date()
          const diffDays = (now.getTime() - appDate.getTime()) / (1000 * 3600 * 24)
          
          switch (dateFilter) {
            case 'today':
              if (diffDays > 1) return false
              break
            case 'week':
              if (diffDays > 7) return false
              break
            case 'month':
              if (diffDays > 30) return false
              break
          }
        }
      }

      return true
    })
  }

  // 🔥 체험단 필터링 함수
  const getFilteredExperiences = () => {
    const safeExperiencesArray = ultraSafeArray(experiences)
    
    return safeExperiencesArray.filter(exp => {
      if (!exp || typeof exp !== 'object') return false

      // 검색어 필터
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase()
        const name = safeString(exp, 'experience_name', '').toLowerCase()
        const brand = safeString(exp, 'brand_name', '').toLowerCase()
        
        if (!name.includes(searchLower) && !brand.includes(searchLower)) {
          return false
        }
      }

      // 타입 필터
      if (experienceTypeFilter !== 'all') {
        const type = safeString(exp, 'experience_type', 'purchase_review')
        if (type !== experienceTypeFilter) return false
      }

      return true
    })
  }

  // 🔥 메모 수정 함수
  const handleMemoSave = async () => {
    if (!selectedApplication) return

    try {
      const itemId = selectedApplication._id || selectedApplication.id
      if (!itemId) {
        toast.error('정보를 찾을 수 없습니다')
        return
      }

      // 체험단인지 신청인지에 따라 다른 엔티티 사용
      if (selectedApplication.experience_name) {
        // 체험단 메모 업데이트
        await lumi.entities.experience_codes.update(itemId, {
          admin_message: memoText
        })
      } else {
        // 신청 메모 업데이트
        await lumi.entities.user_applications.update(itemId, {
          admin_message: memoText
        })
      }

      toast.success('메모가 저장되었습니다')
      setIsEditingMemo(false)
      
      // 데이터 새로고침
      syncAllData(false, false)
    } catch (error) {
      console.error('메모 저장 실패:', error)
      toast.error('메모 저장에 실패했습니다')
    }
  }

  // 🔥 메타데이터 저장 함수
  const handleMetadataSave = async () => {
    if (!selectedApplication) return

    try {
      const itemId = selectedApplication._id || selectedApplication.id
      if (!itemId) {
        toast.error('정보를 찾을 수 없습니다')
        return
      }

      // 체험단인지 신청인지 사용자인지에 따라 다른 엔티티 사용
      if (selectedApplication.experience_name) {
        // 체험단 메타데이터 업데이트
        await lumi.entities.experience_codes.update(itemId, editingData)
      } else if (selectedApplication.email && !selectedApplication.experience_name && !selectedApplication.name) {
        // 사용자 메타데이터 업데이트
        await lumi.entities.user_profiles.update(itemId, editingData)
      } else {
        // 신청 메타데이터 업데이트
        await lumi.entities.user_applications.update(itemId, editingData)
      }

      toast.success('정보가 저장되었습니다')
      setIsEditingMetadata(false)
      
      // 데이터 새로고침
      syncAllData(false, false)
    } catch (error) {
      console.error('정보 저장 실패:', error)
      toast.error('정보 저장에 실패했습니다')
    }
  }

  // 🔥 체험단 삭제 함수
  const handleDeleteExperience = async (experienceId: string) => {
    if (!confirm('정말로 이 체험단을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      await lumi.entities.experience_codes.delete(experienceId)
      toast.success('체험단이 삭제되었습니다')
      
      // 데이터 새로고침
      syncAllData(false, false)
    } catch (error) {
      console.error('체험단 삭제 실패:', error)
      toast.error('체험단 삭제에 실패했습니다')
    }
  }

  // 🔥 사용자 삭제 함수
  const handleDeleteUser = async (userId: string) => {
    if (!confirm('정말로 이 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return
    }

    try {
      await lumi.entities.user_profiles.delete(userId)
      toast.success('사용자가 삭제되었습니다')
      
      // 데이터 새로고침
      syncAllData(false, false)
    } catch (error) {
      console.error('사용자 삭제 실패:', error)
      toast.error('사용자 삭제에 실패했습니다')
    }
  }

  // 🔥 일괄삭제 함수들
  const handleBulkDeleteApplications = async () => {
    if (selectedApplications.size === 0) {
      toast.error('삭제할 신청을 선택해주세요')
      return
    }

    if (!confirm(`선택한 ${selectedApplications.size}개의 신청을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      setBulkActionLoading(true)
      const deletePromises = Array.from(selectedApplications).map(id => 
        lumi.entities.user_applications.delete(id)
      )
      
      await Promise.all(deletePromises)
      toast.success(`${selectedApplications.size}개의 신청이 삭제되었습니다`)
      setSelectedApplications(new Set())
      syncAllData(false, false)
    } catch (error) {
      console.error('일괄삭제 실패:', error)
      toast.error('일괄삭제에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDeleteUsers = async () => {
    if (selectedUsers.size === 0) {
      toast.error('삭제할 사용자를 선택해주세요')
      return
    }

    if (!confirm(`선택한 ${selectedUsers.size}명의 사용자를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      setBulkActionLoading(true)
      console.log('🗑️ 사용자 일괄삭제 시작:', Array.from(selectedUsers))
      
      // API 연결 상태 확인
      const isConnected = await checkLumiConnection()
      if (!isConnected) {
        toast.error('데이터베이스 연결에 실패했습니다. 잠시 후 다시 시도해주세요.')
        return
      }
      
      const deletePromises = Array.from(selectedUsers).map(async (id) => {
        try {
          console.log('🗑️ 삭제 중인 사용자 ID:', id)
          
          // 먼저 사용자 프로필이 존재하는지 확인
          const profile = await lumi.entities.user_profiles.get(id)
          if (!profile) {
            console.warn('⚠️ 사용자 프로필을 찾을 수 없습니다:', id)
            return { success: false, id, error: '프로필 없음' }
          }
          
          const result = await lumi.entities.user_profiles.delete(id)
          console.log('✅ 삭제 성공:', id, result)
          return { success: true, id, result }
        } catch (deleteError) {
          console.error('❌ 개별 사용자 삭제 실패:', id, deleteError)
          return { success: false, id, error: deleteError }
        }
      })
      
      const results = await Promise.all(deletePromises)
      
      // 결과 분석
      const successCount = results.filter(r => r.success).length
      const failCount = results.filter(r => !r.success).length
      
      console.log('📊 삭제 결과:', { successCount, failCount, results })
      
      if (successCount > 0) {
        toast.success(`${successCount}명의 사용자가 삭제되었습니다`)
      }
      
      if (failCount > 0) {
        toast.error(`${failCount}명의 사용자 삭제에 실패했습니다`)
      }
      
      setSelectedUsers(new Set())
      syncAllData(false, false)
    } catch (error) {
      console.error('일괄삭제 실패:', error)
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류'
      const errorStatus = (error as any)?.status
      const errorResponse = (error as any)?.response
      
      console.error('에러 상세:', {
        message: errorMessage,
        status: errorStatus,
        response: errorResponse
      })
      toast.error(`일괄삭제에 실패했습니다: ${errorMessage}`)
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleBulkDeleteExperiences = async () => {
    if (selectedExperiences.size === 0) {
      toast.error('삭제할 캠페인을 선택해주세요')
      return
    }

    if (!confirm(`선택한 ${selectedExperiences.size}개의 캠페인을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
      return
    }

    try {
      setBulkActionLoading(true)
      const deletePromises = Array.from(selectedExperiences).map(id => 
        lumi.entities.experience_codes.delete(id)
      )
      
      await Promise.all(deletePromises)
      toast.success(`${selectedExperiences.size}개의 캠페인이 삭제되었습니다`)
      setSelectedExperiences(new Set())
      syncAllData(false, false)
    } catch (error) {
      console.error('일괄삭제 실패:', error)
      toast.error('일괄삭제에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 세부적인 캠페인 타입 업데이트
  const handleDetailedCampaignTypeUpdate = async (updateConfig: {
    targetTypes: string[],
    newType: string,
    updateAll: boolean
  }) => {
    try {
      setBulkActionLoading(true)
      console.log('🔄 세부 캠페인 타입 업데이트 시작...', updateConfig)
      
      let updatedCount = 0
      const updateResults: any[] = []
      
      for (const experience of experiences) {
        const currentType = safeString(experience, 'experience_type', '')
        const experienceName = safeString(experience, 'experience_name', '제목 없음')
        
        // 업데이트 조건 확인
        const shouldUpdate = updateConfig.updateAll || 
          updateConfig.targetTypes.includes(currentType) ||
          (!currentType && updateConfig.targetTypes.includes('undefined'))
        
        if (shouldUpdate) {
          const updateData = {
            experience_type: updateConfig.newType,
            campaign_type: updateConfig.newType,
            type: updateConfig.newType
          }
          
          console.log(`📝 캠페인 업데이트: ${experienceName}`)
          console.log(`   기존 타입: ${currentType || 'undefined'}`)
          console.log(`   새 타입: ${updateConfig.newType}`)
          
          await lumi.entities.experience_codes.update(experience._id, updateData)
          updatedCount++
          
          updateResults.push({
            name: experienceName,
            oldType: currentType || 'undefined',
            newType: updateConfig.newType
          })
        }
      }
      
      console.log(`✅ ${updatedCount}개의 캠페인 타입이 업데이트되었습니다.`)
      
      // 상세 결과 표시
      const typeLabels: { [key: string]: string } = {
        'purchase_review': '구매평',
        'product': '제품 체험',
        'press': '기자단',
        'local': '지역 체험'
      }
      
      const newTypeLabel = typeLabels[updateConfig.newType] || updateConfig.newType
      toast.success(`${updatedCount}개의 캠페인이 "${newTypeLabel}" 타입으로 업데이트되었습니다.`)
      
      // 데이터 새로고침
      syncAllData(false, false)
      
      return { updatedCount, updateResults }
      
    } catch (error) {
      console.error('❌ 캠페인 타입 업데이트 실패:', error)
      toast.error('캠페인 타입 업데이트에 실패했습니다')
      return { updatedCount: 0, updateResults: [] }
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 기존 캠페인들에 새로운 필드들 추가
  const handleUpdateCampaignFields = async () => {
    if (!confirm('기존 캠페인들에 새로운 필드들(제공내역, 캠페인 미션, 키워드, 링크, 추가 안내사항, 캠페인 일정)을 추가하시겠습니까?')) {
      return
    }

    try {
      setBulkActionLoading(true)
      console.log('🔄 기존 캠페인 필드 업데이트 시작...')
      
      let updatedCount = 0
      
      for (const experience of experiences) {
        const updateData: any = {}
        
        // 새로운 필드들이 없으면 기본값 추가
        if (!experience.provided_items) {
          updateData.provided_items = `
            <h3>구매 제품 : 피카랩스 포캣츠 3종 중 택1</h3>
            <p>ㄴ> 페이백 : 레뷰포인트 19,000</p>
            <p><strong>* 본 캠페인은 블로그+구매평 캠페인입니다.</strong> 선정 이후 구매 링크를 통해<br/>
            개인 경비로 직접 상품을 구매해야 하며 페이백 형태로 진행됩니다.</p>
            
            <h4>[구매 방법]</h4>
            <ul>
              <li>선정 후 1-2일 내 [구매 링크]를 통해, 개인 경비로 직접 선 구매해 주셔야 합니다. (정가 구매 필수)</li>
              <li>*위 링크인 네이버 스마트 스토어에서 구매바랍니다.</li>
              <li>결제 시 쿠폰 / 할인은 적용 불가 하며, 별도 쇼핑 지원금은 지급되지 않습니다.</li>
            </ul>
            
            <h4>[페이백]</h4>
            <ul>
              <li>추후 페이백 금액은 제품 비용 (19,000원) + 배송비 (무료) = 19,000원 입니다.</li>
              <li>기간 내 블로그 콘텐츠와 구매후기를 모두 작성해 주신 분들에게만 포인트가 제공됩니다.</li>
            </ul>
          `
        }
        if (!experience.campaign_mission) {
          updateData.campaign_mission = `
            <h3>블로그 미션</h3>
            <ul>
              <li>1000자 이상</li>
              <li>15장 이상</li>
              <li>동영상 첨부</li>
              <li>스토어 알림 받기</li>
            </ul>
            
            <h4>[블로그+구매평 캠페인이란?]</h4>
            <p>상품을 직접 구매하신 후, 블로그 콘텐츠와 구매후기를 함께 작성해야 하는 캠페인입니다.</p>
            
            <h4>구매평 미션</h4>
            <ul>
              <li>고양이가 제품을 섭취하는 사진 또는 영상을 필수로 포함해주세요.</li>
              <li>기호성이 좋다는 것을 강조해주시고 100% 휴먼그레이드라 성분이 믿음이 간다는 내용을 포함해주세요</li>
            </ul>
          `
        }
        if (!experience.keywords) {
          updateData.keywords = '피카노리, 피카랩스 포캣츠, 고양이 츄르 영양제, 고양이영양제, 고양이츄르, 고양이영양제츄르, 고양이츄르추천'
        }
        if (!experience.product_links) {
          updateData.product_links = 'https://www.pecanori.co.kr/goods/goods_view.php?goodsNo=1000001571&utm_source=naver&utm_medium=social&utm_campaign=pecalabs_revu_2509&utm_term='
        }
        if (!experience.additional_guidelines) {
          updateData.additional_guidelines = `
            <h4>캠페인 신청 시 유의사항</h4>
            <ul>
              <li>신청 시 스마트 스토어에서 제품을 구매하실 네이버 아이디를 남겨주세요.</li>
              <li>구매할 네이버 아이디가 아닌 다른 아이디 (예. 레뷰아이디 등) 작성 시, 포인트 지급에 제한이 있을 수 있습니다.</li>
            </ul>
            
            <h4>구매후기 작성 시 주의사항</h4>
            <ul>
              <li>사진 또는 영상은 필수이며 아래 문구를 표기해 주세요.</li>
              <li>상단에 [협찬] 문구를 표기해주세요.</li>
            </ul>
            
            <h4>기타 안내사항</h4>
            <ul>
              <li>별도 쇼핑 지원금은 지급되지 않습니다.</li>
              <li>레뷰포인트 출금 시 세금 3.3% 발생합니다.</li>
              <li>구매평의 유지 기간은 콘텐츠와 동일하게 6개월입니다.</li>
              <li>단순 사유로 인한 구매평 삭제 시 페널티 부과되며 지급 포인트 회수 또는 제품가 및 배송비 환불 요청이 이루어 질 수 있습니다.</li>
            </ul>
          `
        }
        
        // 캠페인 일정 정보 기본값 설정
        if (!experience.application_start_date) { 
          updateData.application_start_date = new Date().toISOString().split('T')[0] 
        }
        if (!experience.application_end_date) { 
          const endDate = new Date()
          endDate.setDate(endDate.getDate() + 7) // 7일 후
          updateData.application_end_date = endDate.toISOString().split('T')[0] 
        }
        if (!experience.influencer_announcement_date) { 
          const announceDate = new Date()
          announceDate.setDate(announceDate.getDate() + 10) // 10일 후
          updateData.influencer_announcement_date = announceDate.toISOString().split('T')[0] 
        }
        if (!experience.content_start_date) { 
          const contentStartDate = new Date()
          contentStartDate.setDate(contentStartDate.getDate() + 12) // 12일 후
          updateData.content_start_date = contentStartDate.toISOString().split('T')[0] 
        }
        if (!experience.content_end_date) { 
          const contentEndDate = new Date()
          contentEndDate.setDate(contentEndDate.getDate() + 22) // 22일 후
          updateData.content_end_date = contentEndDate.toISOString().split('T')[0] 
        }
        if (!experience.result_announcement_date) { 
          const resultDate = new Date()
          resultDate.setDate(resultDate.getDate() + 24) // 24일 후
          updateData.result_announcement_date = resultDate.toISOString().split('T')[0] 
        }
        if (experience.current_applicants === undefined) { 
          updateData.current_applicants = 0 
        }
        
        // 추가 정보 필드들 기본값 설정
        if (!experience.application_deadline) { 
          const deadline = new Date()
          deadline.setDate(deadline.getDate() + 5) // 5일 후
          updateData.application_deadline = deadline.toISOString().split('T')[0] 
        }
        if (!experience.review_deadline) { 
          const reviewDeadline = new Date()
          reviewDeadline.setDate(reviewDeadline.getDate() + 20) // 20일 후
          updateData.review_deadline = reviewDeadline.toISOString().split('T')[0] 
        }
        if (!experience.experience_location) { 
          updateData.experience_location = '전국' 
        }
        if (!experience.experience_period) { 
          updateData.experience_period = '2주' 
        }
        
        if (Object.keys(updateData).length > 0) {
          console.log(`📝 캠페인 필드 업데이트: ${safeString(experience, 'experience_name', '제목 없음')}`)
          console.log(`   추가된 필드들:`, Object.keys(updateData))
          
          await lumi.entities.experience_codes.update(experience._id, updateData)
          updatedCount++
        }
      }
      
      console.log(`✅ ${updatedCount}개의 캠페인 필드가 업데이트되었습니다.`)
      toast.success(`${updatedCount}개의 캠페인에 새로운 필드들이 추가되었습니다.`)
      
      // 데이터 새로고침
      syncAllData(false, false)
      
    } catch (error) {
      console.error('❌ 캠페인 필드 업데이트 실패:', error)
      toast.error('캠페인 필드 업데이트에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 🔥 전체선택 토글 함수들
  const toggleSelectAllApplications = () => {
    if (selectedApplications.size === filteredApplications.length) {
      setSelectedApplications(new Set())
    } else {
      const allIds = filteredApplications.map(app => (app as any)._id || (app as any).id).filter(Boolean)
      setSelectedApplications(new Set(allIds))
    }
  }

  const toggleSelectAllUsers = () => {
    const safeUsersArray = ultraSafeArray(users)
    if (selectedUsers.size === safeUsersArray.length) {
      setSelectedUsers(new Set())
    } else {
      const allIds = safeUsersArray.map((user: any) => (user as any)._id || (user as any).id).filter(Boolean)
      setSelectedUsers(new Set(allIds))
    }
  }

  const toggleSelectAllExperiences = () => {
    if (selectedExperiences.size === filteredExperiences.length) {
      setSelectedExperiences(new Set())
    } else {
      const allIds = filteredExperiences.map(exp => (exp as any)._id || (exp as any).id).filter(Boolean)
      setSelectedExperiences(new Set(allIds))
    }
  }

  // 🔥 개별 선택 토글 함수들
  const toggleSelectApplication = (id: string) => {
    const newSelected = new Set(selectedApplications)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedApplications(newSelected)
  }

  const toggleSelectUser = (id: string) => {
    const newSelected = new Set(selectedUsers)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedUsers(newSelected)
  }

  const toggleSelectExperience = (id: string) => {
    const newSelected = new Set(selectedExperiences)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedExperiences(newSelected)
  }

  // 🔥 사용자별 신청한 캠페인 조회 함수
  const getUserApplications = (userId: string) => {
    console.log('🔍 getUserApplications 호출:', { userId, totalApplications: applications.length })
    
    // 사용자 정보에서 이메일 찾기
    const user = users.find(u => (u as any)._id === userId || (u as any).id === userId)
    const userEmail = user ? (user as any).email : null
    
    console.log('👤 사용자 이메일:', userEmail)
    
    const userApps = applications.filter(app => {
      const appUserId = (app as any).user_id
      const appUserCode = (app as any).user_code
      const appEmail = (app as any).email
      const appName = (app as any).name
      const appUser_name = (app as any).user_name
      
      // 더 포괄적인 매칭 로직
      const matches = 
        appUserId === userId || 
        appUserCode === userId || 
        appEmail === userId ||
        appName === userId ||
        appUser_name === userId ||
        String(appUserId) === String(userId) ||
        String(appUserCode) === String(userId) ||
        (userEmail && appEmail === userEmail) // 이메일 기반 매칭 추가
      
      if (matches) {
        console.log('✅ 매칭된 신청 발견:', { 
          appUserId, 
          appUserCode, 
          appEmail, 
          appName,
          appUser_name,
          targetUserId: userId,
          userEmail,
          matchType: appUserId === userId ? 'user_id' :
                     appUserCode === userId ? 'user_code' :
                     appEmail === userId ? 'email' :
                     appName === userId ? 'name' :
                     appUser_name === userId ? 'user_name' :
                     (userEmail && appEmail === userEmail) ? 'email_match' : 'string_conversion'
        })
      }
      
      return matches
    })
    
    console.log('✅ 매칭된 신청:', userApps.length, '개')
    return userApps
  }

  // 🔥 캠페인별 신청자 조회 함수
  const getCampaignApplicants = (experienceId: string) => {
    return applications.filter(app => 
      (app as any).experience_id === experienceId
    )
  }

  // 🔥 캠페인별 신청자 수 조회 함수
  const getCampaignApplicantCount = (experienceId: string) => {
    return getCampaignApplicants(experienceId).length
  }

  // 🔥 리뷰 관련 정보 조회 함수
  const getReviewUserInfo = (review: any) => {
    // 사용자명 우선순위: user_name > name > userName > user_id
    const userName = safeString(review, 'user_name') || 
                    safeString(review, 'name') || 
                    safeString(review, 'userName') || 
                    safeString(review, 'user_id') || 
                    '사용자명 없음'
    
    return userName
  }

  const getReviewCampaignInfo = (review: any) => {
    // 캠페인명 우선순위: experience_name > title > experience_id
    const campaignName = safeString(review, 'experience_name') || 
                        safeString(review, 'title') || 
                        safeString(review, 'experience_id') || 
                        '캠페인명 없음'
    
    return campaignName
  }

  const getReviewPlatform = (review: any) => {
    // 플랫폼 우선순위: platform > review_type > blog_url 존재 여부
    const platform = safeString(review, 'platform') || 
                    safeString(review, 'review_type') || 
                    (safeString(review, 'blog_url') ? 'blog' : 'image')
    
    return platform
  }

  const getReviewStatus = (review: any) => {
    // 상태 우선순위: status > admin_review_status
    const status = safeString(review, 'status') || 
                  safeString(review, 'admin_review_status') || 
                  'submitted'
    
    return status
  }

  // 🔥 캠페인별 현재 단계 분석 함수 (새로운 상태 시스템)
  const getCampaignProgress = (experienceId: string) => {
    const experience = experiences.find(exp => exp._id === experienceId || exp.id === experienceId)
    if (!experience) {
      return { stage: 'recruiting', label: '모집중', color: 'bg-blue-100 text-blue-800' }
    }

    // 캠페인 상태를 직접 확인 (새로운 필드)
    const campaignStatus = safeString(experience, 'campaign_status', 'recruiting')
    
    switch (campaignStatus) {
      case 'recruiting':
        return { stage: 'recruiting', label: '모집중', color: 'bg-blue-100 text-blue-800' }
      case 'recruitment_completed':
        return { stage: 'recruitment_completed', label: '모집완료', color: 'bg-yellow-100 text-yellow-800' }
      case 'campaign_ended':
        return { stage: 'campaign_ended', label: '캠페인 종료', color: 'bg-gray-100 text-gray-800' }
      default:
        return { stage: 'recruiting', label: '모집중', color: 'bg-blue-100 text-blue-800' }
    }
  }

  // 🔥 캠페인 상태 변경 함수
  const handleCampaignStatusChange = async (experienceId: string, currentStage: string) => {
    try {
      const experience = experiences.find(exp => exp._id === experienceId || exp.id === experienceId)
      if (!experience) {
        toast.error('캠페인을 찾을 수 없습니다')
        return
      }

      const campaignName = safeString(experience, 'experience_name', '캠페인')
      
      // 다음 상태 결정
      let nextStatus: string
      let nextLabel: string
      
      switch (currentStage) {
        case 'recruiting':
          nextStatus = 'recruitment_completed'
          nextLabel = '모집완료'
          break
        case 'recruitment_completed':
          nextStatus = 'campaign_ended'
          nextLabel = '캠페인 종료'
          break
        case 'campaign_ended':
          nextStatus = 'recruiting'
          nextLabel = '모집중'
          break
        default:
          nextStatus = 'recruitment_completed'
          nextLabel = '모집완료'
      }

      if (!confirm(`"${campaignName}" 캠페인 상태를 "${nextLabel}"로 변경하시겠습니까?`)) {
        return
      }

      // 캠페인 상태 업데이트
      await lumi.entities.experience_codes.update(experienceId, {
        campaign_status: nextStatus,
        updated_at: new Date().toISOString()
      })

      toast.success(`캠페인 상태가 "${nextLabel}"로 변경되었습니다`)
      
      // 데이터 새로고침
      await syncAllData(false, false)
    } catch (error) {
      console.error('캠페인 상태 변경 실패:', error)
      toast.error('캠페인 상태 변경에 실패했습니다')
    }
  }

  // 🔥 리뷰 일괄처리 함수들
  const handleBulkReviewApproval = async (action: 'approved' | 'rejected') => {
    try {
      if (selectedReviews.length === 0) {
        toast.error('선택된 리뷰가 없습니다')
        return
      }

      setBulkActionLoading(true)
      
      for (const reviewId of selectedReviews) {
        await handleReviewApproval(reviewId, action)
      }
      
      toast.success(`${selectedReviews.length}개 리뷰가 ${action === 'approved' ? '승인' : '거절'}되었습니다`)
      setSelectedReviews([])
      await syncAllData(false, false)
    } catch (error) {
      console.error('리뷰 일괄처리 실패:', error)
      toast.error('리뷰 일괄처리에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 🔥 리뷰 일괄 삭제 함수
  const handleBulkReviewDelete = async () => {
    try {
      if (selectedReviews.length === 0) {
        toast.error('선택된 리뷰가 없습니다')
        return
      }

      if (!confirm(`선택된 ${selectedReviews.length}개의 리뷰를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.`)) {
        return
      }

      setBulkActionLoading(true)
      
      for (const reviewId of selectedReviews) {
        try {
          await lumi.entities.review_submissions.delete(reviewId)
        } catch (error) {
          console.error(`리뷰 ${reviewId} 삭제 실패:`, error)
        }
      }
      
      toast.success(`${selectedReviews.length}개 리뷰가 삭제되었습니다`)
      setSelectedReviews([])
      await syncAllData(false, false)
    } catch (error) {
      console.error('리뷰 일괄삭제 실패:', error)
      toast.error('리뷰 일괄삭제에 실패했습니다')
    } finally {
      setBulkActionLoading(false)
    }
  }

  // 🔥 포인트 지급 확인 모달 열기
  const handlePointApprovalClick = (applicationId: string) => {
    setPendingPointApproval(applicationId)
    setShowPointConfirmationModal(true)
  }

  // 🔥 포인트 지급 승인 함수
  const handlePointApproval = async (applicationId: string) => {
    try {
      const application = applications.find(app => (app as any)._id === applicationId || (app as any).id === applicationId)
      if (!application) {
        toast.error('신청을 찾을 수 없습니다')
        return
      }

      const userId = safeString(application, 'user_id')
      const experienceId = safeString(application, 'experience_id')
      
      if (!userId || !experienceId) {
        toast.error('사용자 또는 체험단 정보를 찾을 수 없습니다')
        return
      }

      // 체험단 정보에서 포인트 확인
      const experience = experiences.find(exp => (exp as any)._id === experienceId || (exp as any).id === experienceId)
      const rewardPoints = safeNumber(experience, 'reward_points', 1000) // 기본 1000포인트

      // 사용자 포인트 업데이트
      try {
        const userPointsResponse = await lumi.entities.user_points.list({ 
          filter: { user_id: userId } 
        })
        const userPoints = (userPointsResponse as any).data || []
        
        if (userPoints.length > 0) {
          const currentPoints = userPoints[0] as any
          await lumi.entities.user_points.update(currentPoints._id, {
            total_points: (currentPoints.total_points || 0) + rewardPoints,
            available_points: (currentPoints.available_points || 0) + rewardPoints,
            updated_at: new Date().toISOString()
          })
        } else {
          // 새 포인트 레코드 생성
          await lumi.entities.user_points.create({
            user_id: userId,
            total_points: rewardPoints,
            available_points: rewardPoints,
            withdrawn_points: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
        }

        // 포인트 히스토리 추가
        await lumi.entities.points_history.create({
          user_id: userId,
          type: 'earned',
          amount: rewardPoints,
          description: `리뷰 승인 - ${safeString(application, 'experience_name')}`,
          reference_id: applicationId,
          reference_type: 'review_approval',
          created_at: new Date().toISOString()
        })

        // 신청 상태를 "완료"로 변경
        await lumi.entities.user_applications.update(applicationId, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

        toast.success(`포인트 ${rewardPoints}P가 지급되었습니다!`)
      } catch (pointError) {
        console.error('포인트 지급 실패:', pointError)
        toast.error('포인트 지급에 실패했습니다')
      }

      // 데이터 새로고침
      await syncAllData(false, false)
    } catch (error) {
      console.error('포인트 지급 승인 실패:', error)
      toast.error('포인트 지급 승인에 실패했습니다')
    }
  }

  // 🔥 리뷰 승인/거절 함수
  const handleReviewApproval = async (reviewId: string, action: 'approved' | 'rejected') => {
    try {
      const review = reviews.find(r => (r as any)._id === reviewId || (r as any).id === reviewId)
      if (!review) {
        toast.error('리뷰를 찾을 수 없습니다')
        return
      }

      const reviewData = {
        status: action,
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.name || '관리자'
      }

      // 리뷰 상태 업데이트
      await lumi.entities.review_submissions.update(reviewId, reviewData)

      // 관련 신청 상태 업데이트
      const applicationId = safeString(review, 'application_id')
      if (applicationId) {
        if (action === 'approved') {
          // 승인 시 "리뷰 검수 완료" 상태로 업데이트 (포인트 지급 전)
          await lumi.entities.user_applications.update(applicationId, {
            status: 'review_completed',
            review_completed_at: new Date().toISOString()
          })
        } else if (action === 'rejected') {
          // 거절 시 리뷰 거절 상태로 업데이트
          await lumi.entities.user_applications.update(applicationId, {
            status: 'review_rejected',
            review_rejected_at: new Date().toISOString()
          })
        }
      }

      if (action === 'approved') {
        // 포인트 지급은 별도 프로세스로 처리 (리뷰 검수 완료 후 회원이 요청)

        toast.success('리뷰 검수가 완료되었습니다. 회원이 포인트 지급을 요청할 수 있습니다.')
      } else {
        toast.success('리뷰가 거절되었습니다')
      }

      // 데이터 새로고침
      await syncAllData(false, false)
    } catch (error) {
      console.error('리뷰 처리 실패:', error)
      toast.error('리뷰 처리에 실패했습니다.')
    }
  }

  // 🔥 대시보드 네비게이션 함수들
  const handleDashboardNavigation = (type: string) => {
    switch (type) {
      case 'applications':
        setActiveTab('applications')
        setStatusFilter('all')
        setSearchTerm('')
        setDateFilter('all')
        break
      case 'pending':
        setActiveTab('applications')
        setStatusFilter('pending')
        break
      case 'approved':
        setActiveTab('applications')
        setStatusFilter('approved')
        break
      case 'rejected':
        setActiveTab('applications')
        setStatusFilter('rejected')
        break
      case 'users':
        setActiveTab('users')
        break
      case 'experiences':
        setActiveTab('experiences')
        break
      case 'point-requests':
        setActiveTab('point-requests')
        setStatusFilter('all')
        setSearchTerm('')
        break
      default:
        break
    }
  }

  // 권한 체크
  if (!isAuthenticated || !isAdminUser()) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">접근 권한이 없습니다</h2>
          <p className="text-gray-600">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 데이터를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 🔥 통계 계산
  const safeApplicationsArray = ultraSafeArray(applications)
  const safeUsersArray = ultraSafeArray(users)
  const safeExperiencesArray = ultraSafeArray(experiences)

  const totalApplications = safeApplicationsArray.length
  const pendingApplications = safeApplicationsArray.filter(app => 
    safeString(app, 'status') === 'pending'
  ).length
  const approvedApplications = safeApplicationsArray.filter(app => 
    safeString(app, 'status') === 'approved'
  ).length
  const rejectedApplications = safeApplicationsArray.filter(app => 
    safeString(app, 'status') === 'rejected'
  ).length
  const totalUsers = safeUsersArray.length
  const totalExperiences = safeExperiencesArray.length

  const stats = {
    totalApplications,
    pendingApplications,
    approvedApplications,
    rejectedApplications,
    totalUsers,
    totalExperiences
  }

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { label: '검토중', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'approved':
        return { label: '승인됨', color: 'bg-green-100 text-green-800', icon: CheckCircle }
      case 'rejected':
        return { label: '반려됨', color: 'bg-red-100 text-red-800', icon: XCircle }
      case 'cancelled':
        return { label: '신청 취소', color: 'bg-gray-100 text-gray-800', icon: XCircle }
      case 'review_submitted':
        return { label: '리뷰 제출', color: 'bg-purple-100 text-purple-800', icon: FileText }
      case 'review_completed':
        return { label: '리뷰 검수 완료', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
      case 'point_pending':
        return { label: '포인트 지급 전', color: 'bg-yellow-100 text-yellow-800', icon: Clock }
      case 'in_progress':
        return { label: '진행중', color: 'bg-blue-100 text-blue-800', icon: CheckCircle }
      case 'completed':
        return { label: '포인트 지급완료', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle }
      default:
        return { label: '알 수 없음', color: 'bg-gray-100 text-gray-800', icon: AlertCircle }
    }
  }

  const filteredApplications = getFilteredApplications()
  const filteredExperiences = getFilteredExperiences()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 🔥 헤더 - 사용자 페이지 이동 버튼 추가 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="mt-2 text-gray-600">
                체험단 신청 관리 및 사용자 현황을 확인하세요
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* 🔥 사용자 페이지 이동 버튼 */}
              <button
                onClick={() => navigate('/')}
                className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Home className="w-4 h-4" />
                <span>사용자 페이지로</span>
              </button>
              
              {/* 🔥 실시간 동기화 버튼 */}
              <button
                onClick={() => syncAllData(true, true)}
                disabled={refreshing}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? '동기화 중...' : '새로고침'}</span>
              </button>
              
              {/* 🔥 자동 새로고침 토글 */}
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                  autoRefresh 
                    ? 'bg-purple-600 text-white hover:bg-purple-700' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Bell className="w-4 h-4" />
                <span>자동동기화 {autoRefresh ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>
          
          {/* 🔥 마지막 동기화 시간 표시 */}
          <div className="mt-2 text-sm text-gray-500">
            마지막 동기화: {lastSync.toLocaleString('ko-KR')}
          </div>
        </div>

        {/* 🔥 통계 카드 - 클릭 가능하게 수정 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6 mb-8">
          <div 
            onClick={() => handleDashboardNavigation('applications')}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 신청</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleDashboardNavigation('pending')}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">검토 대기</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleDashboardNavigation('approved')}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedApplications}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleDashboardNavigation('rejected')}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-red-100 rounded-lg">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">반려됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.rejectedApplications}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleDashboardNavigation('users')}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 사용자</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
              </div>
            </div>
          </div>

          <div 
            onClick={() => handleDashboardNavigation('experiences')}
            className="bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Gift className="w-6 h-6 text-indigo-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">체험단</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExperiences}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 🔥 액션 버튼들 */}
        <div className="flex flex-wrap gap-4 mb-8">
          {/* 🔥 캠페인 등록 버튼 */}
          <button
            onClick={() => setShowCampaignModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>캠페인 등록</span>
          </button>
          
          <button
            onClick={() => setShowStatsModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <BarChart3 className="w-4 h-4" />
            <span>통계 차트</span>
          </button>
          
          <button
            onClick={() => setShowNotificationModal(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <Bell className="w-4 h-4" />
            <span>알림 관리</span>
            {notifications.length > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {notifications.length}
              </span>
            )}
          </button>
          
          {selectedApplications.size > 0 && (
            <button
              onClick={() => setBulkModal(true)}
              className="flex items-center space-x-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              <span>일괄 처리 ({selectedApplications.size})</span>
            </button>
          )}
          
          <button
            onClick={exportToExcel}
            className="flex items-center space-x-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>엑셀 내보내기</span>
          </button>
        </div>

        {/* 🔥 검색 및 필터 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름, 이메일, 체험단명으로 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="pending">검토중</option>
              <option value="approved">승인됨</option>
              <option value="rejected">반려됨</option>
              <option value="cancelled">신청 취소</option>
            </select>
            
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">전체 기간</option>
              <option value="today">오늘</option>
              <option value="week">1주일</option>
              <option value="month">1개월</option>
            </select>
            
            <div className="text-sm text-gray-600 flex items-center">
              <Filter className="w-4 h-4 mr-2" />
              {filteredApplications.length}개 항목 표시
            </div>
          </div>
        </div>

        {/* 🔥 탭 네비게이션 */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'applications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              신청 관리
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              사용자 관리
            </button>
            <button
              onClick={() => setActiveTab('experiences')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'experiences'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              캠페인 관리
            </button>
            <button
              onClick={() => setActiveTab('reviews')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reviews'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              리뷰 검수
            </button>
            <button
              onClick={() => setActiveTab('point-requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'point-requests'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              포인트 신청
            </button>
          </nav>
        </div>

        {/* 🔥 탭 컨텐츠 */}
        {activeTab === 'applications' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">신청 목록</h3>
              
              {/* 일괄처리 버튼들 */}
              <div className="flex items-center space-x-4">
                {selectedApplications.size > 0 && (
                  <div className="flex space-x-2">
                    <button
                      onClick={handleBulkDeleteApplications}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {bulkActionLoading ? '삭제 중...' : `일괄삭제 (${selectedApplications.size})`}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {filteredApplications.length === 0 ? (
              <div className="p-12 text-center">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                    ? '검색 결과가 없습니다' 
                    : '신청 내역이 없습니다'
                  }
                </h3>
                <p className="text-gray-600">
                  {searchTerm || statusFilter !== 'all' || dateFilter !== 'all' 
                    ? '다른 검색 조건을 시도해보세요.' 
                    : '아직 체험단 신청이 없습니다.'
                  }
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedApplications.size === filteredApplications.length && filteredApplications.length > 0}
                          onChange={toggleSelectAllApplications}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        체험단
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        플랫폼
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredApplications.map((application, index) => {
                      try {
                        if (!application || typeof application !== 'object') {
                          return null
                        }

                        const applicationId = (application as any)._id || (application as any).id || `app-${index}`
                        const applicantName = safeString(application, 'name', '이름 없음')
                        const applicantEmail = safeString(application, 'email', '이메일 없음')
                        const status = safeString(application, 'status', 'pending')
                        const appliedAt = safeString(application, 'applied_at') || safeString(application, 'created_at')
                        
                        const experience = (application as any).experience
                        const experienceName = experience ? 
                          safeString(experience, 'experience_name', '체험단 정보 없음') :
                          '체험단 정보 없음'
                        
                        const statusInfo = getStatusInfo(status)
                        const StatusIcon = statusInfo.icon

                        const isSelected = selectedApplications.has(applicationId)

                        return (
                          <tr key={applicationId} className={isSelected ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectApplication(applicationId)}
                                className="rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{applicantName}</div>
                                <div className="text-sm text-gray-500">{applicantEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{experienceName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">
                                {(() => {
                                  const platformType = safeString(application, 'platform_type', '')
                                  const platformLabels: { [key: string]: string } = {
                                    'instagram': '인스타그램',
                                    'blog': '블로그',
                                    'youtube': '유튜브',
                                    'review': '구매평',
                                    'multiple': '여러 플랫폼'
                                  }
                                  return platformLabels[platformType] || platformType || '미선택'
                                })()}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusInfo.color}`}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {statusInfo.label}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {appliedAt ? new Date(appliedAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedApplication(application)
                                  setMemoText(safeString(application, 'admin_message', ''))
                                  setIsEditingMemo(false)
                                  setShowDetailModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="상세보기"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              
                              {(status === 'pending' || status === 'review_submitted') && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(application)
                                      setShowApprovalModal(true)
                                    }}
                                    className="text-green-600 hover:text-green-900"
                                    title="승인"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(application)
                                      setShowRejectionModal(true)
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                    title="반려"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                              
                              {status === 'point_pending' && (
                              <button
                                  onClick={() => handlePointApprovalClick(applicationId)}
                                  className="text-yellow-600 hover:text-yellow-900"
                                  title="포인트 지급"
                                >
                                  <Gift className="w-4 h-4" />
                              </button>
                              )}
                              
                            </td>
                          </tr>
                        )
                      } catch (renderError) {
                        console.error(`신청 항목 렌더링 실패 [${index}]:`, renderError)
                        return null
                      }
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 사용자 관리 탭 */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h3 className="text-lg font-medium">사용자 목록</h3>
              
              {/* 일괄삭제 버튼 */}
              {selectedUsers.size > 0 && (
                <button
                  onClick={handleBulkDeleteUsers}
                  disabled={bulkActionLoading}
                  className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                >
                  {bulkActionLoading ? '삭제 중...' : `일괄삭제 (${selectedUsers.size})`}
                </button>
              )}
            </div>
            
            {safeUsersArray.length === 0 ? (
              <div className="p-12 text-center">
                <UserCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 사용자가 없습니다</h3>
                <p className="text-gray-600">아직 가입한 사용자가 없습니다.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedUsers.size === safeUsersArray.length && safeUsersArray.length > 0}
                          onChange={toggleSelectAllUsers}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        사용자
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        연락처
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        가입일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        로그인 방법
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        프로필 정보
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청 캠페인
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {safeUsersArray.map((user, index) => {
                      try {
                        if (!user || typeof user !== 'object') {
                          return null
                        }

                        const userId = (user as any)._id || (user as any).id || `user-${index}`
                        const userName = safeString(user, 'name', 'Google User')
                        const userEmail = safeString(user, 'email', '이메일 없음')
                        const userPhone = safeString(user, 'phone', '번호 없음')
                        const createdAt = safeString(user, 'created_at')
                        const loginMethod = (user as any).login_method || ((user as any).google_id ? 'Google' : '일반')
                        
                        // 디버깅: 사용자 정보 로그
                        console.log('👤 사용자 정보:', { userId, userName, userEmail, userPhone, loginMethod })
                        
                        // 디버깅: 해당 사용자의 신청 찾기
                        const userApps = getUserApplications(userId)
                        console.log(`🔍 ${userName}(${userEmail})의 신청 개수:`, userApps.length)

                        const isSelected = selectedUsers.has(userId)

                        return (
                          <tr key={userId} className={isSelected ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectUser(userId)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{userName}</div>
                                <div className="text-sm text-gray-500">{userEmail}</div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{userPhone}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {createdAt ? new Date(createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                loginMethod === 'Google'
                                  ? 'bg-blue-100 text-blue-800' 
                                  : 'bg-gray-100 text-gray-800'
                              }`}>
                                {loginMethod}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {(user as any).profile ? (
                                <div className="space-y-1">
                                  <div className="text-xs">
                                    <span className="font-medium">전화:</span> {safeString((user as any).profile, 'phone', '미입력')}
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-medium">주소:</span> {safeString((user as any).profile, 'address', '미입력')}
                                  </div>
                                  <div className="text-xs">
                                    <span className="font-medium">생년월일:</span> {safeString((user as any).profile, 'birth_date', '미입력')}
                                  </div>
                                </div>
                              ) : (
                                <span className="text-gray-400 text-xs">프로필 미작성</span>
                              )}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => {
                                  const userApplications = getUserApplications(userId)
                                  setSelectedApplication({ 
                                    ...user, 
                                    userApplications,
                                    isUserApplications: true 
                                  })
                                  setShowDetailModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                {getUserApplications(userId).length}개
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedApplication(user)
                                  setMemoText('')
                                  setIsEditingMemo(false)
                                  setIsEditingMetadata(false)
                                  setEditingData({})
                                  setShowDetailModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="상세보기"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(userId)}
                                className="text-red-600 hover:text-red-900"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      } catch (renderError) {
                        console.error(`사용자 항목 렌더링 실패 [${index}]:`, renderError)
                        return null
                      }
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 캠페인 관리 탭 */}
        {activeTab === 'experiences' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">캠페인 목록</h3>
                <div className="flex space-x-2">
                  {selectedExperiences.size > 0 && (
                    <button
                      onClick={handleBulkDeleteExperiences}
                      disabled={bulkActionLoading}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      {bulkActionLoading ? '삭제 중...' : `일괄삭제 (${selectedExperiences.size})`}
                    </button>
                  )}
                  <button
                    onClick={() => setShowCampaignTypeUpdateModal(true)}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    캠페인 타입 일괄 수정
                  </button>
                  <button
                    onClick={handleUpdateCampaignFields}
                    disabled={bulkActionLoading}
                    className="px-3 py-1 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 disabled:opacity-50"
                  >
                    {bulkActionLoading ? '업데이트 중...' : '기존 캠페인 필드 업데이트'}
                  </button>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>새 캠페인</span>
              </button>
                </div>
            </div>
            
              {/* 체험단 필터링 UI */}
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-64">
                  <input
                    type="text"
                    placeholder="체험단명 또는 브랜드명으로 검색..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div className="min-w-48">
                  <select
                    value={experienceTypeFilter}
                    onChange={(e) => setExperienceTypeFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">모든 타입</option>
                    <option value="purchase_review">구매평</option>
                    <option value="product">제품 체험</option>
                    <option value="press">기자단</option>
                    <option value="local">지역 체험</option>
                  </select>
                </div>
              </div>
            </div>
            
            {filteredExperiences.length === 0 ? (
              <div className="p-12 text-center">
                <Gift className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">등록된 체험단이 없습니다</h3>
                <p className="text-gray-600 mb-4">아직 생성된 체험단이 없습니다.</p>
                <button
                  onClick={() => setShowCampaignModal(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  첫 번째 캠페인 만들기
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <input
                          type="checkbox"
                          checked={selectedExperiences.size === filteredExperiences.length && filteredExperiences.length > 0}
                          onChange={toggleSelectAllExperiences}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        체험단명
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        브랜드
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        타입
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        모집 정원
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        상태
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        신청자 수
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        현재 단계
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        생성일
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        액션
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredExperiences.map((experience, index) => {
                      try {
                        if (!experience || typeof experience !== 'object') {
                          return null
                        }

                        const experienceId = (experience as any)._id || (experience as any).id || `exp-${index}`
                        const experienceName = safeString(experience, 'experience_name', '체험단명 없음')
                        const brandName = safeString(experience, 'brand_name', '브랜드명 없음')
                        const maxParticipants = safeNumber(experience, 'max_participants', 0)
                        const status = safeString(experience, 'status', 'active')
                        const createdAt = safeString(experience, 'created_at')

                        const isSelected = selectedExperiences.has(experienceId)

                        return (
                          <tr key={experienceId} className={isSelected ? 'bg-blue-50' : ''}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleSelectExperience(experienceId)}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{experienceName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{brandName}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                (() => {
                                  const experienceType = safeString(experience, 'experience_type', 'purchase_review')
                                  switch (experienceType) {
                                    case 'product': return 'bg-blue-100 text-blue-800'
                                    case 'press': return 'bg-purple-100 text-purple-800'
                                    case 'local': return 'bg-green-100 text-green-800'
                                    case 'purchase_review': return 'bg-orange-100 text-orange-800'
                                    default: return 'bg-gray-100 text-gray-800'
                                  }
                                })()
                              }`}>
                                {(() => {
                                  const experienceType = safeString(experience, 'experience_type', 'purchase_review')
                                  const typeLabels: { [key: string]: string } = {
                                    'product': '제품 체험',
                                    'press': '기자단',
                                    'local': '지역 체험',
                                    'purchase_review': '구매평'
                                  }
                                  return typeLabels[experienceType] || '구매평'
                                })()}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{maxParticipants}명</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                status === 'active' ? 'bg-green-100 text-green-800' : 
                                status === 'closed' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {status === 'active' ? '활성' : status === 'closed' ? '마감' : '준비중'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              <button
                                onClick={() => {
                                  const campaignApplicants = getCampaignApplicants(experienceId)
                                  setSelectedApplication({ 
                                    ...experience, 
                                    campaignApplicants,
                                    isCampaignApplicants: true 
                                  })
                                  setShowDetailModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900 font-medium"
                              >
                                {getCampaignApplicantCount(experienceId)}명
                              </button>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {(() => {
                                const progress = getCampaignProgress(experienceId)
                                return (
                                  <button
                                    onClick={() => handleCampaignStatusChange(experienceId, progress.stage)}
                                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${progress.color} hover:opacity-80 cursor-pointer transition-opacity`}
                                    title="클릭하여 상태 변경"
                                  >
                                    {progress.label}
                                  </button>
                                )
                              })()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {createdAt ? new Date(createdAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              <button
                                onClick={() => {
                                  setSelectedApplication(experience)
                                  setMemoText('')
                                  setIsEditingMemo(false)
                                  setShowDetailModal(true)
                                }}
                                className="text-blue-600 hover:text-blue-900"
                                title="상세보기"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCampaign(experience)
                                  setShowCampaignEditModal(true)
                                }}
                                className="text-purple-600 hover:text-purple-900"
                                title="캠페인 편집"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteExperience(experienceId)}
                                className="text-red-600 hover:text-red-900"
                                title="삭제"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        )
                      } catch (renderError) {
                        console.error(`체험단 항목 렌더링 실패 [${index}]:`, renderError)
                        return null
                      }
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 리뷰 검수 탭 */}
        {activeTab === 'reviews' && (
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">리뷰 검수 목록</h3>
                <div className="flex items-center space-x-4">
                  <div className="text-sm text-gray-500">
                    총 {reviews.length}건의 리뷰
                  </div>
                  {selectedReviews.length > 0 && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleBulkReviewApproval('approved')}
                        disabled={bulkActionLoading}
                        className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {bulkActionLoading ? '처리 중...' : `일괄 승인 (${selectedReviews.length})`}
                      </button>
                      <button
                        onClick={() => handleBulkReviewApproval('rejected')}
                        disabled={bulkActionLoading}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {bulkActionLoading ? '처리 중...' : `일괄 거절 (${selectedReviews.length})`}
                      </button>
                      <button
                        onClick={handleBulkReviewDelete}
                        disabled={bulkActionLoading}
                        className="px-3 py-1 bg-gray-600 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-50"
                      >
                        {bulkActionLoading ? '처리 중...' : `일괄 삭제 (${selectedReviews.length})`}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      <input
                        type="checkbox"
                        checked={selectedReviews.length === reviews.length && reviews.length > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedReviews(reviews.map((review: any, index: number) => 
                              (review as any)._id || (review as any).id || `review-${index}`
                            ))
                          } else {
                            setSelectedReviews([])
                          }
                        }}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      사용자
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      캠페인
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      리뷰 타입
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      상태
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제출일
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      액션
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {reviews.map((review: any, index: number) => {
                    try {
                      if (!review || typeof review !== 'object') {
                        return null
                      }

                      const reviewId = (review as any)._id || (review as any).id || `review-${index}`
                      const userName = getReviewUserInfo(review)
                      const experienceName = getReviewCampaignInfo(review)
                      const platform = getReviewPlatform(review)
                      const status = getReviewStatus(review)
                      const submittedAt = safeString(review, 'submitted_at')
                      
                      // 🔥 디버깅: 리뷰 상태 정보 로그
                      console.log('🔍 리뷰 상태 디버깅:', {
                        reviewId,
                        userName,
                        experienceName,
                        status,
                        rawStatus: safeString(review, 'status'),
                        adminReviewStatus: safeString(review, 'admin_review_status'),
                        fullReview: review
                      })

                      return (
                        <tr key={reviewId}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedReviews.includes(reviewId)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedReviews([...selectedReviews, reviewId])
                                } else {
                                  setSelectedReviews(selectedReviews.filter(id => id !== reviewId))
                                }
                              }}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{userName}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => {
                                setSelectedReview(review)
                                setShowReviewDetailModal(true)
                              }}
                              className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                            >
                              {experienceName}
                            </button>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              platform === 'instagram' ? 'bg-pink-100 text-pink-800' :
                              platform === 'blog' ? 'bg-blue-100 text-blue-800' :
                              platform === 'youtube' ? 'bg-red-100 text-red-800' :
                              'bg-orange-100 text-orange-800'
                            }`}>
                              {platform === 'instagram' ? '인스타그램' :
                               platform === 'blog' ? '블로그' :
                               platform === 'youtube' ? '유튜브' : '구매평'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                              status === 'approved' ? 'bg-green-100 text-green-800' :
                              status === 'rejected' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {status === 'submitted' ? '검수 대기중' :
                               status === 'approved' ? '승인됨' : 
                               status === 'rejected' ? '거절됨' : '알 수 없음'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {submittedAt ? new Date(submittedAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                            <button
                              onClick={() => {
                                setSelectedApplication(review)
                                setShowDetailModal(true)
                              }}
                              className="text-blue-600 hover:text-blue-900"
                              title="상세보기"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {(status === 'submitted' || status === 'pending' || status === '검수 대기중') && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedReview(review)
                                    setShowReviewApprovalModal(true)
                                  }}
                                  className="text-green-600 hover:text-green-900"
                                  title="승인"
                                >
                                  <CheckCircle className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setSelectedReview(review)
                                    setShowReviewRejectionModal(true)
                                  }}
                                  className="text-red-600 hover:text-red-900"
                                  title="거절"
                                >
                                  <XCircle className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </td>
                        </tr>
                      )
                    } catch (renderError) {
                      console.error(`리뷰 항목 렌더링 실패 [${index}]:`, renderError)
                      return null
                    }
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 🔥 모달들 */}
      {showApprovalModal && selectedApplication && (
        <ApprovalModal
          isOpen={showApprovalModal}
          onClose={() => {
            setShowApprovalModal(false)
            setSelectedApplication(null)
          }}
          application={selectedApplication}
          onApprovalComplete={async () => {
            // 🔥 강력한 데이터 새로고침
            await syncAllData(false, false)
            
            // 🔥 추가 새로고침 (캐시 무효화)
            setTimeout(async () => {
              await syncAllData(false, false)
              console.log('🔄 승인 후 추가 새로고침 완료')
            }, 1000)
            
            // 🔥 사용자 관리 탭에서 승인한 경우 사용자 데이터도 새로고침
            if (activeTab === 'users') {
              setTimeout(async () => {
                await loadUsers()
                console.log('🔄 사용자 데이터 새로고침 완료')
              }, 1500)
            }
            
            setShowApprovalModal(false)
            setSelectedApplication(null)
          }}
        />
      )}

      {showRejectionModal && selectedApplication && (
        <RejectionModal
          isOpen={showRejectionModal}
          onClose={() => {
            setShowRejectionModal(false)
            setSelectedApplication(null)
          }}
          application={selectedApplication}
          onRejectionComplete={async () => {
            // 🔥 강력한 데이터 새로고침
            await syncAllData(false, false)
            
            // 🔥 추가 새로고침 (캐시 무효화)
            setTimeout(async () => {
              await syncAllData(false, false)
              console.log('🔄 거절 후 추가 새로고침 완료')
            }, 1000)
            
            // 🔥 사용자 관리 탭에서 거절한 경우 사용자 데이터도 새로고침
            if (activeTab === 'users') {
              setTimeout(async () => {
                await loadUsers()
                console.log('🔄 사용자 데이터 새로고침 완료')
              }, 1500)
            }
            
            setShowRejectionModal(false)
            setSelectedApplication(null)
          }}
        />
      )}

      {/* 🔥 리뷰 상세 모달 */}
      {showReviewDetailModal && selectedReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">리뷰 상세 정보</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {getReviewCampaignInfo(selectedReview)} - {getReviewUserInfo(selectedReview)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setShowReviewDetailModal(false)
                    setSelectedReview(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* 기본 정보 */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">사용자 정보</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm"><strong>이름:</strong> {getReviewUserInfo(selectedReview)}</p>
                      <p className="text-sm"><strong>이메일:</strong> {safeString(selectedReview, 'user_email', '정보 없음')}</p>
                      <p className="text-sm"><strong>사용자 ID:</strong> {safeString(selectedReview, 'user_id', '정보 없음')}</p>
                      <p className="text-sm"><strong>신청 ID:</strong> {safeString(selectedReview, 'application_id', '정보 없음')}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">캠페인 정보</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm"><strong>캠페인명:</strong> {getReviewCampaignInfo(selectedReview)}</p>
                      <p className="text-sm"><strong>체험단 ID:</strong> {safeString(selectedReview, 'experience_id', '정보 없음')}</p>
                      <p className="text-sm"><strong>리뷰 타입:</strong> {getReviewPlatform(selectedReview)}</p>
                      <p className="text-sm"><strong>리뷰 ID:</strong> {(selectedReview as any)._id || (selectedReview as any).id || '정보 없음'}</p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">상태 정보</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm"><strong>상태:</strong> 
                        <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          getReviewStatus(selectedReview) === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                          getReviewStatus(selectedReview) === 'approved' ? 'bg-green-100 text-green-800' :
                          getReviewStatus(selectedReview) === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {getReviewStatus(selectedReview) === 'submitted' ? '검수 대기중' :
                           getReviewStatus(selectedReview) === 'approved' ? '승인됨' : 
                           getReviewStatus(selectedReview) === 'rejected' ? '거절됨' : '알 수 없음'}
                        </span>
                      </p>
                      <p className="text-sm"><strong>원본 상태:</strong> {safeString(selectedReview, 'status', '정보 없음')}</p>
                      <p className="text-sm"><strong>관리자 검수 상태:</strong> {safeString(selectedReview, 'admin_review_status', '정보 없음')}</p>
                      <p className="text-sm"><strong>제출일:</strong> {safeString(selectedReview, 'submitted_at') 
                        ? new Date(safeString(selectedReview, 'submitted_at')).toLocaleDateString('ko-KR')
                        : '정보 없음'}</p>
                      <p className="text-sm"><strong>검수일:</strong> {safeString(selectedReview, 'reviewed_at') 
                        ? new Date(safeString(selectedReview, 'reviewed_at')).toLocaleDateString('ko-KR')
                        : '정보 없음'}</p>
                      <p className="text-sm"><strong>검수자:</strong> {safeString(selectedReview, 'reviewed_by', '정보 없음')}</p>
                    </div>
                  </div>
                </div>

                {/* 리뷰 내용 */}
                <div className="space-y-4">
                  {safeString(selectedReview, 'blog_url') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">블로그 URL</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <a 
                          href={safeString(selectedReview, 'blog_url')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline break-all"
                        >
                          {safeString(selectedReview, 'blog_url')}
                        </a>
                      </div>
                    </div>
                  )}

                  {safeString(selectedReview, 'additional_notes') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">추가 메모</label>
                      <div className="bg-gray-50 p-3 rounded-lg">
                        <p className="text-sm whitespace-pre-wrap">{safeString(selectedReview, 'additional_notes')}</p>
                      </div>
                    </div>
                  )}

                  {/* 리뷰 메타데이터 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">리뷰 메타데이터</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="text-sm"><strong>리뷰 타입:</strong> {safeString(selectedReview, 'review_type', '정보 없음')}</p>
                      <p className="text-sm"><strong>메인 이미지:</strong> {safeString(selectedReview, 'main_image', '정보 없음')}</p>
                      <p className="text-sm"><strong>거절 사유:</strong> {safeString(selectedReview, 'rejection_reason', '정보 없음')}</p>
                      <p className="text-sm"><strong>관리자 메모:</strong> {safeString(selectedReview, 'admin_review_notes', '정보 없음')}</p>
                      <p className="text-sm"><strong>생성일:</strong> {safeString(selectedReview, 'created_at') 
                        ? new Date(safeString(selectedReview, 'created_at')).toLocaleDateString('ko-KR')
                        : '정보 없음'}</p>
                      <p className="text-sm"><strong>수정일:</strong> {safeString(selectedReview, 'updated_at') 
                        ? new Date(safeString(selectedReview, 'updated_at')).toLocaleDateString('ko-KR')
                        : '정보 없음'}</p>
                    </div>
                  </div>

                  {/* 첨부 이미지 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">첨부 이미지</label>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      {(() => {
                        // 🔥 모든 가능한 이미지 필드 확인
                        const images = selectedReview.review_images || 
                                     selectedReview.images || 
                                     selectedReview.image_urls || 
                                     selectedReview.attached_images ||
                                     selectedReview.uploaded_images ||
                                     (selectedReview.main_image ? [selectedReview.main_image] : [])
                        
                        console.log('🖼️ 리뷰 이미지 디버깅:', {
                          review_images: selectedReview.review_images,
                          images: selectedReview.images,
                          image_urls: selectedReview.image_urls,
                          attached_images: selectedReview.attached_images,
                          uploaded_images: selectedReview.uploaded_images,
                          main_image: selectedReview.main_image,
                          final_images: images
                        })
                        
                        if (images && images.length > 0) {
                          return (
                            <div>
                              <p className="text-sm text-gray-600 mb-2">총 {images.length}개의 이미지</p>
                              <div className="grid grid-cols-2 gap-2">
                                {images.map((image: string, index: number) => (
                                  <div key={index} className="relative">
                                    <img
                                      src={image}
                                      alt={`리뷰 이미지 ${index + 1}`}
                                      className="w-full h-32 object-cover rounded-lg border"
                                      onError={(e) => {
                                        console.log('이미지 로드 실패:', image)
                                        ;(e.target as HTMLImageElement).style.display = 'none'
                                      }}
                                      onLoad={() => {
                                        console.log('이미지 로드 성공:', image)
                                      }}
                                    />
                                    <p className="text-xs text-gray-500 mt-1 truncate">{image}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )
                        } else {
                          return (
                            <div>
                              <p className="text-sm text-gray-500">첨부된 이미지가 없습니다.</p>
                              <p className="text-xs text-gray-400 mt-1">이미지 필드 확인: {JSON.stringify({
                                review_images: !!selectedReview.review_images,
                                images: !!selectedReview.images,
                                image_urls: !!selectedReview.image_urls,
                                attached_images: !!selectedReview.attached_images,
                                uploaded_images: !!selectedReview.uploaded_images,
                                main_image: !!selectedReview.main_image
                              })}</p>
                            </div>
                          )
                        }
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              {/* 액션 버튼들 */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowReviewDetailModal(false)
                    setSelectedReview(null)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
                {(getReviewStatus(selectedReview) === 'submitted' || 
                  getReviewStatus(selectedReview) === 'pending' || 
                  getReviewStatus(selectedReview) === '검수 대기중') && (
                  <>
                    <button
                      onClick={() => {
                        setShowReviewDetailModal(false)
                        setShowReviewApprovalModal(true)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => {
                        setShowReviewDetailModal(false)
                        setShowReviewRejectionModal(true)
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      거절
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 리뷰 승인 모달 */}
      {showReviewApprovalModal && selectedReview && (
        <ApprovalModal
          isOpen={showReviewApprovalModal}
          onClose={() => {
            setShowReviewApprovalModal(false)
            setSelectedReview(null)
          }}
          application={{
            ...selectedReview,
            // 리뷰 데이터를 신청 데이터 형태로 변환
            user_name: getReviewUserInfo(selectedReview),
            user_email: safeString(selectedReview, 'user_email'),
            experience_name: getReviewCampaignInfo(selectedReview),
            _id: (selectedReview as any)._id || (selectedReview as any).id,
            id: (selectedReview as any)._id || (selectedReview as any).id
          }}
          onApprovalComplete={async () => {
            // 🔥 리뷰 승인 처리 (이메일 발송 후)
            const reviewId = (selectedReview as any)._id || (selectedReview as any).id
            await handleReviewApproval(reviewId, 'approved')
            
            // 🔥 강력한 데이터 새로고침
            await syncAllData(false, false)
            
            // 🔥 추가 새로고침 (캐시 무효화)
            setTimeout(async () => {
              await syncAllData(false, false)
              console.log('🔄 리뷰 승인 후 추가 새로고침 완료')
            }, 1000)
            
            setShowReviewApprovalModal(false)
            setSelectedReview(null)
          }}
        />
      )}

      {/* 🔥 리뷰 거절 모달 */}
      {showReviewRejectionModal && selectedReview && (
        <RejectionModal
          isOpen={showReviewRejectionModal}
          onClose={() => {
            setShowReviewRejectionModal(false)
            setSelectedReview(null)
          }}
          application={{
            ...selectedReview,
            // 리뷰 데이터를 신청 데이터 형태로 변환
            user_name: getReviewUserInfo(selectedReview),
            user_email: safeString(selectedReview, 'user_email'),
            experience_name: getReviewCampaignInfo(selectedReview),
            _id: (selectedReview as any)._id || (selectedReview as any).id,
            id: (selectedReview as any)._id || (selectedReview as any).id
          }}
          onRejectionComplete={async () => {
            // 🔥 리뷰 거절 처리
            const reviewId = (selectedReview as any)._id || (selectedReview as any).id
            await handleReviewApproval(reviewId, 'rejected')
            
            // 🔥 강력한 데이터 새로고침
            await syncAllData(false, false)
            
            // 🔥 추가 새로고침 (캐시 무효화)
            setTimeout(async () => {
              await syncAllData(false, false)
              console.log('🔄 리뷰 거절 후 추가 새로고침 완료')
            }, 1000)
            
            setShowReviewRejectionModal(false)
            setSelectedReview(null)
          }}
        />
      )}

      {/* 🔥 캠페인 등록 모달 */}
      <CampaignCreationModal
        isOpen={showCampaignModal}
        onClose={() => setShowCampaignModal(false)}
        onSuccess={() => {
          syncAllData(false, false) // 데이터 새로고침
          toast.success('캠페인이 성공적으로 등록되었습니다!')
        }}
      />

      {/* 🔥 캠페인 편집 모달 */}
      <CampaignEditModal
        isOpen={showCampaignEditModal}
        onClose={() => setShowCampaignEditModal(false)}
        onSuccess={() => {
          syncAllData(false, false) // 데이터 새로고침
          toast.success('캠페인이 성공적으로 수정되었습니다!')
        }}
        campaign={selectedCampaign}
      />

      {/* 🔥 캠페인 타입 일괄 수정 모달 */}
      {showCampaignTypeUpdateModal && (
        <CampaignTypeUpdateModal
          isOpen={showCampaignTypeUpdateModal}
          onClose={() => setShowCampaignTypeUpdateModal(false)}
          experiences={experiences}
          onUpdate={handleDetailedCampaignTypeUpdate}
        />
      )}

      {/* 🔥 신청/체험단 상세보기 모달 */}
      {showDetailModal && selectedApplication && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">
                  {selectedApplication.experience_name ? '체험단 상세정보' : 
                   selectedApplication.email && !selectedApplication.experience_name && !selectedApplication.name ? '사용자 상세정보' : 
                   selectedApplication.isCampaignApplicants ? '캠페인 신청자 목록' :
                   selectedApplication.isUserApplications ? '사용자 신청 캠페인 목록' :
                   selectedApplication.user_name && selectedApplication.experience_name ? '리뷰 상세정보' :
                   '신청 상세정보'}
                </h3>
                <div className="flex items-center space-x-2">
                  {!isEditingMetadata && (
                    <button
                      onClick={() => {
                        setIsEditingMetadata(true)
                        setEditingData({ ...selectedApplication })
                      }}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                    >
                      편집
                    </button>
                  )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-4">
              {/* 캠페인 신청자 목록인지 사용자 정보인지 체험단 정보인지 신청 정보인지에 따라 다른 내용 표시 */}
              {selectedApplication.isCampaignApplicants ? (
                // 캠페인 신청자 목록 표시
                <div>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">캠페인 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{safeString(selectedApplication, 'experience_name', '캠페인명 없음')}</p>
                      <p className="text-sm text-gray-600">{safeString(selectedApplication, 'brand_name', '브랜드명 없음')}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-700 mb-3">신청자 목록 ({selectedApplication.campaignApplicants?.length || 0}명)</h4>
                  {selectedApplication.campaignApplicants && selectedApplication.campaignApplicants.length > 0 ? (
                    <div className="space-y-3">
                      {selectedApplication.campaignApplicants.map((applicant: any, index: number) => (
                        <div key={applicant._id || applicant.id || index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {safeString(applicant, 'name', '이름 없음')}
                                </h5>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  (() => {
                                    const status = safeString(applicant, 'status', 'pending')
                                    switch (status) {
                                      case 'pending': return 'bg-yellow-100 text-yellow-800'
                                      case 'approved': return 'bg-green-100 text-green-800'
                                      case 'rejected': return 'bg-red-100 text-red-800'
                                      case 'cancelled': return 'bg-gray-100 text-gray-800'
                                      case 'in_progress': return 'bg-blue-100 text-blue-800'
                                      case 'review_submitted': return 'bg-purple-100 text-purple-800'
                                      case 'completed': return 'bg-gray-100 text-gray-800'
                                      default: return 'bg-gray-100 text-gray-800'
                                    }
                                  })()
                                }`}>
                                  {getStatusInfo(safeString(applicant, 'status')).label}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>이메일: {safeString(applicant, 'email', '정보 없음')}</p>
                                <p>휴대폰: {safeString(applicant, 'phone', '정보 없음')}</p>
                                <p>신청일: {safeString(applicant, 'applied_at') || safeString(applicant, 'created_at') 
                                  ? new Date(safeString(applicant, 'applied_at') || safeString(applicant, 'created_at')).toLocaleDateString('ko-KR')
                                  : '날짜 없음'}</p>
                                <p>플랫폼: {(() => {
                                  const platformType = safeString(applicant, 'platform_type', '')
                                  const platformLabels: { [key: string]: string } = {
                                    'instagram': '인스타그램',
                                    'blog': '블로그',
                                    'youtube': '유튜브',
                                    'review': '구매평',
                                    'multiple': '여러 플랫폼'
                                  }
                                  return platformLabels[platformType] || platformType || '미선택'
                                })()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              {safeString(applicant, 'status') === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(applicant)
                                      setShowApprovalModal(true)
                                    }}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(applicant)
                                      setShowRejectionModal(true)
                                    }}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    거절
                                  </button>
                                </>
                              )}
                              
                              {safeString(applicant, 'status') === 'point_pending' && (
                                <button
                                  onClick={() => handlePointApprovalClick((applicant as any)._id || (applicant as any).id)}
                                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                >
                                  포인트 지급
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedApplication(applicant)
                                  setMemoText(safeString(applicant, 'admin_message', ''))
                                  setIsEditingMemo(false)
                                  setIsEditingMetadata(false)
                                  setEditingData({})
                                  setShowDetailModal(true)
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                상세보기
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">신청자가 없습니다.</p>
                  )}
                </div>
              ) : selectedApplication.email && !selectedApplication.experience_name && !selectedApplication.name ? (
                // 사용자 정보 표시
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">사용자명</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.name || ''}
                        onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'name', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">이메일</label>
                    {isEditingMetadata ? (
                      <input
                        type="email"
                        value={editingData.email || ''}
                        onChange={(e) => setEditingData({...editingData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'email', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">휴대폰</label>
                    {isEditingMetadata ? (
                      <input
                        type="tel"
                        value={editingData.phone || ''}
                        onChange={(e) => setEditingData({...editingData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'phone', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">가입일</label>
                    <p className="text-gray-900">
                      {safeString(selectedApplication, 'created_at') 
                        ? new Date(safeString(selectedApplication, 'created_at')).toLocaleString('ko-KR')
                        : '정보 없음'
                      }
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="font-medium text-gray-700">주소</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.address || ''}
                        onChange={(e) => setEditingData({...editingData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'address', '주소 정보 없음')}</p>
                    )}
                  </div>
                </div>
              ) : selectedApplication.isUserApplications ? (
                // 사용자별 신청한 캠페인 정보
                <div>
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">사용자 정보</h4>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <p className="font-medium">{safeString(selectedApplication, 'name', '이름 없음')}</p>
                      <p className="text-sm text-gray-600">{safeString(selectedApplication, 'email', '이메일 없음')}</p>
                    </div>
                  </div>
                  
                  <h4 className="font-medium text-gray-700 mb-3">신청한 캠페인 ({selectedApplication.userApplications?.length || 0}개)</h4>
                  {selectedApplication.userApplications && selectedApplication.userApplications.length > 0 ? (
                    <div className="space-y-3">
                      {selectedApplication.userApplications.map((app: any, index: number) => (
                        <div key={app._id || app.id || index} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-2">
                                <h5 className="font-medium text-gray-900">
                                  {app.experience ? safeString(app.experience, 'experience_name', '체험단 정보 없음') : '체험단 정보 없음'}
                                </h5>
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  (() => {
                                    const status = safeString(app, 'status', 'pending')
                                    switch (status) {
                                      case 'pending': return 'bg-yellow-100 text-yellow-800'
                                      case 'approved': return 'bg-green-100 text-green-800'
                                      case 'rejected': return 'bg-red-100 text-red-800'
                                      case 'cancelled': return 'bg-gray-100 text-gray-800'
                                      case 'in_progress': return 'bg-blue-100 text-blue-800'
                                      case 'review_submitted': return 'bg-purple-100 text-purple-800'
                                      case 'completed': return 'bg-gray-100 text-gray-800'
                                      default: return 'bg-gray-100 text-gray-800'
                                    }
                                  })()
                                }`}>
                                  {getStatusInfo(safeString(app, 'status')).label}
                                </span>
                              </div>
                              <div className="text-sm text-gray-600 space-y-1">
                                <p>신청일: {safeString(app, 'applied_at') || safeString(app, 'created_at') 
                                  ? new Date(safeString(app, 'applied_at') || safeString(app, 'created_at')).toLocaleDateString('ko-KR')
                                  : '날짜 없음'}</p>
                                <p>플랫폼: {(() => {
                                  const platformType = safeString(app, 'platform_type', '')
                                  const platformLabels: { [key: string]: string } = {
                                    'instagram': '인스타그램',
                                    'blog': '블로그',
                                    'youtube': '유튜브',
                                    'review': '구매평',
                                    'multiple': '여러 플랫폼'
                                  }
                                  return platformLabels[platformType] || platformType || '미선택'
                                })()}</p>
                              </div>
                            </div>
                            <div className="flex space-x-2 ml-4">
                              {safeString(app, 'status') === 'pending' && (
                                <>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(app)
                                      setShowApprovalModal(true)
                                    }}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                  >
                                    승인
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(app)
                                      setShowRejectionModal(true)
                                    }}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                  >
                                    거절
                                  </button>
                                </>
                              )}
                              
                              {safeString(app, 'status') === 'point_pending' && (
                                <button
                                  onClick={() => handlePointApprovalClick((app as any)._id || (app as any).id)}
                                  className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                                >
                                  포인트 지급
                                </button>
                              )}
                              <button
                                onClick={() => {
                                  setSelectedApplication(app)
                                  setMemoText(safeString(app, 'admin_message', ''))
                                  setIsEditingMemo(false)
                                  setIsEditingMetadata(false)
                                  setEditingData({})
                                  setShowDetailModal(true)
                                }}
                                className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                              >
                                상세보기
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-4">신청한 캠페인이 없습니다.</p>
                  )}
                </div>
              ) : selectedApplication.email && !selectedApplication.experience_name && !selectedApplication.name ? (
                // 사용자 정보 표시
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">사용자명</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.name || ''}
                        onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'name', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">이메일</label>
                    {isEditingMetadata ? (
                      <input
                        type="email"
                        value={editingData.email || ''}
                        onChange={(e) => setEditingData({...editingData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'email', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">휴대폰</label>
                    {isEditingMetadata ? (
                      <input
                        type="tel"
                        value={editingData.phone || ''}
                        onChange={(e) => setEditingData({...editingData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'phone', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">가입일</label>
                    <p className="text-gray-900">
                      {safeString(selectedApplication, 'created_at') 
                        ? new Date(safeString(selectedApplication, 'created_at')).toLocaleString('ko-KR')
                        : '정보 없음'
                      }
                    </p>
                  </div>
                  <div className="col-span-2">
                    <label className="font-medium text-gray-700">주소</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.address || ''}
                        onChange={(e) => setEditingData({...editingData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'address', '주소 정보 없음')}</p>
                    )}
                  </div>
                </div>
              ) : selectedApplication.user_name && selectedApplication.experience_name ? (
                // 리뷰 상세정보 표시
                <div className="space-y-6">
                  {/* 기본 정보 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="font-medium text-gray-700">사용자명</label>
                      <p className="text-gray-900">{getReviewUserInfo(selectedApplication)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">캠페인명</label>
                      <p className="text-gray-900">{getReviewCampaignInfo(selectedApplication)}</p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">리뷰 타입</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getReviewPlatform(selectedApplication) === 'instagram' ? 'bg-pink-100 text-pink-800' :
                        getReviewPlatform(selectedApplication) === 'blog' ? 'bg-blue-100 text-blue-800' :
                        getReviewPlatform(selectedApplication) === 'youtube' ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {getReviewPlatform(selectedApplication) === 'instagram' ? '인스타그램' :
                         getReviewPlatform(selectedApplication) === 'blog' ? '블로그' :
                         getReviewPlatform(selectedApplication) === 'youtube' ? '유튜브' : '구매평'}
                      </span>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">상태</label>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        getReviewStatus(selectedApplication) === 'submitted' ? 'bg-yellow-100 text-yellow-800' :
                        getReviewStatus(selectedApplication) === 'approved' ? 'bg-green-100 text-green-800' :
                        getReviewStatus(selectedApplication) === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {getReviewStatus(selectedApplication) === 'submitted' ? '검수 대기중' :
                         getReviewStatus(selectedApplication) === 'approved' ? '승인됨' : 
                         getReviewStatus(selectedApplication) === 'rejected' ? '거절됨' : '알 수 없음'}
                      </span>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">제출일</label>
                      <p className="text-gray-900">
                        {safeString(selectedApplication, 'submitted_at') 
                          ? new Date(safeString(selectedApplication, 'submitted_at')).toLocaleString('ko-KR')
                          : '정보 없음'
                        }
                      </p>
                    </div>
                    <div>
                      <label className="font-medium text-gray-700">검수일</label>
                      <p className="text-gray-900">
                        {safeString(selectedApplication, 'reviewed_at') 
                          ? new Date(safeString(selectedApplication, 'reviewed_at')).toLocaleString('ko-KR')
                          : '미검수'
                        }
                      </p>
                    </div>
                  </div>

                  {/* 블로그 URL */}
                  {safeString(selectedApplication, 'blog_url') && (
                    <div>
                      <label className="font-medium text-gray-700">블로그 URL</label>
                      <div className="mt-1">
                        <a 
                          href={safeString(selectedApplication, 'blog_url')} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 underline break-all"
                        >
                          {safeString(selectedApplication, 'blog_url')}
                        </a>
                      </div>
                    </div>
                  )}

                  {/* 추가 메모 */}
                  {safeString(selectedApplication, 'additional_notes') && (
                    <div>
                      <label className="font-medium text-gray-700">추가 메모</label>
                      <p className="text-gray-900 mt-1 p-3 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {safeString(selectedApplication, 'additional_notes')}
                      </p>
                    </div>
                  )}

                  {/* 리뷰 이미지 */}
                  {selectedApplication.review_images && selectedApplication.review_images.length > 0 && (
                    <div>
                      <label className="font-medium text-gray-700">리뷰 이미지 ({selectedApplication.review_images.length}장)</label>
                      <div className="mt-2 grid grid-cols-2 gap-2">
                        {selectedApplication.review_images.map((image: string, index: number) => (
                          <img 
                            key={index}
                            src={image} 
                            alt={`리뷰 이미지 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/placeholder-image.png'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 리뷰 내용이 없는 경우 안내 */}
                  {!safeString(selectedApplication, 'blog_url') && 
                   (!selectedApplication.review_images || selectedApplication.review_images.length === 0) && 
                   !safeString(selectedApplication, 'additional_notes') && (
                    <div className="text-center py-8 text-gray-500">
                      <p>리뷰 내용이 없습니다.</p>
                    </div>
                  )}


                  {/* 거절 사유 */}
                  {safeString(selectedApplication, 'rejection_reason') && (
                    <div>
                      <label className="font-medium text-gray-700">거절 사유</label>
                      <p className="text-red-600 mt-1 p-3 bg-red-50 rounded-lg">
                        {safeString(selectedApplication, 'rejection_reason')}
                      </p>
                    </div>
                  )}
                </div>
              ) : selectedApplication.experience_name ? (
                // 체험단 정보 표시
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="font-medium text-gray-700">체험단명</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.experience_name || ''}
                        onChange={(e) => setEditingData({...editingData, experience_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'experience_name', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">브랜드명</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.brand_name || ''}
                        onChange={(e) => setEditingData({...editingData, brand_name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'brand_name', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">체험단 타입</label>
                    {isEditingMetadata ? (
                      <select
                        value={editingData.experience_type || 'purchase_review'}
                        onChange={(e) => setEditingData({...editingData, experience_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="purchase_review">구매평</option>
                        <option value="product">제품 체험</option>
                        <option value="press">기자단</option>
                        <option value="local">지역 체험</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {(() => {
                          const experienceType = safeString(selectedApplication, 'experience_type', 'purchase_review')
                          const typeLabels: { [key: string]: string } = {
                            'product': '제품 체험',
                            'press': '기자단',
                            'local': '지역 체험',
                            'purchase_review': '구매평'
                          }
                          return typeLabels[experienceType] || '구매평'
                        })()}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">상태</label>
                    {isEditingMetadata ? (
                      <select
                        value={editingData.status || 'active'}
                        onChange={(e) => setEditingData({...editingData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="active">활성</option>
                        <option value="closed">마감</option>
                        <option value="preparing">준비중</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {(() => {
                          const status = safeString(selectedApplication, 'status', 'active')
                          return status === 'active' ? '활성' : status === 'closed' ? '마감' : '준비중'
                        })()}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">모집 정원</label>
                    {isEditingMetadata ? (
                      <input
                        type="number"
                        value={editingData.max_participants || ''}
                        onChange={(e) => setEditingData({...editingData, max_participants: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'max_participants', '0')}명</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">리워드 포인트</label>
                    {isEditingMetadata ? (
                      <input
                        type="number"
                        value={editingData.reward_points || ''}
                        onChange={(e) => setEditingData({...editingData, reward_points: parseInt(e.target.value) || 0})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'reward_points', '0')}P</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <label className="font-medium text-gray-700">설명</label>
                    {isEditingMetadata ? (
                      <textarea
                        value={editingData.description || ''}
                        onChange={(e) => setEditingData({...editingData, description: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'description', '설명 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">생성일</label>
                    <p className="text-gray-900">
                      {safeString(selectedApplication, 'created_at') 
                        ? new Date(safeString(selectedApplication, 'created_at')).toLocaleString('ko-KR')
                        : '정보 없음'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                // 신청 정보 표시
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-medium text-gray-700">신청자명</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.name || ''}
                        onChange={(e) => setEditingData({...editingData, name: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                  <p className="text-gray-900">{safeString(selectedApplication, 'name', '정보 없음')}</p>
                    )}
                </div>
                <div>
                  <label className="font-medium text-gray-700">이메일</label>
                    {isEditingMetadata ? (
                      <input
                        type="email"
                        value={editingData.email || ''}
                        onChange={(e) => setEditingData({...editingData, email: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                  <p className="text-gray-900">{safeString(selectedApplication, 'email', '정보 없음')}</p>
                    )}
                </div>
                <div>
                  <label className="font-medium text-gray-700">휴대폰</label>
                    {isEditingMetadata ? (
                      <input
                        type="tel"
                        value={editingData.phone || ''}
                        onChange={(e) => setEditingData({...editingData, phone: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                  <p className="text-gray-900">{safeString(selectedApplication, 'phone', '정보 없음')}</p>
                    )}
                </div>
                <div>
                  <label className="font-medium text-gray-700">상태</label>
                    {isEditingMetadata ? (
                      <select
                        value={editingData.status || 'pending'}
                        onChange={(e) => setEditingData({...editingData, status: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="pending">검토중</option>
                        <option value="approved">승인됨</option>
                        <option value="rejected">반려됨</option>
                        <option value="cancelled">신청 취소</option>
                        <option value="in_progress">진행 중</option>
                        <option value="review_submitted">리뷰 제출</option>
                        <option value="completed">완료</option>
                      </select>
                    ) : (
                  <p className="text-gray-900">{getStatusInfo(safeString(selectedApplication, 'status')).label}</p>
                    )}
                </div>
                {/* 🔥 주소 표시 추가 */}
                <div className="col-span-2">
                  <label className="font-medium text-gray-700">주소</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.address || ''}
                        onChange={(e) => setEditingData({...editingData, address: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                  <p className="text-gray-900">{safeString(selectedApplication, 'address', '주소 정보 없음')}</p>
                    )}
                </div>
                <div>
                  <label className="font-medium text-gray-700">신청일</label>
                  <p className="text-gray-900">
                    {safeString(selectedApplication, 'applied_at') || safeString(selectedApplication, 'created_at') 
                      ? new Date(safeString(selectedApplication, 'applied_at') || safeString(selectedApplication, 'created_at')).toLocaleString('ko-KR')
                      : '정보 없음'
                    }
                  </p>
                </div>
                <div>
                  <label className="font-medium text-gray-700">체험단</label>
                  <p className="text-gray-900">
                    {selectedApplication.experience 
                      ? safeString(selectedApplication.experience, 'experience_name', '정보 없음')
                      : '정보 없음'
                    }
                  </p>
                </div>
                  <div>
                    <label className="font-medium text-gray-700">참여 플랫폼</label>
                    {isEditingMetadata ? (
                      <select
                        value={editingData.platform_type || ''}
                        onChange={(e) => setEditingData({...editingData, platform_type: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">플랫폼을 선택해주세요</option>
                        <option value="instagram">인스타그램</option>
                        <option value="blog">블로그</option>
                        <option value="youtube">유튜브</option>
                        <option value="review">구매평 (네이버, 쿠팡 등)</option>
                        <option value="multiple">여러 플랫폼</option>
                      </select>
                    ) : (
                      <p className="text-gray-900">
                        {(() => {
                          const platformType = safeString(selectedApplication, 'platform_type', '')
                          const platformLabels: { [key: string]: string } = {
                            'instagram': '인스타그램',
                            'blog': '블로그',
                            'youtube': '유튜브',
                            'review': '구매평 (네이버, 쿠팡 등)',
                            'multiple': '여러 플랫폼'
                          }
                          return platformLabels[platformType] || platformType || '미선택'
                        })()}
                      </p>
                    )}
              </div>
                </div>
              )}
              
              {/* SNS 정보 섹션 */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">SNS 정보</h4>
                <div className="grid grid-cols-1 gap-4">
                <div>
                    <label className="font-medium text-gray-700">인스타그램</label>
                    {isEditingMetadata ? (
                      <input
                        type="text"
                        value={editingData.instagram_handle || ''}
                        onChange={(e) => setEditingData({...editingData, instagram_handle: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="인스타그램 계정명"
                      />
                    ) : (
                      <p className="text-gray-900">{safeString(selectedApplication, 'instagram_handle', '정보 없음')}</p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">블로그</label>
                    {isEditingMetadata ? (
                      <input
                        type="url"
                        value={editingData.blog_url || ''}
                        onChange={(e) => setEditingData({...editingData, blog_url: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="블로그 URL"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {safeString(selectedApplication, 'blog_url') ? (
                          <a 
                            href={safeString(selectedApplication, 'blog_url')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {safeString(selectedApplication, 'blog_url')}
                          </a>
                        ) : '정보 없음'}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">유튜브</label>
                    {isEditingMetadata ? (
                      <input
                        type="url"
                        value={editingData.youtube_channel || ''}
                        onChange={(e) => setEditingData({...editingData, youtube_channel: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        placeholder="유튜브 채널 URL"
                      />
                    ) : (
                      <p className="text-gray-900">
                        {safeString(selectedApplication, 'youtube_channel') ? (
                          <a 
                            href={safeString(selectedApplication, 'youtube_channel')} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            {safeString(selectedApplication, 'youtube_channel')}
                          </a>
                        ) : '정보 없음'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 신청 정보 섹션 */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-700 mb-3">신청 정보</h4>
                <div className="space-y-4">
                  <div>
                    <label className="font-medium text-gray-700">신청 사유</label>
                    {isEditingMetadata ? (
                      <textarea
                        value={editingData.application_reason || ''}
                        onChange={(e) => setEditingData({...editingData, application_reason: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="신청 사유를 입력하세요"
                      />
                    ) : (
                  <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {safeString(selectedApplication, 'application_reason', '정보 없음')}
                  </p>
                    )}
                </div>
                  <div>
                    <label className="font-medium text-gray-700">체험 계획</label>
                    {isEditingMetadata ? (
                      <textarea
                        value={editingData.experience_plan || ''}
                        onChange={(e) => setEditingData({...editingData, experience_plan: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="체험 계획을 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {safeString(selectedApplication, 'experience_plan', '정보 없음')}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="font-medium text-gray-700">추가 정보</label>
                    {isEditingMetadata ? (
                      <textarea
                        value={editingData.additional_info || ''}
                        onChange={(e) => setEditingData({...editingData, additional_info: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={3}
                        placeholder="추가 정보를 입력하세요"
                      />
                    ) : (
                      <p className="text-gray-900 bg-gray-50 p-3 rounded">
                        {safeString(selectedApplication, 'additional_info', '정보 없음')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              
              {/* 관리자 메모 섹션 */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                  <label className="font-medium text-gray-700">관리자 메모</label>
                  {!isEditingMemo && (
                    <button
                      onClick={() => {
                        setIsEditingMemo(true)
                        setMemoText(safeString(selectedApplication, 'admin_message', ''))
                      }}
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      편집
                    </button>
                  )}
                </div>
                
                {isEditingMemo ? (
                  <div className="space-y-3">
                    <textarea
                      value={memoText}
                      onChange={(e) => setMemoText(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      rows={4}
                      placeholder="관리자 메모를 입력하세요..."
                    />
                    <div className="flex space-x-2">
                      <button
                        onClick={handleMemoSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        저장
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingMemo(false)
                          setMemoText(safeString(selectedApplication, 'admin_message', ''))
                        }}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        취소
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-gray-900 bg-gray-50 p-3 rounded min-h-[60px]">
                    {safeString(selectedApplication, 'admin_message', '메모가 없습니다')}
                  </p>
                )}
              </div>
              
              {/* 편집 모드에서 저장/취소 버튼 */}
              {isEditingMetadata && (
                <div className="border-t pt-4">
                  <div className="flex space-x-3">
                    <button
                      onClick={handleMetadataSave}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setIsEditingMetadata(false)
                        setEditingData({})
                      }}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      취소
                    </button>
                  </div>
                </div>
              )}
              
              {safeString(selectedApplication, 'rejection_reason') && (
                <div>
                  <label className="font-medium text-gray-700">반려 사유</label>
                  <p className="text-red-600 bg-red-50 p-3 rounded">
                    {safeString(selectedApplication, 'rejection_reason')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 🔥 일괄 처리 모달 */}
      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">일괄 처리</h3>
                <button
                  onClick={() => setBulkModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <p className="text-gray-600">
                선택된 {selectedApplications.size}개의 신청을 일괄 처리하시겠습니까?
              </p>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleBulkApprove}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                >
                  일괄 승인
                </button>
                <button
                  onClick={() => {
                    const reason = prompt('반려 사유를 입력하세요:')
                    if (reason) {
                      handleBulkReject(reason)
                    }
                  }}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
                >
                  일괄 반려
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 통계 차트 모달 */}
      {showStatsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">통계 차트</h3>
                <button
                  onClick={() => setShowStatsModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-6">
                {/* 상태별 통계 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-4">신청 상태별 분포</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>검토 대기</span>
                      <span className="font-bold text-yellow-600">{stats.pendingApplications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>승인됨</span>
                      <span className="font-bold text-green-600">{stats.approvedApplications}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>반려됨</span>
                      <span className="font-bold text-red-600">{stats.rejectedApplications}</span>
                    </div>
                  </div>
                </div>
                
                {/* 승인률 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-bold mb-4">승인률</h4>
                  <div className="text-3xl font-bold text-blue-600">
                    {stats.totalApplications > 0 
                      ? Math.round((stats.approvedApplications / stats.totalApplications) * 100)
                      : 0
                    }%
                  </div>
                  <p className="text-sm text-gray-600">
                    총 {stats.totalApplications}건 중 {stats.approvedApplications}건 승인
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 신청 탭 */}
      {activeTab === 'point-requests' && (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">포인트 지급 신청 목록</h3>
              <div className="flex items-center space-x-4">
                <div className="text-sm text-gray-500">
                  총 {pointRequests.length}건의 신청
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    사용자
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    캠페인
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    예상 포인트
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    신청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    액션
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {pointRequests.map((request: any, index: number) => {
                  try {
                    if (!request || typeof request !== 'object') {
                      return null
                    }

                    const requestId = (request as any)._id || (request as any).id || `request-${index}`
                    const userName = safeString(request, 'name', '이름 없음')
                    const userEmail = safeString(request, 'email', '이메일 없음')
                    const experienceId = safeString(request, 'experience_id')
                    const experience = experiences.find(exp => (exp as any)._id === experienceId || (exp as any).id === experienceId)
                    const experienceName = experience ? safeString(experience, 'experience_name', '캠페인 정보 없음') : '캠페인 정보 없음'
                    const rewardPoints = experience ? safeNumber(experience, 'reward_points', 1000) : 1000
                    const requestedAt = safeString(request, 'point_requested_at') || safeString(request, 'created_at')

                    return (
                      <tr key={requestId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => {
                              setSelectedPointRequest(request)
                              setShowPointRequestDetail(true)
                            }}
                            className="text-left hover:bg-gray-50 p-2 rounded"
                          >
                            <div className="text-sm font-medium text-blue-600 hover:text-blue-800 hover:underline">
                              {userName}
                            </div>
                            <div className="text-sm text-gray-500">{userEmail}</div>
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{experienceName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-green-600">{rewardPoints}P</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {requestedAt ? new Date(requestedAt).toLocaleDateString('ko-KR') : '날짜 없음'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <button
                            onClick={() => handlePointApprovalClick(requestId)}
                            className="text-green-600 hover:text-green-900"
                            title="포인트 지급"
                          >
                            <Gift className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )
                  } catch (renderError) {
                    console.error(`포인트 신청 항목 렌더링 실패 [${index}]:`, renderError)
                    return null
                  }
                })}
              </tbody>
            </table>

            {pointRequests.length === 0 && (
              <div className="text-center py-12">
                <Gift className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">포인트 신청 없음</h3>
                <p className="mt-1 text-sm text-gray-500">
                  현재 포인트 지급 신청이 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 포인트 신청 상세 모달 */}
      {showPointRequestDetail && selectedPointRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900">포인트 지급 신청 상세</h3>
                <button
                  onClick={() => {
                    setShowPointRequestDetail(false)
                    setSelectedPointRequest(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 사용자 정보 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">사용자 정보</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    <p><strong>이름:</strong> {safeString(selectedPointRequest, 'name', '정보 없음')}</p>
                    <p><strong>이메일:</strong> {safeString(selectedPointRequest, 'email', '정보 없음')}</p>
                    <p><strong>휴대폰:</strong> {safeString(selectedPointRequest, 'phone', '정보 없음')}</p>
                    <p><strong>주소:</strong> {safeString(selectedPointRequest, 'address', '정보 없음')}</p>
                  </div>
                </div>

                {/* 캠페인 정보 */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">캠페인 정보</h4>
                  <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                    {(() => {
                      const experienceId = safeString(selectedPointRequest, 'experience_id')
                      const experience = experiences.find(exp => (exp as any)._id === experienceId || (exp as any).id === experienceId)
                      const experienceName = experience ? safeString(experience, 'experience_name', '캠페인 정보 없음') : '캠페인 정보 없음'
                      const rewardPoints = experience ? safeNumber(experience, 'reward_points', 1000) : 1000
                      
                      return (
                        <>
                          <p><strong>캠페인명:</strong> {experienceName}</p>
                          <p><strong>지급 포인트:</strong> <span className="text-green-600 font-bold">{rewardPoints}P</span></p>
                          <p><strong>신청일:</strong> {safeString(selectedPointRequest, 'applied_at') ? new Date(safeString(selectedPointRequest, 'applied_at')).toLocaleDateString('ko-KR') : '날짜 없음'}</p>
                          <p><strong>포인트 신청일:</strong> {safeString(selectedPointRequest, 'point_requested_at') ? new Date(safeString(selectedPointRequest, 'point_requested_at')).toLocaleDateString('ko-KR') : '날짜 없음'}</p>
                        </>
                      )
                    })()}
                  </div>
                </div>
              </div>

              {/* 액션 버튼 */}
              <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => {
                    setShowPointRequestDetail(false)
                    setSelectedPointRequest(null)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  닫기
                </button>
                <button
                  onClick={() => {
                    const requestId = (selectedPointRequest as any)._id || (selectedPointRequest as any).id
                    handlePointApprovalClick(requestId)
                    setShowPointRequestDetail(false)
                    setSelectedPointRequest(null)
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  포인트 지급
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 지급 확인 모달 */}
      {showPointConfirmationModal && pendingPointApproval && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">포인트 지급 확인</h3>
                <button
                  onClick={() => {
                    setShowPointConfirmationModal(false)
                    setPendingPointApproval(null)
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-6">
                {(() => {
                  const application = applications.find(app => (app as any)._id === pendingPointApproval || (app as any).id === pendingPointApproval)
                  if (!application) return null

                  const experienceId = safeString(application, 'experience_id')
                  const experience = experiences.find(exp => (exp as any)._id === experienceId || (exp as any).id === experienceId)
                  const rewardPoints = experience ? safeNumber(experience, 'reward_points', 1000) : 1000
                  const userName = safeString(application, 'name', '사용자')
                  const experienceName = experience ? safeString(experience, 'experience_name', '캠페인') : '캠페인'

                  return (
                    <div className="space-y-3">
                      <p className="text-gray-700">
                        <strong>{userName}</strong>님의 <strong>{experienceName}</strong> 캠페인에 대해
                      </p>
                      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                        <div className="flex items-center justify-center">
                          <Gift className="w-8 h-8 text-yellow-600 mr-3" />
                          <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">{rewardPoints}P</p>
                            <p className="text-sm text-gray-600">포인트를 지급하시겠습니까?</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowPointConfirmationModal(false)
                    setPendingPointApproval(null)
                  }}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  취소
                </button>
                <button
                  onClick={async () => {
                    if (pendingPointApproval) {
                      await handlePointApproval(pendingPointApproval)
                      setShowPointConfirmationModal(false)
                      setPendingPointApproval(null)
                    }
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                >
                  포인트 지급
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🔥 알림 관리 모달 */}
      {showNotificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold">알림 관리</h3>
                <button
                  onClick={() => setShowNotificationModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6">
              {notifications.length === 0 ? (
                <div className="text-center py-8">
                  <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">새로운 알림이 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notification, index) => (
                    <div key={notification._id || index} className="border-l-4 border-blue-500 pl-4 py-2">
                      <p className="font-medium">{safeString(notification, 'title', '알림')}</p>
                      <p className="text-sm text-gray-600">{safeString(notification, 'message', '내용 없음')}</p>
                      <p className="text-xs text-gray-400">
                        {safeString(notification, 'created_at') 
                          ? new Date(safeString(notification, 'created_at')).toLocaleString('ko-KR')
                          : '시간 정보 없음'
                        }
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
