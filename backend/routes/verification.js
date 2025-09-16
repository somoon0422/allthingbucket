const express = require('express');
const router = express.Router();
const niceVerificationService = require('../services/niceVerificationService');
const supabaseService = require('../services/supabaseService');

/**
 * 나이스평가정보 본인인증 요청
 * POST /api/verification/request
 */
router.post('/request', async (req, res) => {
  try {
    const { userId, userName, userPhone, userBirth } = req.body;

    // 필수 필드 검증
    if (!userId || !userName || !userPhone || !userBirth) {
      return res.status(400).json({
        success: false,
        error: '필수 정보가 누락되었습니다 (userId, userName, userPhone, userBirth)'
      });
    }

    // 전화번호 형식 검증
    const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/;
    if (!phoneRegex.test(userPhone.replace(/[^0-9]/g, ''))) {
      return res.status(400).json({
        success: false,
        error: '올바른 전화번호 형식을 입력해주세요'
      });
    }

    // 생년월일 형식 검증 (YYYYMMDD)
    const birthRegex = /^\d{8}$/;
    if (!birthRegex.test(userBirth)) {
      return res.status(400).json({
        success: false,
        error: '생년월일은 YYYYMMDD 형식으로 입력해주세요'
      });
    }

    // 나이스평가정보 인증 요청
    const result = await niceVerificationService.requestVerification(
      userId, userName, userPhone, userBirth
    );

    if (result.success) {
      // 인증 요청 정보를 임시 저장 (Supabase 직접 호출)
      const { error: insertError } = await supabaseService.supabase
        .from('verification_requests')
        .insert({
          user_id: userId,
          verification_id: result.verificationId,
          user_name: userName,
          user_phone: userPhone,
          user_birth: userBirth,
          status: 'pending',
          expires_at: result.expiresAt,
          created_at: new Date().toISOString()
        });

      if (insertError) {
        console.error('인증 요청 저장 실패:', insertError);
        throw new Error('인증 요청 저장에 실패했습니다');
      }

      res.json({
        success: true,
        verificationId: result.verificationId,
        verificationUrl: result.verificationUrl,
        expiresAt: result.expiresAt
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('인증 요청 실패:', error);
    res.status(500).json({
      success: false,
      error: '인증 요청 중 오류가 발생했습니다'
    });
  }
});

/**
 * 나이스평가정보 인증 결과 확인
 * POST /api/verification/result
 */
router.post('/result', async (req, res) => {
  try {
    const { verificationId, authCode } = req.body;

    if (!verificationId || !authCode) {
      return res.status(400).json({
        success: false,
        error: '인증 ID와 인증 코드가 필요합니다'
      });
    }

    // 인증 결과 확인
    const result = await niceVerificationService.verifyResult(verificationId, authCode);

    if (result.success && result.verified) {
      // 사용자 프로필에 인증 정보 저장 (Supabase 직접 호출)
      const { data: userProfiles, error: profileError } = await supabaseService.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', result.userInfo.userId);

      if (profileError) {
        console.error('사용자 프로필 조회 실패:', profileError);
        throw new Error('사용자 프로필 조회에 실패했습니다');
      }

      if (userProfiles && userProfiles.length > 0) {
        const userProfile = userProfiles[0];
        
        // 주민등록번호 암호화
        const encryptedResidentNumber = niceVerificationService.encryptResidentNumber(
          result.userInfo.residentNumber
        );

        // 사용자 프로필 업데이트
        const { error: updateError } = await supabaseService.supabase
          .from('user_profiles')
          .update({
            tax_info: {
              resident_number_encrypted: encryptedResidentNumber,
              tax_type: 'individual',
              verified_at: new Date().toISOString(),
              verification_method: 'nice'
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', userProfile.id);

        if (updateError) {
          console.error('사용자 프로필 업데이트 실패:', updateError);
          throw new Error('사용자 프로필 업데이트에 실패했습니다');
        }

        // 인증 요청 상태 업데이트
        const { error: requestUpdateError } = await supabaseService.supabase
          .from('verification_requests')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            user_info: result.userInfo
          })
          .eq('verification_id', verificationId);

        if (requestUpdateError) {
          console.error('인증 요청 업데이트 실패:', requestUpdateError);
        }
      }

      res.json({
        success: true,
        verified: true,
        message: '본인인증이 완료되었습니다'
      });
    } else {
      res.status(400).json({
        success: false,
        verified: false,
        error: result.error || '인증에 실패했습니다'
      });
    }
  } catch (error) {
    console.error('인증 결과 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '인증 결과 확인 중 오류가 발생했습니다'
    });
  }
});

/**
 * 사용자 인증 상태 확인
 * GET /api/verification/status/:userId
 */
router.get('/status/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const status = await niceVerificationService.checkVerificationStatus(userId);

    res.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('인증 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: '인증 상태 확인 중 오류가 발생했습니다'
    });
  }
});

/**
 * 출금 신청 전 실명인증 검증
 * POST /api/verification/check-withdrawal
 */
router.post('/check-withdrawal', async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: '사용자 ID가 필요합니다'
      });
    }

    // 인증 상태 확인
    const status = await niceVerificationService.checkVerificationStatus(userId);

    if (!status.verified || !status.hasResidentNumber) {
      return res.json({
        success: true,
        canWithdraw: false,
        reason: '실명인증이 필요합니다',
        requiresVerification: true
      });
    }

    res.json({
      success: true,
      canWithdraw: true,
      verified: true
    });
  } catch (error) {
    console.error('출금 인증 검증 실패:', error);
    res.status(500).json({
      success: false,
      error: '출금 인증 검증 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
