const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE';

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseKey);

async function addSupabaseSampleData() {
  try {
    console.log('🔗 Supabase 연결 테스트 중...');

    // 연결 테스트
    const { data: testData, error: testError } = await supabase
      .from('campaigns')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase 연결 실패:', testError);
      return;
    }

    console.log('✅ Supabase 연결 성공!');

    // 기존 캠페인 데이터 확인
    const { data: existingCampaigns, error: existingError } = await supabase
      .from('campaigns')
      .select('*');

    if (existingError) {
      console.error('❌ 기존 캠페인 조회 실패:', existingError);
      return;
    }

    console.log(`📊 기존 캠페인 수: ${existingCampaigns.length}`);

    // 샘플 캠페인 데이터
    const sampleCampaigns = [
      {
        title: '신제품 체험단 모집',
        description: '최신 스마트폰을 무료로 체험해보세요!',
        category: '전자제품',
        location: '서울시 강남구',
        start_date: '2024-01-15',
        end_date: '2024-02-15',
        max_participants: 50,
        current_participants: 12,
        points_reward: 1000,
        requirements: '인스타그램 팔로워 1000명 이상',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: '맛집 체험단 모집',
        description: '새로 오픈한 한식당에서 맛있는 식사를 체험해보세요!',
        category: '맛집',
        location: '서울시 홍대',
        start_date: '2024-01-20',
        end_date: '2024-02-20',
        max_participants: 30,
        current_participants: 8,
        points_reward: 500,
        requirements: '블로그 운영자 우대',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: '뷰티 제품 체험단',
        description: '새로운 스킨케어 제품을 체험하고 리뷰를 작성해주세요!',
        category: '뷰티',
        location: '전국',
        start_date: '2024-01-25',
        end_date: '2024-02-25',
        max_participants: 100,
        current_participants: 25,
        points_reward: 800,
        requirements: '뷰티 관심자',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: '여행 체험단 모집',
        description: '제주도 2박 3일 여행을 체험해보세요!',
        category: '여행',
        location: '제주도',
        start_date: '2024-02-01',
        end_date: '2024-03-01',
        max_participants: 20,
        current_participants: 5,
        points_reward: 2000,
        requirements: '여행 블로그 운영자',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        title: '패션 체험단 모집',
        description: '새로운 브랜드의 옷을 체험하고 스타일링을 공유해주세요!',
        category: '패션',
        location: '서울시 명동',
        start_date: '2024-02-05',
        end_date: '2024-03-05',
        max_participants: 40,
        current_participants: 15,
        points_reward: 1200,
        requirements: '패션 관심자',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    // 캠페인 데이터 추가
    if (existingCampaigns.length === 0) {
      console.log('📝 샘플 캠페인 데이터 추가 중...');
      
      const { data: insertedCampaigns, error: insertError } = await supabase
        .from('campaigns')
        .insert(sampleCampaigns)
        .select();

      if (insertError) {
        console.error('❌ 캠페인 데이터 추가 실패:', insertError);
        return;
      }

      console.log('✅ 샘플 캠페인 데이터 추가 완료!');
      console.log(`📊 추가된 캠페인 수: ${insertedCampaigns.length}`);
      
      // 추가된 캠페인 정보 출력
      insertedCampaigns.forEach((campaign, index) => {
        console.log(`${index + 1}. ${campaign.title} (${campaign.category})`);
      });
    } else {
      console.log('ℹ️ 이미 캠페인 데이터가 존재합니다.');
    }

    // 샘플 사용자 데이터 추가
    const { data: existingUsers, error: usersError } = await supabase
      .from('users')
      .select('*');

    if (usersError) {
      console.error('❌ 기존 사용자 조회 실패:', usersError);
      return;
    }

    console.log(`📊 기존 사용자 수: ${existingUsers.length}`);

    if (existingUsers.length === 0) {
      console.log('📝 샘플 사용자 데이터 추가 중...');
      
      const sampleUsers = [
        {
          user_id: 'user_001',
          email: 'test1@example.com',
          name: '김민수',
          google_id: 'google_001',
          profile_image: 'https://via.placeholder.com/150',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          user_id: 'user_002',
          email: 'test2@example.com',
          name: '이지영',
          google_id: 'google_002',
          profile_image: 'https://via.placeholder.com/150',
          is_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];

      const { data: insertedUsers, error: insertUsersError } = await supabase
        .from('users')
        .insert(sampleUsers)
        .select();

      if (insertUsersError) {
        console.error('❌ 사용자 데이터 추가 실패:', insertUsersError);
        return;
      }

      console.log('✅ 샘플 사용자 데이터 추가 완료!');
      console.log(`📊 추가된 사용자 수: ${insertedUsers.length}`);
    } else {
      console.log('ℹ️ 이미 사용자 데이터가 존재합니다.');
    }

    console.log('🎉 Supabase 샘플 데이터 추가 완료!');

  } catch (error) {
    console.error('❌ 샘플 데이터 추가 실패:', error);
  }
}

// 스크립트 실행
addSupabaseSampleData();
