
import React, { useState, useEffect } from 'react'
import {Phone, Check, AlertCircle} from 'lucide-react'

interface PhoneInputProps {
  value: string
  onChange: (value: string) => void
  error?: string
  disabled?: boolean
  placeholder?: string
  required?: boolean
}

const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "010-1234-5678",
  required = false
}) => {
  const [displayValue, setDisplayValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)

  // 전화번호 포맷팅 함수 (010-1234-5678)
  const formatPhoneNumber = (phoneNumber: string): string => {
    // 숫자만 추출
    const numbers = phoneNumber.replace(/[^\d]/g, '')
    
    // 11자리 초과 시 11자리까지만 사용
    const limitedNumbers = numbers.slice(0, 11)
    
    // 길이에 따른 포맷팅
    if (limitedNumbers.length <= 3) {
      return limitedNumbers
    } else if (limitedNumbers.length <= 7) {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3)}`
    } else {
      return `${limitedNumbers.slice(0, 3)}-${limitedNumbers.slice(3, 7)}-${limitedNumbers.slice(7)}`
    }
  }

  // 전화번호 유효성 검증
  const validatePhoneNumber = (phoneNumber: string): { isValid: boolean; message?: string } => {
    const numbers = phoneNumber.replace(/[^\d]/g, '')
    
    if (!numbers) {
      return { isValid: false, message: '연락처를 입력해주세요' }
    }
    
    if (numbers.length < 10) {
      return { isValid: false, message: '연락처가 너무 짧습니다' }
    }
    
    if (numbers.length > 11) {
      return { isValid: false, message: '연락처가 너무 깁니다' }
    }
    
    // 010, 011, 016, 017, 018, 019로 시작 (휴대폰)
    const mobilePattern = /^01[0-9]/
    // 02, 031-070 등으로 시작 (일반전화)
    const landlinePattern = /^0[2-9]/
    
    if (!mobilePattern.test(numbers) && !landlinePattern.test(numbers)) {
      return { isValid: false, message: '올바른 연락처 형식이 아닙니다' }
    }
    
    return { isValid: true }
  }

  // value 변경 시 displayValue 업데이트
  useEffect(() => {
    if (value) {
      setDisplayValue(formatPhoneNumber(value))
    } else {
      setDisplayValue('')
    }
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value
    
    // 숫자와 대시만 허용
    const filteredValue = inputValue.replace(/[^\d-]/g, '')
    
    // 포맷팅 적용
    const formattedValue = formatPhoneNumber(filteredValue)
    
    // 상태 업데이트
    setDisplayValue(formattedValue)
    
    // 부모 컴포넌트에 전달 (포맷된 값 그대로)
    onChange(formattedValue)
  }

  const handleFocus = () => {
    setIsFocused(true)
  }

  const handleBlur = () => {
    setIsFocused(false)
    // 포커스 아웃 시 최종 포맷팅
    if (value) {
      const formattedValue = formatPhoneNumber(value)
      setDisplayValue(formattedValue)
      onChange(formattedValue)
    }
  }

  const validation = validatePhoneNumber(displayValue)
  const showValidation = displayValue.length > 0 && !isFocused

  const getInputClassName = () => {
    let baseClass = "w-full pl-10 pr-10 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
    
    if (disabled) {
      baseClass += " bg-gray-100 cursor-not-allowed"
    }
    
    if (error) {
      baseClass += " border-red-300 focus:ring-red-500"
    } else if (showValidation && validation.isValid) {
      baseClass += " border-green-300 focus:ring-green-500"
    } else if (showValidation && !validation.isValid) {
      baseClass += " border-yellow-300 focus:ring-yellow-500"
    } else {
      baseClass += " border-gray-300"
    }
    
    return baseClass
  }

  const getCharacterCount = () => {
    const numbers = displayValue.replace(/[^\d]/g, '')
    return `${numbers.length}/11`
  }

  return (
    <div>
      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
        <Phone className="w-4 h-4 mr-2" />
        연락처 {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      <div className="relative">
        {/* 전화 아이콘 */}
        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        
        {/* 입력 필드 */}
        <input
          type="tel"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={getInputClassName()}
          maxLength={13} // 010-1234-5678 (13자)
        />
        
        {/* 유효성 검증 아이콘 */}
        {showValidation && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            {validation.isValid ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <AlertCircle className="w-4 h-4 text-yellow-500" />
            )}
          </div>
        )}
      </div>

      {/* 글자수 표시 */}
      <div className="flex justify-between items-center mt-1">
        <div>
          {error && (
            <p className="text-red-500 text-xs">{error}</p>
          )}
          {!error && showValidation && !validation.isValid && validation.message && (
            <p className="text-yellow-600 text-xs">{validation.message}</p>
          )}
          {!error && showValidation && validation.isValid && (
            <p className="text-green-600 text-xs">올바른 연락처입니다</p>
          )}
        </div>
        <span className="text-xs text-gray-500">{getCharacterCount()}</span>
      </div>

      {/* 도움말 */}
      {isFocused && (
        <div className="mt-2 text-xs text-gray-500">
          <p>💡 휴대폰: 010-1234-5678 형식으로 입력됩니다</p>
          <p>📞 일반전화: 02-1234-5678 형식도 가능합니다</p>
        </div>
      )}
    </div>
  )
}

// 🔥 CRITICAL: Named export 추가 (빌드 오류 해결)
export { PhoneInput }
export default PhoneInput
