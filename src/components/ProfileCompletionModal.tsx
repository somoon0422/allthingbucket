import React, { useState, useEffect } from 'react'
import { AlertCircle, X, CheckCircle2, User, Phone, Instagram, Clock } from 'lucide-react'
import { sendVerificationCode, verifyCode, formatPhoneNumber } from '../services/phoneVerificationService'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: { name: string, phone: string }) => void
  requiresPhoneOnly?: boolean // 전화번호만 필요한 경우 (회원가입 후)
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  requiresPhoneOnly = false
}) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 타이머
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && isCodeSent) {
      setError('인증번호가 만료되었습니다. 다시 발송해주세요.')
      setIsCodeSent(false)
    }
  }, [timeLeft, isCodeSent])

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setName('')
      setPhone('')
      setVerificationCode('')
      setIsCodeSent(false)
      setIsVerified(false)
      setTimeLeft(0)
      setError('')
    }
  }, [isOpen])

  if (!isOpen) return null

  // 인증번호 발송
  const handleSendCode = async () => {
    setError('')

    if (!phone) {
      setError('휴대폰 번호를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const result = await sendVerificationCode(phone)

      if (result.success) {
        setIsCodeSent(true)
        setTimeLeft(result.expiresIn || 180)
        setError('')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('인증번호 발송에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    setError('')

    if (!verificationCode) {
      setError('인증번호를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const result = await verifyCode(phone, verificationCode)

      if (result.success) {
        setIsVerified(true)
        setError('')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('인증 확인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 완료
  const handleComplete = () => {
    if (requiresPhoneOnly) {
      // 전화번호만 필요한 경우 (회원가입 후)
      if (!isVerified) {
        setError('휴대폰 인증을 완료해주세요')
        return
      }
      onComplete({ name: '', phone })
    } else {
      // 모든 정보 필요한 경우 (캠페인 신청 시)
      if (!name) {
        setError('실명을 입력해주세요')
        return
      }
      if (!isVerified) {
        setError('휴대폰 인증을 완료해주세요')
        return
      }
      onComplete({ name, phone })
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-navy-500 to-pink-500 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {requiresPhoneOnly ? '환영합니다! 🎉' : '프로필 정보 입력'}
            </h2>
            <p className="text-gray-600">
              {requiresPhoneOnly
                ? '휴대폰 번호를 인증하고 환영 알림을 받아보세요'
                : '캠페인 신청을 위해 정보를 입력해주세요'}
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="space-y-4 mb-6">
            {/* 실명 입력 (캠페인 신청 시에만) */}
            {!requiresPhoneOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  실명
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
            )}

            {/* 휴대폰 번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                휴대폰 번호
              </label>
              <div className="flex space-x-2">
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01012345678"
                  disabled={isVerified}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-transparent disabled:bg-gray-100"
                />
                <button
                  onClick={handleSendCode}
                  disabled={loading || isVerified}
                  className="px-6 py-3 bg-navy-600 text-white rounded-xl hover:bg-navy-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium whitespace-nowrap"
                >
                  {isCodeSent ? '재발송' : '인증번호 발송'}
                </button>
              </div>
            </div>

            {/* 인증번호 입력 */}
            {isCodeSent && !isVerified && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                  <span>인증번호</span>
                  {timeLeft > 0 && (
                    <span className="text-red-600 text-sm flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatTime(timeLeft)}
                    </span>
                  )}
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                    placeholder="6자리 입력"
                    maxLength={6}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                  <button
                    onClick={handleVerifyCode}
                    disabled={loading || verificationCode.length !== 6}
                    className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    확인
                  </button>
                </div>
              </div>
            )}

            {/* 인증 완료 */}
            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">휴대폰 인증이 완료되었습니다</span>
                </div>
                <p className="text-sm text-green-600 mt-1 ml-7">
                  {formatPhoneNumber(phone)}
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-vintage-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-vintage-900">
                <p className="font-medium mb-1">입력하신 정보는 안전하게 보관됩니다</p>
                <p className="text-xs text-vintage-700">
                  {requiresPhoneOnly
                    ? '인증 완료 후 카카오톡으로 환영 메시지를 보내드립니다.'
                    : '캠페인 신청 및 세금 정산 시에만 사용됩니다.'}
                </p>
              </div>
            </div>
          </div>

          {/* 완료 버튼 */}
          <button
            onClick={handleComplete}
            disabled={!isVerified || (!requiresPhoneOnly && !name)}
            className="w-full bg-gradient-to-r from-navy-600 to-pink-600 text-white py-3.5 rounded-xl font-semibold hover:from-navy-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            완료
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionModal
