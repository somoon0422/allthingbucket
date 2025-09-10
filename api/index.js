const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();

// MongoDB 연결 설정
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';

let client = null;
let db = null;

// MongoDB 연결 함수
const connectToMongoDB = async () => {
  try {
    if (!client) {
      console.log('🔗 MongoDB Atlas 연결 시도...');
      console.log('연결 문자열:', connectionString.replace(/\/\/.*@/, '//***:***@'));
      console.log('환경 변수 MONGODB_URI:', process.env.MONGODB_URI ? '설정됨' : '설정되지 않음');
      
      // Create a MongoClient with a MongoClientOptions object to set the Stable API version
      client = new MongoClient(connectionString, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: false,
          deprecationErrors: false,
        },
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        connectTimeoutMS: 10000
      });
      
      // Connect the client to the server
      await client.connect();
      
      // Send a ping to confirm a successful connection
      await client.db("admin").command({ ping: 1 });
      console.log("✅ Pinged your deployment. You successfully connected to MongoDB!");
      
      db = client.db('allthingbucket');
    }
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB Atlas 연결 실패:', error);
    console.error('에러 상세:', error.message);
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
    console.log('🔗 MongoDB 연결 시도 중...');
    
    const { db } = await connectToMongoDB();
    console.log('✅ MongoDB 연결 성공!');
    
    const collection = db.collection('campaigns');
    console.log('📊 campaigns 컬렉션 접근 성공!');
    
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
    console.error('에러 상세:', error.message);
    console.error('에러 스택:', error.stack);
    
    // MongoDB 연결 실패 시 임시 데이터 반환
    if (error.message.includes('connection') || error.message.includes('timeout')) {
      console.log('🔄 MongoDB 연결 실패로 임시 데이터 반환');
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
      
      return res.json({
        success: true,
        data: fallbackCampaigns,
        count: fallbackCampaigns.length,
        fallback: true
      });
    }
    
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