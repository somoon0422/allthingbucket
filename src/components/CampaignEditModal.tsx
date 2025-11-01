import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import ImageUploadManager from './ImageUploadManager'
import {X, Calendar, Users, Coins, FileText, Phone, Mail, Image, Code, Plus, Trash2, Package, Gift, Target, Hash, Link, Info, CalendarDays, UserCheck, Megaphone} from 'lucide-react'
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

// Product 인터페이스
interface Product {
  id: string
  name: string
  allowed_platforms: string[]
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

// 🔥 안전한 배열 추출 (이미지 전용)
function safeImageArray(obj: any, field: string): string[] {
  try {
    if (!obj || typeof obj !== 'object') return []
    const value = obj[field]
    
    console.log(`🔍 safeImageArray 처리 중 - 필드: ${field}, 값:`, {
      value,
      type: typeof value,
      isArray: Array.isArray(value),
      isString: typeof value === 'string',
      isNull: value === null,
      isUndefined: value === undefined
    })
    
    // null이나 undefined인 경우
    if (value === null || value === undefined) {
      console.log(`🔍 ${field} 값이 null/undefined입니다`)
      return []
    }
    
    // 배열인 경우
    if (Array.isArray(value)) {
      const filtered = value.filter(item => typeof item === 'string' && item.trim())
      console.log(`🔍 ${field} 배열 처리 결과:`, filtered)
      return filtered
    }
    
    // 문자열인 경우 (단일 이미지)
    if (typeof value === 'string') {
      if (value.trim()) {
        console.log(`🔍 ${field} 단일 문자열 처리:`, [value.trim()])
        return [value.trim()]
      } else {
        console.log(`🔍 ${field} 빈 문자열입니다`)
        return []
      }
    }
    
    // JSON 문자열인 경우
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value)
        console.log(`🔍 ${field} JSON 파싱 결과:`, parsed)
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(item => typeof item === 'string' && item.trim())
          console.log(`🔍 ${field} JSON 배열 처리 결과:`, filtered)
          return filtered
        }
      } catch (parseError) {
        console.log(`🔍 ${field} JSON 파싱 실패:`, parseError)
      }
    }
    
    console.log(`🔍 ${field} 처리 완료 - 빈 배열 반환`)
    return []
  } catch (error) {
    console.error(`🔍 ${field} 처리 중 오류:`, error)
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

  // 🔥 제품 상태 관리
  const [products, setProducts] = useState<Product[]>([
    {
      id: Date.now().toString(),
      name: '',
      allowed_platforms: []
    }
  ])
  
  // 🔥 캠페인 데이터 디버깅
  useEffect(() => {
    console.log('🔧 CampaignEditModal - 캠페인 prop 변경:', {
      isOpen,
      campaign,
      campaignId: campaign?.id || campaign?._id,
      campaignName: campaign?.campaign_name || campaign?.title,
      hasCampaign: !!campaign,
      campaignKeys: campaign ? Object.keys(campaign) : [],
      campaignData: campaign
    })
  }, [campaign, isOpen])
  
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
    product_name: '',
    brand_name: '',
    description: '',
    platform: '인스타그램',
    delivery_type: '배송형',
    reward_points: '',
    max_participants: '30',
    experience_location: '',
    experience_period: '',
    requirements: '',
    provided_items: '', // ReactQuill로 변경될 예정
    campaign_mission: '', // 캠페인 미션
    keywords: '',
    product_links: '', // 제품 링크
    additional_guidelines: '', // 추가 안내사항
    review_guidelines: '',
    additional_info: '',
    status: 'active',
    // 캠페인 일정 정보
    application_start_date: '',
    application_end_date: '',
    influencer_announcement_date: '', // 인플루언서 발표일
    content_start_date: '',
    content_end_date: '',
    experience_announcement_date: '',
    result_announcement_date: '',
    current_applicants: 0,
    // 상시 운영 플래그
    is_always_open_application: false, // 상시 신청
    is_always_open_content: false, // 상시 콘텐츠 등록
    is_always_announcement_experience: false, // 상시 체험단 발표
    is_always_announcement_result: false, // 상시 결과 발표
    is_always_announcement_influencer: false, // 상시 인플루언서 발표
    // 승인 안내 메시지
    approval_email_subject: '',
    approval_email_content: '',
    approval_sms_content: '',
    // 배송 주소 수집 여부
    collect_shipping_address: true
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
        rewards: campaign.rewards,
        status: campaign.status,
        main_images: campaign.main_images,
        detail_images: campaign.detail_images,
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

      const newFormData = {
        experience_name: safeString(campaign, 'campaign_name', ''),
        product_name: safeString(campaign, 'product_name', ''),
        brand_name: safeString(campaign, 'brand_name', ''),
        description: safeString(campaign, 'description', ''),
        platform: safeString(campaign, 'platform', '인스타그램'),
        delivery_type: safeString(campaign, 'delivery_type', '배송형'),
        reward_points: safeNumber(campaign, 'rewards', 0).toString(),
        max_participants: safeNumber(campaign, 'max_participants', 30).toString(),
        experience_location: safeString(campaign, 'experience_location', ''),
        experience_period: safeString(campaign, 'experience_period', ''),
        requirements: safeString(campaign, 'requirements', ''),
        provided_items: safeString(campaign, 'provided_items', ''),
        campaign_mission: safeString(campaign, 'campaign_mission', ''),
        keywords: safeString(campaign, 'keywords', ''),
        product_links: safeString(campaign, 'product_links', ''),
        additional_guidelines: safeString(campaign, 'additional_guidelines', ''),
        review_guidelines: safeString(campaign, 'review_guidelines', ''),
        additional_info: safeString(campaign, 'additional_info', ''),
        status: safeString(campaign, 'status', 'active'),
        // 캠페인 일정 정보
        application_start_date: formatDateForInput(safeString(campaign, 'application_start_date') || safeString(campaign, 'application_start')),
        application_end_date: formatDateForInput(safeString(campaign, 'application_end_date') || safeString(campaign, 'application_end')),
        content_start_date: formatDateForInput(safeString(campaign, 'content_start_date') || safeString(campaign, 'content_start')),
        content_end_date: formatDateForInput(safeString(campaign, 'content_end_date') || safeString(campaign, 'content_end')),
        experience_announcement_date: formatDateForInput(safeString(campaign, 'influencer_announcement_date') || safeString(campaign, 'experience_announcement')),
        result_announcement_date: formatDateForInput(safeString(campaign, 'result_announcement_date') || safeString(campaign, 'result_announcement')),
        current_applicants: safeNumber(campaign, 'current_participants', 0),
        // 상시 운영 플래그
        is_always_open_application: campaign.is_always_open_application || false,
        is_always_open_content: campaign.is_always_open_content || false,
        is_always_announcement_experience: campaign.is_always_announcement_experience || false,
        is_always_announcement_result: campaign.is_always_announcement_result || false,
        is_always_announcement_influencer: campaign.is_always_announcement_influencer || false,
        // 승인 안내 메시지
        approval_email_subject: safeString(campaign, 'approval_email_subject', ''),
        approval_email_content: safeString(campaign, 'approval_email_content', ''),
        approval_sms_content: safeString(campaign, 'approval_sms_content', ''),
        // 배송 주소 수집 여부
        collect_shipping_address: campaign.collect_shipping_address !== undefined ? campaign.collect_shipping_address : true
      }

      console.log('📝 폼 데이터 생성:', newFormData)
      setFormData(newFormData)
      
      console.log('📝 폼 데이터 설정 완료:', {
        experience_name: safeString(campaign, 'campaign_name', ''),
        brand_name: safeString(campaign, 'brand_name', ''),
        description: safeString(campaign, 'description', ''),
        product_name: safeString(campaign, 'product_name', ''),
        campaign_name: safeString(campaign, 'campaign_name', ''),
        rewards: safeNumber(campaign, 'rewards', 0),
        status: safeString(campaign, 'status', 'active'),
        max_participants: safeNumber(campaign, 'max_participants', 30)
      })

      // 🔥 이미지 데이터 로드 - 강화된 디버깅 및 호환성
      console.log('🖼️ 캠페인 이미지 데이터 원본:', {
        main_images: campaign.main_images,
        detail_images: campaign.detail_images,
        main_images_type: typeof campaign.main_images,
        detail_images_type: typeof campaign.detail_images,
        main_images_isArray: Array.isArray(campaign.main_images),
        detail_images_isArray: Array.isArray(campaign.detail_images)
      })
      
      const mainImagesData = safeImageArray(campaign, 'main_images')
      const detailImagesData = safeImageArray(campaign, 'detail_images')
      
      console.log('🖼️ safeImageArray 처리 결과:', {
        mainImagesData,
        detailImagesData,
        mainImagesDataLength: mainImagesData?.length || 0,
        detailImagesDataLength: detailImagesData?.length || 0
      })
      
      // 🔥 모든 가능한 이미지 필드 확인
      const allImageFields = Object.keys(campaign || {}).filter(key => 
        key.includes('image') || key.includes('photo') || key.includes('picture') || key.includes('img') ||
        key.includes('Image') || key.includes('Photo') || key.includes('Picture') || key.includes('Img')
      )
      
      console.log('🖼️ 캠페인에서 발견된 모든 이미지 관련 필드:', allImageFields)
      console.log('🖼️ 각 이미지 필드의 값:', allImageFields.reduce((acc, field) => {
        acc[field] = {
          value: campaign[field],
          type: typeof campaign[field],
          isArray: Array.isArray(campaign[field]),
          length: Array.isArray(campaign[field]) ? campaign[field].length : undefined
        }
        return acc
      }, {} as any))
      
      // 🔥 캠페인 전체 데이터 구조 확인
      console.log('🔍 캠페인 전체 데이터 구조:', {
        allKeys: Object.keys(campaign || {}),
        campaign: campaign
      })
      
      // 🔥 이미지 관련 모든 필드 상세 분석
      console.log('🖼️ 이미지 필드 상세 분석:', Object.keys(campaign || {}).reduce((acc, key) => {
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('photo') || 
            key.toLowerCase().includes('picture') || key.toLowerCase().includes('img') ||
            key.toLowerCase().includes('media') || key.toLowerCase().includes('asset') ||
            key.toLowerCase().includes('file') || key.toLowerCase().includes('url')) {
          acc[key] = {
            value: campaign[key],
            type: typeof campaign[key],
            isArray: Array.isArray(campaign[key]),
            length: Array.isArray(campaign[key]) ? campaign[key].length : undefined
          }
        }
        return acc
      }, {} as any))
      
      // 🔥 호환성을 위한 추가 이미지 필드 확인
      const fallbackMainImage = safeString(campaign, 'main_image_url') || 
                               safeString(campaign, 'image_url') || 
                               safeString(campaign, 'main_image') ||
                               safeString(campaign, 'thumbnail') ||
                               safeString(campaign, 'banner_image') ||
                               safeString(campaign, 'cover_image') ||
                               safeString(campaign, 'featured_image')
      
      // 🔥 더 많은 이미지 필드에서 데이터 수집
      const additionalMainImages = safeImageArray(campaign, 'images') || 
                                  safeImageArray(campaign, 'photos') ||
                                  safeImageArray(campaign, 'pictures') ||
                                  safeImageArray(campaign, 'gallery') ||
                                  safeImageArray(campaign, 'media')
      
      // 🔥 상세 이미지를 위한 추가 필드들
      const additionalDetailImages = safeImageArray(campaign, 'detail_images') ||
                                    safeImageArray(campaign, 'gallery_images') ||
                                    safeImageArray(campaign, 'content_images') ||
                                    safeImageArray(campaign, 'additional_images')
      
      const displayMainImages = mainImagesData.length > 0 ? mainImagesData : 
                               additionalMainImages.length > 0 ? additionalMainImages :
                               (fallbackMainImage ? [fallbackMainImage] : [])
      
      const displayDetailImages = detailImagesData.length > 0 ? detailImagesData :
                                 additionalDetailImages.length > 0 ? additionalDetailImages :
                                 []
      
      console.log('🖼️ 캠페인 이미지 데이터 상세:', {
        mainImagesData,
        detailImagesData,
        fallbackMainImage,
        additionalMainImages,
        additionalDetailImages,
        displayMainImages,
        displayDetailImages,
        allImageFields,
        campaignAllFields: Object.keys(campaign || {}),
        campaignData: campaign,
        mainImagesType: typeof mainImagesData,
        detailImagesType: typeof detailImagesData,
        mainImagesIsArray: Array.isArray(mainImagesData),
        detailImagesIsArray: Array.isArray(detailImagesData),
        rawMainImages: campaign?.main_images,
        rawDetailImages: campaign?.detail_images,
        rawImages: campaign?.images,
        rawPhotos: campaign?.photos,
        rawPictures: campaign?.pictures
      })
      
      // 🔥 이미지 데이터 강제 설정 (빈 배열이어도 명시적으로 설정)
      console.log('🖼️ 이미지 상태 설정:', {
        displayMainImages,
        displayDetailImages,
        mainImagesLength: displayMainImages?.length || 0,
        detailImagesLength: displayDetailImages?.length || 0
      })
      
      setMainImages(displayMainImages || [])
      setDetailImages(displayDetailImages || [])
      setHtmlContent(safeString(campaign, 'html_content', ''))

      // 🔥 캠페인 제품 데이터 로드
      const loadProducts = async () => {
        if (!campaign?.id) return

        try {
          const productData = await (dataService.entities as any).campaign_products.list({
            filter: { campaign_id: campaign.id }
          })

          console.log('📦 로드된 제품 데이터:', productData)

          if (productData && productData.length > 0) {
            const loadedProducts = productData.map((p: any) => ({
              id: p.id || Date.now().toString(),
              name: p.product_name || '',
              allowed_platforms: p.allowed_platforms || []
            }))
            setProducts(loadedProducts)
          }
        } catch (error) {
          console.error('❌ 제품 데이터 로드 실패:', error)
        }
      }

      loadProducts()
    }
  }, [campaign, isOpen])

  // 🔥 제품 추가
  const addProduct = () => {
    setProducts([...products, {
      id: Date.now().toString(),
      name: '',
      allowed_platforms: []
    }])
  }

  // 🔥 제품 삭제
  const removeProduct = (id: string) => {
    if (products.length === 1) {
      toast.error('최소 1개의 제품은 등록해야 합니다')
      return
    }
    setProducts(products.filter(p => p.id !== id))
  }

  // 🔥 제품명 변경
  const updateProductName = (id: string, name: string) => {
    setProducts(products.map(p =>
      p.id === id ? { ...p, name } : p
    ))
  }

  // 🔥 제품의 플랫폼 변경
  const toggleProductPlatform = (productId: string, platform: string) => {
    setProducts(products.map(p => {
      if (p.id === productId) {
        const platforms = p.allowed_platforms.includes(platform)
          ? p.allowed_platforms.filter(pl => pl !== platform)
          : [...p.allowed_platforms, platform]
        return { ...p, allowed_platforms: platforms }
      }
      return p
    }))
  }

  // 🔥 메인 이미지 변경 처리
  const handleMainImagesChange = (images: string[]) => {
    setMainImages(images)
  }

  // 🔥 상세 이미지 변경 처리
  const handleDetailImagesChange = (images: string[]) => {
    setDetailImages(images)
  }


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const target = e.target as HTMLInputElement
    const { name, value, type, checked } = target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
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

      if (!formData.product_name.trim()) {
        toast.error('제품명을 입력해주세요')
        return
      }

      if (!formData.description.trim()) {
        toast.error('설명을 입력해주세요')
        return
      }

      // 제품 검증
      const invalidProduct = products.find(p => !p.name.trim())
      if (invalidProduct) {
        toast.error('모든 제품의 이름을 입력해주세요')
        return
      }

      const productWithoutPlatform = products.find(p => p.allowed_platforms.length === 0)
      if (productWithoutPlatform) {
        toast.error('모든 제품에 최소 하나의 플랫폼을 선택해주세요')
        return
      }

      // 🔥 날짜를 ISO 형식으로 변환하는 함수
      const toISODate = (dateString: string) => {
        if (!dateString || !dateString.trim()) return null
        try {
          const date = new Date(dateString)
          return date.toISOString()
        } catch (error) {
          console.warn('날짜 변환 실패:', dateString, error)
          return null
        }
      }

      // 캠페인 데이터 업데이트 (캠페인 생성 시와 동일한 필드들만)
      const updateData = {
        campaign_name: formData.experience_name.trim(),
        product_name: formData.product_name.trim(),
        brand_name: formData.brand_name.trim(),
        description: formData.description.trim(),
        platform: formData.platform,
        delivery_type: formData.delivery_type,
        status: formData.status,
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : 0,
        current_participants: parseInt(formData.current_applicants.toString()) || 0,
        start_date: formData.application_start_date || new Date().toISOString(),
        end_date: formData.application_end_date || null,
        application_start: formData.application_start_date || new Date().toISOString(),
        application_end: formData.application_end_date || null,
        content_start: formData.content_start_date || new Date().toISOString(),
        content_end: formData.content_end_date || null,
        review_deadline: formData.content_end_date || null,
        result_announcement: formData.result_announcement_date || null,
        experience_location: formData.experience_location || null,
        experience_period: formData.experience_period || null,
        requirements: formData.requirements.trim() || null,
        provided_items: formData.provided_items.trim() || null,
        keywords: formData.keywords.trim() || null,
        review_guidelines: formData.review_guidelines.trim() || null,
        additional_info: formData.additional_info.trim() || null,
        rewards: formData.reward_points ? parseInt(formData.reward_points) : 0,
        // 상시 운영 플래그
        is_always_open_application: formData.is_always_open_application,
        is_always_open_content: formData.is_always_open_content,
        is_always_announcement_experience: formData.is_always_announcement_experience,
        is_always_announcement_result: formData.is_always_announcement_result,
        is_always_announcement_influencer: formData.is_always_announcement_influencer,
        // 배송 주소 수집 여부
        collect_shipping_address: formData.collect_shipping_address,
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
      
      console.log('🔑 키워드 데이터:', {
        keywords: formData.keywords,
        keywordsTrimmed: formData.keywords.trim(),
        keywordsInUpdateData: updateData.keywords
      })
      
      console.log('ℹ️ 추가 정보 데이터:', {
        additionalInfo: formData.additional_info,
        additionalInfoTrimmed: formData.additional_info.trim(),
        additionalInfoInUpdateData: updateData.additional_info
      })

      // 캠페인 업데이트 (타임아웃 방지)
      console.log('🚀 캠페인 업데이트 시작:', { campaignId: campaign.id, updateData })

      // 🔥 타임아웃 설정 (30초)
      const updatePromise = dataService.entities.campaigns.update(campaign.id, updateData)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('업데이트 시간 초과')), 30000)
      })

      const updateResult = await Promise.race([updatePromise, timeoutPromise])
      console.log('🚀 캠페인 업데이트 결과:', updateResult)

      if (updateResult && updateResult.id) {
        // 🔥 제품 데이터 업데이트
        try {
          // 기존 제품 데이터 삭제
          await (dataService.entities as any).campaign_products.deleteByCampaignId(campaign.id)

          // 새 제품 데이터 저장
          const productData = products.map(product => ({
            campaign_id: campaign.id,
            product_name: product.name.trim(),
            allowed_platforms: product.allowed_platforms,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))

          console.log('📦 제품 데이터 업데이트:', productData)
          await (dataService.entities as any).campaign_products.createMany(productData)
        } catch (productError) {
          console.error('❌ 제품 데이터 업데이트 실패:', productError)
          toast.error('캠페인은 수정되었으나 제품 정보 업데이트에 실패했습니다')
        }

        toast.success('캠페인이 성공적으로 수정되었습니다!')
        onSuccess()
        onClose()
      } else {
        throw new Error('캠페인 업데이트 실패')
      }
      
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="브랜드명을 입력하세요"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                제품명 *
              </label>
              <input
                type="text"
                name="product_name"
                value={formData.product_name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="제품명을 입력하세요"
                required
              />
            </div>
          </div>

          {/* 배송 주소 수집 여부 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="collect_shipping_address"
                checked={formData.collect_shipping_address}
                onChange={handleInputChange}
                className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <span className="ml-3 text-sm font-medium text-gray-700">
                📦 신청 시 배송 주소 수집
              </span>
            </label>
            <p className="mt-2 ml-7 text-xs text-gray-600">
              체크 해제 시 신청 모달에서 배송 주소 입력란이 표시되지 않습니다.<br/>
              (네이버 구매평, 온라인 체험 등 배송이 불필요한 경우 체크 해제)
            </p>
          </div>

          {/* 🔥 제품 관리 섹션 */}
          <div className="bg-gradient-to-br from-purple-50 to-blue-50 p-6 rounded-xl border-2 border-purple-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  제품 관리 *
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  각 제품별로 참여 가능한 플랫폼을 지정하세요. 신청자는 원하는 제품을 선택하여 신청합니다.
                </p>
              </div>
              <button
                type="button"
                onClick={addProduct}
                className="flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                <Plus className="w-4 h-4 mr-1" />
                제품 추가
              </button>
            </div>

            <div className="space-y-4">
              {products.map((product, index) => (
                <div key={product.id} className="bg-white p-5 rounded-lg border-2 border-gray-200 hover:border-purple-300 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        제품 {index + 1} 이름 *
                      </label>
                      <input
                        type="text"
                        value={product.name}
                        onChange={(e) => updateProductName(product.id, e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="예: 프리미엄 스킨케어 세트"
                      />
                    </div>
                    {products.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeProduct(product.id)}
                        className="ml-3 p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="제품 삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      📱 참여 가능한 플랫폼 * (여러 개 선택 가능)
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { value: 'review', label: '구매후기', icon: '⭐', color: 'blue' },
                        { value: 'blog', label: '블로그', icon: '📝', color: 'green' },
                        { value: 'naver', label: '네이버', icon: '🟢', color: 'green' },
                        { value: 'instagram', label: '인스타그램', icon: '📸', color: 'pink' },
                        { value: 'youtube', label: '유튜브', icon: '🎥', color: 'red' },
                        { value: 'tiktok', label: '틱톡', icon: '🎵', color: 'purple' },
                        { value: 'product', label: '제품 체험', icon: '🧪', color: 'orange' },
                        { value: 'press', label: '기자단', icon: '📰', color: 'gray' },
                        { value: 'local', label: '지역 체험', icon: '🏘️', color: 'yellow' },
                        { value: 'other', label: '기타', icon: '🔧', color: 'gray' }
                      ].map((platform) => (
                        <label
                          key={platform.value}
                          className={`flex items-center space-x-2 p-3 border-2 rounded-lg cursor-pointer transition-all ${
                            product.allowed_platforms.includes(platform.value)
                              ? `border-${platform.color}-500 bg-${platform.color}-50`
                              : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={product.allowed_platforms.includes(platform.value)}
                            onChange={() => toggleProductPlatform(product.id, platform.value)}
                            className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                          />
                          <span className="text-xs font-medium flex-1">
                            <span className="mr-1">{platform.icon}</span>
                            {platform.label}
                          </span>
                        </label>
                      ))}
                    </div>
                    {product.allowed_platforms.length === 0 && (
                      <p className="text-red-500 text-xs mt-2">최소 하나의 플랫폼을 선택해주세요.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 플랫폼과 배송형 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                플랫폼 *
              </label>
              <select
                name="platform"
                value={formData.platform}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="인스타그램">인스타그램</option>
                <option value="유튜브">유튜브</option>
                <option value="블로그">블로그</option>
                <option value="네이버">네이버</option>
                <option value="틱톡">틱톡</option>
                <option value="기타">기타</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                배송형 *
              </label>
              <select
                name="delivery_type"
                value={formData.delivery_type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                required
              >
                <option value="배송형">배송형</option>
                <option value="방문형">방문형</option>
                <option value="온라인">온라인</option>
                <option value="기타">기타</option>
              </select>
            </div>
          </div>

          {/* 배송 주소 수집 여부 */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                name="requires_shipping_address"
                checked={formData.requires_shipping_address}
                onChange={handleInputChange}
                className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  📦 신청 시 배송 주소 수집
                </span>
                <p className="text-xs text-gray-600 mt-1">
                  체크 해제 시 신청 모달에서 배송 주소 입력란이 표시되지 않습니다.<br />
                  (네이버 구매평, 온라인 체험 등 배송이 불필요한 경우 체크 해제)
                </p>
              </div>
            </label>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="active">모집중</option>
                <option value="pending">준비중</option>
                <option value="closed">마감</option>
              </select>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="참여자가 만족해야 할 조건들을 입력하세요"
            />
          </div>

          {/* 제공내역 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제공내역
            </label>
            <textarea
              name="provided_items"
              value={formData.provided_items}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="캠페인에서 제공하는 제품이나 혜택을 입력하세요"
            />
          </div>

          {/* 키워드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              키워드
            </label>
            <textarea
              name="keywords"
              value={formData.keywords}
              onChange={handleInputChange}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="예: #농심 #반려다움 #반려동물 #반려동물영양제 #반려견영양제 #강아지영양제 #반려다움프로바이오틱스"
            />
            <p className="text-xs text-gray-500 mt-1">
              해시태그 형태로 키워드를 입력하세요 (예: #키워드1 #키워드2)
            </p>
          </div>

          {/* 리뷰 작성시 안내사항 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              리뷰 작성시 안내사항
            </label>
            <textarea
              name="review_guidelines"
              value={formData.review_guidelines}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="리뷰 작성 시 참고해야 할 가이드라인이나 주의사항을 입력하세요"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="기타 안내사항이나 주의사항을 입력하세요"
            />
          </div>

          {/* 추가 정보 섹션 */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">추가 정보</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  체험 지역
                </label>
                <input
                  type="text"
                  name="experience_location"
                  value={formData.experience_location || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: 서울, 전국, 온라인"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  체험 기간
                </label>
                <input
                  type="text"
                  name="experience_period"
                  value={formData.experience_period || ''}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="예: 2주, 1개월"
                />
              </div>
            </div>
          </div>

          {/* 캠페인 일정 정보 (기본 필드들만) */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">캠페인 일정 정보</h3>

            <div className="space-y-6">
              {/* 체험단 신청기간 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    체험단 신청기간
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_always_open_application"
                      checked={formData.is_always_open_application}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">상시 신청</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">시작일</label>
                    <input
                      type="date"
                      name="application_start_date"
                      value={formData.application_start_date}
                      onChange={handleInputChange}
                      disabled={formData.is_always_open_application}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">종료일 (신청 마감일)</label>
                    <input
                      type="date"
                      name="application_end_date"
                      value={formData.application_end_date}
                      onChange={handleInputChange}
                      disabled={formData.is_always_open_application}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {formData.application_end_date && !formData.is_always_open_application && (
                      <p className="text-xs text-primary-600 mt-1">
                        신청 마감일: {getDeadlineDisplay(formData.application_end_date)}
                      </p>
                    )}
                    {formData.is_always_open_application && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ 상시 신청 가능
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 인플루언서 발표 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                    인플루언서 발표일
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_always_announcement_influencer"
                      checked={formData.is_always_announcement_influencer}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">상시 발표</span>
                  </label>
                </div>
                <input
                  type="date"
                  name="influencer_announcement_date"
                  value={formData.influencer_announcement_date}
                  onChange={handleInputChange}
                  disabled={formData.is_always_announcement_influencer}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {formData.is_always_announcement_influencer && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ 상시 발표
                  </p>
                )}
              </div>

              {/* 콘텐츠/리뷰 등록기간 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    <CalendarDays className="w-4 h-4 inline mr-1 text-navy-600" />
                    콘텐츠 등록 기간
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_always_open_content"
                      checked={formData.is_always_open_content}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-navy-600 focus:ring-navy-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">상시 등록</span>
                  </label>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">시작일</label>
                    <input
                      type="date"
                      name="content_start_date"
                      value={formData.content_start_date}
                      onChange={handleInputChange}
                      disabled={formData.is_always_open_content}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">종료일 (등록 마감일)</label>
                    <input
                      type="date"
                      name="content_end_date"
                      value={formData.content_end_date}
                      onChange={handleInputChange}
                      disabled={formData.is_always_open_content}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    {formData.content_end_date && !formData.is_always_open_content && (
                      <p className="text-xs text-navy-600 mt-1">
                        리뷰 마감일: {getDeadlineDisplay(formData.content_end_date)}
                      </p>
                    )}
                    {formData.is_always_open_content && (
                      <p className="text-xs text-green-600 mt-1 font-medium">
                        ✓ 상시 등록 가능
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 선정자 발표일 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Megaphone className="w-4 h-4 mr-2 text-purple-600" />
                    체험단 발표일
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_always_announcement_experience"
                      checked={formData.is_always_announcement_experience}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">상시 발표</span>
                  </label>
                </div>
                <input
                  type="date"
                  name="experience_announcement_date"
                  value={formData.experience_announcement_date}
                  onChange={handleInputChange}
                  disabled={formData.is_always_announcement_experience}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {formData.is_always_announcement_experience && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ 상시 발표
                  </p>
                )}
              </div>

              {/* 캠페인 결과발표일 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 flex items-center">
                    <Target className="w-4 h-4 mr-2 text-orange-600" />
                    캠페인 결과발표일
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="is_always_announcement_result"
                      checked={formData.is_always_announcement_result}
                      onChange={handleInputChange}
                      className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
                    />
                    <span className="text-sm text-gray-600">상시 발표</span>
                  </label>
                </div>
                <input
                  type="date"
                  name="result_announcement_date"
                  value={formData.result_announcement_date}
                  onChange={handleInputChange}
                  disabled={formData.is_always_announcement_result}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
                {formData.is_always_announcement_result && (
                  <p className="text-xs text-green-600 mt-1 font-medium">
                    ✓ 상시 발표
                  </p>
                )}
              </div>

              {/* 현재 신청자 수 */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Users className="w-4 h-4 mr-2 text-navy-600" />
                  현재 신청자 수
                </label>
                <input
                  type="number"
                  name="current_applicants"
                  value={formData.current_applicants}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="0"
                />
                <p className="text-xs text-gray-500 mt-1">
                  현재까지 신청한 인플루언서 수를 입력하세요
                </p>
              </div>
            </div>
          </div>

          {/* 승인 안내 메시지 설정 */}
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Mail className="w-5 h-5 mr-2 text-green-600" />
              승인 안내 메시지 설정 (선택)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              체험단 선정 시 발송될 이메일과 SMS 내용을 미리 설정할 수 있습니다.
              비워두면 기본 템플릿이 사용됩니다.
            </p>

            <div className="space-y-4">
              {/* 이메일 제목 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-green-600" />
                  승인 이메일 제목
                </label>
                <input
                  type="text"
                  name="approval_email_subject"
                  value={formData.approval_email_subject}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder="예: 🎉 '{캠페인명}' 최종 선정 안내"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {'{'}캠페인명{'}'}, {'{'}신청자명{'}'} 변수를 사용할 수 있습니다
                </p>
              </div>

              {/* 이메일 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-green-600" />
                  승인 이메일 내용
                </label>
                <textarea
                  name="approval_email_content"
                  value={formData.approval_email_content}
                  onChange={handleInputChange}
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`예시:\n안녕하세요, {신청자명}님.\n\n'{캠페인명}'에 최종 선정되셨음을 진심으로 축하드립니다! 🎉\n\n아래 링크를 클릭해서 체험단 가이드를 확인하시고 다음 단계를 진행해주세요.`}
                />
              </div>

              {/* SMS 내용 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Phone className="w-4 h-4 mr-2 text-green-600" />
                  승인 SMS 내용
                </label>
                <textarea
                  name="approval_sms_content"
                  value={formData.approval_sms_content}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  placeholder={`예시:\n{신청자명}님, '{캠페인명}' 체험단에 최종 선정되셨습니다! 자세한 내용은 이메일을 확인해주세요.`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  SMS는 90자 제한이 있습니다. 간결하게 작성해주세요.
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
              className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
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
