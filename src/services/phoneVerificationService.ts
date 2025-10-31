/**
 * 휴대폰 SMS 인증 서비스
 */

const API_BASE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://allthingbucket.com'

// 인증번호 저장소 (메모리 - 실제로는 Redis나 DB 사용 권장)
interface VerificationCode {
  code: string
  phoneNumber: string
  expiresAt: number
  attempts: number
}

const verificationCodes = new Map<string, VerificationCode>()

/**
 * 6자리 랜덤 인증번호 생성
 */
function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

/**
 * SMS 인증번호 발송
 * @param phoneNumber 휴대폰 번호 (01012345678 형식)
 * @returns 발송 결과
 */
export async function sendVerificationCode(phoneNumber: string): Promise<{
  success: boolean
  message: string
  expiresIn?: number
}> {
  try {
    // 전화번호 형식 검증
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    if (cleanPhone.length !== 11 || !cleanPhone.startsWith('010')) {
      return {
        success: false,
        message: '올바른 휴대폰 번호를 입력해주세요 (010으로 시작하는 11자리)'
      }
    }

    // 인증번호 생성
    const code = generateVerificationCode()
    const expiresAt = Date.now() + 3 * 60 * 1000 // 3분 후 만료

    // 인증번호 저장
    verificationCodes.set(cleanPhone, {
      code,
      phoneNumber: cleanPhone,
      expiresAt,
      attempts: 0
    })

    // SMS 발송
    const response = await fetch(`${API_BASE_URL}/api/naver-cloud/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        to: cleanPhone,
        content: `[올띵버킷] 인증번호는 [${code}]입니다. 3분 이내에 입력해주세요.`
      })
    })

    const result = await response.json()

    if (response.ok && result.success) {
      return {
        success: true,
        message: '인증번호가 발송되었습니다',
        expiresIn: 180 // 3분 (초)
      }
    } else {
      return {
        success: false,
        message: result.message || 'SMS 발송에 실패했습니다'
      }
    }
  } catch (error) {
    console.error('SMS 인증번호 발송 오류:', error)
    return {
      success: false,
      message: 'SMS 발송 중 오류가 발생했습니다'
    }
  }
}

/**
 * SMS 인증번호 확인
 * @param phoneNumber 휴대폰 번호
 * @param code 입력한 인증번호
 * @returns 인증 결과
 */
export async function verifyCode(phoneNumber: string, code: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '')
    const verification = verificationCodes.get(cleanPhone)

    // 인증번호가 없는 경우
    if (!verification) {
      return {
        success: false,
        message: '인증번호를 먼저 발송해주세요'
      }
    }

    // 만료 확인
    if (Date.now() > verification.expiresAt) {
      verificationCodes.delete(cleanPhone)
      return {
        success: false,
        message: '인증번호가 만료되었습니다. 다시 발송해주세요'
      }
    }

    // 시도 횟수 확인 (최대 5회)
    if (verification.attempts >= 5) {
      verificationCodes.delete(cleanPhone)
      return {
        success: false,
        message: '인증 시도 횟수를 초과했습니다. 다시 발송해주세요'
      }
    }

    // 인증번호 확인
    if (verification.code !== code) {
      verification.attempts++
      return {
        success: false,
        message: `인증번호가 일치하지 않습니다 (${5 - verification.attempts}회 남음)`
      }
    }

    // 인증 성공 - 저장소에서 삭제
    verificationCodes.delete(cleanPhone)

    return {
      success: true,
      message: '휴대폰 인증이 완료되었습니다'
    }
  } catch (error) {
    console.error('인증번호 확인 오류:', error)
    return {
      success: false,
      message: '인증 확인 중 오류가 발생했습니다'
    }
  }
}

/**
 * 전화번호 포맷팅 (010-1234-5678)
 */
export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/[^0-9]/g, '')
  if (cleaned.length === 11) {
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 7)}-${cleaned.slice(7)}`
  }
  return phone
}
