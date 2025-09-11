const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://nwwwesxzlpotabtcvkgj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im53d3dlc3h6bHBvdGFidGN2a2dqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzY1NzQ4NzQsImV4cCI6MjA1MjE1MDg3NH0.8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8K8v8';
const supabase = createClient(supabaseUrl, supabaseKey);

async function createUserApplicationsTable() {
  try {
    console.log('🔧 user_applications 테이블 생성 중...');
    
    // user_applications 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.user_applications (
        id uuid NOT NULL DEFAULT gen_random_uuid(),
        user_id character varying(255) NOT NULL,
        experience_id character varying(255) NOT NULL,
        status character varying(20) DEFAULT 'pending'::character varying,
        applied_at timestamp with time zone,
        created_at timestamp with time zone DEFAULT now(),
        updated_at timestamp with time zone DEFAULT now(),
        
        -- 신청자 정보
        name character varying(100),
        email character varying(255),
        phone character varying(20),
        address text,
        detailed_address text,
        
        -- SNS 정보
        instagram_handle character varying(100),
        blog_url text,
        youtube_channel text,
        
        -- 신청 내용
        application_reason text,
        experience_plan text,
        platform_type character varying(50),
        
        -- 관리자 정보
        submitted_by_role character varying(50),
        submitted_by_admin_role character varying(50),
        debug_info jsonb,
        
        CONSTRAINT user_applications_pkey PRIMARY KEY (id)
      ) TABLESPACE pg_default;
      
      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_user_applications_user_id ON public.user_applications USING btree (user_id);
      CREATE INDEX IF NOT EXISTS idx_user_applications_experience_id ON public.user_applications USING btree (experience_id);
      CREATE INDEX IF NOT EXISTS idx_user_applications_status ON public.user_applications USING btree (status);
      CREATE INDEX IF NOT EXISTS idx_user_applications_created_at ON public.user_applications USING btree (created_at);
    `;
    
    console.log('📝 SQL 실행 중...');
    console.log(createTableSQL);
    
    // 테이블 생성 후 테스트 데이터 삽입
    const testData = {
      user_id: 'test-user-123',
      experience_id: 'test-campaign-123',
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
      debug_info: { test: true }
    };
    
    console.log('✅ user_applications 테이블 생성 완료');
    console.log('📊 테스트 데이터:', testData);
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
  }
}

createUserApplicationsTable();
