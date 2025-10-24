import type { VercelRequest, VercelResponse } from '@vercel/node'
import { getAccessToken, getCommonHeaders, NICE_API_BASE_URL } from './_lib/niceAuth'
import { generateCryptoKeys, encryptAES, generateIntegrityValue } from './_lib/niceCrypto'
import iconv from 'iconv-lite'

const PRODUCT_ID = process.env.VITE_NICE_PRODUCT_ID_REALNAME || '2101290037' // 개인실명확인 상품코드

/**
 * 현재 날짜시간을 YYYYMMDDHH24MISS 형식으로 반환
 */
function getCurrentDateTime(): string {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  const hour = String(now.getHours()).padStart(2, '0')
  const minute = String(now.getMinutes()).padStart(2, '0')
  const second = String(now.getSeconds()).padStart(2, '0')
  return `${year}${month}${day}${hour}${minute}${second}`
}

/**
 * 암복호화용 토큰 요청
 */
async function getCryptoToken(accessToken: string) {
  const reqDtim = getCurrentDateTime()
  const reqNo = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  const response = await fetch(`${NICE_API_BASE_URL}/digital/niceid/api/v1.0/common/crypto/token`, {
    method: 'POST',
    headers: getCommonHeaders(accessToken, PRODUCT_ID),
    body: JSON.stringify({
      dataHeader: {
        CNTY_CD: 'ko'
      },
      dataBody: {
        req_dtim: reqDtim,
        req_no: reqNo,
        enc_mode: '1'  // 1: AES128, 2: AES256
      }
    })
  })

  if (!response.ok) {
    throw new Error('암호화 토큰 요청 실패')
  }

  const data = await response.json()

  if (data.dataHeader?.GW_RSLT_CD !== '1200') {
    throw new Error(`토큰 요청 오류: ${data.dataHeader?.GW_RSLT_MSG}`)
  }

  if (data.dataBody?.rsp_cd !== 'P000') {
    throw new Error(`토큰 요청 실패: ${data.dataBody?.res_msg}`)
  }

  return {
    reqDtim,
    reqNo,
    tokenVersionId: data.dataBody.token_version_id,
    tokenVal: data.dataBody.token_val,
    period: data.dataBody.period
  }
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
      return res.status(400).json({
        success: false,
        error: '이름과 주민등록번호를 입력해주세요'
      })
    }

    // 주민등록번호 13자리 검증
    if (rrn.length !== 13) {
      return res.status(400).json({
        success: false,
        error: '주민등록번호는 13자리여야 합니다'
      })
    }

    // 1. 액세스 토큰 발급
    const accessToken = await getAccessToken()

    // 2. 암복호화용 토큰 요청
    const cryptoToken = await getCryptoToken(accessToken)

    // 3. 대칭키 생성
    const { key, iv, hmacKey } = generateCryptoKeys(
      cryptoToken.reqDtim,
      cryptoToken.reqNo,
      cryptoToken.tokenVal,
      '1'  // AES128
    )

    // 4. 성명을 EUC-KR로 인코딩 후 암호화
    const nameEucKr = iconv.encode(name, 'euc-kr').toString('binary')
    const encName = encryptAES(nameEucKr, key, iv, '1')

    // 5. 주민등록번호 암호화
    const encJuminId = encryptAES(rrn, key, iv, '1')

    // 6. 무결성 체크값 생성
    const integrityValue = generateIntegrityValue(
      cryptoToken.tokenVersionId,
      encJuminId,
      encName,
      hmacKey
    )

    // 7. 개인실명확인 API 호출
    const response = await fetch(`${NICE_API_BASE_URL}/digital/niceid/api/v1.0/name/national/check`, {
      method: 'POST',
      headers: getCommonHeaders(accessToken, PRODUCT_ID),
      body: JSON.stringify({
        dataHeader: {
          CNTY_CD: 'ko'
        },
        dataBody: {
          token_version_id: cryptoToken.tokenVersionId,
          enc_jumin_id: encJuminId,
          enc_name: encName,
          integrity_value: integrityValue
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
        message: data.dataBody?.res_msg || '실명확인 실패',
        code: data.dataBody?.rsp_cd
      })
    }

    // 3. result_cd 확인
    // 1: 성명 일치, 2: 성명 불일치, 3: 당사 성명 미보유, 7: 명의도용 차단, 8: 부정사용 의심 정보 차단
    if (data.dataBody?.result_cd === '1') {
      return res.status(200).json({
        success: true,
        message: '실명확인 성공',
        data: data.dataBody
      })
    } else {
      const messages: Record<string, string> = {
        '2': '성명 불일치',
        '3': '당사 성명 미보유',
        '7': '명의도용 차단',
        '8': '부정사용 의심 정보 차단'
      }
      return res.status(200).json({
        success: false,
        message: messages[data.dataBody?.result_cd] || '실명확인 실패',
        code: data.dataBody?.result_cd
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
