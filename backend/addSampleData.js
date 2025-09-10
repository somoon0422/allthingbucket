const { MongoClient } = require('mongodb');

// MongoDB 연결 문자열
const connectionString = 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';

async function addSampleData() {
  const client = new MongoClient(connectionString, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas 연결 성공!');
    
    const db = client.db('allthingbucket');
    
    // 체험단 코드 데이터 추가
    const experienceCodesCollection = db.collection('experience_codes');
    const experienceCodesCount = await experienceCodesCollection.countDocuments();
    
    if (experienceCodesCount === 0) {
      console.log('📝 체험단 코드 데이터 추가 중...');
      
      const experienceCodes = [
        {
          _id: 'exp_code_1',
          experience_name: '프리미엄 스킨케어 체험단',
          title: '뷰티브랜드 스킨케어 체험단 모집',
          brand: '뷰티브랜드',
          brand_name: '뷰티브랜드',
          company: '뷰티코리아',
          product_name: '프리미엄 스킨케어 세트',
          product_category: '스킨케어',
          description: '프리미엄 스킨케어 제품을 체험하고 솔직한 리뷰를 작성해주세요.',
          requirements: '인스타그램 팔로워 1만명 이상, 뷰티 콘텐츠 경험자',
          reward_points: 5000,
          recruitment_count: 20,
          current_applicants: 0,
          status: 'recruiting',
          start_date: new Date('2024-09-01'),
          end_date: new Date('2024-09-30'),
          review_deadline: new Date('2024-10-15'),
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin_1'
        },
        {
          _id: 'exp_code_2',
          experience_name: '패션 브랜드 체험단',
          title: '트렌디 패션 체험단 모집',
          brand: '패션브랜드',
          brand_name: '패션브랜드',
          company: '패션코리아',
          product_name: '시즌 컬렉션 의류',
          product_category: '패션',
          description: '새로운 시즌 컬렉션을 체험하고 스타일링을 공유해주세요.',
          requirements: '패션 인플루언서, 스타일링 경험자',
          reward_points: 3000,
          recruitment_count: 15,
          current_applicants: 0,
          status: 'recruiting',
          start_date: new Date('2024-09-15'),
          end_date: new Date('2024-10-15'),
          review_deadline: new Date('2024-10-30'),
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin_1'
        },
        {
          _id: 'exp_code_3',
          experience_name: '푸드 브랜드 체험단',
          title: '건강한 간식 체험단 모집',
          brand: '푸드브랜드',
          brand_name: '푸드브랜드',
          company: '푸드코리아',
          product_name: '프리미엄 간식 세트',
          product_category: '푸드',
          description: '건강한 간식을 체험하고 맛 리뷰를 작성해주세요.',
          requirements: '푸드 인플루언서, 맛 리뷰 경험자',
          reward_points: 2000,
          recruitment_count: 10,
          current_applicants: 0,
          status: 'recruiting',
          start_date: new Date('2024-10-01'),
          end_date: new Date('2024-10-31'),
          review_deadline: new Date('2024-11-15'),
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin_1'
        }
      ];
      
      await experienceCodesCollection.insertMany(experienceCodes);
      console.log(`✅ 체험단 코드 데이터 ${experienceCodes.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 체험단 코드 데이터 이미 존재: ${experienceCodesCount}개`);
    }
    
    // 사용자 신청 데이터 추가
    const userApplicationsCollection = db.collection('user_applications');
    const userApplicationsCount = await userApplicationsCollection.countDocuments();
    
    if (userApplicationsCount === 0) {
      console.log('📝 사용자 신청 데이터 추가 중...');
      
      const userApplications = [
        {
          _id: 'app_1',
          user_id: 'user_1',
          campaign_id: 'campaign_1',
          status: 'pending',
          application_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          _id: 'app_2',
          user_id: 'user_2',
          campaign_id: 'campaign_2',
          status: 'approved',
          application_date: new Date(),
          created_at: new Date(),
          updated_at: new Date()
        }
      ];
      
      await userApplicationsCollection.insertMany(userApplications);
      console.log(`✅ 사용자 신청 데이터 ${userApplications.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 사용자 신청 데이터 이미 존재: ${userApplicationsCount}개`);
    }
    
    // 포인트 히스토리 데이터 추가
    const pointsHistoryCollection = db.collection('points_history');
    const pointsHistoryCount = await pointsHistoryCollection.countDocuments();
    
    if (pointsHistoryCount === 0) {
      console.log('📝 포인트 히스토리 데이터 추가 중...');
      
      const pointsHistory = [
        {
          _id: 'points_1',
          user_id: 'user_1',
          points: 1000,
          type: 'earned',
          source: 'campaign_completion',
          description: '캠페인 완료 보상',
          created_at: new Date()
        },
        {
          _id: 'points_2',
          user_id: 'user_2',
          points: 500,
          type: 'earned',
          source: 'signup_bonus',
          description: '회원가입 보너스',
          created_at: new Date()
        }
      ];
      
      await pointsHistoryCollection.insertMany(pointsHistory);
      console.log(`✅ 포인트 히스토리 데이터 ${pointsHistory.length}개 추가 완료`);
    } else {
      console.log(`ℹ️ 포인트 히스토리 데이터 이미 존재: ${pointsHistoryCount}개`);
    }
    
    console.log('\n🎉 샘플 데이터 추가 완료!');
    
    // 모든 컬렉션 상태 확인
    console.log('\n📋 현재 컬렉션 상태:');
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count}개 문서`);
    }
    
  } catch (error) {
    console.error('❌ 샘플 데이터 추가 실패:', error);
  } finally {
    await client.close();
  }
}

// 샘플 데이터 추가 실행
addSampleData().catch(console.error);
