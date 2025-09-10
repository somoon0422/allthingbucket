const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const app = express();

// 미들웨어 설정
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: ['https://allthingbucket.com', 'http://localhost:5173'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB 서비스 동적 로드
let mongodbService;
try {
  // Vercel 환경에서 MongoDB 서비스 로드
  const { MongoClient } = require('mongodb');
  
  const connectionString = process.env.MONGODB_URI || 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';
  
  let client = null;
  let db = null;
  
  const connectToMongoDB = async () => {
    try {
      if (!client) {
        client = new MongoClient(connectionString, {
          tls: true,
          tlsAllowInvalidCertificates: true,
          tlsAllowInvalidHostnames: true,
        });
        await client.connect();
        db = client.db('allthingbucket');
        console.log('✅ MongoDB Atlas 연결 성공!');
      }
      return { client, db };
    } catch (error) {
      console.error('❌ MongoDB Atlas 연결 실패:', error);
      throw error;
    }
  };
  
  mongodbService = {
    async getCampaigns(options = {}) {
      try {
        const { db } = await connectToMongoDB();
        const collection = db.collection('campaigns');
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
        
        const campaigns = await cursor.toArray();
        return campaigns;
      } catch (error) {
        console.error('❌ 캠페인 목록 조회 실패:', error);
        throw error;
      }
    },
    
    async getAdminByUsername(username) {
      try {
        const { db } = await connectToMongoDB();
        const collection = db.collection('admins');
        const admin = await collection.findOne({ username: username, is_active: true });
        return admin;
      } catch (error) {
        console.error('❌ 관리자 조회 실패:', error);
        throw error;
      }
    },
    
    async updateAdminLastLogin(adminId) {
      try {
        const { db } = await connectToMongoDB();
        const collection = db.collection('admins');
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
    },
    
    async getUserProfiles(options = {}) {
      try {
        const { db } = await connectToMongoDB();
        const collection = db.collection('user_profiles');
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
        
        const profiles = await cursor.toArray();
        return profiles;
      } catch (error) {
        console.error('❌ 사용자 프로필 조회 실패:', error);
        throw error;
      }
    }
  };
  
  console.log('✅ MongoDB 서비스 초기화 완료');
} catch (error) {
  console.error('MongoDB 서비스 로드 실패:', error);
}

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AllThingBucket API'
  });
});

// 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    mongodb: mongodbService ? '연결됨' : '연결 안됨'
  });
});

// 데이터베이스 상태 확인
app.get('/api/db/status', async (req, res) => {
  try {
    if (!mongodbService) {
      return res.status(500).json({
        success: false,
        error: 'MongoDB 서비스가 로드되지 않았습니다'
      });
    }

    const profiles = await mongodbService.getUserProfiles({ limit: 1 });
    
    res.json({
      success: true,
      message: '데이터베이스 연결 정상',
      data: {
        connected: true,
        userCount: profiles.length
      }
    });
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 목록 조회
app.get('/api/db/campaigns', async (req, res) => {
  try {
    console.log('📋 캠페인 목록 조회 요청:', req.query);

    if (!mongodbService) {
      return res.status(500).json({
        success: false,
        error: 'MongoDB 서비스가 로드되지 않았습니다'
      });
    }

    const options = {
      limit: req.query.limit ? parseInt(req.query.limit) : undefined,
      filter: req.query.campaign_id ? { _id: req.query.campaign_id } : undefined
    };

    const campaigns = await mongodbService.getCampaigns(options);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('❌ 캠페인 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 로그인
app.post('/api/db/admin-login', async (req, res) => {
  try {
    console.log('🔐 관리자 로그인 요청:', req.body);
    
    if (!mongodbService) {
      return res.status(500).json({
        success: false,
        error: 'MongoDB 서비스가 로드되지 않았습니다'
      });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '사용자명과 비밀번호를 입력해주세요'
      });
    }
    
    // MongoDB에서 관리자 정보 조회
    const admin = await mongodbService.getAdminByUsername(username);
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: '존재하지 않는 관리자입니다'
      });
    }
    
    // 비밀번호 확인
    if (admin.password_hash !== password) {
      return res.status(401).json({
        success: false,
        error: '비밀번호가 일치하지 않습니다'
      });
    }
    
    // 마지막 로그인 시간 업데이트
    await mongodbService.updateAdminLastLogin(admin._id);
    
    console.log('✅ 관리자 로그인 성공:', admin.username);
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        admin: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          is_active: admin.is_active
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 관리자 로그인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl 
  });
});

module.exports = app;