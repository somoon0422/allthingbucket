// 네이버 클라우드 플랫폼 SENS 알림톡 서비스
// 참고: https://api.ncloud-docs.com/docs/ai-application-service-sens-alimtalkv2


export class NaverCloudAlimtalkService {
  constructor() {
    // 백엔드 API 호출로 변경되어 환경 변수 불필요
  }


  // 🔥 알림톡 발송 (백엔드 API 호출)
  async sendAlimtalk(alimtalkData: {
    to: string
    title: string
    content: string
    templateCode: string
    buttons?: Array<{
      type: string
      name: string
      linkMo?: string
      linkPc?: string
    }>
  }): Promise<{ success: boolean; message: string; requestId?: string }> {
    try {
      console.log('💬 네이버 클라우드 알림톡 발송 요청:', {
        to: alimtalkData.to,
        title: alimtalkData.title,
        templateCode: alimtalkData.templateCode
      })

      const response = await fetch('http://localhost:3001/api/naver-cloud/send-alimtalk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(alimtalkData)
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ 네이버 클라우드 알림톡 발송 실패:', errorData)
        return {
          success: false,
          message: `알림톡 발송 실패: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('✅ 네이버 클라우드 알림톡 발송 성공:', result)

      return result

    } catch (error) {
      console.error('❌ 네이버 클라우드 알림톡 발송 오류:', error)
      return {
        success: false,
        message: `알림톡 발송 중 오류가 발생했습니다: ${error}`
      }
    }
  }

  // 🔥 승인 알림톡
  async sendApprovalAlimtalk(userPhone: string, userName: string, campaignName: string): Promise<{ success: boolean; message: string }> {
    const title = `🎉 '${campaignName}' 최종 선정 안내`
    const content = `안녕하세요, #{userName}님.

올바른 먹거리로 반려견의 일상을 함께하는 농심 반려다움입니다.

'${campaignName}'에 #{userName}님이 최종 선정되셨음을 진심으로 축하드립니다! 🎉

아래 링크를 클릭해서 체험단 가이드를 확인하시고 다음 단계를 진행해주세요.`

    const buttons = [
      {
        type: 'WL',
        name: '체험단 가이드 확인하기',
        linkMo: `${window.location.origin}/my-applications`,
        linkPc: `${window.location.origin}/my-applications`
      }
    ]

    return this.sendAlimtalk({
      to: userPhone,
      title,
      content,
      templateCode: 'APPROVAL_TEMPLATE', // 실제 템플릿 코드로 교체 필요
      buttons
    })
  }

  // 🔥 거절 알림톡
  async sendRejectionAlimtalk(userPhone: string, userName: string, campaignName: string, reason?: string): Promise<{ success: boolean; message: string }> {
    const title = '😔 체험단 신청 결과'
    const content = `안녕하세요, ${userName}님!

${campaignName} 체험단 신청 결과를 안내드립니다.

📝 신청 결과
선정되지 않았습니다.
${reason || '다른 기회에 다시 신청해주세요.'}

💡 다음 기회를 위해
• 다른 체험단에 신청해보세요
• 프로필을 더욱 완성도 있게 작성해보세요
• 리뷰 작성 경험을 쌓아보세요`

    const buttons = [
      {
        type: 'WL',
        name: '다른 체험단 보기',
        linkMo: `${window.location.origin}/experiences`,
        linkPc: `${window.location.origin}/experiences`
      }
    ]

    return this.sendAlimtalk({
      to: userPhone,
      title,
      content,
      templateCode: 'REJECTION_TEMPLATE', // 실제 템플릿 코드로 교체 필요
      buttons
    })
  }

  // 🔥 출금 승인 알림톡
  async sendWithdrawalApprovalAlimtalk(userPhone: string, userName: string, amount: number): Promise<{ success: boolean; message: string }> {
    const currentDate = new Date().toLocaleDateString('ko-KR')
    const title = '💰 출금 승인 완료!'
    const content = `안녕하세요, ${userName}님!

포인트 출금 요청이 승인되어 처리되었습니다.

💳 출금 정보
• 출금 금액: ${amount.toLocaleString()}P
• 승인일: ${currentDate}

📋 안내사항
• 출금된 포인트는 등록하신 계좌로 입금됩니다
• 입금까지 1-2 영업일이 소요될 수 있습니다
• 문의사항이 있으시면 고객센터로 연락해주세요`

    const buttons = [
      {
        type: 'WL',
        name: '포인트 내역 보기',
        linkMo: `${window.location.origin}/points`,
        linkPc: `${window.location.origin}/points`
      }
    ]

    return this.sendAlimtalk({
      to: userPhone,
      title,
      content,
      templateCode: 'WITHDRAWAL_TEMPLATE', // 실제 템플릿 코드로 교체 필요
      buttons
    })
  }
}

// 🔥 싱글톤 인스턴스
export const naverCloudAlimtalkService = new NaverCloudAlimtalkService()

export default NaverCloudAlimtalkService
