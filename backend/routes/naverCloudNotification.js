const express = require('express')
const router = express.Router()
const CryptoJS = require('crypto-js')

// 네이버 클라우드 플랫폼 설정
const NCP_ACCESS_KEY = process.env.VITE_SMS_ACCESS_KEY
const NCP_SECRET_KEY = process.env.VITE_SMS_SECRET_KEY
const SMS_SERVICE_ID = process.env.VITE_SMS_SERVICE_ID
const ALIMTALK_SERVICE_ID = 'ncp:kkobizmsg:kr:359104915298:allthingbucket'
const EMAIL_ENDPOINT = 'https://mail.apigw.ntruss.com/api/v1'
const SMS_ENDPOINT = 'https://sens.apigw.ntruss.com/sms/v2'
const ALIMTALK_ENDPOINT = 'https://sens.apigw.ntruss.com/alimtalk/v2'

// 🔥 서명 생성 함수
function makeSignature(method, url, timestamp, secretKey, accessKey) {
  const space = ' '
  const newLine = '\n'
  
  const message = method + space + url + newLine + timestamp + newLine + accessKey
  
  const signature = CryptoJS.HmacSHA256(message, secretKey)
  return CryptoJS.enc.Base64.stringify(signature)
}

// 🔥 이메일 발송
router.post('/send-email', async (req, res) => {
  try {
    const { to, toName, subject, html, text } = req.body

    if (!to || !subject || !html || !text) {
      return res.status(400).json({ error: 'Missing required email fields' })
    }

    const timestamp = Date.now().toString()
    const url = '/api/v1/mails'
    const signature = makeSignature('POST', url, timestamp, NCP_SECRET_KEY, NCP_ACCESS_KEY)

    const requestBody = {
      senderAddress: process.env.VITE_SUPPORT_EMAIL || 'support@allthingbucket.com',
      title: subject,
      body: html,
      recipients: [{
        address: to,
        name: toName,
        type: 'R'
      }],
      individual: true,
      advertising: false
    }

    console.log('📧 네이버 클라우드 이메일 발송 요청:', { to, toName, subject })

    const response = await fetch(`${EMAIL_ENDPOINT}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature,
        'x-ncp-lang': 'ko-KR'
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ 네이버 클라우드 이메일 발송 실패:', errorData)
      return res.status(500).json({ 
        success: false, 
        message: `이메일 발송 실패: ${response.status} ${response.statusText}` 
      })
    }

    const result = await response.json()
    console.log('✅ 네이버 클라우드 이메일 발송 성공:', result)

    res.json({
      success: true,
      message: `${toName}님에게 이메일을 전송했습니다.`,
      requestId: result.requestId
    })

  } catch (error) {
    console.error('❌ 네이버 클라우드 이메일 발송 오류:', error)
    res.status(500).json({
      success: false,
      message: `이메일 발송 중 오류가 발생했습니다: ${error.message}`
    })
  }
})

// 🔥 SMS 발송
router.post('/send-sms', async (req, res) => {
  try {
    const { to, content } = req.body

    if (!to || !content) {
      return res.status(400).json({ error: 'Missing required SMS fields' })
    }

    const timestamp = Date.now().toString()
    const url = `/services/${SMS_SERVICE_ID}/messages`
    const signature = makeSignature('POST', url, timestamp, NCP_SECRET_KEY, NCP_ACCESS_KEY)

    const requestBody = {
      type: 'SMS',
      contentType: 'COMM',
      countryCode: '82',
      from: process.env.VITE_SMS_FROM_NUMBER || '01072907620',
      content: content,
      messages: [{
        to: to,
        content: content
      }]
    }

    console.log('📱 네이버 클라우드 SMS 발송 요청:', { to, content })

    const response = await fetch(`${SMS_ENDPOINT}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ 네이버 클라우드 SMS 발송 실패:', errorData)
      return res.status(500).json({ 
        success: false, 
        message: `SMS 발송 실패: ${response.status} ${response.statusText}` 
      })
    }

    const result = await response.json()
    console.log('✅ 네이버 클라우드 SMS 발송 성공:', result)

    res.json({
      success: true,
      message: 'SMS를 전송했습니다.',
      requestId: result.requestId
    })

  } catch (error) {
    console.error('❌ 네이버 클라우드 SMS 발송 오류:', error)
    res.status(500).json({
      success: false,
      message: `SMS 발송 중 오류가 발생했습니다: ${error.message}`
    })
  }
})

// 🔥 알림톡 발송
router.post('/send-alimtalk', async (req, res) => {
  try {
    const { to, title, content, templateCode, buttons = [] } = req.body

    if (!to || !title || !content || !templateCode) {
      return res.status(400).json({ error: 'Missing required Alimtalk fields' })
    }

    const timestamp = Date.now().toString()
    const url = `/services/${ALIMTALK_SERVICE_ID}/messages`
    const signature = makeSignature('POST', url, timestamp, NCP_SECRET_KEY, NCP_ACCESS_KEY)

    const requestBody = {
      plusFriendId: process.env.VITE_COMPANY_NAME || '올띵버킷',
      templateCode: templateCode,
      messages: [{
        countryCode: '82',
        to: to,
        title: title,
        content: content,
        buttons: buttons
      }]
    }

    console.log('💬 네이버 클라우드 알림톡 발송 요청:', { to, title, templateCode })

    const response = await fetch(`${ALIMTALK_ENDPOINT}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'x-ncp-apigw-timestamp': timestamp,
        'x-ncp-iam-access-key': NCP_ACCESS_KEY,
        'x-ncp-apigw-signature-v2': signature
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.text()
      console.error('❌ 네이버 클라우드 알림톡 발송 실패:', errorData)
      return res.status(500).json({ 
        success: false, 
        message: `알림톡 발송 실패: ${response.status} ${response.statusText}` 
      })
    }

    const result = await response.json()
    console.log('✅ 네이버 클라우드 알림톡 발송 성공:', result)

    res.json({
      success: true,
      message: '알림톡을 전송했습니다.',
      requestId: result.requestId
    })

  } catch (error) {
    console.error('❌ 네이버 클라우드 알림톡 발송 오류:', error)
    res.status(500).json({
      success: false,
      message: `알림톡 발송 중 오류가 발생했습니다: ${error.message}`
    })
  }
})

module.exports = router
