
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePoints } from '../hooks/usePoints'
import { useWithdrawal } from '../hooks/useWithdrawal'
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

const Points: React.FC = () => {
  const { user } = useAuth()
  const { fetchPointsHistory, userPoints } = usePoints()
  const { requestWithdrawal, getUserWithdrawals, calculateTax } = useWithdrawal()
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([])
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalData, setWithdrawalData] = useState({
    requested_amount: '',
    bank_name: '',
    account_number: '',
    account_holder: ''
  })
  const [previewTax, setPreviewTax] = useState({ taxAmount: 0, finalAmount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    // 출금 금액 변경 시 세금 미리보기 계산
    const amount = Number(withdrawalData.requested_amount)
    if (amount > 0) {
      const { taxAmount, finalAmount } = calculateTax(amount)
      setPreviewTax({ taxAmount, finalAmount })
    } else {
      setPreviewTax({ taxAmount: 0, finalAmount: 0 })
    }
  }, [withdrawalData.requested_amount])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      const [pointsHistory, userWithdrawals] = await Promise.all([
        fetchPointsHistory(user.user_id),
        getUserWithdrawals(user.user_id)
      ])
      
      setPointHistory(pointsHistory)
      setWithdrawalHistory(userWithdrawals)
    } catch (error) {
      console.error('데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const amount = Number(withdrawalData.requested_amount)
    
    // 출금 가능 여부 확인
    const success = await requestWithdrawal(user.user_id, amount, {
      bankName: withdrawalData.bank_name,
      accountNumber: withdrawalData.account_number,
      accountHolder: withdrawalData.account_holder
    })

    if (success) {
      setShowWithdrawalModal(false)
      setWithdrawalData({
        requested_amount: '',
        bank_name: '',
        account_number: '',
        account_holder: ''
      })
      loadData() // 데이터 새로고침
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: '승인됨', color: 'bg-blue-100 text-blue-800' },
      processing: { text: '처리중', color: 'bg-purple-100 text-purple-800' },
      completed: { text: '완료', color: 'bg-green-100 text-green-800' },
      rejected: { text: '거절됨', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.pending
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">포인트 정보를 확인하려면 로그인해주세요</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">포인트</h1>
        <p className="text-gray-600">
          체험단 활동으로 적립한 포인트를 관리하고 출금하세요
        </p>
      </div>

      {/* 포인트 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">현재 잔액</p>
              <p className="text-2xl font-bold text-gray-900">
                {userPoints?.available_points?.toLocaleString() || 0}P
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 적립</p>
              <p className="text-2xl font-bold text-gray-900">
                {userPoints?.total_points?.toLocaleString() || 0}P
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">체험단 참여</p>
              <p className="text-2xl font-bold text-gray-900">
                {pointHistory.filter((h: any) => h.type === 'earned').length}회
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 출금 버튼 */}
      <div className="mb-8">
        <button
          onClick={() => setShowWithdrawalModal(true)}
          disabled={!userPoints?.available_points || userPoints.available_points < 1000}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          <ArrowUpRight className="w-5 h-5" />
          <span>포인트 출금</span>
        </button>
        {userPoints?.available_points && userPoints.available_points < 1000 && (
          <p className="text-sm text-gray-500 mt-2">
            최소 출금 금액은 1,000P입니다
          </p>
        )}
      </div>

      {/* 출금 내역 */}
      {withdrawalHistory.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">출금 내역</h2>
          </div>
          <div className="divide-y">
            {withdrawalHistory.map((withdrawal) => (
              <div key={withdrawal._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {withdrawal.bank_name} {withdrawal.account_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          예금주: {withdrawal.account_holder}
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                          요청: {withdrawal.requested_amount?.toLocaleString()}원 | 
                          세금: {withdrawal.tax_amount?.toLocaleString()}원 | 
                          실지급: {withdrawal.final_amount?.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(withdrawal.status).color}`}>
                      {getStatusBadge(withdrawal.status).text}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                {withdrawal.admin_note && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>관리자 메모:</strong> {withdrawal.admin_note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 포인트 거래 내역 */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">포인트 내역</h2>
        </div>
        <div className="divide-y">
          {pointHistory.length > 0 ? (
            pointHistory.map((point) => (
              <div key={point._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {point.transaction_type === 'earned' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {point.description}
                      </h3>
                      {point.experience_code && (
                        <p className="text-sm text-gray-600">
                          체험단: {point.experience_code}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      point.transaction_type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {point.transaction_type === 'earned' ? '+' : ''}{point.amount?.toLocaleString()}P
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(point.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>포인트 거래 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 출금 요청 모달 */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">포인트 출금</h2>
              
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출금 금액
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1000"
                      max={userPoints?.available_points || 0}
                      value={withdrawalData.requested_amount}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, requested_amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="1000"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">P</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    출금 가능: {userPoints?.available_points?.toLocaleString() || 0}P (최소 1,000P)
                  </p>
                </div>

                {/* 세금 미리보기 */}
                {previewTax.finalAmount > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">출금 정보</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>요청 금액:</span>
                        <span>{Number(withdrawalData.requested_amount).toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>세금 (3.3%):</span>
                        <span>-{previewTax.taxAmount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>실지급액:</span>
                        <span>{previewTax.finalAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    은행명
                  </label>
                  <select
                    required
                    value={withdrawalData.bank_name}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, bank_name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="">은행을 선택하세요</option>
                    <option value="국민은행">국민은행</option>
                    <option value="신한은행">신한은행</option>
                    <option value="우리은행">우리은행</option>
                    <option value="하나은행">하나은행</option>
                    <option value="기업은행">기업은행</option>
                    <option value="농협은행">농협은행</option>
                    <option value="카카오뱅크">카카오뱅크</option>
                    <option value="토스뱅크">토스뱅크</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    계좌번호
                  </label>
                  <input
                    required
                    value={withdrawalData.account_number}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, account_number: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="123456-78-901234"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    예금주명
                  </label>
                  <input
                    required
                    value={withdrawalData.account_holder}
                    onChange={(e) => setWithdrawalData(prev => ({ ...prev, account_holder: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                    placeholder="홍길동"
                  />
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawalModal(false)
                      setWithdrawalData({
                        requested_amount: '',
                        bank_name: '',
                        account_number: '',
                        account_holder: ''
                      })
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700"
                  >
                    출금 요청
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Points
