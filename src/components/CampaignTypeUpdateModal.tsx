import React, { useState, useEffect } from 'react'
import { X, AlertTriangle } from 'lucide-react'

interface CampaignTypeUpdateModalProps {
  isOpen: boolean
  onClose: () => void
  experiences: any[]
  onUpdate: (config: {
    targetTypes: string[]
    newType: string
    updateAll: boolean
  }) => Promise<{ updatedCount: number; updateResults: any[] }>
}

const CampaignTypeUpdateModal: React.FC<CampaignTypeUpdateModalProps> = ({
  isOpen,
  onClose,
  experiences,
  onUpdate
}) => {
  const [selectedTypes, setSelectedTypes] = useState<string[]>([])
  const [newType, setNewType] = useState('purchase_review')
  const [updateAll, setUpdateAll] = useState(false)
  const [loading, setLoading] = useState(false)
  const [typeStats, setTypeStats] = useState<{ [key: string]: number }>({})

  // 캠페인 타입 통계 계산
  useEffect(() => {
    if (experiences.length > 0) {
      const stats: { [key: string]: number } = {}
      experiences.forEach(exp => {
        const type = exp.experience_type || exp.campaign_type || exp.type || 'undefined'
        stats[type] = (stats[type] || 0) + 1
      })
      setTypeStats(stats)
    }
  }, [experiences])

  const typeLabels: { [key: string]: string } = {
    'purchase_review': '구매평',
    'product': '제품 체험',
    'press': '기자단',
    'local': '지역 체험',
    'undefined': '타입 없음'
  }

  const handleTypeToggle = (type: string) => {
    if (selectedTypes.includes(type)) {
      setSelectedTypes(selectedTypes.filter(t => t !== type))
    } else {
      setSelectedTypes([...selectedTypes, type])
    }
  }

  const handleSelectAll = () => {
    if (selectedTypes.length === Object.keys(typeStats).length) {
      setSelectedTypes([])
    } else {
      setSelectedTypes(Object.keys(typeStats))
    }
  }

  const handleSubmit = async () => {
    if (!updateAll && selectedTypes.length === 0) {
      alert('수정할 캠페인 타입을 선택해주세요.')
      return
    }

    const totalCount = updateAll 
      ? experiences.length 
      : selectedTypes.reduce((sum, type) => sum + (typeStats[type] || 0), 0)

    if (!confirm(`${totalCount}개의 캠페인을 "${typeLabels[newType]}" 타입으로 변경하시겠습니까?`)) {
      return
    }

    try {
      setLoading(true)
      const result = await onUpdate({
        targetTypes: selectedTypes,
        newType,
        updateAll
      })
      
      if (result.updatedCount > 0) {
        onClose()
      }
    } catch (error) {
      console.error('캠페인 타입 업데이트 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">캠페인 타입 일괄 수정</h2>
              <p className="text-sm text-gray-600 mt-1">
                여러 캠페인의 타입을 한 번에 변경할 수 있습니다
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 전체 선택 옵션 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="updateAll"
                checked={updateAll}
                onChange={(e) => {
                  setUpdateAll(e.target.checked)
                  if (e.target.checked) {
                    setSelectedTypes([])
                  }
                }}
                className="w-4 h-4 text-vintage-600 border-gray-300 rounded focus:ring-vintage-500"
              />
              <label htmlFor="updateAll" className="ml-3 text-sm font-medium text-vintage-900">
                모든 캠페인 ({experiences.length}개) 수정
              </label>
            </div>
            <p className="text-xs text-vintage-700 mt-1 ml-7">
              현재 등록된 모든 캠페인의 타입을 변경합니다
            </p>
          </div>

          {/* 타입별 선택 */}
          {!updateAll && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">수정할 캠페인 타입 선택</h3>
                <button
                  onClick={handleSelectAll}
                  className="text-sm text-vintage-600 hover:text-vintage-800"
                >
                  {selectedTypes.length === Object.keys(typeStats).length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              
              <div className="space-y-3">
                {Object.entries(typeStats).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id={`type-${type}`}
                        checked={selectedTypes.includes(type)}
                        onChange={() => handleTypeToggle(type)}
                        className="w-4 h-4 text-vintage-600 border-gray-300 rounded focus:ring-vintage-500"
                      />
                      <label htmlFor={`type-${type}`} className="ml-3 text-sm font-medium text-gray-900">
                        {typeLabels[type] || type}
                      </label>
                    </div>
                    <span className="text-sm text-gray-500">{count}개</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 새로운 타입 선택 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">변경할 타입</h3>
            <select
              value={newType}
              onChange={(e) => setNewType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
            >
              <option value="purchase_review">구매평</option>
              <option value="product">제품 체험</option>
              <option value="press">기자단</option>
              <option value="local">지역 체험</option>
            </select>
          </div>

          {/* 미리보기 */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 mr-3" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">변경 미리보기</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {updateAll 
                    ? `모든 캠페인 (${experiences.length}개)이 "${typeLabels[newType]}" 타입으로 변경됩니다.`
                    : `${selectedTypes.reduce((sum, type) => sum + (typeStats[type] || 0), 0)}개의 캠페인이 "${typeLabels[newType]}" 타입으로 변경됩니다.`
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 버튼들 */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 rounded-b-xl">
          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || (!updateAll && selectedTypes.length === 0)}
              className="px-4 py-2 bg-vintage-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  수정 중...
                </>
              ) : (
                '타입 수정'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CampaignTypeUpdateModal
