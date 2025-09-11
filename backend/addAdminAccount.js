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
      .from('admin_users')
      .select('count')
      .limit(1);

    if (testError) {
      console.error('❌ Supabase 연결 실패:', testError);
      return;
    }

    console.log('✅ Supabase 연결 성공!');

    // 기존 관리자 계정 확인
    const { data: existingAdmins, error: existingError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('username', 'admin');

    if (existingError) {
      console.error('❌ 기존 관리자 조회 실패:', existingError);
      return;
    }

    console.log(`📊 기존 관리자 수: ${existingAdmins.length}`);

    if (existingAdmins.length === 0) {
      console.log('📝 기본 관리자 계정 생성 중...');
      
      // 기본 관리자 계정 생성
      const adminData = {
        username: 'admin',
        password: 'admin123', // 실제로는 해시화해야 함
        email: 'admin@allthingbucket.com',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data: insertedAdmin, error: insertError } = await supabase
        .from('admin_users')
        .insert([adminData])
        .select();

      if (insertError) {
        console.error('❌ 관리자 계정 생성 실패:', insertError);
        return;
      }

      console.log('✅ 기본 관리자 계정 생성 완료!');
      console.log('📋 관리자 정보:');
      console.log(`   - 사용자명: ${insertedAdmin[0].username}`);
      console.log(`   - 비밀번호: ${insertedAdmin[0].password}`);
      console.log(`   - 이메일: ${insertedAdmin[0].email}`);
      console.log(`   - 역할: ${insertedAdmin[0].role}`);
    } else {
      console.log('ℹ️ 이미 관리자 계정이 존재합니다.');
      console.log('📋 기존 관리자 정보:');
      existingAdmins.forEach((admin, index) => {
        console.log(`${index + 1}. ${admin.username} (${admin.email})`);
      });
    }

    console.log('🎉 관리자 계정 설정 완료!');

  } catch (error) {
    console.error('❌ 관리자 계정 생성 실패:', error);
  }
}

// 스크립트 실행
addAdminAccount();