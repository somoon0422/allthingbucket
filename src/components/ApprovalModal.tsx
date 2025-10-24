
import React, { useState } from 'react'
import { X, CheckCircle, Mail, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import { emailNotificationService } from '../services/emailNotificationService'

// 🔥 완전히 안전한 데이터 접근
const SafeData = {
  getString: (obj: any, fallback = '고객'): string => {
    try {
      if (!obj) return fallback
      if (typeof obj === 'string' && obj.trim()) return obj.trim()
      if (typeof obj === 'object' && obj !== null) {
        const nameFields = ['user_name', 'name', 'userName', 'display_name']
        for (const field of nameFields) {
          const value = obj[field]
          if (typeof value === 'string' && value.trim()) {
            return value.trim()
          }
        }
      }
      return fallback
    } catch {
      return fallback
    }
  },

  getEmail: (obj: any): string => {
    try {
      if (!obj) return ''
      const emailFields = ['user_email', 'email', 'userEmail']
      for (const field of emailFields) {
        const value = obj?.[field]
        if (typeof value === 'string' && value.includes('@')) {
          return value.trim()
        }
      }
      return ''
    } catch {
      return ''
    }
  },

  getExperienceName: (obj: any): string => {
    try {
      if (!obj) return '체험단'
      const nameFields = ['experience_name', 'experienceName', 'name', 'title']
      for (const field of nameFields) {
        const value = obj?.[field]
        if (typeof value === 'string' && value.trim()) {
          return value.trim()
        }
      }
      return '체험단'
    } catch {
      return '체험단'
    }
  },

  getBrandName: (obj: any): string => {
    try {
      if (!obj) return ''
      const brandFields = ['brand_name', 'brandName', 'company', 'brand']
      for (const field of brandFields) {
        const value = obj?.[field]
        if (typeof value === 'string' && value.trim()) {
          return value.trim()
        }
      }
      return ''
    } catch {
      return ''
    }
  },

  getNumber: (obj: any, field: string, fallback = 0): number => {
    try {
      if (!obj) return fallback

      // 여러 필드에서 숫자 찾기
      const fields = [field, 'rewards', 'reward_points', 'points']
      for (const f of fields) {
        const value = obj[f]
        if (value !== undefined && value !== null) {
          const num = Number(value)
          if (!isNaN(num) && num > 0) {
            return num
          }
        }
      }

      // campaignInfo에서도 찾기
      if (obj.campaignInfo) {
        for (const f of fields) {
          const value = obj.campaignInfo[f]
          if (value !== undefined && value !== null) {
            const num = Number(value)
            if (!isNaN(num) && num > 0) {
              return num
            }
          }
        }
      }

      // experience에서도 찾기
      if (obj.experience) {
        for (const f of fields) {
          const value = obj.experience[f]
          if (value !== undefined && value !== null) {
            const num = Number(value)
            if (!isNaN(num) && num > 0) {
              return num
            }
          }
        }
      }

      return fallback
    } catch {
      return fallback
    }
  },

  getPhone: (obj: any): string => {
    try {
      if (!obj) return ''
      const phoneFields = ['phone', 'user_phone', 'userPhone', 'contact_phone', 'contactPhone']
      for (const field of phoneFields) {
        const value = obj?.[field]
        if (typeof value === 'string' && value.trim()) {
          return value.trim()
        }
      }
      // user_profile이나 userProfile에서도 찾기
      if (obj.user_profile || obj.userProfile) {
        const profile = obj.user_profile || obj.userProfile
        for (const field of phoneFields) {
          const value = profile?.[field]
          if (typeof value === 'string' && value.trim()) {
            return value.trim()
          }
        }
      }
      return ''
    } catch {
      return ''
    }
  }
}

interface ApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onApprovalComplete: () => void
}

