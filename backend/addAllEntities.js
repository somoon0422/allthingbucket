const { MongoClient } = require('mongodb');

// MongoDB 연결 문자열
const connectionString = 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';

async function addAllEntities() {
  const client = new MongoClient(connectionString, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas 연결 성공!');
    
    const db = client.db('allthingbucket');
    
    // 1. 관리자 데이터 추가
    const adminsCollection = db.collection('admins');
    const adminsCount = await adminsCollection.countDocuments();
    
    if (adminsCount === 0) {
      console.log('📝 관리자 데이터 추가 중...');
      
      const admins = [
        {
          _id: 'admin_1',
          username: 'admin',
          email: 'admin@allthingbucket.com',
          password_hash: 'admin123', // 실제로는 해시된 비밀번호
          role: 'super_admin',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await adminsCollection.insertMany(admins);
      console.log(`✅ 관리자 데이터 ${admins.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 관리자 데이터 이미 존재: ${adminsCount}개`);
    }
    
    // 2. 사용자 데이터 추가
    const usersCollection = db.collection('users');
    const usersCount = await usersCollection.countDocuments();
    
    if (usersCount === 0) {
      console.log('📝 사용자 데이터 추가 중...');
      
      const users = [
        {
          _id: 'user_1',
          email: 'influencer1@example.com',
          name: '김인플루언서',
          role: 'user',
          google_id: 'google_123456789',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          _id: 'user_2',
          email: 'reviewer2@example.com',
          name: '박리뷰어',
          role: 'user',
          google_id: 'google_987654321',
          is_active: true,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await usersCollection.insertMany(users);
      console.log(`✅ 사용자 데이터 ${users.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 사용자 데이터 이미 존재: ${usersCount}개`);
    }
    
    // 3. 사용자 리뷰 데이터 추가
    const userReviewsCollection = db.collection('user_reviews');
    const userReviewsCount = await userReviewsCollection.countDocuments();
    
    if (userReviewsCount === 0) {
      console.log('📝 사용자 리뷰 데이터 추가 중...');
      
      const userReviews = [
        {
          _id: 'review_1',
          user_id: 'user_1',
          experience_id: 'exp_code_1',
          title: '정말 좋은 제품이었습니다!',
          content: '프리미엄 스킨케어 제품을 체험해보니 정말 만족스럽습니다. 피부가 부드러워지고 촉촉해진 느낌이에요.',
          rating: 5,
          images: ['https://example.com/review1.jpg'],
          status: 'published',
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          _id: 'review_2',
          user_id: 'user_2',
          experience_id: 'exp_code_2',
          title: '패션 아이템 추천!',
          content: '새로운 시즌 컬렉션을 체험해보니 트렌디하고 품질도 좋습니다. 스타일링하기도 편해요.',
          rating: 4,
          images: ['https://example.com/review2.jpg'],
          status: 'published',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await userReviewsCollection.insertMany(userReviews);
      console.log(`✅ 사용자 리뷰 데이터 ${userReviews.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 사용자 리뷰 데이터 이미 존재: ${userReviewsCount}개`);
    }
    
    // 4. 리뷰 제출 데이터 추가
    const reviewSubmissionsCollection = db.collection('review_submissions');
    const reviewSubmissionsCount = await reviewSubmissionsCollection.countDocuments();
    
    if (reviewSubmissionsCount === 0) {
      console.log('📝 리뷰 제출 데이터 추가 중...');
      
      const reviewSubmissions = [
        {
          _id: 'submission_1',
          user_id: 'user_1',
          campaign_id: 'campaign_1',
          content: '정말 좋은 제품이었습니다!',
          rating: 5,
          status: 'submitted',
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await reviewSubmissionsCollection.insertMany(reviewSubmissions);
      console.log(`✅ 리뷰 제출 데이터 ${reviewSubmissions.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 리뷰 제출 데이터 이미 존재: ${reviewSubmissionsCount}개`);
    }
    
    // 5. 사용자 포인트 데이터 추가
    const userPointsCollection = db.collection('user_points');
    const userPointsCount = await userPointsCollection.countDocuments();
    
    if (userPointsCount === 0) {
      console.log('📝 사용자 포인트 데이터 추가 중...');
      
      const userPoints = [
        {
          _id: 'user_points_1',
          user_id: 'user_1',
          total_points: 5000,
          available_points: 3000,
          used_points: 2000,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          _id: 'user_points_2',
          user_id: 'user_2',
          total_points: 3000,
          available_points: 2500,
          used_points: 500,
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await userPointsCollection.insertMany(userPoints);
      console.log(`✅ 사용자 포인트 데이터 ${userPoints.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 사용자 포인트 데이터 이미 존재: ${userPointsCount}개`);
    }
    
    // 6. 알림 데이터 추가
    const notificationsCollection = db.collection('notifications');
    const notificationsCount = await notificationsCollection.countDocuments();
    
    if (notificationsCount === 0) {
      console.log('📝 알림 데이터 추가 중...');
      
      const notifications = [
        {
          _id: 'notification_1',
          user_id: 'user_1',
          title: '캠페인 승인 알림',
          message: '신청하신 캠페인이 승인되었습니다.',
          type: 'campaign_approval',
          is_read: false,
          created_at: new Date()
        }
      ];
      
      await notificationsCollection.insertMany(notifications);
      console.log(`✅ 알림 데이터 ${notifications.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 알림 데이터 이미 존재: ${notificationsCount}개`);
    }
    
    // 7. 출금 요청 데이터 추가
    const withdrawalRequestsCollection = db.collection('withdrawal_requests');
    const withdrawalRequestsCount = await withdrawalRequestsCollection.countDocuments();
    
    if (withdrawalRequestsCount === 0) {
      console.log('📝 출금 요청 데이터 추가 중...');
      
      const withdrawalRequests = [
        {
          _id: 'withdrawal_1',
          user_id: 'user_1',
          amount: 10000,
          status: 'pending',
          request_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await withdrawalRequestsCollection.insertMany(withdrawalRequests);
      console.log(`✅ 출금 요청 데이터 ${withdrawalRequests.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 출금 요청 데이터 이미 존재: ${withdrawalRequestsCount}개`);
    }
    
    console.log('\n🎉 모든 엔티티 데이터 추가 완료!');
    
    // 모든 컬렉션 상태 확인
    console.log('\n📋 현재 컬렉션 상태:');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count}개 문서`);
    }
    
  } catch (error) {
    console.error('❌ 엔티티 데이터 추가 실패:', error);
  } finally {
    await client.close();
  }
}

// 모든 엔티티 데이터 추가 실행
addAllEntities().catch(console.error);
