// api/index.js - Vercel Functions 형식
const { MongoClient } = require('mongodb');

// MongoDB 연결 설정
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
let cachedClient = null;
let cachedDb = null;

// MongoDB 연결 함수
const connectToDatabase = async () => {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    console.log('🔗 MongoDB 연결 시도...');
    const client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 5000
    });
    
    await client.connect();
    const db = client.db('allthingbucket');
    
    cachedClient = client;
    cachedDb = db;
    
    console.log('✅ MongoDB 연결 성공!');
    return { client, db };
  } catch (error) {
    console.error('❌ MongoDB 연결 실패:', error.message);
    throw error;
  }
};

// 메인 핸들러
module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { pathname } = new URL(req.url, `http://${req.headers.host}`);
  
  try {
    // 간단한 테스트 API
    if (pathname === '/api/simple-test') {
      return res.status(200).json({ 
        message: "API is working!",
        env: process.env.MONGODB_URI ? "ENV exists" : "ENV missing",
        timestamp: new Date().toISOString()
      });
    }
    
    // MongoDB 연결 테스트
    if (pathname === '/api/test-db') {
      const { db } = await connectToDatabase();
      await db.admin().ping();
      
      return res.status(200).json({ 
        success: true,
        message: "MongoDB connected!",
        database: db.databaseName
      });
    }
    
    // 캠페인 목록 조회
    if (pathname === '/api/campaigns' && req.method === 'GET') {
      const { db } = await connectToDatabase();
      const campaigns = await db.collection('campaigns').find({}).toArray();
      
      return res.status(200).json({ 
        success: true, 
        data: campaigns 
      });
    }
    
    // 기본 응답
    return res.status(404).json({ 
      error: "API endpoint not found",
      path: pathname,
      method: req.method
    });
    
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      success: false,
      error: error.message 
    });
  }
};