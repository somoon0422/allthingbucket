import React, { useState } from 'react'
import { verifyRealName } from '../services/niceApiService'
import { CheckCircle, XCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface RealNameVerificationProps {
  onSuccess?: (data: any) => void
  onCancel?: () => void
}

const RealNameVerification: React.FC<RealNameVerificationProps> = ({
  onSuccess,
  onCancel
}) => {
  const [formData, setFormData] = useState({
    name: '',
    rrn1: '', // 주민번호 앞자리
    rrn2: ''  // 주민번호 뒷자리
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name || !formData.rrn1 || !formData.rrn2) {
      toast.error('모든 정보를 입력해주세요')
      return
    }

    if (formData.rrn1.length !== 6 || formData.rrn2.length !== 7) {
      toast.error('주민등록번호 형식이 올바르지 않습니다')
      return
    }

    setLoading(true)
    setResult(null)

    try {
      const rrn = formData.rrn1 + formData.rrn2
      const verificationResult = await verifyRealName(formData.name, rrn)

      setResult(verificationResult)

      if (verificationResult.success) {
        toast.success('실명인증이 완료되었습니다')
        if (onSuccess) {
          onSuccess(verificationResult.data)
        }
      } else {
        toast.error(verificationResult.message)
      }
    } catch (error) {
      console.error('실명인증 오류:', error)
      toast.error('실명인증 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto border border-slate-200/60">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
        <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg mr-3 shadow-md">
          <CheckCircle className="w-6 h-6 text-white" />
        </div>
        실명인증
      </h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 이름 입력 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            이름
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            placeholder="홍길동"
            disabled={loading || result?.success}
          />
        </div>

        {/* 주민등록번호 입력 */}
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-2">
            주민등록번호
          </label>
          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={formData.rrn1}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 6)
                setFormData({ ...formData, rrn1: value })
              }}
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-center"
              placeholder="123456"
              maxLength={6}
              disabled={loading || result?.success}
            />
            <span className="text-slate-400 font-bold">-</span>
            <input
              type="password"
              value={formData.rrn2}
              onChange={(e) => {
                const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 7)
                setFormData({ ...formData, rrn2: value })
              }}
              className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all text-center"
              placeholder="●●●●●●●"
              maxLength={7}
              disabled={loading || result?.success}
            />
          </div>
          <p className="text-xs text-slate-500 mt-2">
            주민등록번호는 암호화되어 안전하게 보관됩니다
          </p>
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
              {!result.success && result.code && (
                <p className="text-sm text-red-700 mt-1">오류 코드: {result.code}</p>
              )}
            </div>
          </div>
        )}

        {/* 안내사항 */}
        {!result && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-blue-900">
                <p className="font-semibold mb-1">실명인증 안내</p>
                <ul className="list-disc list-inside space-y-1 text-blue-800">
                  <li>본인의 실명과 주민등록번호를 정확히 입력해주세요</li>
                  <li>입력하신 정보는 NICE 평가정보를 통해 인증됩니다</li>
                  <li>개인정보는 암호화되어 안전하게 처리됩니다</li>
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
              className="flex-1 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 disabled:from-slate-400 disabled:to-slate-500 transition-all duration-300 font-bold shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              {loading ? '인증 중...' : '실명인증'}
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

export default RealNameVerification
