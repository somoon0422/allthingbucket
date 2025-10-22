
import React, { useState, useEffect } from 'react'
import {X, User, MessageSquare, Star, Package} from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import { AddressInput } from './AddressInput'
import { PhoneInput } from './PhoneInput'
import { dataService } from '../lib/dataService'
import { alimtalkService } from '../services/alimtalkService'
import toast from 'react-hot-toast'

interface ApplicationFormModalProps {
  isOpen: boolean
  onClose: () => void
  campaign?: any
  experience?: any
  onSuccess?: () => void
}

export const ApplicationFormModal: React.FC<ApplicationFormModalProps> = ({
  isOpen,
  onClose,
  campaign,
  experience,
  onSuccess
}) => {
  const { user, isAuthenticated } = useAuth()
  const { applyForCampaign, loading } = useExperiences()

  // 🔥 마감 상태 체크 함수
  const isCampaignClosed = () => {
    const target = campaign || experience
    if (!target) return false

    const status = target.status || target.campaign_status
    const maxParticipants = target.max_participants
    const currentParticipants = target.current_participants || 0
    
    // 상태 체크
    if (status === 'closed' || status === 'inactive') {
      return true
    }
    
    // 참가자 수 체크
    if (maxParticipants && currentParticipants >= maxParticipants) {
      return true
    }
    
    // 신청 마감일 체크
    const applicationEndDate = target.application_end_date || target.application_end || target.end_date
    if (applicationEndDate) {
      const endDate = new Date(applicationEndDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (endDate < today) {
        return true
      }
    }
    
    return false
  }

  // 🔥 모달이 열릴 때 마감 상태 체크
  useEffect(() => {
    if (isOpen && isCampaignClosed()) {
      toast.error('이 캠페인은 마감되었습니다.')
      onClose()
    }
  }, [isOpen, onClose])


  // 🔥 캠페인 제품 및 선택된 제품 상태 (복수 선택 가능)
  const [campaignProducts, setCampaignProducts] = useState<any[]>([])
  const [selectedProducts, setSelectedProducts] = useState<any[]>([])

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    detailed_address: '',
    instagram_handle: '',
    blog_url: '',
    youtube_channel: '',
    platform_type: '', // 새로 추가: 플랫폼 타입
    selected_product_id: '', // 선택한 제품 ID
    application_reason: '',
    experience_plan: '',
    additional_info: '',
    applicant_comment: '' // 신청자 한마디
  })

  // 🔥 campaign 또는 experience 둘 다 지원
  const targetCampaign = campaign || experience

  // 🔥 캠페인의 제품 목록 로드
  useEffect(() => {
    const loadCampaignProducts = async () => {
      if (!targetCampaign?.id) return

      try {
        const products = await (dataService.entities as any).campaign_products.list({
          filter: { campaign_id: targetCampaign.id }
        })

        console.log('📦 캠페인 제품 목록:', products)
        setCampaignProducts(products || [])

        // 제품이 1개면 자동 선택
        if (products && products.length === 1) {
          setSelectedProducts([products[0]])
          setFormData(prev => ({
            ...prev,
            selected_product_id: products[0].id
          }))
        }
      } catch (error) {
        console.error('❌ 캠페인 제품 로드 실패:', error)
      }
    }

    loadCampaignProducts()
  }, [targetCampaign])
  
  // 🔥 디버그: 캠페인 타입 정보 로깅
  useEffect(() => {
    if (targetCampaign) {
      console.log('🔍 ApplicationFormModal - 캠페인 정보:', {
        experience_name: targetCampaign.experience_name,
        experience_type: targetCampaign.experience_type,
        campaign_type: targetCampaign.campaign_type,
        type: targetCampaign.type,
        allFields: Object.keys(targetCampaign)
      })
    }
  }, [targetCampaign])

  // 사용자 정보 초기화
  useEffect(() => {
    if (user && isAuthenticated) {
      // 사용자 프로필 정보 불러오기
      loadUserProfile()
    }
  }, [user, isAuthenticated])

  // 사용자 프로필 정보 불러오기
  const loadUserProfile = async () => {
    if (!user) return

    try {
      const userId = user.id || user.user_id || (user as any)._id

      // 🔥 influencer_profiles에서 운영채널 정보 우선 조회
      let influencerProfile: any = null
      try {
        const influencerProfiles = await (dataService.entities as any).influencer_profiles.list()
        influencerProfile = Array.isArray(influencerProfiles)
          ? influencerProfiles.find((p: any) => p && p.user_id === userId)
          : null
        console.log('📋 influencer_profiles 데이터:', influencerProfile)
      } catch (influencerError) {
        console.log('⚠️ influencer_profiles 조회 실패 (무시):', influencerError)
      }

      // user_profiles에서 사용자 기본 정보 검색
      const profileResponse = await (dataService.entities as any).user_profiles.list({
        filter: { user_id: userId }
      })

      if (profileResponse && Array.isArray(profileResponse) && profileResponse.length > 0) {
        const profile = profileResponse[0]

        console.log('📋 user_profiles 데이터:', profile)
        console.log('📞 전화번호 필드들:', {
          phone: profile.phone,
          user_phone: profile.user_phone,
          phoneNumber: profile.phoneNumber,
          phone_number: profile.phone_number
        })

        // 프로필 정보로 폼 데이터 초기화 (여러 필드명 시도)
        const phoneNumber = profile.phone || profile.user_phone || profile.phoneNumber || profile.phone_number || ''

        // 🔥 운영채널 정보는 influencer_profiles 우선, 없으면 user_profiles
        const instagramHandle = (influencerProfile?.instagram_id || profile.instagram_handle || profile.instagram_id || '').replace('@', '')
        const blogUrl = influencerProfile?.naver_blog || profile.blog_url || profile.naver_blog || ''
        const youtubeChannel = influencerProfile?.youtube_channel || profile.youtube_channel || ''

        setFormData(prev => ({
          ...prev,
          name: profile.name || user.name || user.admin_name || '',
          email: profile.email || user.email || '',
          phone: phoneNumber,
          address: profile.address || '',
          detailed_address: profile.detailed_address || '',
          instagram_handle: instagramHandle,
          blog_url: blogUrl,
          youtube_channel: youtubeChannel
        }))

        console.log('✅ 폼 데이터 초기화 완료:', {
          phone: phoneNumber,
          instagram: instagramHandle,
          blog: blogUrl,
          youtube: youtubeChannel
        })
      } else {
        // 프로필이 없어도 influencer_profiles의 운영채널 정보는 가져오기
        if (influencerProfile) {
          const instagramHandle = (influencerProfile.instagram_id || '').replace('@', '')
          const blogUrl = influencerProfile.naver_blog || ''
          const youtubeChannel = influencerProfile.youtube_channel || ''

          setFormData(prev => ({
            ...prev,
            name: user.name || user.admin_name || '',
            email: user.email || '',
            instagram_handle: instagramHandle,
            blog_url: blogUrl,
            youtube_channel: youtubeChannel
          }))
          console.log('✅ influencer_profiles에서 운영채널 정보만 로드:', {
            instagram: instagramHandle,
            blog: blogUrl,
            youtube: youtubeChannel
          })
        } else {
          // 프로필이 없으면 기본 사용자 정보로만 초기화
          setFormData(prev => ({
            ...prev,
            name: user.name || user.admin_name || '',
            email: user.email || ''
          }))
        }
      }
    } catch (error) {
      console.error('❌ 사용자 프로필 불러오기 실패:', error)
      // 에러가 발생해도 기본 사용자 정보로 초기화
      setFormData(prev => ({
        ...prev,
        name: user.name || user.admin_name || '',
        email: user.email || ''
      }))
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleAddressChange = (address: string, detailedAddress: string) => {
    setFormData(prev => ({
      ...prev,
      address,
      detailed_address: detailedAddress
    }))
  }

  const handlePhoneChange = (phone: string) => {
    setFormData(prev => ({
      ...prev,
      phone
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다')
      return
    }

    // 프로필 필수 정보 체크 (실명)
    if (!user.name) {
      toast.error('프로필을 먼저 완성해주세요!', {
        duration: 4000
      })
      setTimeout(() => {
        window.location.href = '/mypage'
      }, 1000)
      return
    }

    // 🔥 운영채널 (SNS) 등록 여부 체크
    try {
      const userId = user.id || user.user_id || (user as any)._id

      // influencer_profiles에서 SNS 정보 확인 (우선)
      let hasSNS = false
      try {
        const influencerProfiles = await (dataService.entities as any).influencer_profiles.list()
        const influencerProfile = Array.isArray(influencerProfiles)
          ? influencerProfiles.find((p: any) => p && p.user_id === userId)
          : null

        if (influencerProfile) {
          hasSNS = !!(
            influencerProfile.naver_blog ||
            influencerProfile.instagram_id ||
            influencerProfile.youtube_channel ||
            influencerProfile.tiktok_id ||
            influencerProfile.facebook_page
          )
          console.log('✅ influencer_profiles SNS 체크:', hasSNS, influencerProfile)
        }
      } catch (influencerError) {
        console.log('⚠️ influencer_profiles 조회 실패 (무시):', influencerError)
      }

      // influencer_profiles에 없으면 user_profiles에서 확인
      if (!hasSNS) {
        const userProfiles = await (dataService.entities as any).user_profiles.list()
        const userProfile = Array.isArray(userProfiles)
          ? userProfiles.find((p: any) => p && p.user_id === userId)
          : null

        if (userProfile) {
          hasSNS = !!(
            userProfile.naver_blog ||
            userProfile.instagram_id ||
            userProfile.youtube_channel ||
            userProfile.tiktok_id ||
            userProfile.facebook_page
          )
          console.log('✅ user_profiles SNS 체크:', hasSNS, userProfile)
        }
      }

      if (!hasSNS) {
        // SNS 미등록 시 안내 모달 표시
        if (confirm('운영채널을 등록해 주세요!\n\n네이버 블로그, 인스타그램, 유튜브, 틱톡, 페이스북 중\n최소 1개 이상의 운영채널을 등록해야 신청할 수 있습니다.\n\n프로필 페이지의 운영채널 탭으로 이동하시겠습니까?')) {
          window.location.href = '/mypage?tab=channels'
        }
        return
      }
    } catch (error) {
      console.error('❌ SNS 채널 확인 실패:', error)
      // 에러가 발생해도 신청은 계속 진행
    }

    if (!targetCampaign?.id) {
      toast.error('캠페인 정보가 없습니다')
      return
    }

    // 마감 상태 체크
    const status = targetCampaign.status || targetCampaign.campaign_status
    const maxParticipants = targetCampaign.max_participants
    const currentParticipants = targetCampaign.current_participants || 0
    
    // 상태 체크
    if (status === 'closed' || status === 'inactive') {
      toast.error('이 캠페인은 마감되었습니다.')
      return
    }
    
    // 모집 인원 체크
    if (maxParticipants && currentParticipants >= maxParticipants) {
      toast.error('모집 인원이 마감되었습니다.')
      return
    }
    
    // 신청 마감일 체크
    const applicationEndDate = targetCampaign.application_end_date || 
                             targetCampaign.application_end ||
                             targetCampaign.end_date
    if (applicationEndDate) {
      const endDate = new Date(applicationEndDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      
      if (endDate < today) {
        toast.error('신청 기간이 마감되었습니다.')
        return
      }
    }

    // 🔥 신청 전 사용자 ID 최종 확인 및 로깅
    console.log('📝 신청 제출 시작 - 사용자 정보 최종 확인:')
    console.log('👤 현재 로그인 사용자:', user)
    console.log('🆔 사용할 사용자 ID:', user.id || user.user_id || (user as any)._id)
    console.log('📋 캠페인 ID:', targetCampaign._id)
    console.log('📝 신청 데이터:', formData)

    // 필수 필드 검증
    const requiredFields = ['name', 'email', 'phone', 'address', 'platform_type']
    const missingFields = requiredFields.filter(field => !formData[field as keyof typeof formData])
    
    if (missingFields.length > 0) {
      toast.error(`필수 정보를 입력해주세요: ${missingFields.join(', ')}`)
      return
    }

    try {
      // 🔥 사용자 ID 확정
      const userId = user.id || user.user_id || (user as any)._id
      
      // 🔥 users 테이블에 사용자 존재 여부 확인 및 생성
      try {
        const existingUsers = await (dataService.entities as any).users.list()
        const userExists = existingUsers.some((u: any) => u.user_id === userId)

        if (!userExists) {
          console.log('🔍 사용자를 users 테이블에 생성합니다:', userId)
          await (dataService.entities as any).users.create({
            user_id: userId,
            name: user.name || user.admin_name || '사용자',
            email: user.email || '',
            role: user.role || 'user',
            created_at: new Date().toISOString()
          })
          console.log('✅ 사용자 생성 완료')
        }
      } catch (userCreateError) {
        console.warn('⚠️ 사용자 생성 실패, 신청은 계속 진행합니다:', userCreateError)
      }

      // 🔥 user_profiles 테이블에 휴대폰번호 및 신청 정보 업데이트
      try {
        const existingProfiles = await (dataService.entities as any).user_profiles.list()
        const userProfile = existingProfiles.find((p: any) => p.user_id === userId)

        if (userProfile) {
          // 프로필이 이미 있으면 업데이트
          console.log('📝 user_profiles 업데이트:', userId)
          await (dataService.entities as any).user_profiles.update(userProfile.id, {
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            detailed_address: formData.detailed_address,
            instagram_handle: formData.instagram_handle || userProfile.instagram_handle,
            blog_url: formData.blog_url || userProfile.blog_url,
            youtube_channel: formData.youtube_channel || userProfile.youtube_channel,
            updated_at: new Date().toISOString()
          })
          console.log('✅ user_profiles 업데이트 완료')
        } else {
          // 프로필이 없으면 새로 생성
          console.log('🔍 user_profiles 생성:', userId)
          await (dataService.entities as any).user_profiles.create({
            user_id: userId,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            address: formData.address,
            detailed_address: formData.detailed_address,
            instagram_handle: formData.instagram_handle,
            blog_url: formData.blog_url,
            youtube_channel: formData.youtube_channel,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          console.log('✅ user_profiles 생성 완료')
        }
      } catch (profileError) {
        console.warn('⚠️ user_profiles 업데이트 실패, 신청은 계속 진행합니다:', profileError)
      }

      // 🔥 신청 데이터에 정확한 사용자 ID 포함
      const now = new Date().toISOString()
      const applicationData = {
        ...formData,
        // 🔥 다중 사용자 ID 보장 (우선순위: id > user_id > _id)
        user_id: userId,
        // 🔥 연락처 정보 명시적 저장
        user_phone: formData.phone,
        phone: formData.phone,
        // 🔥 신청자 한마디 타임스탬프 추가
        ...(formData.applicant_comment && formData.applicant_comment.trim() !== '' && {
          comment_created_at: now,
          comment_updated_at: now
        }),
        // 🔥 추가 사용자 정보 (디버깅용)
        original_user_object: user,
        submitted_by_role: user.role,
        submitted_by_admin_role: user.admin_role,
        debug_info: {
          login_id: user.id,
          user_id: user.user_id,
          _id: (user as any)._id,
          submission_timestamp: now
        }
      }

      console.log('🚀 최종 신청 데이터:', applicationData)

      const result = await applyForCampaign(
        targetCampaign.id,
        userId,
        applicationData
      )

      if (result && result.success) {
        console.log('✅ 신청 성공!')

        // 신청 완료 알림톡 자동 발송
        try {
          const campaignName = targetCampaign.campaign_name || targetCampaign.experience_name || targetCampaign.title
          const brandName = targetCampaign.brand_name || targetCampaign.company || ''
          const applicationDate = new Date().toLocaleDateString('ko-KR')

          await alimtalkService.sendApplicationSubmittedAlimtalk(
            formData.phone,
            formData.name,
            campaignName,
            brandName,
            applicationDate
          )
          console.log('✅ 신청 완료 알림톡 발송 완료')
        } catch (alimtalkError) {
          console.error('⚠️ 신청 완료 알림톡 발송 실패:', alimtalkError)
          // 알림톡 실패해도 신청은 완료된 것으로 처리
        }

        onClose()
        if (onSuccess) onSuccess()
      } else {
        console.error('❌ 신청 실패:', result)
        if (result && result.reason === 'duplicate') {
          toast.error('이미 신청하신 캠페인입니다')
        } else if (result && result.reason === 'full') {
          toast.error('모집인원이 마감되었습니다')
        } else {
          toast.error('신청에 실패했습니다. 다시 시도해주세요.')
        }
      }
    } catch (error) {
      console.error('❌ 신청 제출 실패:', error)
      toast.error('신청 제출에 실패했습니다')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose}></div>
        
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
          {/* 헤더 */}
          <div className="bg-white border-b border-gray-200 px-6 py-6 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                {/* 캠페인 타입 표시 */}
                <div className="flex items-center mb-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-600">
                      {(() => {
                        const campaignType = targetCampaign?.experience_type || targetCampaign?.campaign_type || targetCampaign?.type || 'purchase_review'
                        const typeLabels: { [key: string]: string } = {
                          'purchase_review': '구매평 캠페인',
                          'product': '제품 체험 캠페인',
                          'press': '언론 체험 캠페인',
                          'local': '지역 체험 캠페인'
                        }
                        return typeLabels[campaignType] || '체험단 캠페인'
                      })()}
                    </span>
                  </div>
                </div>
                
                {/* 메인 타이틀 */}
                <h2 className="text-3xl font-bold text-gray-900 mb-2">
                  {targetCampaign?.title || targetCampaign?.experience_name || '체험단 신청'}
                </h2>
                
                {/* 캠페인 설명 */}
                <p className="text-gray-600 text-base leading-relaxed">
                  {(() => {
                    const campaignType = targetCampaign?.experience_type || targetCampaign?.campaign_type || targetCampaign?.type || 'purchase_review'
                    if (campaignType === 'purchase_review') {
                      return '제품을 직접 구매하고, 블로그 콘텐츠와 쇼핑몰 구매후기를 추가 작성하는 캠페인입니다.'
                    } else if (campaignType === 'product') {
                      return '제품을 체험하고 솔직한 후기를 작성하는 캠페인입니다.'
                    } else if (campaignType === 'press') {
                      return '언론 매체를 통해 제품을 소개하는 캠페인입니다.'
                    } else if (campaignType === 'local') {
                      return '지역 특색을 살린 체험 콘텐츠를 제작하는 캠페인입니다.'
                    }
                    return '제품을 체험하고 솔직한 후기를 작성하는 캠페인입니다.'
                  })()}
                </p>
              </div>
              
              {/* 우측 아이콘들 */}
              <div className="flex items-center space-x-3 ml-6">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <Star className="w-4 h-4 text-green-600" />
                </div>
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-vintage-600 font-bold text-sm">B</span>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors ml-4"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>


          {/* 폼 내용 */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* 기본 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <User className="w-5 h-5 mr-2" />
                기본 정보
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이름 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    placeholder="실명을 입력해주세요"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    이메일 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    placeholder="example@email.com"
                    required
                  />
                </div>
              </div>

              <PhoneInput
                value={formData.phone}
                onChange={handlePhoneChange}
                required
              />

              <AddressInput
                address={formData.address}
                detailedAddress={formData.detailed_address}
                onAddressChange={handleAddressChange}
                required
              />
            </div>

            {/* 🔥 제품 선택 섹션 (제품이 2개 이상일 때만 표시) */}
            {campaignProducts.length > 1 && (
              <div className="space-y-4 bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-xl border-2 border-purple-200">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Package className="w-5 h-5 mr-2 text-purple-600" />
                  체험 제품 선택 <span className="text-red-500 ml-1">*</span>
                </h3>
                <p className="text-sm text-gray-600">
                  체험하고 싶은 제품을 복수 선택할 수 있습니다.
                </p>

                <div className="grid grid-cols-1 gap-3">
                  {campaignProducts.map((product) => {
                    const isSelected = selectedProducts.some(p => p.id === product.id)
                    return (
                      <div
                        key={product.id}
                        onClick={() => {
                          if (isSelected) {
                            // 이미 선택된 제품이면 제거
                            setSelectedProducts(prev => prev.filter(p => p.id !== product.id))
                          } else {
                            // 선택되지 않은 제품이면 추가
                            setSelectedProducts(prev => [...prev, product])
                          }
                          // selected_product_id는 첫 번째 선택된 제품의 ID로 설정
                          setFormData(prev => ({
                            ...prev,
                            selected_product_id: isSelected
                              ? (selectedProducts.filter(p => p.id !== product.id)[0]?.id || '')
                              : (selectedProducts[0]?.id || product.id)
                          }))
                        }}
                        className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          isSelected
                            ? 'border-purple-500 bg-white shadow-md'
                            : 'border-gray-300 hover:border-purple-300 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{product.product_name}</h4>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {product.allowed_platforms?.map((platform: string) => {
                                const platformInfo: { [key: string]: { icon: string; label: string } } = {
                                  review: { icon: '⭐', label: '구매후기' },
                                  blog: { icon: '📝', label: '블로그' },
                                  naver: { icon: '🟢', label: '네이버' },
                                  instagram: { icon: '📸', label: '인스타그램' },
                                  youtube: { icon: '🎥', label: '유튜브' },
                                  tiktok: { icon: '🎵', label: '틱톡' },
                                  product: { icon: '🧪', label: '제품 체험' },
                                  press: { icon: '📰', label: '기자단' },
                                  local: { icon: '🏘️', label: '지역 체험' },
                                  other: { icon: '🔧', label: '기타' }
                                }
                                const info = platformInfo[platform] || { icon: '🔧', label: platform }
                                return (
                                  <span key={platform} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                                    {info.icon} {info.label}
                                  </span>
                                )
                              })}
                            </div>
                          </div>
                          <div className={`w-6 h-6 border-2 rounded flex items-center justify-center ml-3 transition-all ${
                            isSelected
                              ? 'bg-purple-500 border-purple-500'
                              : 'border-gray-300'
                          }`}>
                            {isSelected && (
                              <svg className="w-4 h-4 text-white" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                <path d="M5 13l4 4L19 7"></path>
                              </svg>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {selectedProducts.length > 0 && (
                  <p className="text-sm text-purple-600 font-medium">
                    ✓ {selectedProducts.length}개 제품 선택됨
                  </p>
                )}

                {selectedProducts.length === 0 && (
                  <p className="text-red-500 text-sm">최소 1개 이상의 제품을 선택해주세요.</p>
                )}
              </div>
            )}

            {/* SNS 정보 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">SNS 정보</h3>

              {/* 플랫폼 타입 선택 - 리뷰넷 스타일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  참여 플랫폼 <span className="text-red-500">*</span>
                </label>
                {/* 🔥 제품이 선택되지 않았을 때 안내 메시지 */}
                {campaignProducts.length > 1 && selectedProducts.length === 0 ? (
                  <p className="text-sm text-gray-500 p-4 bg-gray-50 rounded-lg border border-gray-200">
                    먼저 체험 제품을 선택해주세요.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {/* 🔥 선택된 제품들의 플랫폼을 합쳐서 표시 */}
                  {(() => {
                    // 선택된 모든 제품의 플랫폼을 합침 (중복 제거)
                    const availablePlatforms = Array.from(new Set(
                      selectedProducts.flatMap(product => product.allowed_platforms || [])
                    ))

                    const allPlatforms = [
                      { value: 'review', label: '구매후기', icon: '⭐', color: 'vintage', bgColor: 'bg-blue-50', borderColor: 'border-vintage-500' },
                      { value: 'blog', label: 'Blog', labelKo: '블로그 포스트', icon: '📝', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
                      { value: 'naver', label: 'Naver', labelKo: '네이버', icon: '🟢', color: 'green', bgColor: 'bg-green-50', borderColor: 'border-green-500' },
                      { value: 'instagram', label: 'Instagram', labelKo: '인스타그램 포스트', icon: '📸', color: 'pink', bgColor: 'bg-pink-50', borderColor: 'border-pink-500' },
                      { value: 'youtube', label: 'YouTube', labelKo: '유튜브 영상', icon: '🎥', color: 'red', bgColor: 'bg-red-50', borderColor: 'border-red-500' },
                      { value: 'tiktok', label: 'TikTok', labelKo: '틱톡', icon: '🎵', color: 'purple', bgColor: 'bg-purple-50', borderColor: 'border-purple-500' },
                      { value: 'product', label: 'Product', labelKo: '제품 체험', icon: '🧪', color: 'orange', bgColor: 'bg-orange-50', borderColor: 'border-orange-500' },
                      { value: 'press', label: 'Press', labelKo: '기자단', icon: '📰', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-500' },
                      { value: 'local', label: 'Local', labelKo: '지역 체험', icon: '🏘️', color: 'yellow', bgColor: 'bg-yellow-50', borderColor: 'border-yellow-500' },
                      { value: 'other', label: 'Other', labelKo: '기타', icon: '🔧', color: 'gray', bgColor: 'bg-gray-50', borderColor: 'border-gray-500' }
                    ]

                    return allPlatforms
                      .filter(platform => availablePlatforms.includes(platform.value))
                      .map(platform => (
                        <div
                          key={platform.value}
                          className={`relative p-4 border-2 rounded-lg cursor-pointer transition-all ${
                            formData.platform_type === platform.value
                              ? `${platform.borderColor} ${platform.bgColor}`
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                          onClick={() => setFormData(prev => ({ ...prev, platform_type: platform.value }))}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-medium text-gray-900">{platform.label}</h4>
                              {platform.labelKo && (
                                <p className="text-xs text-gray-600 mt-1">{platform.labelKo}</p>
                              )}
                              {platform.value === 'review' && (
                                <div className="flex items-center mt-1">
                                  <Star className="w-3 h-3 text-yellow-500 mr-1" />
                                  <span className="text-xs text-gray-600">5.0</span>
                                </div>
                              )}
                            </div>
                            <div className={`w-8 h-8 ${platform.bgColor.replace('bg-', 'bg-').replace('-50', '-100')} rounded-full flex items-center justify-center`}>
                              <span className="font-bold text-xs">{platform.icon}</span>
                            </div>
                          </div>
                          <div className="mt-2">
                            <div className={`${platform.value === 'review' ? 'w-12 h-8' : platform.value === 'blog' || platform.value === 'naver' ? 'w-16 h-10' : platform.value === 'instagram' ? 'w-12 h-12' : 'w-16 h-9'} bg-gray-200 rounded`}></div>
                            <div className="mt-1 space-y-1">
                              <div className="h-1 bg-gray-200 rounded"></div>
                              <div className="h-1 bg-gray-200 rounded w-3/4"></div>
                              {(platform.value === 'blog' || platform.value === 'naver') && (
                                <div className="h-1 bg-gray-200 rounded w-1/2"></div>
                              )}
                            </div>
                          </div>
                          {formData.platform_type === platform.value && (
                            <div className={`absolute top-2 right-2 w-4 h-4 ${platform.borderColor.replace('border-', 'bg-')} rounded-full flex items-center justify-center`}>
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                        </div>
                      ))
                  })()}
                </div>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    인스타그램 계정
                  </label>
                  <input
                    type="text"
                    name="instagram_handle"
                    value={formData.instagram_handle}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    placeholder="@username"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    name="blog_url"
                    value={formData.blog_url}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    placeholder="https://blog.example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    유튜브 채널
                  </label>
                  <input
                    type="url"
                    name="youtube_channel"
                    value={formData.youtube_channel}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                    placeholder="https://youtube.com/@channel"
                  />
                </div>
              </div>
            </div>

            {/* 신청 사유 */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2" />
                신청 정보
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  신청 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="application_reason"
                  value={formData.application_reason}
                  onChange={handleInputChange}
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent resize-none"
                  placeholder="이 체험단에 신청하는 이유를 자세히 작성해주세요"
                  required
                />
              </div>
            </div>

            {/* 신청자 한마디 */}
            <div className="space-y-4 bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl border border-purple-100">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <MessageSquare className="w-5 h-5 mr-2 text-purple-600" />
                신청자 한마디
              </h3>
              <p className="text-sm text-gray-600">
                다른 신청자들과 공유하고 싶은 메시지를 남겨보세요! (선택사항)
              </p>

              <div>
                <textarea
                  name="applicant_comment"
                  value={formData.applicant_comment}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={200}
                  className="w-full px-4 py-3 border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none bg-white"
                  placeholder="예: 이 제품이 너무 궁금해서 신청합니다! 좋은 리뷰 남기겠습니다 😊 (최대 200자)"
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    💡 작성하시면 캠페인 상세페이지의 '신청자 한마디' 탭에 표시됩니다
                  </p>
                  <span className="text-xs text-gray-500">
                    {formData.applicant_comment.length} / 200
                  </span>
                </div>
              </div>
            </div>

            {/* 제출 버튼 */}
            <div className="flex space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-6 py-3 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '신청 중...' : '신청하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

// 🔥 기본 export도 추가
export default ApplicationFormModal
