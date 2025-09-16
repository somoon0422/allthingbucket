const naverSmsService = require('./naverSmsService');
const emailService = require('./emailService');
const kakaoAlimtalkService = require('./kakaoAlimtalkService');
const supabaseService = require('./supabaseService');

class NotificationService {
  constructor() {
    this.smsEnabled = !!(process.env.NAVER_ACCESS_KEY && process.env.NAVER_SECRET_KEY && process.env.NAVER_SERVICE_ID);
    this.emailEnabled = !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
    this.kakaoEnabled = !!(process.env.KAKAO_APP_KEY && process.env.KAKAO_TEMPLATE_CODE);
    
    console.log(`📱 SMS 서비스: ${this.smsEnabled ? '활성화' : '비활성화'}`);
    console.log(`📧 이메일 서비스: ${this.emailEnabled ? '활성화' : '비활성화'}`);
    console.log(`💬 카카오 알림톡: ${this.kakaoEnabled ? '활성화' : '비활성화'}`);
  }

  // 사용자 정보 조회
  async getUserInfo(userId) {
    try {
      const { data: userProfile, error } = await supabaseService.supabase
        .from('user_profiles')
        .select('phone, email, name')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('사용자 정보 조회 실패:', error);
        return null;
      }

      return userProfile;
    } catch (error) {
      console.error('사용자 정보 조회 중 오류:', error);
      return null;
    }
  }

  // 인증번호 발송 (SMS + 이메일 + 카카오 알림톡)
  async sendVerificationCode(userId, code, type = 'phone') {
    const results = {
      sms: { success: false, error: null },
      email: { success: false, error: null },
      kakao: { success: false, error: null }
    };

    try {
      const userInfo = await this.getUserInfo(userId);
      if (!userInfo) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }

      // SMS 발송
      if (this.smsEnabled && userInfo.phone) {
        try {
          const smsResult = await naverSmsService.sendVerificationCode(userInfo.phone, code);
          results.sms = smsResult;
          console.log('✅ SMS 인증번호 발송 성공:', userInfo.phone);
        } catch (error) {
          results.sms.error = error.message || error.error;
          console.error('❌ SMS 인증번호 발송 실패:', error);
        }
      }

      // 이메일 발송
      if (this.emailEnabled && userInfo.email) {
        try {
          const emailResult = await emailService.sendVerificationCodeEmail(userInfo.email, code);
          results.email = emailResult;
          console.log('✅ 이메일 인증번호 발송 성공:', userInfo.email);
        } catch (error) {
          results.email.error = error.message || error.error;
          console.error('❌ 이메일 인증번호 발송 실패:', error);
        }
      }

      // 카카오 알림톡 발송
      if (this.kakaoEnabled && userInfo.phone) {
        try {
          const kakaoResult = await kakaoAlimtalkService.sendVerificationAlimtalk(userInfo.phone, code);
          results.kakao = kakaoResult;
          console.log('✅ 카카오 알림톡 인증번호 발송 성공:', userInfo.phone);
        } catch (error) {
          results.kakao.error = error.message || error.error;
          console.error('❌ 카카오 알림톡 인증번호 발송 실패:', error);
        }
      }

      // 최소 하나라도 성공했으면 성공으로 처리
      const hasSuccess = results.sms.success || results.email.success || results.kakao.success;
      
      return {
        success: hasSuccess,
        results: results,
        message: hasSuccess ? '인증번호가 발송되었습니다' : '인증번호 발송에 실패했습니다'
      };

    } catch (error) {
      console.error('인증번호 발송 실패:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  // 캠페인 승인 알림 발송
  async sendApprovalNotification(userId, campaignName) {
    const results = {
      sms: { success: false, error: null },
      email: { success: false, error: null }
    };

    try {
      const userInfo = await this.getUserInfo(userId);
      if (!userInfo) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }

      // SMS 발송
      if (this.smsEnabled && userInfo.phone) {
        try {
          const smsResult = await naverSmsService.sendApprovalNotification(userInfo.phone, campaignName);
          results.sms = smsResult;
          console.log('✅ SMS 승인 알림 발송 성공:', userInfo.phone);
        } catch (error) {
          results.sms.error = error.message || error.error;
          console.error('❌ SMS 승인 알림 발송 실패:', error);
        }
      }

      // 이메일 발송
      if (this.emailEnabled && userInfo.email) {
        try {
          const emailResult = await emailService.sendApprovalEmail(userInfo.email, campaignName, userInfo.name);
          results.email = emailResult;
          console.log('✅ 이메일 승인 알림 발송 성공:', userInfo.email);
        } catch (error) {
          results.email.error = error.message || error.error;
          console.error('❌ 이메일 승인 알림 발송 실패:', error);
        }
      }

      // 최소 하나라도 성공했으면 성공으로 처리
      const hasSuccess = results.sms.success || results.email.success;
      
      return {
        success: hasSuccess,
        results: results,
        message: hasSuccess ? '승인 알림이 발송되었습니다' : '승인 알림 발송에 실패했습니다'
      };

    } catch (error) {
      console.error('승인 알림 발송 실패:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  // 캠페인 거절 알림 발송
  async sendRejectionNotification(userId, campaignName) {
    const results = {
      sms: { success: false, error: null },
      email: { success: false, error: null }
    };

    try {
      const userInfo = await this.getUserInfo(userId);
      if (!userInfo) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }

      // SMS 발송
      if (this.smsEnabled && userInfo.phone) {
        try {
          const smsResult = await naverSmsService.sendRejectionNotification(userInfo.phone, campaignName);
          results.sms = smsResult;
          console.log('✅ SMS 거절 알림 발송 성공:', userInfo.phone);
        } catch (error) {
          results.sms.error = error.message || error.error;
          console.error('❌ SMS 거절 알림 발송 실패:', error);
        }
      }

      // 이메일 발송
      if (this.emailEnabled && userInfo.email) {
        try {
          const emailResult = await emailService.sendRejectionEmail(userInfo.email, campaignName, userInfo.name);
          results.email = emailResult;
          console.log('✅ 이메일 거절 알림 발송 성공:', userInfo.email);
        } catch (error) {
          results.email.error = error.message || error.error;
          console.error('❌ 이메일 거절 알림 발송 실패:', error);
        }
      }

      // 최소 하나라도 성공했으면 성공으로 처리
      const hasSuccess = results.sms.success || results.email.success;
      
      return {
        success: hasSuccess,
        results: results,
        message: hasSuccess ? '거절 알림이 발송되었습니다' : '거절 알림 발송에 실패했습니다'
      };

    } catch (error) {
      console.error('거절 알림 발송 실패:', error);
      return {
        success: false,
        error: error.message,
        results: results
      };
    }
  }

  // 서비스 상태 확인
  getServiceStatus() {
    return {
      sms: {
        enabled: this.smsEnabled,
        required: ['NAVER_ACCESS_KEY', 'NAVER_SECRET_KEY', 'NAVER_SERVICE_ID', 'NAVER_SMS_FROM_NUMBER']
      },
      email: {
        enabled: this.emailEnabled,
        required: ['GMAIL_USER', 'GMAIL_APP_PASSWORD']
      },
      kakao: {
        enabled: this.kakaoEnabled,
        required: ['KAKAO_APP_KEY', 'KAKAO_TEMPLATE_CODE', 'KAKAO_SENDER_KEY']
      }
    };
  }
}

module.exports = new NotificationService();
