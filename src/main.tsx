
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import { initApp } from './utils/initDatabase'
import './index.css'

// 애플리케이션 초기화
initApp().then((mongoConnected) => {
  console.log('🚀 애플리케이션 시작')
  if (mongoConnected) {
    console.log('✅ MongoDB 연결됨')
  } else {
    console.log('📝 Lumi 데이터 사용')
  }
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
