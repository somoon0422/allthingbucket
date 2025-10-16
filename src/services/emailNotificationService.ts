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
  type: 'approval' | 'rejection' | 'withdrawal' | 'review_approval' | 'review_rejection' | 'custom'
  data: any
}

// 🔥 이메일 템플릿 생성
const createEmailTemplate = (type: 'approval' | 'rejection' | 'withdrawal' | 'review_approval' | 'review_rejection' | 'custom', data: any): EmailTemplate => {
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

    case 'review_approval':
      return {
        subject: `✨ ${data.userName}님의 리뷰가 승인되었습니다! - ${data.campaignName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Malgun Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- 헤더 -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">✨</div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">리뷰 승인 완료!</h1>
                        <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px;">Review Approved</p>
                      </td>
                    </tr>

                    <!-- 본문 -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">안녕하세요, ${data.userName}님! 👋</h2>

                        <p style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0; font-size: 16px;">
                          <strong style="color: #10b981;">${data.campaignName}</strong> 캠페인에 제출하신 리뷰가 승인되었습니다!
                        </p>

                        <!-- 승인 카드 -->
                        <div style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); padding: 24px; border-radius: 12px; margin: 30px 0; border: 2px solid #10b981;">
                          <div style="display: flex; align-items: center; margin-bottom: 12px;">
                            <span style="font-size: 32px; margin-right: 12px;">🎉</span>
                            <h3 style="color: #065f46; margin: 0; font-size: 20px; font-weight: 700;">축하합니다!</h3>
                          </div>
                          <p style="color: #047857; margin: 0; line-height: 1.6; font-size: 15px;">
                            정성스럽게 작성해주신 리뷰가 검토를 통과했습니다.<br>
                            진심 어린 리뷰 작성에 감사드립니다! 💚
                          </p>
                        </div>

                        <!-- 진행 상태 -->
                        <div style="background: #f9fafb; padding: 20px; border-radius: 10px; margin: 30px 0;">
                          <h4 style="color: #374151; margin: 0 0 16px 0; font-size: 16px; font-weight: 600;">📊 현재 진행 상태</h4>
                          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                            <div style="flex: 1; text-align: center; padding: 10px;">
                              <div style="color: #10b981; font-size: 24px; margin-bottom: 4px;">✓</div>
                              <div style="color: #6b7280; font-size: 12px;">신청 승인</div>
                            </div>
                            <div style="flex: 1; text-align: center; padding: 10px;">
                              <div style="color: #10b981; font-size: 24px; margin-bottom: 4px;">✓</div>
                              <div style="color: #6b7280; font-size: 12px;">리뷰 제출</div>
                            </div>
                            <div style="flex: 1; text-align: center; padding: 10px;">
                              <div style="color: #10b981; font-size: 24px; margin-bottom: 4px; font-weight: bold;">✓</div>
                              <div style="color: #10b981; font-size: 12px; font-weight: 600;">리뷰 승인</div>
                            </div>
                            <div style="flex: 1; text-align: center; padding: 10px;">
                              <div style="color: #d1d5db; font-size: 24px; margin-bottom: 4px;">○</div>
                              <div style="color: #9ca3af; font-size: 12px;">리워드 지급</div>
                            </div>
                          </div>
                        </div>

                        <!-- 다음 단계 -->
                        <div style="background: #eff6ff; padding: 24px; border-radius: 10px; margin: 30px 0; border-left: 4px solid #3b82f6;">
                          <h4 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">🎯 다음 단계</h4>
                          <ul style="color: #1e40af; margin: 0; padding-left: 24px; line-height: 2;">
                            <li style="margin-bottom: 8px;"><strong>리워드 지급 요청</strong> - 마이페이지에서 포인트 지급을 요청해주세요</li>
                            <li style="margin-bottom: 8px;"><strong>신청 현황 확인</strong> - 실시간으로 진행 상황을 확인하세요</li>
                            <li><strong>새로운 캠페인</strong> - 다른 체험단 캠페인에도 참여해보세요</li>
                          </ul>
                        </div>

                        <!-- CTA 버튼 -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                          <tr>
                            <td align="center">
                              <a href="${baseUrl}/my-applications" style="display: inline-block; background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3); transition: all 0.3s;">
                                💰 포인트 지급 요청하기
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- 추가 정보 -->
                        <div style="background: #fef3c7; padding: 16px; border-radius: 8px; margin: 30px 0;">
                          <p style="color: #92400e; margin: 0; font-size: 14px; line-height: 1.6;">
                            💡 <strong>알아두세요!</strong><br>
                            리워드는 포인트 지급 요청 후 영업일 기준 1-3일 이내에 지급됩니다.
                          </p>
                        </div>
                      </td>
                    </tr>

                    <!-- 푸터 -->
                    <tr>
                      <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">올띵버킷과 함께해주셔서 감사합니다</p>
                        <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                          문의: <a href="mailto:support@allthingbucket.com" style="color: #10b981; text-decoration: none;">support@allthingbucket.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `✨ 리뷰 승인 완료!\n\n안녕하세요, ${data.userName}님!\n\n${data.campaignName} 캠페인에 제출하신 리뷰가 승인되었습니다!\n\n🎉 축하합니다!\n정성스럽게 작성해주신 리뷰가 검토를 통과했습니다.\n진심 어린 리뷰 작성에 감사드립니다!\n\n📊 현재 진행 상태\n✓ 신청 승인 → ✓ 리뷰 제출 → ✓ 리뷰 승인 → ○ 리워드 지급\n\n🎯 다음 단계:\n- 리워드 지급 요청: 마이페이지에서 포인트 지급을 요청해주세요\n- 신청 현황 확인: 실시간으로 진행 상황을 확인하세요\n- 새로운 캠페인: 다른 체험단 캠페인에도 참여해보세요\n\n💡 알아두세요!\n리워드는 포인트 지급 요청 후 영업일 기준 1-3일 이내에 지급됩니다.\n\n👉 포인트 지급 요청하기: ${baseUrl}/my-applications\n\n문의: support@allthingbucket.com`
      }

    case 'review_rejection':
      return {
        subject: `💬 ${data.userName}님, 리뷰 보완이 필요합니다 - ${data.campaignName}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: 'Malgun Gothic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
              <tr>
                <td align="center">
                  <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

                    <!-- 헤더 -->
                    <tr>
                      <td style="background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); padding: 40px 30px; text-align: center;">
                        <div style="font-size: 48px; margin-bottom: 10px;">📝</div>
                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.5px;">리뷰 보완 요청</h1>
                        <p style="color: rgba(255, 255, 255, 0.95); margin: 10px 0 0 0; font-size: 16px;">Review Feedback</p>
                      </td>
                    </tr>

                    <!-- 본문 -->
                    <tr>
                      <td style="padding: 40px 30px;">
                        <h2 style="color: #111827; margin: 0 0 20px 0; font-size: 22px; font-weight: 600;">안녕하세요, ${data.userName}님! 👋</h2>

                        <p style="color: #4b5563; line-height: 1.8; margin: 0 0 30px 0; font-size: 16px;">
                          <strong style="color: #f97316;">${data.campaignName}</strong> 캠페인에 제출하신 리뷰에 대한 검토 의견을 전달드립니다.
                        </p>

                        <!-- 안내 메시지 -->
                        <div style="background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%); padding: 20px; border-radius: 12px; margin: 30px 0; border: 2px solid #f59e0b;">
                          <div style="display: flex; align-items: start;">
                            <span style="font-size: 24px; margin-right: 12px;">💡</span>
                            <div>
                              <h3 style="color: #92400e; margin: 0 0 8px 0; font-size: 18px; font-weight: 700;">걱정하지 마세요!</h3>
                              <p style="color: #92400e; margin: 0; line-height: 1.6; font-size: 15px;">
                                리뷰 수정은 여러 번 가능합니다.<br>
                                아래 의견을 참고하여 보완해주시면 됩니다. 🙂
                              </p>
                            </div>
                          </div>
                        </div>

                        <!-- 검토 의견 -->
                        <div style="background: #fef2f2; padding: 24px; border-radius: 12px; margin: 30px 0; border-left: 4px solid #ef4444;">
                          <h4 style="color: #991b1b; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">📋 검토 의견</h4>
                          <div style="background: #ffffff; padding: 16px; border-radius: 8px; border: 1px solid #fecaca;">
                            <p style="color: #991b1b; margin: 0; white-space: pre-wrap; line-height: 1.8; font-size: 15px;">
                              ${data.rejectionReason || '리뷰 내용을 보완해주세요.'}
                            </p>
                          </div>
                        </div>

                        <!-- 수정 가이드 -->
                        <div style="background: #eff6ff; padding: 24px; border-radius: 10px; margin: 30px 0;">
                          <h4 style="color: #1e40af; margin: 0 0 16px 0; font-size: 18px; font-weight: 600;">✏️ 리뷰 수정 가이드</h4>
                          <div style="color: #1e3a8a;">
                            <div style="display: flex; align-items: start; margin-bottom: 12px; padding: 12px; background: white; border-radius: 8px;">
                              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px; font-size: 18px;">1</span>
                              <div style="flex: 1;">
                                <strong style="color: #1e40af;">검토 의견 확인</strong>
                                <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">위 의견을 꼼꼼히 확인해주세요</p>
                              </div>
                            </div>
                            <div style="display: flex; align-items: start; margin-bottom: 12px; padding: 12px; background: white; border-radius: 8px;">
                              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px; font-size: 18px;">2</span>
                              <div style="flex: 1;">
                                <strong style="color: #1e40af;">리뷰 수정</strong>
                                <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">마이페이지에서 "리뷰 수정하기" 버튼 클릭</p>
                              </div>
                            </div>
                            <div style="display: flex; align-items: start; padding: 12px; background: white; border-radius: 8px;">
                              <span style="color: #3b82f6; font-weight: bold; margin-right: 12px; font-size: 18px;">3</span>
                              <div style="flex: 1;">
                                <strong style="color: #1e40af;">재제출</strong>
                                <p style="margin: 4px 0 0 0; color: #4b5563; font-size: 14px;">수정 완료 후 재제출하면 즉시 재검토됩니다</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        <!-- CTA 버튼 -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin: 40px 0;">
                          <tr>
                            <td align="center">
                              <a href="${baseUrl}/my-applications" style="display: inline-block; background: linear-gradient(135deg, #f97316 0%, #ea580c 100%); color: #ffffff; padding: 16px 40px; text-decoration: none; border-radius: 50px; font-weight: 700; font-size: 16px; box-shadow: 0 4px 12px rgba(249, 115, 22, 0.3);">
                                ✏️ 리뷰 수정하러 가기
                              </a>
                            </td>
                          </tr>
                        </table>

                        <!-- 도움말 -->
                        <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #86efac;">
                          <div style="display: flex; align-items: start;">
                            <span style="font-size: 24px; margin-right: 12px;">💬</span>
                            <div>
                              <h4 style="color: #166534; margin: 0 0 8px 0; font-size: 16px; font-weight: 600;">궁금한 점이 있으신가요?</h4>
                              <p style="color: #166534; margin: 0; font-size: 14px; line-height: 1.6;">
                                리뷰 작성이 어렵거나 의견이 불분명하시다면<br>
                                언제든 문의해주세요. 친절히 도와드리겠습니다!
                              </p>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>

                    <!-- 푸터 -->
                    <tr>
                      <td style="background: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
                        <p style="color: #6b7280; margin: 0 0 8px 0; font-size: 14px;">올띵버킷과 함께해주셔서 감사합니다</p>
                        <p style="color: #9ca3af; margin: 0; font-size: 13px;">
                          문의: <a href="mailto:support@allthingbucket.com" style="color: #f97316; text-decoration: none;">support@allthingbucket.com</a>
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
          </html>
        `,
        text: `📝 리뷰 보완 요청\n\n안녕하세요, ${data.userName}님!\n\n${data.campaignName} 캠페인에 제출하신 리뷰에 대한 검토 의견을 전달드립니다.\n\n💡 걱정하지 마세요!\n리뷰 수정은 여러 번 가능합니다.\n아래 의견을 참고하여 보완해주시면 됩니다.\n\n📋 검토 의견:\n${data.rejectionReason || '리뷰 내용을 보완해주세요.'}\n\n✏️ 리뷰 수정 가이드:\n1. 검토 의견 확인 - 위 의견을 꼼꼼히 확인해주세요\n2. 리뷰 수정 - 마이페이지에서 "리뷰 수정하기" 버튼 클릭\n3. 재제출 - 수정 완료 후 재제출하면 즉시 재검토됩니다\n\n💬 궁금한 점이 있으신가요?\n리뷰 작성이 어렵거나 의견이 불분명하시다면 언제든 문의해주세요.\n친절히 도와드리겠습니다!\n\n👉 리뷰 수정하기: ${baseUrl}/my-applications\n\n문의: support@allthingbucket.com`
      }

    case 'custom':
      // 커스텀 이메일 - data.subject와 data.content를 직접 사용
      return {
        subject: data.subject || '알림',
        html: `
          <div style="font-family: 'Malgun Gothic', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f8f9fa;">
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
              <div style="white-space: pre-wrap; color: #333; line-height: 1.6;">${data.content || ''}</div>
            </div>
            <div style="border-top: 1px solid #eee; padding-top: 20px; margin-top: 30px; text-align: center; color: #999; font-size: 14px;">
              <p>이 이메일은 올띵버킷에서 발송되었습니다.</p>
              <p>문의사항이 있으시면 <a href="mailto:support@allthingbucket.com" style="color: #667eea;">support@allthingbucket.com</a>으로 연락해주세요.</p>
            </div>
          </div>
        `,
        text: data.content || ''
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

      // API URL 결정 (환경에 따라 다름)
      // 프로덕션: 상대 경로 사용 (Vercel이 자동 처리)
      // 개발: 배포된 프로덕션 API 사용 또는 환경 변수 사용
      const isDev = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
      const apiUrl = isDev
        ? import.meta.env.VITE_API_URL || 'https://allthingbucket.vercel.app'
        : ''
      const emailApiUrl = `${apiUrl}/api/send-email`

      console.log('📧 Gmail 이메일 발송 요청:', {
        to: emailData.to,
        toName: emailData.toName,
        subject: template.subject,
        apiUrl: emailApiUrl
      })

      // 🔥 실제 이메일 전송 (Gmail SMTP 사용)
      const response = await fetch(emailApiUrl, {
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

  // 🔥 리뷰 승인 이메일
  async sendReviewApprovalEmail(userEmail: string, userName: string, campaignName: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: userEmail,
      toName: userName,
      type: 'review_approval',
      data: { userName, campaignName }
    })
  }

  // 🔥 리뷰 반려 이메일
  async sendReviewRejectionEmail(userEmail: string, userName: string, campaignName: string, rejectionReason: string): Promise<{ success: boolean; message: string }> {
    return this.sendEmail({
      to: userEmail,
      toName: userName,
      type: 'review_rejection',
      data: { userName, campaignName, rejectionReason }
    })
  }
}

// 🔥 싱글톤 인스턴스
export const emailNotificationService = new EmailNotificationService()

export default EmailNotificationService
