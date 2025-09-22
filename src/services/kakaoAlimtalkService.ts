// 카카오 알림톡 서비스 (사용하지 않음 - 이메일만 사용)
// 참고: https://developers.kakao.com/docs/latest/ko/kakaotalk-channel/rest-api

interface AlimtalkMessage {
  to: string // 수신자 전화번호 (하이픈 제외)
  templateId: string // 템플릿 ID
  templateArgs?: Record<string, string> // 템플릿 변수
}

interface AlimtalkResponse {
  success: boolean
  message: string
  data?: any
}

class KakaoAlimtalkService {
  private accessToken: string
  private baseUrl = 'https://kapi.kakao.com/v2/api/talk/memo/send'

  constructor(accessToken: string) {
    this.accessToken = accessToken
  }

  // 🔥 알림톡 메시지 전송
  async sendAlimtalk(message: AlimtalkMessage): Promise<AlimtalkResponse> {
    try {
      console.log('📱 카카오 알림톡 전송 시작:', message)

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          template_id: message.templateId,
          receiver_uuids: message.to,
          ...message.templateArgs
        })
      })

      const result = await response.json()

      if (response.ok) {
        console.log('✅ 카카오 알림톡 전송 성공:', result)
        return {
          success: true,
          message: '알림톡이 성공적으로 전송되었습니다.',
          data: result
        }
      } else {
        console.error('❌ 카카오 알림톡 전송 실패:', result)
        return {
          success: false,
          message: result.message || '알림톡 전송에 실패했습니다.',
          data: result
        }
      }
    } catch (error) {
      console.error('❌ 카카오 알림톡 전송 오류:', error)
      return {
        success: false,
        message: '알림톡 전송 중 오류가 발생했습니다.',
        data: error
      }
    }
  }

  // 🔥 체험단 승인 알림톡 전송
  async sendApprovalNotification(phoneNumber: string, campaignName: string, userName: string): Promise<AlimtalkResponse> {
    const message: AlimtalkMessage = {
      to: phoneNumber.replace(/-/g, ''), // 하이픈 제거
      templateId: 'YOUR_TEMPLATE_ID', // 실제 템플릿 ID로 교체 필요
      templateArgs: {
        '#{user_name}': userName,
        '#{campaign_name}': campaignName,
        '#{approval_date}': new Date().toLocaleDateString('ko-KR')
      }
    }

    return await this.sendAlimtalk(message)
  }

  // 🔥 체험단 거절 알림톡 전송
  async sendRejectionNotification(phoneNumber: string, campaignName: string, userName: string, reason?: string): Promise<AlimtalkResponse> {
    const message: AlimtalkMessage = {
      to: phoneNumber.replace(/-/g, ''),
      templateId: 'YOUR_REJECTION_TEMPLATE_ID', // 실제 템플릿 ID로 교체 필요
      templateArgs: {
        '#{user_name}': userName,
        '#{campaign_name}': campaignName,
        '#{rejection_reason}': reason || '기타 사유',
        '#{rejection_date}': new Date().toLocaleDateString('ko-KR')
      }
    }

    return await this.sendAlimtalk(message)
  }

  // 🔥 포인트 출금 승인 알림톡 전송
  async sendWithdrawalApprovalNotification(phoneNumber: string, userName: string, amount: number): Promise<AlimtalkResponse> {
    const message: AlimtalkMessage = {
      to: phoneNumber.replace(/-/g, ''),
      templateId: 'YOUR_WITHDRAWAL_TEMPLATE_ID', // 실제 템플릿 ID로 교체 필요
      templateArgs: {
        '#{user_name}': userName,
        '#{amount}': amount.toLocaleString(),
        '#{approval_date}': new Date().toLocaleDateString('ko-KR')
      }
    }

    return await this.sendAlimtalk(message)
  }
}

export default KakaoAlimtalkService

// 🔥 사용 예시
export const createKakaoAlimtalkService = (accessToken: string) => {
  return new KakaoAlimtalkService(accessToken)
}

// 🔥 통합 알림 서비스는 사용하지 않음 - 이메일만 사용

// 🔥 템플릿 예시 (실제로는 카카오 비즈니스 계정에서 생성)
export const ALIMTALK_TEMPLATES = {
  APPROVAL: {
    id: 'YOUR_APPROVAL_TEMPLATE_ID',
    name: '체험단 승인 알림',
    content: `안녕하세요 #{user_name}님!
    
올띵버킷 체험단에 신청해주신 #{campaign_name} 캠페인이 승인되었습니다! 🎉

체험 진행 방법과 일정은 별도 안내드릴 예정입니다.
감사합니다.

- 올띵버킷 팀`
  },
  REJECTION: {
    id: 'YOUR_REJECTION_TEMPLATE_ID',
    name: '체험단 거절 알림',
    content: `안녕하세요 #{user_name}님!
    
올띵버킷 체험단에 신청해주신 #{campaign_name} 캠페인에 대해 검토한 결과, 
이번에는 선정되지 않았습니다.

#{rejection_reason}

다음 기회에 더 좋은 콘텐츠로 만나뵐 수 있기를 바랍니다.

- 올띵버킷 팀`
  },
  WITHDRAWAL: {
    id: 'YOUR_WITHDRAWAL_TEMPLATE_ID',
    name: '포인트 출금 승인 알림',
    content: `안녕하세요 #{user_name}님!
    
포인트 출금 신청이 승인되었습니다.

출금 금액: #{amount}원
승인일: #{approval_date}

입금은 영업일 기준 1-2일 내에 완료됩니다.

- 올띵버킷 팀`
  }
}
