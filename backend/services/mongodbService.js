const { MongoClient } = require('mongodb');

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    // MongoDB Atlas 연결 문자열 (환경변수에서 가져오거나 기본값 사용)
    this.connectionString = process.env.MONGODB_URI || 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  }

  // MongoDB 연결
  async connect() {
    try {
      console.log('🔗 MongoDB Atlas 연결 시도 중...');
      
      this.client = new MongoClient(this.connectionString, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      });

      await this.client.connect();
      this.db = this.client.db('allthingbucket');
      
      console.log('✅ MongoDB Atlas 연결 성공!');
      console.log('📊 데이터베이스:', this.db.databaseName);
      
      // 컬렉션 초기화 및 샘플 데이터 삽입
      await this.initializeCollections();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB Atlas 연결 실패:', error);
      return false;
    }
  }

  // 컬렉션 초기화 및 샘플 데이터
  async initializeCollections() {
    try {
      console.log('📋 컬렉션 초기화 중...');

      // 사용자 프로필 컬렉션
      const userProfilesCollection = this.db.collection('user_profiles');
      const userProfilesCount = await userProfilesCollection.countDocuments();
      
      if (userProfilesCount === 0) {
        console.log('📝 샘플 사용자 프로필 데이터 삽입 중...');
        const sampleUsers = [
          {
            _id: 'user_1',
            user_id: 'user_1',
            signup_code: 'TEST001',
            name: '김인플루언서',
            email: 'influencer1@example.com',
            phone: '010-1234-5678',
            address: '서울시 강남구 테헤란로 123',
            birth_date: '1990-01-15',
            gender: 'female',
            naver_blog: 'https://blog.naver.com/influencer1',
            instagram_id: '@influencer1',
            youtube_channel: '인플루언서1 채널',
            tiktok_id: '@influencer1_tiktok',
            facebook_page: '인플루언서1 페이스북',
            other_sns: '트위터: @influencer1',
            follower_counts: {
              instagram: 50000,
              youtube: 30000,
              tiktok: 20000,
              naver_blog: 15000
            },
            categories: ['뷰티', '패션', '라이프스타일'],
            experience_level: 'expert',
            bank_name: '국민은행',
            account_number: '123456-78-901234',
            account_holder: '김인플루언서',
            tax_info: {
              resident_number: '900115-2******',
              business_number: '123-45-67890'
            },
            total_points_earned: 5000,
            total_points_withdrawn: 2000,
            current_balance: 3000,
            experience_count: 15,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            _id: 'user_2',
            user_id: 'user_2',
            signup_code: 'TEST002',
            name: '박리뷰어',
            email: 'reviewer2@example.com',
            phone: '010-2345-6789',
            address: '서울시 서초구 서초대로 456',
            birth_date: '1985-05-20',
            gender: 'male',
            naver_blog: 'https://blog.naver.com/reviewer2',
            instagram_id: '@reviewer2',
            youtube_channel: '리뷰어2 채널',
            tiktok_id: '@reviewer2_tiktok',
            facebook_page: '리뷰어2 페이스북',
            other_sns: '인스타그램: @reviewer2',
            follower_counts: {
              instagram: 30000,
              youtube: 25000,
              tiktok: 15000,
              naver_blog: 10000
            },
            categories: ['테크', '가전', '리뷰'],
            experience_level: 'intermediate',
            bank_name: '신한은행',
            account_number: '234567-89-012345',
            account_holder: '박리뷰어',
            tax_info: {
              resident_number: '850520-1******',
              business_number: '234-56-78901'
            },
            total_points_earned: 3000,
            total_points_withdrawn: 1000,
            current_balance: 2000,
            experience_count: 8,
            is_verified: true,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            _id: 'user_3',
            user_id: 'user_3',
            signup_code: 'TEST003',
            name: '이체험단',
            email: 'tester3@example.com',
            phone: '010-3456-7890',
            address: '서울시 송파구 올림픽로 789',
            birth_date: '1992-08-10',
            gender: 'female',
            naver_blog: 'https://blog.naver.com/tester3',
            instagram_id: '@tester3',
            youtube_channel: '체험단3 채널',
            tiktok_id: '@tester3_tiktok',
            facebook_page: '체험단3 페이스북',
            other_sns: '유튜브: 체험단3 채널',
            follower_counts: {
              instagram: 20000,
              youtube: 15000,
              tiktok: 10000,
              naver_blog: 8000
            },
            categories: ['푸드', '홈데코', '육아'],
            experience_level: 'beginner',
            bank_name: '우리은행',
            account_number: '345678-90-123456',
            account_holder: '이체험단',
            tax_info: {
              resident_number: '920810-2******',
              business_number: '345-67-89012'
            },
            total_points_earned: 1500,
            total_points_withdrawn: 500,
            current_balance: 1000,
            experience_count: 3,
            is_verified: false,
            created_at: new Date(),
            updated_at: new Date()
          }
        ];

        await userProfilesCollection.insertMany(sampleUsers);
        console.log('✅ 샘플 사용자 프로필 데이터 삽입 완료');
      }

      // 사용자 코드 컬렉션
      const userCodesCollection = this.db.collection('user_codes');
      const userCodesCount = await userCodesCollection.countDocuments();
      
      if (userCodesCount === 0) {
        console.log('🏷️ 샘플 사용자 코드 데이터 삽입 중...');
        const sampleCodes = [
          {
            _id: 'code_1',
            code: 'TEST001',
            user_id: 'user_1',
            is_used: true,
            used_at: new Date(),
            created_at: new Date()
          },
          {
            _id: 'code_2',
            code: 'TEST002',
            user_id: 'user_2',
            is_used: true,
            used_at: new Date(),
            created_at: new Date()
          },
          {
            _id: 'code_3',
            code: 'TEST003',
            user_id: 'user_3',
            is_used: true,
            used_at: new Date(),
            created_at: new Date()
          }
        ];

        await userCodesCollection.insertMany(sampleCodes);
        console.log('✅ 샘플 사용자 코드 데이터 삽입 완료');
      }

      // 체험단 캠페인 컬렉션
      const campaignsCollection = this.db.collection('campaigns');
      const campaignsCount = await campaignsCollection.countDocuments();
      
      if (campaignsCount === 0) {
        console.log('🎯 샘플 캠페인 데이터 삽입 중...');
        const sampleCampaigns = [
          {
            _id: 'campaign_1',
            title: '뷰티 제품 체험단 모집',
            description: '새로운 뷰티 제품을 체험해보실 분들을 모집합니다.',
            type: 'beauty',
            status: 'active',
            max_participants: 50,
            current_participants: 15,
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            application_start: new Date('2024-01-01'),
            application_end: new Date('2024-12-15'),
            content_start: new Date('2024-01-01'),
            content_end: new Date('2024-12-20'),
            requirements: '인스타그램 팔로워 1만명 이상',
            rewards: '제품 무료 제공 + 포인트 1000P',
            main_images: ['https://example.com/beauty1.jpg'],
            detail_images: ['https://example.com/beauty_detail1.jpg', 'https://example.com/beauty_detail2.jpg'],
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            _id: 'campaign_2',
            title: '테크 가전 제품 리뷰',
            description: '최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다.',
            type: 'tech',
            status: 'active',
            max_participants: 30,
            current_participants: 8,
            start_date: new Date('2024-01-01'),
            end_date: new Date('2024-12-31'),
            application_start: new Date('2024-01-01'),
            application_end: new Date('2024-12-10'),
            content_start: new Date('2024-01-01'),
            content_end: new Date('2024-12-15'),
            requirements: '유튜브 구독자 5천명 이상',
            rewards: '제품 무료 제공 + 포인트 2000P',
            main_images: ['https://example.com/tech1.jpg'],
            detail_images: ['https://example.com/tech_detail1.jpg'],
            created_at: new Date(),
            updated_at: new Date()
          }
        ];

        await campaignsCollection.insertMany(sampleCampaigns);
        console.log('✅ 샘플 캠페인 데이터 삽입 완료');
      }

      console.log('🎉 모든 컬렉션 초기화 완료!');
    } catch (error) {
      console.error('❌ 컬렉션 초기화 실패:', error);
    }
  }

  // 사용자 프로필 목록 조회
  async getUserProfiles(options = {}) {
    try {
      const collection = this.db.collection('user_profiles');
      let query = {};

      if (options.filter && options.filter.user_id) {
        query.user_id = options.filter.user_id;
      }

      const cursor = collection.find(query);
      
      if (options.limit) {
        cursor.limit(options.limit);
      }

      const results = await cursor.toArray();
      console.log(`📋 사용자 프로필 조회: ${results.length}개`);
      return results;
    } catch (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error);
      return [];
    }
  }

  // 사용자 프로필 조회
  async getUserProfile(id) {
    try {
      const collection = this.db.collection('user_profiles');
      const result = await collection.findOne({ _id: id });
      console.log(`👤 사용자 프로필 조회: ${result ? '발견됨' : '없음'}`);
      return result;
    } catch (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error);
      return null;
    }
  }

  // 사용자 프로필 삭제
  async deleteUserProfile(id) {
    try {
      const collection = this.db.collection('user_profiles');
      const result = await collection.deleteOne({ _id: id });
      console.log(`🗑️ 사용자 프로필 삭제: ${result.deletedCount}개`);
      return { success: true, deletedRows: result.deletedCount };
    } catch (error) {
      console.error('❌ 사용자 프로필 삭제 실패:', error);
      return { success: false, message: error.message };
    }
  }

  // 사용자 코드 목록 조회
  async getUserCodes(options = {}) {
    try {
      const collection = this.db.collection('user_codes');
      let query = {};

      if (options.filter && options.filter.user_id) {
        query.user_id = options.filter.user_id;
      }

      const cursor = collection.find(query);
      
      if (options.limit) {
        cursor.limit(options.limit);
      }

      const results = await cursor.toArray();
      console.log(`🏷️ 사용자 코드 조회: ${results.length}개`);
      return results;
    } catch (error) {
      console.error('❌ 사용자 코드 조회 실패:', error);
      return [];
    }
  }

  // 인플루언서 프로필 목록 조회 (user_profiles와 동일)
  async getInfluencerProfiles(options = {}) {
    return await this.getUserProfiles(options);
  }

  // 사용자 신청 목록 조회
  async getUserApplications(options = {}) {
    try {
      const collection = this.db.collection('user_applications');
      let query = {};

      if (options.filter && options.filter.user_id) {
        query.user_id = options.filter.user_id;
      }

      const cursor = collection.find(query);
      
      if (options.limit) {
        cursor.limit(options.limit);
      }

      const results = await cursor.toArray();
      console.log(`📋 사용자 신청 조회: ${results.length}개`);
      return results;
    } catch (error) {
      console.error('❌ 사용자 신청 조회 실패:', error);
      return [];
    }
  }

  // 체험단 코드 목록 조회
  async getExperienceCodes(options = {}) {
    try {
      const collection = this.db.collection('experience_codes');
      let query = {};

      if (options.filter && options.filter.campaign_id) {
        query.campaign_id = options.filter.campaign_id;
      }

      const cursor = collection.find(query);
      
      if (options.limit) {
        cursor.limit(options.limit);
      }

      const results = await cursor.toArray();
      console.log(`🎯 체험단 코드 조회: ${results.length}개`);
      return results;
    } catch (error) {
      console.error('❌ 체험단 코드 조회 실패:', error);
      return [];
    }
  }

  // 캠페인 목록 조회
  async getCampaigns(options = {}) {
    try {
      const collection = this.db.collection('campaigns');
      let query = {};

      if (options.filter && options.filter.status) {
        query.status = options.filter.status;
      }

      const cursor = collection.find(query);
      
      if (options.limit) {
        cursor.limit(options.limit);
      }

      const results = await cursor.toArray();
      console.log(`🎯 캠페인 조회: ${results.length}개`);
      return results;
    } catch (error) {
      console.error('❌ 캠페인 조회 실패:', error);
      return [];
    }
  }

  // 연결 종료
  // 관리자 관련 메서드들
  async getAdminByUsername(username) {
    try {
      const collection = this.db.collection('admins');
      const admin = await collection.findOne({ username: username, is_active: true });
      return admin;
    } catch (error) {
      console.error('❌ 관리자 조회 실패:', error);
      throw error;
    }
  }

  async updateAdminLastLogin(adminId) {
    try {
      const collection = this.db.collection('admins');
      await collection.updateOne(
        { _id: adminId },
        { 
          $set: { 
            last_login: new Date(),
            updated_at: new Date()
          }
        }
      );
    } catch (error) {
      console.error('❌ 관리자 로그인 시간 업데이트 실패:', error);
      throw error;
    }
  }

  async getAdmins(options = {}) {
    try {
      const collection = this.db.collection('admins');
      let query = {};
      
      if (options.filter) {
        query = { ...query, ...options.filter };
      }
      
      let cursor = collection.find(query);
      
      if (options.sort) {
        cursor = cursor.sort(options.sort);
      }
      
      if (options.limit) {
        cursor = cursor.limit(options.limit);
      }
      
      const admins = await cursor.toArray();
      return admins;
    } catch (error) {
      console.error('❌ 관리자 목록 조회 실패:', error);
      throw error;
    }
  }

  async close() {
    try {
      if (this.client) {
        await this.client.close();
        console.log('✅ MongoDB 연결 종료');
      }
    } catch (error) {
      console.error('❌ MongoDB 연결 종료 실패:', error);
    }
  }
}

module.exports = new MongoDBService();
