const { createClient } = require('@supabase/supabase-js');

class SupabaseService {
  constructor() {
    // Supabase 설정
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8';
    
    // Supabase 클라이언트 초기화 (임시로 비활성화)
    try {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    } catch (error) {
      console.log('⚠️ Supabase 연결 실패, 임시로 비활성화:', error.message);
      this.supabase = null;
    }
    
    console.log('🔗 Supabase 클라이언트 초기화:');
    console.log('  - SUPABASE_URL:', this.supabaseUrl ? '설정됨' : '설정되지 않음');
    console.log('  - SUPABASE_ANON_KEY:', this.supabaseKey ? '설정됨' : '설정되지 않음');
    
    // 연결 테스트
    this.testConnection();
  }

  // 연결 테스트
  async testConnection() {
    try {
      console.log('🔗 Supabase 연결 테스트 중...');
      
      // 간단한 쿼리로 연결 테스트
      const { data, error } = await this.supabase
        .from('campaigns')
        .select('count')
        .limit(1);
      
      if (error) {
        console.error('❌ Supabase 연결 실패:', error);
        return false;
      }
      
      console.log('✅ Supabase 연결 성공!');
      return true;
    } catch (error) {
      console.error('❌ Supabase 연결 테스트 실패:', error);
      return false;
    }
  }

