import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'
import ApprovalModal from '../components/ApprovalModal'
import RejectionModal from '../components/RejectionModal'
import CampaignCreationModal from '../components/CampaignCreationModal'
import CampaignEditModal from '../components/CampaignEditModal'
import {CheckCircle, XCircle, Clock, Home, RefreshCw, FileText, UserCheck, Gift, Plus, Trash2, Edit3} from 'lucide-react'
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
  const [showApprovalModal, setShowApprovalModal] = useState(false)
  const [showRejectionModal, setShowRejectionModal] = useState(false)
  const [showCampaignModal, setShowCampaignModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  // 선택 상태들
  const [selectedApplications, setSelectedApplications] = useState<Set<string>>(new Set())
  
  // 필터링 상태들
  const [applicationFilter, setApplicationFilter] = useState('all')
  const [experienceFilter, setExperienceFilter] = useState('all')
  
  // 검색 상태들
  const [applicationSearch, setApplicationSearch] = useState('')
  const [experienceSearch, setExperienceSearch] = useState('')
  
  // 로딩 상태들
  const [bulkActionLoading, setBulkActionLoading] = useState(false)

  // 데이터 로드 함수들
  const loadApplications = async () => {
    try {
      const applicationsData = await dataService.entities.user_applications.list()
      setApplications(applicationsData || [])
    } catch (error) {
      console.error('신청 내역 로드 실패:', error)
      setApplications([])
    }
  }

  const loadExperiences = async () => {
    try {
      const experiencesData = await dataService.entities.campaigns.list()
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
        await dataService.entities.user_applications.update(applicationId, {
          status: 'approved',
          approved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
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
      await dataService.entities.campaigns.delete(experienceId)
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
    if (experienceFilter !== 'all' && exp.status !== experienceFilter) return false
    if (experienceSearch && !exp.title?.toLowerCase().includes(experienceSearch.toLowerCase())) return false
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
                              <div>
                          <div className="text-sm font-medium text-gray-900">{application.name}</div>
                          <div className="text-sm text-gray-500">{application.email}</div>
                              </div>
                            </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {application.experience_id}
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
                        {new Date(application.created_at).toLocaleDateString()}
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
              {filteredExperiences.map((experience) => (
                <div key={experience.id} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-2">{experience.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{experience.description}</p>
                  <div className="flex justify-between items-center">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      experience.status === 'recruiting' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {experience.status === 'recruiting' ? '모집중' : '마감'}
                              </span>
                    <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setSelectedApplication(experience)
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
              ))}
                    </div>
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
              await dataService.entities.user_applications.update(selectedApplication.id, {
                status: 'approved',
                approved_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
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
              await dataService.entities.user_applications.update(selectedApplication.id, {
                status: 'rejected',
                rejected_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
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
          campaign={selectedApplication}
          onClose={() => setShowEditModal(false)}
          onSuccess={async () => {
            toast.success('체험단이 수정되었습니다')
            await loadExperiences()
            setShowEditModal(false)
          }}
        />
      )}
                </div>
  )
}

export default AdminDashboard
