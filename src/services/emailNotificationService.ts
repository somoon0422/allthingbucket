// Supabase SMTP 이메일 알림 서비스
// 참고: https://supabase.com/docs/guides/functions/examples/send-email

interface EmailTemplate {
  subject: string
  html: string
  text: string
}

interface EmailData {
  to: string
  toName: string
  type: 'approval' | 'rejection' | 'withdrawal'
  data: any
}

// 🔥 이메일 템플릿 생성
const createEmailTemplate = (type: 'approval' | 'rejection' | 'withdrawal', data: any): EmailTemplate => {
  const baseUrl = window.location.origin
  const currentDate = new Date().toLocaleDateString('ko-KR')
  
  switch (type) {
    case 'approval':
      return {
        subject: `🎉 체험단 신청이 승인되었습니다! - ${data.campaignName}`,
        html: `
          <div style="font-family: 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">🎉 체험단 신청 승인!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, ${data.userName}님!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>${data.campaignName}</strong> 체험단 신청이 승인되었습니다! 🎊
              </p>
              
              <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <h3 style="color: #2c5aa0; margin-top: 0;">📋 다음 단계</h3>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                  <li>제품을 받으신 후 체험을 진행해주세요</li>
                  <li>리뷰 작성 기한을 확인해주세요</li>
                  <li>리뷰 가이드라인을 숙지해주세요</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/my-applications" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;">
                  내 신청 현황 보기
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 14px;">
                <p>이 이메일은 올띵버킷에서 자동으로 발송되었습니다.</p>
                <p>문의사항이 있으시면 <a href="mailto:support@allthingbucket.com" style="color: #667eea;">support@allthingbucket.com</a>으로 연락해주세요.</p>
              </div>
            </div>
          </div>
        `,
        text: `안녕하세요, ${data.userName}님!\n\n${data.campaignName} 체험단 신청이 승인되었습니다!\n\n다음 단계:\n- 제품을 받으신 후 체험을 진행해주세요\n- 리뷰 작성 기한을 확인해주세요\n- 리뷰 가이드라인을 숙지해주세요\n\n내 신청 현황: ${baseUrl}/my-applications\n\n문의: support@allthingbucket.com`
      }
      
    case 'rejection':
      return {
        subject: `😔 체험단 신청 결과 안내 - ${data.campaignName}`,
        html: `
          <div style="font-family: 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">😔 체험단 신청 결과</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, ${data.userName}님!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                <strong>${data.campaignName}</strong> 체험단 신청에 대한 결과를 안내드립니다.
              </p>
              
              <div style="background: #fff3cd; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ffc107;">
                <h3 style="color: #856404; margin-top: 0;">📝 신청 결과</h3>
                <p style="color: #856404; margin: 0;">
                  <strong>선정되지 않았습니다.</strong><br>
                  ${data.reason || '다른 기회에 다시 신청해주세요.'}
                </p>
              </div>
              
              <div style="background: #e7f3ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2c5aa0; margin-top: 0;">💡 다음 기회를 위해</h3>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                  <li>다른 체험단에 신청해보세요</li>
                  <li>프로필을 더욱 완성도 있게 작성해보세요</li>
                  <li>리뷰 작성 경험을 쌓아보세요</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/experiences" 
                   style="background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;">
                  다른 체험단 보기
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 14px;">
                <p>이 이메일은 올띵버킷에서 자동으로 발송되었습니다.</p>
                <p>문의사항이 있으시면 <a href="mailto:support@allthingbucket.com" style="color: #667eea;">support@allthingbucket.com</a>으로 연락해주세요.</p>
              </div>
            </div>
          </div>
        `,
        text: `안녕하세요, ${data.userName}님!\n\n${data.campaignName} 체험단 신청 결과를 안내드립니다.\n\n선정되지 않았습니다.\n${data.reason || '다른 기회에 다시 신청해주세요.'}\n\n다른 체험단: ${baseUrl}/experiences\n\n문의: support@allthingbucket.com`
      }
      
    case 'withdrawal':
      return {
        subject: `💰 포인트 출금이 승인되었습니다!`,
        html: `
          <div style="font-family: 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
              <h1 style="color: white; margin: 0; font-size: 24px;">💰 출금 승인 완료!</h1>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin-bottom: 20px;">안녕하세요, ${data.userName}님!</h2>
              
              <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
                포인트 출금 요청이 승인되어 처리되었습니다.
              </p>
              
              <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
                <h3 style="color: #2e7d32; margin-top: 0;">💳 출금 정보</h3>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                  <span style="color: #666;">출금 금액:</span>
                  <span style="color: #2e7d32; font-size: 18px; font-weight: bold;">${data.amount.toLocaleString()}P</span>
                </div>
                <div style="display: flex; justify-content: space-between; align-items: center; margin: 10px 0;">
                  <span style="color: #666;">승인일:</span>
                  <span style="color: #2e7d32;">${currentDate}</span>
                </div>
              </div>
              
              <div style="background: #f0f8ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #2c5aa0; margin-top: 0;">📋 안내사항</h3>
                <ul style="color: #666; margin: 0; padding-left: 20px;">
                  <li>출금된 포인트는 등록하신 계좌로 입금됩니다</li>
                  <li>입금까지 1-2 영업일이 소요될 수 있습니다</li>
                  <li>문의사항이 있으시면 고객센터로 연락해주세요</li>
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${baseUrl}/points" 
                   style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                          color: white; 
                          padding: 12px 30px; 
                          text-decoration: none; 
                          border-radius: 25px; 
                          display: inline-block; 
                          font-weight: bold;">
                  포인트 내역 보기
                </a>
              </div>
              
              <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 14px;">
                <p>이 이메일은 올띵버킷에서 자동으로 발송되었습니다.</p>
                <p>문의사항이 있으시면 <a href="mailto:support@allthingbucket.com" style="color: #667eea;">support@allthingbucket.com</a>으로 연락해주세요.</p>
              </div>
            </div>
          </div>
        `,
        text: `안녕하세요, ${data.userName}님!\n\n포인트 출금 요청이 승인되어 처리되었습니다.\n\n출금 정보:\n- 출금 금액: ${data.amount.toLocaleString()}P\n- 승인일: ${currentDate}\n\n포인트 내역: ${baseUrl}/points\n\n문의: support@allthingbucket.com`
      }
      
    default:
      throw new Error(`Unknown email type: ${type}`)
  }
}

