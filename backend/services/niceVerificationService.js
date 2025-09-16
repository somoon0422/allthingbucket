const crypto = require('crypto');

class NiceVerificationService {
  constructor() {
    // 나이스평가정보 API 설정
    this.apiUrl = process.env.NICE_API_URL || 'https://nice.checkplus.co.kr';
    this.clientId = process.env.NICE_CLIENT_ID;
    this.clientSecret = process.env.NICE_CLIENT_SECRET;
    this.returnUrl = process.env.NICE_RETURN_URL || 'https://yourdomain.com/verification/callback';
  }

  /**
   * 나이스평가정보 본인인증 요청
   * @param {string} userId - 사용자 ID
   * @param {string} userName - 사용자 이름
   * @param {string} userPhone - 사용자 전화번호
   * @param {string} userBirth - 사용자 생년월일 (YYYYMMDD)
   * @returns {Object} 인증 요청 결과
   */
  async requestVerification(userId, userName, userPhone, userBirth) {
    try {
      // 1. 요청 데이터 준비
      const requestData = {
        clientId: this.clientId,
        clientSecret: this.clientSecret,
        returnUrl: this.returnUrl,
        userId: userId,
        userName: userName,
        userPhone: userPhone,
        userBirth: userBirth,
        timestamp: new Date().toISOString(),
        nonce: this.generateNonce()
      };

      // 2. 서명 생성
      const signature = this.generateSignature(requestData);

      // 3. API 요청
      const response = await fetch(`${this.apiUrl}/api/verification/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${signature}`
        },
        body: JSON.stringify(requestData)
      });

      const result = await response.json();

      if (result.success) {
        return {
          success: true,
          verificationId: result.verificationId,
          verificationUrl: result.verificationUrl,
          expiresAt: result.expiresAt
        };
      } else {
        throw new Error(result.error || '인증 요청 실패');
      }
    } catch (error) {
      console.error('나이스평가정보 인증 요청 실패:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * 나이스평가정보 인증 결과 확인
   * @param {string} verificationId - 인증 ID
   * @param {string} authCode - 인증 코드
   * @returns {Object} 인증 결과
   */
  async verifyResult(verificationId, authCode) {
    try {
      const response = await fetch(`${this.apiUrl}/api/verification/result`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.clientSecret}`
        },
        body: JSON.stringify({
          verificationId: verificationId,
          authCode: authCode,
          clientId: this.clientId
        })
      });

      const result = await response.json();

      if (result.success && result.verified) {
        return {
          success: true,
          verified: true,
          userInfo: {
            name: result.userName,
            phone: result.userPhone,
            birth: result.userBirth,
            residentNumber: result.residentNumber, // 암호화된 주민등록번호
            gender: result.gender
          }
        };
      } else {
        return {
          success: false,
          verified: false,
          error: result.error || '인증 실패'
        };
      }
    } catch (error) {
      console.error('나이스평가정보 인증 결과 확인 실패:', error);
      return {
        success: false,
        verified: false,
        error: error.message
      };
    }
  }

  /**
   * 주민등록번호 암호화
   * @param {string} residentNumber - 주민등록번호
   * @returns {string} 암호화된 주민등록번호
   */
  encryptResidentNumber(residentNumber) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = crypto.randomBytes(16);
    
    const cipher = crypto.createCipher(algorithm, key);
    cipher.setAAD(Buffer.from('resident-number'));
    
    let encrypted = cipher.update(residentNumber, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted: encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }

  /**
   * 주민등록번호 복호화
   * @param {Object} encryptedData - 암호화된 데이터
   * @returns {string} 복호화된 주민등록번호
   */
  decryptResidentNumber(encryptedData) {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'default-key', 'salt', 32);
    const iv = Buffer.from(encryptedData.iv, 'hex');
    const authTag = Buffer.from(encryptedData.authTag, 'hex');
    
    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAAD(Buffer.from('resident-number'));
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  /**
   * 서명 생성
   * @param {Object} data - 요청 데이터
   * @returns {string} 서명
   */
  generateSignature(data) {
    const sortedKeys = Object.keys(data).sort();
    const queryString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', this.clientSecret)
      .update(queryString)
      .digest('hex');
  }

  /**
   * 랜덤 nonce 생성
   * @returns {string} nonce
   */
  generateNonce() {
    return crypto.randomBytes(16).toString('hex');
  }

  /**
   * 실명인증 상태 확인
   * @param {string} userId - 사용자 ID
   * @returns {Object} 인증 상태
   */
  async checkVerificationStatus(userId) {
    try {
      // 데이터베이스에서 사용자 인증 상태 확인 (Supabase 직접 호출)
      const supabaseService = require('./supabaseService');
      const { data: userProfiles, error } = await supabaseService.supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId);
      
      if (error) {
        console.error('사용자 프로필 조회 실패:', error);
        return {
          verified: false,
          hasResidentNumber: false,
          error: error.message
        };
      }
      
      const userProfile = userProfiles && userProfiles.length > 0 ? userProfiles[0] : null;
      
      if (userProfile && userProfile.tax_info && userProfile.tax_info.resident_number_encrypted) {
        return {
          verified: true,
          verifiedAt: userProfile.tax_info.verified_at,
          hasResidentNumber: true
        };
      }
      
      return {
        verified: false,
        hasResidentNumber: false
      };
    } catch (error) {
      console.error('인증 상태 확인 실패:', error);
      return {
        verified: false,
        hasResidentNumber: false,
        error: error.message
      };
    }
  }
}

module.exports = new NiceVerificationService();
