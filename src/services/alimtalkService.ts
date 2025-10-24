// 네이버 클라우드 Biz Message (카카오 알림톡) 서비스
// Vercel API를 통해 알림톡 발송 (CORS 문제 해결)
class AlimtalkService {
  // 알림톡 발송 API 호출 (Vercel API를 통해)
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
      // 🔥 Vercel API를 통해 알림톡 발송 (CORS 문제 해결)
      // 로컬 개발 환경에서도 배포된 API를 사용 (Vercel Functions는 로컬에서 작동 안함)
      const apiUrl = 'https://allthingbucket.vercel.app/api/naver-cloud/send-alimtalk'

      const body = {
        to: params.to,
        templateCode: params.templateCode,
        variables: params.variables,
        ...(params.failoverConfig && {
          failoverConfig: params.failoverConfig
        })
      }

      console.log('💬 알림톡 발송 요청:', body)

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok && result.success) {
        console.log('✅ 알림톡 발송 성공:', result)
        return { success: true, message: result.message || '알림톡이 발송되었습니다.' }
      } else {
        console.error('❌ 알림톡 발송 실패:', result)
        return { success: false, message: result.message || '알림톡 발송에 실패했습니다.' }
      }
    } catch (error) {
      console.error('❌ 알림톡 발송 예외:', error)
      return { success: false, message: '알림톡 발송 중 오류가 발생했습니다.' }
    }
  }

  // 💰 포인트 출금 승인 알림톡
  async sendWithdrawalApprovalAlimtalk(
    phoneNumber: string,
    userName: string,
    amount: number
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'WITHDRAWALAPPROVAL', // 카카오에 등록한 템플릿 코드
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

  // 🎉 회원가입 환영 알림톡
  async sendWelcomeAlimtalk(
    phoneNumber: string,
    userName: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'WELCOME',
      variables: {
        name: userName,
        url: 'https://allthingbucket.com/experiences'
      },
      failoverConfig: {
        type: 'SMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        content: `[올띵버킷]\n${userName}님, 가입을 환영합니다! 🎉\n\n다양한 체험단에 참여하고 리뷰 작성으로 포인트를 받아보세요!\n\nhttps://allthingbucket.com/experiences`
      }
    })
  }

  // 📝 캠페인 신청 완료 알림톡
  async sendApplicationSubmittedAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string,
    brandName: string,
    applicationDate: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'APPLICATIONSUBMITTED',
      variables: {
        name: userName,
        campaignName,
        brandName,
        applicationDate,
        url: 'https://allthingbucket.com/my-applications'
      },
      failoverConfig: {
        type: 'LMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        subject: '[올띵버킷] 신청 완료',
        content: `[올띵버킷]\n${userName}님, 신청이 완료되었습니다! ✅\n\n📋 신청 정보\n- 캠페인: ${campaignName}\n- 브랜드: ${brandName}\n- 신청일: ${applicationDate}\n- 상태: 승인 대기중\n\n영업일 기준 3일 이내에 결과를 안내드립니다.\n\nhttps://allthingbucket.com/my-applications`
      }
    })
  }

  // 🎉 신청 승인 알림톡 (기존과 다른 내용)
  async sendApplicationApprovedAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string,
    rewardPoints: number
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'APPLICATIONAPPROVED',
      variables: {
        name: userName,
        campaignName,
        rewardPoints: rewardPoints.toString(),
        url: 'https://allthingbucket.com/my-applications'
      },
      failoverConfig: {
        type: 'LMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        subject: '[올띵버킷] 체험단 선정',
        content: `[올띵버킷]\n${userName}님, 축하드립니다! 🎉\n\n${campaignName} 체험단에 선정되셨습니다!\n\n📦 다음 단계\n1. 체험단 가이드 확인 (제품 구매 or 배송 대기)\n2. 체험 진행 및 리뷰 작성\n3. 리뷰 승인 후 포인트 지급 (${rewardPoints}P)\n4. 포인트 출금 요청\n\n⛳️ 체험단 상세 페이지에서 체험 가이드를 확인해 주세요.\n혹은 이메일로 체험 가이드를 발송드렸으니 확인 후 진행해 주세요.\n\n(*확인이 안 되실 경우 스팸함도 확인해 주세요.)\n\nhttps://allthingbucket.com/my-applications`
      }
    })
  }

  // ❌ 신청 반려 알림톡 (기존과 다른 내용)
  async sendApplicationRejectedAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string,
    reason?: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'APPLICATIONREJECTED',
      variables: {
        name: userName,
        campaignName,
        reason: reason || '선정 인원이 마감되었습니다.',
        url: 'https://allthingbucket.com/experiences'
      },
      failoverConfig: {
        type: 'LMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        subject: '[올띵버킷] 신청 결과 안내',
        content: `[올띵버킷]\n${userName}님, 신청 결과를 안내드립니다.\n\n${campaignName} 체험단 신청이 아쉽게도 선정되지 않았습니다.\n\n📝 반려 사유\n${reason || '선정 인원이 마감되었습니다.'}\n\n다른 체험단도 둘러보세요!\nhttps://allthingbucket.com/experiences`
      }
    })
  }

  // ✨ 리뷰 승인 + 포인트 지급 완료 알림톡
  async sendReviewApprovedWithPointsAlimtalk(
    phoneNumber: string,
    userName: string,
    campaignName: string,
    amount: number,
    totalPoints: number,
    paymentDate: string
  ): Promise<{ success: boolean; message: string }> {
    return this.sendAlimtalk({
      to: phoneNumber,
      templateCode: 'REVIEWAPPROVEDPOINTSPAID',
      variables: {
        name: userName,
        campaignName,
        amount: amount.toString(),
        totalPoints: totalPoints.toString(),
        paymentDate,
        url: 'https://allthingbucket.com/points'
      },
      failoverConfig: {
        type: 'LMS',
        from: import.meta.env.VITE_SMS_FROM_NUMBER || '',
        subject: '[올띵버킷] 리뷰 승인 완료',
        content: `[올띵버킷]\n${userName}님, 리뷰가 승인되었습니다! ✨\n\n${campaignName} 리뷰 검수가 완료되어 포인트가 지급되었습니다.\n\n💰 포인트 지급 내역\n- 지급 포인트: ${amount}P\n- 현재 잔액: ${totalPoints}P\n- 지급일: ${paymentDate}\n\nhttps://allthingbucket.com/points`
      }
    })
  }

}

export const alimtalkService = new AlimtalkService()
