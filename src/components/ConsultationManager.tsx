import React, { useState } from 'react'
import { RefreshCw, ArrowLeft, Trash2, Check, X, Edit2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

interface ConsultationManagerProps {
  consultationRequests: any[]
  onRefresh: () => void
}

const ConsultationManager: React.FC<ConsultationManagerProps> = ({
  consultationRequests,
  onRefresh
}) => {
  const [consultationFilter, setConsultationFilter] = useState('all')
  const [consultationSearch, setConsultationSearch] = useState('')
  const [selectedConsultation, setSelectedConsultation] = useState<any>(null)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [editingMemoId, setEditingMemoId] = useState<string | null>(null)
  const [tempMemo, setTempMemo] = useState('')

  // 필터링된 상담 목록
  const filteredConsultations = consultationRequests.filter(req => {
    if (consultationFilter !== 'all' && req.status !== consultationFilter) return false
    if (consultationSearch) {
      const searchLower = consultationSearch.toLowerCase()
      return (
        req.company_name?.toLowerCase().includes(searchLower) ||
        req.contact_phone?.toLowerCase().includes(searchLower) ||
        req.category?.toLowerCase().includes(searchLower) ||
        req.contact_email?.toLowerCase().includes(searchLower) ||
        req.contact_person?.toLowerCase().includes(searchLower)
      )
    }
    return true
  })

  // 체크박스 전체 선택/해제
  const toggleSelectAll = () => {
    if (selectedIds.length === filteredConsultations.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredConsultations.map(c => c.id))
    }
  }

  // 개별 체크박스 토글
  const toggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(sid => sid !== id))
    } else {
      setSelectedIds([...selectedIds, id])
    }
  }

  // 선택된 항목 삭제
  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) {
      toast.error('삭제할 항목을 선택해주세요')
      return
    }

    if (!confirm(`선택한 ${selectedIds.length}개의 상담 접수를 삭제하시겠습니까?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('consultation_requests')
        .delete()
        .in('id', selectedIds)

      if (error) throw error

      toast.success(`${selectedIds.length}개의 상담 접수가 삭제되었습니다`)
      setSelectedIds([])
      onRefresh()
    } catch (error) {
      console.error('삭제 실패:', error)
      toast.error('삭제에 실패했습니다')
    }
  }

  // 상태 변경
  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus }
      if (newStatus === 'completed') {
        updateData.processed_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('consultation_requests')
        .update(updateData)
        .eq('id', id)

      if (error) throw error

      toast.success(`상태가 변경되었습니다`)
      onRefresh()
    } catch (error) {
      console.error('상태 변경 실패:', error)
      toast.error('상태 변경에 실패했습니다')
    }
  }

  // 메모 저장
  const handleSaveMemo = async (id: string) => {
    try {
      const { error } = await supabase
        .from('consultation_requests')
        .update({ admin_note: tempMemo })
        .eq('id', id)

      if (error) throw error

      toast.success('메모가 저장되었습니다')
      setEditingMemoId(null)
      setTempMemo('')
      onRefresh()
    } catch (error) {
      console.error('메모 저장 실패:', error)
      toast.error('메모 저장에 실패했습니다')
    }
  }

  // 카테고리 한글 변환
  const getCategoryLabel = (category: string) => {
    const map: { [key: string]: string } = {
      food: '식품',
      beauty: '뷰티/화장품',
      fashion: '패션/의류',
      lifestyle: '생활용품',
      tech: '전자제품/IT',
      health: '건강/헬스케어',
      education: '교육/학습',
      other: '기타'
    }
    return map[category] || category
  }

  // 상태 배지 스타일
  const getStatusBadge = (status: string) => {
    const styles: { [key: string]: string } = {
      pending: 'bg-yellow-100 text-yellow-800',
      in_progress: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-gray-100 text-gray-800'
    }
    const labels: { [key: string]: string } = {
      pending: '대기중',
      in_progress: '처리중',
      completed: '완료',
      cancelled: '취소'
    }
    return { style: styles[status] || '', label: labels[status] || status }
  }

  // 상세 페이지로 이동
  const viewDetail = (consultation: any) => {
    setSelectedConsultation(consultation)
  }

  // 목록으로 돌아가기
  const backToList = () => {
    setSelectedConsultation(null)
  }

  // 상세 페이지 렌더링
  if (selectedConsultation) {
    const statusBadge = getStatusBadge(selectedConsultation.status)

    return (
      <div className="max-w-7xl mx-auto">
      <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
        {/* 헤더 */}
        <div className="px-8 py-6 border-b border-white/50">
          <div className="flex items-center justify-between">
            <button
              onClick={backToList}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              목록으로
            </button>
            <h2 className="text-2xl font-bold text-gray-900">상담 접수 상세</h2>
            <div className="w-24"></div>
          </div>
        </div>

        {/* 상세 내용 */}
        <div className="p-8">
          <div className="bg-white rounded-xl border border-gray-200 p-8">
            {/* 기본 정보 */}
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <h3 className="text-2xl font-bold text-gray-900">{selectedConsultation.company_name}</h3>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge.style}`}>
                  {statusBadge.label}
                </span>
                {selectedConsultation.is_agency && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                    대행사
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-500">담당자명</label>
                  <p className="text-gray-900 mt-1">{selectedConsultation.contact_person || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">연락처</label>
                  <p className="text-gray-900 mt-1">{selectedConsultation.contact_phone}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">이메일</label>
                  <p className="text-gray-900 mt-1">{selectedConsultation.contact_email || '-'}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">카테고리</label>
                  <p className="text-gray-900 mt-1">{getCategoryLabel(selectedConsultation.category)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">예산 범위</label>
                  <p className="text-gray-900 mt-1">
                    {selectedConsultation.budget_range === 'under_1m' ? '100만원 미만' :
                     selectedConsultation.budget_range === '1m_5m' ? '100-500만원' :
                     selectedConsultation.budget_range === '5m_10m' ? '500-1000만원' :
                     selectedConsultation.budget_range === 'over_10m' ? '1000만원 이상' :
                     selectedConsultation.budget_range === 'negotiable' ? '협의 가능' : '-'}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">접수 일시</label>
                  <p className="text-gray-900 mt-1">
                    {new Date(selectedConsultation.created_at).toLocaleString('ko-KR')}
                  </p>
                </div>
              </div>
            </div>

            {/* 상담 내용 */}
            {selectedConsultation.request_details && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <label className="text-sm font-medium text-gray-700 mb-2 block">상담 내용</label>
                <p className="text-gray-900 whitespace-pre-wrap">{selectedConsultation.request_details}</p>
              </div>
            )}

            {/* 관리자 메모 */}
            <div className="mb-6 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-blue-900">관리자 메모</label>
                {editingMemoId !== selectedConsultation.id && (
                  <button
                    onClick={() => {
                      setEditingMemoId(selectedConsultation.id)
                      setTempMemo(selectedConsultation.admin_note || '')
                    }}
                    className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                  >
                    <Edit2 className="w-3 h-3" />
                    편집
                  </button>
                )}
              </div>

              {editingMemoId === selectedConsultation.id ? (
                <div>
                  <textarea
                    value={tempMemo}
                    onChange={(e) => setTempMemo(e.target.value)}
                    className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    rows={4}
                    placeholder="관리자 메모를 입력하세요..."
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => handleSaveMemo(selectedConsultation.id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      <Check className="w-3 h-3" />
                      저장
                    </button>
                    <button
                      onClick={() => {
                        setEditingMemoId(null)
                        setTempMemo('')
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                    >
                      <X className="w-3 h-3" />
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-blue-900 whitespace-pre-wrap">
                  {selectedConsultation.admin_note || '메모가 없습니다.'}
                </p>
              )}
            </div>

            {/* 상태 변경 */}
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-gray-700">상태 변경:</label>
              <select
                value={selectedConsultation.status}
                onChange={(e) => handleStatusChange(selectedConsultation.id, e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                <option value="pending">대기중</option>
                <option value="in_progress">처리중</option>
                <option value="completed">완료</option>
                <option value="cancelled">취소</option>
              </select>
            </div>
          </div>
        </div>
      </div>
      </div>
    )
  }

  // 리스트 페이지 렌더링
  return (
    <div className="max-w-7xl mx-auto">
    <div className="backdrop-blur-sm bg-white/90 rounded-3xl shadow-2xl mb-8">
      {/* 헤더 */}
      <div className="px-8 py-6 border-b border-white/50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-900">상담 접수 관리</h2>
          <div className="flex gap-3">
            {selectedIds.length > 0 && (
              <button
                onClick={handleDeleteSelected}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 font-medium"
              >
                <Trash2 className="w-5 h-5" />
                선택 삭제 ({selectedIds.length})
              </button>
            )}
            <button
              onClick={onRefresh}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl hover:scale-105 hover:shadow-xl transition-all duration-200 font-medium"
            >
              <RefreshCw className="w-5 h-5" />
              새로고침
            </button>
          </div>
        </div>

        {/* 필터 및 검색 */}
        <div className="flex gap-4 mt-4">
          <select
            value={consultationFilter}
            onChange={(e) => setConsultationFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          >
            <option value="all">전체</option>
            <option value="pending">대기중</option>
            <option value="in_progress">처리중</option>
            <option value="completed">완료</option>
            <option value="cancelled">취소</option>
          </select>

          <input
            type="text"
            placeholder="업체명, 담당자, 연락처 검색..."
            value={consultationSearch}
            onChange={(e) => setConsultationSearch(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* 테이블 */}
      <div className="overflow-x-auto">
        {filteredConsultations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p>상담 접수 내역이 없습니다</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredConsultations.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">접수일시</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">담당자명</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">연락처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">업체명</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredConsultations.map((consultation, index) => {
                const statusBadge = getStatusBadge(consultation.status)
                return (
                  <tr
                    key={consultation.id}
                    onClick={() => viewDetail(consultation)}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(consultation.id)}
                        onChange={() => toggleSelect(consultation.id)}
                        className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{index + 1}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(consultation.created_at).toLocaleDateString('ko-KR')} <br />
                      <span className="text-xs text-gray-500">
                        {new Date(consultation.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusBadge.style}`}>
                        {statusBadge.label}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.contact_person || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {consultation.contact_phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {consultation.company_name}
                      {consultation.is_agency && (
                        <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                          대행사
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </div>
  )
}

export default ConsultationManager
