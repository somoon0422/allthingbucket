const express = require('express');
const router = express.Router();

// 휴대폰 인증번호 발송 (시뮬레이션)
router.post('/verify-phone', async (req, res) => {
  try {
    const { user_id, phone, bank_account_id } = req.body;

    if (!user_id || !phone || !bank_account_id) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    // 휴대폰 번호 형식 검증
    const phoneRegex = /^010-\d{4}-\d{4}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({
        success: false,
        error: '올바른 휴대폰 번호 형식이 아닙니다 (010-1234-5678)'
      });
    }

    // 6자리 인증번호 생성 (시뮬레이션)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    console.log(`📱 휴대폰 인증번호 발송 시뮬레이션:`);
    console.log(`   - 사용자 ID: ${user_id}`);
    console.log(`   - 휴대폰 번호: ${phone}`);
    console.log(`   - 계좌 ID: ${bank_account_id}`);
    console.log(`   - 인증번호: ${verificationCode}`);

    // 실제 환경에서는 여기서 SMS 발송 API를 호출합니다
    // 예: coolSMS, 알리고, 카카오 알림톡 등

    res.json({
      success: true,
      verification_code: verificationCode,
      message: '인증번호가 발송되었습니다'
    });

  } catch (error) {
    console.error('휴대폰 인증 요청 실패:', error);
    res.status(500).json({
      success: false,
      error: '휴대폰 인증 요청 중 오류가 발생했습니다'
    });
  }
});

// 휴대폰 인증번호 확인 (시뮬레이션)
router.post('/verify-phone-code', async (req, res) => {
  try {
    const { user_id, bank_account_id, verification_code } = req.body;

    if (!user_id || !bank_account_id || !verification_code) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다'
      });
    }

    // 인증번호 형식 검증 (6자리 숫자)
    const codeRegex = /^\d{6}$/;
    if (!codeRegex.test(verification_code)) {
      return res.status(400).json({
        success: false,
        error: '올바른 인증번호 형식이 아닙니다 (6자리 숫자)'
      });
    }

    console.log(`📱 휴대폰 인증번호 확인 시뮬레이션:`);
    console.log(`   - 사용자 ID: ${user_id}`);
    console.log(`   - 계좌 ID: ${bank_account_id}`);
    console.log(`   - 입력된 인증번호: ${verification_code}`);

    // 시뮬레이션: 인증번호가 6자리 숫자면 성공으로 처리
    // 실제 환경에서는 발송한 인증번호와 비교해야 합니다

    res.json({
      success: true,
      message: '휴대폰 인증이 완료되었습니다'
    });

  } catch (error) {
    console.error('휴대폰 인증 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '휴대폰 인증 확인 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
