// 🔥 통합 메시징 서비스 테스트 스크립트
require('dotenv').config();
const { testMessaging, checkServiceStatus } = require('./services/messagingService');

async function testAllServices() {
  console.log('🧪 통합 메시징 서비스 테스트를 시작합니다...\n');
  
  // 🔥 환경변수 확인
  console.log('📋 환경변수 확인:');
  console.log('   📱 SMS 설정:');
  console.log(`      SMS_ACCESS_KEY: ${process.env.SMS_ACCESS_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`      SMS_SECRET_KEY: ${process.env.SMS_SECRET_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`      SMS_SERVICE_ID: ${process.env.SMS_SERVICE_ID ? '설정됨' : '설정되지 않음'}`);
  console.log(`      SMS_FROM_NUMBER: ${process.env.SMS_FROM_NUMBER || '설정되지 않음'}`);
  
  console.log('   💬 SENS 알림톡 설정:');
  console.log(`      SMS_ACCESS_KEY: ${process.env.SMS_ACCESS_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`      SMS_SECRET_KEY: ${process.env.SMS_SECRET_KEY ? '설정됨' : '설정되지 않음'}`);
  console.log(`      SMS_SERVICE_ID: ${process.env.SMS_SERVICE_ID ? '설정됨' : '설정되지 않음'}`);
  console.log(`      KAKAO_PLUS_FRIEND_ID: ${process.env.KAKAO_PLUS_FRIEND_ID ? '설정됨' : '설정되지 않음'}`);
  console.log(`      KAKAO_TEMPLATE_CODE: ${process.env.KAKAO_TEMPLATE_CODE ? '설정됨' : '설정되지 않음'}\n`);
  
  try {
    // 🔥 서비스 상태 확인
    const status = await checkServiceStatus();
    console.log('📊 서비스 상태:', JSON.stringify(status, null, 2));
    
    // 🔥 통합 테스트 실행
    const testResults = await testMessaging();
    
    console.log('\n🎯 최종 테스트 결과:');
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    
    if (successCount === totalCount && totalCount > 0) {
      console.log(`✅ 모든 서비스 테스트 성공! (${successCount}/${totalCount})`);
    } else if (successCount > 0) {
      console.log(`⚠️ 일부 서비스 테스트 성공 (${successCount}/${totalCount})`);
    } else {
      console.log(`❌ 모든 서비스 테스트 실패 (${successCount}/${totalCount})`);
    }
    
  } catch (error) {
    console.error('❌ 테스트 실행 실패:');
    console.error('   오류:', error.message);
    
    console.log('\n💡 해결 방법:');
    console.log('   1. backend/.env 파일을 생성하세요');
    console.log('   2. SMS 또는 카카오 알림톡 API 키를 설정하세요');
    console.log('   3. 발신번호를 사전 등록하세요');
  }
}

// 🔥 테스트 실행
if (require.main === module) {
  testAllServices().then(() => {
    console.log('\n🏁 테스트 완료');
    process.exit(0);
  }).catch((error) => {
    console.error('\n💥 테스트 실패:', error.message);
    process.exit(1);
  });
}

module.exports = { testAllServices };
