import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/dataService'
import toast from 'react-hot-toast'
import * as PortOne from '@portone/browser-sdk/v2'
import { CheckCircle, Shield, CreditCard } from 'lucide-react'

export default function IdentityVerification() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState<'identity' | 'account' | 'complete'>('identity')
  const [loading, setLoading] = useState(false)
  const [identityData, setIdentityData] = useState<any>(null)

  // 계좌 정보
  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [accountHolder, setAccountHolder] = useState('')

  // 이미 인증 완료했는지 확인
  useEffect(() => {
    checkVerificationStatus()
  }, [user])

  const checkVerificationStatus = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('user_identity_info')
        .select('*')
        .eq('user_id', user.user_id)
        .maybeSingle()

      if (data?.identity_verified) {
        // 이미 인증 완료
        navigate('/profile')
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)
    }
  }

  // 포트원 다날 본인인증
  const handleIdentityVerification = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.')
      return
    }

    setLoading(true)

    try {
      // 포트원 환경변수 확인
      const storeId = import.meta.env.VITE_PORTONE_STORE_ID
      const channelKey = import.meta.env.VITE_PORTONE_CHANNEL_KEY

      if (!storeId || !channelKey) {
        toast.error('포트원 설정이 필요합니다. 관리자에게 문의하세요.')
        setLoading(false)
        return
      }

      // 포트원 다날 본인인증 호출
      const response = await PortOne.requestIdentityVerification({
        storeId: storeId,
        identityVerificationId: `identity-${user.user_id}-${Date.now()}`,
        channelKey: channelKey,
        // 다날 특화 옵션 (선택사항)
        // bypass: {
        //   danal: {
        //     AGELIMIT: 19, // 19세 이상만 인증 가능
        //   }
        // }
      })

      if (response.code != null) {
        // 인증 실패
        toast.error(response.message || '본인인증에 실패했습니다.')
        setLoading(false)
        return
      }

      // 인증 성공
      console.log('본인인증 성공:', response)

      setIdentityData({
        name: response.name,
        birth: response.birthday?.replace(/-/g, ''),
        phone: response.phone,
        ci: response.ci,
      })

      toast.success('본인인증이 완료되었습니다!')
      setStep('account')
    } catch (error: any) {
      console.error('본인인증 오류:', error)
      toast.error('본인인증 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 계좌 정보 저장
  const handleSaveAccount = async () => {
    if (!user || !identityData) {
      toast.error('본인인증을 먼저 완료해주세요.')
      return
    }

    if (!bankName || !bankAccount || !accountHolder) {
      toast.error('모든 계좌 정보를 입력해주세요.')
      return
    }

    if (accountHolder !== identityData.name) {
      toast.error('예금주명이 본인인증 이름과 일치하지 않습니다.')
      return
    }

    setLoading(true)

    try {
      // user_identity_info에 저장
      const { error } = await supabase
        .from('user_identity_info')
        .upsert({
          user_id: user.user_id,
          identity_verified: true,
          identity_verified_at: new Date().toISOString(),
          identity_name: identityData.name,
          identity_birth: identityData.birth,
          identity_phone: identityData.phone,
          identity_ci: identityData.ci,
          bank_name: bankName,
          bank_account: bankAccount,
          account_holder: accountHolder,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        })

      if (error) throw error

      toast.success('본인인증 및 계좌 등록이 완료되었습니다!')
      setStep('complete')

      // 3초 후 프로필 페이지로 이동
      setTimeout(() => {
        navigate('/profile')
      }, 3000)
    } catch (error: any) {
      console.error('계좌 정보 저장 실패:', error)
      toast.error('계좌 정보 저장에 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const bankList = [
    'KB국민은행', '신한은행', '우리은행', '하나은행', 'NH농협은행',
    'IBK기업은행', 'SC제일은행', '한국씨티은행', '카카오뱅크', '케이뱅크',
    '토스뱅크', '부산은행', '경남은행', '광주은행', '전북은행',
    '제주은행', '대구은행', '새마을금고', '신협', '우체국'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-navy-50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-navy-600 rounded-2xl shadow-lg shadow-primary-500/30 mb-6 transform hover:scale-110 transition-transform duration-300">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">본인인증 및 계좌 등록</h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            안전한 거래를 위해 본인인증과 출금 계좌를 등록해주세요
          </p>
        </div>

        {/* 진행 단계 표시 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-100 p-8 mb-8">
          <div className="flex items-center justify-between max-w-2xl mx-auto">
            <div className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${step === 'identity' || step === 'account' || step === 'complete' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step === 'identity' || step === 'account' || step === 'complete' ? 'bg-gradient-to-br from-primary-500 to-navy-600 text-white shadow-lg shadow-primary-500/30 scale-110' : 'bg-gray-100'}`}>
                {step === 'account' || step === 'complete' ? <CheckCircle className="w-6 h-6" /> : '1'}
              </div>
              <span className="font-medium text-sm">본인인증</span>
            </div>
            <div className={`h-1 w-full flex-1 mx-4 rounded-full transition-all duration-500 ${step === 'account' || step === 'complete' ? 'bg-gradient-to-r from-primary-500 to-navy-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${step === 'account' || step === 'complete' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step === 'account' || step === 'complete' ? 'bg-gradient-to-br from-primary-500 to-navy-600 text-white shadow-lg shadow-primary-500/30 scale-110' : 'bg-gray-100'}`}>
                {step === 'complete' ? <CheckCircle className="w-6 h-6" /> : '2'}
              </div>
              <span className="font-medium text-sm">계좌 등록</span>
            </div>
            <div className={`h-1 w-full flex-1 mx-4 rounded-full transition-all duration-500 ${step === 'complete' ? 'bg-gradient-to-r from-primary-500 to-navy-600' : 'bg-gray-200'}`}></div>
            <div className={`flex flex-col items-center gap-2 flex-1 transition-all duration-300 ${step === 'complete' ? 'text-primary-600' : 'text-gray-400'}`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step === 'complete' ? 'bg-gradient-to-br from-primary-500 to-navy-600 text-white shadow-lg shadow-primary-500/30 scale-110' : 'bg-gray-100'}`}>
                {step === 'complete' ? <CheckCircle className="w-6 h-6" /> : '3'}
              </div>
              <span className="font-medium text-sm">완료</span>
            </div>
          </div>
        </div>

        {/* Step 1: 본인인증 */}
        {step === 'identity' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-10 transform transition-all duration-500 hover:shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-navy-600 rounded-2xl shadow-lg shadow-primary-500/30 mx-auto mb-6">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">본인인증</h2>
              <p className="text-gray-600 text-lg">
                안전한 거래를 위해 휴대폰 본인인증을 진행합니다
              </p>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-4 bg-green-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-105">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">주민등록번호가 수집되며, 3.3% 원천징수 시 사용됩니다</p>
              </div>
              <div className="flex items-start space-x-4 bg-blue-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-105">
                <CheckCircle className="w-6 h-6 text-primary-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">인증 정보는 암호화되어 안전하게 보관됩니다</p>
              </div>
              <div className="flex items-start space-x-4 bg-indigo-50 rounded-xl p-4 transform transition-all duration-200 hover:scale-105">
                <CheckCircle className="w-6 h-6 text-navy-600 flex-shrink-0 mt-0.5" />
                <p className="text-gray-700 leading-relaxed">본인인증은 1회만 진행하면 됩니다</p>
              </div>
            </div>

            <button
              onClick={handleIdentityVerification}
              disabled={loading}
              className="w-full py-5 bg-gradient-to-r from-primary-600 to-navy-600 text-white text-lg rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  인증 진행 중...
                </span>
              ) : '휴대폰 본인인증 시작'}
            </button>
          </div>
        )}

        {/* Step 2: 계좌 등록 */}
        {step === 'account' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-10 transform transition-all duration-500 hover:shadow-2xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary-500 to-navy-600 rounded-2xl shadow-lg shadow-primary-500/30 mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-3">출금 계좌 등록</h2>
              <p className="text-gray-600 text-lg">
                포인트 출금을 위한 계좌 정보를 입력해주세요
              </p>
            </div>

            <div className="space-y-6 mb-8">
              {/* 은행 선택 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  은행 선택 <span className="text-red-500">*</span>
                </label>
                <select
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 bg-white hover:border-blue-300 text-gray-900"
                >
                  <option value="">은행을 선택하세요</option>
                  {bankList.map(bank => (
                    <option key={bank} value={bank}>{bank}</option>
                  ))}
                </select>
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  계좌번호 <span className="text-red-500">*</span>
                  <span className="text-gray-500 font-normal text-xs ml-2">(- 없이 입력)</span>
                </label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="123456789012"
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-blue-300"
                />
              </div>

              {/* 예금주명 */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  예금주명 <span className="text-red-500">*</span>
                  <span className="text-gray-500 font-normal text-xs ml-2">(본인인증 이름과 동일해야 함)</span>
                </label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  placeholder={identityData?.name || '홍길동'}
                  className="w-full px-5 py-4 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all duration-200 hover:border-blue-300"
                />
                {identityData && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-primary-700">
                      ✓ 본인인증 이름: <span className="font-semibold">{identityData.name}</span>
                    </p>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={handleSaveAccount}
              disabled={loading || !bankName || !bankAccount || !accountHolder}
              className="w-full py-5 bg-gradient-to-r from-primary-600 to-navy-600 text-white text-lg rounded-xl font-semibold shadow-lg shadow-primary-500/30 hover:shadow-xl hover:shadow-primary-500/40 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  저장 중...
                </span>
              ) : '계좌 등록 완료'}
            </button>
          </div>
        )}

        {/* Step 3: 완료 */}
        {step === 'complete' && (
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-12 text-center transform transition-all duration-500 hover:shadow-2xl">
            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/30 animate-bounce">
              <CheckCircle className="w-14 h-14 text-white" />
            </div>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">인증이 완료되었습니다!</h2>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              이제 모든 캠페인에 신청하실 수 있습니다
            </p>
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-blue-50 rounded-full">
              <div className="w-2 h-2 bg-primary-600 rounded-full animate-pulse"></div>
              <p className="text-sm text-primary-700 font-medium">
                3초 후 프로필 페이지로 이동합니다...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