const ApprovalModal: React.FC<ApprovalModalProps> = ({
  isOpen,
  onClose,
  application,
  onApprovalComplete
}) => {
  const [loading, setLoading] = useState(false)
  const [emailLoading, setEmailLoading] = useState(false)

  // 🔥 완전히 안전한 데이터 추출
  const userName = SafeData.getString(application)
  const userPhone = SafeData.getPhone(application)
  const experienceName = SafeData.getExperienceName(application)
  const brandName = SafeData.getBrandName(application)
  const rewardPoints = SafeData.getNumber(application, 'reward_points', 0)

  // 📧 이메일 가이드 상태
  const [recipientEmail, setRecipientEmail] = useState(SafeData.getEmail(application))
  const [emailSubject, setEmailSubject] = useState(`[올띵버킷] ${experienceName} 체험 가이드 안내`)
  const [emailContent, setEmailContent] = useState(`안녕하세요, ${userName}님!

${experienceName} 체험단에 선정되신 것을 축하드립니다! 🎉

아래 체험 가이드를 확인하시고 진행해 주세요.

📦 체험 가이드
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. 제품 구매 or 배송 대기
   - 제품 구매형: 지정된 쇼핑몰에서 제품을 구매해 주세요
   - 제품 배송형: 입력하신 주소로 제품이 배송될 예정입니다

2. 체험 진행
   - 제품을 직접 사용해보시고 솔직한 경험을 기록해 주세요
   - 사진 촬영 (최소 3장 이상 권장)

3. 리뷰 작성 및 제출
   - 체험 후 마이페이지 > 내 신청 > 리뷰 작성 버튼 클릭
   - 블로그 링크, 사진, 체험 후기를 작성해 주세요

4. 리뷰 승인 후 포인트 지급
   - 리뷰 검수 완료 시 ${rewardPoints}P 지급
   - 포인트 출금 요청 가능

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

❓ 문의사항이 있으시면 언제든지 연락주세요!

감사합니다.
올띵버킷 드림`)

  // 🔥 상태에 따른 제목 결정
  const getModalTitle = () => {
    const status = application?.status
    if (status === 'point_completed') {
      return '💰 포인트 지급 완료'
    }
    if (status === 'point_requested') {
      return '💰 포인트 지급 승인'
    }
    if (status === 'review_in_progress' || status === 'review_resubmitted') {
      return '✨ 체험단 리뷰 승인'
    }
    return '✅ 체험단 신청 승인'
  }


  // 📧 이메일 가이드 발송
  const handleSendEmailGuide = async () => {
    if (!recipientEmail || !recipientEmail.trim()) {
      toast.error('수신자 이메일 주소를 입력해주세요')
      return
    }

    // 간단한 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(recipientEmail)) {
      toast.error('올바른 이메일 형식이 아닙니다')
      return
    }

    if (!emailContent.trim()) {
      toast.error('이메일 내용을 입력해주세요')
      return
    }

    setEmailLoading(true)
    try {
      const result = await emailNotificationService.sendEmail({
        to: recipientEmail,
        toName: userName,
        type: 'custom',
        data: {
          subject: emailSubject,
          content: emailContent
        }
      })

      if (result.success) {
        toast.success('이메일 가이드가 발송되었습니다')
      } else {
        toast.error(result.message || '이메일 발송에 실패했습니다')
      }
    } catch (error) {
      console.error('❌ 이메일 발송 실패:', error)
      toast.error('이메일 발송 중 오류가 발생했습니다')
    } finally {
      setEmailLoading(false)
    }
  }

  // 🔥 승인 처리 (알림톡은 AdminDashboard에서 자동 발송)
  const handleSendApproval = async () => {
    try {
      setLoading(true)

      // 모달을 닫고 승인 완료 콜백 실행
      // 실제 알림톡 발송은 AdminDashboard의 approval handler에서 처리됨
      onApprovalComplete()

      toast.success('승인 처리가 완료되었습니다')
    } catch (error) {
      console.error('❌ 승인 처리 실패:', error)
      toast.error('승인 처리 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className={`text-xl font-bold ${application?.status === 'point_completed' ? 'text-vintage-600' : 'text-green-600'}`}>
                {getModalTitle()}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {userName} - {experienceName}
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* 🔥 카카오 알림톡 자동 발송 안내 */}
            <div className="p-4 bg-gradient-to-r from-yellow-50 to-green-50 border-2 border-yellow-300 rounded-lg">
              <div className="flex items-start">
                <div className="text-2xl mr-3">💬</div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">카카오 알림톡 자동 발송</h4>
                  <p className="text-sm text-gray-700">
                    승인 시 네이버 클라우드 플랫폼에 등록된 템플릿으로 카카오톡 알림이 자동 발송됩니다.
                  </p>
                  <p className="text-xs text-gray-600 mt-2">
                    ✓ 수신자: {userName || '(이름 없음)'} ({userPhone || '휴대폰 없음'})
                  </p>
                </div>
              </div>
            </div>

            {/* 🔥 알림톡 템플릿 미리보기 */}
            <div className="bg-white border-2 border-gray-200 rounded-lg overflow-hidden">
              <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 px-4 py-3 flex items-center">
                <div className="text-2xl mr-2">💬</div>
                <div className="font-bold text-gray-900">알림톡 발송 내용 미리보기</div>
              </div>

              <div className="p-4 bg-gray-50">
                <div className="bg-white rounded-lg shadow-sm p-4 max-w-sm">
                  {/* 발신자 표시 */}
                  <div className="flex items-center mb-3 pb-3 border-b">
                    <div className="w-10 h-10 bg-yellow-400 rounded-full flex items-center justify-center mr-3">
                      <span className="text-lg">🎁</span>
                    </div>
                    <div>
                      <div className="font-bold text-sm">올띵버킷</div>
                      <div className="text-xs text-gray-500">카카오톡 알림</div>
                    </div>
                  </div>

                  {/* 알림톡 내용 */}
                  <div className="text-sm text-gray-800 space-y-2 whitespace-pre-wrap">
                    {application?.status === 'point_completed' ? (
                      // 포인트 지급 완료 템플릿 (REVIEWAPPROVEDPOINTSPAID)
                      <>
                        <p className="font-bold text-green-600">[올띵버킷] 리뷰 승인 완료 ✨</p>
                        <p>{userName}님, 리뷰가 승인되었습니다!</p>
                        <p className="pt-2">💰 포인트 지급 내역</p>
                        <p className="text-xs bg-gray-50 p-2 rounded">
                          - 캠페인: {experienceName}<br/>
                          - 지급 포인트: {rewardPoints}P<br/>
                          - 현재 잔액: {rewardPoints}P<br/>
                          - 지급일: {new Date().toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-xs text-gray-600 pt-2">
                          포인트가 지급되었습니다!<br/>
                          마이페이지에서 확인하세요.
                        </p>
                        <a
                          href="https://allthingbucket.com/points"
                          className="inline-block mt-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded text-xs font-medium"
                        >
                          포인트 확인하기
                        </a>
                      </>
                    ) : application?.status === 'review_in_progress' || application?.status === 'review_resubmitted' ? (
                      // 리뷰 승인 템플릿 (REVIEWAPPROVEDPOINTSPAID)
                      <>
                        <p className="font-bold text-green-600">[올띵버킷] 리뷰 승인 완료 ✨</p>
                        <p>{userName}님, 리뷰가 승인되었습니다!</p>
                        <p className="pt-2">💰 포인트 지급 내역</p>
                        <p className="text-xs bg-gray-50 p-2 rounded">
                          - 캠페인: {experienceName}<br/>
                          - 지급 포인트: {rewardPoints}P<br/>
                          - 현재 잔액: {rewardPoints}P<br/>
                          - 지급일: {new Date().toLocaleDateString('ko-KR')}
                        </p>
                        <p className="text-xs text-gray-600 pt-2">
                          포인트가 지급되었습니다!<br/>
                          마이페이지에서 확인하세요.
                        </p>
                        <a
                          href="https://allthingbucket.com/points"
                          className="inline-block mt-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded text-xs font-medium"
                        >
                          포인트 확인하기
                        </a>
                      </>
                    ) : (
                      // 체험단 선정 템플릿 (APPLICATIONAPPROVED)
                      <>
                        <p className="font-bold">[올띵버킷]</p>
                        <p>{userName}님, 축하드립니다! 🎉</p>
                        <p className="pt-2">{experienceName} 체험단에 선정되셨습니다!</p>
                        <p className="pt-2">📦 다음 단계</p>
                        <p className="text-xs bg-gray-50 p-2 rounded leading-relaxed">
                          1. 체험단 가이드 확인 (제품 구매 or 배송 대기)<br/>
                          2. 체험 진행 및 리뷰 작성<br/>
                          3. 리뷰 승인 후 포인트 지급 ({rewardPoints}P)<br/>
                          4. 포인트 출금 요청
                        </p>
                        <p className="text-xs text-gray-600 pt-2 leading-relaxed">
                          ⛳️ 체험단 상세 페이지에서 체험 가이드를 확인해 주세요.<br/>
                          혹은 이메일로 체험 가이드를 발송드렸으니 확인 후 진행해 주세요.
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          (*확인이 안 되실 경우 스팸함도 확인해 주세요.)
                        </p>
                        <a
                          href="https://allthingbucket.com/my-applications"
                          className="inline-block mt-2 px-3 py-1.5 bg-yellow-400 text-gray-900 rounded text-xs font-medium"
                        >
                          내 신청 확인하기
                        </a>
                      </>
                    )}
                  </div>
                </div>

                <div className="mt-3 text-xs text-gray-500 text-center">
                  ※ 실제 알림톡은 네이버 클라우드 플랫폼에 등록된 템플릿으로 발송됩니다
                </div>
              </div>
            </div>

            {/* 🔥 수신자 정보 확인 */}
            <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-3">📋 수신자 정보</h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="flex items-center">
                  <span className="font-medium w-20">이름:</span>
                  <span>{userName || '(이름 없음)'}</span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-20">휴대폰:</span>
                  <span className={userPhone ? 'text-green-600' : 'text-red-600'}>
                    {userPhone || '❌ 휴대폰 번호 없음 (알림톡 발송 불가)'}
                  </span>
                </div>
                <div className="flex items-center">
                  <span className="font-medium w-20">이메일:</span>
                  <span className="text-gray-500">{SafeData.getEmail(application) || '(이메일 없음)'}</span>
                </div>
              </div>
            </div>

            {/* 🔥 승인 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-blue-600 mr-2 text-xl">ℹ️</div>
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">승인 처리 안내</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    <li>승인 버튼 클릭 시 알림톡이 자동으로 발송됩니다</li>
                    <li>휴대폰 번호가 없는 경우 알림톡이 발송되지 않습니다</li>
                    <li>알림톡 발송 실패 시에도 승인 처리는 정상적으로 완료됩니다</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* 📧 이메일 체험 가이드 발송 */}
            {application?.status !== 'point_completed' && application?.status !== 'review_in_progress' && application?.status !== 'review_resubmitted' && (
              <div className="bg-white border-2 border-blue-300 rounded-lg overflow-hidden">
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-4 py-3 flex items-center">
                  <Mail className="w-5 h-5 text-white mr-2" />
                  <div className="font-bold text-white">체험 가이드 이메일 발송</div>
                </div>

                <div className="p-4 space-y-4">
                  {/* 이메일 제목 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      이메일 제목
                    </label>
                    <input
                      type="text"
                      value={emailSubject}
                      onChange={(e) => setEmailSubject(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="이메일 제목"
                    />
                  </div>

                  {/* 이메일 내용 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      체험 가이드 내용
                    </label>
                    <textarea
                      value={emailContent}
                      onChange={(e) => setEmailContent(e.target.value)}
                      rows={12}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                      placeholder="체험 가이드를 작성하세요..."
                    />
                  </div>

                  {/* 수신자 이메일 입력 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Mail className="w-4 h-4 inline mr-1" />
                      수신자 이메일
                    </label>
                    <input
                      type="email"
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="example@email.com"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      수신자: {userName}
                    </p>
                  </div>

                  {/* 발송 버튼 */}
                  <button
                    onClick={handleSendEmailGuide}
                    disabled={emailLoading || !recipientEmail || !recipientEmail.trim()}
                    className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center space-x-2 transition-colors"
                  >
                    {emailLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>발송 중...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>이메일 가이드 발송</span>
                      </>
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    💡 승인과 별개로 체험 가이드를 이메일로 발송할 수 있습니다
                  </p>
                </div>
              </div>
            )}

            {/* 액션 버튼 */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={handleSendApproval}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>승인하고 알림톡 발송</span>
                  </>
                )}
              </button>
              <button
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// 🚨 CRITICAL: Named export 추가
export { ApprovalModal }

// 🚨 CRITICAL: Default export 추가  
export default ApprovalModal
