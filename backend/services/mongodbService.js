const { MongoClient } = require('mongodb');

class MongoDBService {
  constructor() {
    this.client = null;
    this.db = null;
    // MongoDB Atlas 연결 문자열 (환경변수에서 가져오거나 기본값 사용)
    this.connectionString = process.env.MONGODB_URI || 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true&authSource=admin';
    
    // 🔥 Vercel 환경에서 환경변수가 제대로 로드되지 않는 경우를 대비한 하드코딩
    if (!this.connectionString || this.connectionString === 'undefined') {
      this.connectionString = 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true&authSource=admin';
    }
    
    // 🔥 데이터베이스 이름이 누락된 경우 추가
    if (this.connectionString && !this.connectionString.includes('/allthingbucket')) {
      this.connectionString = this.connectionString.replace('mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/?', 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?');
    }
    
    console.log('🔗 MongoDB 연결 문자열 설정:');
    console.log('  - MONGODB_URI 환경변수:', process.env.MONGODB_URI ? '설정됨' : '설정되지 않음');
    console.log('  - 사용할 연결 문자열:', this.connectionString ? '설정됨' : '설정되지 않음');
  }

  // MongoDB 연결
  async connect() {
    try {
      console.log('🔗 MongoDB Atlas 연결 시도 중...');
      console.log('🔗 연결 문자열:', this.connectionString ? '설정됨' : '설정되지 않음');
      console.log('🔗 NODE_ENV:', process.env.NODE_ENV);
      
      this.client = new MongoClient(this.connectionString, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
        serverSelectionTimeoutMS: 10000, // 10초 타임아웃
        connectTimeoutMS: 30000, // 30초 연결 타임아웃
        maxPoolSize: 10, // 연결 풀 크기 제한
        minPoolSize: 1, // 최소 연결 풀 크기
        maxIdleTimeMS: 30000, // 30초 유휴 시간
        retryWrites: true,
        retryReads: true,
      });

      await this.client.connect();
      this.db = this.client.db('allthingbucket');
      
      // 연결 테스트
      await this.db.admin().ping();
      
      console.log('✅ MongoDB Atlas 연결 성공!');
      console.log('📊 데이터베이스:', this.db.databaseName);
      
      // 컬렉션 초기화
      await this.initializeCollections();
      
      return true;
    } catch (error) {
      console.error('❌ MongoDB Atlas 연결 실패:', error);
      console.error('❌ 에러 상세:', error.message);
      console.error('❌ 에러 코드:', error.code);
      return false;
    }
  }

  // 컬렉션 초기화
  async initializeCollections() {
    try {
      console.log('📋 컬렉션 초기화 중...');
      console.log('📋 NODE_ENV:', process.env.NODE_ENV);
      console.log('📋 MONGODB_URI 설정됨:', !!process.env.MONGODB_URI);

      // 컬렉션 존재 확인
      const collections = await this.db.listCollections().toArray();
      console.log('📋 기존 컬렉션:', collections.map(c => c.name));

      // 각 컬렉션의 문서 수 확인
      const userProfilesCount = await this.db.collection('user_profiles').countDocuments();
      const userCodesCount = await this.db.collection('user_codes').countDocuments();
      const campaignsCount = await this.db.collection('campaigns').countDocuments();
      
      console.log('📊 컬렉션 문서 수:');
      console.log('  - user_profiles:', userProfilesCount);
      console.log('  - user_codes:', userCodesCount);
      console.log('  - campaigns:', campaignsCount);

      // 🔥 기존 campaigns 데이터 마이그레이션
      await this.migrateCampaignsData();

      // 🔥 관리자 계정 초기화
      await this.initializeAdminAccount();

      console.log('🎉 컬렉션 초기화 완료!');
    } catch (error) {
      console.error('❌ 컬렉션 초기화 실패:', error);
    }
  }

