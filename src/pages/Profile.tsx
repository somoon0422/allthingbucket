
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
// Lumi SDK 제거됨 - MongoDB API 사용
import toast from 'react-hot-toast'
import {User, Instagram, Youtube, MessageSquare, Star, Award, Save, Edit3, X, TrendingUp, Globe, Shield} from 'lucide-react'
import { AddressInput } from '../components/AddressInput'
import { PhoneInput } from '../components/PhoneInput'

const Profile: React.FC = () => {
  const { user } = useAuth()
  const [profile, setProfile] = useState<any>(null)
  const [userCode, setUserCode] = useState<string>('')
  const [editMode, setEditMode] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
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
    bank_name: '',
    account_number: '',
    account_holder: '',
    tax_info: {
      resident_number_encrypted: '',
      tax_type: 'individual'
    }
  })

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      setLoading(true)
      
      // 🏷️ 사용자 회원코드 조회 (수정 불가) - MongoDB API 사용
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://allthingbucket.com'
      const codesResponse = await fetch(`${apiBaseUrl}/api/db/user-codes`)
      const codesResult = await codesResponse.json()
      const codes = codesResult.success ? codesResult.data : []
      const userCodeData = codes.find((code: any) => code && code.user_id === user.user_id)
      
      if (userCodeData && userCodeData.user_code) {
        setUserCode(userCodeData.user_code)
        console.log('🏷️ 사용자 회원코드 확인:', userCodeData.user_code)
      }
      
      // 먼저 user_profiles에서 기본 정보 확인 - MongoDB API 사용
      const userProfilesResponse = await fetch(`${apiBaseUrl}/api/db/user-profiles`)
      const userProfilesResult = await userProfilesResponse.json()
      const userProfiles = userProfilesResult.success ? userProfilesResult.data : []
      const userProfile = Array.isArray(userProfiles) 
        ? userProfiles.find((p: any) => p && p.user_id === user.user_id)
        : null
      
      // influencer_profiles에서 상세 정보 확인 - MongoDB API 사용
      const influencerProfilesResponse = await fetch(`${apiBaseUrl}/api/db/influencer-profiles`)
      const influencerProfilesResult = await influencerProfilesResponse.json()
      const influencerProfiles = influencerProfilesResult.success ? influencerProfilesResult.data : []
      const influencerProfile = influencerProfiles.find((p: any) => p && p.user_id === user.user_id)
      
      if (influencerProfile) {
        setProfile(influencerProfile)
        setFormData({
          full_name: influencerProfile.full_name || userProfile?.name || user.name || '',
          phone: influencerProfile.phone || userProfile?.phone || '',
          email: influencerProfile.email || user.email || '',
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
          bank_name: influencerProfile.bank_name || userProfile?.bank_name || '',
          account_number: influencerProfile.account_number || userProfile?.account_number || '',
          account_holder: influencerProfile.account_holder || userProfile?.account_holder || '',
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
          full_name: userProfile.name || user.name || '',
          phone: userProfile.phone || '',
          email: user.email || '',
          bank_name: userProfile.bank_name || '',
          account_number: userProfile.account_number || '',
          account_holder: userProfile.account_holder || ''
        }))
      } else {
        // 신규 사용자
        setFormData(prev => ({
          ...prev,
          email: user.email || '',
          full_name: user.name || ''
        }))
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
    if (!formData.full_name || !formData.phone || !formData.bank_name || !formData.account_number) {
      toast.error('필수 정보를 모두 입력해주세요')
      return
    }

    setSaving(true)
    try {
      const profileData = {
        ...formData,
        user_id: user.user_id,
        birth_date: formData.birth_date ? new Date(formData.birth_date).toISOString() : '',
        profile_status: profile?.profile_status || 'pending',
        rating: profile?.rating || 0,
        total_experiences: profile?.total_experiences || 0,
        updated_at: new Date().toISOString(),
        created_at: profile?.created_at || new Date().toISOString()
      }

      if (profile && profile._id) {
        // influencer_profiles 업데이트 - MongoDB API 사용
        const apiBaseUrl = window.location.hostname === 'localhost' 
          ? 'http://localhost:3001'
          : 'https://allthingbucket.com'
        const response = await fetch(`${apiBaseUrl}/api/db/influencer-profiles/${profile._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        })
        const result = await response.json()
        if (result.success) {
          toast.success('프로필이 업데이트되었습니다')
        } else {
          toast.error('프로필 업데이트에 실패했습니다')
        }
      } else {
        // 새 influencer_profile 생성 - MongoDB API 사용
        const response = await fetch(`${apiBaseUrl}/api/db/influencer-profiles`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileData)
        })
        const result = await response.json()
        if (result.success) {
          toast.success('프로필이 생성되었습니다')
        } else {
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


  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">프로필 정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 🎨 새로운 로고 적용 */}
            <img src="/logo.png" alt="올띵버킷 로고" className="w-12 h-12" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">프로필 관리</h1>
              <p className="text-gray-600">
                개인정보, SNS 정보, 계좌 정보를 관리하세요
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 bg-purple-50 px-4 py-2 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <Edit3 className="w-4 h-4" />
                <span>수정</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 🔔 프로필 정보 채우기 공지 */}
      {(!profile || !profile.full_name || !profile.phone || !profile.bank_name) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-l-4 border-blue-400 p-4 mb-6 rounded-r-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600" />
              </div>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-blue-800">
                프로필 정보를 완성해주세요!
              </h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">
                  체험단 신청 시 자동으로 입력되는 정보입니다. 
                  <strong>실명, 전화번호, 계좌정보</strong>를 모두 입력해주세요.
                </p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  {!profile?.full_name && <li>실명을 입력해주세요</li>}
                  {!profile?.phone && <li>전화번호를 입력해주세요</li>}
                  {!profile?.bank_name && <li>계좌정보를 입력해주세요</li>}
                </ul>
              </div>
              <div className="mt-3">
                <button
                  onClick={() => setEditMode(true)}
                  className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
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
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl border-2 border-purple-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="w-8 h-8 text-purple-600" />
              <div>
                <h2 className="text-xl font-bold text-purple-900">회원코드</h2>
                <p className="text-purple-700 text-sm">본인에게 부여된 고유 회원코드입니다</p>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-white px-6 py-3 rounded-xl shadow-sm border-2 border-purple-300">
                <p className="text-2xl font-bold text-purple-600">{userCode}</p>
              </div>
              <p className="text-xs text-purple-600 mt-2">수정 불가</p>
            </div>
          </div>
        </div>
      )}

      {/* 🔹 기본 정보 */}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.full_name || '미입력'}
              </p>
            )}
          </div>

          <div>
            {editMode ? (
              <PhoneInput
                value={formData.phone}
                onChange={(phone) => setFormData(prev => ({ ...prev, phone }))}
                required
                placeholder="010-1234-5678"
              />
            ) : (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  전화번호 <span className="text-red-500">*</span>
                </label>
                <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {profile?.phone || '미입력'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이메일
            </label>
            {editMode ? (
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.email || '미입력'}
              </p>
            )}
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
                  className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
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
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
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
                  className="w-16 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-center"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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

      {/* 🔹 주소 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">주소 정보</h2>
        
        {editMode ? (
          <AddressInput
            address={formData.address.street || ''}
            detailedAddress={formData.address.district || ''}
            onAddressChange={(address, detailedAddress) => {
              setFormData(prev => ({
                ...prev,
                address: {
                  ...prev.address,
                  street: address,
                  district: detailedAddress
                }
              }))
            }}
            required
          />
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                주소
              </label>
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.address?.street || '미입력'}
              </p>
            </div>
            {profile?.address?.district && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  상세 주소
                </label>
                <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                  {profile.address.district}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 🔹 SNS 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">SNS 정보</h2>
        
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg min-h-[80px]">
                {profile?.other_sns || '미입력'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 관심 카테고리 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">관심 카테고리</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {availableCategories.map(category => (
            <div key={category}>
              {editMode ? (
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(category)}
                    onChange={() => handleCategoryToggle(category)}
                    className="rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                  />
                  <span className="text-sm">{getCategoryLabel(category)}</span>
                </label>
              ) : (
                <span className={`inline-block px-3 py-1 rounded-full text-sm ${
                  profile?.categories?.includes(category)
                    ? 'bg-purple-100 text-purple-800'
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  {getCategoryLabel(category)}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 🔹 계좌 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">계좌 정보</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              은행명 <span className="text-red-500">*</span>
            </label>
            {editMode ? (
              <select
                required
                value={formData.bank_name}
                onChange={(e) => setFormData(prev => ({ ...prev, bank_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              >
                <option value="">은행을 선택하세요</option>
                <option value="국민은행">국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="하나은행">하나은행</option>
                <option value="우리은행">우리은행</option>
                <option value="농협은행">농협은행</option>
                <option value="기업은행">기업은행</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
              </select>
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.bank_name || '미입력'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              계좌번호 <span className="text-red-500">*</span>
            </label>
            {editMode ? (
              <input
                type="text"
                required
                value={formData.account_number}
                onChange={(e) => setFormData(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="123456-78-901234"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.account_number || '미입력'}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              예금주명 <span className="text-red-500">*</span>
            </label>
            {editMode ? (
              <input
                type="text"
                required
                value={formData.account_holder}
                onChange={(e) => setFormData(prev => ({ ...prev, account_holder: e.target.value }))}
                placeholder="홍길동"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            ) : (
              <p className="font-medium text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">
                {profile?.account_holder || '미입력'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 활동 통계 */}
      {profile && (
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">활동 통계</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Award className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-purple-600">{profile.total_experiences || 0}</p>
              <p className="text-sm text-purple-700 mt-1">참여한 체험단</p>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-yellow-600">{profile.rating || 0}</p>
              <p className="text-sm text-yellow-700 mt-1">평균 평점</p>
            </div>

            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-2xl font-bold text-blue-600">
                {Object.values(profile.follower_counts || {}).reduce((sum: number, count: any) => sum + (count || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-blue-700 mt-1">총 팔로워 수</p>
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
            className="flex items-center space-x-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
  )
}

export default Profile
