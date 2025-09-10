const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');

const app = express();

// 미들웨어 설정
app.use(cors({
  origin: ['https://allthingbucket.com', 'http://localhost:5173', 'https://allthingbucket-fu178awcd-allthingbuckets-projects.vercel.app'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// MongoDB 연결 설정
const connectionString = process.env.MONGODB_URI || 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true&tlsAllowInvalidCertificates=true&tlsAllowInvalidHostnames=true';

let client = null;
let db = null;

const connectToMongoDB = async () => {
  try {
    if (!client) {
      client = new MongoClient(connectionString, {
        tls: true,
        tlsAllowInvalidCertificates: true,
        tlsAllowInvalidHostnames: true,
      });
      await client.connect();
      db = client.db('allthingbucket');
      console.log('✅ MongoDB Atlas 연결 성공!');
    }
    return { client, db };
   } catch (error) {
    console.error('❌ MongoDB Atlas 연결 실패:', error);
    throw error;
  }
};

// 헬스 체크
app.get('/health', (req, res) => {
  console.log('🏥 헬스 체크 요청:', req.url);
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    service: 'AllThingBucket API',
    mongodb: db ? 'connected' : 'disconnected',
    environment: process.env.NODE_ENV || 'development'
  });
});

// 테스트 엔드포인트
app.get('/api/test', (req, res) => {
  console.log('🧪 API 테스트 요청:', req.url);
  res.json({ 
    message: 'API 테스트 성공',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    mongodb: db ? 'connected' : 'disconnected'
  });
});

// 데이터베이스 상태 확인
app.get('/api/db/status', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const profiles = await db.collection('user_profiles').find({}).limit(1).toArray();
    
    res.json({
      success: true,
      message: '데이터베이스 연결 정상',
      data: {
        connected: true,
        userCount: profiles.length
      }
    });
  } catch (error) {
    console.error('❌ 데이터베이스 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 캠페인 목록 조회
app.get('/api/db/campaigns', async (req, res) => {
  try {
    console.log('📋 캠페인 목록 조회 요청:', req.query);
    console.log('🔗 MongoDB 연결 시도 중...');

    const { db } = await connectToMongoDB();
    console.log('✅ MongoDB 연결 성공!');
    
    const collection = db.collection('campaigns');
    console.log('📊 campaigns 컬렉션 접근 성공');
    
    let query = {};
    
    if (req.query.campaign_id) {
      query._id = req.query.campaign_id;
    }
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.category) {
      query.type = req.query.category;
    }
    
    console.log('🔍 쿼리 조건:', query);
    
    let cursor = collection.find(query);
    
    if (req.query.limit) {
      cursor = cursor.limit(parseInt(req.query.limit));
    }
    
    cursor = cursor.sort({ created_at: -1 });
    
    const campaigns = await cursor.toArray();
    console.log('📋 조회된 캠페인 수:', campaigns.length);

    res.json({
      success: true,
      data: campaigns,
      count: campaigns.length
    });
  } catch (error) {
    console.error('❌ 캠페인 목록 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 로그인 (POST /api/db/user-login)
app.post('/api/db/user-login', async (req, res) => {
  try {
    console.log('🔐 사용자 로그인 요청:', req.body);
    
    const { db } = await connectToMongoDB();
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: '이메일과 비밀번호를 입력해주세요'
      });
    }
    
    // 사용자 조회
    const user = await db.collection('users').findOne({ email: email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '존재하지 않는 사용자입니다'
      });
    }
    
    // 비밀번호 확인 (실제로는 해시 비교해야 함)
    if (user.password !== password) {
      return res.status(401).json({
        success: false,
        error: '비밀번호가 일치하지 않습니다'
      });
    }
    
    // 마지막 로그인 시간 업데이트
    await db.collection('users').updateOne(
      { _id: user._id },
      { 
        $set: { 
          last_login: new Date(),
          updated_at: new Date()
        }
      }
    );
    
    console.log('✅ 사용자 로그인 성공:', user.email);
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        user: {
          _id: user._id,
          user_id: user.user_id,
          name: user.name,
          email: user.email,
          role: user.role || 'user'
        },
        token: `user_token_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('❌ 사용자 로그인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 관리자 로그인
app.post('/api/db/admin-login', async (req, res) => {
  try {
    console.log('🔐 관리자 로그인 요청:', req.body);

    const { db } = await connectToMongoDB();
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: '사용자명과 비밀번호를 입력해주세요'
      });
    }
    
    // MongoDB에서 관리자 정보 조회
    const admin = await db.collection('admins').findOne({ username: username, is_active: true });
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: '존재하지 않는 관리자입니다'
      });
    }
    
    // 비밀번호 확인
    if (admin.password_hash !== password) {
      return res.status(401).json({
        success: false,
        error: '비밀번호가 일치하지 않습니다'
      });
    }
    
    // 마지막 로그인 시간 업데이트
    await db.collection('admins').updateOne(
      { _id: admin._id },
      { 
        $set: { 
          last_login: new Date(),
          updated_at: new Date()
        }
      }
    );
    
    console.log('✅ 관리자 로그인 성공:', admin.username);
    
    res.json({
      success: true,
      message: '로그인 성공',
      data: {
        admin: {
          _id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role,
          is_active: admin.is_active
        }
      }
    });
    
  } catch (error) {
    console.error('❌ 관리자 로그인 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 사용자 프로필 조회 (GET /api/db/user-profiles)
app.get('/api/db/user-profiles', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const profiles = await db.collection('user_profiles').find({}).toArray();
    res.json({ success: true, data: profiles, count: profiles.length });
  } catch (error) {
    console.error('❌ 사용자 프로필 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 리뷰 조회 (GET /api/db/user-reviews)
app.get('/api/db/user-reviews', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const query = limit ? { limit } : {};
    const reviews = await db.collection('user_reviews').find({}, query).toArray();
    res.json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    console.error('❌ 사용자 리뷰 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 신청 내역 조회 (GET /api/db/user-applications)
app.get('/api/db/user-applications', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { user_id, experience_id, status } = req.query;
    
    let filter = {};
    if (user_id) filter.user_id = user_id;
    if (experience_id) filter.experience_id = experience_id;
    if (status) filter.status = status;
    
    const applications = await db.collection('user_applications').find(filter).toArray();
    res.json({ success: true, data: applications, count: applications.length });
  } catch (error) {
    console.error('❌ 사용자 신청 내역 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 신청 내역 생성 (POST /api/db/user-applications)
app.post('/api/db/user-applications', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const applicationData = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await db.collection('user_applications').insertOne(applicationData);
    res.json({ success: true, data: { _id: result.insertedId, ...applicationData } });
  } catch (error) {
    console.error('❌ 사용자 신청 내역 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 신청 내역 업데이트 (PUT /api/db/user-applications/:id)
app.put('/api/db/user-applications/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const applicationData = {
      ...req.body,
      updated_at: new Date()
    };
    const result = await db.collection('user_applications').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: applicationData }
    );
    if (result.modifiedCount > 0) {
      res.json({ success: true, data: applicationData });
    } else {
      res.status(404).json({ success: false, error: '신청 내역을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 사용자 신청 내역 업데이트 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 관리자 알림 조회 (GET /api/db/admin-notifications)
app.get('/api/db/admin-notifications', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const notifications = await db.collection('admin_notifications').find({}).toArray();
    res.json({ success: true, data: notifications, count: notifications.length });
  } catch (error) {
    console.error('❌ 관리자 알림 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 리뷰 제출 조회 (GET /api/db/review-submissions)
app.get('/api/db/review-submissions', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const reviews = await db.collection('review_submissions').find({}).toArray();
    res.json({ success: true, data: reviews, count: reviews.length });
  } catch (error) {
    console.error('❌ 리뷰 제출 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 캠페인 업데이트 (PUT /api/db/campaigns/:id)
app.put('/api/db/campaigns/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const campaignData = {
      ...req.body,
      updated_at: new Date()
    };
    const result = await db.collection('campaigns').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: campaignData }
    );
    if (result.modifiedCount > 0) {
      res.json({ success: true, data: campaignData });
    } else {
      res.status(404).json({ success: false, error: '캠페인을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 캠페인 업데이트 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 캠페인 삭제 (DELETE /api/db/campaigns/:id)
app.delete('/api/db/campaigns/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const result = await db.collection('campaigns').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount > 0) {
      res.json({ success: true, message: '캠페인이 삭제되었습니다' });
    } else {
      res.status(404).json({ success: false, error: '캠페인을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 캠페인 삭제 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 프로필 업데이트 (PUT /api/db/user-profiles/:id)
app.put('/api/db/user-profiles/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const profileData = {
      ...req.body,
      updated_at: new Date()
    };
    const result = await db.collection('user_profiles').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: profileData }
    );
    if (result.modifiedCount > 0) {
      res.json({ success: true, data: profileData });
    } else {
      res.status(404).json({ success: false, error: '사용자 프로필을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 사용자 프로필 업데이트 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 프로필 삭제 (DELETE /api/db/user-profiles/:id)
app.delete('/api/db/user-profiles/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const result = await db.collection('user_profiles').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount > 0) {
      res.json({ success: true, message: '사용자 프로필이 삭제되었습니다' });
    } else {
      res.status(404).json({ success: false, error: '사용자 프로필을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 사용자 프로필 삭제 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 신청 내역 삭제 (DELETE /api/db/user-applications/:id)
app.delete('/api/db/user-applications/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const result = await db.collection('user_applications').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount > 0) {
      res.json({ success: true, message: '신청 내역이 삭제되었습니다' });
    } else {
      res.status(404).json({ success: false, error: '신청 내역을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 사용자 신청 내역 삭제 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 포인트 조회 (GET /api/db/user-points)
app.get('/api/db/user-points', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { user_id } = req.query;
    
    let filter = {};
    if (user_id) filter.user_id = user_id;
    
    const points = await db.collection('user_points').find(filter).toArray();
    res.json({ success: true, data: points, count: points.length });
  } catch (error) {
    console.error('❌ 사용자 포인트 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 포인트 생성 (POST /api/db/user-points)
app.post('/api/db/user-points', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const pointData = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await db.collection('user_points').insertOne(pointData);
    res.json({ success: true, data: { _id: result.insertedId, ...pointData } });
  } catch (error) {
    console.error('❌ 사용자 포인트 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 포인트 업데이트 (PUT /api/db/user-points/:id)
app.put('/api/db/user-points/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const pointData = {
      ...req.body,
      updated_at: new Date()
    };
    const result = await db.collection('user_points').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: pointData }
    );
    if (result.modifiedCount > 0) {
      res.json({ success: true, data: pointData });
    } else {
      res.status(404).json({ success: false, error: '사용자 포인트를 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 사용자 포인트 업데이트 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 포인트 히스토리 조회 (GET /api/db/points-history)
app.get('/api/db/points-history', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { user_id } = req.query;
    
    let filter = {};
    if (user_id) filter.user_id = user_id;
    
    const history = await db.collection('points_history').find(filter).toArray();
    res.json({ success: true, data: history, count: history.length });
  } catch (error) {
    console.error('❌ 포인트 히스토리 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 포인트 히스토리 생성 (POST /api/db/points-history)
app.post('/api/db/points-history', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const historyData = {
      ...req.body,
      created_at: new Date()
    };
    const result = await db.collection('points_history').insertOne(historyData);
    res.json({ success: true, data: { _id: result.insertedId, ...historyData } });
  } catch (error) {
    console.error('❌ 포인트 히스토리 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 리뷰 제출 업데이트 (PUT /api/db/review-submissions/:id)
app.put('/api/db/review-submissions/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const reviewData = {
      ...req.body,
      updated_at: new Date()
    };
    const result = await db.collection('review_submissions').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: reviewData }
    );
    if (result.modifiedCount > 0) {
      res.json({ success: true, data: reviewData });
    } else {
      res.status(404).json({ success: false, error: '리뷰 제출을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 리뷰 제출 업데이트 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 리뷰 제출 삭제 (DELETE /api/db/review-submissions/:id)
app.delete('/api/db/review-submissions/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const result = await db.collection('review_submissions').deleteOne(
      { _id: new ObjectId(req.params.id) }
    );
    if (result.deletedCount > 0) {
      res.json({ success: true, message: '리뷰 제출이 삭제되었습니다' });
    } else {
      res.status(404).json({ success: false, error: '리뷰 제출을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 리뷰 제출 삭제 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 중복된 엔드포인트 제거됨

// 사용자 코드 조회 (GET /api/db/user-codes)
app.get('/api/db/user-codes', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const codes = await db.collection('user_codes').find({}).toArray();
    res.json({ success: true, data: codes, count: codes.length });
  } catch (error) {
    console.error('❌ 사용자 코드 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 인플루언서 프로필 조회 (GET /api/db/influencer-profiles)
app.get('/api/db/influencer-profiles', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const profiles = await db.collection('influencer_profiles').find({}).toArray();
    res.json({ success: true, data: profiles, count: profiles.length });
  } catch (error) {
    console.error('❌ 인플루언서 프로필 조회 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 인플루언서 프로필 생성 (POST /api/db/influencer-profiles)
app.post('/api/db/influencer-profiles', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const profileData = {
      ...req.body,
      created_at: new Date(),
      updated_at: new Date()
    };
    const result = await db.collection('influencer_profiles').insertOne(profileData);
    res.json({ success: true, data: { _id: result.insertedId, ...profileData } });
  } catch (error) {
    console.error('❌ 인플루언서 프로필 생성 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 인플루언서 프로필 업데이트 (PUT /api/db/influencer-profiles/:id)
app.put('/api/db/influencer-profiles/:id', async (req, res) => {
  try {
    const { db } = await connectToMongoDB();
    const { ObjectId } = require('mongodb');
    const profileData = {
      ...req.body,
      updated_at: new Date()
    };
    const result = await db.collection('influencer_profiles').updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: profileData }
    );
    if (result.modifiedCount > 0) {
      res.json({ success: true, data: profileData });
    } else {
      res.status(404).json({ success: false, error: '프로필을 찾을 수 없습니다' });
    }
  } catch (error) {
    console.error('❌ 인플루언서 프로필 업데이트 실패:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// 사용자 등록 (POST /api/db/user-register)
app.post('/api/db/user-register', async (req, res) => {
  try {
    console.log('🔐 사용자 등록 요청:', req.body);
    
    const { db } = await connectToMongoDB();
    const { name, email, password } = req.body;
    
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '이름, 이메일, 비밀번호를 모두 입력해주세요'
      });
    }
    
    // 중복 이메일 체크
    const existingUser = await db.collection('users').findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: '이미 존재하는 이메일입니다'
      });
    }
    
    // 새 사용자 생성
    const newUser = {
      user_id: `user_${Date.now()}`,
      name: name,
      email: email,
      password: password, // 실제로는 해시화해야 함
      role: 'user',
      created_at: new Date(),
      updated_at: new Date()
    };
    
    const result = await db.collection('users').insertOne(newUser);
    
    console.log('✅ 사용자 등록 성공:', newUser.email);
    
    res.json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        user: {
          _id: result.insertedId,
          user_id: newUser.user_id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role
        },
        token: `user_token_${Date.now()}`
      }
    });
  } catch (error) {
    console.error('❌ 사용자 등록 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'API 엔드포인트를 찾을 수 없습니다',
    path: req.originalUrl,
    method: req.method
  });
});

module.exports = app;