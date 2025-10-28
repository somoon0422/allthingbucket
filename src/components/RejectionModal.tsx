
import React, { useState } from 'react'
import {X, XCircle, AlertTriangle, Edit, Mail, MessageSquare} from 'lucide-react'
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
  }
}

interface RejectionModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onRejectionComplete: () => void
}

const RejectionModal: React.FC<RejectionModalProps> = ({
  isOpen,
  onClose,
  application,
  onRejectionComplete
}) => {
  const { sendMessage, loading } = useMessaging()
  
  // 🔥 완전히 안전한 데이터 추출
  const userName = SafeData.getString(application)
  const userEmail = SafeData.getEmail(application)
  const experienceName = SafeData.getExperienceName(application)
  
  const [rejectionReason, setRejectionReason] = useState('')
  const [emailContent, setEmailContent] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('rejection')
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'kakao' | 'both'>('email')
  
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
    'rejection': {
      subject: `{campaign_name} 신청 결과 안내`,
      content: `안녕하세요 {name}님.

{campaign_name} 신청에 대해 안내드립니다.

🚫 신청 반려 사유:
[반려사유가 여기에 입력됩니다]

📝 다음 기회에 더 좋은 조건으로 만나뵐 수 있기를 바라며, 앞으로도 올띵버킷 체험단에 많은 관심 부탁드립니다.

📅 검토일: {review_date}

📞 문의사항이 있으시면 고객센터로 연락주세요:
- 이메일: support@allthingbucket.com
- 전화: 01022129245

감사합니다.
올띵버킷 체험단 팀`
    },
    'simple': {
      subject: `{campaign_name} 리뷰 결과`,
      content: `안녕하세요 {name}님.

{campaign_name} 리뷰가 반려되었습니다.

반려사유: [반려사유가 여기에 입력됩니다]

다른 체험단에 참여해주시면 감사하겠습니다.

📞 문의사항: support@allthingbucket.com / 01022129245

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
      
      // 날짜 정보
      '{today}': todayStr,
      '{review_date}': todayStr,
      '{rejection_date}': todayStr,
      
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

  const handleReject = async () => {
    try {
      if (!rejectionReason.trim()) {
        toast.error('반려사유를 입력해주세요')
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
      const finalMessage = replaceVariables(emailContent).replace(
        '[반려사유가 여기에 입력됩니다]',
        rejectionReason
      )

      // 반려 안내 메일/SMS 발송
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

      // 발송 성공 시 반려 처리
      const hasSuccess = results.some(r => r.success)
      if (hasSuccess) {
        toast.success('반려 안내가 발송되었습니다')
        onRejectionComplete()
        onClose()
      } else {
        toast.error('발송에 실패했습니다. 다시 시도해주세요.')
      }

    } catch (error) {
      console.error('반려 처리 실패:', error)
      toast.error('반려 처리에 실패했습니다')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-red-600">🚫 체험단 신청 반려</h3>
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
            {/* 경고 메시지 */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-red-600 mr-2" />
                <span className="text-red-800 font-medium">신청을 반려하시겠습니까?</span>
              </div>
              <p className="text-red-700 text-sm mt-1">
                반려사유를 입력하고 사용자에게 안내 메일이 발송됩니다.
              </p>
            </div>

            {/* 반려사유 입력 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                반려사유 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="반려사유를 구체적으로 입력해주세요&#10;예시:&#10;- 신청 조건에 부합하지 않음&#10;- 필수 정보 누락&#10;- 기타 사유"
              />
            </div>

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
                      ? 'border-primary-500 bg-blue-50 text-primary-700'
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
                  <MessageSquare className="w-5 h-5 mx-auto mb-1" />
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
                      ? 'border-navy-500 bg-purple-50 text-navy-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-center space-x-1 mb-1">
                    <Mail className="w-4 h-4" />
                    <MessageSquare className="w-4 h-4" />
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
                  onClick={() => setSelectedTemplate('rejection')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'rejection'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  상세 반려 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('simple')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'simple'
                      ? 'border-orange-500 bg-orange-50 text-orange-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  간단 반려 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('custom')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'custom'
                      ? 'border-navy-500 bg-purple-50 text-navy-700'
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="이메일 제목을 입력하세요"
              />
            </div>

            {/* 메일 내용 */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  반려 안내 내용
                </label>
                <button
                  type="button"
                  onClick={() => setShowVariableHelp(!showVariableHelp)}
                  className="text-xs text-primary-600 hover:text-primary-800"
                >
                  {showVariableHelp ? '변수 도움말 숨기기' : '사용 가능한 변수 보기'}
                </button>
              </div>
              
              {showVariableHelp && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <h5 className="text-sm font-medium text-primary-800 mb-2">사용 가능한 변수:</h5>
                  <div className="grid grid-cols-2 gap-2 text-xs text-primary-700">
                    <div><code>{'{name}'}</code> - 수신자 이름</div>
                    <div><code>{'{email}'}</code> - 수신자 이메일</div>
                    <div><code>{'{phone}'}</code> - 수신자 휴대폰</div>
                    <div><code>{'{campaign_name}'}</code> - 체험단명</div>
                    <div><code>{'{review_date}'}</code> - 검토일</div>
                    <div><code>{'{team_name}'}</code> - 팀명</div>
                    <div><code>{'{today}'}</code> - 오늘 날짜</div>
                  </div>
                </div>
              )}
              
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
                placeholder="반려 안내 메일 내용을 작성하세요"
              />
              <p className="text-xs text-gray-500 mt-1">
                위 내용에서 [반려사유가 여기에 입력됩니다] 부분이 실제 반려사유로 교체됩니다
              </p>
            </div>

            {/* 🔥 수신자 정보 (직접 수정 가능) */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">수신자 정보</h4>
                <button
                  onClick={() => setEditingRecipient(!editingRecipient)}
                  className="text-primary-600 hover:text-primary-800 text-sm flex items-center"
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
                  {emailContent ? replaceVariables(emailContent).replace(
                    '[반려사유가 여기에 입력됩니다]',
                    rejectionReason || '[반려사유 입력 필요]'
                  ) : '메시지 내용이 없습니다'}
                </div>
              </div>
            </div>

            {/* 액션 버튼 */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    <span>반려 처리</span>
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

// 🔥 NAMED EXPORT 추가
export { RejectionModal }

// 🔥 DEFAULT EXPORT 추가
export default RejectionModal
