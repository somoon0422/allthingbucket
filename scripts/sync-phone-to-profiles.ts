/**
 * users 테이블의 phone 정보를 user_profiles로 동기화하는 스크립트
 *
 * 실행 방법:
 * npx tsx scripts/sync-phone-to-profiles.ts
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

async function syncPhoneToProfiles() {
  try {
    console.log('🔍 users 테이블 조회 중...')

    // 1. phone이 있는 users 조회
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('user_id, name, email, phone')
      .not('phone', 'is', null)

    if (usersError) {
      throw new Error(`users 테이블 조회 실패: ${usersError.message}`)
    }

    console.log(`✅ phone이 있는 users: ${users?.length || 0}명`)

    if (!users || users.length === 0) {
      console.log('⚠️ phone 정보가 있는 사용자가 없습니다.')
      return
    }

    // 2. user_profiles 조회
    console.log('\n🔍 user_profiles 테이블 조회 중...')
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, name, phone')

    if (profilesError) {
      throw new Error(`user_profiles 테이블 조회 실패: ${profilesError.message}`)
    }

    console.log(`✅ user_profiles: ${profiles?.length || 0}개`)

    // 3. phone 동기화 필요한 프로필 찾기
    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || [])
    const needsSync: Array<{ user_id: string; name: string; email: string; phone: string; currentPhone: string | null }> = []

    for (const user of users) {
      const profile = profileMap.get(user.user_id)
      if (profile && (!profile.phone || profile.phone !== user.phone)) {
        needsSync.push({
          user_id: user.user_id,
          name: user.name || user.email,
          email: user.email,
          phone: user.phone,
          currentPhone: profile.phone
        })
      }
    }

    console.log(`\n📋 phone 동기화가 필요한 프로필: ${needsSync.length}개`)

    if (needsSync.length === 0) {
      console.log('✅ 모든 프로필의 phone이 이미 동기화되어 있습니다!')
      return
    }

    // 4. phone 동기화 실행
    console.log('\n🔧 phone 동기화 시작...\n')

    let successCount = 0
    let failCount = 0

    for (const item of needsSync) {
      try {
        console.log(`  📝 동기화 중: ${item.name} (${item.email})`)
        console.log(`     현재: ${item.currentPhone || '없음'} → 새로운: ${item.phone}`)

        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ phone: item.phone })
          .eq('user_id', item.user_id)

        if (updateError) {
          console.error(`    ❌ 실패: ${updateError.message}`)
          failCount++
        } else {
          console.log(`    ✅ 성공`)
          successCount++
        }
      } catch (error: any) {
        console.error(`    ❌ 에러: ${error.message}`)
        failCount++
      }
    }

    console.log(`\n📊 결과:`)
    console.log(`  ✅ 성공: ${successCount}개`)
    console.log(`  ❌ 실패: ${failCount}개`)
    console.log(`  📊 총 처리: ${needsSync.length}개`)

    // 5. 최종 확인
    console.log('\n🔍 최종 확인 중...')
    const { data: finalProfiles, error: finalError } = await supabase
      .from('user_profiles')
      .select('user_id, phone')
      .not('phone', 'is', null)

    if (!finalError) {
      console.log(`✅ phone이 있는 user_profiles: ${finalProfiles?.length || 0}개`)
    }

  } catch (error: any) {
    console.error('\n❌ 스크립트 실행 실패:', error.message)
    process.exit(1)
  }
}

// 스크립트 실행
console.log('🚀 user_profiles phone 동기화 스크립트 시작\n')
syncPhoneToProfiles()
  .then(() => {
    console.log('\n✅ 스크립트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 스크립트 실패:', error)
    process.exit(1)
  })
