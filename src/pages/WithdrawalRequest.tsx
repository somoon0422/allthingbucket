import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useWithdrawal } from '../hooks/useWithdrawal'
import { usePoints } from '../hooks/usePoints'
import IdentityVerification from '../components/IdentityVerification'
import { DollarSign, AlertCircle, CheckCircle, Clock, X, Banknote, Shield } from 'lucide-react'

interface WithdrawalRequest {
  id: string
  user_id: string
  points_amount: number
  withdrawal_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  request_reason?: string
  admin_notes?: string
  created_at: string
  processed_at?: string
}

const WithdrawalRequest: React.FC = () => {
  const { user } = useAuth()
  const { userPoints } = usePoints()
  const { requestWithdrawal, getUserWithdrawals } = useWithdrawal()
  
  // 상태 관리
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [showIdentityVerification, setShowIdentityVerification] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  
  // 출금 요청 폼
  const [withdrawalForm, setWithdrawalForm] = useState({
    points_amount: 0,
    request_reason: ''
  })


  // 데이터 로드
  useEffect(() => {
    if (user?.user_id) {
      loadWithdrawalRequests()
      checkVerificationStatus()
    }
  }, [user?.user_id])

  // 실명인증 상태 확인
  const checkVerificationStatus = async () => {
    try {
      const response = await fetch(`/api/verification/status/${user?.user_id}`)
      const result = await response.json()
      
      if (result.success) {
        setIsVerified(result.verified)
      }
    } catch (error) {
      console.error('인증 상태 확인 실패:', error)
    }
  }

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await getUserWithdrawals()
      setWithdrawalRequests(requests || [])
    } catch (error) {
      console.error('출금 요청 내역 로드 실패:', error)
    }
  }

  // 출금 요청
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!isVerified) {
      alert('실명인증이 필요합니다.')
      return
    }

    if (withdrawalForm.points_amount <= 0) {
      alert('출금할 포인트를 입력해주세요.')
      return
    }

    if (withdrawalForm.points_amount > (userPoints?.available_points || 0)) {
      alert('보유 포인트보다 많은 금액을 출금할 수 없습니다.')
      return
    }

    if (withdrawalForm.points_amount < 1000) {
      alert('최소 출금 금액은 1,000P입니다.')
      return
    }

    try {
      setLoading(true)
      const newRequest = await requestWithdrawal(
        user?.user_id || '',
        '', // bankAccountId는 더 이상 필요하지 않음
        withdrawalForm.points_amount,
        withdrawalForm.request_reason
      )
      
      if (newRequest) {
        setWithdrawalForm({ points_amount: 0, request_reason: '' })
        setShowWithdrawalForm(false)
        loadWithdrawalRequests()
      }
    } catch (error) {
      console.error('출금 요청 실패:', error)
      alert('출금 요청 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 상태별 색상 및 아이콘
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return { color: 'text-yellow-600 bg-yellow-100', icon: Clock, text: '대기중' }
      case 'approved':
        return { color: 'text-blue-600 bg-blue-100', icon: CheckCircle, text: '승인됨' }
      case 'rejected':
        return { color: 'text-red-600 bg-red-100', icon: X, text: '거절됨' }
      case 'completed':
        return { color: 'text-green-600 bg-green-100', icon: CheckCircle, text: '완료됨' }
      case 'failed':
        return { color: 'text-red-600 bg-red-100', icon: X, text: '실패' }
      default:
        return { color: 'text-gray-600 bg-gray-100', icon: Clock, text: '알 수 없음' }
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">로그인이 필요합니다</h2>
          <p className="text-gray-600">포인트 출금을 위해 먼저 로그인해주세요.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                <Banknote className="w-8 h-8 mr-3 text-blue-600" />
                포인트 출금
              </h1>
              <p className="text-gray-600 mt-1">보유 포인트를 현금으로 출금하세요</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">보유 포인트</p>
              <p className="text-2xl font-bold text-blue-600">
                {(userPoints?.available_points || 0).toLocaleString()}P
              </p>
            </div>
          </div>
        </div>

        {/* 출금 안내 정보 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2" />
            출금 안내사항
          </h2>
          <div className="space-y-3 text-sm text-blue-800">
            <p>• 포인트가 5,000원 이상 모이면 출금 신청을 할 수 있으며, 출금 시 금융 수수료 및 세금을 차감하고 지급됩니다.</p>
            <p>• <strong>신청 기간 및 지급일 안내:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 1일 ~ 10일 신청: 당월 15일 지급</li>
              <li>• 11일 ~ 20일 신청: 당월 25일 지급</li>
              <li>• 21일 ~ 말일 신청: 익월 5일 지급</li>
            </ul>
            <p>• 출금 금액은 지정이 불가하며, 신청 정보와 금액 수정을 원하실 경우, 앞선 신청을 취소하시고 다시 신청해 주세요.</p>
            <p>• <strong>세금 공제 안내:</strong></p>
            <ul className="ml-4 space-y-1">
              <li>• 레뷰 포인트(캠페인, 저금통 활동으로 적립된 포인트): 사업소득에 따른 세금 3.3% 공제</li>
              <li>• 이벤트로 적립된 포인트: 기타소득으로 50,000원 초과 시 해당 금액에 한하여 세금 22% 공제</li>
            </ul>
            <p>• 출금 신청한 금액은 입금된 월의 소득 발생으로 신고되며, 관련 세금신고는 실명인증된 명의로 진행됩니다.</p>
            <p>• 출금을 위해서는 나이스평가정보를 통한 실명인증이 필요합니다.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 실명인증 관리 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                실명인증 상태
              </h2>
            </div>

            {!isVerified ? (
              <div className="text-center py-8">
                <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">실명인증이 필요합니다</p>
                <p className="text-sm text-gray-400 mb-4">출금을 위해 나이스평가정보를 통한 실명인증을 진행해주세요</p>
                <button
                  onClick={() => setShowIdentityVerification(true)}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  실명인증하기
                </button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-green-600 font-medium mb-2">실명인증 완료</p>
                <p className="text-sm text-gray-500 mb-4">출금 요청이 가능합니다</p>
                <button
                  onClick={() => setShowWithdrawalForm(true)}
                  className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-lg hover:bg-green-700"
                >
                  <DollarSign className="w-4 h-4 mr-2" />
                  출금 요청하기
                </button>
              </div>
            )}
          </div>

          {/* 출금 요청 내역 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
              <Clock className="w-5 h-5 mr-2" />
              출금 요청 내역
            </h2>

            {withdrawalRequests.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">출금 요청 내역이 없습니다</p>
              </div>
            ) : (
              <div className="space-y-3">
                {withdrawalRequests.map((request) => {
                  const statusInfo = getStatusInfo(request.status)
                  const StatusIcon = statusInfo.icon
                  
                  return (
                    <div key={request.id} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {statusInfo.text}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {new Date(request.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="font-medium text-gray-900">
                          {request.points_amount.toLocaleString()}P → {request.withdrawal_amount.toLocaleString()}원
                        </p>
                        {request.request_reason && (
                          <p className="text-sm text-gray-500">{request.request_reason}</p>
                        )}
                        {request.admin_notes && (
                          <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded">
                            관리자 메모: {request.admin_notes}
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>


        {/* 출금 요청 모달 */}
        {showWithdrawalForm && isVerified && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">출금 요청</h3>
                <button
                  onClick={() => setShowWithdrawalForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-green-50 rounded-lg">
                <div className="flex items-center">
                  <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                  <p className="text-sm text-green-700">실명인증 완료</p>
                </div>
                <p className="text-xs text-green-600 mt-1">출금 요청이 가능합니다</p>
              </div>

              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출금할 포인트
                  </label>
                  <input
                    type="number"
                    value={withdrawalForm.points_amount}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, points_amount: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="출금할 포인트를 입력하세요"
                    min="1000"
                    max={userPoints?.available_points || 0}
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    최소 1,000P, 최대 {(userPoints?.available_points || 0).toLocaleString()}P
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출금 사유 (선택사항)
                  </label>
                  <textarea
                    value={withdrawalForm.request_reason}
                    onChange={(e) => setWithdrawalForm({ ...withdrawalForm, request_reason: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    rows={3}
                    placeholder="출금 사유를 입력하세요"
                  />
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <strong>예상 출금 금액:</strong> {withdrawalForm.points_amount.toLocaleString()}원
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    * 환율: 1P = 1원 (실제 출금 시 환율이 적용될 수 있습니다)
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowWithdrawalForm(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading ? '요청중...' : '출금 요청'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 실명인증 모달 */}
        {showIdentityVerification && (
          <IdentityVerification
            userId={user?.user_id || ''}
            onVerificationComplete={() => {
              setIsVerified(true)
              setShowIdentityVerification(false)
              checkVerificationStatus()
            }}
            onClose={() => setShowIdentityVerification(false)}
          />
        )}
      </div>
    </div>
  )
}

export default WithdrawalRequest