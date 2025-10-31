const express = require('express');
const router = express.Router();
const TossPaymentsMCPService = require('../services/tossPaymentsService');
const supabaseService = require('../services/supabaseService');

const tossPaymentsService = new TossPaymentsMCPService();

// 포인트 출금 요청
router.post('/request', async (req, res) => {
  try {
    console.log('💰 포인트 출금 요청:', req.body);
    
    const { user_id, amount, bank_name, account_number, account_holder, description } = req.body;
    
    if (!user_id || !amount || !bank_name || !account_number || !account_holder) {
      return res.status(400).json({
        success: false,
        error: '모든 필드를 입력해주세요'
      });
    }

    // 사용자 포인트 확인
    const userProfiles = await supabaseService.dataService.entities.user_profiles.list();
    const userProfile = userProfiles.find(profile => profile.user_id === user_id);
    
    if (!userProfile || !userProfile.account_verified) {
      return res.status(400).json({
        success: false,
        error: '계좌인증이 필요합니다'
      });
    }

    // 사용자 포인트 조회
    const userPoints = await supabaseService.dataService.entities.user_points.list();
    const userPointData = userPoints.find(point => point.user_id === user_id);
    
    if (!userPointData) {
      return res.status(400).json({
        success: false,
        error: '포인트 정보를 찾을 수 없습니다'
      });
    }

    const availablePoints = userPointData.points || 0;
    const requestedAmount = parseInt(amount);

    // 출금 가능 여부 확인
    const withdrawalCheck = await tossPaymentsService.canWithdraw(requestedAmount, availablePoints);
    
    if (!withdrawalCheck.canWithdraw) {
      return res.status(400).json({
        success: false,
        error: `출금 가능한 포인트가 부족합니다. 필요: ${withdrawalCheck.requiredAmount.toLocaleString()}P, 보유: ${availablePoints.toLocaleString()}P`,
        details: withdrawalCheck.breakdown
      });
    }

    // 출금 요청 생성
    const withdrawalRequest = {
      user_id,
      points_amount: requestedAmount,
      withdrawal_amount: requestedAmount,
      bank_name,
      account_number,
      account_holder,
      description: description || '포인트 출금',
      status: 'pending',
      created_at: new Date().toISOString()
    };

    // 출금 요청 저장
    const withdrawalResult = await supabaseService.dataService.entities.withdrawal_requests.create(withdrawalRequest);
    
    if (!withdrawalResult.success) {
      return res.status(500).json({
        success: false,
        error: '출금 요청 저장에 실패했습니다'
      });
    }

    console.log('✅ 출금 요청 저장 완료:', withdrawalResult.data);
    
    res.json({
      success: true,
      message: '출금 요청이 접수되었습니다. 관리자 승인 후 처리됩니다.',
      withdrawalId: withdrawalResult.data._id,
      breakdown: withdrawalCheck.breakdown
    });

  } catch (error) {
    console.error('❌ 포인트 출금 요청 API 오류:', error);
    res.status(500).json({
      success: false,
      error: '출금 요청 중 오류가 발생했습니다'
    });
  }
});

