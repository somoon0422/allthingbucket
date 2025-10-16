import React from 'react'
import { AlertCircle, X, CheckCircle2, User, Phone, Instagram } from 'lucide-react'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  missingFields: string[]
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose, missingFields }) => {
  if (!isOpen) return null

  // 필드명을 한글로 변환
  const getFieldLabel = (field: string) => {
    const labels: Record<string, { label: string, icon: React.ReactNode }> = {
      'name': { label: '실명', icon: <User className="w-4 h-4" /> },
      'phone': { label: '전화번호', icon: <Phone className="w-4 h-4" /> },
      'sns': { label: 'SNS 계정 (최소 1개)', icon: <Instagram className="w-4 h-4" /> }
    }
    return labels[field] || { label: field, icon: <AlertCircle className="w-4 h-4" /> }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-60 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-4">
              <AlertCircle className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              프로필 정보가 부족합니다
            </h2>
            <p className="text-gray-600">
              캠페인 신청을 위해 아래 정보를 입력해주세요
            </p>
          </div>

          {/* 미완성 필드 목록 */}
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-6">
            <h3 className="text-sm font-semibold text-red-900 mb-3 flex items-center">
              <AlertCircle className="w-4 h-4 mr-2" />
              입력이 필요한 정보
            </h3>
            <ul className="space-y-2">
              {missingFields.map((field) => {
                const { label, icon } = getFieldLabel(field)
                return (
                  <li key={field} className="flex items-center space-x-2 text-sm text-red-800 bg-white bg-opacity-60 px-3 py-2 rounded-lg">
                    <div className="text-red-600">{icon}</div>
                    <span className="font-medium">{label}</span>
                    <span className="ml-auto text-xs text-red-600">미입력</span>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-vintage-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-vintage-900">
                <p className="font-medium mb-1">정보 입력 후 바로 이용 가능</p>
                <p className="text-xs text-vintage-700">
                  입력하신 정보는 암호화되어 안전하게 보관되며, 캠페인 신청 시에만 사용됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-navy-600 to-pink-600 text-white py-3.5 rounded-xl font-semibold hover:from-navy-700 hover:to-pink-700 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            지금 입력하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionModal
