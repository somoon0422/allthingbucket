const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const smsRoutes = require('../backend/routes/sms');
const authRoutes = require('../backend/routes/auth');
const { errorHandler } = require('../backend/middleware/errorHandler');

const app = express();

// 🔥 미들웨어 설정
app.use(helmet());
app.use(morgan('combined'));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔥 라우트 설정
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);

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

module.exports = app;
