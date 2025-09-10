const { MongoClient } = require('mongodb');

// MongoDB 연결 문자열
const connectionString = 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';

async function addAdmins() {
  const client = new MongoClient(connectionString, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas 연결 성공!');
    
    const db = client.db('allthingbucket');
    
    // 관리자 데이터 추가
    const adminsCollection = db.collection('admins');
    
    // 기존 데이터 삭제 후 새로 추가
    await adminsCollection.deleteMany({});
    console.log('🗑️ 기존 관리자 데이터 삭제 완료');
    
    console.log('📝 관리자 데이터 추가 중...');
    
    const admins = [
      {
        _id: 'admin_1',
        username: 'admin',
        email: 'admin@allthingbucket.com',
        password_hash: 'admin123', // 실제로는 해시된 비밀번호
        role: 'super_admin',
        is_active: true,
        last_login: null,
        created_at: new Date(),
        updated_at: new Date()
      },
      {
        _id: 'admin_2',
        username: 'moderator',
        email: 'moderator@allthingbucket.com',
        password_hash: 'moderator123',
        role: 'moderator',
        is_active: true,
        last_login: null,
        created_at: new Date(),
        updated_at: new Date()
      }
    ];
    
    await adminsCollection.insertMany(admins);
    console.log(`✅ 관리자 데이터 ${admins.length}개 추가 완료`);
    
    // 관리자 데이터 확인
    const adminCount = await adminsCollection.countDocuments();
    console.log(`📊 현재 관리자 수: ${adminCount}개`);
    
    const allAdmins = await adminsCollection.find({}).toArray();
    console.log('👥 관리자 목록:');
    allAdmins.forEach(admin => {
      console.log(`  - ${admin.username} (${admin.email}) - ${admin.role}`);
    });
    
  } catch (error) {
    console.error('❌ 관리자 데이터 추가 실패:', error);
  } finally {
    await client.close();
  }
}

// 관리자 데이터 추가 실행
addAdmins().catch(console.error);
