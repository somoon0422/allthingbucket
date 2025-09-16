const axios = require('axios')

class TossPaymentsMCPService {
  constructor() {
    this.baseURL = process.env.TOSS_PAYMENTS_BASE_URL || 'https://api.tosspayments.com'
    this.secretKey = process.env.TOSS_PAYMENTS_SECRET_KEY
    this.clientKey = process.env.TOSS_PAYMENTS_CLIENT_KEY
    this.mcpServerUrl = process.env.TOSS_PAYMENTS_MCP_SERVER_URL || 'http://localhost:3002'
  }

  /**
   * MCP 서버를 통한 계좌 출금 처리
   * @param {Object} withdrawalData - 출금 정보
   * @param {string} withdrawalData.bankCode - 은행 코드
   * @param {string} withdrawalData.accountNumber - 계좌번호
   * @param {string} withdrawalData.accountHolder - 예금주명
   * @param {number} withdrawalData.amount - 출금 금액 (원)
   * @param {string} withdrawalData.description - 출금 설명
   * @returns {Promise<Object>} 출금 결과
   */
  async processWithdrawal(withdrawalData) {
    try {
      console.log('💰 토스페이먼츠 MCP 서버 출금 요청:', withdrawalData)

      // MCP 서버를 통한 출금 요청
      const response = await axios.post(
        `${this.mcpServerUrl}/api/withdrawal/process`,
        {
          bankCode: withdrawalData.bankCode,
          accountNumber: withdrawalData.accountNumber.replace(/-/g, ''),
          accountHolder: withdrawalData.accountHolder,
          amount: withdrawalData.amount,
          description: withdrawalData.description,
          transferType: 'TRANSFER'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'X-MCP-Service': 'toss-payments'
          }
        }
      )

      console.log('✅ 토스페이먼츠 MCP 출금 성공:', response.data)
      return {
        success: true,
        transferId: response.data.transferId,
        status: response.data.status,
        amount: response.data.amount,
        fee: response.data.fee || 0,
        netAmount: response.data.netAmount || withdrawalData.amount,
        mcpTransactionId: response.data.mcpTransactionId
      }

    } catch (error) {
      console.error('❌ 토스페이먼츠 MCP 출금 실패:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message,
        code: error.response?.data?.code
      }
    }
  }

  /**
   * MCP 서버를 통한 출금 상태 확인
   * @param {string} transferId - 출금 ID
   * @returns {Promise<Object>} 출금 상태
   */
  async getWithdrawalStatus(transferId) {
    try {
      console.log('🔍 MCP 서버 출금 상태 확인:', transferId)

      const response = await axios.get(
        `${this.mcpServerUrl}/api/withdrawal/status/${transferId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'X-MCP-Service': 'toss-payments'
          }
        }
      )

      console.log('✅ MCP 출금 상태 확인 성공:', response.data)
      return {
        success: true,
        status: response.data.status,
        transferId: response.data.transferId,
        amount: response.data.amount,
        fee: response.data.fee,
        netAmount: response.data.netAmount,
        completedAt: response.data.completedAt,
        mcpTransactionId: response.data.mcpTransactionId
      }

    } catch (error) {
      console.error('❌ MCP 출금 상태 확인 실패:', error.response?.data || error.message)
      return {
        success: false,
        error: error.response?.data?.message || error.message
      }
    }
  }

  /**
   * 출금 수수료 계산
   * @param {number} amount - 출금 금액
   * @returns {Object} 수수료 정보
   */
  calculateFees(amount) {
    // 토스페이먼츠 출금 수수료 (예시)
    const transferFee = Math.min(1000, Math.max(500, Math.floor(amount * 0.001))) // 0.1% (최소 500원, 최대 1000원)
    
    return {
      transferFee,
      totalFee: transferFee
    }
  }

  /**
   * MCP 서버를 통한 세금 계산 (3.3% 소득세)
   * @param {number} amount - 출금 금액
   * @returns {Promise<Object>} 세금 정보
   */
  async calculateTax(amount) {
    try {
      console.log('🧮 MCP 서버 세금 계산 요청:', amount)

      const response = await axios.post(
        `${this.mcpServerUrl}/api/tax/calculate`,
        {
          amount: amount,
          taxType: 'INCOME_TAX',
          taxRate: 0.033 // 3.3%
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'X-MCP-Service': 'toss-payments'
          }
        }
      )

      console.log('✅ MCP 세금 계산 성공:', response.data)
      return {
        success: true,
        originalAmount: amount,
        taxRate: response.data.taxRate,
        taxAmount: response.data.taxAmount,
        finalAmount: response.data.finalAmount,
        taxBreakdown: response.data.taxBreakdown
      }

    } catch (error) {
      console.error('❌ MCP 세금 계산 실패, 로컬 계산으로 대체:', error.message)
      
      // MCP 서버 실패 시 로컬 계산으로 대체
      const taxRate = 0.033 // 3.3%
      const taxAmount = Math.floor(amount * taxRate)
      const finalAmount = amount - taxAmount

      return {
        success: true,
        originalAmount: amount,
        taxRate: taxRate,
        taxAmount: taxAmount,
        finalAmount: finalAmount,
        taxBreakdown: {
          incomeTax: taxAmount,
          localTax: 0 // 지방소득세는 별도 계산
        },
        fallback: true // 로컬 계산 사용됨을 표시
      }
    }
  }

  /**
   * 은행 코드 가져오기
   * @param {string} bankName - 은행명
   * @returns {string} 은행 코드
   */
  getBankCode(bankName) {
    const bankCodeMap = {
      '국민은행': '004',
      '신한은행': '088',
      '우리은행': '020',
      '하나은행': '081',
      '기업은행': '003',
      '농협은행': '011',
      '카카오뱅크': '090',
      '토스뱅크': '092'
    }
    return bankCodeMap[bankName]
  }

  /**
   * MCP 서버를 통한 출금 가능 여부 확인
   * @param {number} amount - 출금 금액
   * @param {number} availableBalance - 사용 가능 잔액
   * @returns {Promise<Object>} 출금 가능 여부
   */
  async canWithdraw(amount, availableBalance) {
    try {
      console.log('🔍 MCP 서버 출금 가능 여부 확인:', { amount, availableBalance })

      const response = await axios.post(
        `${this.mcpServerUrl}/api/withdrawal/check`,
        {
          amount: amount,
          availableBalance: availableBalance,
          includeTax: true,
          includeFees: true
        },
        {
          headers: {
            'Authorization': `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
            'X-MCP-Service': 'toss-payments'
          }
        }
      )

      console.log('✅ MCP 출금 가능 여부 확인 성공:', response.data)
      return {
        success: true,
        canWithdraw: response.data.canWithdraw,
        requiredAmount: response.data.requiredAmount,
        availableBalance: availableBalance,
        shortfall: response.data.shortfall,
        breakdown: response.data.breakdown
      }

    } catch (error) {
      console.error('❌ MCP 출금 가능 여부 확인 실패, 로컬 계산으로 대체:', error.message)
      
      // MCP 서버 실패 시 로컬 계산으로 대체
      const { transferFee } = this.calculateFees(amount)
      const taxInfo = await this.calculateTax(amount)
      const totalRequired = amount + transferFee + taxInfo.taxAmount

      return {
        success: true,
        canWithdraw: availableBalance >= totalRequired,
        requiredAmount: totalRequired,
        availableBalance: availableBalance,
        shortfall: Math.max(0, totalRequired - availableBalance),
        breakdown: {
          withdrawalAmount: amount,
          transferFee: transferFee,
          taxAmount: taxInfo.taxAmount,
          totalRequired: totalRequired
        },
        fallback: true // 로컬 계산 사용됨을 표시
      }
    }
  }
}

module.exports = TossPaymentsMCPService
