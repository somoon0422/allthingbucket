// pages/api/simple-test.js
export default function handler(req, res) {
  res.status(200).json({ 
    message: "API is working!",
    env: process.env.MONGODB_URI ? "ENV exists" : "ENV missing",
    timestamp: new Date().toISOString()
  });
}
