import React, { useState } from 'react'
import { Shield, AlertCircle, CheckCircle2, FileText, Lock } from 'lucide-react'

interface WithdrawalLegalNoticeProps {
  onAllAgreed: (agreements: AgreementData) => void
  residentNumber: string
  onResidentNumberChange: (value: string) => void
}

export interface AgreementData {
  taxAgreement: boolean
  privacyAgreement: boolean
  taxWithholdingAgreement: boolean
  allAgreed: boolean
  timestamp: string
}

const WithdrawalLegalNotice: React.FC<WithdrawalLegalNoticeProps> = ({
  onAllAgreed,
  residentNumber,
  onResidentNumberChange
}) => {
  const [agreements, setAgreements] = useState({
    taxAgreement: false,
    privacyAgreement: false,
    taxWithholdingAgreement: false
  })

  const [showDetails, setShowDetails] = useState({
    privacy: false,
    tax: false,
    withholding: false
  })

  const handleAgreementChange = (key: keyof typeof agreements, value: boolean) => {
    const newAgreements = {
      ...agreements,
      [key]: value
    }
    setAgreements(newAgreements)

    // 모든 동의가 완료되면 부모 컴포넌트에 알림
    const allAgreed = Object.values(newAgreements).every(v => v === true)
    onAllAgreed({
      ...newAgreements,
      allAgreed,
      timestamp: new Date().toISOString()
    })
  }

  const handleAllAgree = () => {
    const newAgreements = {
      taxAgreement: true,
      privacyAgreement: true,
      taxWithholdingAgreement: true
    }
    setAgreements(newAgreements)
    onAllAgreed({
      ...newAgreements,
      allAgreed: true,
      timestamp: new Date().toISOString()
    })
  }

  const allAgreed = Object.values(agreements).every(v => v === true)

  // 주민등록번호 포맷팅
  const formatResidentNumber = (value: string) => {
    const numbers = value.replace(/[^0-9]/g, '')
    if (numbers.length <= 6) {
      return numbers
    }
    return `${numbers.slice(0, 6)}-${numbers.slice(6, 13)}`
  }

  const handleResidentNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatResidentNumber(e.target.value)
    if (formatted.replace(/-/g, '').length <= 13) {
      onResidentNumberChange(formatted)
    }
  }

  return (
    <div className="space-y-4">
      {/* 주요 안내사항 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <Shield className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 mb-2">
              포인트 출금을 위한 법적 고지사항
            </h3>
            <ul className="text-xs text-blue-800 space-y-1">
              <li>• 소득세법에 따라 사업소득 원천징수 3.3%가 공제됩니다</li>
              <li>• 세금 신고를 위해 주민등록번호가 필요합니다</li>
              <li>• 수집된 개인정보는 암호화되어 안전하게 보관됩니다</li>
              <li>• 법정 보관기간(5년) 경과 후 자동 파기됩니다</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 주민등록번호 입력 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center mb-3">
          <Lock className="w-5 h-5 text-gray-600 mr-2" />
          <h4 className="font-semibold text-gray-900">주민등록번호 입력</h4>
        </div>
        <div className="space-y-2">
          <label className="block text-sm text-gray-700">
            세금 신고를 위해 주민등록번호를 입력해주세요
          </label>
          <input
            type="text"
            value={residentNumber}
            onChange={handleResidentNumberChange}
            placeholder="000000-0000000"
            maxLength={14}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <div className="flex items-start mt-2">
            <AlertCircle className="w-4 h-4 text-gray-500 mt-0.5 mr-2 flex-shrink-0" />
            <p className="text-xs text-gray-600">
              입력하신 주민등록번호는 소득세법에 따른 세금 신고 목적으로만 사용되며,
              암호화되어 안전하게 보관됩니다.
            </p>
          </div>
        </div>
      </div>

      {/* 전체 동의 버튼 */}
      <button
        onClick={handleAllAgree}
        disabled={allAgreed}
        className={`w-full py-3 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
          allAgreed
            ? 'bg-green-100 text-green-800 cursor-default'
            : 'bg-navy-600 text-white hover:bg-navy-700'
        }`}
      >
        {allAgreed ? (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>모든 약관에 동의하였습니다</span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-5 h-5" />
            <span>전체 동의하기</span>
          </>
        )}
      </button>

      <div className="border-t border-gray-200 my-4"></div>

      {/* 개별 동의 항목 */}
      <div className="space-y-3">
        {/* 1. 개인정보 수집·이용 동의 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="privacy-agreement"
              checked={agreements.privacyAgreement}
              onChange={(e) => handleAgreementChange('privacyAgreement', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="privacy-agreement" className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  [필수] 개인정보 수집·이용 동의
                </span>
                <button
                  onClick={() => setShowDetails({ ...showDetails, privacy: !showDetails.privacy })}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showDetails.privacy ? '접기' : '상세보기'}
                </button>
              </div>

              {showDetails.privacy && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 space-y-2">
                  <div>
                    <strong>수집 목적:</strong> 포인트 출금 및 세금 신고
                  </div>
                  <div>
                    <strong>수집 항목:</strong> 성명, 주민등록번호, 계좌정보, 연락처
                  </div>
                  <div>
                    <strong>보유 기간:</strong> 출금 완료 후 5년 (소득세법 시행령 제122조)
                  </div>
                  <div>
                    <strong>개인정보 처리 위탁:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 수탁업체: 올띵버킷 세무대리인</li>
                      <li>• 위탁업무: 세금 신고 및 원천징수</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <strong>개인정보보호 책임자:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 이름: 김소희</li>
                      <li>• 연락처: support@allthingbucket.com</li>
                      <li>• 전화: 010-2212-9245</li>
                    </ul>
                  </div>
                  <div className="pt-2 text-red-600">
                    ※ 개인정보 수집·이용을 거부할 권리가 있으나, 거부 시 포인트 출금이 제한됩니다.
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 2. 세금 신고 동의 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="tax-agreement"
              checked={agreements.taxAgreement}
              onChange={(e) => handleAgreementChange('taxAgreement', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="tax-agreement" className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  [필수] 사업소득 세금 신고 동의
                </span>
                <button
                  onClick={() => setShowDetails({ ...showDetails, tax: !showDetails.tax })}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showDetails.tax ? '접기' : '상세보기'}
                </button>
              </div>

              {showDetails.tax && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 space-y-2">
                  <div>
                    <strong>세금 신고 내용:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 소득 구분: 사업소득 (체험단 활동 리워드)</li>
                      <li>• 원천징수세율: 3.3% (소득세 3% + 지방소득세 0.3%)</li>
                      <li>• 신고 시기: 출금 요청 월의 다음 달 10일까지</li>
                      <li>• 지급명세서: 다음 연도 2월 말까지 발급</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <strong>세무 처리:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 원천징수된 세금은 국세청에 신고·납부됩니다</li>
                      <li>• 연간 소득이 일정 금액 이상 시 종합소득세 신고 대상이 될 수 있습니다</li>
                      <li>• 지급명세서는 홈택스에서 확인 가능합니다</li>
                    </ul>
                  </div>
                  <div className="pt-2 text-blue-600">
                    ※ 세금 신고는 소득세법 제127조에 따른 법적 의무사항입니다.
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>

        {/* 3. 원천징수 동의 */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-start">
            <input
              type="checkbox"
              id="withholding-agreement"
              checked={agreements.taxWithholdingAgreement}
              onChange={(e) => handleAgreementChange('taxWithholdingAgreement', e.target.checked)}
              className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label htmlFor="withholding-agreement" className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-900">
                  [필수] 원천징수 3.3% 공제 동의
                </span>
                <button
                  onClick={() => setShowDetails({ ...showDetails, withholding: !showDetails.withholding })}
                  className="text-xs text-blue-600 hover:text-blue-800"
                >
                  {showDetails.withholding ? '접기' : '상세보기'}
                </button>
              </div>

              {showDetails.withholding && (
                <div className="mt-3 p-3 bg-gray-50 rounded text-xs text-gray-700 space-y-2">
                  <div>
                    <strong>원천징수 세율:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 소득세: 3.0%</li>
                      <li>• 지방소득세: 0.3%</li>
                      <li>• 합계: 3.3%</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <strong>계산 예시:</strong>
                    <ul className="ml-4 mt-1 space-y-1 font-mono">
                      <li>• 출금 신청: 100,000원</li>
                      <li>• 원천징수: 3,300원</li>
                      <li>• 실지급액: 96,700원</li>
                    </ul>
                  </div>
                  <div className="pt-2 border-t border-gray-200">
                    <strong>지급 일정:</strong>
                    <ul className="ml-4 mt-1 space-y-1">
                      <li>• 1일 ~ 10일 신청 → 당월 15일 지급</li>
                      <li>• 11일 ~ 20일 신청 → 당월 25일 지급</li>
                      <li>• 21일 ~ 말일 신청 → 익월 5일 지급</li>
                    </ul>
                  </div>
                  <div className="pt-2 text-green-600">
                    ※ 원천징수된 세금은 종합소득세 신고 시 기납부세액으로 공제받을 수 있습니다.
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>

      {/* 고객센터 안내 */}
      <div className="bg-gray-50 rounded-lg p-4 mt-4">
        <div className="flex items-start">
          <FileText className="w-5 h-5 text-gray-600 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 mb-2">
              문의사항이 있으신가요?
            </h4>
            <div className="text-xs text-gray-700 space-y-1">
              <div>📧 이메일: support@allthingbucket.com</div>
              <div>📞 전화: 010-2212-9245 (평일 09:00-18:00)</div>
              <div>💬 카카오톡: @올띵버킷 (24시간 문의 가능)</div>
            </div>
          </div>
        </div>
      </div>

      {/* 동의 완료 상태 표시 */}
      {allAgreed && residentNumber.replace(/-/g, '').length === 13 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <CheckCircle2 className="w-5 h-5 text-green-600 mr-3" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-900">
                모든 필수 동의가 완료되었습니다
              </p>
              <p className="text-xs text-green-700 mt-1">
                이제 출금 신청을 진행하실 수 있습니다
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default WithdrawalLegalNotice
