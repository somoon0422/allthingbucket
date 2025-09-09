
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import { lumi } from '../lib/lumi'
import toast from 'react-hot-toast'
import { 
  Clock, CheckCircle, XCircle, AlertCircle, 
  Calendar, Tag, Star, Eye, MessageSquare,
  Filter, Search, RefreshCw, TrendingUp, Award
} from 'lucide-react'

interface ApplicationHistory {
  _id: string
  user_id: string
  experience_code: string
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
  applied_at: string
  updated_at: string
  experience_title?: string
  experience_brand?: string
  point_reward?: number
  review_submitted?: boolean
  completion_date?: string
  cancellation_reason?: string
}

const InfluencerProfile: React.FC = () => {
  const { user } = useAuth()
  const { } = useExperiences()
  const [applications, setApplications] = useState<ApplicationHistory[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    completed: 0,
    cancelled: 0
  })

  useEffect(() => {
    if (user) {
      loadApplicationHistory()
    }
  }, [user])

  const loadApplicationHistory = async () => {
    if (!user) return

    try {
      setLoading(true)
      console.log('🔍 체험단 히스토리 조회 시작:', user.user_id)

      // 사용자 신청 내역 조회
      const { list: applicationList } = await lumi.entities.user_applications.list()
      const userApplications = applicationList?.filter(app => app.user_id === user.user_id) || []

      // 체험단 정보와 매칭
      const { list: experienceList } = await lumi.entities.experience_codes.list()
      const experienceMap = new Map()
      experienceList?.forEach(exp => {
        experienceMap.set(exp.experience_code, exp)
      })

      // 히스토리 데이터 구성
      const historyData: ApplicationHistory[] = userApplications.map(app => {
        const experience = experienceMap.get(app.experience_code)
        return {
          ...app,
          experience_title: experience?.title || '체험단 정보 없음',
          experience_brand: experience?.brand || '브랜드 정보 없음',
          point_reward: experience?.point_reward || 0
        } as unknown as ApplicationHistory
      })

      // 최신 순으로 정렬
      historyData.sort((a, b) => new Date(b.applied_at || b.updated_at).getTime() - new Date(a.applied_at || a.updated_at).getTime())

      setApplications(historyData)

      // 통계 계산
      const newStats = {
        total: historyData.length,
        pending: historyData.filter(app => app.status === 'pending').length,
        approved: historyData.filter(app => app.status === 'approved').length,
        completed: historyData.filter(app => app.status === 'completed').length,
        cancelled: historyData.filter(app => app.status === 'cancelled').length
      }
      setStats(newStats)

      console.log('✅ 체험단 히스토리 로드 완료:', historyData.length, '건')
    } catch (error) {
      console.error('❌ 체험단 히스토리 조회 실패:', error)
      toast.error('체험단 히스토리를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 체험단 신청 철회
  const cancelApplication = async (applicationId: string, experienceTitle: string) => {
    if (!confirm(`"${experienceTitle}" 체험단 신청을 철회하시겠습니까?`)) {
      return
    }

    try {
      await lumi.entities.user_applications.update(applicationId, {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
        cancellation_reason: '사용자 철회'
      })

      toast.success('체험단 신청이 철회되었습니다')
      loadApplicationHistory() // 목록 새로고침

      // 🔔 관리자 알림 (간단한 로깅)
      try {
        await lumi.entities.admin_notifications?.create({
          type: 'application_cancelled',
          title: '체험단 신청 철회',
          message: `${user?.name || '사용자'}님이 "${experienceTitle}" 체험단 신청을 철회했습니다.`,
          user_id: user?.user_id,
          experience_title: experienceTitle,
          created_at: new Date().toISOString(),
          is_read: false
        })
      } catch (notificationError) {
        console.log('알림 저장 실패 (무시):', notificationError)
      }

    } catch (error) {
      console.error('신청 철회 실패:', error)
      toast.error('신청 철회에 실패했습니다')
    }
  }

  // 필터링된 애플리케이션
  const filteredApplications = applications.filter(app => {
    const matchesFilter = filter === 'all' || app.status === filter
    const matchesSearch = searchTerm === '' || 
      app.experience_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.experience_brand?.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesFilter && matchesSearch
  })

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />
      case 'approved': return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'completed': return <Award className="w-4 h-4 text-blue-500" />
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />
      case 'rejected': return <AlertCircle className="w-4 h-4 text-red-500" />
      default: return <Clock className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '대기중'
      case 'approved': return '승인됨'
      case 'completed': return '완료'
      case 'cancelled': return '철회됨'
      case 'rejected': return '반려됨'
      default: return '알 수 없음'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'completed': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">체험단 히스토리를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">체험단 활동 히스토리</h1>
        <p className="text-gray-600">
          신청한 체험단의 상태와 진행 상황을 확인하세요
        </p>
      </div>

      {/* 🔹 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <TrendingUp className="w-6 h-6 text-purple-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-purple-600">{stats.total}</p>
          <p className="text-sm text-gray-600">총 신청</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <Clock className="w-6 h-6 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-sm text-gray-600">대기중</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <CheckCircle className="w-6 h-6 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
          <p className="text-sm text-gray-600">승인됨</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <Award className="w-6 h-6 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-600">{stats.completed}</p>
          <p className="text-sm text-gray-600">완료</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <XCircle className="w-6 h-6 text-red-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-red-600">{stats.cancelled}</p>
          <p className="text-sm text-gray-600">철회/반려</p>
        </div>
      </div>

      {/* 🔹 필터 및 검색 */}
      <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <Filter className="w-5 h-5 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">모든 상태</option>
              <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
              <option value="completed">완료</option>
              <option value="cancelled">철회/반려</option>
            </select>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="체험단 또는 브랜드 검색..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>

            <button
              onClick={loadApplicationHistory}
              className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* 🔹 히스토리 목록 */}
      <div className="space-y-4">
        {filteredApplications.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border p-8 text-center">
            <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? '신청한 체험단이 없습니다' : `${getStatusText(filter)} 체험단이 없습니다`}
            </h3>
            <p className="text-gray-500">체험단에 신청하여 활동을 시작해보세요!</p>
          </div>
        ) : (
          filteredApplications.map((app) => (
            <div key={app._id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-3">
                    {getStatusIcon(app.status)}
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(app.status)}`}>
                      {getStatusText(app.status)}
                    </span>
                    <span className="text-sm text-gray-500">
                      {new Date(app.applied_at).toLocaleDateString('ko-KR')}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {app.experience_title}
                  </h3>

                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                    <div className="flex items-center space-x-1">
                      <Tag className="w-4 h-4" />
                      <span>{app.experience_brand}</span>
                    </div>
                    {(app.point_reward || 0) > 0 && (
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{(app.point_reward || 0).toLocaleString()}P</span>
                      </div>
                    )}
                  </div>

                  {app.completion_date && (
                    <p className="text-sm text-green-600 mb-2">
                      <Calendar className="w-4 h-4 inline mr-1" />
                      완료일: {new Date(app.completion_date).toLocaleDateString('ko-KR')}
                    </p>
                  )}

                  {app.cancellation_reason && (
                    <p className="text-sm text-red-600 mb-2">
                      철회 사유: {app.cancellation_reason}
                    </p>
                  )}

                  <p className="text-xs text-gray-500">
                    최종 업데이트: {new Date(app.updated_at).toLocaleString('ko-KR')}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  {app.status === 'pending' && (
                    <button
                      onClick={() => cancelApplication(app._id, app.experience_title || '')}
                      className="flex items-center space-x-1 px-3 py-1 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span className="text-sm">철회</span>
                    </button>
                  )}

                  {app.status === 'approved' && !app.review_submitted && (
                    <button
                      className="flex items-center space-x-1 px-3 py-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="text-sm">상세보기</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default InfluencerProfile
