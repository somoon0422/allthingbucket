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
      console.error('❌ 기존 캠페인 데이터 조회 실패:', existingError);
      return;
    }
    
    console.log(`📊 기존 캠페인 수: ${existingCampaigns.length}개`);
    
    if (existingCampaigns.length > 0) {
      console.log('ℹ️ 캠페인 데이터가 이미 존재합니다. 추가하지 않습니다.');
      return;
    }
    
    // 샘플 캠페인 데이터 추가
    console.log('📝 샘플 캠페인 데이터 추가 중...');
    
    const sampleCampaigns = [
      {
        id: 'campaign_1',
        title: '프리미엄 스킨케어 체험단',
        campaign_name: '프리미엄 스킨케어 체험단',
        experience_name: '프리미엄 스킨케어 체험단',
        brand: '뷰티브랜드',
        brand_name: '뷰티브랜드',
        company: '뷰티코리아',
        product_name: '프리미엄 스킨케어 세트',
        product_category: '스킨케어',
        description: '프리미엄 스킨케어 제품을 체험하고 솔직한 리뷰를 작성해주세요. 고품질 스킨케어 제품의 효과를 직접 경험해보실 수 있습니다.',
        requirements: '인스타그램 팔로워 1만명 이상, 뷰티 콘텐츠 경험자',
        reward_points: 5000,
        points_reward: 5000,
        recruitment_count: 20,
        max_participants: 20,
        current_applicants: 0,
        status: 'recruiting',
        campaign_status: 'recruiting',
        start_date: new Date('2024-09-01').toISOString(),
        end_date: new Date('2024-09-30').toISOString(),
        application_start_date: new Date('2024-09-01').toISOString(),
        application_deadline: new Date('2024-09-25').toISOString(),
        content_start_date: new Date('2024-09-26').toISOString(),
        content_end_date: new Date('2024-10-15').toISOString(),
        review_deadline: new Date('2024-10-15').toISOString(),
        influencer_announcement_date: new Date('2024-09-26').toISOString(),
        result_announcement_date: new Date('2024-09-26').toISOString(),
        experience_location: '전국',
        experience_period: '2주',
        provided_items: '<p>프리미엄 스킨케어 세트 (토너, 세럼, 크림)</p>',
        campaign_mission: '<p>제품 사용 후 솔직한 리뷰 작성</p><p>인스타그램 스토리 3회 이상 게시</p>',
        keywords: '스킨케어,뷰티,체험단,리뷰',
        product_links: 'https://example.com/product1',
        additional_guidelines: '<p>제품 사용 후 2주 내 리뷰 작성 필수</p>',
        image_url: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
        main_image: 'https://images.pexels.com/photos/1181406/pexels-photo-1181406.jpeg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin_1'
      },
      {
        id: 'campaign_2',
        title: '트렌디 패션 체험단',
        campaign_name: '트렌디 패션 체험단',
        experience_name: '트렌디 패션 체험단',
        brand: '패션브랜드',
        brand_name: '패션브랜드',
        company: '패션코리아',
        product_name: '시즌 컬렉션 의류',
        product_category: '패션',
        description: '새로운 시즌 컬렉션을 체험하고 스타일링을 공유해주세요. 트렌디한 패션 아이템으로 스타일을 완성해보세요.',
        requirements: '패션 인플루언서, 스타일링 경험자',
        reward_points: 3000,
        points_reward: 3000,
        recruitment_count: 15,
        max_participants: 15,
        current_applicants: 0,
        status: 'recruiting',
        campaign_status: 'recruiting',
        start_date: new Date('2024-09-15').toISOString(),
        end_date: new Date('2024-10-15').toISOString(),
        application_start_date: new Date('2024-09-15').toISOString(),
        application_deadline: new Date('2024-10-10').toISOString(),
        content_start_date: new Date('2024-10-11').toISOString(),
        content_end_date: new Date('2024-10-30').toISOString(),
        review_deadline: new Date('2024-10-30').toISOString(),
        influencer_announcement_date: new Date('2024-10-11').toISOString(),
        result_announcement_date: new Date('2024-10-11').toISOString(),
        experience_location: '서울, 경기',
        experience_period: '1주',
        provided_items: '<p>시즌 컬렉션 의류 2벌</p>',
        campaign_mission: '<p>의류 착용 후 스타일링 사진 촬영</p><p>인스타그램 피드 게시</p>',
        keywords: '패션,스타일링,체험단,의류',
        product_links: 'https://example.com/product2',
        additional_guidelines: '<p>의류 착용 후 1주 내 콘텐츠 제작 필수</p>',
        image_url: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
        main_image: 'https://images.pexels.com/photos/1043474/pexels-photo-1043474.jpeg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin_1'
      },
      {
        id: 'campaign_3',
        title: '건강한 간식 체험단',
        campaign_name: '건강한 간식 체험단',
        experience_name: '건강한 간식 체험단',
        brand: '푸드브랜드',
        brand_name: '푸드브랜드',
        company: '푸드코리아',
        product_name: '프리미엄 간식 세트',
        product_category: '푸드',
        description: '건강한 간식을 체험하고 맛 리뷰를 작성해주세요. 자연 재료로 만든 프리미엄 간식의 맛을 경험해보세요.',
        requirements: '푸드 인플루언서, 맛 리뷰 경험자',
        reward_points: 2000,
        points_reward: 2000,
        recruitment_count: 10,
        max_participants: 10,
        current_applicants: 0,
        status: 'recruiting',
        campaign_status: 'recruiting',
        start_date: new Date('2024-10-01').toISOString(),
        end_date: new Date('2024-10-31').toISOString(),
        application_start_date: new Date('2024-10-01').toISOString(),
        application_deadline: new Date('2024-10-25').toISOString(),
        content_start_date: new Date('2024-10-26').toISOString(),
        content_end_date: new Date('2024-11-15').toISOString(),
        review_deadline: new Date('2024-11-15').toISOString(),
        influencer_announcement_date: new Date('2024-10-26').toISOString(),
        result_announcement_date: new Date('2024-10-26').toISOString(),
        experience_location: '전국',
        experience_period: '1주',
        provided_items: '<p>프리미엄 간식 세트 (과자, 견과류, 차)</p>',
        campaign_mission: '<p>간식 맛보기 후 솔직한 리뷰 작성</p><p>인스타그램 스토리 게시</p>',
        keywords: '간식,푸드,체험단,리뷰',
        product_links: 'https://example.com/product3',
        additional_guidelines: '<p>간식 체험 후 1주 내 리뷰 작성 필수</p>',
        image_url: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        main_image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        created_by: 'admin_1'
      }
    ];
    
    const { data: insertedCampaigns, error: insertError } = await supabase
      .from('campaigns')
      .insert(sampleCampaigns)
      .select();
    
    if (insertError) {
      console.error('❌ 캠페인 데이터 추가 실패:', insertError);
      return;
    }
    
    console.log(`✅ 샘플 캠페인 데이터 ${insertedCampaigns.length}개 추가 완료!`);
    
    // 추가된 데이터 확인
    console.log('\n📋 추가된 캠페인:');
    insertedCampaigns.forEach((campaign, index) => {
      console.log(`  ${index + 1}. ${campaign.title} (${campaign.brand})`);
    });
    
    // 전체 캠페인 수 확인
    const { data: allCampaigns, error: allError } = await supabase
      .from('campaigns')
      .select('*');
    
    if (!allError) {
      console.log(`\n📊 현재 총 캠페인 수: ${allCampaigns.length}개`);
    }
    
    console.log('\n🎉 Supabase 샘플 데이터 추가 완료!');
    
  } catch (error) {
    console.error('❌ 샘플 데이터 추가 실패:', error);
  }
}

// 샘플 데이터 추가 실행
addSupabaseSampleData().catch(console.error);
