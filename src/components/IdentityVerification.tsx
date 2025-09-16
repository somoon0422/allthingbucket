import React, { useState } from 'react'
import { Shield, AlertCircle, CheckCircle, X, User, Phone, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'

interface IdentityVerificationProps {
  userId: string
  onVerificationComplete?: () => void
  onClose?: () => void
}

const IdentityVerification: React.FC<IdentityVerificationProps> = ({
  userId,
  onVerificationComplete,
  onClose
}) => {
  const [step, setStep] = useState<'form' | 'verifying' | 'completed'>('form')
  const [formData, setFormData] = useState({
    userName: '',
    userPhone: '',
    userBirth: ''
  })
  const [loading, setLoading] = useState(false)

  // 생년월일 형식 변환 (YYYY-MM-DD -> YYYYMMDD)
  const formatBirthDate = (dateString: string) => {
    return dateString.replace(/-/g, '')
  }

  // 전화번호 형식 변환 (하이픈 제거)
  const formatPhoneNumber = (phone: string) => {
    return phone.replace(/[^0-9]/g, '')
  }

  // 실명인증 요청
  const handleVerificationRequest = async (e: React.FormEvent) => {
    e.preventDefault()

    // 필수 필드 검증
    if (!formData.userName || !formData.userPhone || !formData.userBirth) {
      toast.error('모든 필드를 입력해주세요')
      return
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/
    if (!phoneRegex.test(formData.userPhone)) {
      toast.error('올바른 전화번호 형식을 입력해주세요 (예: 010-1234-5678)')
      return
    }

    // 생년월일 형식 검증
    const birthRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!birthRegex.test(formData.userBirth)) {
      toast.error('올바른 생년월일 형식을 입력해주세요 (예: 1990-01-01)')
      return
    }

    try {
      setLoading(true)
      setStep('verifying')

      const response = await fetch('/api/verification/request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
          userName: formData.userName,
          userPhone: formatPhoneNumber(formData.userPhone),
          userBirth: formatBirthDate(formData.userBirth)
        })
      })

      const result = await response.json()

      if (result.success) {
        // 나이스평가정보 인증 페이지로 리다이렉트
        window.open(result.verificationUrl, '_blank', 'width=500,height=600')
        
        // 인증 완료 확인을 위한 폴링 (실제 구현에서는 WebSocket이나 다른 방법 사용 권장)
        checkVerificationStatus(result.verificationId)
      } else {
        toast.error(result.error || '인증 요청에 실패했습니다')
        setStep('form')
      }
    } catch (error) {
      console.error('인증 요청 실패:', error)
      toast.error('인증 요청 중 오류가 발생했습니다')
      setStep('form')
    } finally {
      setLoading(false)
    }
  }

  // 인증 상태 확인 (폴링)
  const checkVerificationStatus = async (verificationId: string) => {
    const maxAttempts = 30 // 5분간 확인 (10초 간격)
    let attempts = 0

    const poll = async () => {
      try {
        const response = await fetch('/api/verification/status/' + userId)
        const result = await response.json()

        if (result.success && result.verified) {
          setStep('completed')
          toast.success('본인인증이 완료되었습니다!')
          onVerificationComplete?.()
        } else if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 10000) // 10초 후 다시 확인
        } else {
          toast.error('인증 시간이 초과되었습니다. 다시 시도해주세요.')
          setStep('form')
        }
      } catch (error) {
        console.error('인증 상태 확인 실패:', error)
        if (attempts < maxAttempts) {
          attempts++
          setTimeout(poll, 10000)
        } else {
          toast.error('인증 상태 확인에 실패했습니다.')
          setStep('form')
        }
      }
    }

    poll()
  }

  if (step === 'verifying') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">본인인증 진행중</h3>
          <p className="text-gray-600 mb-4">
            새 창에서 본인인증을 완료해주세요.<br />
            인증이 완료되면 자동으로 창이 닫힙니다.
          </p>
          <div className="text-sm text-gray-500">
            <p>• 휴대폰 인증 또는 공인인증서를 이용해주세요</p>
            <p>• 인증 완료까지 잠시만 기다려주세요</p>
          </div>
        </div>
      </div>
    )
  }

  if (step === 'completed') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-8 w-full max-w-md mx-4 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">본인인증 완료</h3>
          <p className="text-gray-600 mb-6">
            본인인증이 성공적으로 완료되었습니다.<br />
            이제 포인트 출금이 가능합니다.
          </p>
          <button
            onClick={() => {
              onVerificationComplete?.()
              onClose?.()
            }}
            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            확인
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" />
            실명인증
          </h3>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircle className="w-5 h-5 text-blue-600 mr-2 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">출금을 위한 실명인증이 필요합니다</p>
              <p>• 3.3% 원천징수 세금 공제를 위해 주민등록번호가 필요합니다</p>
              <p>• 나이스평가정보를 통한 안전한 본인인증을 진행합니다</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleVerificationRequest} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <User className="w-4 h-4 inline mr-1" />
              이름
            </label>
            <input
              type="text"
              value={formData.userName}
              onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="실명을 입력해주세요"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Phone className="w-4 h-4 inline mr-1" />
              휴대폰번호
            </label>
            <input
              type="tel"
              value={formData.userPhone}
              onChange={(e) => setFormData({ ...formData, userPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="010-1234-5678"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <Calendar className="w-4 h-4 inline mr-1" />
              생년월일
            </label>
            <input
              type="date"
              value={formData.userBirth}
              onChange={(e) => setFormData({ ...formData, userBirth: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex space-x-3 pt-4">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                취소
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '인증 요청중...' : '본인인증 시작'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default IdentityVerification
