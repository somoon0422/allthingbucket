const express = require('express')
const AccountVerificationService = require('../services/accountVerificationService')
const router = express.Router()

const accountVerificationService = new AccountVerificationService()

/**
 * 1원 인증을 통한 계좌 검증
 * POST /api/account/verify-deposit
 */
router.post('/verify-deposit', async (req, res) => {
  try {
    const { userId, bankAccountId, depositName } = req.body

    if (!userId || !bankAccountId || !depositName) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    const result = await accountVerificationService.verifyAccountByDeposit(
      userId,
      bankAccountId,
      depositName
    )

    if (result.success) {
      res.json(result)
    } else {
      res.status(400).json(result)
    }

  } catch (error) {
    console.error('계좌 인증 API 오류:', error)
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    })
  }
})

/**
 * 계좌 인증 상태 조회
 * GET /api/account/verification-status/:userId/:bankAccountId
 */
router.get('/verification-status/:userId/:bankAccountId', async (req, res) => {
  try {
    const { userId, bankAccountId } = req.params

    const result = await accountVerificationService.getAccountVerificationStatus(
      userId,
      bankAccountId
    )

    res.json(result)

  } catch (error) {
    console.error('계좌 인증 상태 조회 API 오류:', error)
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    })
  }
})

/**
 * 1원 입금 안내 정보 조회
 * GET /api/account/deposit-guide/:userId/:bankAccountId
 */
router.get('/deposit-guide/:userId/:bankAccountId', async (req, res) => {
  try {
    const { userId, bankAccountId } = req.params

    const result = await accountVerificationService.generateDepositGuide(
      userId,
      bankAccountId
    )

    res.json(result)

  } catch (error) {
    console.error('입금 안내 정보 조회 API 오류:', error)
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    })
  }
})

/**
 * 계좌 인증 완료 후 환급 요청 승인 대기로 변경
 * POST /api/account/complete-verification
 */
router.post('/complete-verification', async (req, res) => {
  try {
    const { userId, bankAccountId } = req.body

    if (!userId || !bankAccountId) {
      return res.status(400).json({
        success: false,
        message: '필수 정보가 누락되었습니다.'
      })
    }

    // 환급 요청 상태를 'account_verified'에서 'pending_approval'로 변경
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_ANON_KEY
    )

    const { error } = await supabase
      .from('withdrawal_requests')
      .update({
        status: 'pending_approval',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('bank_account_id', bankAccountId)
      .eq('status', 'account_verified')

    if (error) {
      console.error('환급 요청 상태 업데이트 실패:', error)
      return res.status(500).json({
        success: false,
        message: '환급 요청 상태 업데이트에 실패했습니다.'
      })
    }

    res.json({
      success: true,
      message: '계좌 인증이 완료되었습니다. 관리자 승인을 기다려주세요.'
    })

  } catch (error) {
    console.error('계좌 인증 완료 API 오류:', error)
    res.status(500).json({
      success: false,
      message: '서버 오류가 발생했습니다.'
    })
  }
})

module.exports = router