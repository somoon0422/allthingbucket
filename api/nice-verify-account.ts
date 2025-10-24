import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken, getCommonHeaders, NICE_API_BASE_URL } from './lib/niceAuth'

const PRODUCT_ID = process.env.VITE_NICE_PRODUCT_ID_ACCOUNT || '2001988003' // 계좌확인 상품코드

/**
 * 계좌성명확인 API 엔드포인트
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
    const { bankCode, accountNumber, name } = req.body

    if (!bankCode || !accountNumber || !name) {
      return res.status(400).json({
        success: false,
        error: '은행코드, 계좌번호, 예금주명을 입력해주세요'
      })
    }

    // 계좌번호에서 하이픈 제거
    const cleanAccountNumber = accountNumber.replace(/-/g, '')

    // 액세스 토큰 발급
    const accessToken = await getAccessToken()

    // 계좌성명확인 API 호출
    const response = await fetch(`${NICE_API_BASE_URL}/digital/niceid/api/v1.0/account/holder`, {
      method: 'POST',
      headers: getCommonHeaders(accessToken, PRODUCT_ID),
      body: JSON.stringify({
        dataHeader: {
          CNTY_CD: 'ko'
        },
        dataBody: {
          acct_gb: '1',  // 1: 개인, 2: 사업자
          bnk_cd: bankCode,
          name: name,
          acct_no: cleanAccountNumber,
          request_no: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`  // 요청 고유번호
        }
      })
    })

    if (!response.ok) {
      throw new Error(`API 요청 실패: ${response.status}`)
    }

    const data = await response.json()

    // 응답 구조 확인
    // 1. dataHeader.GW_RSLT_CD 가 "1200"이어야 dataBody가 유효
    if (data.dataHeader?.GW_RSLT_CD !== '1200') {
      return res.status(200).json({
        success: false,
        message: data.dataHeader?.GW_RSLT_MSG || '게이트웨이 오류',
        code: data.dataHeader?.GW_RSLT_CD
      })
    }

    // 2. dataBody.rsp_cd가 "P000"이어야 result_cd가 유효
    if (data.dataBody?.rsp_cd !== 'P000') {
      return res.status(200).json({
        success: false,
        message: data.dataBody?.res_msg || '계좌확인 실패',
        code: data.dataBody?.rsp_cd
      })
    }

    // 3. result_cd가 "0000"이어야 성공
    if (data.dataBody?.result_cd === '0000') {
      return res.status(200).json({
        success: true,
        message: '계좌확인 성공',
        bankCode: bankCode,
        accountNumber: cleanAccountNumber,
        accountHolder: name,
        data: data.dataBody
      })
    } else {
      return res.status(200).json({
        success: false,
        message: `계좌확인 실패: ${data.dataBody?.result_cd}`,
        code: data.dataBody?.result_cd
      })
    }

  } catch (error) {
    console.error('계좌확인 오류:', error)
    return res.status(500).json({
      success: false,
      message: '계좌확인 중 오류가 발생했습니다',
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}
