import React, { useState, useEffect } from 'react'
import { AlertCircle, X, CheckCircle2, User, Phone, Instagram, Clock, Upload, Image as ImageIcon } from 'lucide-react'
import { sendVerificationCode, verifyCode, formatPhoneNumber } from '../services/phoneVerificationService'
import PhoneInput from './PhoneInput'
import { dataService } from '../lib/dataService'

interface ProfileCompletionModalProps {
  isOpen: boolean
  onClose: () => void
  onComplete: (data: { name: string, phone: string, nickname: string, profileImage?: string }) => void
  requiresPhoneOnly?: boolean // 전화번호만 필요한 경우 (회원가입 후)
  hasPhone?: boolean // 이미 전화번호가 있는 경우 (회원가입으로 등록한 사용자)
  existingPhone?: string // 기존 전화번호
}

const ProfileCompletionModal: React.FC<ProfileCompletionModalProps> = ({
  isOpen,
  onClose,
  onComplete,
  requiresPhoneOnly = false,
  hasPhone = false,
  existingPhone = ''
}) => {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [nickname, setNickname] = useState('')
  const [profileImage, setProfileImage] = useState<File | null>(null)
  const [profileImagePreview, setProfileImagePreview] = useState<string>('')
  const [verificationCode, setVerificationCode] = useState('')
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [isVerified, setIsVerified] = useState(false)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [error, setError] = useState('')

  // 타이머
  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
      return () => clearTimeout(timer)
    } else if (timeLeft === 0 && isCodeSent) {
      setError('인증번호가 만료되었습니다. 다시 발송해주세요.')
      setIsCodeSent(false)
    }
  }, [timeLeft, isCodeSent])

  // 모달 열릴 때 초기화
  useEffect(() => {
    if (isOpen) {
      setName('')
      setPhone(hasPhone ? existingPhone : '')
      setNickname('')
      setProfileImage(null)
      setProfileImagePreview('')
      setVerificationCode('')
      setIsCodeSent(false)
      setIsVerified(hasPhone) // 이미 전화번호가 있으면 인증 완료로 처리
      setTimeLeft(0)
      setError('')
    }
  }, [isOpen, hasPhone, existingPhone])

  if (!isOpen) return null

  // 인증번호 발송
  const handleSendCode = async () => {
    setError('')

    if (!phone) {
      setError('휴대폰 번호를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const result = await sendVerificationCode(phone)

      if (result.success) {
        setIsCodeSent(true)
        setTimeLeft(result.expiresIn || 180)
        setError('')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('인증번호 발송에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 인증번호 확인
  const handleVerifyCode = async () => {
    setError('')

    if (!verificationCode) {
      setError('인증번호를 입력해주세요')
      return
    }

    setLoading(true)
    try {
      const result = await verifyCode(phone, verificationCode)

      if (result.success) {
        setIsVerified(true)
        setError('')
      } else {
        setError(result.message)
      }
    } catch (err) {
      setError('인증 확인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  // 프로필 이미지 선택 핸들러
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // 이미지 파일 검증
      if (!file.type.startsWith('image/')) {
        setError('이미지 파일만 업로드 가능합니다')
        return
      }

      // 파일 크기 검증 (5MB 제한)
      if (file.size > 5 * 1024 * 1024) {
        setError('이미지 크기는 5MB 이하여야 합니다')
        return
      }

      setProfileImage(file)

      // 미리보기 생성
      const reader = new FileReader()
      reader.onloadend = () => {
        setProfileImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
      setError('')
    }
  }

  // 프로필 이미지 삭제 핸들러
  const handleRemoveImage = () => {
    setProfileImage(null)
    setProfileImagePreview('')
  }

  // 완료
  const handleComplete = async () => {
    try {
      setLoading(true)
      setError('')

      // 닉네임 필수 입력 검증
      if (!nickname.trim()) {
        setError('닉네임을 입력해주세요')
        return
      }

      // 닉네임 길이 검증 (2-20자)
      if (nickname.trim().length < 2 || nickname.trim().length > 20) {
        setError('닉네임은 2-20자 사이로 입력해주세요')
        return
      }

      // 휴대폰 인증 확인 (이미 전화번호가 있는 경우 스킵)
      if (!hasPhone && !isVerified) {
        setError('휴대폰 인증을 완료해주세요')
        return
      }

      // 프로필 이미지 업로드 (선택사항)
      let uploadedImageUrl = ''
      if (profileImage) {
        setUploadingImage(true)
        try {
          const { data, error: uploadError } = await dataService.uploadImage(profileImage, 'profile-images')
          if (uploadError) {
            console.warn('프로필 이미지 업로드 실패:', uploadError)
            // 이미지 업로드 실패는 치명적이지 않음
          } else if (data) {
            uploadedImageUrl = data
          }
        } catch (err) {
          console.warn('프로필 이미지 업로드 중 오류:', err)
        } finally {
          setUploadingImage(false)
        }
      }

      if (requiresPhoneOnly) {
        // 전화번호만 필요한 경우 (회원가입 후)
        await onComplete({ name: '', phone, nickname: nickname.trim(), profileImage: uploadedImageUrl })
      } else {
        // 모든 정보 필요한 경우 (캠페인 신청 시)
        if (!name) {
          setError('실명을 입력해주세요')
          return
        }
        await onComplete({ name, phone, nickname: nickname.trim(), profileImage: uploadedImageUrl })
      }
    } catch (error) {
      console.error('프로필 완성 실패:', error)
      setError('프로필 완성에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-navy-500 to-pink-500 rounded-full mb-4">
              <User className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {hasPhone ? '닉네임 설정 🎉' : (requiresPhoneOnly ? '환영합니다! 🎉' : '프로필 정보 입력')}
            </h2>
            <p className="text-gray-600">
              {hasPhone
                ? '사용할 닉네임과 프로필 사진을 설정해주세요'
                : (requiresPhoneOnly
                  ? '휴대폰 번호를 인증하고 환영 알림을 받아보세요'
                  : '캠페인 신청을 위해 정보를 입력해주세요')}
            </p>
          </div>

          {/* 입력 폼 */}
          <div className="space-y-4 mb-6">
            {/* 프로필 이미지 업로드 (선택사항) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                프로필 사진 (선택사항)
              </label>
              <div className="flex items-center gap-4">
                {/* 프로필 이미지 미리보기 */}
                <div className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center border-2 border-gray-300">
                  {profileImagePreview ? (
                    <img
                      src={profileImagePreview}
                      alt="프로필 미리보기"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-10 h-10 text-gray-400" />
                  )}
                  {/* 삭제 버튼 */}
                  {profileImagePreview && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                      title="프로필 사진 삭제"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* 업로드 버튼 */}
                <label className="flex-1 cursor-pointer">
                  <div className="px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-navy-400 hover:bg-gray-50 transition-all text-center">
                    <Upload className="w-5 h-5 mx-auto mb-1 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {profileImage ? profileImage.name : '이미지 선택'}
                    </span>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                    disabled={loading}
                  />
                </label>
              </div>
              <p className="text-xs text-gray-500 mt-1">JPG, PNG 파일 (최대 5MB)</p>
            </div>

            {/* 닉네임 입력 (필수) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-1" />
                닉네임 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                placeholder="커뮤니티에서 사용할 닉네임"
                maxLength={20}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">2-20자 사이로 입력해주세요</p>
            </div>

            {/* 실명 입력 (캠페인 신청 시에만) */}
            {!requiresPhoneOnly && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline mr-1" />
                  실명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="홍길동"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                />
              </div>
            )}

            {/* 휴대폰 번호 - 이미 전화번호가 있는 경우 표시 안 함 */}
            {!hasPhone && (
              <>
                <div>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <PhoneInput
                        value={phone}
                        onChange={setPhone}
                        disabled={isVerified}
                        placeholder="010-1234-5678"
                        required={true}
                        showLabel={true}
                      />
                    </div>
                  </div>
                  <div className="mt-2">
                    <button
                      onClick={handleSendCode}
                      disabled={loading || isVerified || phone.replace(/[^0-9]/g, '').length < 10}
                      className="w-full px-6 py-3 bg-navy-600 text-white rounded-xl hover:bg-navy-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                    >
                      {isCodeSent ? '재발송' : '인증번호 발송'}
                    </button>
                  </div>
                </div>

                {/* 인증번호 입력 */}
                {isCodeSent && !isVerified && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center justify-between">
                      <span>인증번호</span>
                      {timeLeft > 0 && (
                        <span className="text-red-600 text-sm flex items-center">
                          <Clock className="w-4 h-4 mr-1" />
                          {formatTime(timeLeft)}
                        </span>
                      )}
                    </label>
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                        placeholder="6자리 입력"
                        maxLength={6}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-navy-500 focus:border-transparent"
                      />
                      <button
                        onClick={handleVerifyCode}
                        disabled={loading || verificationCode.length !== 6}
                        className="px-6 py-3 bg-pink-600 text-white rounded-xl hover:bg-pink-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                      >
                        확인
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* 인증 완료 */}
            {isVerified && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-green-800">
                  <CheckCircle2 className="w-5 h-5" />
                  <span className="font-medium">휴대폰 인증이 완료되었습니다</span>
                </div>
                <p className="text-sm text-green-600 mt-1 ml-7">
                  {formatPhoneNumber(phone)}
                </p>
              </div>
            )}

            {/* 에러 메시지 */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center space-x-2 text-red-800">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}
          </div>

          {/* 안내 문구 */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
            <div className="flex items-start space-x-2">
              <CheckCircle2 className="w-5 h-5 text-primary-600 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-primary-900">
                <p className="font-medium mb-1">입력하신 정보는 안전하게 보관됩니다</p>
                <p className="text-xs text-primary-700">
                  {requiresPhoneOnly
                    ? '인증 완료 후 카카오톡으로 환영 메시지를 보내드립니다.'
                    : '캠페인 신청 및 세금 정산 시에만 사용됩니다.'}
                </p>
              </div>
            </div>
          </div>

          {/* 완료 버튼 */}
          <button
            onClick={handleComplete}
            disabled={loading || uploadingImage || !isVerified || !nickname.trim() || (!requiresPhoneOnly && !name)}
            className="w-full bg-gradient-to-r from-navy-600 to-pink-600 text-white py-3.5 rounded-xl font-semibold hover:from-navy-700 hover:to-pink-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            {uploadingImage ? '이미지 업로드 중...' : loading ? '처리 중...' : '완료'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ProfileCompletionModal
