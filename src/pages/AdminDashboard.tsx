import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'
import ApprovalModal from '../components/ApprovalModal'
import RejectionModal from '../components/RejectionModal'
import CampaignCreationModal from '../components/CampaignCreationModal'
import CampaignEditModal from '../components/CampaignEditModal'
import {CheckCircle, XCircle, Clock, Home, RefreshCw, FileText, UserCheck, Gift, Plus, Trash2, Edit3, X, AlertTriangle} from 'lucide-react'
import toast from 'react-hot-toast'

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
  
  // 선택 상태들
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  
  // 필터링 상태들
  const [applicationFilter, setApplicationFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  const [reviewFilter, setReviewFilter] = useState('all')
  
  // 검색 상태들
  const [applicationSearch, setApplicationSearch] = useState('')
  const [experienceSearch, setExperienceSearch] = useState('')
  const [reviewSearch, setReviewSearch] = useState('')
  
  // 로딩 상태들
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

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
      
      // 각 신청에 사용자 정보와 캠페인 정보 추가
      const enrichedApplications = await Promise.all(
        (applicationsData || []).map(async (app: any) => {
          try {
            let userInfo = null
            let campaignInfo = null
            
            // 사용자 정보 로드
            if (app.user_id) {
              try {
                const userData = await (dataService.entities as any).users.get(app.user_id)
                userInfo = userData
              } catch (userError) {
                console.warn('사용자 정보 로드 실패:', app.user_id, userError)
              }
            }
            
            // 캠페인 정보 로드
            if (app.campaign_id) {
              try {
                const campaignData = await (dataService.entities as any).campaigns.get(app.campaign_id)
                campaignInfo = campaignData
              } catch (campaignError) {
                console.warn('캠페인 정보 로드 실패:', app.campaign_id, campaignError)
              }
            }
            
            // application_data에서 기본 정보 추출
            const appData = app.application_data || {}
            
            return {
              ...app,
              // 사용자 정보 매핑 (application_data 우선, 그 다음 userInfo, 마지막으로 app 필드)
              name: appData.name || userInfo?.name || userInfo?.user_name || app.name || '이름 없음',
              email: appData.email || userInfo?.email || userInfo?.user_email || app.email || '이메일 없음',
              phone: appData.phone || userInfo?.phone || userInfo?.user_phone || app.phone || '',
                   // 캠페인 정보 매핑
                   campaign_name: campaignInfo?.campaign_name || campaignInfo?.product_name || campaignInfo?.name || '캠페인명 없음',
                   campaign_description: campaignInfo?.description || '',
                   experience_name: campaignInfo?.campaign_name || campaignInfo?.product_name || '체험단 정보 없음',
              // 원본 데이터 보존
              userInfo,
              campaignInfo,
              application_data: appData
            }
          } catch (error) {
            console.warn('신청 정보 처리 실패:', app.id, error)
            return {
              ...app,
              name: app.name || '이름 없음',
              email: app.email || '이메일 없음',
              phone: app.phone || '',
              campaign_name: '캠페인명 없음',
              campaign_description: '',
              userInfo: null,
              campaignInfo: null,
              application_data: app.application_data || {}
            }
          }
        })
      )
      
      setApplications(enrichedApplications)
    } catch (error) {
      console.error('신청 내역 로드 실패:', error)
      setApplications([])
    }
  }

  const loadExperiences = async () => {
    try {
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


  // 전체 데이터 로드
  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadApplications(),
        loadExperiences()
      ])
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

  // 일괄 처리 함수들
  const handleBulkApprove = async () => {
    try {
      if (selectedApplications.size === 0) {
        toast.error('승인할 신청을 선택해주세요')
        return
      }

      setBulkActionLoading(true)
      
      for (const applicationId of selectedApplications) {
        await (dataService.entities as any).user_applications.update(applicationId, {
          status: 'approved',
          reviewed_at: new Date().toISOString()
        })
      }

      toast.success(`${selectedApplications.size}개의 신청이 승인되었습니다`)
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

  // 필터링된 데이터
  const filteredApplications = applications.filter(app => {
    if (applicationFilter !== 'all' && app.status !== applicationFilter) return false
    if (applicationSearch && !app.name?.toLowerCase().includes(applicationSearch.toLowerCase())) return false
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
    rejectedApplications: applications.filter(app => app.status === 'rejected').length,
    totalExperiences: experiences.length
  }

  useEffect(() => {
    if (isAuthenticated && isAdminUser()) {
      loadAllData()
        } else {
      navigate('/')
    }
  }, [isAuthenticated, isAdminUser, navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">관리자 대시보드를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">관리자 대시보드</h1>
              <p className="text-gray-600 mt-1">올띵버킷 체험단 관리 시스템</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                새로고침
              </button>
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                <Home className="w-4 h-4" />
                홈으로
              </button>
            </div>
          </div>
          </div>
        </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
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

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">대기중</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pendingApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserCheck className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">승인됨</p>
                <p className="text-2xl font-bold text-gray-900">{stats.approvedApplications}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Gift className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">총 체험단</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalExperiences}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Applications Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">신청 관리</h2>
              <div className="flex gap-2">
          <button
                  onClick={handleBulkApprove}
                  disabled={selectedApplications.size === 0 || bulkActionLoading}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
          >
                  <CheckCircle className="w-4 h-4" />
                  일괄 승인
          </button>
          <button
                  onClick={() => setShowRejectionModal(true)}
                  disabled={selectedApplications.size === 0}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  <XCircle className="w-4 h-4" />
                  일괄 거절
          </button>
        </div>
            </div>
            </div>
            
          <div className="p-6">
            <div className="flex gap-4 mb-4">
            <select
                value={applicationFilter}
                onChange={(e) => setApplicationFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="all">전체</option>
                <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
                <option value="rejected">거절됨</option>
            </select>
              <input
                type="text"
                placeholder="신청자 검색..."
                value={applicationSearch}
                onChange={(e) => setApplicationSearch(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
              />
        </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                        className="rounded border-gray-300"
                        />
                      </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청자</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">체험단</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">신청일</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">액션</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((application) => (
                    <tr key={application.id} className="hover:bg-gray-50">
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
                          className="rounded border-gray-300"
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
                          <div className="text-xs text-blue-600 mt-1">클릭하여 상세보기</div>
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
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                          application.status === 'approved' ? 'bg-green-100 text-green-800' :
                          application.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {application.status === 'approved' ? '승인됨' :
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
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(application)
                                      setShowApprovalModal(true)
                                    }}
                                    className="text-green-600 hover:text-green-900"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setSelectedApplication(application)
                                      setShowRejectionModal(true)
                                    }}
                                    className="text-red-600 hover:text-red-900"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </button>
                        </div>
                            </td>
                          </tr>
                  ))}
                  </tbody>
                </table>
              </div>
          </div>
            </div>
            
        {/* Experiences Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">체험단 관리</h2>
              <button
                onClick={() => setShowCampaignModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
                새 체험단
              </button>
                </div>
            </div>
            
          <div className="p-6">
            <div className="flex gap-4 mb-4">
                  <select
                value={experienceFilter}
                onChange={(e) => setExperienceFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg"
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
                className="px-3 py-2 border border-gray-300 rounded-lg flex-1"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
                      return { label: '모집중', color: 'bg-green-100 text-green-800' }
                    case 'closed':
                    case 'completed':
                      return { label: '마감', color: 'bg-red-100 text-red-800' }
                    case 'pending':
                      return { label: '준비중', color: 'bg-yellow-100 text-yellow-800' }
                    case 'cancelled':
                      return { label: '취소', color: 'bg-gray-100 text-gray-800' }
                    default:
                      return { label: '알 수 없음', color: 'bg-gray-100 text-gray-800' }
                  }
                }
                
                const statusInfo = getStatusInfo(experience.status || experience.campaign_status || 'active')
                
                return (
                  <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-2">
                      {displayName}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {experience.description || '설명이 없습니다.'}
                    </p>
                    <div className="flex justify-between items-center">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.color}`}>
                        {statusInfo.label}
                      </span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setSelectedCampaign(experience)
                            setShowEditModal(true)
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteExperience(experience.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
                </div>
              </div>
            </div>

        {/* 리뷰 검수 관리 Section */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">리뷰 검수 관리</h2>
            </div>
          </div>
          
          <div className="p-6">
            <div className="flex gap-4 mb-4">
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
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      리뷰 검수 기능은 준비 중입니다.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

      {/* Modals */}
      {showApprovalModal && (
        <ApprovalModal
          isOpen={showApprovalModal}
          application={selectedApplication}
          onClose={() => setShowApprovalModal(false)}
          onApprovalComplete={async () => {
            if (selectedApplication) {
              await (dataService.entities as any).user_applications.update(selectedApplication.id, {
                status: 'approved',
                reviewed_at: new Date().toISOString()
              })
              toast.success('신청이 승인되었습니다')
              await loadApplications()
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
          onRejectionComplete={async () => {
            if (selectedApplication) {
              await (dataService.entities as any).user_applications.update(selectedApplication.id, {
                status: 'rejected',
                reviewed_at: new Date().toISOString()
              })
              toast.success('신청이 거절되었습니다')
              await loadApplications()
            }
            setShowRejectionModal(false)
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
                        selectedApplication.status === 'rejected' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {selectedApplication.status === 'approved' ? '승인됨' :
                         selectedApplication.status === 'rejected' ? '거절됨' : '대기중'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">캠페인:</span>
                      <span className="ml-2 font-medium">{selectedApplication.campaign_name}</span>
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

                  </div>
  )
}

export default AdminDashboard
