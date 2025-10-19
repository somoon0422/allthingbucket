
import React, { useState, useEffect } from 'react'
import {X, Mail, CheckCircle, Edit} from 'lucide-react'
import { emailNotificationService } from '../services/emailNotificationService'
import { alimtalkService } from '../services/alimtalkService'
import { campaignService } from '../services/campaignService'
import toast from 'react-hot-toast'

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
  
  // 🔥 완전히 안전한 데이터 추출
  const userName = SafeData.getString(application)
  const userEmail = SafeData.getEmail(application)
  const experienceName = SafeData.getExperienceName(application)
  const brandName = SafeData.getBrandName(application)
  const rewardPoints = SafeData.getNumber(application, 'reward_points', 0)
  
  // 🔥 상태에 따른 제목과 템플릿 결정
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
  
  const getDefaultTemplate = () => {
    const status = application?.status
    if (status === 'point_completed') {
      return 'point_completed'
    }
    return 'approval'
  }
  
  const [emailContent, setEmailContent] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState(getDefaultTemplate())
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'alimtalk' | 'all'>('email')
  
  // 🔥 수신자 정보 상태 (직접 수정 가능)
  const [editableRecipient, setEditableRecipient] = useState({
    name: userName,
    email: userEmail,
    phone: application?.user_phone || application?.phone || ''
  })
  
  // 수신자 정보 편집 모드
  const [editingRecipient, setEditingRecipient] = useState(false)
  
  // 변수 도움말 표시 상태
  const [showVariableHelp, setShowVariableHelp] = useState(false)

  // 캠페인 정보 상태
  const [campaignInfo, setCampaignInfo] = useState<any>(null)

  // 🔥 캠페인 정보 로드 및 커스텀 승인 안내 내용 적용
  useEffect(() => {
    const loadCampaignInfo = async () => {
      try {
        const campaignId = application?.campaign_id || application?.experience_id
        if (!campaignId) return

        const campaign = await campaignService.getCampaignById(campaignId)
        setCampaignInfo(campaign)

        // 캠페인에 저장된 커스텀 승인 안내가 있으면 적용
        if (campaign.approval_email_subject || campaign.approval_email_content) {
          const customSubject = campaign.approval_email_subject || subject
          const customContent = campaign.approval_email_content || emailContent

          // 변수 치환
          const replacedSubject = replaceVariables(customSubject)
          const replacedContent = replaceVariables(customContent)

          setSubject(replacedSubject)
          setEmailContent(replacedContent)
        }
      } catch (error) {
        console.error('캠페인 정보 로드 실패:', error)
      }
    }

    if (isOpen && application) {
      loadCampaignInfo()
    }
  }, [isOpen, application])

  // 🔥 이메일 템플릿
  const emailTemplates = {
    'approval': {
      subject: `🎉 {campaign_name} 체험단 선정 안내`,
      content: `안녕하세요 {name}님!

🎉 축하드립니다! {campaign_name} 체험단에 선정되었습니다!

📋 체험단 선정 안내:
- 체험단: {campaign_name}
- 브랜드: {brand_name}
- 리워드: {reward_points}P
- 선정일: {approval_date}

🎁 체험 진행 안내:
1. 체험 제품이 발송됩니다 (배송형인 경우)
2. 체험 기간 동안 제품을 사용해보세요
3. 체험 완료 후 리뷰를 작성해주세요

💰 포인트 지급 안내:
리뷰 작성 및 검수 완료 후 {reward_points}P가 지급됩니다.
포인트 지급을 원하시면 "내 신청" 페이지에서 "포인트 지급 요청" 버튼을 클릭해주세요.

📝 다음 단계:
1. 체험 제품 수령 및 체험 진행
2. 리뷰 작성 및 제출
3. 관리자 리뷰 검수 대기
4. 검수 완료 후 "포인트 지급 요청" 버튼 클릭
5. 관리자 최종 승인 후 포인트 지급

📞 문의사항이 있으시면 고객센터로 연락주세요:
- 이메일: support@allthingbucket.com
- 전화: 01022129245

감사합니다.
올띵버킷 체험단 팀`
    },
    'simple': {
      subject: `✅ {campaign_name} 체험단 선정`,
      content: `안녕하세요 {name}님!

{campaign_name} 체험단에 선정되었습니다!

체험 진행 및 리뷰 작성에 대한 자세한 안내는 추후 별도로 연락드리겠습니다.

리뷰 작성 완료 후 포인트 지급 요청을 해주세요.

📞 문의사항: support@allthingbucket.com / 01022129245

감사합니다.
올띵버킷 체험단 팀`
    },
    'point_requested': {
      subject: `💰 {campaign_name} 포인트 지급 승인 안내`,
      content: `안녕하세요 {name}님!

💰 포인트 지급 요청이 승인되었습니다!

📋 포인트 지급 승인 안내:
- 체험단: {campaign_name}
- 브랜드: {brand_name}
- 지급 포인트: {reward_points}P
- 승인일: {approval_date}

🎉 리뷰 검수 완료:
{name}님의 {campaign_name} 리뷰가 성공적으로 검수 완료되었습니다.
포인트 지급 요청이 승인되어 곧 포인트가 지급됩니다.

💳 포인트 지급:
- 지급 예정 포인트: {reward_points}P
- 지급 완료 후 "포인트" 탭에서 확인 가능
- 포인트 출금은 1,000P 이상부터 가능

📝 포인트 사용 안내:
- 포인트 내역: 포인트 탭에서 상세 내역 확인 가능
- 출금 요청: 1,000P 이상 시 출금 신청 가능
- 포인트 유효기간: 영구 유효

📞 문의사항이 있으시면 고객센터로 연락주세요:
- 이메일: support@allthingbucket.com
- 전화: 01022129245

감사합니다.
올띵버킷 팀`
    },
    'point_completed': {
      subject: `💰 {campaign_name} 포인트 지급 완료 안내`,
      content: `안녕하세요 {name}님!

💰 포인트 지급이 완료되었습니다!

📋 포인트 지급 안내:
- 체험단: {campaign_name}
- 브랜드: {brand_name}
- 지급 포인트: {reward_points}P
- 지급일: {approval_date}

🎉 체험단 참여 완료:
{name}님의 {campaign_name} 체험단 참여가 성공적으로 완료되었습니다.
리뷰 작성과 포인트 지급까지 모든 과정이 완료되었습니다.

💳 포인트 확인:
지급된 포인트는 "포인트" 탭에서 확인하실 수 있습니다.
- 현재 잔액: {reward_points}P
- 총 적립 포인트: 누적 포인트에서 확인 가능

🔄 포인트 사용:
- 포인트 출금: 1,000P 이상부터 출금 가능
- 포인트 내역: 포인트 탭에서 상세 내역 확인 가능

📝 다음 체험단 참여:
더 많은 체험단에 참여하여 포인트를 적립해보세요!
새로운 체험단이 업로드되면 알림을 받으실 수 있습니다.

📞 문의사항이 있으시면 고객센터로 연락주세요:
- 이메일: support@allthingbucket.com
- 전화: 01022129245

감사합니다.
올띵버킷 팀`
    },
    'review_approval': {
      subject: `✨ {campaign_name} 리뷰 승인 완료!`,
      content: `안녕하세요 {name}님!

✨ {campaign_name} 리뷰가 승인되었습니다!

📋 리뷰 승인 안내:
- 체험단: {campaign_name}
- 브랜드: {brand_name}
- 리워드: {reward_points}P
- 승인일: {approval_date}

🎉 리뷰 검수 완료:
{name}님께서 작성해주신 {campaign_name} 리뷰가 성공적으로 검수되었습니다.
정성스러운 리뷰 작성 감사드립니다!

💰 다음 단계 - 포인트 지급 요청:
리뷰 승인이 완료되었으니 이제 포인트 지급을 요청하실 수 있습니다.

📝 포인트 지급 요청 방법:
1. 올띵버킷 사이트 접속
2. "내 신청" 페이지로 이동
3. 해당 캠페인에서 "포인트 지급 요청" 버튼 클릭
4. 관리자 승인 후 포인트 지급 완료

💳 포인트 안내:
- 지급 예정 포인트: {reward_points}P
- 포인트 출금: 1,000P 이상부터 가능
- 포인트 유효기간: 영구 유효

📞 문의사항이 있으시면 고객센터로 연락주세요:
- 이메일: support@allthingbucket.com
- 전화: 01022129245

감사합니다.
올띵버킷 팀`
    },
    'custom': {
      subject: '',
      content: ''
    }
  }

  // 🔥 초기 템플릿 설정
  React.useEffect(() => {
    // status에 따라 자동으로 템플릿 선택
    let templateKey = selectedTemplate
    if (application?.status === 'point_requested') {
      templateKey = 'point_requested'
    } else if (application?.status === 'point_completed') {
      templateKey = 'point_completed'
    } else if (application?.status === 'review_in_progress' || application?.status === 'review_resubmitted') {
      templateKey = 'review_approval'
    } else if (application?.status === 'approved') {
      templateKey = 'approval'
    }

    if (templateKey && emailTemplates[templateKey as keyof typeof emailTemplates]) {
      const template = emailTemplates[templateKey as keyof typeof emailTemplates]
      setSubject(template.subject)
      setEmailContent(template.content)
      setSelectedTemplate(templateKey)
    }
  }, [selectedTemplate, experienceName, application?.status])

  // 🔥 수신자 정보 업데이트
  const handleRecipientChange = (field: string, value: string) => {
    setEditableRecipient(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 🔥 휴대폰 번호 포맷팅 함수
  const formatPhoneNumber = (value: string) => {
    // 숫자만 추출
    const numbers = value.replace(/\D/g, '')
    
    // 11자리 제한
    const limitedNumbers = numbers.slice(0, 11)
    
    // 자동 대시 추가
    if (limitedNumbers.length <= 3) {
      return limitedNumbers
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`
    }
  }

  // 🔥 휴대폰 번호 변경 처리
  const handlePhoneChange = (value: string) => {
    const formatted = formatPhoneNumber(value)
    handleRecipientChange('phone', formatted)
  }

  // 🔥 스마트 변수 치환 함수
  const replaceVariables = (text: string) => {
    const today = new Date()
    const todayStr = today.toLocaleDateString('ko-KR')
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextWeekStr = nextWeek.toLocaleDateString('ko-KR')
    
    // 🔥 자동 변수 매핑
    const variables = {
      // 수신자 정보
      '{name}': editableRecipient.name || '고객',
      '{user_name}': editableRecipient.name || '고객',
      '{recipient_name}': editableRecipient.name || '고객',
      '{email}': editableRecipient.email || '',
      '{phone}': editableRecipient.phone || '',
      '{user_phone}': editableRecipient.phone || '',
      
      // 체험단/캠페인 정보
      '{experience_name}': experienceName,
      '{campaign_name}': experienceName,
      '{experience_title}': experienceName,
      '{brand_name}': brandName,
      '{company_name}': brandName,
      '{reward_points}': rewardPoints.toString(),
      '{points}': rewardPoints.toString(),
      
      // 날짜 정보
      '{today}': todayStr,
      '{approval_date}': todayStr,
      '{review_date}': todayStr,
      '{deadline}': nextWeekStr,
      '{submission_deadline}': nextWeekStr,
      
      // 기타
      '{admin_name}': '올띵버킷 체험단 팀',
      '{team_name}': '올띵버킷 체험단 팀'
    }
    
    // 모든 변수를 한 번에 치환
    let result = text
    Object.entries(variables).forEach(([variable, value]) => {
      result = result.replace(new RegExp(variable.replace(/[{}]/g, '\\$&'), 'g'), value)
    })
    
    return result
  }

  const handleSendApproval = async () => {
    try {
      setLoading(true)

      // 🔥 기본 정보 검증
      if (!editableRecipient.name.trim()) {
        toast.error('수신자 이름을 입력해주세요')
        setLoading(false)
        return
      }

      // 🔥 발송 방식별 필수 정보 검증
      if (sendMethod === 'email' || sendMethod === 'all') {
        if (!editableRecipient.email.trim() || !editableRecipient.email.includes('@')) {
          toast.error('올바른 이메일 주소를 입력해주세요')
          setLoading(false)
          return
        }
      }

      if (sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all') {
        if (!editableRecipient.phone.trim()) {
          toast.error('휴대폰번호를 입력해주세요 (SMS/카카오 알림톡 발송에 필요)')
          setLoading(false)
          return
        }

        // 휴대폰번호 형식 검증
        const phoneDigits = editableRecipient.phone.replace(/[^0-9]/g, '')
        if (phoneDigits.length !== 11 || !phoneDigits.startsWith('01')) {
          toast.error('올바른 휴대폰번호 형식을 입력해주세요 (예: 010-1234-5678)')
          setLoading(false)
          return
        }
      }

      // 🔥 변수 치환된 제목과 내용
      const replacedSubject = replaceVariables(subject)
      const replacedContent = replaceVariables(emailContent)

      let successCount = 0
      let failCount = 0

      // 🔥 이메일 발송
      if (sendMethod === 'email' || sendMethod === 'all') {
        console.log('📧 이메일 발송 시작:', {
          to: editableRecipient.email,
          toName: editableRecipient.name,
          campaignName: experienceName
        })

        const result = await emailNotificationService.sendEmail({
          to: editableRecipient.email,
          toName: editableRecipient.name,
          type: 'custom',
          data: {
            subject: replacedSubject,
            content: replacedContent
          }
        })

        console.log('📧 이메일 발송 결과:', result)

        if (result.success) {
          successCount++
          toast.success('이메일이 발송되었습니다')
        } else {
          failCount++
          toast.error(`이메일 발송 실패: ${result.message}`)
        }
      }

      // 🔥 카카오 알림톡 발송
      if (sendMethod === 'alimtalk' || sendMethod === 'all') {
        console.log('💬 알림톡 발송 시작:', {
          phone: editableRecipient.phone,
          name: editableRecipient.name,
          campaignName: experienceName
        })

        const result = await alimtalkService.sendApprovalAlimtalk(
          editableRecipient.phone,
          editableRecipient.name,
          experienceName
        )

        console.log('💬 알림톡 발송 결과:', result)

        if (result.success) {
          successCount++
          toast.success('알림톡이 발송되었습니다')
        } else {
          failCount++
          toast.warning(`알림톡 발송 실패: ${result.message}`)
        }
      }

      // 최종 결과 확인
      if (successCount > 0) {
        toast.success(`${editableRecipient.name}님에게 승인 안내가 전송되었습니다 (성공: ${successCount}, 실패: ${failCount})`)
        onApprovalComplete()
      } else {
        toast.error('모든 알림 발송에 실패했습니다')
      }

    } catch (error) {
      console.error('❌ 승인 발송 실패:', error)
      toast.error('승인 발송 중 오류가 발생했습니다.')
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
            {/* 🔥 발송 방식 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                발송 방식 선택
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSendMethod('email')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'email'
                      ? 'border-vintage-500 bg-blue-50 text-vintage-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Mail className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">이메일</div>
                  <div className="text-xs text-gray-500 mt-1">이메일 필요</div>
                </button>

                <button
                  onClick={() => setSendMethod('sms')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'sms'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">📱</div>
                  <div className="text-sm font-medium">SMS</div>
                  <div className="text-xs text-gray-500 mt-1">휴대폰번호 필요</div>
                </button>

                <button
                  onClick={() => setSendMethod('alimtalk')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'alimtalk'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">💬</div>
                  <div className="text-sm font-medium">카카오 알림톡</div>
                  <div className="text-xs text-gray-500 mt-1">휴대폰번호 필요</div>
                </button>

                <button
                  onClick={() => setSendMethod('all')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'all'
                      ? 'border-navy-500 bg-purple-50 text-navy-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-center space-x-1 mb-1">
                    <Mail className="w-4 h-4" />
                    <div className="text-sm">📱</div>
                    <div className="text-sm">💬</div>
                  </div>
                  <div className="text-sm font-medium">모두</div>
                  <div className="text-xs text-gray-500 mt-1">전체 정보 필요</div>
                </button>
              </div>

              {/* 발송 방식별 안내 메시지 */}
              {(sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all') && !editableRecipient.phone && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="text-yellow-600 mr-2">⚠️</div>
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">휴대폰번호가 필요합니다</p>
                      <p className="mt-1">아래 "수신자 정보" 섹션에서 휴대폰번호를 입력해주세요.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* 🔥 이메일 템플릿 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                이메일 템플릿
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedTemplate('approval')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'approval'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  신청 승인 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('simple')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'simple'
                      ? 'border-vintage-500 bg-blue-50 text-vintage-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  간단 승인 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('review_approval')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'review_approval'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  리뷰 승인 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('point_completed')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'point_completed'
                      ? 'border-navy-500 bg-purple-50 text-navy-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  포인트 지급 완료
                </button>
                <button
                  onClick={() => setSelectedTemplate('custom')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'custom'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  직접 작성
                </button>
              </div>
            </div>

            {/* 이메일 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 제목
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="이메일 제목을 입력하세요"
              />
            </div>

            {/* 메일 내용 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  승인 안내 내용
                </label>
                <button
                  type="button"
                  onClick={() => setShowVariableHelp(!showVariableHelp)}
                  className="text-xs text-vintage-600 hover:text-vintage-800"
                >
                  {showVariableHelp ? '변수 도움말 숨기기' : '사용 가능한 변수 보기'}
                </button>
              </div>
              
              {showVariableHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <h5 className="text-sm font-medium text-vintage-800 mb-2">사용 가능한 변수:</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs text-vintage-700">
                    <div><code>{'{name}'}</code> - 수신자 이름</div>
                    <div><code>{'{email}'}</code> - 수신자 이메일</div>
                    <div><code>{'{phone}'}</code> - 수신자 휴대폰</div>
                    <div><code>{'{campaign_name}'}</code> - 체험단명</div>
                    <div><code>{'{brand_name}'}</code> - 브랜드명</div>
                    <div><code>{'{reward_points}'}</code> - 리워드 포인트</div>
                    <div><code>{'{approval_date}'}</code> - 승인일</div>
                    <div><code>{'{deadline}'}</code> - 후기 제출 마감일</div>
                    <div><code>{'{team_name}'}</code> - 팀명</div>
                    <div><code>{'{today}'}</code> - 오늘 날짜</div>
                  </div>
                </div>
              )}
              
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={12}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="승인 안내 메일 내용을 작성하세요"
              />
              <p className="text-xs text-gray-500 mt-1">
                체험 방법, 리뷰 작성 안내, 포인트 지급 조건 등을 포함해주세요
              </p>
            </div>

            {/* 🔥 수신자 정보 (직접 수정 가능) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">수신자 정보</h4>
                <button
                  onClick={() => setEditingRecipient(!editingRecipient)}
                  className="text-vintage-600 hover:text-vintage-800 text-sm flex items-center"
                >
                  <Edit className="w-4 h-4 mr-1" />
                  {editingRecipient ? '완료' : '수정'}
                </button>
              </div>

              {editingRecipient ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-1">이름 *</label>
                    <input
                      type="text"
                      value={editableRecipient.name}
                      onChange={(e) => handleRecipientChange('name', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="수신자 이름"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">이메일 *</label>
                    <input
                      type="email"
                      value={editableRecipient.email}
                      onChange={(e) => handleRecipientChange('email', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      휴대폰번호
                      {(sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all') && (
                        <span className="text-red-500 ml-1">* (필수)</span>
                      )}
                    </label>
                    <input
                      type="tel"
                      value={editableRecipient.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className={`w-full px-3 py-2 border rounded-lg ${
                        (sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all') && !editableRecipient.phone
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-500'
                          : ''
                      }`}
                      placeholder="010-1234-5678"
                      maxLength={13}
                      required={(sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all')}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {(sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all')
                        ? 'SMS/카카오 알림톡 발송에 필요합니다'
                        : '숫자만 입력하면 자동으로 대시(-)가 추가됩니다'
                      }
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>이름: {editableRecipient.name || '이름 없음'}</div>
                  <div>이메일: {editableRecipient.email || '이메일 없음'}</div>
                  <div>연락처: {editableRecipient.phone || '번호 없음'}</div>
                </div>
              )}
            </div>

            {/* 🔥 미리보기 */}
            <div className="bg-gradient-to-br from-vintage-50 to-navy-50 rounded-lg p-4 border border-blue-200">
              <h4 className="font-medium mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-vintage-600" />
                발송 미리보기
              </h4>
              <div className="text-sm text-gray-700 space-y-2">
                <div className="bg-white p-3 rounded-lg">
                  <div className="font-medium text-vintage-900 mb-2">📋 발송 정보</div>
                  <div className="space-y-1 text-sm">
                    <div><strong>수신자:</strong> {editableRecipient.name || '(이름 없음)'}</div>
                    <div><strong>발송방식:</strong> {
                      sendMethod === 'email' ? '📧 이메일' :
                      sendMethod === 'sms' ? '📱 SMS' :
                      sendMethod === 'alimtalk' ? '💬 카카오 알림톡' :
                      '📧📱💬 모든 방식'
                    }</div>
                    {(sendMethod === 'email' || sendMethod === 'all') && (
                      <div className={editableRecipient.email ? '' : 'text-red-600'}>
                        <strong>이메일:</strong> {editableRecipient.email || '❌ 이메일 없음'}
                      </div>
                    )}
                    {(sendMethod === 'sms' || sendMethod === 'alimtalk' || sendMethod === 'all') && (
                      <div className={editableRecipient.phone ? '' : 'text-red-600'}>
                        <strong>휴대폰:</strong> {editableRecipient.phone || '❌ 휴대폰번호 없음'}
                      </div>
                    )}
                  </div>
                </div>

                {(sendMethod === 'email' || sendMethod === 'all') && (
                  <div className="bg-white p-3 rounded-lg">
                    <div className="font-medium text-vintage-900 mb-2">📧 이메일 내용</div>
                    <div><strong>제목:</strong> {replaceVariables(subject)}</div>
                    <div className="mt-2"><strong>내용:</strong></div>
                    <div className="bg-gray-50 p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap text-xs">
                      {emailContent ? replaceVariables(emailContent) : '메시지 내용이 없습니다'}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={handleSendApproval}
                disabled={loading || !emailContent.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>발송 중...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    <span>승인 안내 발송</span>
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
