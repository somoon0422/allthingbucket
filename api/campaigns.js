// api/campaigns.js
const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }
  
  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('allthingbucket'); // 실제 DB 이름
  cachedDb = db;
  return db;
}

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  try {
    const db = await connectToDatabase();
    const campaigns = await db.collection('campaigns').find({}).toArray();
    
    return res.status(200).json({ 
      success: true, 
      data: campaigns 
    });
  } catch (error) {
    console.error('Error:', error);
    // Fallback 데이터 반환
    return res.status(200).json({ 
      success: false,
      fallback: true,
      data: [
        {
          id: 1,
          title: "샘플 체험단 1",
          description: "MongoDB 연결 실패 시 표시되는 샘플 데이터",
          company: "테스트 회사",
          category: "테스트"
        }
      ],
      error: error.message 
    });
  }
};
