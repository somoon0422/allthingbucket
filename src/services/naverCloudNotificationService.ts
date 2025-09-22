// 네이버 클라우드 플랫폼 통합 알림 서비스
import { naverCloudEmailService } from './naverCloudEmailService'
import { naverCloudSmsService } from './naverCloudSmsService'
import { naverCloudAlimtalkService } from './naverCloudAlimtalkService'

export type NotificationChannel = 'email' | 'sms' | 'alimtalk' | 'all'

export interface NotificationResult {
  channel: NotificationChannel
  success: boolean
  message: string
  requestId?: string
}

export interface UserNotificationSettings {
  email: boolean
  sms: boolean
  alimtalk: boolean
  emailAddress?: string
  phoneNumber?: string
}

export class NaverCloudNotificationService {
  // 🔥 승인 알림 발송
  async sendApprovalNotification(
    userSettings: UserNotificationSettings,
    userName: string,
    campaignName: string,
    channels: readonly NotificationChannel[] = ['email']
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []

    for (const channel of channels) {
      try {
        let result: NotificationResult

        switch (channel) {
          case 'email':
            if (userSettings.email && userSettings.emailAddress) {
              const emailResult = await naverCloudEmailService.sendApprovalEmail(
                userSettings.emailAddress,
                userName,
                campaignName
              )
              result = {
                channel: 'email',
                success: emailResult.success,
                message: emailResult.message,
                requestId: (emailResult as any).requestId
              }
            } else {
              result = {
                channel: 'email',
                success: false,
                message: '이메일 설정이 없습니다.'
              }
            }
            break

          case 'sms':
            if (userSettings.sms && userSettings.phoneNumber) {
              const smsResult = await naverCloudSmsService.sendApprovalSms(
                userSettings.phoneNumber,
                userName,
                campaignName
              )
              result = {
                channel: 'sms',
                success: smsResult.success,
                message: smsResult.message,
                requestId: (smsResult as any).requestId
              }
            } else {
              result = {
                channel: 'sms',
                success: false,
                message: 'SMS 설정이 없습니다.'
              }
            }
            break

          case 'alimtalk':
            if (userSettings.alimtalk && userSettings.phoneNumber) {
              const alimtalkResult = await naverCloudAlimtalkService.sendApprovalAlimtalk(
                userSettings.phoneNumber,
                userName,
                campaignName
              )
              result = {
                channel: 'alimtalk',
                success: alimtalkResult.success,
                message: alimtalkResult.message,
                requestId: (alimtalkResult as any).requestId
              }
            } else {
              result = {
                channel: 'alimtalk',
                success: false,
                message: '알림톡 설정이 없습니다.'
              }
            }
            break

          case 'all':
            // 모든 채널로 발송
            const allResults = await this.sendApprovalNotification(
              userSettings,
              userName,
              campaignName,
              ['email', 'sms', 'alimtalk']
            )
            results.push(...allResults)
            continue

          default:
            result = {
              channel,
              success: false,
              message: '지원하지 않는 알림 채널입니다.'
            }
        }

        results.push(result)
      } catch (error) {
        results.push({
          channel,
          success: false,
          message: `알림 발송 중 오류가 발생했습니다: ${error}`
        })
      }
    }

    return results
  }

