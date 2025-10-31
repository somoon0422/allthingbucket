import React, { useState, useEffect } from 'react'
import { X, DollarSign, CreditCard, AlertCircle, Calendar, CheckCircle, ArrowRight } from 'lucide-react'
import WithdrawalLegalNotice, { AgreementData } from './WithdrawalLegalNotice'

interface WithdrawalRequestModalProps {
  isOpen: boolean
  onClose: () => void
  availablePoints: number
  onSubmit: (data: WithdrawalFormData) => Promise<void>
  existingBankAccount?: BankAccountInfo | null
}

export interface BankAccountInfo {
  id?: string
  bank_name: string
  account_number: string
  account_holder: string
  is_verified?: boolean
}

export interface WithdrawalFormData {
  amount: number
  bankAccount: BankAccountInfo
  residentNumber: string
  agreements: AgreementData
  agreementIp?: string
}

const WithdrawalRequestModal: React.FC<WithdrawalRequestModalProps> = ({
  isOpen,
  onClose,
  availablePoints,
  onSubmit,
  existingBankAccount
}) => {
  const [step, setStep] = useState(1) // 1: 금액입력, 2: 계좌정보, 3: 법적동의
  const [amount, setAmount] = useState('')
  const [residentNumber, setResidentNumber] = useState('')
  const [agreements, setAgreements] = useState<AgreementData>({
    taxAgreement: false,
    privacyAgreement: false,
    taxWithholdingAgreement: false,
    allAgreed: false,
    timestamp: ''
  })

  const [bankAccount, setBankAccount] = useState<BankAccountInfo>({
    bank_name: existingBankAccount?.bank_name || '',
    account_number: existingBankAccount?.account_number || '',
    account_holder: existingBankAccount?.account_holder || ''
  })

  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setStep(1)
      setAmount('')
      if (existingBankAccount) {
        setBankAccount({
          bank_name: existingBankAccount.bank_name,
          account_number: existingBankAccount.account_number,
          account_holder: existingBankAccount.account_holder
        })
      }
    }
  }, [isOpen, existingBankAccount])

  // 세금 계산
  const calculateTax = (requestAmount: number) => {
    const taxAmount = Math.floor(requestAmount * 0.033)
    const finalAmount = requestAmount - taxAmount
    return { taxAmount, finalAmount }
  }

  const { taxAmount, finalAmount } = amount ? calculateTax(Number(amount)) : { taxAmount: 0, finalAmount: 0 }

  // 지급 예정일 계산
  const calculatePaymentDate = () => {
    const today = new Date()
    const day = today.getDate()

    let paymentDate = new Date()

    if (day <= 10) {
      // 당월 15일
      paymentDate.setDate(15)
    } else if (day <= 20) {
      // 당월 25일
      paymentDate.setDate(25)
    } else {
      // 익월 5일
      paymentDate.setMonth(paymentDate.getMonth() + 1)
      paymentDate.setDate(5)
    }

    return paymentDate.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const handleSubmit = async () => {
    if (!amount || Number(amount) < 1000) {
      alert('최소 출금 금액은 1,000P입니다')
      return
    }

    if (!bankAccount.bank_name || !bankAccount.account_number || !bankAccount.account_holder) {
      alert('계좌 정보를 모두 입력해주세요')
      return
    }

    if (residentNumber.replace(/-/g, '').length !== 13) {
      alert('주민등록번호를 정확히 입력해주세요')
      return
    }

    if (!agreements.allAgreed) {
      alert('모든 필수 동의 항목에 동의해주세요')
      return
    }

    try {
      setLoading(true)

      // IP 주소 가져오기 (법적 증빙용)
      let userIp = ''
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json')
        const ipData = await ipResponse.json()
        userIp = ipData.ip
      } catch (error) {
        console.warn('IP 주소 조회 실패:', error)
      }

      await onSubmit({
        amount: Number(amount),
        bankAccount,
        residentNumber: residentNumber.replace(/-/g, ''),
        agreements,
        agreementIp: userIp
      })

      // 성공 시 모달 닫기
      onClose()
    } catch (error) {
      console.error('출금 신청 실패:', error)
      alert('출금 신청 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  const canProceedToNextStep = () => {
    switch (step) {
      case 1:
        return amount && Number(amount) >= 1000 && Number(amount) <= availablePoints
      case 2:
        return bankAccount.bank_name && bankAccount.account_number && bankAccount.account_holder
      case 3:
        return agreements.allAgreed && residentNumber.replace(/-/g, '').length === 13
      default:
        return false
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 z-10">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">포인트 출금 신청</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* 진행 단계 표시 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 1 ? 'bg-navy-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
              </div>
              <span className="ml-2 text-sm font-medium">금액 입력</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 2 ? 'bg-navy-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                {step > 2 ? <CheckCircle className="w-5 h-5" /> : '2'}
              </div>
              <span className="ml-2 text-sm font-medium">계좌 정보</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400 mx-2" />
            <div className="flex items-center flex-1">
              <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                step >= 3 ? 'bg-navy-600 text-white' : 'bg-gray-200 text-gray-600'
              }`}>
                3
              </div>
              <span className="ml-2 text-sm font-medium">법적 동의</span>
            </div>
          </div>
        </div>

        {/* 본문 */}
        <div className="p-6">
          {/* STEP 1: 금액 입력 */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  출금 금액
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    min="1000"
                    max={availablePoints}
                    placeholder="1,000"
                    className="w-full pl-10 pr-12 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                  />
                  <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">
                    P
                  </span>
                </div>
                <div className="mt-2 flex justify-between text-sm">
                  <span className="text-gray-600">
                    출금 가능: {availablePoints.toLocaleString()}P
                  </span>
                  <button
                    onClick={() => setAmount(availablePoints.toString())}
                    className="text-navy-600 hover:text-navy-800 font-medium"
                  >
                    전액 출금
                  </button>
                </div>
                {amount && Number(amount) < 1000 && (
                  <p className="mt-2 text-sm text-red-600">
                    ✗ 최소 출금 금액은 1,000P입니다
                  </p>
                )}
                {amount && Number(amount) > availablePoints && (
                  <p className="mt-2 text-sm text-red-600">
                    ✗ 출금 가능한 포인트를 초과했습니다
                  </p>
                )}
              </div>

              {/* 출금 정보 미리보기 */}
              {amount && Number(amount) >= 1000 && (
                <div className="bg-gradient-to-br from-navy-50 to-purple-50 rounded-lg p-5 border border-navy-200">
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <Calculator className="w-5 h-5 mr-2 text-navy-600" />
                    출금 정보
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">출금 신청액</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {Number(amount).toLocaleString()}원
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-red-600">
                      <span className="flex items-center">
                        <AlertCircle className="w-4 h-4 mr-1" />
                        원천징수 (3.3%)
                      </span>
                      <span className="font-semibold">
                        -{taxAmount.toLocaleString()}원
                      </span>
                    </div>
                    <div className="border-t border-navy-200 pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-900 font-semibold">실제 입금액</span>
                        <span className="text-2xl font-bold text-navy-600">
                          {finalAmount.toLocaleString()}원
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-navy-200">
                      <span className="text-sm text-gray-600 flex items-center">
                        <Calendar className="w-4 h-4 mr-1" />
                        예상 입금일
                      </span>
                      <span className="text-sm font-semibold text-navy-600">
                        {calculatePaymentDate()}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 출금 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">출금 안내</h4>
                    <ul className="text-xs text-blue-800 space-y-1">
                      <li>• 최소 출금 금액: 1,000원</li>
                      <li>• 원천징수: 3.3% (소득세 3% + 지방소득세 0.3%)</li>
                      <li>• 지급 일정: 신청 기간에 따라 당월 15일, 25일 또는 익월 5일</li>
                      <li>• 본인 명의 계좌만 가능</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: 계좌 정보 */}
          {step === 2 && (
            <div className="space-y-6">
              {existingBankAccount && existingBankAccount.is_verified ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center mb-3">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                    <span className="font-semibold text-green-900">인증된 계좌 정보</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">은행</span>
                      <span className="font-medium">{bankAccount.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">계좌번호</span>
                      <span className="font-medium">{bankAccount.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">예금주</span>
                      <span className="font-medium">{bankAccount.account_holder}</span>
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-green-700">
                    이미 인증된 계좌로 안전하게 출금됩니다
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-navy-600" />
                    입금 계좌 정보
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        은행명 *
                      </label>
                      <select
                        value={bankAccount.bank_name}
                        onChange={(e) => setBankAccount({ ...bankAccount, bank_name: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      >
                        <option value="">은행을 선택하세요</option>
                        <option value="KB국민은행">KB국민은행</option>
                        <option value="신한은행">신한은행</option>
                        <option value="우리은행">우리은행</option>
                        <option value="하나은행">하나은행</option>
                        <option value="NH농협은행">NH농협은행</option>
                        <option value="IBK기업은행">IBK기업은행</option>
                        <option value="SC제일은행">SC제일은행</option>
                        <option value="한국씨티은행">한국씨티은행</option>
                        <option value="카카오뱅크">카카오뱅크</option>
                        <option value="케이뱅크">케이뱅크</option>
                        <option value="토스뱅크">토스뱅크</option>
                        <option value="새마을금고">새마을금고</option>
                        <option value="신협">신협</option>
                        <option value="우체국">우체국</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        계좌번호 *
                      </label>
                      <input
                        type="text"
                        value={bankAccount.account_number}
                        onChange={(e) => setBankAccount({ ...bankAccount, account_number: e.target.value.replace(/[^0-9-]/g, '') })}
                        placeholder="계좌번호를 입력하세요"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        예금주명 *
                      </label>
                      <input
                        type="text"
                        value={bankAccount.account_holder}
                        onChange={(e) => setBankAccount({ ...bankAccount, account_holder: e.target.value })}
                        placeholder="예금주명을 입력하세요"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div>
                    <h4 className="text-sm font-semibold text-yellow-900 mb-2">계좌 확인 사항</h4>
                    <ul className="text-xs text-yellow-800 space-y-1">
                      <li>• 반드시 본인 명의 계좌를 입력해주세요</li>
                      <li>• 실명인증 및 계좌 확인 후 출금이 처리됩니다</li>
                      <li>• 타인 명의 계좌는 출금이 불가능합니다</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: 법적 동의 */}
          {step === 3 && (
            <WithdrawalLegalNotice
              onAllAgreed={setAgreements}
              residentNumber={residentNumber}
              onResidentNumberChange={setResidentNumber}
            />
          )}
        </div>

        {/* 푸터 버튼 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-6">
          <div className="flex space-x-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                이전
              </button>
            )}
            {step < 3 ? (
              <button
                onClick={() => setStep(step + 1)}
                disabled={!canProceedToNextStep()}
                className="flex-1 px-6 py-3 bg-navy-600 text-white rounded-lg font-medium hover:bg-navy-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                다음
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!canProceedToNextStep() || loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    <span>출금 신청 완료</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Calculator 아이콘 추가 (lucide-react에 없는 경우 대체)
const Calculator = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
  </svg>
)

export default WithdrawalRequestModal
