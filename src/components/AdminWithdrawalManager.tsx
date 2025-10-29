import React, { useState, useEffect } from 'react'
import { Download, FileSpreadsheet, Filter, Search, Eye, Check, X, Calendar } from 'lucide-react'
import * as XLSX from 'xlsx'

interface WithdrawalRequest {
  id: string
  user_id: string
  user_name?: string
  user_email?: string
  created_at: string
  bank_name?: string
  account_number?: string
  account_holder?: string
  points_amount: number
  requested_amount: number
  tax_amount: number
  final_amount: number
  status: string
  resident_number?: string
  payment_schedule_date?: string
  actual_payment_date?: string
  tax_agreement?: boolean
  privacy_agreement?: boolean
  tax_withholding_agreement?: boolean
  agreement_timestamp?: string
  campaign_brands?: string[]
}

interface AdminWithdrawalManagerProps {
  onApprove?: (requestId: string) => Promise<void>
  onReject?: (requestId: string) => Promise<void>
}

const AdminWithdrawalManager: React.FC<AdminWithdrawalManagerProps> = ({
  onApprove,
  onReject
}) => {
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([])
  const [filteredWithdrawals, setFilteredWithdrawals] = useState<WithdrawalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null)

  useEffect(() => {
    loadWithdrawals()
  }, [])

  useEffect(() => {
    filterWithdrawals()
  }, [withdrawals, searchTerm, statusFilter])

  const loadWithdrawals = async () => {
    try {
      setLoading(true)
      const { dataService } = await import('../lib/dataService')

      // 출금 요청 데이터 가져오기
      const requests = await dataService.entities.withdrawal_requests.list()

      // 모든 사용자 정보를 한 번에 가져오기 (성능 최적화)
      const allUserProfiles = await dataService.entities.user_profiles.list()
      const allUsers = await dataService.entities.users.list()
      const allApplications = await dataService.entities.user_applications.list()

      console.log('🔍 전체 user_profiles 데이터:', allUserProfiles)
      console.log('🔍 전체 users 데이터:', allUsers)

      // 사용자 정보 및 캠페인 정보 병합
      const enrichedRequests = await Promise.all(
        requests.map(async (request: any) => {
          try {
            // JavaScript로 필터링
            const userProfile = allUserProfiles.find((p: any) => p.user_id === request.user_id)
            const user = allUsers.find((u: any) => u.user_id === request.user_id)

            console.log(`🔍 출금 요청 ${request.id}:`, {
              request_user_id: request.user_id,
              userProfile,
              user,
              user_name: userProfile?.name || userProfile?.real_name || user?.name
            })

            // 계좌 정보 조회
            let bankInfo = {}
            if (request.bank_account_id) {
              try {
                const bankAccount = await dataService.entities.bank_accounts.get(request.bank_account_id)
                bankInfo = {
                  bank_name: bankAccount?.bank_name,
                  account_number: bankAccount?.account_number,
                  account_holder: bankAccount?.account_holder
                }
              } catch (error) {
                console.warn('계좌 정보 조회 실패:', error)
              }
            }

            // 사용자가 체험한 브랜드 정보 조회
            const userApplications = allApplications.filter((app: any) =>
              app.user_id === request.user_id && app.status === 'approved'
            )

            const campaignBrands = userApplications
              .map((app: any) => app.campaign_name || app.experience_name)
              .filter((name: string) => name)
              .slice(0, 5) // 최대 5개까지

            return {
              ...request,
              user_name: userProfile?.name || userProfile?.real_name || user?.name || request.user_id || '알 수 없음',
              user_email: user?.email,
              ...bankInfo,
              campaign_brands: campaignBrands
            }
          } catch (error) {
            console.error('출금 요청 정보 조회 실패:', error)
            return {
              ...request,
              user_name: request.user_id || '알 수 없음',
              campaign_brands: []
            }
          }
        })
      )

      // 최신순 정렬
      enrichedRequests.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      setWithdrawals(enrichedRequests)
    } catch (error) {
      console.error('출금 요청 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const filterWithdrawals = () => {
    let filtered = [...withdrawals]

    // 상태 필터
    if (statusFilter !== 'all') {
      filtered = filtered.filter(w => w.status === statusFilter)
    }

    // 검색어 필터
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(w =>
        w.user_name?.toLowerCase().includes(searchLower) ||
        w.user_id?.toLowerCase().includes(searchLower) ||
        w.account_holder?.toLowerCase().includes(searchLower) ||
        w.bank_name?.toLowerCase().includes(searchLower)
      )
    }

    setFilteredWithdrawals(filtered)
  }

  // 엑셀 다운로드 함수
  const downloadExcel = () => {
    const excelData = filteredWithdrawals.map((w, index) => ({
      '번호': index + 1,
      '신청일자': new Date(w.created_at).toLocaleDateString('ko-KR'),
      '이름': w.user_name || w.account_holder || '정보 없음',
      '계좌번호': w.account_number || '정보 없음',
      '은행': w.bank_name || '정보 없음',
      '예금주': w.account_holder || '정보 없음',
      '포인트금액': w.points_amount || w.requested_amount || 0,
      '세금차감': w.tax_amount || 0,
      '실지급액': w.final_amount || 0,
      '주민등록번호': w.resident_number ? maskResidentNumber(w.resident_number) : '정보 없음',
      '체험브랜드': w.campaign_brands?.join(', ') || '정보 없음',
      '예상입금일': w.payment_schedule_date ? new Date(w.payment_schedule_date).toLocaleDateString('ko-KR') : '미정',
      '실제입금일': w.actual_payment_date ? new Date(w.actual_payment_date).toLocaleDateString('ko-KR') : '미완료',
      '상태': getStatusText(w.status),
      '개인정보동의': w.privacy_agreement ? 'O' : 'X',
      '세금동의': w.tax_agreement ? 'O' : 'X',
      '원천징수동의': w.tax_withholding_agreement ? 'O' : 'X',
      '동의시각': w.agreement_timestamp ? new Date(w.agreement_timestamp).toLocaleString('ko-KR') : '정보 없음'
    }))

    // 워크시트 생성
    const worksheet = XLSX.utils.json_to_sheet(excelData)

    // 열 너비 설정
    const colWidths = [
      { wch: 6 },  // 번호
      { wch: 12 }, // 신청일자
      { wch: 10 }, // 이름
      { wch: 18 }, // 계좌번호
      { wch: 12 }, // 은행
      { wch: 10 }, // 예금주
      { wch: 12 }, // 포인트금액
      { wch: 10 }, // 세금차감
      { wch: 12 }, // 실지급액
      { wch: 16 }, // 주민등록번호
      { wch: 30 }, // 체험브랜드
      { wch: 12 }, // 예상입금일
      { wch: 12 }, // 실제입금일
      { wch: 10 }, // 상태
      { wch: 12 }, // 개인정보동의
      { wch: 10 }, // 세금동의
      { wch: 12 }, // 원천징수동의
      { wch: 20 }  // 동의시각
    ]
    worksheet['!cols'] = colWidths

    // 워크북 생성
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '출금신청목록')

    // 파일 다운로드
    const fileName = `출금신청목록_${new Date().toISOString().split('T')[0]}.xlsx`
    XLSX.writeFile(workbook, fileName)
  }

  const maskResidentNumber = (residentNumber: string) => {
    if (!residentNumber) return '정보 없음'
    // 앞 6자리-뒤 7자리 중 뒤 6자리 마스킹
    if (residentNumber.length === 13 || residentNumber.includes('-')) {
      const cleaned = residentNumber.replace(/-/g, '')
      return `${cleaned.slice(0, 6)}-${cleaned.slice(6, 7)}******`
    }
    return '형식 오류'
  }

  const getStatusText = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: '대기중',
      approved: '승인됨',
      processing: '처리중',
      completed: '완료',
      rejected: '거절됨'
    }
    return statusMap[status] || status
  }

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      pending: 'bg-yellow-100 text-yellow-800',
      approved: 'bg-blue-100 text-blue-800',
      processing: 'bg-purple-100 text-purple-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800'
    }
    return colorMap[status] || 'bg-gray-100 text-gray-800'
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-navy-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* 헤더 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">포인트 출금 관리</h2>
            <p className="text-sm text-gray-600 mt-1">
              총 {withdrawals.length}건 중 {filteredWithdrawals.length}건 표시
            </p>
          </div>

          <button
            onClick={downloadExcel}
            disabled={filteredWithdrawals.length === 0}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Download className="w-5 h-5" />
            <span>엑셀 다운로드</span>
          </button>
        </div>

        {/* 필터 및 검색 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="이름, 사용자ID, 계좌정보로 검색..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            />
          </div>

          {/* 상태 필터 */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-navy-500 focus:border-transparent"
            >
              <option value="all">전체 상태</option>
              <option value="pending">대기중</option>
              <option value="approved">승인됨</option>
              <option value="processing">처리중</option>
              <option value="completed">완료</option>
              <option value="rejected">거절됨</option>
            </select>
          </div>
        </div>
      </div>

      {/* 테이블 - 구글 시트 스타일 */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  No
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  신청일자
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  이름
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  계좌번호
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  예금주
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  포인트
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  실지급액
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  체험 브랜드
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  주민등록번호
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider border-r">
                  상태
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상세/액션
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredWithdrawals.length > 0 ? (
                filteredWithdrawals.map((withdrawal, index) => (
                  <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r">
                      {index + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r">
                      {new Date(withdrawal.created_at).toLocaleDateString('ko-KR')}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 border-r">
                      {withdrawal.user_name}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r font-mono">
                      {withdrawal.bank_name} {withdrawal.account_number || '정보 없음'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r">
                      {withdrawal.account_holder || '정보 없음'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-right font-semibold">
                      {(withdrawal.points_amount || withdrawal.requested_amount || 0).toLocaleString()}P
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r text-right font-semibold text-green-600">
                      {(withdrawal.final_amount || 0).toLocaleString()}원
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600 border-r max-w-xs truncate">
                      {withdrawal.campaign_brands && withdrawal.campaign_brands.length > 0
                        ? withdrawal.campaign_brands.join(', ')
                        : '정보 없음'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 border-r font-mono">
                      {withdrawal.resident_number
                        ? maskResidentNumber(withdrawal.resident_number)
                        : '정보 없음'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center border-r">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(withdrawal.status)}`}>
                        {getStatusText(withdrawal.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <button
                        onClick={() => setSelectedWithdrawal(withdrawal)}
                        className="text-navy-600 hover:text-navy-800 font-medium text-sm flex items-center justify-center mx-auto space-x-1"
                      >
                        <Eye className="w-4 h-4" />
                        <span>상세</span>
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="px-4 py-8 text-center text-gray-500">
                    출금 요청이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 상세 모달 */}
      {selectedWithdrawal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900">출금 요청 상세</h3>
                <button
                  onClick={() => setSelectedWithdrawal(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                {/* 기본 정보 */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">기본 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">신청일시:</span>
                      <p className="font-medium">{new Date(selectedWithdrawal.created_at).toLocaleString('ko-KR')}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">신청자:</span>
                      <p className="font-medium">{selectedWithdrawal.user_name}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">이메일:</span>
                      <p className="font-medium">{selectedWithdrawal.user_email || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">사용자 ID:</span>
                      <p className="font-medium">{selectedWithdrawal.user_id}</p>
                    </div>
                  </div>
                </div>

                {/* 출금 정보 */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">출금 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">신청 포인트:</span>
                      <p className="font-bold text-lg">{(selectedWithdrawal.points_amount || selectedWithdrawal.requested_amount || 0).toLocaleString()}P</p>
                    </div>
                    <div>
                      <span className="text-gray-600">세금 차감 (3.3%):</span>
                      <p className="font-semibold text-red-600">-{(selectedWithdrawal.tax_amount || 0).toLocaleString()}원</p>
                    </div>
                    <div>
                      <span className="text-gray-600">실지급액:</span>
                      <p className="font-bold text-xl text-green-600">{(selectedWithdrawal.final_amount || 0).toLocaleString()}원</p>
                    </div>
                    <div>
                      <span className="text-gray-600">상태:</span>
                      <p>
                        <span className={`px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedWithdrawal.status)}`}>
                          {getStatusText(selectedWithdrawal.status)}
                        </span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* 계좌 정보 */}
                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">계좌 정보</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">은행:</span>
                      <p className="font-medium">{selectedWithdrawal.bank_name || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">계좌번호:</span>
                      <p className="font-medium font-mono">{selectedWithdrawal.account_number || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">예금주:</span>
                      <p className="font-medium">{selectedWithdrawal.account_holder || '정보 없음'}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">주민등록번호:</span>
                      <p className="font-medium font-mono">
                        {selectedWithdrawal.resident_number
                          ? maskResidentNumber(selectedWithdrawal.resident_number)
                          : '정보 없음'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 법적 동의 */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3">법적 동의 사항</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">개인정보 수집·이용 동의:</span>
                      <span className={`font-semibold ${selectedWithdrawal.privacy_agreement ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedWithdrawal.privacy_agreement ? '✓ 동의함' : '✗ 미동의'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">세금 신고 동의:</span>
                      <span className={`font-semibold ${selectedWithdrawal.tax_agreement ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedWithdrawal.tax_agreement ? '✓ 동의함' : '✗ 미동의'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">원천징수 동의:</span>
                      <span className={`font-semibold ${selectedWithdrawal.tax_withholding_agreement ? 'text-green-600' : 'text-red-600'}`}>
                        {selectedWithdrawal.tax_withholding_agreement ? '✓ 동의함' : '✗ 미동의'}
                      </span>
                    </div>
                    {selectedWithdrawal.agreement_timestamp && (
                      <div className="pt-2 border-t border-purple-200">
                        <span className="text-gray-600">동의 일시:</span>
                        <p className="font-medium">{new Date(selectedWithdrawal.agreement_timestamp).toLocaleString('ko-KR')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* 체험 브랜드 */}
                {selectedWithdrawal.campaign_brands && selectedWithdrawal.campaign_brands.length > 0 && (
                  <div className="bg-yellow-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 mb-3">체험한 브랜드</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedWithdrawal.campaign_brands.map((brand, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-white border border-yellow-200 rounded-full text-sm text-gray-700"
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 지급 일정 */}
                <div className="bg-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    지급 일정
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">예상 입금일:</span>
                      <p className="font-medium">
                        {selectedWithdrawal.payment_schedule_date
                          ? new Date(selectedWithdrawal.payment_schedule_date).toLocaleDateString('ko-KR')
                          : '미정'}
                      </p>
                    </div>
                    <div>
                      <span className="text-gray-600">실제 입금일:</span>
                      <p className="font-medium">
                        {selectedWithdrawal.actual_payment_date
                          ? new Date(selectedWithdrawal.actual_payment_date).toLocaleDateString('ko-KR')
                          : '미완료'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 액션 버튼 */}
                {selectedWithdrawal.status === 'pending' && onApprove && onReject && (
                  <div className="flex space-x-3 pt-4 border-t">
                    <button
                      onClick={async () => {
                        if (window.confirm('이 출금 요청을 승인하시겠습니까?')) {
                          await onApprove(selectedWithdrawal.id)
                          setSelectedWithdrawal(null)
                          await loadWithdrawals()
                        }
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                    >
                      <Check className="w-5 h-5" />
                      <span>승인</span>
                    </button>
                    <button
                      onClick={async () => {
                        if (window.confirm('이 출금 요청을 거절하시겠습니까?')) {
                          await onReject(selectedWithdrawal.id)
                          setSelectedWithdrawal(null)
                          await loadWithdrawals()
                        }
                      }}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    >
                      <X className="w-5 h-5" />
                      <span>거절</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminWithdrawalManager
