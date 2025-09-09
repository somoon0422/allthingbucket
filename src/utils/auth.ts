// 클라이언트 사이드에서는 JWT 토큰 검증을 서버에서 처리

export interface UserPayload {
  id: string
  email: string
  name: string
  role: 'user' | 'admin'
  type?: 'user'
}

export interface AdminPayload {
  id: string
  admin_name: string
  email: string
  role: 'admin' | 'super_admin' | 'manager'
  type?: 'admin'
}

// 클라이언트 사이드에서는 토큰 검증을 서버에서 처리
// 토큰에서 사용자 정보 추출 (간단한 디코딩)
export const getUserFromToken = (token: string): UserPayload | AdminPayload | null => {
  try {
    // 간단한 토큰인 경우
    if (token.startsWith('token_')) {
      const parts = token.split('_')
      if (parts.length >= 3) {
        const userType = parts[1]
        const userId = parts[2]
        
        if (userType === 'admin') {
          return {
            id: userId,
            admin_name: `${userType} User`,
            email: `${userId}@example.com`,
            role: 'admin' as const,
            type: 'admin' as const
          }
        } else {
          return {
            id: userId,
            email: `${userId}@example.com`,
            name: `${userType} User`,
            role: 'user' as const,
            type: 'user' as const
          }
        }
      }
      
      return {
        id: 'temp_user',
        email: 'temp@temp.com',
        name: 'Temp User',
        role: 'user',
        type: 'user'
      }
    }

    // 폴백: 기본 사용자 정보
    return {
      id: 'fallback_user',
      email: 'fallback@example.com',
      name: 'Fallback User',
      role: 'user',
      type: 'user'
    }
  } catch (error) {
    console.error('토큰 디코딩 실패:', error)
    // 폴백: 기본 사용자 정보
    return {
      id: 'error_user',
      email: 'error@example.com',
      name: 'Error User',
      role: 'user',
      type: 'user'
    }
  }
}

// 이메일 유효성 검사
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 비밀번호 강도 검사
export const isStrongPassword = (password: string): boolean => {
  // 최소 8자, 대소문자, 숫자, 특수문자 포함
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  return passwordRegex.test(password)
}

// 전화번호 유효성 검사
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^01[0-9]-?[0-9]{4}-?[0-9]{4}$/
  return phoneRegex.test(phone.replace(/\s/g, ''))
}
