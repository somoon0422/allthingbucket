const crypto = require('crypto');
const https = require('https');
require('dotenv').config();

class KakaoAlimtalkService {
  constructor() {
    this.KAKAO_API_URL = 'https://kapi.kakao.com';
    this.KAKAO_APP_KEY = process.env.KAKAO_APP_KEY;
    this.KAKAO_TEMPLATE_CODE = process.env.KAKAO_TEMPLATE_CODE;
    this.KAKAO_SENDER_KEY = process.env.KAKAO_SENDER_KEY;
  }

  // 카카오 알림톡 발송
  async sendAlimtalk(to, templateCode, message) {
    try {
      if (!this.KAKAO_APP_KEY || !this.KAKAO_TEMPLATE_CODE) {
        throw new Error('카카오 API 키 또는 템플릿 코드가 설정되지 않았습니다');
      }

      const data = JSON.stringify({
        receiver_uuids: [to],
        template_object: {
          object_type: 'text',
          text: message,
          link: {
            web_url: 'https://allthingbucket.com',
            mobile_web_url: 'https://allthingbucket.com'
          }
        }
      });

      const options = {
        hostname: 'kapi.kakao.com',
        port: 443,
        path: '/v2/api/talk/memo/default/send',
        method: 'POST',
        headers: {
          'Authorization': `KakaoAK ${this.KAKAO_APP_KEY}`,
          'Content-Type': 'application/x-www-form-urlencoded',
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
              if (res.statusCode === 200) {
                resolve({
                  success: true,
                  result: result
                });
              } else {
                reject({
                  success: false,
                  error: result.msg || '카카오 알림톡 발송 실패',
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
      console.error('카카오 알림톡 발송 실패:', error);
      throw {
        success: false,
        error: error.message
      };
    }
  }

  // 인증번호 알림톡 발송
  async sendVerificationAlimtalk(phone, code) {
    const message = `[올띵버킷] 인증번호는 ${code}입니다. 5분간 유효합니다.`;
    return await this.sendAlimtalk(phone, this.KAKAO_TEMPLATE_CODE, message);
  }

  // 승인 알림톡 발송
  async sendApprovalAlimtalk(phone, campaignName) {
    const message = `[올띵버킷] ${campaignName} 캠페인에 선정되었습니다! 자세한 내용은 앱에서 확인해주세요.`;
    return await this.sendAlimtalk(phone, this.KAKAO_TEMPLATE_CODE, message);
  }

  // 거절 알림톡 발송
  async sendRejectionAlimtalk(phone, campaignName) {
    const message = `[올띵버킷] ${campaignName} 캠페인에 선정되지 않았습니다. 다음 기회에 도전해주세요!`;
    return await this.sendAlimtalk(phone, this.KAKAO_TEMPLATE_CODE, message);
  }
}

module.exports = new KakaoAlimtalkService();