// 관리자 출금 처리
router.post('/process/:withdrawalId', async (req, res) => {
  try {
    const { withdrawalId } = req.params;
    const { admin_id } = req.body;
    
    console.log('🔧 관리자 출금 처리:', { withdrawalId, admin_id });

    // 출금 요청 조회
    const withdrawalRequests = await supabaseService.dataService.entities.withdrawal_requests.list();
    const withdrawalRequest = withdrawalRequests.find(req => req._id === withdrawalId);
    
    if (!withdrawalRequest) {
      return res.status(404).json({
        success: false,
        error: '출금 요청을 찾을 수 없습니다'
      });
    }

    if (withdrawalRequest.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: '이미 처리된 출금 요청입니다'
      });
    }

    // 사용자 포인트 재확인
    const userPoints = await supabaseService.dataService.entities.user_points.list();
    const userPointData = userPoints.find(point => point.user_id === withdrawalRequest.user_id);
    
    if (!userPointData) {
      return res.status(400).json({
        success: false,
        error: '사용자 포인트 정보를 찾을 수 없습니다'
      });
    }

    const availablePoints = userPointData.points || 0;
    const requestedAmount = withdrawalRequest.points_amount || withdrawalRequest.withdrawal_amount;

    // 출금 가능 여부 재확인
    const withdrawalCheck = await tossPaymentsService.canWithdraw(requestedAmount, availablePoints);
    
    if (!withdrawalCheck.canWithdraw) {
      // 출금 요청 상태를 실패로 변경
      await supabaseService.dataService.entities.withdrawal_requests.update(withdrawalId, {
        status: 'failed',
        admin_note: '포인트 부족으로 출금 실패',
        processed_at: new Date().toISOString(),
        processed_by: admin_id
      });

      return res.status(400).json({
        success: false,
        error: '출금 가능한 포인트가 부족합니다'
      });
    }

    // 토스페이먼츠 출금 처리
    const bankCode = tossPaymentsService.getBankCode(withdrawalRequest.bank_name);
    const withdrawalResult = await tossPaymentsService.processWithdrawal({
      bankCode,
      accountNumber: withdrawalRequest.account_number,
      accountHolder: withdrawalRequest.account_holder,
      amount: withdrawalCheck.breakdown.finalAmount, // 세금 차감 후 금액
      description: `올띵버킷 포인트 출금 - ${withdrawalRequest.description}`
    });

    if (!withdrawalResult.success) {
      // 출금 요청 상태를 실패로 변경
      await supabaseService.dataService.entities.withdrawal_requests.update(withdrawalId, {
        status: 'failed',
        admin_note: `출금 실패: ${withdrawalResult.error}`,
        processed_at: new Date().toISOString(),
        processed_by: admin_id
      });

      return res.status(400).json({
        success: false,
        error: `출금 처리 실패: ${withdrawalResult.error}`
      });
    }

    // 출금 성공 시 포인트 차감
    const newPoints = availablePoints - withdrawalCheck.breakdown.totalRequired;
    await supabaseService.dataService.entities.user_points.update(userPointData._id, {
      points: newPoints,
      used_points: (userPointData.used_points || 0) + withdrawalCheck.breakdown.totalRequired,
      updated_at: new Date().toISOString()
    });

    // 출금 요청 상태 업데이트
    await supabaseService.dataService.entities.withdrawal_requests.update(withdrawalId, {
      status: 'completed',
      transfer_id: withdrawalResult.transferId,
      final_amount: withdrawalCheck.breakdown.finalAmount,
      tax_amount: withdrawalCheck.breakdown.taxAmount,
      transfer_fee: withdrawalCheck.breakdown.transferFee,
      processed_at: new Date().toISOString(),
      processed_by: admin_id
    });

    // 포인트 히스토리 추가
    await supabaseService.dataService.entities.points_history.create({
      user_id: withdrawalRequest.user_id,
      points_amount: -withdrawalCheck.breakdown.totalRequired,
      points_type: 'withdrawn',
      status: 'success',
      payment_status: '출금완료',
      description: `포인트 출금 - ${withdrawalRequest.bank_name} ${withdrawalRequest.account_number}`,
      transaction_date: new Date().toISOString(),
      created_at: new Date().toISOString()
    });

    console.log('✅ 출금 처리 완료:', withdrawalResult);
    
    res.json({
      success: true,
      message: '출금이 성공적으로 처리되었습니다',
      transferId: withdrawalResult.transferId,
      finalAmount: withdrawalCheck.breakdown.finalAmount,
      breakdown: withdrawalCheck.breakdown
    });

  } catch (error) {
    console.error('❌ 출금 처리 API 오류:', error);
    res.status(500).json({
      success: false,
      error: '출금 처리 중 오류가 발생했습니다'
    });
  }
});

// 출금 요청 목록 조회 (관리자용)
router.get('/requests', async (req, res) => {
  try {
    const { status = 'all', page = 1, limit = 20 } = req.query;
    
    const withdrawalRequests = await supabaseService.dataService.entities.withdrawal_requests.list();
    
    let filteredRequests = withdrawalRequests;
    if (status !== 'all') {
      filteredRequests = withdrawalRequests.filter(req => req.status === status);
    }

    // 페이지네이션
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

    res.json({
      success: true,
      data: paginatedRequests,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: filteredRequests.length,
        totalPages: Math.ceil(filteredRequests.length / limit)
      }
    });

  } catch (error) {
    console.error('❌ 출금 요청 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '출금 요청 목록 조회 중 오류가 발생했습니다'
    });
  }
});

// 사용자 출금 내역 조회
router.get('/history/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;
    
    const withdrawalRequests = await supabaseService.dataService.entities.withdrawal_requests.list();
    const userWithdrawals = withdrawalRequests.filter(req => req.user_id === user_id);
    
    res.json({
      success: true,
      data: userWithdrawals
    });

  } catch (error) {
    console.error('❌ 사용자 출금 내역 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '출금 내역 조회 중 오류가 발생했습니다'
    });
  }
});

// 출금 수수료 및 세금 계산
router.post('/calculate', async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: '유효한 금액을 입력해주세요'
      });
    }

    const transferFees = tossPaymentsService.calculateFees(amount);
    const taxInfo = await tossPaymentsService.calculateTax(amount);
    
    res.json({
      success: true,
      breakdown: {
        originalAmount: amount,
        transferFee: transferFees.transferFee,
        taxAmount: taxInfo.taxAmount,
        finalAmount: taxInfo.finalAmount,
        totalRequired: amount + transferFees.transferFee + taxInfo.taxAmount
      }
    });

  } catch (error) {
    console.error('❌ 수수료 계산 오류:', error);
    res.status(500).json({
      success: false,
      error: '수수료 계산 중 오류가 발생했습니다'
    });
  }
});

module.exports = router;
