import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useWithdrawal } from '../hooks/useWithdrawal'
import { usePoints } from '../hooks/usePoints'
import RealNameVerification from '../components/RealNameVerification'
import BankAccountVerification from '../components/BankAccountVerification'
import { DollarSign, AlertCircle, CheckCircle, Clock, X, Banknote, Shield, Building2, User, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

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
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [currentStep, setCurrentStep] = useState<'info' | 'realname' | 'account' | 'confirm'>('info')

  // 인증 데이터
  const [realNameData, setRealNameData] = useState<any>(null)
  const [bankAccountData, setBankAccountData] = useState<any>(null)

  // 출금 요청 폼
  const [withdrawalForm, setWithdrawalForm] = useState({
    points_amount: 0,
    request_reason: '',
    userName: ''
  })


  // 데이터 로드
  useEffect(() => {
    if (user?.user_id) {
      loadWithdrawalRequests()
    }
  }, [user?.user_id])

  const loadWithdrawalRequests = async () => {
    try {
      const requests = await getUserWithdrawals()
      setWithdrawalRequests(requests || [])
    } catch (error) {
      console.error('출금 요청 내역 로드 실패:', error)
    }
  }

  // 출금 요청 시작
  const handleStartWithdrawal = () => {
    setShowWithdrawalModal(true)
    setCurrentStep('info')
    setRealNameData(null)
    setBankAccountData(null)
    setWithdrawalForm({ points_amount: 0, request_reason: '', userName: '' })
  }

  // 출금 정보 입력 완료
  const handleInfoComplete = () => {
    if (withdrawalForm.points_amount <= 0) {
      toast.error('출금할 포인트를 입력해주세요')
      return
    }

    if (withdrawalForm.points_amount > (userPoints?.available_points || 0)) {
      toast.error('보유 포인트보다 많은 금액을 출금할 수 없습니다')
      return
    }

    if (withdrawalForm.points_amount < 5000) {
      toast.error('최소 출금 금액은 5,000P입니다')
      return
    }

    if (!withdrawalForm.userName) {
      toast.error('이름을 입력해주세요')
      return
    }

    setCurrentStep('realname')
  }

  // 실명인증 완료
  const handleRealNameSuccess = (data: any) => {
    setRealNameData(data)
    setCurrentStep('account')
    toast.success('실명인증이 완료되었습니다')
  }

  // 계좌인증 완료
  const handleBankAccountSuccess = (data: any) => {
    setBankAccountData(data)
    setCurrentStep('confirm')
    toast.success('계좌인증이 완료되었습니다')
  }

  // 최종 출금 요청
  const handleFinalSubmit = async () => {
    if (!realNameData || !bankAccountData) {
      toast.error('인증을 완료해주세요')
      return
    }

    try {
      setLoading(true)

      // 세금 3.3% 계산
      const taxAmount = Math.floor(withdrawalForm.points_amount * 0.033)
      const finalAmount = withdrawalForm.points_amount - taxAmount

      const newRequest = await requestWithdrawal(
        user?.user_id || '',
        bankAccountData.accountNumber,
        withdrawalForm.points_amount,
        withdrawalForm.request_reason,
        {
          realName: withdrawalForm.userName,
          bankCode: bankAccountData.bankCode,
          bankName: bankAccountData.bankName,
          accountNumber: bankAccountData.accountNumber,
          accountHolder: bankAccountData.accountHolder,
          taxAmount,
          finalAmount
        }
      )

      if (newRequest) {
        toast.success('출금 요청이 완료되었습니다')
        setShowWithdrawalModal(false)
        setCurrentStep('info')
        setRealNameData(null)
        setBankAccountData(null)
        setWithdrawalForm({ points_amount: 0, request_reason: '', userName: '' })
        loadWithdrawalRequests()
      }
    } catch (error) {
      console.error('출금 요청 실패:', error)
      toast.error('출금 요청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 모달 닫기
  const handleCloseModal = () => {
    setShowWithdrawalModal(false)
    setCurrentStep('info')
    setRealNameData(null)
    setBankAccountData(null)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 헤더 */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
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
              <p className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {(userPoints?.available_points || 0).toLocaleString()}P
              </p>
            </div>
          </div>

          {/* 출금 요청 버튼 */}
          <button
            onClick={handleStartWithdrawal}
            className="w-full mt-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
          >
            <DollarSign className="w-5 h-5 mr-2" />
            출금 요청하기
          </button>
        </div>

        {/* 출금 안내 정보 */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
            출금 안내사항
          </h2>
          <div className="space-y-3 text-sm text-gray-700">
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
            <p>• 출금을 위해서는 나이스평가정보를 통한 <strong>실명인증</strong>과 <strong>계좌인증</strong>이 필요합니다.</p>
          </div>
        </div>

        {/* 출금 요청 내역 */}
        <div className="bg-white rounded-2xl shadow-xl border border-slate-200/60 p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center mb-4">
            <Clock className="w-5 h-5 mr-2 text-blue-600" />
            출금 요청 내역
          </h2>

          {withdrawalRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-500">출금 요청 내역이 없습니다</p>
            </div>
          ) : (
            <div className="space-y-3">
              {withdrawalRequests.map((request) => {
                const statusInfo = getStatusInfo(request.status)
                const StatusIcon = statusInfo.icon

                return (
                  <div key={request.id} className="p-4 border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
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
                        <p className="text-sm text-blue-600 bg-blue-50 p-2 rounded-lg mt-2">
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


        {/* 출금 요청 멀티스텝 모달 */}
        {showWithdrawalModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
              {/* 모달 헤더 */}
              <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900">포인트 출금 요청</h3>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* 스텝 인디케이터 */}
                <div className="flex items-center justify-between">
                  <div className={`flex items-center ${currentStep === 'info' ? 'text-blue-600' : currentStep !== 'info' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === 'info' ? 'bg-blue-600 text-white' :
                      currentStep !== 'info' ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep !== 'info' ? <CheckCircle className="w-5 h-5" /> : '1'}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block">출금정보</span>
                  </div>

                  <div className={`flex-1 h-1 mx-2 ${currentStep !== 'info' ? 'bg-blue-600' : 'bg-gray-200'}`} />

                  <div className={`flex items-center ${currentStep === 'realname' ? 'text-blue-600' : currentStep === 'account' || currentStep === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === 'realname' ? 'bg-blue-600 text-white' :
                      currentStep === 'account' || currentStep === 'confirm' ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep === 'account' || currentStep === 'confirm' ? <CheckCircle className="w-5 h-5" /> : '2'}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block">실명인증</span>
                  </div>

                  <div className={`flex-1 h-1 mx-2 ${currentStep === 'account' || currentStep === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'}`} />

                  <div className={`flex items-center ${currentStep === 'account' ? 'text-blue-600' : currentStep === 'confirm' ? 'text-green-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === 'account' ? 'bg-blue-600 text-white' :
                      currentStep === 'confirm' ? 'bg-green-600 text-white' :
                      'bg-gray-200 text-gray-600'
                    }`}>
                      {currentStep === 'confirm' ? <CheckCircle className="w-5 h-5" /> : '3'}
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block">계좌인증</span>
                  </div>

                  <div className={`flex-1 h-1 mx-2 ${currentStep === 'confirm' ? 'bg-blue-600' : 'bg-gray-200'}`} />

                  <div className={`flex items-center ${currentStep === 'confirm' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold ${
                      currentStep === 'confirm' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
                    }`}>
                      4
                    </div>
                    <span className="ml-2 text-sm font-medium hidden sm:block">확인</span>
                  </div>
                </div>
              </div>

              {/* 모달 컨텐츠 */}
              <div className="p-6">
                {/* Step 1: 출금 정보 입력 */}
                {currentStep === 'info' && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                      <p className="text-sm text-blue-800">
                        <strong>보유 포인트:</strong> {(userPoints?.available_points || 0).toLocaleString()}P
                      </p>
                      <p className="text-xs text-blue-600 mt-1">
                        최소 출금 금액은 5,000P입니다
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <User className="w-4 h-4 inline mr-1" />
                        이름
                      </label>
                      <input
                        type="text"
                        value={withdrawalForm.userName}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, userName: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="실명을 입력하세요"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        출금할 포인트
                      </label>
                      <input
                        type="number"
                        value={withdrawalForm.points_amount || ''}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, points_amount: parseInt(e.target.value) || 0 })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        placeholder="출금할 포인트를 입력하세요"
                        min="5000"
                        max={userPoints?.available_points || 0}
                        required
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        최소 5,000P, 최대 {(userPoints?.available_points || 0).toLocaleString()}P
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        출금 사유 (선택사항)
                      </label>
                      <textarea
                        value={withdrawalForm.request_reason}
                        onChange={(e) => setWithdrawalForm({ ...withdrawalForm, request_reason: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
                        rows={3}
                        placeholder="출금 사유를 입력하세요 (선택사항)"
                      />
                    </div>

                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4">
                      <p className="text-sm text-gray-800 mb-1">
                        <strong>예상 출금 금액 (세전):</strong> {withdrawalForm.points_amount.toLocaleString()}원
                      </p>
                      <p className="text-sm text-gray-800">
                        <strong>세금 3.3% 공제:</strong> {Math.floor(withdrawalForm.points_amount * 0.033).toLocaleString()}원
                      </p>
                      <p className="text-sm font-semibold text-blue-700 mt-2">
                        <strong>실수령액:</strong> {(withdrawalForm.points_amount - Math.floor(withdrawalForm.points_amount * 0.033)).toLocaleString()}원
                      </p>
                    </div>

                    <button
                      onClick={handleInfoComplete}
                      className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 flex items-center justify-center"
                    >
                      다음 단계
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </button>
                  </div>
                )}

                {/* Step 2: 실명인증 */}
                {currentStep === 'realname' && (
                  <div>
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">
                        <Shield className="w-4 h-4 inline mr-1" />
                        세금 환급을 위해 실명인증이 필요합니다
                      </p>
                    </div>
                    <RealNameVerification
                      onSuccess={handleRealNameSuccess}
                      onCancel={() => setCurrentStep('info')}
                    />
                  </div>
                )}

                {/* Step 3: 계좌인증 */}
                {currentStep === 'account' && (
                  <div>
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">
                        <Building2 className="w-4 h-4 inline mr-1" />
                        출금받을 계좌 인증이 필요합니다
                      </p>
                    </div>
                    <BankAccountVerification
                      defaultName={withdrawalForm.userName}
                      onSuccess={handleBankAccountSuccess}
                      onCancel={() => setCurrentStep('realname')}
                    />
                  </div>
                )}

                {/* Step 4: 최종 확인 */}
                {currentStep === 'confirm' && (
                  <div className="space-y-4">
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                      <div className="flex items-center text-green-700 mb-2">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span className="font-semibold">모든 인증이 완료되었습니다</span>
                      </div>
                      <p className="text-sm text-green-600">
                        아래 정보를 확인하시고 출금 요청을 완료해주세요
                      </p>
                    </div>

                    {/* 출금 정보 요약 */}
                    <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                      <h4 className="font-semibold text-gray-900 mb-3">출금 정보</h4>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">이름</span>
                        <span className="font-medium text-gray-900">{withdrawalForm.userName}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">출금 포인트</span>
                        <span className="font-medium text-gray-900">{withdrawalForm.points_amount.toLocaleString()}P</span>
                      </div>

                      {withdrawalForm.request_reason && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">출금 사유</span>
                          <span className="font-medium text-gray-900">{withdrawalForm.request_reason}</span>
                        </div>
                      )}
                    </div>

                    {/* 계좌 정보 */}
                    {bankAccountData && (
                      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
                        <h4 className="font-semibold text-gray-900 mb-3">계좌 정보</h4>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">은행</span>
                          <span className="font-medium text-gray-900">{bankAccountData.bankName}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">계좌번호</span>
                          <span className="font-medium text-gray-900">{bankAccountData.accountNumber}</span>
                        </div>

                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">예금주</span>
                          <span className="font-medium text-gray-900">{bankAccountData.accountHolder}</span>
                        </div>
                      </div>
                    )}

                    {/* 출금 금액 계산 */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">출금 요청 금액</span>
                        <span className="font-medium text-gray-900">{withdrawalForm.points_amount.toLocaleString()}원</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span className="text-gray-700">세금 공제 (3.3%)</span>
                        <span className="font-medium text-red-600">-{Math.floor(withdrawalForm.points_amount * 0.033).toLocaleString()}원</span>
                      </div>

                      <div className="border-t border-blue-300 pt-2 mt-2">
                        <div className="flex justify-between">
                          <span className="font-semibold text-gray-900">실수령액</span>
                          <span className="text-xl font-bold text-blue-700">
                            {(withdrawalForm.points_amount - Math.floor(withdrawalForm.points_amount * 0.033)).toLocaleString()}원
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                      <button
                        onClick={() => setCurrentStep('account')}
                        className="flex-1 px-4 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
                      >
                        이전
                      </button>
                      <button
                        onClick={handleFinalSubmit}
                        disabled={loading}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {loading ? '요청중...' : '출금 요청 완료'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithdrawalRequest
