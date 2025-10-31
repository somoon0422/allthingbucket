import React, { useState } from 'react'
import { verifyBankAccount, BANK_CODES } from '../services/niceApiService'
import { CheckCircle, XCircle, AlertCircle, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface BankAccountVerificationProps {
  onSuccess?: (data: any) => void
  onCancel?: () => void
  defaultName?: string
}

const BankAccountVerification: React.FC<BankAccountVerificationProps> = ({
  onSuccess,
  onCancel,
  defaultName = ''
}) => {
  const [formData, setFormData] = useState({
    bankCode: '',
    accountNumber: '',
    accountHolder: defaultName
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.bankCode || !formData.accountNumber || !formData.accountHolder) {
      toast.error('모든 정보를 입력해주세요')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const verificationResult = await verifyBankAccount(
        formData.bankCode,
        formData.accountNumber,
        formData.accountHolder
      )

      setResult(verificationResult)

      if (verificationResult.success) {
        toast.success('계좌인증이 완료되었습니다')
        if (onSuccess) {
          onSuccess({
            bankCode: formData.bankCode,
            bankName: verificationResult.bankName,
            accountNumber: formData.accountNumber,
            accountHolder: verificationResult.accountHolder
          })
        }
      } else {
        toast.error(verificationResult.message)
      }
    } catch (error) {
      console.error('계좌인증 오류:', error)
      toast.error('계좌인증 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-slate-200/60">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-green-600 rounded-lg mr-3 shadow-md">
          <Building2 className="w-6 h-6 text-white" />
        </div>
        계좌인증
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 은행 선택 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            은행 선택
          </label>
          <select
            value={formData.bankCode}
            onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            disabled={loading || result?.success}
          >
            <option value="">은행을 선택하세요</option>
            {Object.entries(BANK_CODES).map(([code, name]) => (
              <option key={code} value={code}>
                {name}
              </option>
            ))}
          </select>
        </div>

        {/* 계좌번호 입력 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            계좌번호
          </label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => {
              const value = e.target.value.replace(/[^0-9]/g, '')
              setFormData({ ...formData, accountNumber: value })
            }}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="'-' 없이 숫자만 입력"
            disabled={loading || result?.success}
          />
        </div>

        {/* 예금주명 입력 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            예금주명
          </label>
          <input
            type="text"
            value={formData.accountHolder}
            onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 transition-all"
            placeholder="홍길동"
            disabled={loading || result?.success}
          />
        </div>

        {/* 결과 표시 */}
        {result && (
          <div
            className={`p-4 rounded-xl flex items-start space-x-3 ${
              result.success
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200'
                : 'bg-gradient-to-r from-red-50 to-rose-50 border border-red-200'
            }`}
          >
            {result.success ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p
                className={`font-semibold ${
                  result.success ? 'text-emerald-900' : 'text-red-900'
                }`}
              >
                {result.message}
              </p>
              {result.success && (
                <div className="mt-2 space-y-1 text-sm text-emerald-800">
                  <p>• 은행: {result.bankName}</p>
                  <p>• 예금주: {result.accountHolder}</p>
                </div>
              )}
              {!result.success && result.code && (
                <p className="text-sm text-red-700 mt-1">오류 코드: {result.code}</p>
              )}
            </div>
          </div>
        )}

        {/* 안내사항 */}
        {!result && (
          <div className="bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-900">
                <p className="font-semibold mb-1">계좌인증 안내</p>
                <ul className="list-disc list-inside space-y-1 text-emerald-800">
                  <li>본인 명의의 계좌만 등록 가능합니다</li>
                  <li>계좌번호는 '-' 없이 숫자만 입력해주세요</li>
                  <li>입력하신 정보는 NICE 평가정보를 통해 인증됩니다</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 버튼 */}
        <div className="flex space-x-3 pt-4">
          {!result?.success && (
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl hover:from-emerald-700 hover:to-green-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? '인증 중...' : '계좌인증'}
            </button>
          )}

          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-6 py-3.5 bg-white text-slate-700 rounded-xl hover:bg-slate-50 transition-all duration-300 font-bold shadow-md hover:shadow-lg border-2 border-slate-200"
            >
              {result?.success ? '완료' : '취소'}
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default BankAccountVerification
