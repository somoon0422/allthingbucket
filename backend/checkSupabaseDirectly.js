// Supabase 대시보드에서 직접 확인할 수 있는 정보들

console.log('🔍 Supabase 연결 정보:');
console.log('URL:', 'https://nwwwesxzlpotabtcvkgj.supabase.co');
console.log('API Key:', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8');

console.log('\n📋 확인해야 할 사항들:');
console.log('1. Supabase 대시보드 → Table Editor에서 user_applications 테이블이 존재하는지 확인');
console.log('2. RLS (Row Level Security)가 비활성화되어 있는지 확인');
console.log('3. API 키가 올바른지 확인');
console.log('4. 네트워크 연결 상태 확인');

console.log('\n🧪 테스트 방법:');
console.log('1. Supabase 대시보드 → SQL Editor에서 다음 쿼리 실행:');
console.log('   SELECT * FROM user_applications LIMIT 5;');
console.log('2. 만약 테이블이 없다면 다음 SQL 실행:');
console.log('   CREATE TABLE public.user_applications (id uuid DEFAULT gen_random_uuid() PRIMARY KEY, user_id varchar(255), experience_id varchar(255), status varchar(20) DEFAULT \'pending\', applied_at timestamptz, created_at timestamptz DEFAULT now(), name varchar(100), email varchar(255), phone varchar(20), address text, detailed_address text, instagram_handle varchar(100), blog_url text, youtube_channel text, application_reason text, experience_plan text, platform_type varchar(50), submitted_by_role varchar(50), submitted_by_admin_role varchar(50), debug_info jsonb);');

console.log('\n🌐 웹사이트에서 테스트:');
console.log('1. https://allthingbucket-kt59jwlni-allthingbuckets-projects.vercel.app 접속');
console.log('2. 체험단 페이지에서 캠페인 신청 시도');
console.log('3. 브라우저 개발자 도구 (F12) → Console 탭에서 에러 확인');
console.log('4. Network 탭에서 Supabase API 호출 상태 확인');