  // 🔥 기존 campaigns 데이터 마이그레이션
  async migrateCampaignsData() {
    try {
      console.log('🔄 campaigns 데이터 마이그레이션 시작...');
      
      const campaignsCollection = this.db.collection('campaigns');
      const existingCampaigns = await campaignsCollection.find({}).toArray();
      
      console.log(`📊 기존 캠페인 수: ${existingCampaigns.length}개`);
      
      for (const campaign of existingCampaigns) {
        const updateData = {};
        let needsUpdate = false;
        
        // 필드명 통일 및 누락된 필드 추가
        if (campaign.recruitment_count && !campaign.max_participants) {
          updateData.max_participants = campaign.recruitment_count;
          needsUpdate = true;
        }
        
        if (campaign.campaign_name && !campaign.title && !campaign.experience_name) {
          updateData.title = campaign.campaign_name;
          updateData.experience_name = campaign.campaign_name;
          needsUpdate = true;
        }
        
        if (campaign.end_date && !campaign.application_end_date) {
          updateData.application_end_date = campaign.end_date;
          needsUpdate = true;
        }
        
        // 누락된 필드들 기본값 추가
        const defaultFields = {
          image_url: campaign.image_url || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
          main_image: campaign.main_image || campaign.image_url || 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
          application_start_date: campaign.application_start_date || campaign.start_date,
          application_deadline: campaign.application_deadline || campaign.end_date,
          content_start_date: campaign.content_start_date || campaign.start_date,
          content_end_date: campaign.content_end_date || campaign.review_deadline,
          influencer_announcement_date: campaign.influencer_announcement_date || null,
          result_announcement_date: campaign.result_announcement_date || null,
          experience_location: campaign.experience_location || '전국',
          experience_period: campaign.experience_period || '1주',
          provided_items: campaign.provided_items || '<p>제품 체험 기회</p>',
          campaign_mission: campaign.campaign_mission || '<p>제품 사용 후 솔직한 리뷰 작성</p>',
          keywords: campaign.keywords || '체험단,리뷰,제품',
          product_links: campaign.product_links || '',
          additional_guidelines: campaign.additional_guidelines || '<p>추가 안내사항이 없습니다.</p>'
        };
        
        // 기본값이 없는 필드들만 추가
        for (const [key, value] of Object.entries(defaultFields)) {
          if (!campaign[key] && value !== null) {
            updateData[key] = value;
            needsUpdate = true;
          }
        }
        
        if (needsUpdate) {
          await campaignsCollection.updateOne(
            { _id: campaign._id },
            { $set: updateData }
          );
          console.log(`✅ 캠페인 마이그레이션 완료: ${campaign.campaign_name || campaign._id}`);
        }
      }
      
      console.log('🎉 campaigns 데이터 마이그레이션 완료!');
    } catch (error) {
      console.error('❌ campaigns 데이터 마이그레이션 실패:', error);
    }
  }

