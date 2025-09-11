const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwwwesxzlpotabtcvkgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function testApplication() {
  try {
    console.log('🧪 캠페인 신청 테스트 시작...');
    
    // 테스트 신청 데이터
    const testApplicationData = {
      user_id: 'test-user-' + Date.now(),
      experience_id: 'test-campaign-' + Date.now(),
      status: 'pending',
      applied_at: new Date().toISOString(),
      name: '테스트 사용자',
      email: 'test@example.com',
      phone: '010-1234-5678',
      address: '서울시 강남구',
      detailed_address: '테헤란로 123',
      instagram_handle: '@testuser',
      blog_url: 'https://blog.test.com',
      youtube_channel: 'Test Channel',
      application_reason: '테스트 신청입니다',
      experience_plan: '테스트 체험 계획입니다',
      platform_type: 'instagram',
      submitted_by_role: 'user',
      debug_info: { test: true, timestamp: new Date().toISOString() }
    };
    
    console.log('📝 테스트 신청 데이터:', testApplicationData);
    
    // user_applications 테이블에 삽입 시도
    const { data, error } = await supabase
      .from('user_applications')
      .insert([testApplicationData])
      .select()
      .single();
    
    if (error) {
      console.error('❌ 신청 삽입 실패:', error);
      console.error('❌ 에러 코드:', error.code);
      console.error('❌ 에러 메시지:', error.message);
      console.error('❌ 에러 세부사항:', error.details);
      console.error('❌ 에러 힌트:', error.hint);
    } else {
      console.log('✅ 신청 삽입 성공!');
      console.log('📊 삽입된 데이터:', data);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실패:', error);
  }
}

testApplication();
