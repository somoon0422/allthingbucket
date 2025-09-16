const crypto = require('crypto');
const https = require('https');
require('dotenv').config();

class NaverSmsService {
  constructor() {
    this.NAVER_ACCESS_KEY = process.env.NAVER_ACCESS_KEY;
    this.NAVER_SECRET_KEY = process.env.NAVER_SECRET_KEY;
    this.NAVER_SERVICE_ID = process.env.NAVER_SERVICE_ID;
    this.NAVER_SMS_URL = `https://sens.apigw.ntruss.com/sms/v2/services/${this.NAVER_SERVICE_ID}/messages`;
  }

  // HMAC-SHA256 서명 생성
  generateSignature(timestamp, method, uri) {
    const message = `${method} ${uri}\n${timestamp}\n${this.NAVER_ACCESS_KEY}`;
    return crypto.createHmac('sha256', this.NAVER_SECRET_KEY).update(message).digest('base64');
  }

  // SMS 발송
  async sendSms(to, content) {
    try {
      const timestamp = Date.now().toString();
      const method = 'POST';
      const uri = `/sms/v2/services/${this.NAVER_SERVICE_ID}/messages`;
      
      const signature = this.generateSignature(timestamp, method, uri);
      
      const data = JSON.stringify({
        type: 'SMS',
        contentType: 'COMM',
        countryCode: '82',
        from: process.env.NAVER_SMS_FROM_NUMBER, // 발신번호
        content: content,
        messages: [
          {
            to: to.replace(/-/g, ''), // 하이픈 제거
            content: content
          }
        ]
      });

      const options = {
        hostname: 'sens.apigw.ntruss.com',
        port: 443,
        path: uri,
        method: method,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': this.NAVER_ACCESS_KEY,
          'x-ncp-apigw-signature-v2': signature,
          'Content-Length': Buffer.byteLength(data)
        }
      };

      return new Promise((resolve, reject) => {
        const req = https.request(options, (res) => {
          let responseData = '';
          
          res.on('data', (chunk) => {
            responseData += chunk;
          });
          
          res.on('end', () => {
            try {
              const result = JSON.parse(responseData);
              if (res.statusCode === 202) {
                resolve({
                  success: true,
                  requestId: result.requestId,
                  statusCode: result.statusCode,
                  statusName: result.statusName
                });
              } else {
                reject({
                  success: false,
                  error: result.errorMessage || 'SMS 발송 실패',
                  statusCode: res.statusCode
                });
              }
            } catch (error) {
              reject({
                success: false,
                error: '응답 파싱 실패',
                rawResponse: responseData
              });
            }
          });
        });

        req.on('error', (error) => {
          reject({
            success: false,
            error: error.message
          });
        });

        req.write(data);
        req.end();
      });

    } catch (error) {
      console.error('SMS 발송 실패:', error);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  // 인증번호 SMS 발송
  async sendVerificationCode(phone, code) {
    const content = `[올띵버킷] 인증번호는 ${code}입니다. 5분간 유효합니다.`;
    return await this.sendSms(phone, content);
  }

  // 승인 알림 SMS 발송
  async sendApprovalNotification(phone, campaignName) {
    const content = `[올띵버킷] ${campaignName} 캠페인에 선정되었습니다! 자세한 내용은 앱에서 확인해주세요.`;
    return await this.sendSms(phone, content);
  }

  // 거절 알림 SMS 발송
  async sendRejectionNotification(phone, campaignName) {
    const content = `[올띵버킷] ${campaignName} 캠페인에 선정되지 않았습니다. 다음 기회에 도전해주세요!`;
    return await this.sendSms(phone, content);
  }
}

module.exports = new NaverSmsService();
