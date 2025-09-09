
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './hooks/useAuth'
import Layout from './components/Layout'

// 사용자 페이지
import Home from './pages/Home'
import Experiences from './pages/Experiences'
import ExperienceDetail from './pages/ExperienceDetail'
import MyApplications from './pages/MyApplications'
import Points from './pages/Points'
import Profile from './pages/Profile'
import WithdrawalRequest from './pages/WithdrawalRequest'
import GoogleCallback from './pages/GoogleCallback'
import GoogleOAuthCallback from './pages/GoogleOAuthCallback'

// 관리자 페이지
import AdminDashboard from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: { 
                background: '#363636', 
                color: '#fff',
                borderRadius: '12px'
              },
              success: { 
                style: { background: '#10b981' } 
              },
              error: { 
                style: { background: '#ef4444' } 
              }
            }}
          />
          
          <Routes>
            {/* 관리자 라우트 */}
            <Route path="/admin" element={<AdminDashboard />} />
            
            {/* Google OAuth 콜백 */}
            <Route path="/auth/google/callback" element={<GoogleOAuthCallback />} />
            
            {/* 사용자 라우트 */}
            <Route path="/*" element={
              <Layout>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/home" element={<Home />} />
                  <Route path="/experiences" element={<Experiences />} />
                  <Route path="/experiences/:id" element={<ExperienceDetail />} />
                  <Route path="/my-applications" element={<MyApplications />} />
                  <Route path="/points" element={<Points />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/withdrawal" element={<WithdrawalRequest />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Layout>
            } />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App
