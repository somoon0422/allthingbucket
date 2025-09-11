const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = process.env.SUPABASE_URL || 'https://nwwwesxzlpotabtcvkgj.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MDkyNzQsImV4cCI6MjA3MzA4NTI3NH0.Xw7l2aARgkxognpP1G94_lIMHEKS_fwqkpFTXauSKYE';

// Supabase 클라이언트 초기화
const supabase = createClient(supabaseUrl, supabaseKey);

async function addAdminAccount() {
  try {
    console.log('🔗 Supabase 연결 테스트 중...');
    
    // 연결 테스트
    const { data: testData, error: testError } = await supabase
      .from('admins')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase 연결 실패:', testError);
      return;
    }
    
    console.log('✅ Supabase 연결 성공!');
    
    // 기존 어드민 계정 확인
    const { data: existingAdmins, error: existingError } = await supabase
      .from('admins')
      .select('*')
      .eq('username', 'admin');
    
    if (existingError) {
      console.error('❌ 기존 어드민 계정 조회 실패:', existingError);
      return;
    }
    
    console.log(`📊 기존 어드민 계정 수: ${existingAdmins.length}개`);
    
    if (existingAdmins.length > 0) {
      console.log('ℹ️ 어드민 계정이 이미 존재합니다.');
      console.log('📋 기존 어드민 계정:');
      existingAdmins.forEach((admin, index) => {
        console.log(`  ${index + 1}. ${admin.username} (${admin.role})`);
      });
      return;
    }
    
    // 기본 어드민 계정 추가
    console.log('📝 기본 어드민 계정 추가 중...');
    
    const adminData = {
      username: 'admin',
      password: 'admin123',
      email: 'admin@allthingbucket.com',
      role: 'super_admin',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_login: null
    };
    
    const { data: insertedAdmin, error: insertError } = await supabase
      .from('admins')
      .insert([adminData])
      .select();
    
    if (insertError) {
      console.error('❌ 어드민 계정 추가 실패:', insertError);
      return;
    }
    
    console.log('✅ 기본 어드민 계정 추가 완료!');
    console.log('📋 추가된 어드민 계정:');
    console.log(`  - 사용자명: ${insertedAdmin[0].username}`);
    console.log(`  - 비밀번호: ${insertedAdmin[0].password}`);
    console.log(`  - 역할: ${insertedAdmin[0].role}`);
    console.log(`  - 이메일: ${insertedAdmin[0].email}`);
    
    console.log('\n🎉 어드민 계정 설정 완료!');
    console.log('🔐 로그인 정보:');
    console.log('  - 관리자명: admin');
    console.log('  - 비밀번호: admin123');
    
  } catch (error) {
    console.error('❌ 어드민 계정 추가 실패:', error);
  }
}

// 어드민 계정 추가 실행
addAdminAccount().catch(console.error);
