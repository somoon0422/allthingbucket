
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'
import { useSearchParams, useNavigate } from 'react-router-dom'

// Lumi SDK 제거됨 - Supabase API 사용
import toast from 'react-hot-toast'
import {User, Instagram, Youtube, MessageSquare, Star, Award, Save, Edit3, X, TrendingUp, Globe, Shield, Tag, FileText, Heart, Coins, Menu} from 'lucide-react'
import { PhoneInput } from '../components/PhoneInput'
import ProfileCompletionModal from '../components/ProfileCompletionModal'
import ChatBot from '../components/ChatBot'

const MyPage: React.FC = () => {
  const { user, updateUser } = useAuth()
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [sidebarSection, setSidebarSection] = useState(searchParams.get('section') || 'applications')
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'basic')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [userCode, setUserCode] = useState<string>('')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showCompletionModal, setShowCompletionModal] = useState(false)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    email: '',
    birth_date: '',
    birth_year: '',
    birth_month: '',
    birth_day: '',
    gender: '',
    address: {
      city: '',
      district: '',
      street: '',
      zipcode: ''
    },
    naver_blog: '',
    instagram_id: '',
    youtube_channel: '',
    tiktok_id: '',
    facebook_page: '',
    other_sns: '',
    follower_counts: {
      instagram: 0,
      youtube: 0,
      tiktok: 0,
      naver_blog: 0,
      facebook: 0
    },
    categories: [] as string[],
    experience_level: 'beginner',
    tax_info: {
      resident_number_encrypted: '',
      tax_type: 'individual'
    }
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  // URL 파라미터 변경 시 섹션/탭 업데이트
  useEffect(() => {
    const section = searchParams.get('section')
    const tab = searchParams.get('tab')
    if (section) {
      setSidebarSection(section)
    }
    if (tab) {
      setActiveTab(tab)
    }
  }, [searchParams])

  // 사이드바 섹션 변경 핸들러
  const handleSectionChange = (section: string) => {
    // 나의캠페인, 관심캠페인, 나의포인트는 각각의 페이지로 이동
    if (section === 'applications') {
      navigate('/my-applications')
      return
    }
    if (section === 'wishlist') {
      navigate('/wishlist')
      return
    }
    if (section === 'points') {
      navigate('/points')
      return
    }

    // 프로필관리만 이 페이지에서 처리
    setSidebarSection(section)
    setSearchParams({ section })
    setIsSidebarOpen(false) // 모바일에서 선택 후 사이드바 닫기
  }

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)

      // 🔍 dataService 확인
      if (!dataService?.entities?.user_codes) {
        console.error('❌ user_codes 서비스가 없습니다')
        toast.error('user_codes 서비스에 문제가 있습니다')
        return
      }

      // 🏷️ 사용자 회원코드 조회 (수정 불가) - Supabase API 사용
      const codes = await dataService.entities.user_codes.list()
      const userCodeData = codes.find((code: any) => code && code.user_id === user.user_id)

      if (userCodeData && userCodeData.user_code) {
        setUserCode(userCodeData.user_code)
        console.log('🏷️ 사용자 회원코드 확인:', userCodeData.user_code)
      }

      // 먼저 user_profiles에서 기본 정보 확인 - Supabase API 사용
      const userProfiles = await (dataService.entities as any).user_profiles.list()
      const userProfile = Array.isArray(userProfiles) 
        ? userProfiles.find((p: any) => p && p.user_id === user.user_id)
        : null
      
      // influencer_profiles에서 상세 정보 확인 - Supabase API 사용
      const influencerProfiles = dataService.entities.influencer_profiles 
        ? await dataService.entities.influencer_profiles.list()
        : []
      const influencerProfile = influencerProfiles.find((p: any) => p && p.user_id === user.user_id)
      
      if (influencerProfile) {
        setProfile(influencerProfile)
        setFormData({
          full_name: user.name || '',  // users 테이블에서 가져옴
          phone: influencerProfile.phone || userProfile?.phone || '',
          email: user.email || '',
          birth_date: influencerProfile.birth_date ? influencerProfile.birth_date.split('T')[0] : '',
          birth_year: influencerProfile.birth_date ? influencerProfile.birth_date.split('T')[0].split('-')[0] : '',
          birth_month: influencerProfile.birth_date ? influencerProfile.birth_date.split('T')[0].split('-')[1] : '',
          birth_day: influencerProfile.birth_date ? influencerProfile.birth_date.split('T')[0].split('-')[2] : '',
          gender: influencerProfile.gender || '',
          address: influencerProfile.address || {
            city: '',
            district: '',
            street: '',
            zipcode: ''
          },
          naver_blog: influencerProfile.naver_blog || '',
          instagram_id: influencerProfile.instagram_id || '',
          youtube_channel: influencerProfile.youtube_channel || '',
          tiktok_id: influencerProfile.tiktok_id || '',
          facebook_page: influencerProfile.facebook_page || '',
          other_sns: influencerProfile.other_sns || '',
          follower_counts: influencerProfile.follower_counts || {
            instagram: 0,
            youtube: 0,
            tiktok: 0,
            naver_blog: 0,
            facebook: 0
          },
          categories: influencerProfile.categories || [],
          experience_level: influencerProfile.experience_level || 'beginner',
          tax_info: influencerProfile.tax_info || {
            resident_number_encrypted: '',
            tax_type: 'individual'
          }
        })
      } else if (userProfile) {
        // 기본 프로필만 있는 경우
        setProfile(userProfile)
        setFormData(prev => ({
          ...prev,
          full_name: user.name || '',  // users 테이블에서 가져옴
          phone: userProfile.phone || '',
          email: user.email || '',
        }))
      } else {
        // 신규 사용자
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: user.name || ''
        }))
      }

      // 필수 필드 체크
      const missing: string[] = []

      // 1. 실명 체크
      if (!user.name) {
        missing.push('name')
      }

      // 2. 전화번호 체크
      const currentPhone = influencerProfile?.phone || userProfile?.phone
      if (!currentPhone) {
        missing.push('phone')
      }

      // 3. SNS 계정 최소 1개 체크
      const hasSNS = influencerProfile && (
        influencerProfile.instagram_id ||
        influencerProfile.youtube_channel ||
        influencerProfile.tiktok_id ||
        influencerProfile.naver_blog
      )
      if (!hasSNS) {
        missing.push('sns')
      }

      setMissingFields(missing)

      // 프로필 미완성 시 안내 모달 표시
      if (missing.length > 0) {
        setShowCompletionModal(true)
        setEditMode(true) // 자동으로 편집 모드 활성화
      }
    } catch (error) {
      console.error('프로필 로딩 실패:', error)
      toast.error('프로필 정보를 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) {
      toast.error('사용자 정보를 불러오는 중입니다')
      return
    }

    // 필수 정보 확인
    if (!formData.full_name || !formData.phone) {
      toast.error('실명과 전화번호는 필수 입력 항목입니다')
      return
    }

    setSaving(true)
    try {
      // 1. users 테이블에 full_name 저장
      try {
        const usersResponse = await (dataService.entities as any).users.list()
        const dbUser = Array.isArray(usersResponse)
          ? usersResponse.find((u: any) => u.user_id === user.user_id)
          : null

        if (dbUser && formData.full_name) {
          await (dataService.entities as any).users.update(dbUser.id, {
            name: formData.full_name,
            updated_at: new Date().toISOString()
          })
          console.log('✅ users 테이블에 이름 저장 완료')
        }
      } catch (nameUpdateError) {
        console.error('이름 저장 실패:', nameUpdateError)
      }

      // 2. influencer_profiles 테이블의 실제 스키마에 맞춰 필드 구성
      // platform: 주요 활동 플랫폼 결정 (팔로워가 가장 많은 플랫폼)
      let mainPlatform = 'instagram' // 기본값
      const followerCounts = formData.follower_counts
      const platforms = [
        { name: 'instagram', count: followerCounts.instagram, handle: formData.instagram_id },
        { name: 'youtube', count: followerCounts.youtube, handle: formData.youtube_channel },
        { name: 'tiktok', count: followerCounts.tiktok, handle: formData.tiktok_id },
        { name: 'naver_blog', count: followerCounts.naver_blog, handle: formData.naver_blog }
      ]
      const maxPlatform = platforms.reduce((max, p) => p.count > max.count ? p : max, platforms[0])
      if (maxPlatform.count > 0) {
        mainPlatform = maxPlatform.name
      }

      // handle: 주요 플랫폼의 계정 아이디 (필수)
      let mainHandle = formData.instagram_id || formData.youtube_channel || formData.tiktok_id || formData.naver_blog || user.email || 'user'
      const selectedPlatform = platforms.find(p => p.name === mainPlatform)
      if (selectedPlatform && selectedPlatform.handle) {
        mainHandle = selectedPlatform.handle
      }

      // 총 팔로워 수 계산
      const totalFollowers = Object.values(followerCounts).reduce((sum: number, count: any) => sum + (count || 0), 0)

      const profileData: any = {
        user_id: user.user_id,
        platform: mainPlatform,
        handle: mainHandle,
        follower_count: totalFollowers, // 총 팔로워 수
        phone: formData.phone,
        gender: formData.gender || null,
        naver_blog: formData.naver_blog || null,
        instagram_id: formData.instagram_id || null,
        youtube_channel: formData.youtube_channel || null,
        tiktok_id: formData.tiktok_id || null,
        facebook_page: formData.facebook_page || null,
        other_sns: formData.other_sns || null,
        follower_counts: formData.follower_counts,
        categories: formData.categories,
        experience_level: formData.experience_level,
      }

      // birth_date가 있으면 추가
      if (formData.birth_date) {
        profileData.birth_date = new Date(formData.birth_date).toISOString()
      }

      // address가 있으면 추가
      if (formData.address && (formData.address.street || formData.address.district)) {
        profileData.address = formData.address
      }

      // tax_info가 있으면 추가
      if (formData.tax_info) {
        profileData.tax_info = formData.tax_info
      }

      if (profile && profile._id) {
        // influencer_profiles 업데이트 - Supabase API 사용
        const result = await (dataService.entities as any).influencer_profiles.update(profile._id, profileData)
        if (result.success) {
          toast.success('프로필이 업데이트되었습니다')
        } else {
          toast.error('프로필 업데이트에 실패했습니다')
        }
      } else {
        // 새 influencer_profile 생성 - Supabase API 사용
        const result = await (dataService.entities as any).influencer_profiles.create(profileData)

        // Supabase는 성공시 생성된 데이터를 직접 반환함 (result.id가 있으면 성공)
        if (result && result.id) {
          console.log('✅ 프로필 생성 성공:', result)
          toast.success('프로필이 생성되었습니다')

          // 축하 메시지
          setTimeout(() => {
            toast.success('🎉 프로필이 완성되었습니다! 이제 캠페인에 신청할 수 있어요!', {
              duration: 4000
            })
          }, 500)
        } else {
          console.error('프로필 생성 실패:', result)
          toast.error('프로필 생성에 실패했습니다')
        }
      }

      setEditMode(false)
      loadProfile() // 데이터 새로고침
    } catch (error) {
      console.error('프로필 저장 실패:', error)
      toast.error('프로필 저장에 실패했습니다')
    } finally {
      setSaving(false)
    }
  }


  const handleCancel = () => {
    loadProfile() // 원래 데이터로 복원
    setEditMode(false)
  }

  const handleCategoryToggle = (category: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(category)
        ? prev.categories.filter(c => c !== category)
        : [...prev.categories, category]
    }))
  }

  const availableCategories = [
    'beauty', 'fashion', 'lifestyle', 'food', 'tech', 
    'travel', 'health', 'fitness', 'education', 'parenting'
  ]

  const getCategoryLabel = (category: string) => {
    const labels: Record<string, string> = {
      beauty: '뷰티',
      fashion: '패션',
      lifestyle: '라이프스타일',
      food: '푸드',
      tech: '테크/IT',
      travel: '여행',
      health: '헬스/건강',
      fitness: '피트니스',
      education: '교육',
      parenting: '육아'
    }
    return labels[category] || category
  }

  // 탭 변경 핸들러
  const handleTabChange = (tab: string) => {
    setActiveTab(tab)
    setSearchParams({ tab })
  }


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  // 사이드바 메뉴 항목
  const sidebarMenuItems = [
    { id: 'applications', label: '나의캠페인', sublabel: '내신청', icon: FileText },
    { id: 'wishlist', label: '관심캠페인', sublabel: '찜목록', icon: Heart },
    { id: 'points', label: '나의포인트', icon: Coins },
    { id: 'profile', label: '프로필관리', icon: User },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 페이지 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <img src="/logo.png" alt="올띵버킷 로고" className="w-10 h-10" />
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">마이페이지</h1>
                <p className="text-sm text-gray-600">
                  내 활동과 정보를 관리하세요
                </p>
              </div>
            </div>

            {/* 모바일 메뉴 버튼 */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* 사이드바 */}
          <aside className={`
            lg:block lg:w-64 flex-shrink-0
            ${isSidebarOpen ? 'fixed inset-0 z-50 bg-black bg-opacity-50 lg:bg-transparent' : 'hidden'}
          `}
          onClick={() => setIsSidebarOpen(false)}
          >
            <div
              className="lg:sticky lg:top-6 bg-white rounded-xl shadow-sm border p-4 lg:p-6 h-fit lg:max-h-[calc(100vh-120px)] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <nav className="space-y-2">
                {sidebarMenuItems.map((item) => {
                  const Icon = item.icon
                  const isActive = sidebarSection === item.id

                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSectionChange(item.id)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all
                        ${isActive
                          ? 'bg-gradient-to-r from-vintage-50 to-navy-50 text-navy-700 border-l-4 border-navy-600 font-semibold shadow-sm'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-navy-600' : 'text-gray-500'}`} />
                      <div className="flex-1 text-left">
                        <div className="text-sm font-medium">{item.label}</div>
                        {item.sublabel && (
                          <div className="text-xs text-gray-500">{item.sublabel}</div>
                        )}
                      </div>
                    </button>
                  )
                })}
              </nav>

              {/* 회원코드 표시 (사이드바 하단) */}
              {userCode && (
                <div className="mt-6 pt-6 border-t">
                  <div className="bg-gradient-to-r from-navy-50 to-pink-50 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Shield className="w-4 h-4 text-navy-600" />
                      <p className="text-xs font-semibold text-navy-900">회원코드</p>
                    </div>
                    <p className="text-lg font-bold text-navy-600">{userCode}</p>
                    <p className="text-xs text-navy-600 mt-1">수정 불가</p>
                  </div>
                </div>
              )}
            </div>
          </aside>

          {/* 메인 콘텐츠 */}
          <main className="flex-1 min-w-0">
            {/* 프로필 관리 섹션 */}
            {sidebarSection === 'profile' && (
              <div>
                {/* 프로필 헤더 */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">프로필 관리</h2>
                      <p className="text-gray-600">개인정보, SNS 정보를 관리하세요</p>
                    </div>

                    <div className="flex items-center space-x-3">
                      {!editMode && (
                        <button
                          onClick={() => setEditMode(true)}
                          className="flex items-center space-x-2 text-navy-600 hover:text-navy-700 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>수정</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 탭 네비게이션 */}
                <div className="bg-white rounded-xl shadow-sm border mb-6">
                  <div className="flex border-b">
          <button
            onClick={() => handleTabChange('basic')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'basic'
                ? 'text-navy-600 border-b-2 border-navy-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <User className="w-5 h-5" />
            <span>기본정보</span>
          </button>
          <button
            onClick={() => handleTabChange('channels')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'channels'
                ? 'text-navy-600 border-b-2 border-navy-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>운영채널</span>
          </button>
          <button
            onClick={() => handleTabChange('categories')}
            className={`flex-1 flex items-center justify-center space-x-2 px-6 py-4 font-medium transition-colors ${
              activeTab === 'categories'
                ? 'text-navy-600 border-b-2 border-navy-600 bg-purple-50'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
            }`}
          >
            <Tag className="w-5 h-5" />
            <span>관심카테고리</span>
          </button>
        </div>
      </div>

      {/* 🔔 프로필 정보 채우기 공지 */}
      {(!user?.name || !profile?.phone) && activeTab === 'basic' && (
        <div className="bg-gradient-to-r from-vintage-50 to-navy-50 border-l-4 border-vintage-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-vintage-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-vintage-800">
                프로필 정보를 완성해주세요!
              </h3>
              <div className="mt-2 text-sm text-vintage-700">
                <p className="mb-2">
                  체험단 신청 시 자동으로 입력되는 정보입니다.
                  <strong>실명, 전화번호</strong>를 모두 입력해주세요.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {!user?.name && <li>실명을 입력해주세요</li>}
                  {!profile?.phone && <li>전화번호를 입력해주세요</li>}
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-3 py-2 bg-vintage-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4 mr-1" />
                  지금 완성하기
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ 회원코드 표시 (수정 불가) */}
      {userCode && (
        <div className="bg-gradient-to-r from-navy-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-navy-600" />
              <div>
                <h2 className="text-xl font-bold text-navy-900">회원코드</h2>
                <p className="text-navy-700 text-sm">본인에게 부여된 고유 회원코드입니다</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white px-6 py-3 rounded-xl shadow-sm border-2 border-purple-300">
                <p className="text-2xl font-bold text-navy-600">{userCode}</p>
              </div>
              <p className="text-xs text-navy-600 mt-2">수정 불가</p>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 기본 정보 탭 */}
      {activeTab === 'basic' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">기본 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              실명 <span className="text-red-500">*</span>
            </label>
            {editMode ? (
              <input
                type="text"
                required
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user?.name || '미입력'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              전화번호 <span className="text-red-500">*</span>
            </label>
            {editMode ? (
              <div className="space-y-3">
                <PhoneInput
                  value={formData.phone}
                  onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                  required
                  placeholder="010-1234-5678"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {profile?.phone || '미입력'}
                </p>
                {profile?.phone && (
                  <div className="flex items-center space-x-2 text-sm">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span className="text-green-600">인증 완료</span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            <div className="relative">
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {user?.email || '미입력'}
              </p>
              <p className="text-xs text-gray-500 mt-1">수정 불가 (회원가입 시 등록된 이메일)</p>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              생년월일
            </label>
            {editMode ? (
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="YYYY"
                  value={formData.birth_year}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '').slice(0, 4)
                    // 생년 유효성 검사 (1900-현재년도)
                    if (value.length === 4) {
                      const year = parseInt(value)
                      const currentYear = new Date().getFullYear()
                      if (year < 1900 || year > currentYear) {
                        value = value.slice(0, 3) // 잘못된 값이면 3자리만 유지
                      }
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      birth_year: value,
                      birth_date: value && prev.birth_month && prev.birth_day ? `${value}-${prev.birth_month.padStart(2, '0')}-${prev.birth_day.padStart(2, '0')}` : ''
                    }))
                    if (value.length === 4) {
                      document.getElementById('birth-month')?.focus()
                    }
                  }}
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent text-center"
                />
                <span className="flex items-center text-gray-500">년</span>
                <input
                  id="birth-month"
                  type="text"
                  placeholder="MM"
                  value={formData.birth_month}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '').slice(0, 2)
                    // 월 유효성 검사 (01-12)
                    if (value.length === 2) {
                      const month = parseInt(value)
                      if (month < 1 || month > 12) {
                        value = value.slice(0, 1) // 잘못된 값이면 한 자리만 유지
                      }
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      birth_month: value,
                      birth_date: prev.birth_year && value && prev.birth_day ? `${prev.birth_year}-${value.padStart(2, '0')}-${prev.birth_day}` : ''
                    }))
                    if (value.length === 2) {
                      document.getElementById('birth-day')?.focus()
                    }
                  }}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent text-center"
                />
                <span className="flex items-center text-gray-500">월</span>
                <input
                  id="birth-day"
                  type="text"
                  placeholder="DD"
                  value={formData.birth_day}
                  onChange={(e) => {
                    let value = e.target.value.replace(/\D/g, '').slice(0, 2)
                    // 일 유효성 검사 (01-31)
                    if (value.length === 2) {
                      const day = parseInt(value)
                      if (day < 1 || day > 31) {
                        value = value.slice(0, 1) // 잘못된 값이면 한 자리만 유지
                      }
                    }
                    setFormData(prev => ({ 
                      ...prev, 
                      birth_day: value,
                      birth_date: prev.birth_year && prev.birth_month && value ? `${prev.birth_year}-${prev.birth_month.padStart(2, '0')}-${value.padStart(2, '0')}` : ''
                    }))
                  }}
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent text-center"
                />
                <span className="flex items-center text-gray-500">일</span>
              </div>
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.birth_date ? new Date(profile.birth_date).toLocaleDateString('ko-KR') : '미입력'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              성별
            </label>
            {editMode ? (
              <select
                value={formData.gender}
                onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              >
                <option value="">선택하세요</option>
                <option value="male">남성</option>
                <option value="female">여성</option>
                <option value="other">기타</option>
              </select>
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.gender === 'male' ? '남성' : 
                 profile?.gender === 'female' ? '여성' : 
                 profile?.gender === 'other' ? '기타' : '미입력'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              체험단 경험 수준
            </label>
            {editMode ? (
              <select
                value={formData.experience_level}
                onChange={(e) => setFormData(prev => ({ ...prev, experience_level: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              >
                <option value="beginner">초급 (1-5회)</option>
                <option value="intermediate">중급 (6-20회)</option>
                <option value="expert">고급 (21회 이상)</option>
              </select>
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.experience_level === 'beginner' ? '초급 (1-5회)' :
                 profile?.experience_level === 'intermediate' ? '중급 (6-20회)' :
                 profile?.experience_level === 'expert' ? '고급 (21회 이상)' : '미입력'}
              </p>
            )}
          </div>
        </div>
        </div>
      )}

      {/* 🔹 운영채널 (SNS) 탭 */}
      {activeTab === 'channels' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">운영채널 등록</h2>
          <p className="text-gray-600 mb-6">네이버 블로그, 인스타그램, 유튜브, 틱톡, 페이스북 중 최소 1개 이상 등록해주세요.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Instagram className="w-4 h-4 inline mr-1" />
              인스타그램 아이디
            </label>
            {editMode ? (
              <div className="flex">
                <input
                  type="text"
                  value={formData.instagram_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, instagram_id: e.target.value }))}
                  placeholder="@your_instagram"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                <div className="ml-2">
                  <label className="block text-xs text-gray-500 mb-1">팔로워 수</label>
                  <input
                    type="number"
                    value={formData.follower_counts.instagram === 0 ? '' : formData.follower_counts.instagram}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      follower_counts: { ...prev.follower_counts, instagram: Number(e.target.value) || 0 } 
                    }))}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.value = ''
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.value = '0'
                      }
                    }}
                    placeholder="0"
                    className="w-20 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <p className="font-medium text-gray-900">{profile?.instagram_id || '미입력'}</p>
                {profile?.follower_counts?.instagram > 0 && (
                  <p className="text-sm text-gray-500">팔로워 {profile.follower_counts.instagram.toLocaleString()}명</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Youtube className="w-4 h-4 inline mr-1" />
              유튜브 채널
            </label>
            {editMode ? (
              <div className="flex">
                <input
                  type="url"
                  value={formData.youtube_channel}
                  onChange={(e) => setFormData(prev => ({ ...prev, youtube_channel: e.target.value }))}
                  placeholder="https://youtube.com/c/yourchannel"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                <div className="ml-2">
                  <label className="block text-xs text-gray-500 mb-1">구독자 수</label>
                  <input
                    type="number"
                    value={formData.follower_counts.youtube === 0 ? '' : formData.follower_counts.youtube}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      follower_counts: { ...prev.follower_counts, youtube: Number(e.target.value) || 0 } 
                    }))}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.value = ''
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.value = '0'
                      }
                    }}
                    placeholder="0"
                    className="w-20 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <p className="font-medium text-gray-900">{profile?.youtube_channel || '미입력'}</p>
                {profile?.follower_counts?.youtube > 0 && (
                  <p className="text-sm text-gray-500">구독자 {profile.follower_counts.youtube.toLocaleString()}명</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              틱톡 아이디
            </label>
            {editMode ? (
              <div className="flex">
                <input
                  type="text"
                  value={formData.tiktok_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, tiktok_id: e.target.value }))}
                  placeholder="@your_tiktok"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                <div className="ml-2">
                  <label className="block text-xs text-gray-500 mb-1">팔로워 수</label>
                  <input
                    type="number"
                    value={formData.follower_counts.tiktok === 0 ? '' : formData.follower_counts.tiktok}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      follower_counts: { ...prev.follower_counts, tiktok: Number(e.target.value) || 0 } 
                    }))}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.value = ''
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.value = '0'
                      }
                    }}
                    placeholder="0"
                    className="w-20 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <p className="font-medium text-gray-900">{profile?.tiktok_id || '미입력'}</p>
                {profile?.follower_counts?.tiktok > 0 && (
                  <p className="text-sm text-gray-500">팔로워 {profile.follower_counts.tiktok.toLocaleString()}명</p>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Globe className="w-4 h-4 inline mr-1" />
              네이버 블로그
            </label>
            {editMode ? (
              <div className="flex">
                <input
                  type="url"
                  value={formData.naver_blog}
                  onChange={(e) => setFormData(prev => ({ ...prev, naver_blog: e.target.value }))}
                  placeholder="https://blog.naver.com/yourblog"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
                <div className="ml-2">
                  <label className="block text-xs text-gray-500 mb-1">이웃 수</label>
                  <input
                    type="number"
                    value={formData.follower_counts.naver_blog === 0 ? '' : formData.follower_counts.naver_blog}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      follower_counts: { ...prev.follower_counts, naver_blog: Number(e.target.value) || 0 } 
                    }))}
                    onFocus={(e) => {
                      if (e.target.value === '0') {
                        e.target.value = ''
                      }
                    }}
                    onBlur={(e) => {
                      if (e.target.value === '') {
                        e.target.value = '0'
                      }
                    }}
                    placeholder="0"
                    className="w-20 px-2 py-2 border border-gray-300 rounded text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 px-3 py-2 rounded-lg">
                <p className="font-medium text-gray-900">{profile?.naver_blog || '미입력'}</p>
                {profile?.follower_counts?.naver_blog > 0 && (
                  <p className="text-sm text-gray-500">이웃 {profile.follower_counts.naver_blog.toLocaleString()}명</p>
                )}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              기타 SNS 정보
            </label>
            {editMode ? (
              <textarea
                value={formData.other_sns}
                onChange={(e) => setFormData(prev => ({ ...prev, other_sns: e.target.value }))}
                placeholder="기타 SNS 계정이나 플랫폼 정보를 입력하세요"
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[80px]">
                {profile?.other_sns || '미입력'}
              </p>
            )}
          </div>
        </div>
        </div>
      )}

      {/* 🔹 관심 카테고리 탭 */}
      {activeTab === 'categories' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">관심 카테고리</h2>
          <p className="text-gray-600 mb-6">관심 있는 카테고리를 선택해주세요. 선택한 카테고리에 맞는 체험단을 추천해드립니다.</p>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {availableCategories.map(category => (
            <div key={category}>
              {editMode ? (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-navy-600 focus:ring-navy-500"
                  />
                  <span className="text-sm">{getCategoryLabel(category)}</span>
                </label>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  profile?.categories?.includes(category)
                    ? 'bg-purple-100 text-navy-800'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {getCategoryLabel(category)}
                </span>
              )}
            </div>
          ))}
        </div>
        </div>
      )}


      {/* 🔹 활동 통계 - 기본정보 탭에서만 표시 */}
      {profile && activeTab === 'basic' && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">활동 통계</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Award className="w-8 h-8 text-navy-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-navy-600">{profile.total_experiences || 0}</p>
              <p className="text-sm text-navy-700 mt-1">참여한 체험단</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{profile.rating || 0}</p>
              <p className="text-sm text-yellow-700 mt-1">평균 평점</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-vintage-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-vintage-600">
                {Object.values(profile.follower_counts || {}).reduce((sum: number, count: any) => sum + (count || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-vintage-700 mt-1">총 팔로워 수</p>
            </div>
          </div>
        </div>
      )}

                {/* 🔹 수정 버튼 */}
                {editMode && (
                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={handleCancel}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>취소</span>
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="flex items-center space-x-2 px-4 py-2 bg-navy-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {saving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>저장</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 프로필 완성 안내 모달 */}
      <ProfileCompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        missingFields={missingFields}
      />

      {/* 채팅봇 */}
      <ChatBot />
    </div>
  )
}

export default MyPage
