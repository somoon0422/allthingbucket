
import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'
import { User, Phone, MapPin, Calendar } from 'lucide-react'

interface UserCodeSignupProps {
  onSuccess: () => void
  isExistingUser?: boolean // 기존 회원인지 여부
  onNeedLogin?: () => Promise<void> // 🆕 신규 회원 로그인 콜백
}

const UserCodeSignup: React.FC<UserCodeSignupProps> = ({ 
  onSuccess, 
  isExistingUser = false,
  onNeedLogin 
}) => {
  const { user } = useAuth()
  const [step, setStep] = useState(isExistingUser ? 'profile' : 'code') // 기존 회원은 바로 프로필 단계
  const [loading, setLoading] = useState(false)
  
  // 회원 코드 관련 상태
  const [userCode, setUserCode] = useState('')
  
  // 프로필 정보 상태
  const [profileData, setProfileData] = useState({
    name: '',
    phone: '',
    birth_date: '',
    address: '',
  })

  // 🔍 회원 코드 검증 및 로그인
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userCode.trim()) {
      toast.error('회원 코드를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      // 1. 회원 코드 존재 여부 및 사용 여부 확인
      const { list: codes } = await (dataService.entities as any).user_codes.list()
      const codeRecord = codes.find((c: any) => c.user_code === userCode.toUpperCase())

      if (!codeRecord) {
        toast.error('존재하지 않는 회원 코드입니다')
        return
      }

      if (codeRecord.status !== 'active') {
        toast.error('비활성화된 회원 코드입니다')
        return
      }

      // 🚨 중복 사용 방지: user_id가 이미 있으면 사용된 코드
      if (codeRecord.user_id) {
        toast.error('이미 사용된 회원 코드입니다')
        return
      }

      // 2. 신규 회원 로그인 처리
      if (!user && onNeedLogin) {
        await onNeedLogin()
        // 로그인 후 자동으로 다음 단계로 진행됨
      }

      setStep('profile')
      toast.success('회원 코드 확인 완료! 프로필을 입력해주세요')

    } catch (error) {
      console.error('회원 코드 확인 실패:', error)
      toast.error('회원 코드 확인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 📝 프로필 정보 저장
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }

    // 필수 정보 확인
    if (!profileData.name || !profileData.phone) {
      toast.error('이름과 전화번호는 필수입니다')
      return
    }

    setLoading(true)
    try {
      // 1. 프로필 정보 저장
      await (dataService.entities as any).user_profiles.create({
        user_id: user.user_id,
        signup_code: isExistingUser ? 'EXISTING_USER' : userCode.toUpperCase(),
        name: profileData.name,
        phone: profileData.phone,
        birth_date: profileData.birth_date || null,
        address: profileData.address || null,
        current_balance: 0,
        total_earned: 0,
        total_withdrawn: 0,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 2. 신규 가입인 경우에만 회원 코드 업데이트
      if (!isExistingUser && userCode) {
        const { list: codes } = await (dataService.entities as any).user_codes.list()
        const codeRecord = codes.find((c: any) => c.user_code === userCode.toUpperCase())
        
        if (codeRecord) {
          await (dataService.entities as any).user_codes.update(codeRecord._id, {
            user_id: user.user_id,
            updated_at: new Date().toISOString()
          })
        }
      }

      toast.success('가입이 완료되었습니다! 🎉')
      onSuccess()

    } catch (error) {
      console.error('프로필 저장 실패:', error)
      toast.error('프로필 저장에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 🎯 회원 코드 입력 단계
  if (step === 'code') {
    return (
      <div className="bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-navy-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">회원 코드 입력</h2>
          <p className="text-gray-600">발급받은 회원 코드를 입력해주세요</p>
        </div>

        <form onSubmit={handleCodeSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              회원 코드 *
            </label>
            <input
              type="text"
              value={userCode}
              onChange={(e) => setUserCode(e.target.value.toUpperCase())}
              placeholder="예: USER001"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500 text-center text-lg font-mono"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-navy-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {loading ? '확인 중...' : '다음 단계'}
          </button>
        </form>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-vintage-700">
            💡 <strong>회원 코드가 없으신가요?</strong><br />
            관리자에게 문의하여 회원 코드를 발급받으세요.
          </p>
        </div>
      </div>
    )
  }

  // 📋 프로필 정보 입력 단계
  return (
    <div className="bg-white rounded-2xl shadow-xl p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          {isExistingUser ? '프로필 설정' : '개인정보 입력'}
        </h2>
        <p className="text-gray-600">
          {isExistingUser ? '프로필 정보를 입력해주세요' : '체험단 참여를 위한 정보를 입력해주세요'}
        </p>
      </div>

      <form onSubmit={handleProfileSubmit} className="space-y-6">
        {/* 기본 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <User className="w-4 h-4 inline mr-1" />
              이름 *
            </label>
            <input
              type="text"
              value={profileData.name}
              onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="w-4 h-4 inline mr-1" />
              전화번호 *
            </label>
            <input
              type="tel"
              value={profileData.phone}
              onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
              placeholder="010-1234-5678"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Calendar className="w-4 h-4 inline mr-1" />
              생년월일
            </label>
            <input
              type="date"
              value={profileData.birth_date}
              onChange={(e) => setProfileData(prev => ({ ...prev, birth_date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              주소
            </label>
            <input
              type="text"
              value={profileData.address}
              onChange={(e) => setProfileData(prev => ({ ...prev, address: e.target.value }))}
              placeholder="서울시 강남구..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-navy-500"
            />
          </div>
        </div>


        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
        >
          {loading ? '저장 중...' : (isExistingUser ? '프로필 설정 완료' : '가입 완료')}
        </button>
      </form>

      <div className="mt-6 p-4 bg-yellow-50 rounded-lg">
        <p className="text-sm text-yellow-700">
          ⚠️ 입력하신 정보는 체험단 참여 및 포인트 출금에 사용됩니다.
        </p>
      </div>
    </div>
  )
}

export default UserCodeSignup