// 🔥 Supabase Edge Function을 통한 이메일 전송
export class EmailNotificationService {
  constructor() {
    // Supabase credentials will be used when real email sending is enabled
  }

  // 🔥 이메일 전송 (실제 전송)
  async sendEmail(emailData: EmailData): Promise<{ success: boolean; message: string }> {
    try {
      const template = createEmailTemplate(emailData.type, emailData.data)
      
      // 🔥 실제 이메일 전송 (Gmail SMTP 사용)
      const response = await fetch('/api/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: emailData.to,
          toName: emailData.toName,
          subject: template.subject,
          html: template.html,
          text: template.text,
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        console.error('❌ 이메일 전송 실패:', errorData)
        return {
          success: false,
          message: `이메일 전송 실패: ${response.status} ${response.statusText}`
        }
      }

      const result = await response.json()
      console.log('✅ 이메일 전송 성공:', result)
      
      return {
        success: true,
        message: `📧 ${emailData.toName}님에게 이메일을 전송했습니다.`
      }
    } catch (error) {
      console.error('❌ 이메일 전송 오류:', error)
      return {
        success: false,
        message: `이메일 전송 중 오류가 발생했습니다: ${error}`
      }
    }
  }

  // 🔥 승인 알림 이메일
  async sendApprovalEmail(userEmail: string, userName: string, campaignName: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: userEmail,
      toName: userName,
      type: 'approval',
      data: { campaignName, userName }
    })
  }

  // 🔥 거절 알림 이메일
  async sendRejectionEmail(userEmail: string, userName: string, campaignName: string, reason?: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: userEmail,
      toName: userName,
      type: 'rejection',
      data: { campaignName, userName, reason }
    })
  }

  // 🔥 출금 승인 이메일
  async sendWithdrawalApprovalEmail(userEmail: string, userName: string, amount: number): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: userEmail,
      toName: userName,
      type: 'withdrawal',
      data: { userName, amount }
    })
  }
}

// 🔥 싱글톤 인스턴스
export const emailNotificationService = new EmailNotificationService()

export default EmailNotificationService
