
import React, { useState } from 'react'
import {X, Mail, MessageCircleDashed as MessageCircle, CheckCircle, Edit} from 'lucide-react'
import { useMessaging } from '../hooks/useMessaging'
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
  const { sendMessage, loading } = useMessaging()
  
  // 🔥 완전히 안전한 데이터 추출
  const userName = SafeData.getString(application)
  const userEmail = SafeData.getEmail(application)
  const experienceName = SafeData.getExperienceName(application)
  const brandName = SafeData.getBrandName(application)
  const rewardPoints = SafeData.getNumber(application, 'reward_points', 0)
  
  const [emailContent, setEmailContent] = useState('')
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'kakao' | 'both'>('email')
  const [subject, setSubject] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('approval')
  
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
- 전화: 02-1234-5678

감사합니다.
올띵버킷 체험단 팀`
    },
    'simple': {
      subject: `✅ {campaign_name} 체험단 선정`,
      content: `안녕하세요 {name}님!

{campaign_name} 체험단에 선정되었습니다!

체험 진행 및 리뷰 작성에 대한 자세한 안내는 추후 별도로 연락드리겠습니다.

리뷰 작성 완료 후 포인트 지급 요청을 해주세요.

📞 문의사항: support@allthingbucket.com / 02-1234-5678

감사합니다.
올띵버킷 체험단 팀`
    },
    'custom': {
      subject: '',
      content: ''
    }
  }

  // 🔥 초기 템플릿 설정
  React.useEffect(() => {
    if (selectedTemplate && emailTemplates[selectedTemplate as keyof typeof emailTemplates]) {
      const template = emailTemplates[selectedTemplate as keyof typeof emailTemplates]
      setSubject(template.subject)
      setEmailContent(template.content)
    }
  }, [selectedTemplate, experienceName])

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
      if (!emailContent.trim()) {
        toast.error('메일 내용을 입력해주세요')
        return
      }

      if (!editableRecipient.email) {
        toast.error('수신자 이메일이 없습니다')
        return
      }

      if (!editableRecipient.name.trim()) {
        toast.error('수신자 이름을 입력해주세요')
        return
      }

      // 발송 방식별 유효성 검사
      if (sendMethod === 'email' || sendMethod === 'both') {
        if (!editableRecipient.email.trim() || !editableRecipient.email.includes('@')) {
          toast.error('올바른 이메일 주소를 입력해주세요')
          return
        }
      }

      if (sendMethod === 'sms' || sendMethod === 'kakao' || sendMethod === 'both') {
        if (!editableRecipient.phone.trim()) {
          toast.error('휴대폰번호를 입력해주세요')
          return
        }
      }

      // 변수 치환된 메시지와 제목 준비
      const finalSubject = replaceVariables(subject)
      const finalMessage = replaceVariables(emailContent)

      // 메일/카톡 발송
      console.log('🚀 이메일 발송 시작:', {
        to: editableRecipient.email,
        subject: finalSubject,
        message: finalMessage,
        type: sendMethod,
        userInfo: {
          name: editableRecipient.name,
          email: editableRecipient.email,
          phone: editableRecipient.phone
        }
      })
      
      const results = await sendMessage({
        to: editableRecipient.email,
        subject: finalSubject,
        message: finalMessage,
        type: sendMethod,
        userInfo: {
          name: editableRecipient.name,
          email: editableRecipient.email,
          phone: editableRecipient.phone
        }
      })
      
      console.log('📧 이메일 발송 결과:', results)
      
      // 결과 확인 및 사용자 피드백
      if (results && results.length > 0) {
        const successCount = results.filter((r: any) => r.success).length
        const totalCount = results.length
        
        if (successCount === totalCount) {
          toast.success(`모든 메시지가 성공적으로 발송되었습니다! (${successCount}/${totalCount})`)
        } else if (successCount > 0) {
          toast.success(`일부 메시지가 발송되었습니다. (${successCount}/${totalCount})`)
        } else {
          toast.error('메시지 발송에 실패했습니다. 다시 시도해주세요.')
        }
      } else {
        toast.error('메시지 발송 결과를 받을 수 없습니다.')
      }

      // 발송 성공 시 상태 변경
      const hasSuccess = results.some(r => r.success)
      if (hasSuccess) {
        toast.success('승인 안내가 발송되었습니다!')
        onApprovalComplete()
        onClose()
      } else {
        toast.error('발송에 실패했습니다. 다시 시도해주세요.')
      }

    } catch (error) {
      console.error('승인 발송 실패:', error)
      toast.error('승인 처리에 실패했습니다')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-green-600">✅ 체험단 신청 승인</h3>
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
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Mail className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">이메일</div>
                </button>
                
                <button
                  onClick={() => setSendMethod('sms')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'sms'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <MessageCircle className="w-5 h-5 mx-auto mb-1" />
                  <div className="text-sm font-medium">SMS</div>
                </button>
                
                <button
                  onClick={() => setSendMethod('kakao')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'kakao'
                      ? 'border-yellow-500 bg-yellow-50 text-yellow-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="text-lg mb-1">💬</div>
                  <div className="text-sm font-medium">카카오 알림톡</div>
                </button>
                
                <button
                  onClick={() => setSendMethod('both')}
                  className={`p-3 rounded-lg border-2 transition-colors ${
                    sendMethod === 'both'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-center space-x-1 mb-1">
                    <Mail className="w-4 h-4" />
                    <MessageCircle className="w-4 h-4" />
                  </div>
                  <div className="text-sm font-medium">둘 다</div>
                </button>
              </div>
            </div>

            {/* 🔥 이메일 템플릿 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                이메일 템플릿
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setSelectedTemplate('approval')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'approval'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  상세 승인 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('simple')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'simple'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  간단 승인 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('custom')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'custom'
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
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
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showVariableHelp ? '변수 도움말 숨기기' : '사용 가능한 변수 보기'}
                </button>
              </div>
              
              {showVariableHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <h5 className="text-sm font-medium text-blue-800 mb-2">사용 가능한 변수:</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
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
                  className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
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
                    <label className="block text-sm font-medium mb-1">휴대폰번호</label>
                    <input
                      type="tel"
                      value={editableRecipient.phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="010-1234-5678"
                      maxLength={13}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      숫자만 입력하면 자동으로 대시(-)가 추가됩니다
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
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">발송 미리보기</h4>
              <div className="text-sm text-gray-700 space-y-1">
                <div><strong>수신자:</strong> {editableRecipient.name} ({editableRecipient.email})</div>
                <div><strong>발송방식:</strong> {
                  sendMethod === 'email' ? '이메일' : 
                  sendMethod === 'kakao' ? 'SMS' : 
                  '이메일 + SMS'
                }</div>
                <div><strong>이메일 제목:</strong> {replaceVariables(subject)}</div>
                <div><strong>메시지:</strong></div>
                <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                  {emailContent ? replaceVariables(emailContent) : '메시지 내용이 없습니다'}
                </div>
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