  // 캠페인 목록 조회 (entities 구조에 맞게 수정)
  async getCampaigns(options = {}) {
    try {
      console.log('🔍 Supabase getCampaigns 호출됨:', options);
      console.log('🔍 Supabase 클라이언트 상태:', this.supabase ? '초기화됨' : '초기화 안됨');
      
      let query = this.supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (options.filter && options.filter.campaign_id) {
        query = query.eq('id', options.filter.campaign_id);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      console.log('🔍 Supabase 쿼리 실행 중...');
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 캠페인 조회 실패:', error);
        console.error('❌ 에러 상세:', error.message);
        console.error('❌ 에러 코드:', error.code);
        return [];
      }
      
      console.log('🔍 Supabase 조회된 캠페인 수:', data ? data.length : 0);
      
      if (data && data.length > 0) {
        console.log('🔍 첫 번째 캠페인:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('⚠️ Supabase에서 캠페인 데이터가 없습니다');
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 캠페인 조회 실패:', error);
      console.error('❌ 에러 상세:', error.message);
      console.error('❌ 에러 스택:', error.stack);
      return [];
    }
  }

  // 캠페인 생성
  async createCampaign(campaignData) {
    try {
      const { data, error } = await this.supabase
        .from('campaigns')
        .insert([campaignData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 캠페인 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 캠페인 생성 실패:', error);
      return null;
    }
  }

  // 캠페인 업데이트
  async updateCampaign(id, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('campaigns')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Supabase 캠페인 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 캠페인 업데이트 실패:', error);
      return null;
    }
  }

  // 캠페인 삭제
  async deleteCampaign(id) {
    try {
      const { error } = await this.supabase
        .from('campaigns')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Supabase 캠페인 삭제 실패:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('❌ Supabase 캠페인 삭제 실패:', error);
      return false;
    }
  }

  // 사용자 프로필 조회
  async getUserProfiles(options = {}) {
    try {
      let query = this.supabase
        .from('user_profiles')
        .select('*');
      
      if (options.filter && options.filter.user_id) {
        query = query.eq('user_id', options.filter.user_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 사용자 프로필 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 사용자 프로필 조회 실패:', error);
      return [];
    }
  }

  // 사용자 프로필 생성
  async createUserProfile(profileData) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .insert([profileData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 프로필 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 프로필 생성 실패:', error);
      return null;
    }
  }

  // 사용자 프로필 업데이트
  async updateUserProfile(id, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('user_profiles')
        .update(updateData)
        .eq('id', id)
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 프로필 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 프로필 업데이트 실패:', error);
      return null;
    }
  }

  // 사용자 리뷰 조회
  async getUserReviews(options = {}) {
    try {
      let query = this.supabase
        .from('user_reviews')
        .select('*');
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 사용자 리뷰 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 사용자 리뷰 조회 실패:', error);
      return [];
    }
  }

  // 관리자 로그인
  async loginAdmin(username, password) {
    try {
      console.log('🔐 Supabase 관리자 로그인 시도:', username);
      
      const { data, error } = await this.supabase
        .from('admin_users')
        .select('*')
        .eq('username', username)
        .eq('password', password)
        .single();
      
      if (error) {
        console.error('❌ Supabase 관리자 로그인 실패:', error);
        return null;
      }
      
      console.log('✅ Supabase 관리자 로그인 성공:', data.username);
      
      // 마지막 로그인 시간 업데이트
      await this.supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);
      
      return data;
    } catch (error) {
      console.error('❌ Supabase 관리자 로그인 실패:', error);
      return null;
    }
  }

  // ===== 추가 CRUD 메서드들 =====

  // 사용자 생성
  async createUser(userData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .insert([userData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 생성 실패:', error);
      return null;
    }
  }

  // 사용자 조회
  async getUser(userId) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ Supabase 사용자 조회 실패:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Supabase 사용자 조회 실패:', error);
      return null;
    }
  }

  // 사용자 목록 조회 (필터링 지원)
  async getUsers(filter = {}) {
    try {
      let query = this.supabase
        .from('users')
        .select('*');
      
      // 필터 적용
      if (filter.email) {
        query = query.eq('email', filter.email);
      }
      if (filter.name) {
        query = query.eq('name', filter.name);
      }
      if (filter.phone) {
        query = query.eq('phone', filter.phone);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 사용자 목록 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 사용자 목록 조회 실패:', error);
      return [];
    }
  }

  // 사용자 업데이트
  async updateUser(userId, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .update(updateData)
        .eq('id', userId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 업데이트 실패:', error);
      return null;
    }
  }

  // 사용자 신청 생성
  async createUserApplication(applicationData) {
    try {
      const { data, error } = await this.supabase
        .from('user_applications')
        .insert([applicationData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 신청 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 신청 생성 실패:', error);
      return null;
    }
  }

  // 사용자 신청 조회
  async getUserApplications(options = {}) {
    try {
      let query = this.supabase
        .from('user_applications')
        .select('*');
      
      if (options.user_id) {
        query = query.eq('user_id', options.user_id);
      }
      
      if (options.campaign_id) {
        query = query.eq('campaign_id', options.campaign_id);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 사용자 신청 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 사용자 신청 조회 실패:', error);
      return [];
    }
  }

  // 사용자 신청 업데이트
  async updateUserApplication(applicationId, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('user_applications')
        .update(updateData)
        .eq('id', applicationId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 신청 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 신청 업데이트 실패:', error);
      return null;
    }
  }

  // 사용자 리뷰 생성
  async createUserReview(reviewData) {
    try {
      const { data, error } = await this.supabase
        .from('user_reviews')
        .insert([reviewData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 리뷰 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 리뷰 생성 실패:', error);
      return null;
    }
  }

  // 사용자 리뷰 업데이트
  async updateUserReview(reviewId, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('user_reviews')
        .update(updateData)
        .eq('id', reviewId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 리뷰 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 리뷰 업데이트 실패:', error);
      return null;
    }
  }

  // 포인트 조회
  async getUserPoints(userId) {
    try {
      const { data, error } = await this.supabase
        .from('user_points')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (error) {
        console.error('❌ Supabase 사용자 포인트 조회 실패:', error);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('❌ Supabase 사용자 포인트 조회 실패:', error);
      return null;
    }
  }

  // 포인트 업데이트
  async updateUserPoints(userId, pointsData) {
    try {
      const { data, error } = await this.supabase
        .from('user_points')
        .upsert([{ user_id: userId, ...pointsData }])
        .select();
      
      if (error) {
        console.error('❌ Supabase 사용자 포인트 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 사용자 포인트 업데이트 실패:', error);
      return null;
    }
  }

  // 포인트 히스토리 추가
  async addPointsHistory(historyData) {
    try {
      const { data, error } = await this.supabase
        .from('points_history')
        .insert([historyData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 포인트 히스토리 추가 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 포인트 히스토리 추가 실패:', error);
      return null;
    }
  }

  // 포인트 히스토리 조회
  async getPointsHistory(userId, options = {}) {
    try {
      let query = this.supabase
        .from('points_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 포인트 히스토리 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 포인트 히스토리 조회 실패:', error);
      return [];
    }
  }

  // 알림 생성
  async createNotification(notificationData) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .insert([notificationData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 알림 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 알림 생성 실패:', error);
      return null;
    }
  }

  // 사용자 알림 조회
  async getUserNotifications(userId, options = {}) {
    try {
      let query = this.supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (options.is_read !== undefined) {
        query = query.eq('is_read', options.is_read);
      }
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 사용자 알림 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 사용자 알림 조회 실패:', error);
      return [];
    }
  }

  // 알림 읽음 처리
  async markNotificationAsRead(notificationId) {
    try {
      const { data, error } = await this.supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 알림 읽음 처리 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 알림 읽음 처리 실패:', error);
      return null;
    }
  }

  // 출금 요청 생성
  async createWithdrawalRequest(withdrawalData) {
    try {
      const { data, error } = await this.supabase
        .from('withdrawal_requests')
        .insert([withdrawalData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 출금 요청 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 출금 요청 생성 실패:', error);
      return null;
    }
  }

  // 출금 요청 조회
  async getWithdrawalRequests(options = {}) {
    try {
      let query = this.supabase
        .from('withdrawal_requests')
        .select('*')
        .order('requested_at', { ascending: false });
      
      if (options.user_id) {
        query = query.eq('user_id', options.user_id);
      }
      
      if (options.status) {
        query = query.eq('status', options.status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 출금 요청 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 출금 요청 조회 실패:', error);
      return [];
    }
  }

  // 출금 요청 업데이트
  async updateWithdrawalRequest(requestId, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('withdrawal_requests')
        .update(updateData)
        .eq('id', requestId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 출금 요청 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 출금 요청 업데이트 실패:', error);
      return null;
    }
  }

  // 체험단 코드 생성
  async createExperienceCode(codeData) {
    try {
      const { data, error } = await this.supabase
        .from('experience_codes')
        .insert([codeData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 체험단 코드 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 체험단 코드 생성 실패:', error);
      return null;
    }
  }

  // 체험단 코드 조회
  async getExperienceCodes(options = {}) {
    try {
      let query = this.supabase
        .from('experience_codes')
        .select('*');
      
      if (options.campaign_id) {
        query = query.eq('campaign_id', options.campaign_id);
      }
      
      if (options.is_used !== undefined) {
        query = query.eq('is_used', options.is_used);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 체험단 코드 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 체험단 코드 조회 실패:', error);
      return [];
    }
  }

  // 체험단 코드 사용 처리
  async useExperienceCode(codeId, userId) {
    try {
      const { data, error } = await this.supabase
        .from('experience_codes')
        .update({ 
          is_used: true, 
          user_id: userId, 
          used_at: new Date().toISOString() 
        })
        .eq('id', codeId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 체험단 코드 사용 처리 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 체험단 코드 사용 처리 실패:', error);
      return null;
    }
  }

  // 인플루언서 프로필 생성
  async createInfluencerProfile(profileData) {
    try {
      const { data, error } = await this.supabase
        .from('influencer_profiles')
        .insert([profileData])
        .select();
      
      if (error) {
        console.error('❌ Supabase 인플루언서 프로필 생성 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 인플루언서 프로필 생성 실패:', error);
      return null;
    }
  }

  // 인플루언서 프로필 조회
  async getInfluencerProfiles(options = {}) {
    try {
      let query = this.supabase
        .from('influencer_profiles')
        .select('*');
      
      if (options.user_id) {
        query = query.eq('user_id', options.user_id);
      }
      
      if (options.platform) {
        query = query.eq('platform', options.platform);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 인플루언서 프로필 조회 실패:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 인플루언서 프로필 조회 실패:', error);
      return [];
    }
  }

  // 인플루언서 프로필 업데이트
  async updateInfluencerProfile(profileId, updateData) {
    try {
      const { data, error } = await this.supabase
        .from('influencer_profiles')
        .update(updateData)
        .eq('id', profileId)
        .select();
      
      if (error) {
        console.error('❌ Supabase 인플루언서 프로필 업데이트 실패:', error);
        return null;
      }
      
      return data[0];
    } catch (error) {
      console.error('❌ Supabase 인플루언서 프로필 업데이트 실패:', error);
      return null;
    }
  }

  // 데이터베이스 상태 확인
  async getDatabaseStatus() {
    try {
      // 각 테이블의 레코드 수 확인
      const [campaigns, users, userProfiles, userApplications, userReviews] = await Promise.all([
        this.supabase.from('campaigns').select('count', { count: 'exact', head: true }),
        this.supabase.from('users').select('count', { count: 'exact', head: true }),
        this.supabase.from('user_profiles').select('count', { count: 'exact', head: true }),
        this.supabase.from('user_applications').select('count', { count: 'exact', head: true }),
        this.supabase.from('user_reviews').select('count', { count: 'exact', head: true })
      ]);

      return {
        success: true,
        message: 'Supabase 데이터베이스 연결 정상',
        data: {
          connected: true,
          campaigns: campaigns.count || 0,
          users: users.count || 0,
          userProfiles: userProfiles.count || 0,
          userApplications: userApplications.count || 0,
          userReviews: userReviews.count || 0
        }
      };
    } catch (error) {
      console.error('❌ Supabase 데이터베이스 상태 확인 실패:', error);
      return {
        success: false,
        message: 'Supabase 데이터베이스 연결 실패',
        error: error.message
      };
    }
  }

  // 관리자 목록 조회
  async getAdmins(options = {}) {
    try {
      console.log('👑 Supabase getAdmins 호출됨:', options);
      
      let query = this.supabase
        .from('admins')
        .select('*');
      
      if (options.limit) {
        query = query.limit(options.limit);
      }
      
      if (options.filter && options.filter.admin_id) {
        query = query.eq('id', options.filter.admin_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('❌ Supabase 관리자 목록 조회 실패:', error);
        return [];
      }
      
      console.log('✅ Supabase 관리자 목록 조회 성공:', data?.length || 0, '개');
      return data || [];
    } catch (error) {
      console.error('❌ Supabase 관리자 목록 조회 실패:', error);
      return [];
    }
  }

  // 관리자 생성
  async createAdmin(adminData) {
    try {
      console.log('👑 Supabase createAdmin 호출됨:', adminData);
      
      const { data, error } = await this.supabase
        .from('admins')
        .insert([adminData])
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase 관리자 생성 실패:', error);
        return null;
      }
      
      console.log('✅ Supabase 관리자 생성 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ Supabase 관리자 생성 실패:', error);
      return null;
    }
  }

  // 관리자 수정
  async updateAdmin(adminId, updateData) {
    try {
      console.log('👑 Supabase updateAdmin 호출됨:', adminId, updateData);
      
      const { data, error } = await this.supabase
        .from('admins')
        .update(updateData)
        .eq('id', adminId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase 관리자 수정 실패:', error);
        return null;
      }
      
      console.log('✅ Supabase 관리자 수정 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ Supabase 관리자 수정 실패:', error);
      return null;
    }
  }

  // 관리자 삭제
  async deleteAdmin(adminId) {
    try {
      console.log('👑 Supabase deleteAdmin 호출됨:', adminId);
      
      const { data, error } = await this.supabase
        .from('admins')
        .delete()
        .eq('id', adminId)
        .select()
        .single();
      
      if (error) {
        console.error('❌ Supabase 관리자 삭제 실패:', error);
        return null;
      }
      
      console.log('✅ Supabase 관리자 삭제 성공:', data);
      return data;
    } catch (error) {
      console.error('❌ Supabase 관리자 삭제 실패:', error);
      return null;
    }
  }
}

module.exports = new SupabaseService();
