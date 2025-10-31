const crypto = require('crypto');
require('dotenv').config();

class NaverEmailService {
  constructor() {
    this.accessKey = process.env.NAVER_CLOUD_ACCESS_KEY;
    this.secretKey = process.env.NAVER_CLOUD_SECRET_KEY;
    this.serviceId = process.env.NAVER_CLOUD_SENS_SERVICE_ID;
    this.baseUrl = 'https://sens.apigw.ntruss.com';
    
    console.log('📧 네이버 SENS 이메일 서비스 초기화:', {
      hasAccessKey: !!this.accessKey,
      hasSecretKey: !!this.secretKey,
      hasServiceId: !!this.serviceId
    });
  }

  // HMAC-SHA256 서명 생성
  generateSignature(method, url, timestamp) {
    const message = `${method} ${url}\n${timestamp}\n${this.accessKey}`;
    const signature = crypto
      .createHmac('sha256', this.secretKey)
      .update(message)
      .digest('base64');
    return signature;
  }

  // 이메일 발송
  async sendEmail(options) {
    try {
      if (!this.accessKey || !this.secretKey || !this.serviceId) {
        throw new Error('네이버 클라우드 플랫폼 SENS API 설정이 완료되지 않았습니다');
      }

      const { to, subject, content, fromEmail = 'support@allthingbucket.com' } = options;

      if (!to || !subject || !content) {
        throw new Error('필수 필드가 누락되었습니다: to, subject, content');
      }

      console.log('📧 네이버 SENS 이메일 발송 시작:', { to, subject, fromEmail });

      const timestamp = Date.now().toString();
      const url = `/sms/v2/services/${this.serviceId}/emails`;
      const fullUrl = `${this.baseUrl}${url}`;

      const signature = this.generateSignature('POST', url, timestamp);

      const emailData = {
        type: 'EMAIL',
        contentType: 'HTML',
        countryCode: '82',
        from: fromEmail,
        subject: subject,
        content: content,
        messages: [
          {
            to: to,
            subject: subject
          }
        ]
      };

      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': this.accessKey,
          'x-ncp-apigw-signature-v2': signature
        },
        body: JSON.stringify(emailData)
      });

      const responseData = await response.json();

      if (!response.ok) {
        console.error('❌ 네이버 SENS API 오류:', responseData);
        throw new Error(`네이버 SENS API 오류: ${responseData.errorMessage || response.statusText}`);
      }

      console.log('✅ 네이버 SENS 이메일 발송 성공:', responseData);
      return {
        success: true,
        messageId: responseData.requestId || `sens_${Date.now()}`,
        message: '네이버 SENS를 통해 이메일이 성공적으로 발송되었습니다'
      };

    } catch (error) {
      console.error('❌ 네이버 SENS 이메일 발송 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // HTML 이메일 발송 (템플릿 사용)
  async sendHtmlEmail(options) {
    try {
      const { to, subject, htmlContent, fromEmail = 'support@allthingbucket.com' } = options;

      // HTML 템플릿 생성
      const emailTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
            .content { background-color: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .footer { margin-top: 20px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px; }
            .logo { font-size: 24px; font-weight: bold; color: #007bff; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">올띵버킷</div>
            </div>
            <div class="content">
              ${htmlContent}
            </div>
            <div class="footer">
              <p>올띵버킷 체험단에서 발송된 메시지입니다.</p>
              <p>문의사항이 있으시면 support@allthingbucket.com으로 연락해주세요.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      return await this.sendEmail({
        to,
        subject,
        content: emailTemplate,
        fromEmail
      });

    } catch (error) {
      console.error('❌ HTML 이메일 발송 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // 서비스 상태 확인
  async checkServiceStatus() {
    try {
      if (!this.accessKey || !this.secretKey || !this.serviceId) {
        return {
          configured: false,
          message: '네이버 클라우드 플랫폼 SENS API 설정이 완료되지 않았습니다'
        };
      }

      return {
        configured: true,
        message: '네이버 클라우드 플랫폼 SENS API가 정상적으로 설정되었습니다'
      };

    } catch (error) {
      return {
        configured: false,
        message: `서비스 상태 확인 실패: ${error.message}`
      };
    }
  }
}

module.exports = new NaverEmailService();
