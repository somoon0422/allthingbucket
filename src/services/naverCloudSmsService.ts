// 네이버 클라우드 플랫폼 SENS SMS 서비스
// 참고: https://api.ncloud-docs.com/docs/ai-application-service-sens-smsv2


export class NaverCloudSmsService {
  constructor() {
    // 백엔드 API 호출로 변경되어 환경 변수 불필요
  }


  // 🔥 SMS 발송 (백엔드 API 호출)
  async sendSms(smsData: {
    to: string
    content: string
    subject?: string
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    try {
      console.log('📱 네이버 클라우드 SMS 발송 요청:', {
        to: smsData.to,
        content: smsData.content
      })

      const response = await fetch('http://localhost:3001/api/naver-cloud/send-sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(smsData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ 네이버 클라우드 SMS 발송 실패:', errorData)
        return {
          success: false,
          message: `SMS 발송 실패: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('✅ 네이버 클라우드 SMS 발송 성공:', result)

      return result

    } catch (error) {
      console.error('❌ 네이버 클라우드 SMS 발송 오류:', error)
      return {
        success: false,
        message: `SMS 발송 중 오류가 발생했습니다: ${error}`
      }
    }
  }

  // 🔥 승인 알림 SMS
  async sendApprovalSms(userPhone: string, userName: string, campaignName: string): Promise<{ success: boolean; message: string }> {
    const content = `[올띵버킷] 안녕하세요 ${userName}님! ${campaignName} 체험단 신청이 승인되었습니다. 제품을 받으신 후 체험을 진행해주세요. 자세한 내용은 올띵버킷에서 확인하세요.`

    return this.sendSms({
      to: userPhone,
      content
    })
  }

  // 🔥 거절 알림 SMS
  async sendRejectionSms(userPhone: string, userName: string, campaignName: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const content = `[올띵버킷] 안녕하세요 ${userName}님! ${campaignName} 체험단 신청 결과를 안내드립니다. 선정되지 않았습니다. ${reason || '다른 기회에 다시 신청해주세요.'}`

    return this.sendSms({
      to: userPhone,
      content
    })
  }

  // 🔥 출금 승인 SMS
  async sendWithdrawalApprovalSms(userPhone: string, userName: string, amount: number): Promise<{ success: boolean; message: string }> {
    const content = `[올띵버킷] 안녕하세요 ${userName}님! 포인트 출금 요청이 승인되었습니다. 출금 금액: ${amount.toLocaleString()}P. 1-2 영업일 내에 입금됩니다.`

    return this.sendSms({
      to: userPhone,
      content
    })
  }

  // 🔥 커스텀 SMS 발송 (UI에서 작성한 내용)
  async sendCustomSms(userPhone: string, content: string): Promise<{ success: boolean; message: string; requestId?: string }> {
    return this.sendSms({
      to: userPhone,
      content: `[올띵버킷] ${content}`
    })
  }
}

// 🔥 싱글톤 인스턴스
export const naverCloudSmsService = new NaverCloudSmsService()

export default NaverCloudSmsService
