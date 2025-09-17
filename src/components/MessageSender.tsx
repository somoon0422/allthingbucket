
import React, { useState, useEffect } from 'react'
import {X, Send, Mail, MessageSquare, User, Edit} from 'lucide-react'
import toast from 'react-hot-toast'

interface MessageSenderProps {
  recipient: {
    name?: string
    email?: string
    phone?: string
    user_code?: string
    user_id?: string
  }
  onSend: (message: string, subject?: string, sendType?: 'email' | 'sms' | 'kakao' | 'both') => Promise<void>
  onClose: () => void
}

const MessageSender: React.FC<MessageSenderProps> = ({
  recipient,
  onSend,
  onClose
}) => {
  // 🔥 수신자 정보 상태 (직접 수정 가능)
  const [editableRecipient, setEditableRecipient] = useState({
    name: recipient?.name || '',
    email: recipient?.email || '',
    phone: recipient?.phone || '',
    user_code: recipient?.user_code || ''
  })
  
  // 메시지 상태
  const [message, setMessage] = useState('')
  const [emailSubject, setEmailSubject] = useState('')
  const [sendMethod, setSendMethod] = useState<'email' | 'sms' | 'kakao' | 'both'>('email')
  const [sending, setSending] = useState(false)
  
  // 이메일 템플릿
  const [selectedTemplate, setSelectedTemplate] = useState('')
  
  // 수신자 정보 편집 모드
  const [editingRecipient, setEditingRecipient] = useState(false)

  // 🔥 이메일 템플릿 목록
  const emailTemplates = {
    'approval': {
      subject: '체험단 신청 승인 안내',
      content: `안녕하세요, {name}님!

축하드립니다! 신청하신 체험단이 승인되었습니다.

체험단명: {campaign_name}
승인일: {approval_date}

체험 진행에 대한 자세한 안내는 추후 별도로 연락드리겠습니다.

📞 문의사항: support@allthingbucket.com / 01022129245

감사합니다.`
    },
    'rejection': {
      subject: '체험단 신청 결과 안내',
      content: `안녕하세요, {name}님!

신청해주신 체험단에 대해 검토한 결과, 이번에는 선정되지 않았습니다.

체험단명: {campaign_name}
검토일: {review_date}

앞으로 더 좋은 기회로 찾아뵙겠습니다.

📞 문의사항: support@allthingbucket.com / 01022129245

감사합니다.`
    },
    'reminder': {
      subject: '체험단 후기 제출 안내',
      content: `안녕하세요, {name}님!

체험단 참여해주셔서 감사합니다.

체험단명: {campaign_name}
후기 제출 마감일: {deadline}

후기 제출을 잊지 마시고, 마감일 전에 제출해주시기 바랍니다.

📞 문의사항: support@allthingbucket.com / 01022129245

감사합니다.`
    },
    'custom': {
      subject: '',
      content: ''
    }
  }

  // 🔥 초기값 설정
  useEffect(() => {
    setEditableRecipient({
      name: recipient?.name || '',
      email: recipient?.email || '',
      phone: recipient?.phone || '',
      user_code: recipient?.user_code || ''
    })
  }, [recipient])

  // 수신자 정보 업데이트
  const handleRecipientChange = (field: string, value: string) => {
    setEditableRecipient(prev => ({
      ...prev,
      [field]: value
    }))
  }

  // 🔥 템플릿 선택 처리
  const handleTemplateSelect = (templateKey: string) => {
    setSelectedTemplate(templateKey)
    if (templateKey !== 'custom') {
      const template = emailTemplates[templateKey as keyof typeof emailTemplates]
      setEmailSubject(template.subject)
      setMessage(template.content)
    } else {
      setEmailSubject('')
      setMessage('')
    }
  }

  // 🔥 변수 치환 함수
  const replaceVariables = (text: string) => {
    const today = new Date().toLocaleDateString('ko-KR')
    return text
      .replace(/{name}/g, editableRecipient.name || '고객')
      .replace(/{email}/g, editableRecipient.email || '')
      .replace(/{phone}/g, editableRecipient.phone || '')
      .replace(/{approval_date}/g, today)
      .replace(/{review_date}/g, today)
      .replace(/{deadline}/g, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ko-KR'))
      .replace(/{campaign_name}/g, '체험단명')
  }

  // 발송 처리
  const handleSend = async () => {
    try {
      // 유효성 검사
      if (!message.trim()) {
        toast.error('메시지 내용을 입력해주세요')
        return
      }

      if (!editableRecipient.name.trim()) {
        toast.error('수신자 이름을 입력해주세요')
        return
      }

      if (sendMethod === 'email' || sendMethod === 'both') {
        if (!editableRecipient.email.trim() || !editableRecipient.email.includes('@')) {
          toast.error('올바른 이메일 주소를 입력해주세요')
          return
        }
        if (!emailSubject.trim()) {
          toast.error('이메일 제목을 입력해주세요')
          return
        }
      }

      if (sendMethod === 'sms' || sendMethod === 'kakao' || sendMethod === 'both') {
        if (!editableRecipient.phone.trim()) {
          toast.error('휴대폰번호를 입력해주세요')
          return
        }
      }

      setSending(true)

      console.log('🔄 메시지 발송 시작:', {
        recipient: editableRecipient,
        method: sendMethod,
        subject: emailSubject,
        messageLength: message.length
      })

      // 변수 치환된 메시지와 제목 준비
      const finalSubject = replaceVariables(emailSubject)
      const finalMessage = replaceVariables(message)

      // 부모 컴포넌트의 onSend 함수 호출 (제목, 내용, 발송방식을 함께 전달)
      await onSend(finalMessage, finalSubject, sendMethod)

      // 발송 완료 처리
      console.log('✅ 메시지 발송 완료')
      
      // 🔥 토스트 메시지는 부모 컴포넌트(AdminDashboard)에서 처리하므로 여기서는 제거
      // 모달 닫기
      onClose()

    } catch (error) {
      console.error('❌ 메시지 발송 실패:', error)
      toast.error('메시지 발송에 실패했습니다')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-bold">안내 메시지 발송</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={sending}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* 🔥 수신자 정보 (직접 수정 가능) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold flex items-center">
                <User className="w-5 h-5 mr-2" />
                수신자 정보
              </h4>
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
                    onChange={(e) => handleRecipientChange('phone', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="010-1234-5678"
                  />
                </div>
                {editableRecipient.user_code && (
                  <div>
                    <label className="block text-sm font-medium mb-1">회원코드</label>
                    <input
                      type="text"
                      value={editableRecipient.user_code}
                      onChange={(e) => handleRecipientChange('user_code', e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg"
                      placeholder="회원코드"
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2">
                <div><span className="font-medium">이름:</span> {editableRecipient.name || '이름 없음'}</div>
                <div><span className="font-medium">이메일:</span> {editableRecipient.email || '이메일 없음'}</div>
                <div><span className="font-medium">휴대폰:</span> {editableRecipient.phone || '번호 없음'}</div>
                {editableRecipient.user_code && (
                  <div><span className="font-medium">회원코드:</span> {editableRecipient.user_code}</div>
                )}
              </div>
            )}
          </div>

          {/* 발송 방식 선택 */}
          <div>
            <label className="block text-sm font-medium mb-3">발송 방식 선택</label>
            <div className="mb-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-sm text-yellow-800">
                <strong>⚠️ 주의:</strong> 이메일은 웹사이트에 로그인한 사용자에게만 발송 가능합니다. 
                로그인하지 않은 사용자에게는 SMS나 카카오 알림톡을 사용해주세요.
              </p>
            </div>
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
                    ? 'border-purple-500 bg-purple-50 text-purple-700'
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
          {sendMethod === 'email' || sendMethod === 'both' ? (
            <div>
              <label className="block text-sm font-medium mb-3">이메일 템플릿</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => handleTemplateSelect('approval')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'approval'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  승인 안내
                </button>
                <button
                  onClick={() => handleTemplateSelect('rejection')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'rejection'
                      ? 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  반려 안내
                </button>
                <button
                  onClick={() => handleTemplateSelect('reminder')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'reminder'
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  후기 제출 안내
                </button>
                <button
                  onClick={() => handleTemplateSelect('custom')}
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
          ) : null}

          {/* 🔥 이메일 제목 */}
          {sendMethod === 'email' || sendMethod === 'both' ? (
            <div>
              <label className="block text-sm font-medium mb-2">이메일 제목 *</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="이메일 제목을 입력하세요"
              />
            </div>
          ) : null}

          {/* 메시지 내용 */}
          <div>
            <label className="block text-sm font-medium mb-2">메시지 내용</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={12}
              className="w-full px-3 py-2 border rounded-lg resize-none"
              placeholder="발송할 메시지를 입력하세요..."
            />
            <div className="text-xs text-gray-500 mt-1">
              {message.length}자 / 권장: 500자 이내
            </div>
          </div>

          {/* 미리보기 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium mb-2">발송 미리보기</h5>
            <div className="text-sm text-gray-700 space-y-1">
              <div><strong>수신자:</strong> {editableRecipient.name} ({editableRecipient.email})</div>
              <div><strong>발송방식:</strong> {
                sendMethod === 'email' ? '이메일' : 
                sendMethod === 'sms' ? 'SMS' : 
                sendMethod === 'kakao' ? '카카오 알림톡' :
                '이메일 + SMS'
              }</div>
              {(sendMethod === 'email' || sendMethod === 'both') && emailSubject && (
                <div><strong>이메일 제목:</strong> {replaceVariables(emailSubject)}</div>
              )}
              <div><strong>메시지:</strong></div>
              <div className="bg-white p-2 rounded border max-h-32 overflow-y-auto whitespace-pre-wrap">
                {message ? replaceVariables(message) : '메시지 내용이 없습니다'}
              </div>
            </div>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={sending}
            className="px-4 py-2 text-gray-600 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !message.trim() || !editableRecipient.name.trim() || 
              ((sendMethod === 'email' || sendMethod === 'both') && !emailSubject.trim())}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center space-x-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>발송 중...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>발송하기</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}

// 🔥 NAMED EXPORT
export { MessageSender }

// 🔥 DEFAULT EXPORT
export default MessageSender
