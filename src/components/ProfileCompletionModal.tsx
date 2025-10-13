import React from 'react'
import { CheckCircle, X, Shield, Gift, Star } from 'lucide-react'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity" onClick={onClose}></div>

        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
          {/* 닫기 버튼 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          {/* 헤더 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              프로필 완성이 필요합니다
            </h2>
            <p className="text-gray-600">
              체험단 활동을 시작하기 전에 프로필을 완성해주세요
            </p>
          </div>

          {/* 안내 내용 */}
          <div className="space-y-4 mb-6">
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <CheckCircle className="w-5 h-5 text-blue-600 mr-2" />
                프로필 완성이 필요한 이유
              </h3>
              <ul className="space-y-2 text-sm text-gray-700">
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span>체험단 신청 시 정확한 배송 정보가 필요합니다</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span>기업과 인플루언서 간 원활한 소통을 위해 필수입니다</span>
                </li>
                <li className="flex items-start">
                  <div className="w-1.5 h-1.5 bg-blue-600 rounded-full mt-2 mr-2 flex-shrink-0"></div>
                  <span>본인 인증을 통해 안전한 플랫폼 환경을 제공합니다</span>
                </li>
              </ul>
            </div>

            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 rounded-xl p-4">
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
                <Gift className="w-5 h-5 text-purple-600 mr-2" />
                프로필 완성 후 이용 가능한 혜택
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <Star className="w-5 h-5 text-yellow-500 mb-1" />
                  <p className="text-xs font-medium text-gray-900">체험단 신청</p>
                  <p className="text-xs text-gray-600 mt-0.5">다양한 캠페인 참여</p>
                </div>
                <div className="bg-white bg-opacity-60 rounded-lg p-3">
                  <Gift className="w-5 h-5 text-purple-500 mb-1" />
                  <p className="text-xs font-medium text-gray-900">리워드 획득</p>
                  <p className="text-xs text-gray-600 mt-0.5">포인트 적립 및 사용</p>
                </div>
              </div>
            </div>
          </div>

          {/* 필수 정보 안내 */}
          <div className="bg-gray-50 rounded-xl p-4 mb-6">
            <p className="text-sm font-medium text-gray-900 mb-2">필수 입력 정보</p>
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
                실명
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
                전화번호
              </span>
              <span className="inline-flex items-center px-3 py-1 bg-white border border-gray-200 rounded-full text-xs text-gray-700">
                SNS 정보
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              * 입력하신 정보는 암호화되어 안전하게 보관됩니다
            </p>
          </div>

          {/* 확인 버튼 */}
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-xl font-medium hover:from-purple-700 hover:to-pink-700 transition-all duration-200 shadow-lg"
          >
            프로필 작성하기
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionModal
