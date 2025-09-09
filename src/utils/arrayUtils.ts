// 🔥 ULTRA SAFE 배열 변환 - undefined.length 완전 차단
export function ultraSafeArray<T>(value: any): T[] {
  try {
    if (value === null || value === undefined) {
      return []
    }
    
    if (Array.isArray(value)) {
      try {
        return value.filter(item => item != null)
      } catch {
        return []
      }
    }
    
    if (typeof value === 'object' && value !== null) {
      const arrayKeys = ['list', 'data', 'items', 'results', 'experiences', 'experience_codes', 'applications', 'users']
      
      for (const key of arrayKeys) {
        try {
          const candidate = value[key]
          if (candidate && Array.isArray(candidate)) {
            return candidate.filter((item: any) => item != null)
          }
        } catch {
          continue
        }
      }
      
      try {
        const values = Object.values(value)
        for (const val of values) {
          if (Array.isArray(val)) {
            try {
              return val.filter((item: any) => item != null)
            } catch {
              continue
            }
          }
        }
      } catch {
        // Object.values 실패
      }
    }
    
    return []
  } catch {
    return []
  }
}

// 🔥 안전한 문자열 추출
export function safeString(obj: any, field: string, fallback = ''): string {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    return value != null ? String(value) : fallback
  } catch {
    return fallback
  }
}

// 🔥 안전한 숫자 추출
export function safeNumber(obj: any, field: string, fallback = 0): number {
  try {
    if (!obj || typeof obj !== 'object') return fallback
    const value = obj[field]
    const num = Number(value)
    return isNaN(num) ? fallback : num
  } catch {
    return fallback
  }
}

// 🔥 안전한 사용자 ID 추출
export function extractAllUserIds(user: any): string[] {
  try {
    if (!user || typeof user !== 'object') return []
    
    const possibleIds = [
      user.user_id,
      user.id,
      user.userId,
      user._id,
      (user as any).user_id,
      (user as any).id,
      (user as any).userId
    ]
    
    return possibleIds.filter(id => id != null && String(id).trim() !== '')
  } catch {
    return []
  }
}
