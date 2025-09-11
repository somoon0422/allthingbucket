
import { useState, useCallback } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

export const usePointsManagement = () => {
  const [withdrawalRequests, setWithdrawalRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 출금 요청 목록 조회
  const fetchWithdrawalRequests = useCallback(async () => {
    setLoading(true)
    try {
      console.log('🔍 출금 요청 목록 조회 시작...')
      
      const result = await (dataService.entities as any).withdrawal_requests.list()
      const requests = result?.list || []
      console.log('💳 조회된 출금 요청:', requests)

      // 안전한 배열 처리
      const safeRequests = Array.isArray(requests) ? requests : []
      
      // 각 요청에 대해 안전한 데이터 처리
      const processedRequests = safeRequests.map(request => ({
        ...request,
        _id: request?._id || `temp_${Math.random()}`,
        user_id: request?.user_id || '',
        amount: request?.requested_amount || request?.amount || 0,
        requested_amount: request?.requested_amount || request?.amount || 0,
        tax_amount: request?.tax_amount || 0,
        net_amount: request?.net_amount || 0,
        bank_name: request?.bank_name || '은행 없음',
        account_number: request?.account_number || '계좌 없음',
        account_holder: request?.account_holder || '예금주 없음',
        status: request?.status || 'pending',
        requested_at: request?.requested_at || new Date().toISOString(),
        created_at: request?.created_at || new Date().toISOString()
      }))

      // 최신순으로 정렬
      const sortedRequests = processedRequests.sort((a, b) => 
        new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime()
      )

      setWithdrawalRequests(sortedRequests)
      console.log('✅ 출금 요청 목록 조회 완료:', sortedRequests.length, '건')
      
    } catch (error) {
      console.error('❌ 출금 요청 목록 조회 실패:', error)
      setWithdrawalRequests([]) // 빈 배열로 안전하게 설정
      toast.error('출금 요청 목록을 불러오는데 실패했습니다')
    } finally {
      setLoading(false)
    }
  }, [])

  // 관리자가 포인트 지급
  const givePoints = async (
    userId: string,
    amount: number,
    reason: string,
    adminId?: string,
    experienceCode?: string
  ) => {
    setLoading(true)
    try {
      console.log('💰 포인트 지급 시작:', { userId, amount, reason })

      // 포인트 지급 기록 생성
      await (dataService.entities as any).user_points.create({
        user_id: userId,
        amount: amount,
        type: 'earned',
        source: 'admin_grant',
        experience_code: experienceCode || '',
        description: reason,
        status: 'completed',
        granted_by: adminId || 'admin',
        granted_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 사용자 프로필의 포인트 잔액 업데이트
      const profilesResult = await (dataService.entities as any).user_profiles.list()
      const profiles = profilesResult?.list || []
      const safeProfiles = Array.isArray(profiles) ? profiles : []
      const userProfile = safeProfiles.find(p => p?.user_id === userId)
      
      if (userProfile) {
        await (dataService.entities as any).user_profiles.update(userProfile._id, {
          current_balance: (userProfile.current_balance || 0) + amount,
          total_points_earned: (userProfile.total_points_earned || 0) + amount,
          updated_at: new Date().toISOString()
        })
      }

      console.log('✅ 포인트 지급 완료')
      toast.success(`${amount.toLocaleString()}P 지급이 완료되었습니다`)
      return true
    } catch (error) {
      console.error('❌ 포인트 지급 실패:', error)
      toast.error('포인트 지급에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 세금 계산 (3.3% 원천징수)
  const calculateTax = (amount: number) => {
    const taxRate = 0.033 // 3.3%
    const taxAmount = Math.floor(amount * taxRate)
    const netAmount = amount - taxAmount
    
    return {
      grossAmount: amount,
      taxAmount: taxAmount,
      netAmount: netAmount,
      taxRate: taxRate * 100
    }
  }

  // 사용자 출금 요청
  const requestWithdrawal = async (
    userId: string,
    amount: number,
    bankInfo: {
      bankName: string
      accountNumber: string
      accountHolder: string
    }
  ) => {
    setLoading(true)
    try {
      // 사용자 잔액 확인
      const profilesResult = await (dataService.entities as any).user_profiles.list()
      const profiles = profilesResult?.list || []
      const safeProfiles = Array.isArray(profiles) ? profiles : []
      const userProfile = safeProfiles.find(p => p?.user_id === userId)
      
      if (!userProfile || (userProfile.current_balance || 0) < amount) {
        toast.error('잔액이 부족합니다')
        return false
      }

      // 세금 계산
      const taxInfo = calculateTax(amount)

      // 출금 요청 생성
      await (dataService.entities as any).withdrawal_requests.create({
        user_id: userId,
        requested_amount: amount,
        amount: amount, // 호환성을 위해 둘 다 설정
        tax_amount: taxInfo.taxAmount,
        net_amount: taxInfo.netAmount,
        bank_name: bankInfo.bankName,
        account_number: bankInfo.accountNumber,
        account_holder: bankInfo.accountHolder,
        status: 'pending',
        requested_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 포인트 차감 (보류 상태로)
      await (dataService.entities as any).user_points.create({
        user_id: userId,
        amount: -amount,
        type: 'withdrawn',
        source: 'withdrawal_request',
        description: `출금 요청 - ${taxInfo.netAmount.toLocaleString()}원 (세금 ${taxInfo.taxAmount.toLocaleString()}원 차감)`,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 사용자 프로필 잔액 업데이트 (보류 금액 반영)
      await (dataService.entities as any).user_profiles.update(userProfile._id, {
        current_balance: (userProfile.current_balance || 0) - amount,
        updated_at: new Date().toISOString()
      })

      toast.success(`출금 요청이 완료되었습니다. 실수령액: ${taxInfo.netAmount.toLocaleString()}원`)
      return true
    } catch (error) {
      console.error('출금 요청 실패:', error)
      toast.error('출금 요청에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 관리자가 출금 승인/거절
  const processWithdrawal = async (
    withdrawalId: string,
    action: 'approved' | 'rejected',
    adminId?: string,
    notes?: string
  ) => {
    setLoading(true)
    try {
      console.log('🔄 출금 처리 시작:', { withdrawalId, action })

      const result = await (dataService.entities as any).withdrawal_requests.list()
      const withdrawals = result?.list || []
      const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : []
      const withdrawal = safeWithdrawals.find(w => w?._id === withdrawalId)
      
      if (!withdrawal) {
        toast.error('출금 요청을 찾을 수 없습니다')
        return false
      }

      if (action === 'approved') {
        // 출금 승인
        await (dataService.entities as any).withdrawal_requests.update(withdrawalId, {
          status: 'approved',
          processed_by: adminId || 'admin',
          processed_at: new Date().toISOString(),
          admin_notes: notes || '',
          updated_at: new Date().toISOString()
        })

        // 포인트 기록 완료 처리
        const pointsResult = await (dataService.entities as any).user_points.list()
        const pointRecords = pointsResult?.list || []
        const safePointRecords = Array.isArray(pointRecords) ? pointRecords : []
        const pendingRecord = safePointRecords.find(p => 
          p?.user_id === withdrawal.user_id && 
          p?.amount === -(withdrawal.requested_amount || withdrawal.amount) && 
          p?.status === 'pending'
        )
        
        if (pendingRecord) {
          await (dataService.entities as any).user_points.update(pendingRecord._id, {
            status: 'completed',
            updated_at: new Date().toISOString()
          })
        }

        // 사용자 프로필 출금 총액 업데이트
        const profilesResult = await (dataService.entities as any).user_profiles.list()
        const profiles = profilesResult?.list || []
        const safeProfiles = Array.isArray(profiles) ? profiles : []
        const userProfile = safeProfiles.find(p => p?.user_id === withdrawal.user_id)
        
        if (userProfile) {
          await (dataService.entities as any).user_profiles.update(userProfile._id, {
            total_points_withdrawn: (userProfile.total_points_withdrawn || 0) + (withdrawal.requested_amount || withdrawal.amount),
            updated_at: new Date().toISOString()
          })
        }

        toast.success('출금이 승인되었습니다')
      } else {
        // 출금 거절 - 포인트 복구
        await (dataService.entities as any).withdrawal_requests.update(withdrawalId, {
          status: 'rejected',
          processed_by: adminId || 'admin',
          processed_at: new Date().toISOString(),
          admin_notes: notes || '',
          updated_at: new Date().toISOString()
        })

        // 포인트 복구
        const profilesResult = await (dataService.entities as any).user_profiles.list()
        const profiles = profilesResult?.list || []
        const safeProfiles = Array.isArray(profiles) ? profiles : []
        const userProfile = safeProfiles.find(p => p?.user_id === withdrawal.user_id)
        
        if (userProfile) {
          await (dataService.entities as any).user_profiles.update(userProfile._id, {
            current_balance: (userProfile.current_balance || 0) + (withdrawal.requested_amount || withdrawal.amount),
            updated_at: new Date().toISOString()
          })
        }

        // 포인트 기록 취소 처리
        const pointsResult = await (dataService.entities as any).user_points.list()
        const pointRecords = pointsResult?.list || []
        const safePointRecords = Array.isArray(pointRecords) ? pointRecords : []
        const pendingRecord = safePointRecords.find(p => 
          p?.user_id === withdrawal.user_id && 
          p?.amount === -(withdrawal.requested_amount || withdrawal.amount) && 
          p?.status === 'pending'
        )
        
        if (pendingRecord) {
          await (dataService.entities as any).user_points.update(pendingRecord._id, {
            status: 'cancelled',
            updated_at: new Date().toISOString()
          })
        }

        toast.success('출금이 거절되었습니다')
      }

      console.log('✅ 출금 처리 완료')
      return true
    } catch (error) {
      console.error('❌ 출금 처리 실패:', error)
      toast.error('출금 처리에 실패했습니다')
      return false
    } finally {
      setLoading(false)
    }
  }

  // 포인트 내역 조회
  const getPointHistory = async (userId: string) => {
    try {
      const result = await (dataService.entities as any).user_points.list()
      const points = result?.list || []
      const safePoints = Array.isArray(points) ? points : []
      
      return safePoints
        .filter(p => p?.user_id === userId)
        .sort((a, b) => 
          new Date(b?.created_at || 0).getTime() - new Date(a?.created_at || 0).getTime()
        )
    } catch (error) {
      console.error('포인트 내역 조회 실패:', error)
      return []
    }
  }

  // 출금 요청 목록 조회 (상태별)
  const getWithdrawalRequests = async (status?: string) => {
    try {
      const result = await (dataService.entities as any).withdrawal_requests.list()
      const withdrawals = result?.list || []
      const safeWithdrawals = Array.isArray(withdrawals) ? withdrawals : []
      
      return status 
        ? safeWithdrawals.filter(w => w?.status === status)
        : safeWithdrawals.sort((a, b) => 
            new Date(b?.requested_at || 0).getTime() - new Date(a?.requested_at || 0).getTime()
          )
    } catch (error) {
      console.error('출금 요청 조회 실패:', error)
      return []
    }
  }

  return {
    withdrawalRequests,
    loading,
    fetchWithdrawalRequests,
    givePoints,
    calculateTax,
    requestWithdrawal,
    processWithdrawal,
    getPointHistory,
    getWithdrawalRequests
  }
}
