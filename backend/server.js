const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const smsRoutes = require('./routes/sms');
const authRoutes = require('./routes/auth');
const databaseRoutes = require('./routes/database');
const initRoutes = require('./routes/init');
const emailRoutes = require('./routes/email');
const accountVerificationRoutes = require('./routes/accountVerification');
const withdrawalRoutes = require('./routes/withdrawal');
const phoneVerificationRoutes = require('./routes/phoneVerification');
const supabaseService = require('./services/supabaseService');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// 🔥 미들웨어 설정
app.use(helmet()); // 보안 헤더
app.use(morgan('combined')); // 로깅
app.use(cors({
  origin: [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000',
    'https://allthingbucket.com'
  ],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 🔥 라우트 설정
app.use('/api/sms', smsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/db', databaseRoutes);
app.use('/api/init', initRoutes);
app.use('/api', emailRoutes);
app.use('/api/account', accountVerificationRoutes);
app.use('/api/account', phoneVerificationRoutes);
app.use('/api/withdrawal', withdrawalRoutes);

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
    console.log('🔗 Supabase 연결 시도 중...');
    console.log('🔗 SUPABASE_URL:', process.env.SUPABASE_URL ? '설정됨' : '설정되지 않음');
    console.log('🔗 SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음');
    console.log('🔗 NODE_ENV:', process.env.NODE_ENV);
    
    // Supabase 연결 테스트
    const isConnected = await supabaseService.testConnection();
    
    if (!isConnected) {
      console.error('❌ Supabase 연결 실패 - 서버는 계속 실행됩니다');
    }
    
    app.listen(PORT, () => {
      console.log(`🚀 백엔드 서버가 포트 ${PORT}에서 실행 중입니다`);
      console.log(`📱 SMS API: http://localhost:${PORT}/api/sms`);
      console.log(`🗄️ DB API: http://localhost:${PORT}/api/db`);
      console.log(`🔧 INIT API: http://localhost:${PORT}/api/init`);
      console.log(`🏥 헬스 체크: http://localhost:${PORT}/health`);
      console.log(`💾 데이터베이스: ${isConnected ? 'Supabase 연결됨' : 'Supabase 연결 실패'}`);
    });
  } catch (error) {
    console.error('❌ 서버 시작 실패:', error);
    console.error('❌ 에러 상세:', error.message);
    console.error('❌ 에러 스택:', error.stack);
    process.exit(1);
  }
};

startServer();

module.exports = app;
