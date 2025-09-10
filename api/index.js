const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// MongoDB 연결 설정
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true&apiVersion=1';

let client = null;
let db = null;

// MongoDB 연결 함수
const connectToMongoDB = async () => {
  try {
    if (!client) {
      console.log('🔗 MongoDB Atlas 연결 시도...');
      client = new MongoClient(connectionString, {
        serverApi: {
          version: '1',
          strict: false,
          deprecationErrors: false
        }
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

// 미들웨어 설정
app.use(cors({
  origin: ['https://allthingbucket.com', 'http://localhost:5173', 'https://allthingbucket-fu178awcd-allthingbuckets-projects.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 기본 라우트
app.get('/', (req, res) => {
  res.json({ message: 'AllThingBucket API Server is running!' });
});

// 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  console.log('🧪 API 테스트 요청:', req.url);
  res.json({ 
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 캠페인 목록 조회 (GET /api/db/campaigns)
app.get('/api/db/campaigns', async (req, res) => {
  try {
    console.log('📋 캠페인 목록 조회 요청:', req.query);
    
    const { db } = await connectToMongoDB();
    const collection = db.collection('campaigns');
    
    // 쿼리 조건 설정
    const query = {};
    
    if (req.query.campaign_id) {
      query._id = req.query.campaign_id;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.category) {
      query.type = req.query.category;
    }
    
    console.log('🔍 쿼리 조건:', query);
    
    let cursor = collection.find(query);
    
    if (req.query.limit) {
      cursor = cursor.limit(parseInt(req.query.limit));
    }
    
    cursor = cursor.sort({ created_at: -1 });
    
    const campaigns = await cursor.toArray();
    console.log('📋 조회된 캠페인 수:', campaigns.length);

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

// 데이터베이스 상태 확인
app.get('/api/db/status', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const profiles = await db.collection('user_profiles').find({}).limit(1).toArray();
    
    res.json({
      success: true,
      message: 'MongoDB 연결 성공',
      profiles_count: profiles.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ DB 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'API endpoint not found',
    path: req.originalUrl
  });
});

// 에러 핸들러
app.use((error, req, res, next) => {
  console.error('❌ 서버 에러:', error);
  res.status(500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 서버 시작
const PORT = process.env.PORT || 3001;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
  });
}

module.exports = app;