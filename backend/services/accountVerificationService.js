const { createClient } = require('@supabase/supabase-js')

class AccountVerificationService {
  constructor() {
    try {
      this.supabase = createClient(
        process.env.SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co',
        process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8'
      )
    } catch (error) {
      console.log('⚠️ AccountVerificationService: Supabase 연결 실패, 임시로 비활성화:', error.message);
      this.supabase = null;
    }
  }

  /**
   * 1원 인증을 위한 계좌 정보 검증
   * @param {string} userId - 사용자 ID
   * @param {string} bankAccountId - 계좌 ID
   * @param {string} depositName - 입금자명
   * @returns {Promise<Object>} 검증 결과
   */
  async verifyAccountByDeposit(userId, bankAccountId, depositName) {
    try {
      console.log('🔍 계좌 인증 시작:', { userId, bankAccountId, depositName })

      // 1. 계좌 정보 조회
      const { data: bankAccount, error: bankError } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', bankAccountId)
        .eq('user_id', userId)
        .single()

      if (bankError || !bankAccount) {
        return {
          success: false,
          message: '계좌 정보를 찾을 수 없습니다.'
        }
      }

      // 2. 입금자명 검증 (간단한 검증 로직)
      const isNameMatch = this.validateDepositName(depositName, bankAccount.account_holder)
      
      if (!isNameMatch) {
        return {
          success: false,
          message: '입금자명이 일치하지 않습니다. 다시 확인해주세요.'
        }
      }

      // 3. 계좌 인증 상태 업데이트
      const { error: updateError } = await this.supabase
        .from('bank_accounts')
        .update({
          is_verified: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', bankAccountId)

      if (updateError) {
        console.error('계좌 인증 상태 업데이트 실패:', updateError)
        return {
          success: false,
          message: '계좌 인증 상태 업데이트에 실패했습니다.'
        }
      }

      // 4. 환급 요청 상태 업데이트 (인증 완료로 변경)
      const { error: withdrawalUpdateError } = await this.supabase
        .from('withdrawal_requests')
        .update({
          status: 'account_verified',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', userId)
        .eq('bank_account_id', bankAccountId)
        .eq('status', 'pending')

      if (withdrawalUpdateError) {
        console.error('환급 요청 상태 업데이트 실패:', withdrawalUpdateError)
      }

      return {
        success: true,
        message: '계좌 인증이 완료되었습니다!',
        bankAccount: {
          id: bankAccount.id,
          bank_name: bankAccount.bank_name,
          account_number: bankAccount.account_number,
          account_holder: bankAccount.account_holder,
          is_verified: true
        }
      }

    } catch (error) {
      console.error('계좌 인증 오류:', error)
      return {
        success: false,
        message: '계좌 인증 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 입금자명 검증 (간단한 로직)
   * @param {string} depositName - 입금자명
   * @param {string} accountHolder - 계좌 예금주명
   * @returns {boolean} 검증 결과
   */
  validateDepositName(depositName, accountHolder) {
    if (!depositName || !accountHolder) return false
    
    // 공백 제거 후 비교
    const cleanDepositName = depositName.replace(/\s+/g, '').toLowerCase()
    const cleanAccountHolder = accountHolder.replace(/\s+/g, '').toLowerCase()
    
    // 완전 일치 또는 부분 일치 확인
    return cleanDepositName === cleanAccountHolder || 
           cleanDepositName.includes(cleanAccountHolder) ||
           cleanAccountHolder.includes(cleanDepositName)
  }

  /**
   * 계좌 인증 상태 조회
   * @param {string} userId - 사용자 ID
   * @param {string} bankAccountId - 계좌 ID
   * @returns {Promise<Object>} 인증 상태
   */
  async getAccountVerificationStatus(userId, bankAccountId) {
    try {
      const { data: bankAccount, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', bankAccountId)
        .eq('user_id', userId)
        .single()

      if (error || !bankAccount) {
        return {
          success: false,
          message: '계좌 정보를 찾을 수 없습니다.'
        }
      }

      return {
        success: true,
        isVerified: bankAccount.is_verified,
        verifiedAt: bankAccount.verified_at,
        bankAccount: {
          id: bankAccount.id,
          bank_name: bankAccount.bank_name,
          account_number: bankAccount.account_number,
          account_holder: bankAccount.account_holder
        }
      }

    } catch (error) {
      console.error('계좌 인증 상태 조회 오류:', error)
      return {
        success: false,
        message: '계좌 인증 상태 조회 중 오류가 발생했습니다.'
      }
    }
  }

  /**
   * 환급 요청 시 1원 입금 안내 정보 생성
   * @param {string} userId - 사용자 ID
   * @param {string} bankAccountId - 계좌 ID
   * @returns {Promise<Object>} 입금 안내 정보
   */
  async generateDepositGuide(userId, bankAccountId) {
    try {
      const { data: bankAccount, error } = await this.supabase
        .from('bank_accounts')
        .select('*')
        .eq('id', bankAccountId)
        .eq('user_id', userId)
        .single()

      if (error || !bankAccount) {
        return {
          success: false,
          message: '계좌 정보를 찾을 수 없습니다.'
        }
      }

      // 1원 입금 안내 정보
      const depositInfo = {
        amount: 1,
        accountNumber: bankAccount.account_number,
        bankName: bankAccount.bank_name,
        accountHolder: bankAccount.account_holder,
        depositName: '올띵버킷', // 실제 입금자명
        depositPurpose: '계좌인증',
        depositTime: new Date().toISOString(),
        guideMessage: `1원을 입금해주세요.\n입금자명: 올띵버킷\n입금 후 입금자명을 확인하여 계좌인증을 완료해주세요.`
      }

      return {
        success: true,
        depositInfo
      }

    } catch (error) {
      console.error('입금 안내 정보 생성 오류:', error)
      return {
        success: false,
        message: '입금 안내 정보 생성 중 오류가 발생했습니다.'
      }
    }
  }
}

module.exports = AccountVerificationService