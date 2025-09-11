const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwwwesxzlpotabtcvkgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  try {
    console.log('🔍 Supabase 테이블 확인 중...');
    
    // campaigns 테이블 확인
    const { data: campaigns, error: campaignsError } = await supabase
      .from('campaigns')
      .select('*')
      .limit(1);
    
    console.log('📋 campaigns 테이블:', campaignsError ? '❌ 에러: ' + campaignsError.message : '✅ 존재함');
    
    // user_applications 테이블 확인
    const { data: applications, error: applicationsError } = await supabase
      .from('user_applications')
      .select('*')
      .limit(1);
    
    console.log('📝 user_applications 테이블:', applicationsError ? '❌ 에러: ' + applicationsError.message : '✅ 존재함');
    
    // experience_codes 테이블 확인
    const { data: codes, error: codesError } = await supabase
      .from('experience_codes')
      .select('*')
      .limit(1);
    
    console.log('🎫 experience_codes 테이블:', codesError ? '❌ 에러: ' + codesError.message : '✅ 존재함');
    
    // users 테이블 확인
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(1);
    
    console.log('👤 users 테이블:', usersError ? '❌ 에러: ' + usersError.message : '✅ 존재함');
    
  } catch (error) {
    console.error('❌ 테이블 확인 실패:', error);
  }
}

checkTables();
