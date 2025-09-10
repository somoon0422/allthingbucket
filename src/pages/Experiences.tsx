
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
// useExperiences 제거됨 - 사용하지 않음
import ApplicationFormModal from '../components/ApplicationFormModal'
// MongoDB API 사용
import { dataService } from '../lib/dataService'
import {Gift, Calendar, MapPin, Users, Filter, Search, Coins, Eye} from 'lucide-react'
import toast from 'react-hot-toast'
import { ultraSafeArray, safeString, safeNumber } from '../utils/arrayUtils'

const Experiences: React.FC = () => {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  // checkDuplicateApplication 제거됨 - 사용하지 않음
  
  const [experiences, setExperiences] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedExperience, setSelectedExperience] = useState<any>(null)
  const [showApplicationModal, setShowApplicationModal] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  // applicationStatuses 제거됨 - 사용하지 않음

  // 🔥 체험단 목록 로드 - dataService.campaigns.list 사용
  const loadExperiences = async () => {
    try {
      setLoading(true)
      console.log('🔥 체험단 로딩 시작 (dataService.campaigns.list)...')
      console.log('🔥 dataService 객체 확인:', dataService)
      console.log('🔥 dataService.entities 확인:', dataService.entities)
      console.log('🔥 dataService.entities.campaigns 확인:', dataService.entities.campaigns)
      
      // dataService.campaigns.list를 통해 MongoDB 데이터 로드
      console.log('🔥 dataService.entities.campaigns.list() 호출 시작...')
      const campaigns = await dataService.entities.campaigns.list()
      console.log('✅ MongoDB 캠페인 데이터 성공:', campaigns)
      console.log('✅ 캠페인 데이터 타입:', typeof campaigns)
      console.log('✅ 캠페인 데이터 길이:', campaigns?.length)
      
      const safeExperiences = ultraSafeArray(campaigns)
      console.log('✅ 안전한 체험단 데이터:', safeExperiences)
      setExperiences(safeExperiences)
    } catch (error) {
      console.error('❌ 체험단 로드 실패:', error)
      console.error('❌ 에러 타입:', typeof error)
      if (error instanceof Error) {
        console.error('❌ 에러 메시지:', error.message)
        console.error('❌ 에러 스택:', error.stack)
      }
      toast.error('체험단 목록을 불러오는데 실패했습니다')
      setExperiences([])
    } finally {
      setLoading(false)
    }
  }

  // checkApplicationStatuses 함수 제거됨 - 사용하지 않음

  useEffect(() => {
    loadExperiences()
  }, [isAuthenticated, user?.user_id])

  // 🔥 필터링된 체험단 목록 - MongoDB + Lumi 데이터 지원
  const filteredExperiences = React.useMemo(() => {
    try {
      // Lumi SDK 데이터 사용
      let dataToFilter = ultraSafeArray(experiences)
      
      if (!Array.isArray(dataToFilter) || dataToFilter.length === 0) {
        return []
      }

      return dataToFilter.filter((experience) => {
        try {
          if (!experience || typeof experience !== 'object') {
            return false
          }

          // MongoDB 데이터와 Lumi 데이터 필드명 통합 처리
          const experienceName = safeString(experience, 'title') || safeString(experience, 'campaign_name') || safeString(experience, 'experience_name')
          const brandName = safeString(experience, 'brand') || safeString(experience, 'brand_name')
          const description = safeString(experience, 'description')
          const status = safeString(experience, 'status') || safeString(experience, 'campaign_status', 'recruiting')

          // 검색어 필터링
          if (searchTerm) {
            const searchLower = searchTerm.toLowerCase()
            
            if (!experienceName.toLowerCase().includes(searchLower) && 
                !brandName.toLowerCase().includes(searchLower) && 
                !description.toLowerCase().includes(searchLower)) {
              return false
            }
          }

          // 캠페인 상태 체크 (종료된 캠페인은 항상 제외)
          const campaignStatus = safeString(experience, 'campaign_status', 'recruiting')
          if (campaignStatus === 'campaign_ended') {
            return false
          }

          // 상태 필터링
          if (filterStatus !== 'all') {
            if (status !== filterStatus) {
              return false
            }
          }

          return true
        } catch {
          return false
        }
      })
    } catch (error) {
      console.error('필터링 실패:', error)
      return []
    }
  }, [experiences, searchTerm, filterStatus])

  const handleApply = (experience: any) => {
    try {
      if (!experience || typeof experience !== 'object') {
        toast.error('체험단 정보를 불러올 수 없습니다')
        return
      }

      if (!isAuthenticated) {
        toast.error('로그인이 필요합니다')
        return
      }

      // 중복 신청 체크는 신청 모달에서 처리

      setSelectedExperience(experience)
      setShowApplicationModal(true)
    } catch (error) {
      console.error('신청 모달 열기 실패:', error)
      toast.error('신청 페이지를 열 수 없습니다')
    }
  }

  const handleViewDetail = (experience: any) => {
    try {
      const experienceId = experience._id || experience.id
      if (experienceId) {
        navigate(`/experiences/${experienceId}`)
      } else {
        toast.error('체험단 ID를 찾을 수 없습니다')
      }
    } catch (error) {
      console.error('상세페이지 이동 실패:', error)
      toast.error('상세페이지로 이동할 수 없습니다')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'recruiting':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">모집중</span>
      case 'in_progress':
        return <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">진행중</span>
      case 'completed':
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">완료</span>
      case 'cancelled':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">취소</span>
      case 'review':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">리뷰중</span>
      // 기존 상태값들도 지원
      case 'active':
        return <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">모집중</span>
      case 'closed':
        return <span className="bg-red-100 text-red-800 text-xs font-medium px-2.5 py-0.5 rounded">마감</span>
      case 'pending':
        return <span className="bg-yellow-100 text-yellow-800 text-xs font-medium px-2.5 py-0.5 rounded">준비중</span>
      default:
        return <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded">알 수 없음</span>
    }
  }

  // getApplicationStatusBadge 함수 제거됨 - 사용하지 않음

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">체험단 목록을 불러오는 중...</p>
          <p className="text-sm text-gray-500 mt-2">MongoDB에서 데이터를 로드하고 있습니다</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">체험단 모집</h1>
          <p className="mt-2 text-gray-600">
            다양한 브랜드의 체험단에 참여하고 리워드를 받아보세요
          </p>
        </div>

        {/* 검색 및 필터 */}
        <div className="mb-8 flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="체험단명, 브랜드명으로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
            >
              <option value="all">전체 상태</option>
              <option value="recruiting">모집중</option>
              <option value="in_progress">진행중</option>
              <option value="completed">완료</option>
              <option value="cancelled">취소</option>
              <option value="review">리뷰중</option>
              {/* 기존 상태값들도 지원 */}
              <option value="active">모집중 (기존)</option>
              <option value="closed">마감</option>
              <option value="pending">준비중</option>
            </select>
          </div>
        </div>

        {/* 체험단 목록 */}
        {!Array.isArray(filteredExperiences) || filteredExperiences.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Gift className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              {searchTerm || filterStatus !== 'all' ? '검색 결과가 없습니다' : '등록된 체험단이 없습니다'}
            </h3>
            <p className="text-gray-600">
              {searchTerm || filterStatus !== 'all' ? '다른 검색어나 필터를 시도해보세요' : '곧 새로운 체험단이 등록될 예정입니다'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredExperiences.map((experience, index) => {
              try {
                if (!experience || typeof experience !== 'object') {
                  return null
                }

                const experienceId = (experience as any).campaign_id || (experience as any)._id || (experience as any).id || `exp-${index}`
                const experienceName = safeString(experience, 'title') || safeString(experience, 'campaign_name') || safeString(experience, 'experience_name', '체험단명 없음')
                const brandName = safeString(experience, 'brand') || safeString(experience, 'brand_name', '브랜드명 없음')
                const description = safeString(experience, 'description', '설명 없음')
                const status = safeString(experience, 'status') || safeString(experience, 'campaign_status', 'recruiting')
                const rewardPoints = safeNumber(experience, 'points_reward', 0) || safeNumber(experience, 'reward_points', 0)
                const applicationDeadline = safeString(experience, 'application_deadline') || safeString(experience, 'end_date')
                const experienceLocation = safeString(experience, 'experience_location')
                const maxParticipants = safeNumber(experience, 'recruitment_count', 0) || safeNumber(experience, 'max_participants', 0)
                const imageUrl = safeString(experience, 'image_url')

                const isApplied = false // 신청 상태는 모달에서 처리

                return (
                  <div
                    key={experienceId}
                    className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
                  >
                    {/* 이미지 */}
                    <div className="h-48 bg-gray-200 overflow-hidden relative">
                      <img
                        src={imageUrl || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'}
                        alt={experienceName}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.src = 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg'
                        }}
                      />
                      
                      {/* 신청 상태 표시 제거됨 */}
                    </div>

                    <div className="p-6">
                      {/* 상태 배지 */}
                      <div className="flex justify-between items-start mb-3">
                        {getStatusBadge(status)}
                        {rewardPoints > 0 && (
                          <div className="flex items-center text-blue-600">
                            <Coins className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{rewardPoints}P</span>
                          </div>
                        )}
                      </div>

                      {/* 체험단 정보 */}
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                        {experienceName}
                      </h3>
                      
                      <p className="text-blue-600 font-medium mb-2">{brandName}</p>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {description}
                      </p>

                      {/* 메타 정보 */}
                      <div className="space-y-2 mb-4">
                        {applicationDeadline && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="w-4 h-4 mr-2" />
                            <span>마감: {new Date(applicationDeadline).toLocaleDateString('ko-KR')}</span>
                          </div>
                        )}
                        
                        {experienceLocation && (
                          <div className="flex items-center text-sm text-gray-500">
                            <MapPin className="w-4 h-4 mr-2" />
                            <span>{experienceLocation}</span>
                          </div>
                        )}
                        
                        {maxParticipants > 0 && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Users className="w-4 h-4 mr-2" />
                            <span>모집인원: {maxParticipants}명</span>
                          </div>
                        )}
                      </div>

                      {/* 버튼들 */}
                      <div className="flex space-x-2">
                        {/* 상세보기 버튼 */}
                        <button
                          onClick={() => handleViewDetail(experience)}
                          className="flex-1 flex items-center justify-center space-x-2 py-2 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                          <span>상세보기</span>
                        </button>

                        {/* 신청 버튼 */}
                        <button
                          onClick={() => handleApply(experience)}
                          disabled={!['recruiting', 'active'].includes(status) || isApplied}
                          className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                            isApplied
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : ['recruiting', 'active'].includes(status)
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          {isApplied ? '신청완료' :
                           ['recruiting', 'active'].includes(status) ? '신청하기' : 
                           status === 'closed' || status === 'cancelled' ? '마감됨' : 
                           status === 'completed' ? '완료됨' :
                           status === 'in_progress' ? '진행중' :
                           status === 'review' ? '리뷰중' : '준비중'}
                        </button>
                      </div>
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
      </div>

      {/* 신청 모달 */}
      {showApplicationModal && selectedExperience && (
        <ApplicationFormModal
          isOpen={showApplicationModal}
          onClose={() => {
            setShowApplicationModal(false)
            setSelectedExperience(null)
          }}
          experience={selectedExperience}
          onSuccess={() => {
            setShowApplicationModal(false)
            setSelectedExperience(null)
            // 🔥 신청 후 상태 새로고침
            loadExperiences()
            toast.success('체험단 신청이 완료되었습니다!')
          }}
        />
      )}
    </div>
  )
}

export default Experiences
