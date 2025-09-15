import { useState } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

interface BankAccount {
  id: string
  user_id: string
  bank_name: string
  account_number: string
  account_holder: string
  is_verified: boolean
  verified_at?: string
  created_at: string
  updated_at: string
}

interface WithdrawalRequest {
  id: string
  user_id: string
  bank_account_id: string
  points_amount: number
  withdrawal_amount: number
  exchange_rate: number
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'failed'
  request_reason?: string
  admin_notes?: string
  processed_by?: string
  processed_at?: string
  completed_at?: string
  created_at: string
  updated_at: string
  bank_account?: BankAccount
}

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

  // 계좌 정보 조회
  const getBankAccounts = async (userId: string): Promise<BankAccount[]> => {
    try {
      const accounts = await (dataService.entities as any).bank_accounts.list({
        filter: { user_id: userId }
      })
      return accounts || []
    } catch (error) {
      console.error('계좌 정보 조회 실패:', error)
      return []
    }
  }

  // 계좌 정보 등록
  const addBankAccount = async (
    userId: string,
    bankInfo: {
      bank_name: string
      account_number: string
      account_holder: string
    }
  ): Promise<BankAccount | null> => {
    try {
      setLoading(true)
      
      const accountData = {
        user_id: userId,
        bank_name: bankInfo.bank_name,
        account_number: bankInfo.account_number,
        account_holder: bankInfo.account_holder,
        is_verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const newAccount = await (dataService.entities as any).bank_accounts.create(accountData)
      
      if (newAccount) {
        toast.success('계좌 정보가 등록되었습니다. 관리자 승인 후 사용 가능합니다.')
        return newAccount
      }
      
      return null
    } catch (error) {
      console.error('계좌 등록 실패:', error)
      toast.error('계좌 등록 중 오류가 발생했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 출금 요청
  const requestWithdrawal = async (
    userId: string,
    bankAccountId: string,
    pointsAmount: number,
    requestReason?: string
  ): Promise<WithdrawalRequest | null> => {
    try {
      setLoading(true)

      // 사용자 포인트 확인
      const userPoints = await (dataService.entities as any).user_points.list({
        filter: { user_id: userId }
      })
      
      const currentPoints = userPoints?.[0]?.points || 0
      
      if (currentPoints < pointsAmount) {
        toast.error('보유 포인트가 부족합니다')
        return null
      }

      // 최소 출금 금액 확인 (1,000P)
      if (pointsAmount < 1000) {
        toast.error('최소 출금 금액은 1,000P입니다')
        return null
      }

      // 환율 적용 (1P = 1원, 추후 동적으로 변경 가능)
      const exchangeRate = 1.0
      const withdrawalAmount = pointsAmount * exchangeRate

      // 출금 요청 데이터 생성
      const withdrawalData = {
        user_id: userId,
        bank_account_id: bankAccountId,
        points_amount: pointsAmount,
        withdrawal_amount: withdrawalAmount,
        exchange_rate: exchangeRate,
        status: 'pending',
        request_reason: requestReason,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      const newRequest = await (dataService.entities as any).withdrawal_requests.create(withdrawalData)
      
      if (newRequest) {
        toast.success('출금 요청이 접수되었습니다. 관리자 승인 후 처리됩니다.')
        return newRequest
      }
      
      return null
    } catch (error) {
      console.error('출금 요청 실패:', error)
      toast.error('출금 요청 중 오류가 발생했습니다.')
      return null
    } finally {
      setLoading(false)
    }
  }

  // 사용자 출금 요청 내역 조회
  const getUserWithdrawals = async (userId?: string): Promise<WithdrawalRequest[]> => {
    try {
      if (!userId) return []
      
      const requests = await (dataService.entities as any).withdrawal_requests.list({
        filter: { user_id: userId }
      })
      
      // 계좌 정보와 함께 조회
      const requestsWithAccounts = await Promise.all(
        (requests || []).map(async (request: WithdrawalRequest) => {
          try {
            const account = await (dataService.entities as any).bank_accounts.get(request.bank_account_id)
            return {
              ...request,
              bank_account: account
            }
          } catch (error) {
            console.error('계좌 정보 조회 실패:', error)
            return request
          }
        })
      )
      
      return requestsWithAccounts.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } catch (error) {
      console.error('출금 요청 내역 조회 실패:', error)
      return []
    }
  }

  // 관리자용: 모든 출금 요청 조회
  const getAllWithdrawalRequests = async (): Promise<WithdrawalRequest[]> => {
    try {
      const requests = await (dataService.entities as any).withdrawal_requests.list()
      
      // 계좌 정보와 사용자 정보와 함께 조회
      const requestsWithDetails = await Promise.all(
        (requests || []).map(async (request: WithdrawalRequest) => {
          try {
            const [account, userProfile] = await Promise.all([
              (dataService.entities as any).bank_accounts.get(request.bank_account_id),
              (dataService.entities as any).user_profiles.list({
                filter: { user_id: request.user_id }
              })
            ])
            
            return {
              ...request,
              bank_account: account,
              user_profile: userProfile?.[0]
            }
          } catch (error) {
            console.error('상세 정보 조회 실패:', error)
            return request
          }
        })
      )
      
      return requestsWithDetails.sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
    } catch (error) {
      console.error('전체 출금 요청 조회 실패:', error)
      return []
    }
  }

  // 관리자용: 출금 요청 승인
  const approveWithdrawal = async (
    requestId: string,
    adminUserId: string,
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      // 출금 요청 정보 조회
      const request = await (dataService.entities as any).withdrawal_requests.get(requestId)
      if (!request) {
        toast.error('출금 요청을 찾을 수 없습니다')
        return false
      }

      // 사용자 포인트 재확인
      const userPoints = await (dataService.entities as any).user_points.list({
        filter: { user_id: request.user_id }
      })
      
      const currentPoints = userPoints?.[0]?.points || 0
      
      if (currentPoints < request.points_amount) {
        toast.error('사용자 포인트가 부족합니다')
        return false
      }

      // 출금 요청 상태 업데이트
      const updateData = {
        status: 'approved',
        processed_by: adminUserId,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      }

      await (dataService.entities as any).withdrawal_requests.update(requestId, updateData)
      
      toast.success('출금 요청이 승인되었습니다')
      return true
    } catch (error) {
      console.error('출금 승인 실패:', error)
      toast.error('출금 승인 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 관리자용: 출금 요청 거절
  const rejectWithdrawal = async (
    requestId: string,
    adminUserId: string,
    adminNotes: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      const updateData = {
        status: 'rejected',
        processed_by: adminUserId,
        processed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      }

      await (dataService.entities as any).withdrawal_requests.update(requestId, updateData)
      
      toast.success('출금 요청이 거절되었습니다')
      return true
    } catch (error) {
      console.error('출금 거절 실패:', error)
      toast.error('출금 거절 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 관리자용: 출금 완료 처리
  const completeWithdrawal = async (
    requestId: string,
    adminUserId: string,
    adminNotes?: string
  ): Promise<boolean> => {
    try {
      setLoading(true)

      const updateData = {
        status: 'completed',
        completed_at: new Date().toISOString(),
        admin_notes: adminNotes,
        updated_at: new Date().toISOString()
      }

      await (dataService.entities as any).withdrawal_requests.update(requestId, updateData)
      
      toast.success('출금 처리가 완료되었습니다')
      return true
    } catch (error) {
      console.error('출금 완료 처리 실패:', error)
      toast.error('출금 완료 처리 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 계좌 인증 (관리자용)
  const verifyBankAccount = async (
    accountId: string,
    isVerified: boolean
  ): Promise<boolean> => {
    try {
      setLoading(true)

      const updateData = {
        is_verified: isVerified,
        verified_at: isVerified ? new Date().toISOString() : null,
        updated_at: new Date().toISOString()
      }

      await (dataService.entities as any).bank_accounts.update(accountId, updateData)
      
      toast.success(`계좌가 ${isVerified ? '인증' : '인증 해제'}되었습니다`)
      return true
    } catch (error) {
      console.error('계좌 인증 실패:', error)
      toast.error('계좌 인증 중 오류가 발생했습니다.')
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    calculateTax,
    getBankAccounts,
    addBankAccount,
    requestWithdrawal,
    getUserWithdrawals,
    getAllWithdrawalRequests,
    approveWithdrawal,
    rejectWithdrawal,
    completeWithdrawal,
    verifyBankAccount
  }
}