
import { useState } from 'react'
import { lumi } from '../lib/lumi'
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
      const { list: profiles } = await lumi.entities.user_profiles.list()
      const userProfile = profiles.find(p => p.user_id === userId)
      
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
      const { taxRate, taxAmount, finalAmount } = calculateTax(requestedAmount)

      // 출금 요청 생성
      await lumi.entities.withdrawal_requests.create({
        user_id: userId,
        requested_amount: requestedAmount,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        tax_rate: taxRate,
        tax_amount: taxAmount,
        final_amount: finalAmount,
        status: 'pending',
        admin_note: '',
        processed_by: '',
        processed_at: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 사용자 잔액에서 차감 (요청 시점에 차감)
      await lumi.entities.user_profiles.update(userProfile._id, {
        current_balance: userProfile.current_balance - requestedAmount,
        updated_at: new Date().toISOString()
      })

      // 포인트 사용 기록 생성
      await lumi.entities.user_points.create({
        user_id: userId,
        transaction_type: 'withdrawal_requested',
        amount: requestedAmount,
        experience_code: '',
        description: `출금 요청 (${bankInfo.bankName} ${bankInfo.accountNumber})`,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        tax_amount: taxAmount,
        final_amount: finalAmount,
        status: 'pending',
        created_at: new Date().toISOString(),
        processed_at: ''
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
      const { list: withdrawals } = await lumi.entities.withdrawal_requests.list()
      return withdrawals.filter(w => w.user_id === userId).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } catch (error) {
      console.error('출금 내역 조회 실패:', error)
      return []
    }
  }

  // 출금 가능 금액 조회
  const getWithdrawableAmount = async (userId: string) => {
    try {
      const { list: profiles } = await lumi.entities.user_profiles.list()
      const userProfile = profiles.find(p => p.user_id === userId)
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
