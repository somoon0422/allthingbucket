
import React, { useState, useEffect } from 'react'
import { useAuth } from '../hooks/useAuth'
import { usePointsManagement } from '../hooks/usePointsManagement'
// Lumi SDK 제거됨 - MongoDB API 사용
import toast from 'react-hot-toast'
import { 
  Calculator, AlertCircle, CheckCircle, 
  Clock, X, DollarSign, Receipt, TrendingDown
} from 'lucide-react'

const WithdrawalRequest: React.FC = () => {
  const { user } = useAuth()
  const { calculateTax, requestWithdrawal, getWithdrawalRequests, loading } = usePointsManagement()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [withdrawalAmount, setWithdrawalAmount] = useState('')
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([])
  const [showTaxInfo, setShowTaxInfo] = useState(false)
  const [profileLoading, setProfileLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    try {
      setProfileLoading(true)
      
      // 사용자 프로필 조회 - MongoDB API 사용
      const profilesResponse = await fetch('/api/db/user-profiles')
      const profilesResult = await profilesResponse.json()
      const profiles = profilesResult.success ? profilesResult.data : []
      const profile = Array.isArray(profiles) 
        ? profiles.find((p: any) => p && p.user_id === user.user_id)
        : null
      setUserProfile(profile)

      // 출금 요청 내역 조회
      const withdrawals = await getWithdrawalRequests()
      const userWithdrawals = withdrawals.filter(w => w.user_id === user.user_id)
      setWithdrawalHistory(userWithdrawals)

    } catch (error) {
      console.error('사용자 데이터 로딩 실패:', error)
      toast.error('데이터를 불러오는데 실패했습니다')
    } finally {
      setProfileLoading(false)
    }
  }

  const handleWithdrawalRequest = async () => {
    if (!user || !userProfile) {
      toast.error('사용자 정보를 불러오는 중입니다')
      return
    }

    const amount = parseInt(withdrawalAmount)
    if (!amount || amount <= 0) {
      toast.error('올바른 금액을 입력해주세요')
      return
    }

    if (amount < 10000) {
      toast.error('최소 출금 금액은 10,000P입니다')
      return
    }

    if (amount > (userProfile.current_balance || 0)) {
      toast.error('잔액이 부족합니다')
      return
    }

    if (!userProfile.bank_name || !userProfile.account_number || !userProfile.account_holder) {
      toast.error('계좌 정보를 먼저 등록해주세요')
      return
    }

    const success = await requestWithdrawal(user.user_id, amount, {
      bankName: userProfile.bank_name,
      accountNumber: userProfile.account_number,
      accountHolder: userProfile.account_holder
    })

    if (success) {
      setWithdrawalAmount('')
      loadUserData() // 데이터 새로고침
    }
  }

  const taxInfo = withdrawalAmount ? calculateTax(parseInt(withdrawalAmount) || 0) : null

  const getStatusBadge = (status: string) => {
    const statusInfo = {
      pending: { text: '검토중', icon: Clock, color: 'bg-yellow-100 text-yellow-800' },
      approved: { text: '승인완료', icon: CheckCircle, color: 'bg-green-100 text-green-800' },
      rejected: { text: '거절됨', icon: X, color: 'bg-red-100 text-red-800' },
      completed: { text: '입금완료', icon: CheckCircle, color: 'bg-blue-100 text-blue-800' }
    }
    const info = statusInfo[status as keyof typeof statusInfo] || statusInfo.pending
    const Icon = info.icon
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${info.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {info.text}
      </span>
    )
  }

  if (profileLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">정보를 불러오는 중...</p>
        </div>
      </div>
    )
  }

  if (!userProfile) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center bg-white rounded-xl shadow-sm p-8">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">프로필 정보가 필요합니다</h2>
          <p className="text-gray-500 mb-4">출금을 위해서는 먼저 프로필을 등록해주세요</p>
          <button
            onClick={() => window.location.href = '/profile'}
            className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
          >
            프로필 등록하기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">포인트 출금</h1>
        <p className="text-gray-600">
          적립된 포인트를 현금으로 출금할 수 있습니다 (3.3% 세금 자동 차감)
        </p>
      </div>

      {/* 🔹 잔액 정보 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">내 포인트 현황</h2>
          <DollarSign className="w-6 h-6 text-green-500" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-2xl font-bold text-green-600">
              {(userProfile.current_balance || 0).toLocaleString()}P
            </p>
            <p className="text-sm text-green-700 mt-1">현재 잔액</p>
          </div>

          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-2xl font-bold text-blue-600">
              {(userProfile.total_points_earned || 0).toLocaleString()}P
            </p>
            <p className="text-sm text-blue-700 mt-1">총 적립</p>
          </div>

          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-2xl font-bold text-orange-600">
              {(userProfile.total_points_withdrawn || 0).toLocaleString()}P
            </p>
            <p className="text-sm text-orange-700 mt-1">총 출금</p>
          </div>
        </div>
      </div>

      {/* 🔹 출금 요청 */}
      <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">출금 요청</h2>
          <button
            onClick={() => setShowTaxInfo(!showTaxInfo)}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800"
          >
            <Calculator className="w-4 h-4" />
            <span>세금 정보</span>
          </button>
        </div>

        {/* 세금 정보 */}
        {showTaxInfo && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-900 mb-2">세금 차감 안내</h3>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• 모든 출금 시 3.3% 원천징수세가 자동 차감됩니다</li>
                  <li>• 최소 출금 금액: 10,000P</li>
                  <li>• 출금은 영업일 기준 1-3일 소요됩니다</li>
                  <li>• 세금계산서는 별도로 발행되지 않습니다</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 출금 금액 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              출금 금액 (포인트)
            </label>
            <input
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              placeholder="10000"
              min="10000"
              max={userProfile.current_balance || 0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">
              최소 10,000P, 최대 {(userProfile.current_balance || 0).toLocaleString()}P
            </p>
          </div>

          {/* 세금 계산 결과 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              실제 수령액 계산
            </label>
            {taxInfo ? (
              <div className="bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between text-sm mb-1">
                  <span>출금 요청액:</span>
                  <span>{taxInfo.grossAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between text-sm mb-1 text-red-600">
                  <span>차감 세금 (3.3%):</span>
                  <span>-{taxInfo.taxAmount.toLocaleString()}원</span>
                </div>
                <div className="flex justify-between font-medium text-green-600 border-t pt-1">
                  <span>실수령액:</span>
                  <span>{taxInfo.netAmount.toLocaleString()}원</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded-lg text-gray-500 text-sm">
                금액을 입력하면 계산됩니다
              </div>
            )}
          </div>
        </div>

        {/* 계좌 정보 */}
        <div className="mt-6 pt-6 border-t">
          <h3 className="font-medium text-gray-900 mb-3">출금 계좌 정보</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">은행명</p>
              <p className="font-medium">{userProfile.bank_name || '미등록'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">계좌번호</p>
              <p className="font-medium">{userProfile.account_number || '미등록'}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-500">예금주</p>
              <p className="font-medium">{userProfile.account_holder || '미등록'}</p>
            </div>
          </div>
        </div>

        {/* 출금 요청 버튼 */}
        <div className="mt-6">
          <button
            onClick={handleWithdrawalRequest}
            disabled={loading || !withdrawalAmount || parseInt(withdrawalAmount) < 10000}
            className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? '처리 중...' : '출금 요청하기'}
          </button>
        </div>
      </div>

      {/* 🔹 출금 내역 */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Receipt className="w-6 h-6 text-gray-600" />
          <h2 className="text-xl font-bold text-gray-900">출금 내역</h2>
        </div>

        {withdrawalHistory.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    요청일
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    출금액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    차감 세금
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    실수령액
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    상태
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    처리일
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {withdrawalHistory.map((withdrawal) => (
                  <tr key={withdrawal._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(withdrawal.requested_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {withdrawal.requested_amount.toLocaleString()}P
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                      -{withdrawal.tax_amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                      {withdrawal.net_amount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(withdrawal.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {withdrawal.processed_at 
                        ? new Date(withdrawal.processed_at).toLocaleDateString('ko-KR')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8">
            <TrendingDown className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">출금 내역이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default WithdrawalRequest
