import React, { useState, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { lumi } from '../lib/lumi'
import {X, Upload, Calendar, MapPin, Users, Coins, Clock, FileText, Phone, Mail, Image, Code, Trash2, Gift, Target, Hash, Link, Info, CalendarDays, UserCheck, Megaphone} from 'lucide-react'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface CampaignEditModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  campaign: any
}

// 리치 텍스트 에디터 설정
const quillModules = {
  toolbar: [
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'align': [] }],
    ['link', 'image'],
    ['clean']
  ],
}

const quillFormats = [
  'header', 'bold', 'italic', 'underline', 'strike',
  'color', 'background', 'list', 'bullet', 'indent',
  'align', 'link', 'image'
]

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
    contact_email: '',
    contact_phone: '',
    status: 'active',
    // 리뷰넷 스타일 새로운 필드들
    provided_items: '',
    campaign_mission: '',
    keywords: '',
    product_links: '',
    additional_guidelines: '',
    // 캠페인 일정 정보
    application_start_date: '',
    application_end_date: '',
    influencer_announcement_date: '',
    content_start_date: '',
    content_end_date: '',
    result_announcement_date: '',
    current_applicants: 0
  })

  // 🔥 캠페인 데이터로 폼 초기화
  useEffect(() => {
    if (campaign && isOpen) {
      console.log('📝 캠페인 편집 데이터 로드:', campaign)
      
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
        experience_name: safeString(campaign, 'experience_name', ''),
        brand_name: safeString(campaign, 'brand_name', ''),
        description: safeString(campaign, 'description', ''),
        experience_type: safeString(campaign, 'experience_type', 'purchase_review') || 
                        safeString(campaign, 'campaign_type', 'purchase_review') || 
                        safeString(campaign, 'type', 'purchase_review'),
        reward_points: safeNumber(campaign, 'reward_points', 0).toString(),
        // 🔥 기간 설정에서 자동으로 가져오기 (application_deadline 필드 제거됨)
        experience_location: safeString(campaign, 'experience_location', ''),
        max_participants: safeNumber(campaign, 'max_participants', 30).toString(),
        experience_period: safeString(campaign, 'experience_period', ''),
        // 🔥 기간 설정에서 자동으로 가져오기 (review_deadline 필드 제거됨)
        requirements: safeString(campaign, 'requirements', ''),
        additional_info: safeString(campaign, 'additional_info', ''),
        contact_email: safeString(campaign, 'contact_email', ''),
        contact_phone: safeString(campaign, 'contact_phone', ''),
        status: safeString(campaign, 'status', 'active'),
        // 리뷰넷 스타일 새로운 필드들
        provided_items: safeString(campaign, 'provided_items', ''),
        campaign_mission: safeString(campaign, 'campaign_mission', ''),
        keywords: safeString(campaign, 'keywords', ''),
        product_links: safeString(campaign, 'product_links', ''),
        additional_guidelines: safeString(campaign, 'additional_guidelines', ''),
        // 캠페인 일정 정보
        application_start_date: formatDateForInput(safeString(campaign, 'application_start_date')),
        application_end_date: formatDateForInput(safeString(campaign, 'application_end_date')),
        influencer_announcement_date: formatDateForInput(safeString(campaign, 'influencer_announcement_date')),
        content_start_date: formatDateForInput(safeString(campaign, 'content_start_date')),
        content_end_date: formatDateForInput(safeString(campaign, 'content_end_date')),
        result_announcement_date: formatDateForInput(safeString(campaign, 'result_announcement_date')),
        current_applicants: safeNumber(campaign, 'current_applicants', 0)
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
        campaignData: campaign
      })
      
      setMainImages(displayMainImages)
      setDetailImages(detailImagesData)
      setHtmlContent(safeString(campaign, 'html_content', ''))
    }
  }, [campaign, isOpen])

  // 🔥 메인 이미지 업로드 처리
  const onMainImageDrop = async (acceptedFiles: File[]) => {
    try {
      setLoading(true)

      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('파일 크기는 10MB 이하여야 합니다')
          continue
        }

        if (!file.type.startsWith('image/')) {
          toast.error('이미지 파일만 업로드 가능합니다')
          continue
        }

        const uploadResults = await lumi.tools.file.upload([file])
        
        if (uploadResults && uploadResults.length > 0) {
          const result = uploadResults[0]
          if (result.fileUrl) {
            setMainImages(prev => [...prev, result.fileUrl].filter((url): url is string => Boolean(url)))
            toast.success('메인 이미지가 업로드되었습니다')
          } else if (result.uploadError) {
            toast.error(`업로드 실패: ${result.uploadError}`)
          }
        }
      }
    } catch (error) {
      console.error('메인 이미지 업로드 실패:', error)
      toast.error('메인 이미지 업로드에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 🔥 상세 이미지 업로드 처리
  const onDetailImageDrop = async (acceptedFiles: File[]) => {
    try {
      setLoading(true)

      for (const file of acceptedFiles) {
        if (file.size > 10 * 1024 * 1024) {
          toast.error('파일 크기는 10MB 이하여야 합니다')
          continue
        }

        if (!file.type.startsWith('image/')) {
          toast.error('이미지 파일만 업로드 가능합니다')
          continue
        }

        const uploadResults = await lumi.tools.file.upload([file])
        
        if (uploadResults && uploadResults.length > 0) {
          const result = uploadResults[0]
          if (result.fileUrl) {
            setDetailImages(prev => [...prev, result.fileUrl].filter((url): url is string => Boolean(url)))
            toast.success('상세 이미지가 업로드되었습니다')
          } else if (result.uploadError) {
            toast.error(`업로드 실패: ${result.uploadError}`)
          }
        }
      }
    } catch (error) {
      console.error('상세 이미지 업로드 실패:', error)
      toast.error('상세 이미지 업로드에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const { getRootProps: getMainRootProps, getInputProps: getMainInputProps, isDragActive: isMainDragActive } = useDropzone({
    onDrop: onMainImageDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    disabled: loading
  })

  const { getRootProps: getDetailRootProps, getInputProps: getDetailInputProps, isDragActive: isDetailDragActive } = useDropzone({
    onDrop: onDetailImageDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    disabled: loading
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const removeMainImage = (index: number) => {
    setMainImages(prev => prev.filter((_, i) => i !== index))
  }

  const removeDetailImage = (index: number) => {
    setDetailImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!campaign?._id) {
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

      // 캠페인 데이터 업데이트
      const updateData = {
        experience_name: formData.experience_name.trim(),
        brand_name: formData.brand_name.trim(),
        description: formData.description.trim(),
        experience_type: formData.experience_type,
        campaign_type: formData.experience_type, // 호환성을 위한 별칭
        type: formData.experience_type, // 추가 호환성
        reward_points: formData.reward_points ? parseInt(formData.reward_points) : 0,
        // 🔥 기간 설정에서 자동으로 가져오기
        application_deadline: formData.application_end_date || null,
        experience_location: formData.experience_location.trim() || null,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : 0,
        experience_period: formData.experience_period.trim() || null,
        review_deadline: formData.content_end_date || null,
        requirements: formData.requirements.trim() || null,
        additional_info: formData.additional_info.trim() || null,
        contact_email: formData.contact_email.trim() || null,
        contact_phone: formData.contact_phone.trim() || null,
        
        // 🔥 리뷰넷 스타일 새로운 필드들
        provided_items: formData.provided_items.trim() || null,
        campaign_mission: formData.campaign_mission.trim() || null,
        keywords: formData.keywords.trim() || null,
        product_links: formData.product_links.trim() || null,
        additional_guidelines: formData.additional_guidelines.trim() || null,
        
        // 🔥 캠페인 일정 정보
        application_start_date: formData.application_start_date || null,
        application_end_date: formData.application_end_date || null,
        influencer_announcement_date: formData.influencer_announcement_date || null,
        content_start_date: formData.content_start_date || null,
        content_end_date: formData.content_end_date || null,
        result_announcement_date: formData.result_announcement_date || null,
        current_applicants: parseInt(formData.current_applicants.toString()) || 0,
        
        // 🔥 이미지 관련 필드들
        main_image_url: mainImages[0] || null,
        main_images: mainImages,
        detail_images: detailImages,
        html_content: htmlContent.trim() || null,
        
        // 🔥 기존 호환성을 위한 필드
        image_url: mainImages[0] || null,
        
        status: formData.status,
        updated_at: new Date().toISOString()
      }

      // 캠페인 업데이트
      await lumi.entities.experience_codes.update(campaign._id, updateData)
      
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
            <h3 className="text-xl font-bold">캠페인 편집</h3>
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
              <div
                {...getMainRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isMainDragActive 
                    ? 'border-blue-400 bg-blue-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getMainInputProps()} />
                
                {mainImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {mainImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`메인 이미지 ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeMainImage(index)
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-green-600">{mainImages.length}개 메인 이미지 업로드됨</p>
                    <p className="text-xs text-gray-500">더 추가하려면 클릭하거나 드래그하세요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      {isMainDragActive ? '메인 이미지를 여기에 놓으세요' : '메인 이미지를 드래그하거나 클릭하여 업로드'}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF 파일 (최대 10MB)</p>
                  </div>
                )}
              </div>
            </div>

            {/* 상세 이미지 업로드 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-1" />
                상세 이미지 (여러장 가능)
              </label>
              <div
                {...getDetailRootProps()}
                className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                  isDetailDragActive 
                    ? 'border-green-400 bg-green-50' 
                    : 'border-gray-300 hover:border-gray-400'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <input {...getDetailInputProps()} />
                
                {detailImages.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2">
                      {detailImages.map((url, index) => (
                        <div key={index} className="relative">
                          <img
                            src={url}
                            alt={`상세 이미지 ${index + 1}`}
                            className="w-full h-24 object-cover rounded"
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              removeDetailImage(index)
                            }}
                            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                    <p className="text-sm text-green-600">{detailImages.length}개 상세 이미지 업로드됨</p>
                    <p className="text-xs text-gray-500">더 추가하려면 클릭하거나 드래그하세요</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto" />
                    <p className="text-sm text-gray-600">
                      {isDetailDragActive ? '상세 이미지를 여기에 놓으세요' : '상세 이미지를 드래그하거나 클릭하여 업로드'}
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF 파일 (최대 10MB)</p>
                  </div>
                )}
              </div>
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
                value={formData.contact_email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="contact@example.com"
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
                value={formData.contact_phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="02-1234-5678"
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

          {/* 리뷰넷 스타일 추가 필드들 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">캠페인 상세 정보</h3>
            
              {/* 제공내역 */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Gift className="w-4 h-4 inline mr-1" />
                  제공내역
                </label>
                <div className="border border-gray-300 rounded-lg">
                  <ReactQuill
                    value={formData.provided_items}
                    onChange={(value) => setFormData(prev => ({ ...prev, provided_items: value }))}
                    modules={quillModules}
                    formats={quillFormats}
                    placeholder="제공되는 제품이나 혜택을 상세히 입력하세요"
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>

            {/* 캠페인 미션 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-1" />
                캠페인 미션
              </label>
              <div className="border border-gray-300 rounded-lg">
                <ReactQuill
                  value={formData.campaign_mission}
                  onChange={(value) => setFormData(prev => ({ ...prev, campaign_mission: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="참여자가 수행해야 할 미션을 상세히 입력하세요"
                  style={{ minHeight: '200px' }}
                />
              </div>
            </div>

            {/* 키워드 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Hash className="w-4 h-4 inline mr-1" />
                키워드
              </label>
              <input
                type="text"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="예: #뷰티 #스킨케어 #자연주의 (쉼표로 구분)"
              />
            </div>

            {/* 링크 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Link className="w-4 h-4 inline mr-1" />
                제품 링크
              </label>
              <input
                type="url"
                name="product_links"
                value={formData.product_links}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://example.com/product"
              />
            </div>

            {/* 추가 안내사항 */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Info className="w-4 h-4 inline mr-1" />
                추가 안내사항
              </label>
              <div className="border border-gray-300 rounded-lg">
                <ReactQuill
                  value={formData.additional_guidelines}
                  onChange={(value) => setFormData(prev => ({ ...prev, additional_guidelines: value }))}
                  modules={quillModules}
                  formats={quillFormats}
                  placeholder="참여자에게 전달할 추가 안내사항이나 주의사항을 입력하세요"
                  style={{ minHeight: '200px' }}
                />
              </div>
            </div>
          </div>

          {/* 캠페인 일정 정보 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">캠페인 일정 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 신청 기간 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center">
                  <Calendar className="w-4 h-4 mr-2 text-blue-600" />
                  신청 기간
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">시작일</label>
                    <input
                      type="date"
                      name="application_start_date"
                      value={formData.application_start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">종료일 (신청 마감일)</label>
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
                </div>
              </div>

              {/* 인플루언서 발표 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                  인플루언서 발표일
                </label>
                <input
                  type="date"
                  name="influencer_announcement_date"
                  value={formData.influencer_announcement_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* 콘텐츠 등록 기간 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2 text-purple-600" />
                  콘텐츠 등록 기간
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">시작일</label>
                    <input
                      type="date"
                      name="content_start_date"
                      value={formData.content_start_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">종료일 (리뷰 마감일)</label>
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
                </div>
              </div>

              {/* 캠페인 결과발표 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Megaphone className="w-4 h-4 mr-2 text-orange-600" />
                  캠페인 결과발표일
                </label>
                <input
                  type="date"
                  name="result_announcement_date"
                  value={formData.result_announcement_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
