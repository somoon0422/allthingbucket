const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwwwesxzlpotabtcvkgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testCampaignCreation() {
  try {
    console.log('🧪 캠페인 생성 테스트 시작...');
    
    // 테스트 캠페인 데이터
    const testCampaignData = {
      campaign_name: '테스트 캠페인 ' + Date.now(),
      product_name: '테스트 제품',
      brand_name: '테스트 브랜드',
      description: '테스트 캠페인 설명입니다',
      type: 'purchase_review',
      status: 'active',
      max_participants: 10,
      current_participants: 0,
      start_date: new Date().toISOString(),
      end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30일 후
      application_start: new Date().toISOString(),
      application_end: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7일 후
      content_start: new Date().toISOString(),
      content_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      requirements: '테스트 요구사항',
      rewards: '1000P',
      main_images: ['https://via.placeholder.com/300'],
      detail_images: ['https://via.placeholder.com/600'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('📝 테스트 캠페인 데이터:', testCampaignData);
    
    // campaigns 테이블에 삽입 시도
    const { data, error } = await supabase
      .from('campaigns')
      .insert([testCampaignData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 캠페인 생성 실패:', error);
      console.error('❌ 에러 코드:', error.code);
      console.error('❌ 에러 메시지:', error.message);
      console.error('❌ 에러 세부사항:', error.details);
      console.error('❌ 에러 힌트:', error.hint);
    } else {
      console.log('✅ 캠페인 생성 성공!');
      console.log('📊 생성된 캠페인:', data);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testCampaignCreation();
