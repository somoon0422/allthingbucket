import clientPromise from '../../lib/mongodb.js';

export default async function handler(req, res) {
  try {
    const client = await clientPromise;
    const db = client.db('allthingbucket');
    
    // ping 테스트
    await db.admin().ping();
    
    // 컬렉션 목록 확인
    const collections = await db.listCollections().toArray();
    
    res.status(200).json({ 
      message: "✅ MongoDB 연결 성공!",
      database: db.databaseName,
      collections: collections.map(c => c.name),
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('MongoDB 에러:', error);
    res.status(500).json({ 
      error: "❌ MongoDB 연결 실패",
      details: error.message 
    });
  }
}
