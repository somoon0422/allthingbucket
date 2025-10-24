import type { VercelRequest, VercelResponse } from '@vercel/node'

const NICE_CLIENT_ID = process.env.VITE_NICE_CLIENT_ID
const NICE_CLIENT_SECRET = process.env.VITE_NICE_CLIENT_SECRET
const NICE_API_BASE_URL = 'https://api.niceid.co.kr'

/**
 * NICE API 액세스 토큰 발급
 */
async function getAccessToken(): Promise<string> {
  const response = await fetch(`${NICE_API_BASE_URL}/oauth/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${Buffer.from(`${NICE_CLIENT_ID}:${NICE_CLIENT_SECRET}`).toString('base64')}`
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
  return data.dataBody.access_token
}

/**
 * 실명확인 API 엔드포인트
 */
export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS 헤더 설정
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, rrn } = req.body

    if (!name || !rrn) {
      return res.status(400).json({ error: '이름과 주민등록번호를 입력해주세요' })
    }

    // 액세스 토큰 발급
    const accessToken = await getAccessToken()

    // 실명확인 API 호출
    const response = await fetch(`${NICE_API_BASE_URL}/api/v1/realname/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'client_id': NICE_CLIENT_ID!
      },
      body: JSON.stringify({
        dataHeader: {
          CNTY_CD: 'ko'
        },
        dataBody: {
          name: name,
          rrn: rrn
        }
      })
    })

    const data = await response.json()

    // 응답 반환
    if (data.dataBody.result_cd === '0000') {
      return res.status(200).json({
        success: true,
        message: '실명확인 성공',
        data: data.dataBody
      })
    } else {
      return res.status(200).json({
        success: false,
        message: data.dataBody.result_msg || '실명확인 실패',
        code: data.dataBody.result_cd
      })
    }
  } catch (error) {
    console.error('실명확인 오류:', error)
    return res.status(500).json({
      success: false,
      message: '실명확인 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
