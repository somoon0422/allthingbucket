
import React from 'react'

const HomePage: React.FC = () => {
  const handleGoBack = () => {
    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 w-full max-w-md text-center">
        <img src="/logo.png" alt="올띵버킷 로고" className="w-16 h-16 mx-auto mb-6" />
        
        <h1 className="text-2xl font-bold text-gray-800 mb-4">
          환영합니다!
        </h1>
        
        <p className="text-gray-600 mb-6">
          올띵버킷 체험단 플랫폼에 오신 것을 환영합니다
        </p>
        
        <button
          onClick={handleGoBack}
          className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 rounded-xl font-medium hover:from-purple-600 hover:to-pink-600 transition-all duration-200"
        >
          로그인으로 돌아가기
        </button>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            🎉 화면이 정상적으로 표시되고 있습니다!
          </p>
        </div>
      </div>
    </div>
  )
}

export default HomePage
