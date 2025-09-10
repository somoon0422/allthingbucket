import { apiCall } from '../config/database'
import { 
  isValidEmail,
  isStrongPassword,
  isValidPhone
} from '../utils/auth'

export interface UserRegistrationData {
  email: string
  password: string
  name: string
  phone?: string
  address?: string
  birth_date?: string
  gender?: 'male' | 'female' | 'other'
}

export interface AdminRegistrationData {
  admin_name: string
  email: string
  password: string
  role?: 'admin' | 'super_admin' | 'manager'
}

export interface LoginCredentials {
  email: string
  password: string
}

export interface AdminLoginCredentials {
  admin_name: string
  password: string
}

export class AuthService {
  // 사용자 회원가입
  async registerUser(userData: UserRegistrationData): Promise<{ user: any; token: string }> {
    try {
      // 입력값 검증
      if (!isValidEmail(userData.email)) {
        throw new Error('유효하지 않은 이메일 형식입니다')
      }

      if (!isStrongPassword(userData.password)) {
        throw new Error('비밀번호는 최소 8자 이상이며, 대소문자, 숫자, 특수문자를 포함해야 합니다')
      }

      if (userData.phone && !isValidPhone(userData.phone)) {
        throw new Error('유효하지 않은 전화번호 형식입니다')
      }

      // API 호출로 회원가입
      const result = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(userData)
      })

      return result
    } catch (error) {
      console.error('사용자 회원가입 실패:', error)
      throw error
    }
  }

  // 사용자 로그인
  async loginUser(credentials: LoginCredentials): Promise<{ user: any; token: string }> {
    try {
      // API 호출로 로그인
      const result = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials)
      })

      return result
    } catch (error) {
      console.error('사용자 로그인 실패:', error)
      throw error
    }
  }

  // 관리자 회원가입
  async registerAdmin(adminData: AdminRegistrationData): Promise<{ admin: any; token: string }> {
    try {
      // 입력값 검증
      if (!isValidEmail(adminData.email)) {
        throw new Error('유효하지 않은 이메일 형식입니다')
      }

      if (!isStrongPassword(adminData.password)) {
        throw new Error('비밀번호는 최소 8자 이상이며, 대소문자, 숫자, 특수문자를 포함해야 합니다')
      }

      // API 호출로 관리자 회원가입
      const result = await apiCall('/auth/admin/register', {
        method: 'POST',
        body: JSON.stringify(adminData)
      })

      return result
    } catch (error) {
      console.error('관리자 회원가입 실패:', error)
      throw error
    }
  }

  // 관리자 로그인
  async loginAdmin(credentials: AdminLoginCredentials): Promise<{ admin: any; token: string }> {
    try {
      console.log('🔐 관리자 로그인 시도:', credentials);
      
      // MongoDB API로 관리자 로그인
      const apiBaseUrl = window.location.hostname === 'localhost' 
        ? 'http://localhost:3001'
        : 'https://allthingbucket.com';
      
      const response = await fetch(`${apiBaseUrl}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: credentials.admin_name,
          password: credentials.password
        })
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '로그인에 실패했습니다');
      }
      
      console.log('✅ 관리자 로그인 성공:', result);
      
      return {
        admin: result.data,
        token: 'admin_token_' + Date.now() // 임시 토큰
      };
    } catch (error) {
      console.error('관리자 로그인 실패:', error);
      throw error;
    }
  }

  // 사용자 ID로 사용자 정보 조회
  async getUserById(userId: string): Promise<any> {
    try {
      const result = await apiCall(`/users/${userId}`)
      return result
    } catch (error) {
      console.error('사용자 조회 실패:', error)
      throw error
    }
  }

  // 관리자 ID로 관리자 정보 조회
  async getAdminById(adminId: string): Promise<any> {
    try {
      const result = await apiCall(`/admins/${adminId}`)
      return result
    } catch (error) {
      console.error('관리자 조회 실패:', error)
      throw error
    }
  }
}

export const authService = new AuthService()
