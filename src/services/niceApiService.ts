/**
 * NICE API 서비스
 * - 개인실명확인
 * - 계좌확인
 *
 * Vercel API를 통해 백엔드에서 안전하게 처리
 */

const API_BASE_URL = import.meta.env.VITE_WEBSITE_URL || 'https://allthingbucket.com'

/**
 * 개인실명확인 요청
 * @param name 이름
 * @param rrn 주민등록번호 (13자리, 하이픈 없이)
 * @returns 실명확인 결과
 */
export async function verifyRealName(name: string, rrn: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/nice-verify-realname`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name,
        rrn
      })
    })

    if (!response.ok) {
      throw new Error('실명확인 요청 실패')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('실명확인 오류:', error)
    return {
      success: false,
      message: '실명확인 중 오류가 발생했습니다',
      error
    }
  }
}

/**
 * 계좌확인 요청
 * @param bankCode 은행코드 (3자리)
 * @param accountNumber 계좌번호
 * @param name 예금주명
 * @returns 계좌확인 결과
 */
export async function verifyBankAccount(
  bankCode: string,
  accountNumber: string,
  name: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/nice-verify-account`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bankCode,
        accountNumber,
        name
      })
    })

    if (!response.ok) {
      throw new Error('계좌확인 요청 실패')
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('계좌확인 오류:', error)
    return {
      success: false,
      message: '계좌확인 중 오류가 발생했습니다',
      error
    }
  }
}

/**
 * 은행 코드 목록
 */
export const BANK_CODES = {
  '002': 'KDB산업은행',
  '003': 'IBK기업은행',
  '004': 'KB국민은행',
  '007': '수협은행',
  '011': 'NH농협은행',
  '020': '우리은행',
  '023': 'SC제일은행',
  '027': '한국씨티은행',
  '031': '대구은행',
  '032': '부산은행',
  '034': '광주은행',
  '035': '제주은행',
  '037': '전북은행',
  '039': '경남은행',
  '045': '새마을금고',
  '048': '신협',
  '050': '상호저축은행',
  '071': '우체국',
  '081': 'KEB하나은행',
  '088': '신한은행',
  '089': '케이뱅크',
  '090': '카카오뱅크',
  '092': '토스뱅크'
}

/**
 * 은행 이름으로 코드 찾기
 */
export function getBankCode(bankName: string): string | undefined {
  const entry = Object.entries(BANK_CODES).find(([_, name]) => name === bankName)
  return entry ? entry[0] : undefined
}

/**
 * 은행 코드로 이름 찾기
 */
export function getBankName(bankCode: string): string | undefined {
  return BANK_CODES[bankCode as keyof typeof BANK_CODES]
}
