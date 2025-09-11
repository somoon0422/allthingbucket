
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useExperiences } from '../hooks/useExperiences'
import {Gift, User, Phone, Mail, Instagram, Youtube, AlertCircle, CheckCircle} from 'lucide-react'
import toast from 'react-hot-toast'

interface CodeSignupProps {
  code?: string
}

const CodeSignup: React.FC<CodeSignupProps> = ({ code: initialCode }) => {
  const { signUp } = useAuth()
  const { getCampaignByCode } = useExperiences()
  
  const [code, setCode] = useState(initialCode || '')
  const [campaign, setCampaign] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [verifying, setVerifying] = useState(false)
  
  // 회원가입 폼 데이터
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '', // 필수 필드
    instagram: '',
    youtube: '',
    followers: ''
  })

  // 🔧 캠페인 코드 검증
  const verifyCampaignCode = async (inputCode: string) => {
    if (!inputCode.trim()) {
      setCampaign(null)
      return
    }

    try {
      setVerifying(true)
      console.log('🔍 캠페인 코드 검증:', inputCode)
      
      const foundCampaign = await getCampaignByCode(inputCode.trim())
      
      if (foundCampaign) {
        console.log('✅ 캠페인 코드 매칭:', foundCampaign)
        setCampaign(foundCampaign)
        toast.success(`캠페인 "${foundCampaign.product_name || foundCampaign.name}" 코드가 확인되었습니다!`)
      } else {
        console.log('❌ 캠페인 코드 없음:', inputCode)
        setCampaign(null)
        toast.error('존재하지 않는 캠페인 코드입니다')
      }
    } catch (error) {
      console.error('❌ 캠페인 코드 검증 실패:', error)
      setCampaign(null)
      toast.error('캠페인 코드 검증에 실패했습니다')
    } finally {
      setVerifying(false)
    }
  }

  // 🔧 회원가입 처리
  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()

    // 필수 필드 검증
    if (!formData.name.trim()) {
      toast.error('이름을 입력해주세요')
      return
    }

    if (!formData.email.trim()) {
      toast.error('이메일을 입력해주세요')
      return
    }

    // 🚨 휴대폰번호 필수 검증
    if (!formData.phone.trim()) {
      toast.error('휴대폰번호는 필수 입력 항목입니다')
      return
    }

    // 휴대폰번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/
    if (!phoneRegex.test(formData.phone.replace(/[^0-9]/g, ''))) {
      toast.error('올바른 휴대폰번호 형식을 입력해주세요 (예: 010-1234-5678)')
      return
    }

    if (!campaign) {
      toast.error('유효한 캠페인 코드를 입력해주세요')
      return
    }

    try {
      setLoading(true)
      console.log('📝 캠페인 회원가입 시작:', { formData, campaign })

      // 회원가입 데이터 준비
      const signupData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        instagram: formData.instagram.trim(),
        youtube: formData.youtube.trim(),
        followers: formData.followers ? parseInt(formData.followers) : 0,
        campaign_code: code.trim(),
        campaign_id: campaign._id,
        campaign_name: campaign.product_name || campaign.name || '캠페인',
        signup_type: 'campaign_code'
      }

      console.log('💾 회원가입 데이터:', signupData)
      
      const success = await signUp(signupData)
      
      if (success) {
        toast.success('캠페인 회원가입이 완료되었습니다!')
        // 폼 초기화
        setFormData({
          name: '',
          email: '',
          phone: '',
          instagram: '',
          youtube: '',
          followers: ''
        })
        setCode('')
        setCampaign(null)
      }
    } catch (error) {
      console.error('❌ 캠페인 회원가입 실패:', error)
      toast.error('회원가입에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 코드 변경 시 자동 검증
  useEffect(() => {
    if (code.trim()) {
      const timeoutId = setTimeout(() => {
        verifyCampaignCode(code)
      }, 500)
      return () => clearTimeout(timeoutId)
    } else {
      setCampaign(null)
    }
  }, [code])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <Gift className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900">캠페인 회원가입</h2>
          <p className="mt-2 text-gray-600">캠페인 코드로 회원가입하고 참여해보세요!</p>
        </div>

        <form onSubmit={handleSignup} className="mt-8 space-y-6">
          {/* 캠페인 코드 입력 */}
          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-2">
              캠페인 코드 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="캠페인 코드를 입력하세요"
                required
              />
              {verifying && (
                <div className="absolute right-3 top-2.5">
                  <div className="animate-spin w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                </div>
              )}
            </div>
          </div>

          {/* 캠페인 정보 표시 */}
          {campaign && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-green-800">캠페인 확인됨</span>
              </div>
              <h3 className="font-bold text-gray-900">{campaign.product_name || campaign.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                리워드: {campaign.reward_points || 0}P
              </p>
            </div>
          )}

          {/* 개인정보 입력 */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                이름 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="실명을 입력하세요"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이메일을 입력하세요"
                  required
                />
              </div>
            </div>

            {/* 🚨 휴대폰번호 필수 */}
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                휴대폰번호 <span className="text-red-500">*</span>
                <span className="text-xs text-red-600 ml-1">(필수)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="010-1234-5678"
                  required
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                포인트 지급 및 세무 처리를 위해 필수로 입력해주세요
              </p>
            </div>

            <div>
              <label htmlFor="instagram" className="block text-sm font-medium text-gray-700 mb-2">
                인스타그램 계정
              </label>
              <div className="relative">
                <Instagram className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="instagram"
                  type="text"
                  value={formData.instagram}
                  onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="@username"
                />
              </div>
            </div>

            <div>
              <label htmlFor="youtube" className="block text-sm font-medium text-gray-700 mb-2">
                유튜브 채널
              </label>
              <div className="relative">
                <Youtube className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                <input
                  id="youtube"
                  type="text"
                  value={formData.youtube}
                  onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="채널명 또는 URL"
                />
              </div>
            </div>

            <div>
              <label htmlFor="followers" className="block text-sm font-medium text-gray-700 mb-2">
                총 팔로워 수
              </label>
              <input
                id="followers"
                type="number"
                value={formData.followers}
                onChange={(e) => setFormData({ ...formData, followers: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0"
                min="0"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !campaign}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full"></div>
                <span>가입 중...</span>
              </div>
            ) : (
              '캠페인 회원가입'
            )}
          </button>
        </form>

        <div className="text-center text-sm text-gray-500">
          이미 계정이 있으신가요?{' '}
          <a href="/login" className="text-blue-600 hover:text-blue-500">
            로그인하기
          </a>
        </div>
      </div>
    </div>
  )
}

export default CodeSignup
