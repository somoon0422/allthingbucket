/**
 * NICE API 인증 관련 공통 함수
 */

const NICE_CLIENT_ID = process.env.VITE_NICE_CLIENT_ID
const NICE_CLIENT_SECRET = process.env.VITE_NICE_CLIENT_SECRET
const NICE_API_BASE_URL = 'https://svc.niceapi.co.kr:22001'

/**
 * 현재 timestamp (초 단위)
 */
function getCurrentTimestamp(): number {
  return Math.floor(Date.now() / 1000)
}

/**
 * NICE API 액세스 토큰 발급
 * @returns access_token
 */
export async function getAccessToken(): Promise<string> {
  const authString = `${NICE_CLIENT_ID}:${NICE_CLIENT_SECRET}`
  const authHeader = `Basic ${Buffer.from(authString).toString('base64')}`

  const response = await fetch(`${NICE_API_BASE_URL}/digital/niceid/oauth/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': authHeader
    },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'default'
    })
  })

  if (!response.ok) {
    throw new Error('액세스 토큰 발급 실패')
  }

  const data = await response.json()

  // 응답 구조: dataHeader.GW_RSLT_CD 확인 후 dataBody.access_token 반환
  if (data.dataHeader?.GW_RSLT_CD !== '1200') {
    throw new Error(`토큰 발급 오류: ${data.dataHeader?.GW_RSLT_MSG || 'Unknown error'}`)
  }

  return data.dataBody.access_token
}

/**
 * API 요청용 Authorization 헤더 생성
 * @param accessToken 액세스 토큰
 * @returns Authorization 헤더 값
 */
export function createAuthHeader(accessToken: string): string {
  const currentTimestamp = getCurrentTimestamp()
  const authString = `${accessToken}:${currentTimestamp}:${NICE_CLIENT_ID}`
  return `bearer ${Buffer.from(authString).toString('base64')}`
}

/**
 * NICE API 공통 헤더
 */
export function getCommonHeaders(accessToken: string, productId: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': createAuthHeader(accessToken),
    'ProductID': productId
  }
}

export { NICE_API_BASE_URL }
