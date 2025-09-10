const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// Vercel 최적화 MongoDB 연결
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

let client;
let clientPromise;

if (process.env.NODE_ENV === 'development') {
  // 개발 환경에서는 global 변수 사용
  let globalWithMongo = global;
  
  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  // 프로덕션에서는 새 연결
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// MongoDB 연결 함수
async function connectToDatabase() {
  console.log('🔗 MongoDB 연결 시도...');
  
  try {
    const client = await clientPromise;
    const db = client.db('allthingbucket');
    console.log("✅ MongoDB 연결 성공!");
    return { db, client };
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error);
    throw error;
  }
}

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
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  console.log('📋 캠페인 목록 조회 요청:', req.query);
  
  try {
    console.log('Connecting to MongoDB...');
    const { db } = await connectToDatabase();
    
    const collection = db.collection('campaigns');
    console.log('campaigns 컬렉션 접근 성공');
    
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
    
    console.log('쿼리 조건:', query);
    
    let cursor = collection.find(query);
    
    if (req.query.limit) {
      cursor = cursor.limit(parseInt(req.query.limit));
    }
    
    cursor = cursor.sort({ created_at: -1 });
    
    const campaigns = await cursor.toArray();
    console.log('조회된 캠페인 수:', campaigns.length);

    res.status(200).json({ 
      success: true, 
      data: campaigns,
      count: campaigns.length
    });
    
  } catch (e) {
    console.error('MongoDB Error:', e);
    
    // Fallback 데이터 반환
    const fallbackCampaigns = [
      {
        _id: "campaign_1",
        title: "뷰티 제품 체험단 모집",
        description: "새로운 뷰티 제품을 체험해보실 분들을 모집합니다.",
        type: "beauty",
        status: "active",
        max_participants: 50,
        current_participants: 15,
        start_date: "2024-01-01T00:00:00.000+00:00",
        end_date: "2024-12-31T00:00:00.000+00:00",
        application_start: "2024-01-01T00:00:00.000+00:00",
        application_end: "2024-12-15T00:00:00.000+00:00",
        content_start: "2024-01-01T00:00:00.000+00:00",
        content_end: "2024-12-20T00:00:00.000+00:00",
        requirements: "인스타그램 팔로워 1만명 이상",
        rewards: "제품 무료 제공 + 포인트 1000P",
        main_images: ["https://example.com/beauty1.jpg"],
        detail_images: ["https://example.com/beauty_detail1.jpg", "https://example.com/beauty_detail2.jpg"],
        created_at: "2025-09-10T01:59:07.897+00:00",
        updated_at: "2025-09-10T01:59:07.897+00:00"
      },
      {
        _id: "campaign_2",
        title: "테크 가전 제품 리뷰",
        description: "최신 테크 가전 제품을 리뷰해주실 분들을 모집합니다.",
        type: "tech",
        status: "active",
        max_participants: 30,
        current_participants: 8,
        start_date: "2024-01-01T00:00:00.000+00:00",
        end_date: "2024-12-31T00:00:00.000+00:00",
        application_start: "2024-01-01T00:00:00.000+00:00",
        application_end: "2024-12-10T00:00:00.000+00:00",
        content_start: "2024-01-01T00:00:00.000+00:00",
        content_end: "2024-12-15T00:00:00.000+00:00",
        requirements: "유튜브 구독자 5천명 이상",
        rewards: "제품 무료 제공 + 포인트 2000P",
        main_images: ["https://example.com/tech1.jpg"],
        detail_images: ["https://example.com/tech_detail1.jpg"],
        created_at: "2025-09-10T01:59:07.897+00:00",
        updated_at: "2025-09-10T01:59:07.897+00:00"
      }
    ];
    
    res.status(200).json({ 
      success: false,
      fallback: true,
      data: fallbackCampaigns,
      count: fallbackCampaigns.length,
      error: e.message 
    });
  }
});

// 빠른 테스트 API
app.get('/api/test-db', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
    await db.admin().command({ ping: 1 });
    res.json({ status: "MongoDB 연결 성공! ✅" });
  } catch (e) {
    res.status(500).json({ status: "연결 실패 ❌", error: e.message });
  }
});

// 간단한 테스트 엔드포인트
app.get('/api/db/test', async (req, res) => {
  try {
    console.log('🧪 MongoDB 연결 테스트 시작...');
    
    const { db } = await connectToDatabase();
    console.log('✅ MongoDB 연결 성공!');
    
    // 핑 테스트
    await db.admin().ping();
    console.log('✅ Ping 성공!');
    
    const collections = await db.listCollections().toArray();
    console.log('📊 컬렉션 목록:', collections.map(c => c.name));
    
    res.json({
      success: true,
      message: 'MongoDB 연결 성공',
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ MongoDB 연결 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


// 데이터베이스 상태 확인
app.get('/api/db/status', async (req, res) => {
  try {
    const { db } = await connectToDatabase();
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