/**
 * NICE API 암복호화 유틸리티
 */
import { createHash, createCipheriv, createHmac } from 'crypto'

/**
 * SHA-256 해시 생성 후 Base64 인코딩
 */
export function sha256Base64(value: string): string {
  const hash = createHash('sha256')
  hash.update(value)
  return hash.digest('base64')
}

/**
 * 대칭키 정보 생성
 * @param reqDtim 요청일시 (YYYYMMDDHH24MISS)
 * @param reqNo 요청고유번호
 * @param tokenVal 암호화 토큰값
 * @param encMode 암호화 모드 (1: AES128, 2: AES256)
 */
export function generateCryptoKeys(
  reqDtim: string,
  reqNo: string,
  tokenVal: string,
  encMode: '1' | '2'
) {
  // SHA256 & Base64 Encoding
  const combined = reqDtim.trim() + reqNo.trim() + tokenVal.trim()
  const hashed = sha256Base64(combined)
  const hashedBuffer = Buffer.from(hashed, 'base64')

  // Key 길이 결정
  const keyLength = encMode === '1' ? 16 : 32  // AES128: 16byte, AES256: 32byte

  // Key: 앞에서부터 16 or 32 bytes
  const key = hashedBuffer.slice(0, keyLength)

  // IV: 뒤에서부터 16 bytes
  const iv = hashedBuffer.slice(-16)

  // HMAC Key: 뒤에서부터 32 bytes
  const hmacKey = hashedBuffer.slice(-32)

  return {
    key,
    iv,
    hmacKey
  }
}

/**
 * AES 암호화 (CBC 모드, PKCS7 패딩)
 * @param plainText 평문
 * @param key 암호화 키
 * @param iv Initial Vector
 * @param encMode 암호화 모드 (1: AES128, 2: AES256)
 */
export function encryptAES(
  plainText: string,
  key: Buffer,
  iv: Buffer,
  encMode: '1' | '2'
): string {
  const algorithm = encMode === '1' ? 'aes-128-cbc' : 'aes-256-cbc'
  const cipher = createCipheriv(algorithm, key, iv)

  let encrypted = cipher.update(plainText, 'utf8', 'base64')
  encrypted += cipher.final('base64')

  return encrypted
}

/**
 * HMAC-SHA256 생성 후 Base64 인코딩
 * @param message 메시지
 * @param key HMAC 키
 */
export function hmacSha256(message: string, key: Buffer): string {
  const hmac = createHmac('sha256', key)
  hmac.update(message)
  return hmac.digest('base64')
}

/**
 * 무결성 체크값 생성
 * @param tokenVersionId 토큰 버전 ID
 * @param encJuminId 암호화된 주민등록번호
 * @param encName 암호화된 성명
 * @param hmacKey HMAC 키
 */
export function generateIntegrityValue(
  tokenVersionId: string,
  encJuminId: string,
  encName: string,
  hmacKey: Buffer
): string {
  const message = tokenVersionId.trim() + encJuminId.trim() + encName.trim()
  return hmacSha256(message, hmacKey)
}
