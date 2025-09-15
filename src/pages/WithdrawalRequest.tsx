import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useWithdrawal } from '../hooks/useWithdrawal'
import { usePoints } from '../hooks/usePoints'
import { CreditCard, DollarSign, AlertCircle, CheckCircle, Clock, X, Banknote, Shield, Plus } from 'lucide-react'

interface BankAccount {
  id: string
  bank_name: string
  account_number: string
  account_holder: string
  is_verified: boolean
  verified_at?: string
  created_at: string
}

interface WithdrawalRequest {
  id: string
  user_id: string
  bank_account_id: string
  points_amount: number
  withdrawal_amount: number
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  request_reason?: string
  admin_notes?: string
  created_at: string
  processed_at?: string
  bank_account?: BankAccount
}

const WithdrawalRequest: React.FC = () => {
  const { user } = useAuth()
  const { userPoints } = usePoints()
  const { requestWithdrawal, getUserWithdrawals, getBankAccounts, addBankAccount } = useWithdrawal()
  
  // 상태 관리
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([])
  const [withdrawalRequests, setWithdrawalRequests] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [showWithdrawalForm, setShowWithdrawalForm] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null)
  
  // 계좌 추가 폼
  const [accountForm, setAccountForm] = useState({
    bank_name: '',
    account_number: '',
    account_holder: ''
  })
  
  // 출금 요청 폼
  const [withdrawalForm, setWithdrawalForm] = useState({
    points_amount: 0,
    request_reason: ''
  })

  // 은행 목록
  const bankList = [
    '국민은행', '신한은행', '우리은행', '하나은행', '농협은행', 
    '기업은행', '새마을금고', '신협', '우체국', '카카오뱅크', 
    '토스뱅크', '케이뱅크', '부산은행', '대구은행', '경남은행'
  ]

  // 데이터 로드
  useEffect(() => {
    if (user?.user_id) {
      loadBankAccounts()
      loadWithdrawalRequests()
    }
  }, [user?.user_id])

  const loadBankAccounts = async () => {
    try {
      setLoading(true)
      const accounts = await getBankAccounts(user?.user_id || '')
      setBankAccounts(accounts || [])
    } catch (error) {
      console.error('계좌 정보 로드 실패:', error)
    } finally {
      setLoading(false)
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

  // 계좌 추가
  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!accountForm.bank_name || !accountForm.account_number || !accountForm.account_holder) {
      alert('모든 필드를 입력해주세요.')
      return
    }

    try {
      setLoading(true)
      const newAccount = await addBankAccount(user?.user_id || '', accountForm)
      
      if (newAccount) {
        setAccountForm({ bank_name: '', account_number: '', account_holder: '' })
        setShowAddAccount(false)
        loadBankAccounts()
      }
    } catch (error) {
      console.error('계좌 등록 실패:', error)
      alert('계좌 등록 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 출금 요청
  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedAccount) {
      alert('출금 계좌를 선택해주세요.')
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
        selectedAccount.id,
        withdrawalForm.points_amount,
        withdrawalForm.request_reason
      )
      
      if (newRequest) {
        setWithdrawalForm({ points_amount: 0, request_reason: '' })
        setShowWithdrawalForm(false)
        setSelectedAccount(null)
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 계좌 관리 */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                등록된 계좌
              </h2>
              <button
                onClick={() => setShowAddAccount(true)}
                className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-1" />
                계좌 추가
              </button>
            </div>

            {bankAccounts.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">등록된 계좌가 없습니다</p>
                <p className="text-sm text-gray-400">출금을 위해 계좌를 등록해주세요</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bankAccounts.map((account) => (
                  <div
                    key={account.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedAccount?.id === account.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedAccount(account)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{account.bank_name}</span>
                          {account.is_verified && (
                            <Shield className="w-4 h-4 text-green-500 ml-2" />
                          )}
                        </div>
                        <p className="text-sm text-gray-600">{account.account_number}</p>
                        <p className="text-sm text-gray-500">{account.account_holder}</p>
                      </div>
                      <div className="text-right">
                        {account.is_verified ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            인증됨
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <Clock className="w-3 h-3 mr-1" />
                            대기중
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {selectedAccount && selectedAccount.is_verified && (
              <div className="mt-4">
                <button
                  onClick={() => setShowWithdrawalForm(true)}
                  className="w-full inline-flex items-center justify-center px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700"
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
                        {request.bank_account && (
                          <p className="text-sm text-gray-600">
                            {request.bank_account.bank_name} {request.bank_account.account_number}
                          </p>
                        )}
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

        {/* 계좌 추가 모달 */}
        {showAddAccount && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">계좌 정보 등록</h3>
                <button
                  onClick={() => setShowAddAccount(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행명
                  </label>
                  <select
                    value={accountForm.bank_name}
                    onChange={(e) => setAccountForm({ ...accountForm, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="">은행을 선택하세요</option>
                    {bankList.map((bank) => (
                      <option key={bank} value={bank}>{bank}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호
                  </label>
                  <input
                    type="text"
                    value={accountForm.account_number}
                    onChange={(e) => setAccountForm({ ...accountForm, account_number: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="계좌번호를 입력하세요"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예금주명
                  </label>
                  <input
                    type="text"
                    value={accountForm.account_holder}
                    onChange={(e) => setAccountForm({ ...accountForm, account_holder: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="예금주명을 입력하세요"
                    required
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowAddAccount(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading ? '등록중...' : '등록'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 출금 요청 모달 */}
        {showWithdrawalForm && selectedAccount && (
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

              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">출금 계좌</p>
                <p className="font-medium">{selectedAccount.bank_name} {selectedAccount.account_number}</p>
                <p className="text-sm text-gray-500">{selectedAccount.account_holder}</p>
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
      </div>
    </div>
  )
}

export default WithdrawalRequest