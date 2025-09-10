// api/campaigns.js (Vercel Functions)
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
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST');
  
  try {
    const db = await connectToDatabase();
    const campaigns = await db.collection('campaigns').find({}).toArray();
    
    res.status(200).json({ 
      success: true, 
      data: campaigns 
    });
  } catch (error) {
    // Fallback 데이터로 응답
    res.status(200).json({ 
      success: false,
      fallback: true,
      data: [
        {
          id: 1,
          title: "샘플 체험단",
          description: "MongoDB 연결 실패 - 샘플 데이터"
        }
      ],
      error: error.message 
    });
  }
};
