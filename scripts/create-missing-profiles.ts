/**
 * 모든 users 테이블 계정들의 user_profiles를 생성하는 일회성 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/create-missing-profiles.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// .env 파일 읽기
let supabaseUrl = ''
let supabaseKey = ''

try {
  const envPath = resolve(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  const envLines = envContent.split('\n')

  for (const line of envLines) {
    const [key, ...valueParts] = line.split('=')
    const value = valueParts.join('=').trim()

    if (key === 'VITE_SUPABASE_URL') {
      supabaseUrl = value
    } else if (key === 'VITE_SUPABASE_ANON_KEY') {
      supabaseKey = value
    }
  }
} catch (error) {
  console.error('❌ .env 파일을 읽을 수 없습니다:', error)
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다')
  console.error('VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인하세요')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createMissingProfiles() {
  try {
    console.log('🔍 users 테이블 조회 중...')

    // 1. 모든 users 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')

    if (usersError) {
      throw new Error(`users 테이블 조회 실패: ${usersError.message}`)
    }

    console.log(`✅ users 테이블: ${users?.length || 0}명`)

    // 2. 모든 user_profiles 조회
    console.log('🔍 user_profiles 테이블 조회 중...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id')

    if (profilesError) {
      throw new Error(`user_profiles 테이블 조회 실패: ${profilesError.message}`)
    }

    console.log(`✅ user_profiles 테이블: ${profiles?.length || 0}개`)

    // 3. user_profiles가 없는 users 찾기
    const existingProfileUserIds = new Set(profiles?.map(p => p.user_id) || [])
    const usersWithoutProfiles = users?.filter(user => !existingProfileUserIds.has(user.user_id)) || []

    console.log(`\n📋 user_profiles가 없는 계정: ${usersWithoutProfiles.length}명`)

    if (usersWithoutProfiles.length === 0) {
      console.log('✅ 모든 계정에 user_profiles가 있습니다!')
      return
    }

    // 4. 누락된 user_profiles 생성
    console.log('\n🔧 user_profiles 생성 시작...\n')

    let successCount = 0
    let failCount = 0

    for (const user of usersWithoutProfiles) {
      try {
        const userName = user.name || user.email?.split('@')[0] || '사용자'
        console.log(`  📝 생성 중: ${userName} (${user.user_id})`)

        const { error: createError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: user.user_id,
            name: userName,
            phone: user.phone || null
          })

        if (createError) {
          console.error(`    ❌ 실패: ${createError.message}`)
          failCount++
        } else {
          console.log(`    ✅ 성공 - 이름: ${userName}, 전화번호: ${user.phone || '없음'}`)
          successCount++
        }
      } catch (error: any) {
        console.error(`    ❌ 에러: ${error.message}`)
        failCount++
      }
    }

    console.log(`\n📊 결과:`)
    console.log(`  ✅ 성공: ${successCount}명`)
    console.log(`  ❌ 실패: ${failCount}명`)
    console.log(`  📊 총 처리: ${usersWithoutProfiles.length}명`)

    // 5. 최종 확인
    console.log('\n🔍 최종 확인 중...')
    const { data: finalProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('user_id')

    if (!finalError) {
      console.log(`✅ 최종 user_profiles 개수: ${finalProfiles?.length || 0}개`)
    }

  } catch (error: any) {
    console.error('\n❌ 스크립트 실행 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
console.log('🚀 user_profiles 자동 생성 스크립트 시작\n')
createMissingProfiles()
  .then(() => {
    console.log('\n✅ 스크립트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error)
    process.exit(1)
  })
