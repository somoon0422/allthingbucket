import CryptoJS from 'crypto-js'

// 네이버 클라우드 Biz Message (카카오 알림톡) 서비스
class AlimtalkService {
  private accessKey: string
  private secretKey: string
  private serviceId: string
  private plusFriendId: string = '@올띵버킷' // 카카오 플러스친구 ID

  constructor() {
    this.accessKey = import.meta.env.VITE_SMS_ACCESS_KEY || ''
    this.secretKey = import.meta.env.VITE_SMS_SECRET_KEY || ''
    this.serviceId = import.meta.env.VITE_NCP_ALIMTALK_SERVICE_ID || ''
  }

  // HMAC SHA256 서명 생성
  private makeSignature(method: string, url: string, timestamp: string): string {
    const space = ' '
    const newLine = '\n'

    const hmac = CryptoJS.algo.HMAC.create(CryptoJS.algo.SHA256, this.secretKey)
    hmac.update(method)
    hmac.update(space)
    hmac.update(url)
    hmac.update(newLine)
    hmac.update(timestamp)
    hmac.update(newLine)
    hmac.update(this.accessKey)

    const hash = hmac.finalize()
    return hash.toString(CryptoJS.enc.Base64)
  }

  // 알림톡 발송 API 호출
  private async sendAlimtalk(params: {
    to: string
    templateCode: string
    variables: Record<string, string>
    failoverConfig?: {
      type: 'SMS' | 'LMS'
      from: string
      subject?: string
      content: string
    }
  }): Promise<{ success: boolean; message: string }> {
    try {
      const timestamp = Date.now().toString()
      const method = 'POST'
      const url = `/alimtalk/v2/services/${this.serviceId}/messages`

      const signature = this.makeSignature(method, url, timestamp)

      const body = {
        plusFriendId: this.plusFriendId,
        templateCode: params.templateCode,
        messages: [
          {
            to: params.to.replace(/-/g, ''), // 하이픈 제거
            content: params.variables,
            ...(params.failoverConfig && {
              failoverConfig: params.failoverConfig
            })
          }
        ]
      }

      const response = await fetch(`https://sens.apigw.ntruss.com${url}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-ncp-apigw-timestamp': timestamp,
          'x-ncp-iam-access-key': this.accessKey,
          'x-ncp-apigw-signature-v2': signature
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ 알림톡 발송 성공:', result)
        return { success: true, message: '알림톡이 발송되었습니다.' }
      } else {
        console.error('❌ 알림톡 발송 실패:', result)
        return { success: false, message: result.message || '알림톡 발송에 실패했습니다.' }
      }
    } catch (error) {
      console.error('❌ 알림톡 발송 예외:', error)
      return { success: false, message: '알림톡 발송 중 오류가 발생했습니다.' }
    }
  }

  // 🎉 체험단 신청 승인 알림톡
  async sendApprovalAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'APPROVAL', // 카카오에 등록한 템플릿 코드
      variables: {
        userName,
        campaignName,
        url: 'https://allthingbucket.com/my-applications'
      },
      failoverConfig: {
        type: 'SMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        content: `[올띵버킷]\n${userName}님, ${campaignName} 체험단 신청이 승인되었습니다!\n\n마이페이지에서 자세한 내용을 확인해주세요.\nhttps://allthingbucket.com/my-applications`
      }
    })
  }

  // ❌ 체험단 신청 거절 알림톡
  async sendRejectionAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'REJECTION', // 카카오에 등록한 템플릿 코드
      variables: {
        userName,
        campaignName,
        reason: reason || '다른 기회에 다시 신청해주세요.',
        url: 'https://allthingbucket.com/experiences'
      },
      failoverConfig: {
        type: 'SMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        content: `[올띵버킷]\n${userName}님, ${campaignName} 체험단 신청 결과를 안내드립니다.\n\n${reason || '선정되지 않았습니다. 다른 기회에 다시 신청해주세요.'}\n\nhttps://allthingbucket.com/experiences`
      }
    })
  }

  // ✨ 리뷰 승인 알림톡
  async sendReviewApprovalAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'REVIEW_APPROVAL', // 카카오에 등록한 템플릿 코드
      variables: {
        userName,
        campaignName,
        url: 'https://allthingbucket.com/my-applications'
      },
      failoverConfig: {
        type: 'SMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        content: `[올띵버킷]\n${userName}님, ${campaignName} 리뷰가 승인되었습니다! ✨\n\n포인트 지급을 요청해주세요.\nhttps://allthingbucket.com/my-applications`
      }
    })
  }

  // ❌ 리뷰 반려 알림톡
  async sendReviewRejectionAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'REVIEW_REJECTION', // 카카오에 등록한 템플릿 코드
      variables: {
        userName,
        campaignName,
        reason: reason || '리뷰 가이드라인을 다시 확인해주세요.',
        url: 'https://allthingbucket.com/my-applications'
      },
      failoverConfig: {
        type: 'LMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        subject: '[올띵버킷] 리뷰 반려 안내',
        content: `[올띵버킷]\n${userName}님, ${campaignName} 리뷰가 반려되었습니다.\n\n반려 사유:\n${reason || '리뷰 가이드라인을 다시 확인해주세요.'}\n\n수정 후 다시 제출해주세요.\nhttps://allthingbucket.com/my-applications`
      }
    })
  }

  // 💰 포인트 출금 승인 알림톡
  async sendWithdrawalApprovalAlimtalk(
    phoneNumber: string,
    userName: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'WITHDRAWAL_APPROVAL', // 카카오에 등록한 템플릿 코드
      variables: {
        userName,
        amount: amount.toLocaleString(),
        url: 'https://allthingbucket.com/points'
      },
      failoverConfig: {
        type: 'SMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        content: `[올띵버킷]\n${userName}님, ${amount.toLocaleString()}P 출금이 승인되었습니다! 💰\n\n마이페이지에서 확인하세요.\nhttps://allthingbucket.com/points`
      }
    })
  }
}

export const alimtalkService = new AlimtalkService()
