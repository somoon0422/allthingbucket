import React, { useState } from 'react'
import { X, Truck, Package } from 'lucide-react'
import toast from 'react-hot-toast'

interface ShippingModalProps {
  isOpen: boolean
  onClose: () => void
  application: any
  onSuccess: () => void
}

export const ShippingModal: React.FC<ShippingModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess
}) => {
  const [trackingNumber, setTrackingNumber] = useState('')
  const [courier, setCourier] = useState('')
  const [loading, setLoading] = useState(false)

  // 모달이 열릴 때 기존 배송 정보 로드
  React.useEffect(() => {
    if (isOpen && application) {
      setTrackingNumber(application.tracking_number || '')
      setCourier(application.courier || '')
    }
  }, [isOpen, application])

  const courierOptions = [
    { value: 'cj', label: 'CJ대한통운' },
    { value: 'hanjin', label: '한진택배' },
    { value: 'lotte', label: '롯데택배' },
    { value: 'korex', label: '로젠택배' },
    { value: 'epost', label: '우체국택배' },
    { value: 'cu', label: 'CU편의점택배' },
    { value: 'gs', label: 'GS25편의점택배' },
    { value: 'other', label: '기타' }
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!trackingNumber.trim()) {
      toast.error('송장번호를 입력해주세요')
      return
    }
    
    if (!courier) {
      toast.error('택배사를 선택해주세요')
      return
    }

    try {
      setLoading(true)
      
      // 신청 상태를 'shipping'으로 업데이트하고 송장번호 저장
      const { dataService } = await import('../lib/dataService')
      const result = await dataService.entities.user_applications.update(application._id || application.id, {
        status: 'shipping',
        tracking_number: trackingNumber.trim(),
        courier: courier,
        shipped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (result) {
        const isUpdate = application.tracking_number && application.courier
        toast.success(isUpdate ? '배송 정보가 수정되었습니다!' : '배송 정보가 등록되었습니다!')
        onSuccess()
        onClose()
        setTrackingNumber('')
        setCourier('')
      } else {
        toast.error('배송 정보 등록에 실패했습니다')
      }
    } catch (error) {
      console.error('배송 정보 등록 실패:', error)
      toast.error('배송 정보 등록에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Truck className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                {application?.tracking_number ? '배송 정보 수정' : '배송 정보 등록'}
              </h2>
              <p className="text-sm text-gray-600">택배 송장번호를 입력해주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>

        {/* 신청 정보 */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="w-6 h-6 text-gray-600" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">
                {application.experience?.campaign_name || application.experience?.product_name || '체험단'}
              </h3>
              <p className="text-sm text-gray-600">
                신청자: {application.name || '정보 없음'}
              </p>
            </div>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 택배사 선택 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              택배사 <span className="text-red-500">*</span>
            </label>
            <select
              value={courier}
              onChange={(e) => setCourier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            >
              <option value="">택배사를 선택해주세요</option>
              {courierOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          {/* 송장번호 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              송장번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={trackingNumber}
              onChange={(e) => setTrackingNumber(e.target.value)}
              placeholder="송장번호를 입력해주세요"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
            />
          </div>

          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <Package className="w-3 h-3 text-primary-600" />
              </div>
              <div>
                <p className="text-sm text-primary-800 font-medium">배송 정보 등록 안내</p>
                <p className="text-sm text-primary-700 mt-1">
                  송장번호를 등록하면 체험단원이 배송 추적을 할 수 있습니다.
                </p>
              </div>
            </div>
          </div>

          {/* 버튼들 */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '처리 중...' : (application?.tracking_number ? '배송 정보 수정' : '배송 정보 등록')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ShippingModal
