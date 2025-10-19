import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageSquare, Building2, Phone, Mail, User, Tag, DollarSign, FileText, CheckCircle2, ArrowLeft } from 'lucide-react'
import { supabase } from '../lib/supabase'
import ChatBot from '../components/ChatBot'
import { emailNotificationService } from '../services/emailNotificationService'
import toast from 'react-hot-toast'

interface FormData {
  companyName: string
  contactPhone: string
  contactEmail: string
  contactPerson: string
  category: string
  budgetRange: string
  requestDetails: string
  privacyConsent: boolean
  isAgency: boolean
}

const Consultation: React.FC = () => {
  const navigate = useNavigate()
  const [formData, setFormData] = useState<FormData>({
    companyName: '',
    contactPhone: '',
    contactEmail: '',
    contactPerson: '',
    category: '',
    budgetRange: '',
    requestDetails: '',
    privacyConsent: false,
    isAgency: false
  })

  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { value: 'food', label: '식품' },
    { value: 'beauty', label: '뷰티/화장품' },
    { value: 'fashion', label: '패션/의류' },
    { value: 'lifestyle', label: '생활용품' },
    { value: 'tech', label: '전자제품/IT' },
    { value: 'health', label: '건강/헬스케어' },
    { value: 'education', label: '교육/학습' },
    { value: 'other', label: '기타' }
  ]

  const budgetRanges = [
    { value: 'under_1m', label: '100만원 미만' },
    { value: '1m_5m', label: '100만원 - 500만원' },
    { value: '5m_10m', label: '500만원 - 1,000만원' },
    { value: 'over_10m', label: '1,000만원 이상' },
    { value: 'negotiable', label: '협의 가능' }
  ]

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // 필수 항목 검증
    if (!formData.companyName.trim()) {
      setError('업체명을 입력해주세요.')
      return
    }

    if (!formData.contactPhone.trim()) {
      setError('연락처를 입력해주세요.')
      return
    }

    if (!formData.category) {
      setError('카테고리를 선택해주세요.')
      return
    }

    if (!formData.privacyConsent) {
      setError('개인정보 수집 및 이용에 동의해주세요.')
      return
    }

    setLoading(true)

    try {
      const { error: insertError } = await supabase
        .from('consultation_requests')
        .insert([{
          company_name: formData.companyName,
          contact_phone: formData.contactPhone,
          contact_email: formData.contactEmail || null,
          contact_person: formData.contactPerson || null,
          category: formData.category,
          budget_range: formData.budgetRange || null,
          request_details: formData.requestDetails || null,
          privacy_consent: formData.privacyConsent,
          is_agency: formData.isAgency,
          status: 'pending'
        }])

      if (insertError) {
        console.error('상담 신청 오류:', insertError)
        setError('상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.')
        return
      }

      // 관리자에게 이메일 알림 발송
      try {
        console.log('📧 관리자에게 상담 접수 알림 이메일 발송 중...')
        await emailNotificationService.sendConsultationRequestEmail(
          'support@allthingbucket.com', // 관리자 이메일
          {
            companyName: formData.companyName,
            contactPhone: formData.contactPhone,
            contactEmail: formData.contactEmail,
            contactPerson: formData.contactPerson,
            category: formData.category,
            budgetRange: formData.budgetRange,
            requestDetails: formData.requestDetails,
            isAgency: formData.isAgency
          }
        )
        console.log('✅ 관리자 이메일 알림 발송 완료')
      } catch (emailError) {
        console.error('❌ 이메일 발송 실패:', emailError)
        // 이메일 실패해도 상담 신청은 완료된 것으로 처리
      }

      // 성공 처리
      setSubmitted(true)
      toast.success('상담 신청이 완료되었습니다!')

      // 3초 후 홈으로 이동
      setTimeout(() => {
        navigate('/')
      }, 3000)

    } catch (err) {
      console.error('상담 신청 예외:', err)
      setError('상담 신청 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  // 제출 완료 화면
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">상담 신청이 완료되었습니다!</h2>
            <p className="text-gray-600 mb-6">
              빠른 시일 내에 담당자가 연락드리겠습니다.<br />
              감사합니다.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-vintage-600 text-white rounded-lg hover:bg-vintage-700 transition-colors font-medium"
            >
              홈으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-gray-600 hover:text-gray-900 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            뒤로가기
          </button>
          <div className="flex items-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center mr-4">
              <MessageSquare className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">광고 상담 신청</h1>
              <p className="text-gray-600 mt-1">체험단 광고 무료 상담을 신청해보세요</p>
            </div>
          </div>
        </div>

        {/* 안내 박스 */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
          <h3 className="font-semibold text-blue-900 mb-2">💡 상담 안내</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• 영업일 기준 1-2일 내에 담당자가 연락드립니다</li>
            <li>• 체험단 캠페인 기획부터 운영까지 맞춤 상담을 제공합니다</li>
            <li>• 예산과 목표에 맞는 최적의 솔루션을 제안해드립니다</li>
          </ul>
        </div>

        {/* 폼 */}
        <div className="bg-white rounded-xl shadow-sm p-6 sm:p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* 업체명 */}
            <div>
              <label htmlFor="companyName" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Building2 className="w-4 h-4 mr-2" />
                업체명 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="text"
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="업체명을 입력해주세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                required
              />
            </div>

            {/* 연락처 */}
            <div>
              <label htmlFor="contactPhone" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 mr-2" />
                연락처 <span className="text-red-500 ml-1">*</span>
              </label>
              <input
                type="tel"
                id="contactPhone"
                name="contactPhone"
                value={formData.contactPhone}
                onChange={handleChange}
                placeholder="010-0000-0000"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                required
              />
            </div>

            {/* 이메일 */}
            <div>
              <label htmlFor="contactEmail" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 mr-2" />
                이메일
              </label>
              <input
                type="email"
                id="contactEmail"
                name="contactEmail"
                value={formData.contactEmail}
                onChange={handleChange}
                placeholder="email@example.com"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
              />
            </div>

            {/* 담당자명 */}
            <div>
              <label htmlFor="contactPerson" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 mr-2" />
                담당자명
              </label>
              <input
                type="text"
                id="contactPerson"
                name="contactPerson"
                value={formData.contactPerson}
                onChange={handleChange}
                placeholder="담당자명을 입력해주세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
              />
            </div>

            {/* 카테고리 */}
            <div>
              <label htmlFor="category" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <Tag className="w-4 h-4 mr-2" />
                제품 카테고리 <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                required
              >
                <option value="">카테고리를 선택해주세요</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>

            {/* 예산 범위 */}
            <div>
              <label htmlFor="budgetRange" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <DollarSign className="w-4 h-4 mr-2" />
                예산 범위
              </label>
              <select
                id="budgetRange"
                name="budgetRange"
                value={formData.budgetRange}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
              >
                <option value="">예산 범위를 선택해주세요 (선택사항)</option>
                {budgetRanges.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>

            {/* 상담 내용 */}
            <div>
              <label htmlFor="requestDetails" className="flex items-center text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 mr-2" />
                상담 내용
              </label>
              <textarea
                id="requestDetails"
                name="requestDetails"
                value={formData.requestDetails}
                onChange={handleChange}
                placeholder="상담을 원하시는 내용을 자유롭게 작성해주세요&#10;예) 제품 특징, 타겟 고객, 캠페인 목표 등"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent resize-none"
              />
            </div>

            {/* 동의 체크박스 */}
            <div className="space-y-3 pt-4 border-t">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="privacyConsent"
                  name="privacyConsent"
                  checked={formData.privacyConsent}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-vintage-600 border-gray-300 rounded focus:ring-vintage-500"
                  required
                />
                <label htmlFor="privacyConsent" className="ml-3 text-sm text-gray-700">
                  <span className="font-medium text-gray-900">개인정보 수집 및 이용에 동의합니다</span>
                  <span className="text-red-500 ml-1">*</span>
                  <p className="text-gray-500 mt-1">
                    수집항목: 업체명, 연락처, 이메일, 담당자명<br />
                    이용목적: 상담 신청 처리 및 회신<br />
                    보유기간: 상담 종료 후 1년
                  </p>
                </label>
              </div>

              <div className="flex items-start">
                <input
                  type="checkbox"
                  id="isAgency"
                  name="isAgency"
                  checked={formData.isAgency}
                  onChange={handleChange}
                  className="mt-1 w-4 h-4 text-vintage-600 border-gray-300 rounded focus:ring-vintage-500"
                />
                <label htmlFor="isAgency" className="ml-3 text-sm text-gray-700">
                  대행사입니다
                </label>
              </div>
            </div>

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* 제출 버튼 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-semibold rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  신청 중...
                </span>
              ) : (
                '상담 신청하기'
              )}
            </button>
          </form>
        </div>
      </div>

      {/* 채팅봇 */}
      <ChatBot />
    </div>
  )
}

export default Consultation
