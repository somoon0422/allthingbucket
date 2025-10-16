import React, { useState } from 'react'
import {X, Gift} from 'lucide-react'
import toast from 'react-hot-toast'

interface PointsApprovalModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onApprovalComplete: () => void
}

const PointsApprovalModal: React.FC<PointsApprovalModalProps> = ({
  isOpen,
  onClose,
  application,
  onApprovalComplete
}) => {
  const [loading, setLoading] = useState(false)
  
  // 안전한 데이터 추출
  const userName = application?.name || application?.user_name || '고객'
  const userEmail = application?.email || application?.user_email || ''
  const campaignName = application?.campaign_name || application?.experience_name || '체험단'
  const rewardPoints = application?.campaignInfo?.rewards || application?.experience?.rewards || application?.rewards || 0
  
  const [emailContent, setEmailContent] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedTemplate, setSelectedTemplate] = useState('points_approval')
  
  // 수신자 정보 상태
  const [editableRecipient, setEditableRecipient] = useState({
    name: userName,
    email: userEmail,
    phone: application?.phone || application?.user_phone || ''
  })
  
  // 수신자 정보 편집 모드
  const [editingRecipient, setEditingRecipient] = useState(false)
  
  // 포인트 지급 템플릿
  const emailTemplates = {
    'points_approval': {
      subject: `💰 {campaign_name} 포인트 지급 완료 안내`,
      content: `안녕하세요 {name}님!

💰 축하드립니다! {campaign_name} 리뷰 포인트가 지급되었습니다.

📋 포인트 지급 안내:
- 체험단: {campaign_name}
- 지급 포인트: {reward_points}P
- 지급일: {approval_date}

🎉 포인트 사용 안내:
지급된 포인트는 마이페이지에서 확인하실 수 있으며, 다양한 혜택에 사용하실 수 있습니다.

📝 포인트 사용 방법:
1. 마이페이지 → 포인트 관리로 이동
2. 사용 가능한 포인트 확인
3. 원하는 혜택에 포인트 사용

📞 문의사항이 있으시면 고객센터로 연락주세요:
- 이메일: support@allthingbucket.com
- 전화: 01022129245

앞으로도 올띵버킷 체험단에 많은 관심 부탁드립니다.

감사합니다.
올띵버킷 체험단 팀`
    },
    'simple': {
      subject: `✅ {campaign_name} 포인트 지급 완료`,
      content: `안녕하세요 {name}님!

{campaign_name} 리뷰 포인트 {reward_points}P가 지급되었습니다.

마이페이지에서 확인하실 수 있습니다.

📞 문의사항: support@allthingbucket.com / 01022129245

감사합니다.
올띵버킷 체험단 팀`
    }
  }

  // 초기 템플릿 설정
  React.useEffect(() => {
    if (selectedTemplate && emailTemplates[selectedTemplate as keyof typeof emailTemplates]) {
      const template = emailTemplates[selectedTemplate as keyof typeof emailTemplates]
      setSubject(template.subject)
      setEmailContent(template.content)
    }
  }, [selectedTemplate, campaignName])

  // 수신자 정보 업데이트
  const handleRecipientChange = (field: string, value: string) => {
    setEditableRecipient(prev => ({
      ...prev,
      [field]: value
    }))
  }


  const handlePointsApproval = async () => {
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

      // 포인트 지급 처리
      setLoading(true)
      
      // 실제 포인트 지급 로직은 AdminDashboard에서 처리됨
      // 여기서는 모달만 닫고 상위 컴포넌트에서 처리하도록 함
      
      onApprovalComplete()
      onClose()

    } catch (error) {
      console.error('포인트 지급 실패:', error)
      toast.error('포인트 지급에 실패했습니다')
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-xl font-bold text-green-600">💰 포인트 지급 승인</h3>
              <p className="text-sm text-gray-500 mt-1">
                {userName} - {campaignName} ({rewardPoints}P)
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
            {/* 포인트 지급 안내 */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <Gift className="w-5 h-5 text-green-600 mr-2" />
                <span className="text-green-800 font-medium">포인트 지급 승인</span>
              </div>
              <p className="text-green-700 text-sm mt-1">
                리뷰 검수가 완료되어 {rewardPoints}P를 지급합니다.
              </p>
            </div>

            {/* 이메일 템플릿 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                이메일 템플릿
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSelectedTemplate('points_approval')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'points_approval'
                      ? 'border-green-500 bg-green-50 text-green-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  상세 포인트 지급 안내
                </button>
                <button
                  onClick={() => setSelectedTemplate('simple')}
                  className={`p-2 rounded-lg border text-sm transition-colors ${
                    selectedTemplate === 'simple'
                      ? 'border-vintage-500 bg-blue-50 text-vintage-700'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                  }`}
                >
                  간단 포인트 지급 안내
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                포인트 지급 안내 내용
              </label>
              <textarea
                value={emailContent}
                onChange={(e) => setEmailContent(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none"
                placeholder="포인트 지급 안내 메일 내용을 작성하세요"
              />
            </div>

            {/* 수신자 정보 */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium">수신자 정보</h4>
                <button
                  onClick={() => setEditingRecipient(!editingRecipient)}
                  className="text-vintage-600 hover:text-vintage-800 text-sm"
                >
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
                </div>
              ) : (
                <div className="text-sm text-gray-600 space-y-1">
                  <div>이름: {editableRecipient.name || '이름 없음'}</div>
                  <div>이메일: {editableRecipient.email || '이메일 없음'}</div>
                </div>
              )}
            </div>

            {/* 액션 버튼 */}
            <div className="flex space-x-3 pt-4 border-t">
              <button
                onClick={handlePointsApproval}
                disabled={loading || !emailContent.trim()}
                className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>처리 중...</span>
                  </>
                ) : (
                  <>
                    <Gift className="w-4 h-4" />
                    <span>포인트 지급 승인</span>
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

export default PointsApprovalModal
