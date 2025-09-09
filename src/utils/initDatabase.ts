import { connectToDatabase } from '../config/database'

// MongoDB 연결 초기화
export const initializeDatabase = async () => {
  try {
    await connectToDatabase()
    console.log('✅ MongoDB 연결이 성공적으로 초기화되었습니다')
    return true
  } catch (error) {
    console.error('❌ MongoDB 연결 초기화 실패:', error)
    console.log('📝 Lumi 데이터를 사용하여 계속 진행합니다')
    return false
  }
}

// 애플리케이션 시작시 데이터베이스 연결 시도
export const initApp = async () => {
  const mongoConnected = await initializeDatabase()
  
  if (!mongoConnected) {
    console.log('⚠️ MongoDB 연결 실패 - 오프라인 모드로 실행됩니다')
  }
  
  return mongoConnected
}