  // 🔥 거절 알림 발송
  async sendRejectionNotification(
    userSettings: UserNotificationSettings,
    userName: string,
    campaignName: string,
    reason?: string,
    channels: readonly NotificationChannel[] = ['email']
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []

    for (const channel of channels) {
      try {
        let result: NotificationResult

        switch (channel) {
          case 'email':
            if (userSettings.email && userSettings.emailAddress) {
              const emailResult = await naverCloudEmailService.sendRejectionEmail(
                userSettings.emailAddress,
                userName,
                campaignName,
                reason
              )
              result = {
                channel: 'email',
                success: emailResult.success,
                message: emailResult.message,
                requestId: (emailResult as any).requestId
              }
            } else {
              result = {
                channel: 'email',
                success: false,
                message: '이메일 설정이 없습니다.'
              }
            }
            break

          case 'sms':
            if (userSettings.sms && userSettings.phoneNumber) {
              const smsResult = await naverCloudSmsService.sendRejectionSms(
                userSettings.phoneNumber,
                userName,
                campaignName,
                reason
              )
              result = {
                channel: 'sms',
                success: smsResult.success,
                message: smsResult.message,
                requestId: (smsResult as any).requestId
              }
            } else {
              result = {
                channel: 'sms',
                success: false,
                message: 'SMS 설정이 없습니다.'
              }
            }
            break

          case 'alimtalk':
            if (userSettings.alimtalk && userSettings.phoneNumber) {
              const alimtalkResult = await naverCloudAlimtalkService.sendRejectionAlimtalk(
                userSettings.phoneNumber,
                userName,
                campaignName,
                reason
              )
              result = {
                channel: 'alimtalk',
                success: alimtalkResult.success,
                message: alimtalkResult.message,
                requestId: (alimtalkResult as any).requestId
              }
            } else {
              result = {
                channel: 'alimtalk',
                success: false,
                message: '알림톡 설정이 없습니다.'
              }
            }
            break

          case 'all':
            // 모든 채널로 발송
            const allResults = await this.sendRejectionNotification(
              userSettings,
              userName,
              campaignName,
              reason,
              ['email', 'sms', 'alimtalk']
            )
            results.push(...allResults)
            continue

          default:
            result = {
              channel,
              success: false,
              message: '지원하지 않는 알림 채널입니다.'
            }
        }

        results.push(result)
      } catch (error) {
        results.push({
          channel,
          success: false,
          message: `알림 발송 중 오류가 발생했습니다: ${error}`
        })
      }
    }

    return results
  }

  // 🔥 출금 승인 알림 발송
  async sendWithdrawalApprovalNotification(
    userSettings: UserNotificationSettings,
    userName: string,
    amount: number,
    channels: readonly NotificationChannel[] = ['email']
  ): Promise<NotificationResult[]> {
    const results: NotificationResult[] = []

    for (const channel of channels) {
      try {
        let result: NotificationResult

        switch (channel) {
          case 'email':
            if (userSettings.email && userSettings.emailAddress) {
              const emailResult = await naverCloudEmailService.sendWithdrawalApprovalEmail(
                userSettings.emailAddress,
                userName,
                amount
              )
              result = {
                channel: 'email',
                success: emailResult.success,
                message: emailResult.message,
                requestId: (emailResult as any).requestId
              }
            } else {
              result = {
                channel: 'email',
                success: false,
                message: '이메일 설정이 없습니다.'
              }
            }
            break

          case 'sms':
            if (userSettings.sms && userSettings.phoneNumber) {
              const smsResult = await naverCloudSmsService.sendWithdrawalApprovalSms(
                userSettings.phoneNumber,
                userName,
                amount
              )
              result = {
                channel: 'sms',
                success: smsResult.success,
                message: smsResult.message,
                requestId: (smsResult as any).requestId
              }
            } else {
              result = {
                channel: 'sms',
                success: false,
                message: 'SMS 설정이 없습니다.'
              }
            }
            break

          case 'alimtalk':
            if (userSettings.alimtalk && userSettings.phoneNumber) {
              const alimtalkResult = await naverCloudAlimtalkService.sendWithdrawalApprovalAlimtalk(
                userSettings.phoneNumber,
                userName,
                amount
              )
              result = {
                channel: 'alimtalk',
                success: alimtalkResult.success,
                message: alimtalkResult.message,
                requestId: (alimtalkResult as any).requestId
              }
            } else {
              result = {
                channel: 'alimtalk',
                success: false,
                message: '알림톡 설정이 없습니다.'
              }
            }
            break

          case 'all':
            // 모든 채널로 발송
            const allResults = await this.sendWithdrawalApprovalNotification(
              userSettings,
              userName,
              amount,
              ['email', 'sms', 'alimtalk']
            )
            results.push(...allResults)
            continue

          default:
            result = {
              channel,
              success: false,
              message: '지원하지 않는 알림 채널입니다.'
            }
        }

        results.push(result)
      } catch (error) {
        results.push({
          channel,
          success: false,
          message: `알림 발송 중 오류가 발생했습니다: ${error}`
        })
      }
    }

    return results
  }

  // 🔥 사용자 알림 설정 가져오기 (예시)
  async getUserNotificationSettings(_userId: string): Promise<UserNotificationSettings> {
    // 실제 구현에서는 데이터베이스에서 사용자 설정을 가져옴
    return {
      email: true,
      sms: true,
      alimtalk: true,
      emailAddress: 'user@example.com',
      phoneNumber: '01012345678'
    }
  }
}

// 🔥 싱글톤 인스턴스
export const naverCloudNotificationService = new NaverCloudNotificationService()

export default NaverCloudNotificationService
