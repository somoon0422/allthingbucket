// pages/api/campaigns-new.js
import { MongoClient } from 'mongodb';

// 캐시된 연결
let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const client = new MongoClient(process.env.MONGODB_URI);
  await client.connect();
  const db = client.db('allthingbucket'); // 실제 DB 이름

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

export default async function handler(req, res) {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  try {
    const { db } = await connectToDatabase();
    
    if (req.method === 'GET') {
      const campaigns = await db
        .collection('campaigns')
        .find({})
        .toArray();
      
      return res.status(200).json({ 
        success: true, 
        data: campaigns 
      });
    }
    
    res.status(405).json({ error: 'Method not allowed' });
    
  } catch (error) {
    console.error('Error:', error);
    return res.status(200).json({ 
      success: false, 
      error: error.message,
      fallback: true,
      data: [
        {
          id: 1,
          title: "샘플 체험단 1",
          description: "테스트 데이터"
        }
      ] 
    });
  }
}
