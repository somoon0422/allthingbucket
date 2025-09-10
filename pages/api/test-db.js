// pages/api/test-db.js
import { MongoClient } from 'mongodb';

export default async function handler(req, res) {
  // 환경변수 확인
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      error: "MONGODB_URI not found",
      message: "환경변수가 설정되지 않았습니다"
    });
  }

  const uri = process.env.MONGODB_URI;
  let client;

  try {
    // MongoDB 연결
    client = new MongoClient(uri);
    await client.connect();
    
    // Ping 테스트
    await client.db("admin").command({ ping: 1 });
    
    // 성공 응답
    return res.status(200).json({ 
      success: true,
      message: "MongoDB 연결 성공!",
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('MongoDB Error:', error);
    return res.status(500).json({ 
      success: false,
      error: "MongoDB 연결 실패",
      details: error.message
    });

  } finally {
    // 연결 종료
    if (client) {
      await client.close();
    }
  }
}
