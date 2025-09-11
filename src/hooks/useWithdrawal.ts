
import { useState } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

export const useWithdrawal = () => {
  const [loading, setLoading] = useState(false)

  // 자동 세금 계산 (3.3% 원천징수)
  const calculateTax = (amount: number) => {
    const taxRate = 0.033 // 3.3%
    const taxAmount = Math.floor(amount * taxRate)
    const finalAmount = amount - taxAmount
    
    return {
      taxRate,
      taxAmount,
      finalAmount
    }
  }

  // 출금 요청
  const requestWithdrawal = async (
    userId: string,
    requestedAmount: number,
    bankInfo: {
      bankName: string
      accountNumber: string
      accountHolder: string
    }
  ) => {
    setLoading(true)
    try {
      // 사용자 잔액 확인
      const profiles = await dataService.entities.user_profiles.list()
      const userProfile = profiles.find((p: any) => p.user_id === userId)
      
      if (!userProfile || userProfile.current_balance < requestedAmount) {
        toast.error('잔액이 부족합니다')
        return false
      }

      // 최소 출금 금액 확인 (10,000원)
      if (requestedAmount < 10000) {
        toast.error('최소 출금 금액은 10,000원입니다')
        return false
      }

      // 세금 계산
      const { finalAmount } = calculateTax(requestedAmount)

      // 출금 요청 생성
      await dataService.entities.withdrawal_requests.create({
        user_id: userId,
        amount: requestedAmount,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        status: 'pending'
      })

      // 사용자 잔액에서 차감 (요청 시점에 차감)
      await dataService.entities.user_profiles.update(userProfile.id, {
        current_balance: userProfile.current_balance - requestedAmount
      })

      // 포인트 히스토리 기록 생성
      await dataService.entities.points_history.create({
        user_id: userId,
        points: -requestedAmount,
        type: 'withdrawal_requested',
        description: `출금 요청 (${bankInfo.bankName} ${bankInfo.accountNumber})`
      })

      toast.success(`출금 요청이 완료되었습니다. 실제 지급액: ${finalAmount.toLocaleString()}원`)
      return true
    } catch (error) {
      console.error('출금 요청 실패:', error)
      toast.error('출금 요청에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 사용자 출금 내역 조회
  const getUserWithdrawals = async (userId: string) => {
    try {
      console.log('🔍 dataService 확인:', dataService)
      console.log('🔍 entities 확인:', dataService.entities)
      console.log('🔍 withdrawal_requests 확인:', dataService.entities.withdrawal_requests)
      
      const withdrawals = await dataService.entities.withdrawal_requests.list()
      return withdrawals.filter((w: any) => w.user_id === userId).sort((a: any, b: any) => 
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      )
    } catch (error) {
      console.error('출금 내역 조회 실패:', error)
      return []
    }
  }

  // 출금 가능 금액 조회
  const getWithdrawableAmount = async (userId: string) => {
    try {
      const profiles = await dataService.entities.user_profiles.list()
      const userProfile = profiles.find((p: any) => p.user_id === userId)
      return userProfile?.current_balance || 0
    } catch (error) {
      console.error('출금 가능 금액 조회 실패:', error)
      return 0
    }
  }

  return {
    loading,
    calculateTax,
    requestWithdrawal,
    getUserWithdrawals,
    getWithdrawableAmount
  }
}