  // 🔥 관리자 계정 초기화
  async initializeAdminAccount() {
    try {
      console.log('👤 관리자 계정 초기화 시작...');
      
      const adminsCollection = this.db.collection('admins');
      
      // 기존 admin 계정 확인
      const existingAdmin = await adminsCollection.findOne({ username: 'admin' });
      
      if (!existingAdmin) {
        // admin 계정 생성
        const adminData = {
          username: 'admin',
          password: 'admin123', // 실제 운영에서는 해시화 필요
          role: 'super_admin',
            created_at: new Date(),
          updated_at: new Date(),
          last_login: null,
          is_active: true
        };
        
        await adminsCollection.insertOne(adminData);
        console.log('✅ admin 계정 생성 완료');
      } else {
        console.log('✅ admin 계정 이미 존재');
      }
      
      console.log('🎉 관리자 계정 초기화 완료!');
    } catch (error) {
      console.error('❌ 관리자 계정 초기화 실패:', error);
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

      const users = await collection.find(query).toArray();
      return users;
    } catch (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error);
      return [];
    }
  }

  // 사용자 프로필 단일 조회
  async getUserProfile(userId) {
    try {
      const collection = this.db.collection('user_profiles');
      const user = await collection.findOne({ user_id: userId });
      return user;
    } catch (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error);
      return null;
    }
  }

  // 사용자 프로필 생성
  async createUserProfile(profileData) {
    try {
      const collection = this.db.collection('user_profiles');
      const result = await collection.insertOne(profileData);
      return result.insertedId;
    } catch (error) {
      console.error('❌ 사용자 프로필 생성 실패:', error);
      throw error;
    }
  }

  // 사용자 프로필 수정
  async updateUserProfile(id, updateData) {
    try {
      const collection = this.db.collection('user_profiles');
      const result = await collection.updateOne(
        { _id: id },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 사용자 프로필 수정 실패:', error);
      throw error;
    }
  }

  // 사용자 프로필 삭제
  async deleteUserProfile(id) {
    try {
      const collection = this.db.collection('user_profiles');
      const result = await collection.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ 사용자 프로필 삭제 실패:', error);
      throw error;
    }
  }

  // 사용자 프로필 삭제
  async deleteUserProfile(userId) {
    try {
      const collection = this.db.collection('user_profiles');
      const result = await collection.deleteOne({ user_id: userId });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ 사용자 프로필 삭제 실패:', error);
      return false;
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

      const codes = await collection.find(query).toArray();
      return codes;
    } catch (error) {
      console.error('❌ 사용자 코드 조회 실패:', error);
      return [];
    }
  }

  // 인플루언서 프로필 목록 조회
  async getInfluencerProfiles(options = {}) {
    try {
      const collection = this.db.collection('influencer_profiles');
      let query = {};

      if (options.filter && options.filter.user_id) {
        query.user_id = options.filter.user_id;
      }

      const profiles = await collection.find(query).toArray();
      return profiles;
    } catch (error) {
      console.error('❌ 인플루언서 프로필 조회 실패:', error);
      return [];
    }
  }

  // 사용자 신청 목록 조회
  async getUserApplications(options = {}) {
    try {
      const collection = this.db.collection('user_applications');
      let query = {};

      if (options.filter && options.filter.user_id) {
        query.user_id = options.filter.user_id;
      }

      const applications = await collection.find(query).toArray();
      return applications;
    } catch (error) {
      console.error('❌ 사용자 신청 조회 실패:', error);
      return [];
    }
  }

  // 체험 코드 목록 조회
  async getExperienceCodes(options = {}) {
    try {
      const collection = this.db.collection('experience_codes');
      let query = {};

      if (options.filter && options.filter.code) {
        query.code = options.filter.code;
      }

      const codes = await collection.find(query).toArray();
      return codes;
    } catch (error) {
      console.error('❌ 체험 코드 조회 실패:', error);
      return [];
    }
  }

  // 캠페인 목록 조회
  async getCampaigns(options = {}) {
    try {
      console.log('🔍 getCampaigns 호출됨:', options);
      console.log('🔍 데이터베이스 연결 상태:', this.db ? '연결됨' : '연결 안됨');
      console.log('🔍 데이터베이스 이름:', this.db ? this.db.databaseName : 'N/A');
      
      const collection = this.db.collection('campaigns');
      let query = {};

      if (options.filter && options.filter.campaign_id) {
        query._id = options.filter.campaign_id;
      }

      console.log('🔍 쿼리:', query);
      
      // 컬렉션 문서 수 확인
      const totalCount = await collection.countDocuments();
      console.log('🔍 campaigns 컬렉션 총 문서 수:', totalCount);
      
      let campaigns = await collection.find(query).toArray();
      console.log('🔍 조회된 캠페인 수:', campaigns.length);
      
      if (campaigns.length > 0) {
        console.log('🔍 첫 번째 캠페인:', JSON.stringify(campaigns[0], null, 2));
      }
      
      if (options.limit) {
        campaigns = campaigns.slice(0, options.limit);
        console.log('🔍 제한 적용 후 캠페인 수:', campaigns.length);
      }

      return campaigns;
    } catch (error) {
      console.error('❌ 캠페인 조회 실패:', error);
      console.error('❌ 에러 상세:', error.message);
      console.error('❌ 에러 스택:', error.stack);
      return [];
    }
  }

  // 캠페인 생성
  async createCampaign(campaignData) {
    try {
      const collection = this.db.collection('campaigns');
      const result = await collection.insertOne(campaignData);
      return result.insertedId;
    } catch (error) {
      console.error('❌ 캠페인 생성 실패:', error);
      throw error;
    }
  }

  // 캠페인 수정
  async updateCampaign(id, updateData) {
    try {
      const collection = this.db.collection('campaigns');
      const result = await collection.updateOne(
        { _id: id },
        { $set: updateData }
      );
      return result.modifiedCount > 0;
    } catch (error) {
      console.error('❌ 캠페인 수정 실패:', error);
      throw error;
    }
  }

  // 캠페인 삭제
  async deleteCampaign(id) {
    try {
      const collection = this.db.collection('campaigns');
      const result = await collection.deleteOne({ _id: id });
      return result.deletedCount > 0;
    } catch (error) {
      console.error('❌ 캠페인 삭제 실패:', error);
      throw error;
    }
  }

  // 사용자 리뷰 목록 조회
  async getUserReviews(options = {}) {
    try {
      const collection = this.db.collection('user_reviews');
      let query = {};

      let reviews = await collection.find(query).toArray();
      
      if (options.limit) {
        reviews = reviews.slice(0, options.limit);
      }

      return reviews;
    } catch (error) {
      console.error('❌ 사용자 리뷰 조회 실패:', error);
      return [];
    }
  }

  // 관리자 조회
  async getAdminByUsername(username) {
    try {
      const collection = this.db.collection('admins');
      const admin = await collection.findOne({ username: username });
      return admin;
    } catch (error) {
      console.error('❌ 관리자 조회 실패:', error);
      return null;
    }
  }

  // 관리자 마지막 로그인 업데이트
  async updateAdminLastLogin(username) {
    try {
      const collection = this.db.collection('admins');
      await collection.updateOne(
        { username: username },
        { $set: { last_login: new Date() } }
      );
      return true;
    } catch (error) {
      console.error('❌ 관리자 로그인 업데이트 실패:', error);
      return false;
    }
  }

  // 관리자 목록 조회
  async getAdmins() {
    try {
      const collection = this.db.collection('admins');
      const admins = await collection.find({}).toArray();
      return admins;
    } catch (error) {
      console.error('❌ 관리자 목록 조회 실패:', error);
      return [];
    }
  }

  // 연결 종료
  async disconnect() {
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