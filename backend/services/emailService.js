const nodemailer = require('nodemailer');
require('dotenv').config();

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  // 이메일 전송기 초기화
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: process.env.GMAIL_USER,
          pass: process.env.GMAIL_APP_PASSWORD // Gmail 앱 비밀번호
        }
      });

      // 연결 테스트
      this.transporter.verify((error, success) => {
        if (error) {
          console.error('이메일 서비스 초기화 실패:', error);
        } else {
          console.log('✅ 이메일 서비스 초기화 완료');
        }
      });
    } catch (error) {
      console.error('이메일 전송기 생성 실패:', error);
    }
  }

  // 이메일 발송
  async sendEmail(to, subject, html, text = '') {
    try {
      if (!this.transporter) {
        throw new Error('이메일 전송기가 초기화되지 않았습니다');
      }

      const mailOptions = {
        from: {
          name: '올띵버킷',
          address: process.env.GMAIL_USER
        },
        to: to,
        subject: subject,
        html: html,
        text: text || this.stripHtml(html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };

    } catch (error) {
      console.error('이메일 발송 실패:', error);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  // HTML 태그 제거
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }

  // 인증번호 이메일 발송
  async sendVerificationCodeEmail(email, code) {
    const subject = '[올띵버킷] 이메일 인증번호';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
          <h1 style="color: #333; margin: 0;">올띵버킷</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">이메일 인증번호</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            안녕하세요! 올띵버킷 이메일 인증을 위한 인증번호입니다.
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
            <h3 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${code}</h3>
          </div>
          <p style="color: #666; font-size: 14px;">
            • 인증번호는 5분간 유효합니다.<br>
            • 인증번호를 타인에게 알려주지 마세요.<br>
            • 본인이 요청하지 않은 경우 이 이메일을 무시하세요.
          </p>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 올띵버킷. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // 승인 알림 이메일 발송
  async sendApprovalEmail(email, campaignName, userName) {
    const subject = `[올띵버킷] ${campaignName} 캠페인 선정 안내`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #28a745; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">🎉 축하합니다!</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">${userName}님, 캠페인에 선정되었습니다!</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            <strong>${campaignName}</strong> 캠페인에 선정되었습니다!<br>
            자세한 내용은 앱에서 확인해주세요.
          </p>
          <div style="background-color: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #28a745; margin: 0 0 10px 0;">다음 단계</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>앱에서 캠페인 상세 내용 확인</li>
              <li>체험단 가이드라인 숙지</li>
              <li>제품 수령 후 리뷰 작성</li>
            </ul>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 올띵버킷. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // 거절 알림 이메일 발송
  async sendRejectionEmail(email, campaignName, userName) {
    const subject = `[올띵버킷] ${campaignName} 캠페인 결과 안내`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #6c757d; padding: 20px; text-align: center;">
          <h1 style="color: white; margin: 0;">올띵버킷</h1>
        </div>
        <div style="padding: 30px;">
          <h2 style="color: #333; margin-bottom: 20px;">${userName}님, 안녕하세요</h2>
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            <strong>${campaignName}</strong> 캠페인에 선정되지 않았습니다.<br>
            아쉽지만 다음 기회에 도전해주세요!
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #333; margin: 0 0 10px 0;">다른 캠페인에 도전해보세요</h3>
            <ul style="color: #666; margin: 0; padding-left: 20px;">
              <li>다양한 브랜드의 새로운 캠페인 확인</li>
              <li>프로필 정보를 더욱 완성도 있게 작성</li>
              <li>활발한 활동으로 인지도 높이기</li>
            </ul>
          </div>
        </div>
        <div style="background-color: #f8f9fa; padding: 20px; text-align: center; color: #666; font-size: 12px;">
          <p>© 2024 올띵버킷. All rights reserved.</p>
        </div>
      </div>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();
