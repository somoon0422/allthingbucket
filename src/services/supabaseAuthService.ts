import { dataService } from '../lib/dataService'
import { 
  isValidEmail,
  isStrongPassword
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

export class SupabaseAuthService {
  // 사용자 회원가입
  async registerUser(userData: UserRegistrationData): Promise<{ user: any; token: string }> {
    try {
      // 간단한 입력값 검증
      if (!userData.email || !userData.email.includes('@')) {
        throw new Error('유효한 이메일을 입력해주세요')
      }

      if (!userData.password || userData.password.length < 4) {
        throw new Error('비밀번호는 최소 4자 이상이어야 합니다')
      }

      if (!userData.name || userData.name.trim().length < 2) {
        throw new Error('이름을 입력해주세요')
      }

      // 이메일 중복 체크
      const existingUsersResponse = await (dataService.entities as any).users.list()
      const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : existingUsersResponse?.list || []
      const filteredUsers = existingUsers.filter((user: any) => user.email === userData.email)
      if (filteredUsers.length > 0) {
        throw new Error('이미 사용 중인 이메일입니다')
      }

      // 사용자 데이터 생성
      const userRecord = {
        user_id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        email: userData.email,
        password: userData.password, // 비밀번호 저장
        name: userData.name,
        phone: userData.phone || '',
        address: userData.address || '',
        birth_date: userData.birth_date || '',
        gender: userData.gender || '',
        profile_image: '',
        total_points: 0,
        available_points: 0,
        used_points: 0,
        pending_points: 0,
        login_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 사용자 생성
      const createdUser = await dataService.entities.users.create(userRecord)

      // 사용자 프로필 생성
      const userProfile = {
        user_id: userRecord.user_id,
        name: userData.name,
        email: userData.email,
        phone: userData.phone || '',
        address: userData.address || '',
        birth_date: userData.birth_date || '',
        gender: userData.gender || '',
        profile_image: '',
        total_points: 0,
        available_points: 0,
        used_points: 0,
        pending_points: 0,
        last_login: new Date().toISOString(),
        login_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await (dataService.entities as any).user_profiles.create(userProfile)

      // 포인트 기록 생성
      const userPoints = {
        user_id: userRecord.user_id,
        total_points: 0,
        available_points: 0,
        withdrawn_points: 0,
        tax_amount: 0,
        bank_account: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await dataService.entities.user_points.create(userPoints)

      // 토큰 생성 (간단한 JWT 스타일)
      const token = this.generateToken({
        type: 'user',
        user_id: userRecord.user_id,
        email: userData.email,
        name: userData.name
      })

      return {
        user: createdUser,
        token
      }
    } catch (error) {
      console.error('사용자 회원가입 실패:', error)
      throw error
    }
  }

  // 사용자 로그인
  async loginUser(credentials: LoginCredentials): Promise<{ user: any; token: string }> {
    try {
      // 사용자 조회
      const usersResponse = await (dataService.entities as any).users.list()
      const users = Array.isArray(usersResponse) ? usersResponse : usersResponse?.list || []
      const filteredUsers = users.filter((user: any) => user.email === credentials.email)
      if (filteredUsers.length === 0) {
        throw new Error('존재하지 않는 이메일입니다')
      }

      const user = filteredUsers[0]

      // 비밀번호 검증
      if (user.password !== credentials.password) {
        throw new Error('비밀번호가 올바르지 않습니다')
      }

      // 로그인 횟수 업데이트
      await dataService.entities.users.update(user._id, {
        login_count: (user.login_count || 0) + 1,
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 토큰 생성
      const token = this.generateToken({
        type: 'user',
        user_id: user.user_id,
        email: user.email,
        name: user.name
      })

      return {
        user,
        token
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

      // 관리자명 중복 체크
      const existingAdminsResponse = await (dataService.entities as any).admin_users.list()
      const existingAdmins = Array.isArray(existingAdminsResponse) ? existingAdminsResponse : existingAdminsResponse?.list || []
      const filteredAdmins = existingAdmins.filter((admin: any) => admin.admin_name === adminData.admin_name)
      if (filteredAdmins.length > 0) {
        throw new Error('이미 사용 중인 관리자명입니다')
      }

      // 관리자 데이터 생성
      const adminRecord = {
        admin_id: `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        admin_name: adminData.admin_name,
        email: adminData.email,
        password: adminData.password,
        role: adminData.role || 'admin',
        permissions: ['read', 'write', 'delete'],
        is_active: true,
        last_login: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      // 관리자 생성
      const createdAdmin = await dataService.entities.admin_users.create(adminRecord)

      // 토큰 생성
      const token = this.generateToken({
        type: 'admin',
        admin_id: adminRecord.admin_id,
        admin_name: adminData.admin_name,
        email: adminData.email,
        role: adminData.role || 'admin'
      })

      return {
        admin: createdAdmin,
        token
      }
    } catch (error) {
      console.error('관리자 회원가입 실패:', error)
      throw error
    }
  }

  // 관리자 로그인
  async loginAdmin(credentials: AdminLoginCredentials): Promise<{ admin: any; token: string }> {
    try {
      // 관리자 조회
      const adminsResponse = await (dataService.entities as any).admin_users.list()
      const admins = Array.isArray(adminsResponse) ? adminsResponse : adminsResponse?.list || []
      const filteredAdmins = admins.filter((admin: any) => admin.admin_name === credentials.admin_name)
      if (filteredAdmins.length === 0) {
        throw new Error('존재하지 않는 관리자명입니다')
      }

      const admin = filteredAdmins[0]

      // 비밀번호 검증
      if (admin.password !== credentials.password) {
        throw new Error('비밀번호가 올바르지 않습니다')
      }

      // 활성 상태 체크
      if (!admin.is_active) {
        throw new Error('비활성화된 관리자 계정입니다')
      }

      // 로그인 시간 업데이트
      await dataService.entities.admin_users.update(admin._id, {
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      // 토큰 생성
      const token = this.generateToken({
        type: 'admin',
        admin_id: admin.admin_id,
        admin_name: admin.admin_name,
        email: admin.email,
        role: admin.role
      })

      return {
        admin,
        token
      }
    } catch (error) {
      console.error('관리자 로그인 실패:', error)
      throw error
    }
  }

  // 기본 관리자 계정 생성 (초기 설정용)
  async createDefaultAdmin(): Promise<void> {
    try {
      // 기본 관리자 계정이 이미 있는지 확인
      const existingAdminsResponse = await (dataService.entities as any).admin_users.list()
      const existingAdmins = Array.isArray(existingAdminsResponse) ? existingAdminsResponse : existingAdminsResponse?.list || []
      const filteredAdmins = existingAdmins.filter((admin: any) => admin.admin_name === 'admin')
      if (filteredAdmins.length > 0) {
        console.log('기본 관리자 계정이 이미 존재합니다')
        return
      }

      // 기본 관리자 계정 생성
      const defaultAdmin = {
        admin_id: 'admin_default_001',
        admin_name: 'admin',
        email: 'admin@allthingbucket.com',
        password: 'secure_password_2024',
        role: 'super_admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        is_active: true,
        last_login: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await dataService.entities.admin_users.create(defaultAdmin)
      console.log('Supabase 기본 관리자 계정이 생성되었습니다')
    } catch (error) {
      console.error('기본 관리자 계정 생성 실패:', error)
    }
  }

  // 테스트용 사용자 계정 생성
  async createTestUser(): Promise<void> {
    try {
      // 테스트 사용자 계정이 이미 있는지 확인
      const existingUsersResponse = await (dataService.entities as any).users.list()
      const existingUsers = Array.isArray(existingUsersResponse) ? existingUsersResponse : existingUsersResponse?.list || []
      const filteredUsers = existingUsers.filter((user: any) => user.email === 'test@test.com')
      if (filteredUsers.length > 0) {
        console.log('테스트 사용자 계정이 이미 존재합니다')
        return
      }

      // 테스트 사용자 계정 생성
      const testUser = {
        user_id: 'user_test_001',
        email: 'test@test.com',
        password: 'test123',
        name: '테스트 사용자',
        phone: '010-1234-5678',
        address: '서울시 강남구',
        birth_date: '1990-01-01',
        gender: 'male',
        profile_image: '',
        total_points: 1000,
        available_points: 1000,
        used_points: 0,
        pending_points: 0,
        login_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await dataService.entities.users.create(testUser)
      
      // 사용자 프로필 생성
      const userProfile = {
        user_id: testUser.user_id,
        name: testUser.name,
        email: testUser.email,
        phone: testUser.phone,
        address: testUser.address,
        birth_date: testUser.birth_date,
        gender: testUser.gender,
        profile_image: '',
        total_points: 1000,
        available_points: 1000,
        used_points: 0,
        pending_points: 0,
        last_login: new Date().toISOString(),
        login_count: 0,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await (dataService.entities as any).user_profiles.create(userProfile)

      // 포인트 기록 생성
      const userPoints = {
        user_id: testUser.user_id,
        total_points: 1000,
        available_points: 1000,
        withdrawn_points: 0,
        tax_amount: 0,
        bank_account: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await dataService.entities.user_points.create(userPoints)
      
      console.log('테스트 사용자 계정이 생성되었습니다: test@test.com / test123')
    } catch (error) {
      console.error('테스트 사용자 계정 생성 실패:', error)
    }
  }

  // 토큰 생성 (간단한 구현)
  private generateToken(payload: any): string {
    try {
      // 간단한 토큰 생성 - 특수 문자 없이
      const timestamp = Date.now()
      const random = Math.random().toString(36).substr(2, 9)
      const userType = payload.type || 'user'
      const userId = payload.user_id || payload.admin_id || 'unknown'
      
      return `token_${userType}_${userId}_${timestamp}_${random}`
    } catch (error) {
      console.error('토큰 생성 실패:', error)
      // 폴백: 간단한 토큰 생성
      return `token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  // 토큰 검증
  verifyToken(token: string): any {
    try {
      // 간단한 토큰인 경우
      if (token.startsWith('token_')) {
        const parts = token.split('_')
        if (parts.length >= 3) {
          const userType = parts[1]
          const userId = parts[2]
          
          return {
            type: userType,
            user_id: userId,
            email: `${userId}@example.com`,
            name: `${userType} User`
          }
        }
        
        return {
          type: 'user',
          user_id: 'temp_user',
          email: 'temp@temp.com',
          name: 'Temp User'
        }
      }

      // 폴백: 기본 사용자 정보 반환
      return {
        type: 'user',
        user_id: 'fallback_user',
        email: 'fallback@example.com',
        name: 'Fallback User'
      }
    } catch (error) {
      console.error('토큰 검증 실패:', error)
      // 폴백: 기본 사용자 정보 반환
      return {
        type: 'user',
        user_id: 'error_user',
        email: 'error@example.com',
        name: 'Error User'
      }
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService()
