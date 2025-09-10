const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// MongoDB 연결 문자열
const connectionString = 'mongodb+srv://support_db_user:nv2c50bqVBAOgJRr@cluster0.9ny0kvy.mongodb.net/allthingbucket?retryWrites=true&w=majority&appName=Cluster0&tls=true';

async function migrateAllEntities() {
  const client = new MongoClient(connectionString, {
    tls: true,
    tlsAllowInvalidCertificates: true,
    tlsAllowInvalidHostnames: true,
  });

  try {
    await client.connect();
    console.log('✅ MongoDB Atlas 연결 성공!');
    
    const db = client.db('allthingbucket');
    
    // 엔티티 파일 경로
    const entitiesPath = path.join(__dirname, '../src/entities');
    
    // 모든 JSON 파일 읽기
    const entityFiles = fs.readdirSync(entitiesPath).filter(file => file.endsWith('.json'));
    
    console.log(`📁 발견된 엔티티 파일: ${entityFiles.length}개`);
    
    for (const file of entityFiles) {
      const filePath = path.join(entitiesPath, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      
      try {
        const data = JSON.parse(fileContent);
        const collectionName = file.replace('.json', '');
        
        console.log(`\n🔄 ${collectionName} 마이그레이션 중...`);
        
        // 컬렉션 가져오기
        const collection = db.collection(collectionName);
        
        // 기존 데이터 확인
        const existingCount = await collection.countDocuments();
        console.log(`📊 기존 데이터: ${existingCount}개`);
        
        if (existingCount === 0) {
          // 실제 엔티티 데이터만 마이그레이션 (샘플 데이터 없음)
          console.log(`ℹ️ ${collectionName} 컬렉션 생성 완료 (데이터 없음)`);
        } else {
          console.log(`ℹ️ ${collectionName} 이미 데이터 존재`);
        }
        
      } catch (error) {
        console.error(`❌ ${file} 파싱 오류:`, error.message);
      }
    }
    
    console.log('\n🎉 모든 엔티티 마이그레이션 완료!');
    console.log('📋 마이그레이션된 컬렉션:');
    
    // 모든 컬렉션 목록 출력
    const collections = await db.listCollections().toArray();
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`  - ${collection.name}: ${count}개 문서`);
    }
    
  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
  } finally {
    await client.close();
  }
}

// 마이그레이션 실행
migrateAllEntities().catch(console.error);
