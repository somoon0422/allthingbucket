// api/test-db.js (Vercel Functions)
const { MongoClient } = require('mongodb');

module.exports = async (req, res) => {
  if (!process.env.MONGODB_URI) {
    return res.status(500).json({ 
      error: "MONGODB_URI not found" 
    });
  }

  let client;
  try {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    
    res.status(200).json({ 
      success: true,
      message: "MongoDB connected!" 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false,
      error: error.message 
    });
  } finally {
    if (client) await client.close();
  }
};
