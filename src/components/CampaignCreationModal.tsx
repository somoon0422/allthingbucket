
import React, { useState } from 'react'
import { dataService } from '../lib/dataService'
import ImageUploadManager from './ImageUploadManager'
import {X, Calendar, Users, Coins, FileText, Phone, Mail, Image, Code, Gift, Target, Hash, Link, Info, CalendarDays, UserCheck, Megaphone, Plus, Trash2, Package} from 'lucide-react'
import toast from 'react-hot-toast'
import ReactQuill from 'react-quill'
import 'react-quill/dist/quill.snow.css'

interface CampaignCreationModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
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

const CampaignCreationModal: React.FC<CampaignCreationModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false)
  const [mainImages, setMainImages] = useState<string[]>([])
  const [detailImages, setDetailImages] = useState<string[]>([])
  const [htmlContent, setHtmlContent] = useState('')
  
  // 🔥 D-Day 계산 함수
  const getDeadlineDisplay = (deadline: string) => {
    if (!deadline) return 'D-7'
    
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
      return 'D-7'
    }
  }
  
  // 🔥 제품 상태 관리
  interface Product {
    id: string
    name: string
    allowed_platforms: string[]
  }

  const [products, setProducts] = useState<Product[]>([
    {
      id: Date.now().toString(),
      name: '',
      allowed_platforms: []
    }
  ])

  const [formData, setFormData] = useState({
    experience_name: '',
    brand_name: '',
    description: '',
    platform: '인스타그램', // 플랫폼
    delivery_type: '배송형', // 배송형
    reward_points: '',
    max_participants: '30',
    requirements: '',
    additional_info: '',
    contact_email: '',
    contact_phone: '',
    status: 'active',
    // 리뷰넷 스타일 새로운 필드들
    provided_items: '', // 제공내역
    campaign_mission: '', // 캠페인 미션
    keywords: '', // 키워드
    product_links: '', // 링크
    additional_guidelines: '', // 추가 안내사항
    // 캠페인 일정 정보
    application_start_date: '', // 신청 시작일
    application_end_date: '', // 신청 종료일
    influencer_announcement_date: '', // 인플루언서 발표일
    content_start_date: '', // 콘텐츠 등록 시작일
    content_end_date: '', // 콘텐츠 등록 종료일
    experience_announcement_date: '', // 체험단 발표일
    result_announcement_date: '', // 캠페인 결과발표일
    current_applicants: 0, // 현재 신청자 수
    // 승인 안내 메시지 커스터마이징
    approval_email_subject: '', // 승인 이메일 제목
    approval_email_content: '', // 승인 이메일 내용
    approval_sms_content: '' // 승인 SMS 내용
  })

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
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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

      // 캠페인 데이터 생성 (실제 campaigns 테이블 구조에 맞게)
      const campaignData = {
        campaign_name: formData.experience_name.trim(),
        product_name: formData.brand_name.trim(),
        brand_name: formData.brand_name.trim(),
        description: formData.description.trim(),
        type: 'campaign', // 기본값
        platform: formData.platform, // 플랫폼
        delivery_type: formData.delivery_type, // 배송형
        status: 'active',
        max_participants: formData.max_participants ? parseInt(formData.max_participants) : 0,
        current_participants: 0,
        start_date: formData.application_start_date || new Date().toISOString(),
        end_date: formData.application_end_date || null,
        application_start: formData.application_start_date || new Date().toISOString(),
        application_end: formData.application_end_date || null,
        content_start: formData.content_start_date || new Date().toISOString(),
        content_end: formData.content_end_date || null,
        review_deadline: formData.content_end_date || null,
        experience_announcement: formData.experience_announcement_date || null,
        result_announcement: formData.result_announcement_date || null,
        additional_info: formData.additional_info || null,
        requirements: formData.requirements.trim() || null,
        rewards: formData.reward_points ? parseInt(formData.reward_points) : 0,
        contact_email: 'support@allthingbucket.com',
        contact_phone: '01022129245',
        main_images: mainImages,
        detail_images: detailImages,
        // 승인 안내 메시지
        approval_email_subject: formData.approval_email_subject.trim() || null,
        approval_email_content: formData.approval_email_content.trim() || null,
        approval_sms_content: formData.approval_sms_content.trim() || null
      }

      // 🔥 디버깅: 이미지 데이터 확인
      console.log('🖼️ 캠페인 생성 시 이미지 데이터:', {
        mainImages,
        detailImages,
        mainImagesLength: mainImages.length,
        detailImagesLength: detailImages.length,
        campaignData
      })

      // 캠페인 생성 (campaigns 테이블에 저장)
      const createdCampaign = await (dataService.entities as any).campaigns.create(campaignData)

      if (!createdCampaign || !createdCampaign.id) {
        throw new Error('캠페인 생성 실패')
      }

      // 🔥 제품 데이터 저장 (campaign_products 테이블)
      const productData = products.map(product => ({
        campaign_id: createdCampaign.id,
        product_name: product.name.trim(),
        allowed_platforms: product.allowed_platforms, // JSON 배열
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }))

      console.log('📦 제품 데이터 저장:', productData)
      await (dataService.entities as any).campaign_products.createMany(productData)
      
      toast.success('캠페인이 성공적으로 등록되었습니다!')
      onSuccess()
      onClose()
      
      // 폼 리셋
      setFormData({
        experience_name: '',
        brand_name: '',
        description: '',
        reward_points: '',
        max_participants: '30',
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
        experience_announcement_date: '',
        result_announcement_date: '',
        current_applicants: 0
      })
      setMainImages([])
      setDetailImages([])
      setHtmlContent('')
      
    } catch (error) {
      console.error('캠페인 생성 실패:', error)
      toast.error('캠페인 등록에 실패했습니다')
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
            <h3 className="text-xl font-bold">새 캠페인 등록</h3>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                placeholder="브랜드명을 입력하세요"
                required
              />
            </div>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                required
              >
                <option value="배송형">배송형</option>
                <option value="방문형">방문형</option>
                <option value="온라인">온라인</option>
                <option value="기타">기타</option>
              </select>
            </div>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent font-mono text-sm"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
              placeholder="참여자가 만족해야 할 조건들을 입력하세요"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
                  <Calendar className="w-4 h-4 mr-2 text-vintage-600" />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">종료일 (신청 마감일)</label>
                    <input
                      type="date"
                      name="application_end_date"
                      value={formData.application_end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    />
                    {formData.application_end_date && (
                      <p className="text-xs text-vintage-600 mt-1">
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                />
              </div>

              {/* 콘텐츠 등록 기간 */}
              <div className="space-y-4">
                <h4 className="text-md font-medium text-gray-700 flex items-center">
                  <CalendarDays className="w-4 h-4 mr-2 text-navy-600" />
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
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">종료일 (리뷰 마감일)</label>
                    <input
                      type="date"
                      name="content_end_date"
                      value={formData.content_end_date}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    />
                    {formData.content_end_date && (
                      <p className="text-xs text-navy-600 mt-1">
                        리뷰 마감일: {getDeadlineDisplay(formData.content_end_date)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* 발표 일정 */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2 text-green-600" />
                    체험단 발표일
                  </label>
                  <input
                    type="date"
                    name="experience_announcement_date"
                    value={formData.experience_announcement_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
                
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  />
                </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
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
              className="px-6 py-2 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '등록 중...' : '캠페인 등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CampaignCreationModal
