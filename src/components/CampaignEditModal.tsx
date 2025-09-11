import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import ImageUploadManager from './ImageUploadManager'
import {X, Calendar, MapPin, Users, Coins, Clock, FileText, Phone, Mail, Image, Code} from 'lucide-react'
import toast from 'react-hot-toast'

interface CampaignEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  campaign: any
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

// 🔥 안전한 배열 추출
function safeArray(obj: any, field: string): string[] {
  try {
    if (!obj || typeof obj !== 'object') return []
    const value = obj[field]
    if (Array.isArray(value)) {
      return value.filter(item => typeof item === 'string')
    }
    return []
  } catch {
    return []
  }
}

const CampaignEditModal: React.FC<CampaignEditModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  campaign
}) => {
  const [loading, setLoading] = useState(false)
  const [mainImages, setMainImages] = useState<string[]>([])
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [htmlContent, setHtmlContent] = useState('')
  
  // 🔥 D-Day 계산 함수
  const getDeadlineDisplay = (deadline: string) => {
    if (!deadline) return '마감일 미정'
    
    try {
      const deadlineDate = new Date(deadline)
      const today = new Date()
      today.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
      deadlineDate.setHours(0, 0, 0, 0) // 시간을 00:00:00으로 설정
      
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
  
  const [formData, setFormData] = useState({
    experience_name: '',
    brand_name: '',
    description: '',
    experience_type: 'purchase_review',
    reward_points: '',
    experience_location: '',
    max_participants: '30',
    experience_period: '',
    requirements: '',
    additional_info: '',
    status: 'active',
    // 캠페인 일정 정보
    application_start_date: '',
    application_end_date: '',
    content_start_date: '',
    content_end_date: '',
    current_applicants: 0
  })

  // 🔥 캠페인 데이터로 폼 초기화
  useEffect(() => {
    if (campaign && isOpen) {
      console.log('📝 캠페인 편집 데이터 로드:', campaign)
      console.log('📝 캠페인 필드별 데이터:', {
        campaign_name: campaign.campaign_name,
        description: campaign.description,
        brand_name: campaign.brand_name,
        product_name: campaign.product_name,
        allFields: Object.keys(campaign)
      })
      
      // 날짜 형식 변환 함수
      const formatDateForInput = (dateString: string) => {
        if (!dateString) return ''
        try {
          const date = new Date(dateString)
          return date.toISOString().split('T')[0]
        } catch {
          return ''
        }
      }

      setFormData({
        experience_name: safeString(campaign, 'campaign_name', ''),
        brand_name: safeString(campaign, 'brand_name', ''),
        description: safeString(campaign, 'description', ''),
        experience_type: safeString(campaign, 'type', 'purchase_review'),
        reward_points: safeNumber(campaign, 'rewards', 0).toString().replace('P', ''),
        experience_location: safeString(campaign, 'experience_location', ''),
        max_participants: safeNumber(campaign, 'max_participants', 30).toString(),
        experience_period: safeString(campaign, 'experience_period', ''),
        requirements: safeString(campaign, 'requirements', ''),
        additional_info: safeString(campaign, 'additional_info', ''),
        status: safeString(campaign, 'status', 'active'),
        // 캠페인 일정 정보
        application_start_date: formatDateForInput(safeString(campaign, 'application_start')),
        application_end_date: formatDateForInput(safeString(campaign, 'application_end')),
        content_start_date: formatDateForInput(safeString(campaign, 'content_start')),
        content_end_date: formatDateForInput(safeString(campaign, 'content_end')),
        current_applicants: safeNumber(campaign, 'current_participants', 0)
      })
      
      console.log('📝 폼 데이터 설정 완료:', {
        experience_name: safeString(campaign, 'campaign_name', ''),
        brand_name: safeString(campaign, 'brand_name', ''),
        description: safeString(campaign, 'description', ''),
        product_name: safeString(campaign, 'product_name', ''),
        campaign_name: safeString(campaign, 'campaign_name', '')
      })

      // 이미지 데이터 로드 - 호환성 개선
      const mainImagesData = safeArray(campaign, 'main_images')
      const detailImagesData = safeArray(campaign, 'detail_images')
      
      // 🔥 모든 가능한 이미지 필드 확인
      const allImageFields = Object.keys(campaign || {}).filter(key => 
        key.includes('image') || key.includes('photo') || key.includes('picture') || key.includes('img')
      )
      
      // 🔥 호환성을 위한 추가 이미지 필드 확인
      const fallbackMainImage = safeString(campaign, 'main_image_url') || 
                               safeString(campaign, 'image_url') || 
                               safeString(campaign, 'main_image') ||
                               safeString(campaign, 'thumbnail') ||
                               safeString(campaign, 'banner_image')
      
      const displayMainImages = mainImagesData.length > 0 ? mainImagesData : (fallbackMainImage ? [fallbackMainImage] : [])
      
      console.log('🖼️ 캠페인 이미지 데이터 상세:', {
        mainImagesData,
        detailImagesData,
        fallbackMainImage,
        displayMainImages,
        allImageFields,
        campaignAllFields: Object.keys(campaign || {}),
        campaignData: campaign,
        mainImagesType: typeof mainImagesData,
        detailImagesType: typeof detailImagesData,
        mainImagesIsArray: Array.isArray(mainImagesData),
        detailImagesIsArray: Array.isArray(detailImagesData),
        rawMainImages: campaign?.main_images,
        rawDetailImages: campaign?.detail_images
      })
      
      // 🔥 이미지 데이터 강제 설정 (빈 배열이어도 명시적으로 설정)
      console.log('🖼️ 이미지 상태 설정:', {
        displayMainImages,
        detailImagesData,
        mainImagesLength: displayMainImages?.length || 0,
        detailImagesLength: detailImagesData?.length || 0
      })
      
      setMainImages(displayMainImages || [])
      setDetailImages(detailImagesData || [])
      setHtmlContent(safeString(campaign, 'html_content', ''))
    }
  }, [campaign, isOpen])

  // 🔥 메인 이미지 변경 처리
  const handleMainImagesChange = (images: string[]) => {
    setMainImages(images)
  }

  // 🔥 상세 이미지 변경 처리
  const handleDetailImagesChange = (images: string[]) => {
    setDetailImages(images)
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!campaign?.id) {
      toast.error('캠페인 ID가 없습니다')
      return
    }
    
    try {
      setLoading(true)

      // 필수 필드 검증
      if (!formData.experience_name.trim()) {
        toast.error('체험단명을 입력해주세요')
        return
      }

      if (!formData.brand_name.trim()) {
        toast.error('브랜드명을 입력해주세요')
        return
      }

      if (!formData.description.trim()) {
        toast.error('설명을 입력해주세요')
        return
      }

      // 캠페인 데이터 업데이트 (캠페인 생성 시와 동일한 필드들만)
      const updateData = {
        campaign_name: formData.experience_name.trim(),
        product_name: formData.brand_name.trim(),
        brand_name: formData.brand_name.trim(),
        description: formData.description.trim(),
        type: formData.experience_type,
        status: formData.status,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : 0,
        current_participants: parseInt(formData.current_applicants.toString()) || 0,
        start_date: formData.application_start_date || new Date().toISOString(),
        end_date: formData.application_end_date || null,
        application_start: formData.application_start_date || new Date().toISOString(),
        application_end: formData.application_end_date || null,
        content_start: formData.content_start_date || new Date().toISOString(),
        content_end: formData.content_end_date || null,
        requirements: formData.requirements.trim() || null,
        rewards: formData.reward_points ? `${formData.reward_points}P` : null,
        main_images: mainImages,
        detail_images: detailImages,
        updated_at: new Date().toISOString()
      }
      
      console.log('🖼️ 캠페인 수정 시 이미지 데이터:', {
        mainImages,
        detailImages,
        mainImagesLength: mainImages.length,
        detailImagesLength: detailImages.length,
        updateData
      })

      // 캠페인 업데이트
      await (dataService.entities as any).campaigns.update(campaign.id, updateData)
      
      toast.success('캠페인이 성공적으로 수정되었습니다!')
      onSuccess()
      onClose()
      
    } catch (error) {
      console.error('캠페인 수정 실패:', error)
      toast.error('캠페인 수정에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">
              캠페인 편집 - {campaign?.campaign_name || campaign?.title || campaign?.experience_name || '제목 없음'}
            </h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={loading}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 🔥 이미지 업로드 섹션 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 메인 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Image className="w-4 h-4 inline mr-1" />
                메인 이미지 (여러장 가능)
              </label>
              <ImageUploadManager
                onImagesChange={handleMainImagesChange}
                initialImages={mainImages}
                maxImages={5}
                allowFileUpload={true}
                allowUrlInput={true}
              />
            </div>

            {/* 상세 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                상세 이미지 (여러장 가능)
              </label>
              <ImageUploadManager
                onImagesChange={handleDetailImagesChange}
                initialImages={detailImages}
                maxImages={10}
                allowFileUpload={true}
                allowUrlInput={true}
              />
            </div>
          </div>

          {/* 기본 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                체험단명 *
              </label>
              <input
                type="text"
                name="experience_name"
                value={formData.experience_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="체험단명을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                브랜드명 *
              </label>
              <input
                type="text"
                name="brand_name"
                value={formData.brand_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="브랜드명을 입력하세요"
                required
              />
            </div>
          </div>

          {/* 체험단 타입 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              체험단 타입 *
            </label>
            <select
              name="experience_type"
              value={formData.experience_type}
              onChange={handleInputChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="purchase_review">구매평</option>
              <option value="product">제품 체험</option>
              <option value="press">기자단</option>
              <option value="local">지역 체험</option>
            </select>
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              캠페인 설명 *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="캠페인에 대한 자세한 설명을 입력하세요"
              required
            />
          </div>

          {/* 🔥 HTML 상세 컨텐츠 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Code className="w-4 h-4 inline mr-1" />
              HTML 상세 컨텐츠 (선택사항)
            </label>
            <textarea
              value={htmlContent}
              onChange={(e) => setHtmlContent(e.target.value)}
              rows={8}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              placeholder="HTML 코드를 입력하세요. 예: <div><img src='...' /><p>상세 설명...</p></div>"
            />
            <p className="text-xs text-gray-500 mt-1">
              HTML 태그를 사용하여 더 풍부한 상세 페이지를 만들 수 있습니다. 이미지, 텍스트, 레이아웃 등을 자유롭게 구성하세요.
            </p>
          </div>

          {/* 리워드 및 모집 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Coins className="w-4 h-4 inline mr-1" />
                리워드 포인트
              </label>
              <input
                type="number"
                name="reward_points"
                value={formData.reward_points}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                모집 인원
              </label>
              <input
                type="number"
                name="max_participants"
                value={formData.max_participants}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                상태
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="active">모집중</option>
                <option value="pending">준비중</option>
                <option value="closed">마감</option>
              </select>
            </div>
          </div>


          {/* 위치 및 기간 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                체험 지역
              </label>
              <input
                type="text"
                name="experience_location"
                value={formData.experience_location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 서울, 전국, 온라인"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                체험 기간
              </label>
              <input
                type="text"
                name="experience_period"
                value={formData.experience_period}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 2주, 1개월"
              />
            </div>
          </div>

          {/* 연락처 정보 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                문의 이메일
              </label>
              <input
                type="email"
                name="contact_email"
                value="support@allthingbucket.com"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                placeholder="support@allthingbucket.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                문의 전화번호
              </label>
              <input
                type="tel"
                name="contact_phone"
                value="010-7290-7620"
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                placeholder="010-7290-7620"
              />
            </div>
          </div>


          {/* 참여 조건 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              참여 조건
            </label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="참여자가 만족해야 할 조건들을 입력하세요"
            />
          </div>

          {/* 추가 정보 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              추가 정보
            </label>
            <textarea
              name="additional_info"
              value={formData.additional_info}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="기타 안내사항이나 주의사항을 입력하세요"
            />
          </div>

          {/* 추가 정보 섹션 (기본 필드들만) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 정보</h3>
            
            {/* 체험 지역 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MapPin className="w-4 h-4 inline mr-1" />
                체험 지역
              </label>
              <input
                type="text"
                name="experience_location"
                value={formData.experience_location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 서울, 전국, 온라인"
              />
            </div>

            {/* 체험 기간 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Clock className="w-4 h-4 inline mr-1" />
                체험 기간
              </label>
              <input
                type="text"
                name="experience_period"
                value={formData.experience_period}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: 2주, 1개월"
              />
            </div>
          </div>

          {/* 캠페인 일정 정보 (기본 필드들만) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">캠페인 일정 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 신청 기간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  신청 시작일
                </label>
                <input
                  type="date"
                  name="application_start_date"
                  value={formData.application_start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  신청 마감일
                </label>
                <input
                  type="date"
                  name="application_end_date"
                  value={formData.application_end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.application_end_date && (
                  <p className="text-xs text-blue-600 mt-1">
                    신청 마감일: {getDeadlineDisplay(formData.application_end_date)}
                  </p>
                )}
              </div>

              {/* 콘텐츠 기간 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  콘텐츠 시작일
                </label>
                <input
                  type="date"
                  name="content_start_date"
                  value={formData.content_start_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  콘텐츠 마감일
                </label>
                <input
                  type="date"
                  name="content_end_date"
                  value={formData.content_end_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {formData.content_end_date && (
                  <p className="text-xs text-purple-600 mt-1">
                    리뷰 마감일: {getDeadlineDisplay(formData.content_end_date)}
                  </p>
                )}
              </div>

              {/* 현재 신청자 수 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-indigo-600" />
                  현재 신청자 수
                </label>
                <input
                  type="number"
                  name="current_applicants"
                  value={formData.current_applicants}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  현재까지 신청한 인플루언서 수를 입력하세요
                </p>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex justify-end space-x-4 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '수정 중...' : '캠페인 수정'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignEditModal
