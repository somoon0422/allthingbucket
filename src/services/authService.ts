import { dataService } from '../lib/dataService'
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

      // Supabase Auth를 사용한 회원가입
      const result = await dataService.auth.signUp({
        email: userData.email,
        password: userData.password
      })

      if (!result.data.user) {
        throw new Error('회원가입에 실패했습니다')
      }

      // 사용자 프로필 생성
      const profileData = {
        id: result.data.user.id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone,
        address: userData.address,
        birth_date: userData.birth_date,
        gender: userData.gender,
        created_at: new Date().toISOString()
      }
      
      await dataService.entities.user_profiles.create(profileData)

      return {
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: userData.name,
          profile: profileData
        },
        token: result.data.session?.access_token || ''
      }
    } catch (error) {
      console.error('사용자 회원가입 실패:', error)
      throw error
    }
  }

  // 사용자 로그인
  async loginUser(credentials: LoginCredentials): Promise<{ user: any; token: string }> {
    try {
      // Supabase Auth를 사용한 로그인
      const result = await dataService.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (!result.data.user) {
        throw new Error('로그인에 실패했습니다')
      }

      // 사용자 프로필 정보 가져오기
      const profile = await dataService.entities.user_profiles.get(result.data.user.id)

      return {
        user: {
          id: result.data.user.id,
          email: result.data.user.email,
          name: profile?.name || result.data.user.email?.split('@')[0] || '사용자',
          profile: profile
        },
        token: result.data.session?.access_token || ''
      }
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

      // 관리자 계정 생성
      const adminAccount = {
        username: adminData.admin_name,
        email: adminData.email,
        password: adminData.password, // 실제로는 해시화해야 함
        role: adminData.role || 'admin',
        is_active: true,
        created_at: new Date().toISOString()
      }

      const result = await dataService.entities.admin_users.create(adminAccount)

      return {
        admin: result.data,
        token: 'admin_token_' + Date.now() // 임시 토큰
      }
    } catch (error) {
      console.error('관리자 회원가입 실패:', error)
      throw error
    }
  }

  // 관리자 로그인
  async loginAdmin(credentials: AdminLoginCredentials): Promise<{ admin: any; token: string }> {
    try {
      console.log('🔐 관리자 로그인 시도:', credentials);
      
      // Supabase에서 관리자 정보 조회
      const admins = await dataService.entities.admin_users.list()
      const admin = admins.find((a: any) => a.username === credentials.admin_name)
      
      if (!admin) {
        throw new Error('관리자를 찾을 수 없습니다')
      }
      
      // 비밀번호 확인 (실제로는 해시된 비밀번호를 비교해야 함)
      if (admin.password !== credentials.password) {
        throw new Error('비밀번호가 일치하지 않습니다')
      }
      
      console.log('✅ 관리자 로그인 성공:', admin);
      
      return {
        admin: admin,
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
      const profile = await dataService.entities.user_profiles.get(userId)
      return profile
    } catch (error) {
      console.error('사용자 조회 실패:', error)
      throw error
    }
  }

  // 관리자 ID로 관리자 정보 조회
  async getAdminById(adminId: string): Promise<any> {
    try {
      const admin = await dataService.entities.admin_users.get(adminId)
      return admin
    } catch (error) {
      console.error('관리자 조회 실패:', error)
      throw error
    }
  }
}

export const authService = new AuthService()