export default function handler(req, res) {
  res.status(200).json({ 
    success: true, 
    message: 'API 함수가 정상 작동합니다',
    timestamp: new Date().toISOString()
  });
}
