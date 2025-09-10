// api/test-db.js
const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  // CORS 설정
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      error: "MONGODB_URI not found",
      message: "환경변수가 설정되지 않았습니다" 
    });
  }

  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    
    return res.status(200).json({ 
      success: true,
      message: "MongoDB 연결 성공!",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return res.status(500).json({ 
      success: false,
      error: "MongoDB 연결 실패",
      details: error.message
    });
  } finally {
    if (client) {
      await client.close();
    }
  }
};
