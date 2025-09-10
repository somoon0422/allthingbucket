const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// 전역 변수로 연결 캐싱
let cachedDb = null;
let cachedClient = null;

// MongoDB 연결 함수 (단순화된 버전)
async function connectToDatabase() {
  console.log('🔗 MongoDB 연결 시도...');
  
  // 환경변수 체크
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI 환경변수가 설정되지 않았습니다');
  }
  
  console.log('환경 변수 MONGODB_URI:', process.env.MONGODB_URI ? '설정됨' : '설정되지 않음');
  
  if (cachedDb) {
    console.log('✅ 캐시된 DB 연결 사용');
    return { db: cachedDb, client: cachedClient };
  }

  console.log('새로운 MongoDB 연결 생성...');
  
  const client = new MongoClient(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
    connectTimeoutMS: 5000
  });

  await client.connect();
  console.log("✅ MongoDB 연결 성공!");
  
  const db = client.db('allthingbucket');
  
  cachedClient = client;
  cachedDb = db;
  
  return { db, client };
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
  console.log('📋 캠페인 목록 조회 요청:', req.query);
  
  try {
    console.log('1. API 함수 시작');
    
    // 환경변수 체크
    if (!process.env.MONGODB_URI) {
      console.log('❌ MONGODB_URI 환경변수 없음');
      return res.status(500).json({ 
        success: false,
        error: 'MONGODB_URI 환경변수가 설정되지 않았습니다' 
      });
    }
    
    console.log('2. MongoDB URI 존재 확인');
    
    // 타임아웃 설정
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Connection timeout')), 10000)
    );
    
    const connectionPromise = connectToDatabase();
    
    const { db } = await Promise.race([connectionPromise, timeoutPromise]);
    
    console.log('3. DB 연결 성공');
    
    // 핑 테스트
    await db.admin().ping();
    console.log('4. Ping 성공');
    
    const collection = db.collection('campaigns');
    console.log('5. campaigns 컬렉션 접근 성공');
    
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
    
    console.log('6. 쿼리 조건:', query);
    
    let cursor = collection.find(query);
    
    if (req.query.limit) {
      cursor = cursor.limit(parseInt(req.query.limit));
    }
    
    cursor = cursor.sort({ created_at: -1 });
    
    const campaigns = await cursor.toArray();
    console.log('7. 조회된 캠페인 수:', campaigns.length);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
    
  } catch (error) {
    console.error('❌ 캠페인 목록 조회 실패:', error);
    console.error('에러 발생 위치:', error.message);
    console.error('에러 스택:', error.stack);
    
    res.status(500).json({ 
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// 간단한 테스트 엔드포인트
app.get('/api/db/test', async (req, res) => {
  try {
    console.log('🧪 MongoDB 연결 테스트 시작...');
    
    // 환경변수 체크
    if (!process.env.MONGODB_URI) {
      return res.status(500).json({ 
        success: false,
        error: 'MONGODB_URI 환경변수가 설정되지 않았습니다' 
      });
    }
    
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