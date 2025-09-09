#!/bin/bash

# 🔥 올띵버킷 백엔드 서버 시작 스크립트

echo "🚀 올띵버킷 백엔드 서버를 시작합니다..."

# 🔥 Node.js 버전 확인
echo "📋 Node.js 버전 확인:"
node --version

# 🔥 의존성 설치
echo "📦 의존성 설치 중..."
npm install

# 🔥 환경변수 파일 확인
if [ ! -f ".env" ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 참고하여 생성해주세요."
    echo "📝 필요한 환경변수:"
    echo "   - SMS_ACCESS_KEY"
    echo "   - SMS_SECRET_KEY" 
    echo "   - SMS_SERVICE_ID"
    echo "   - SMS_FROM_NUMBER"
    exit 1
fi

# 🔥 서버 시작
echo "🎯 백엔드 서버를 시작합니다..."
echo "📱 SMS API: http://localhost:3001/api/sms"
echo "🏥 헬스 체크: http://localhost:3001/health"

if [ "$1" = "dev" ]; then
    echo "🔧 개발 모드로 실행 중..."
    npm run dev
else
    echo "🏭 프로덕션 모드로 실행 중..."
    npm start
fi
