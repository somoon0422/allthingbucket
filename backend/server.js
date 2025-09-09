const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const smsRoutes = require('./routes/sms');
const authRoutes = require('./routes/auth');
const databaseRoutes = require('./routes/database');
const databaseService = require('./services/databaseService');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// 🔥 미들웨어 설정
app.use(helmet()); // 보안 헤더
app.use(morgan('combined')); // 로깅
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔥 라우트 설정
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/db', databaseRoutes);

// 🔥 헬스 체크 엔드포인트
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AllThingBucket Backend API'
  });
});

// 🔥 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl 
  });
});

// 🔥 에러 핸들러
app.use(errorHandler);

// 🔥 서버 시작
const startServer = async () => {
  try {
    // 데이터베이스 연결
    await databaseService.connect();
    
    app.listen(PORT, () => {
      console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log(`📱 SMS API: http://localhost:${PORT}/api/sms`);
      console.log(`🗄️ DB API: http://localhost:${PORT}/api/db`);
      console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
      console.log(`💾 데이터베이스: SQLite 연결됨`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
