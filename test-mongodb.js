const { MongoClient } = require('mongodb');

const connectionString = 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';

async function testMongoDB() {
  let client;
  try {
    console.log('🔗 MongoDB 연결 시도...');
    client = new MongoClient(connectionString, {
      tls: true,
      tlsAllowInvalidCertificates: true,
      tlsAllowInvalidHostnames: true,
    });
    
    await client.connect();
    const db = client.db('allthingbucket');
    
    console.log('✅ MongoDB 연결 성공!');
    
    // 컬렉션 목록 확인
    const collections = await db.listCollections().toArray();
    console.log('📋 컬렉션 목록:', collections.map(c => c.name));
    
    // 캠페인 데이터 확인
    const campaigns = await db.collection('campaigns').find({}).toArray();
    console.log('🎯 캠페인 데이터:', campaigns.length, '개');
    if (campaigns.length > 0) {
      console.log('샘플 캠페인:', JSON.stringify(campaigns[0], null, 2));
    }
    
    // 사용자 프로필 데이터 확인
    const userProfiles = await db.collection('user_profiles').find({}).toArray();
    console.log('👤 사용자 프로필 데이터:', userProfiles.length, '개');
    if (userProfiles.length > 0) {
      console.log('샘플 사용자:', JSON.stringify(userProfiles[0], null, 2));
    }
    
    // 관리자 데이터 확인
    const admins = await db.collection('admins').find({}).toArray();
    console.log('👨‍💼 관리자 데이터:', admins.length, '개');
    if (admins.length > 0) {
      console.log('샘플 관리자:', JSON.stringify(admins[0], null, 2));
    }
    
  } catch (error) {
    console.error('❌ MongoDB 테스트 실패:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('✅ MongoDB 연결 종료');
    }
  }
}

testMongoDB();
