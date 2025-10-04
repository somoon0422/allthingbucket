
import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { usePoints } from '../hooks/usePoints'
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownLeft, ExternalLink, Calendar, FileText, Star, CheckCircle, AlertCircle } from 'lucide-react'
import ChatBot from '../components/ChatBot'

const Points: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { fetchUserPoints, fetchPointsHistory, userPoints, refreshPointsData, setUserPoints } = usePoints()
  
  // 세금 계산 함수
  const calculateTax = (amount: number) => {
    const taxAmount = Math.floor(amount * 0.033) // 3.3% 세금
    const finalAmount = amount - taxAmount
    return { taxAmount, finalAmount }
  }

  // NICE API 실명인증 및 계좌인증 함수 (향후 연결 예정)
  const _handleNiceVerification = async (amount: number) => {
    // TODO: NICE API 연결 시 구현
    console.log('NICE API 인증 시작:', { amount })
    
    try {
      // NICE API 호출 로직이 여기에 들어갈 예정
      // 1. 실명인증 모달 표시
      // 2. 계좌인증 모달 표시  
      // 3. 인증 성공 시 출금 요청 자동 생성
      
      alert('NICE API 연결 예정\n\n현재는 임시로 출금 요청만 생성됩니다.')
      return true
    } catch (error) {
      console.error('NICE API 인증 실패:', error)
      alert('실명인증에 실패했습니다. 다시 시도해주세요.')
      return false
    }
  }
  const [pointHistory, setPointHistory] = useState<any[]>([])
  const [withdrawalHistory, setWithdrawalHistory] = useState<any[]>([])
  const [userPointsData, setUserPointsData] = useState<any>(null) // 실제 DB 데이터 저장
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false)
  const [withdrawalData, setWithdrawalData] = useState({
    requested_amount: '',
    bank_name: '',
    account_number: '',
    account_holder: ''
  })
  const [previewTax, setPreviewTax] = useState({ taxAmount: 0, finalAmount: 0 })
  const [loading, setLoading] = useState(true)
  const [showCampaignHistoryModal, setShowCampaignHistoryModal] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<any>(null)
  const [campaignHistory, setCampaignHistory] = useState<any[]>([])
  const [showAccountVerificationModal, setShowAccountVerificationModal] = useState(false)
  const [verificationData, setVerificationData] = useState({
    bankAccountId: '',
    depositName: ''
  })

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user])

  useEffect(() => {
    // 출금 금액 변경 시 세금 미리보기 계산
    const amount = Number(withdrawalData.requested_amount)
    if (amount > 0) {
      const { taxAmount, finalAmount } = calculateTax(amount)
      setPreviewTax({ taxAmount, finalAmount })
    } else {
      setPreviewTax({ taxAmount: 0, finalAmount: 0 })
    }
  }, [withdrawalData.requested_amount])

  const loadData = async () => {
    if (!user) return
    
    try {
      setLoading(true)
      console.log('🔄 포인트 페이지 데이터 로딩 시작:', user.user_id)
      
      // 출금 내역을 직접 가져오기
      const { dataService } = await import('../lib/dataService')
      const userWithdrawals = await dataService.entities.withdrawal_requests.list({
        filter: { user_id: user.user_id }
      })
      
      const [fetchedUserPointsData, pointsHistory] = await Promise.all([
        fetchUserPoints(user.user_id),
        fetchPointsHistory(user.user_id)
      ])
      
      setPointHistory(pointsHistory)
      setWithdrawalHistory(userWithdrawals)
      setUserPointsData(fetchedUserPointsData) // 로컬 상태에 저장
      
      console.log('✅ 포인트 페이지 데이터 로딩 완료:', {
        fetchedUserPointsData,
        pointsHistory: pointsHistory.length,
        userWithdrawals: userWithdrawals.length,
        userPoints: userPoints
      })
      
      // 🔍 디버깅: 현재 상태 확인
      console.log('🔍 현재 userPoints 상태:', userPoints)
      console.log('🔍 로컬 userPointsData 상태:', fetchedUserPointsData)
      
      // 🔥 usePoints 훅의 상태도 업데이트
      if (fetchedUserPointsData) {
        setUserPoints(fetchedUserPointsData)
        console.log('🔧 usePoints 상태 업데이트:', fetchedUserPointsData)
      }
      
      // 🔍 포인트 히스토리에서 실제 포인트 금액 확인
      const completedPoints = pointsHistory.filter(p => p.payment_status === 'completed' || p.payment_status === '지급완료')
      const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
      console.log('🔍 완료된 포인트 히스토리:', completedPoints)
      console.log('🔍 완료된 포인트 총합:', totalCompletedPoints)
      
      // 🔥 출금 내역에서 총 출금 포인트 계산
      const totalWithdrawnPoints = userWithdrawals
        .filter((w: any) => w.status === 'completed' || w.status === 'approved')
        .reduce((sum: any, w: any) => sum + (w.points_amount || 0), 0)
      
      // 🔥 실제 사용 가능한 포인트 계산
      const actualAvailablePoints = Math.max(0, totalCompletedPoints - totalWithdrawnPoints)
      
      console.log('🔍 포인트 계산:', {
        totalCompletedPoints,
        totalWithdrawnPoints,
        availablePoints: actualAvailablePoints,
        userPointsAvailable: fetchedUserPointsData?.available_points,
        userPointsTotal: fetchedUserPointsData?.total_points
      })
      
    } catch (error) {
      console.error('❌ 데이터 로딩 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    if (!user) return
    
    try {
      console.log('🔄 포인트 데이터 수동 새로고침')
      
      // 강제로 데이터 새로고침
      setLoading(true)
      setUserPoints(null)
      setPointHistory([])
      
      // 잠시 대기 후 데이터 로드
      await new Promise(resolve => setTimeout(resolve, 500))
      
      await refreshPointsData(user.user_id)
      await loadData()
      
      console.log('✅ 포인트 데이터 새로고침 완료')
    } catch (error) {
      console.error('❌ 포인트 데이터 새로고침 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleWithdrawalRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    const amount = Number(withdrawalData.requested_amount)
    
    try {
      const { dataService } = await import('../lib/dataService')
      
      // 1. 기존 인증된 계좌가 있는지 확인
      const existingAccounts = await dataService.entities.bank_accounts.list({
        filter: { user_id: user.user_id }
      })
      
      const verifiedAccount = existingAccounts.find(account => account.is_verified)
      
      // NICE API 실명인증 및 계좌인증을 위한 준비
      if (!verifiedAccount) {
        // TODO: NICE API 연결 시 여기서 NICE 인증 모달 호출
        alert('출금 요청을 위해 실명인증이 필요합니다.\n\nNICE API를 통한 본인인증 후 출금이 처리됩니다.')
        // 임시로 출금 요청을 계속 진행 (NICE API 연결 전까지)
        // return 문을 제거하여 출금 요청이 계속 진행되도록 함
      }

      // 2. 계좌 정보 저장 (기존 인증된 계좌 사용 또는 새 계좌)
      let bankAccount = verifiedAccount
      
      // 새로운 계좌 정보가 입력된 경우에만 새 계좌 생성
      if (withdrawalData.bank_name && withdrawalData.account_number && 
          (!verifiedAccount || withdrawalData.bank_name !== verifiedAccount.bank_name || 
           withdrawalData.account_number !== verifiedAccount.account_number)) {
        
        const bankAccountData = {
          user_id: user.user_id,
          bank_name: withdrawalData.bank_name,
          account_number: withdrawalData.account_number,
          account_holder: withdrawalData.account_holder,
          is_verified: false, // 새 계좌는 재인증 필요
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        bankAccount = await dataService.entities.bank_accounts.create(bankAccountData)
        
        if (!bankAccount) {
          alert('계좌 정보 저장에 실패했습니다.')
          return
        }
        
        // 새 계좌는 NICE API 인증이 필요하므로 알림
        alert('새로운 계좌 정보가 입력되었습니다.\n\nNICE API를 통한 실명인증 및 계좌인증 후 출금이 처리됩니다.')
        // TODO: NICE API 연결 시 여기서 인증 모달 호출
        // 임시로 출금 요청을 계속 진행
        // return
      }

      // 3. 출금 요청 생성 (NICE API 연결 전까지는 계좌 정보 없이도 가능)
      const { taxAmount, finalAmount } = calculateTax(amount)
      const withdrawalRequestData = {
        user_id: user.user_id,
        bank_account_id: bankAccount?.id || null, // 계좌가 없어도 null로 처리
        points_amount: amount,
        withdrawal_amount: amount,
        tax_amount: taxAmount,
        final_amount: finalAmount,
        status: 'pending',
        request_reason: bankAccount 
          ? '포인트 출금 요청 (관리자 승인 대기)' 
          : '포인트 출금 요청 (NICE API 실명인증 후 처리)',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      const withdrawalRequest = await dataService.entities.withdrawal_requests.create(withdrawalRequestData)
      
      if (withdrawalRequest) {
        // 관리자 알림 생성
        await dataService.entities.admin_notifications.create({
          type: 'withdrawal_requested',
          title: '새로운 출금 요청',
          message: `${user.user_id}님이 ${amount.toLocaleString()}P 출금을 요청했습니다.`,
          is_read: false,
          created_at: new Date().toISOString()
        })
        
        const successMessage = bankAccount 
          ? `출금 요청이 접수되었습니다!\n\n💬 카카오톡: @올띵버킷\n\n인증된 계좌로 출금 요청이 완료되었습니다.\n관리자 승인 후 영업일 기준 3~5일 내 처리됩니다.`
          : `출금 요청이 접수되었습니다!\n\n💬 카카오톡: @올띵버킷\n\n실명인증 및 계좌인증 후 출금이 처리됩니다.\n관리자 승인 후 영업일 기준 3~5일 내 처리됩니다.`
        
        alert(successMessage)
        
        setShowWithdrawalModal(false)
        setWithdrawalData({
          requested_amount: '',
          bank_name: '',
          account_number: '',
          account_holder: ''
        })
        loadData() // 데이터 새로고침
      } else {
        alert('출금 요청에 실패했습니다.')
      }
    } catch (error) {
      console.error('출금 요청 오류:', error)
      alert('출금 요청 중 오류가 발생했습니다.')
    }
  }

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { text: '대기중', color: 'bg-yellow-100 text-yellow-800' },
      account_verified: { text: '계좌인증완료', color: 'bg-blue-100 text-blue-800' },
      pending_approval: { text: '승인대기', color: 'bg-purple-100 text-purple-800' },
      approved: { text: '승인됨', color: 'bg-blue-100 text-blue-800' },
      processing: { text: '처리중', color: 'bg-purple-100 text-purple-800' },
      completed: { text: '완료', color: 'bg-green-100 text-green-800' },
      rejected: { text: '거절됨', color: 'bg-red-100 text-red-800' }
    }
    return statusMap[status as keyof typeof statusMap] || statusMap.pending
  }

  // 1원 인증 처리
  const handleAccountVerification = async () => {
    if (!verificationData.bankAccountId || !verificationData.depositName.trim()) {
      alert('입금자명을 입력해주세요.')
      return
    }

    try {
      const response = await fetch('/api/account/verify-deposit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user?.user_id,
          bankAccountId: verificationData.bankAccountId,
          depositName: verificationData.depositName
        })
      })

      const result = await response.json()

      if (result.success) {
        alert('계좌 인증이 완료되었습니다!')
        setShowAccountVerificationModal(false)
        setVerificationData({ bankAccountId: '', depositName: '' })
        loadData() // 데이터 새로고침
      } else {
        alert(result.message || '계좌 인증에 실패했습니다.')
      }
    } catch (error) {
      console.error('계좌 인증 오류:', error)
      alert('계좌 인증 중 오류가 발생했습니다.')
    }
  }

  const fetchCampaignHistory = async (campaignId: string | undefined, campaignName: string | undefined) => {
    try {
      console.log('🔍 캠페인 히스토리 조회:', { campaignId, campaignName })
      
      // 포인트 히스토리에서 해당 캠페인 관련 내역 조회
      const campaignPointsHistory = pointHistory.filter(p => 
        p.campaign_id === campaignId || 
        p.campaign_name === campaignName ||
        p.description?.includes(campaignName || '') ||
        (campaignName && p.description?.includes(campaignName))
      )
      
      // 사용자 신청 내역 조회 (dataService를 통해)
      const { dataService } = await import('../lib/dataService')
      const userApplications = await dataService.entities.user_applications.list()
      const campaignApplications = userApplications.filter((app: any) => 
        app.campaign_id === campaignId || app.campaign_name === campaignName
      )
      
      // 리뷰 제출 내역 조회
      const reviewSubmissions = await dataService.entities.review_submissions.list()
      const campaignReviews = reviewSubmissions.filter((review: any) => 
        review.campaign_id === campaignId || review.campaign_name === campaignName
      )
      
      // 모든 히스토리를 날짜순으로 정렬
      const allHistory = [
        ...campaignPointsHistory.map(p => ({
          type: 'point',
          date: p.created_at,
          title: p.description,
          status: p.payment_status || p.status,
          details: `${p.points_amount || 0}P ${p.points_type === 'earned' ? '적립' : '차감'}`,
          icon: p.points_type === 'earned' ? ArrowDownLeft : ArrowUpRight,
          color: p.points_type === 'earned' ? 'text-green-500' : 'text-red-500'
        })),
        ...campaignApplications.map((app: any) => ({
          type: 'application',
          date: app.created_at,
          title: '체험단 신청',
          status: app.status,
          details: `신청 상태: ${app.status}`,
          icon: FileText,
          color: 'text-blue-500'
        })),
        ...campaignReviews.map((review: any) => ({
          type: 'review',
          date: review.created_at,
          title: '리뷰 제출',
          status: review.status,
          details: review.review_content ? `리뷰: ${review.review_content.substring(0, 50)}...` : '리뷰 제출 완료',
          icon: Star,
          color: 'text-purple-500'
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      setCampaignHistory(allHistory)
      setSelectedCampaign({ id: campaignId, name: campaignName })
      setShowCampaignHistoryModal(true)
      
      console.log('✅ 캠페인 히스토리 조회 완료:', allHistory)
    } catch (error) {
      console.error('❌ 캠페인 히스토리 조회 실패:', error)
    }
  }

  if (!user) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">로그인이 필요합니다</h2>
          <p className="text-gray-600">포인트 정보를 확인하려면 로그인해주세요</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">포인트</h1>
            <p className="text-gray-600">
              체험단 활동으로 적립한 포인트를 관리하고 출금하세요
            </p>
          </div>
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
          >
            <ArrowUpRight className="w-4 h-4" />
            새로고침
          </button>
        </div>
      </div>

      {/* 포인트 요약 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">현재 잔액</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  // 🔥 로컬 상태에서 직접 가져오기 (React 상태 문제 우회)
                  const directAvailablePoints = userPointsData?.available_points || 0
                  
                  console.log('🔍 UI 렌더링 - 직접 데이터 사용:', {
                    userPointsData,
                    directAvailablePoints,
                    userPointsState: userPoints
                  })
                  
                  if (directAvailablePoints > 0) {
                    console.log('✅ 직접 데이터에서 포인트 사용:', directAvailablePoints)
                    return directAvailablePoints.toLocaleString()
                  }
                  
                  // 백업: 포인트 히스토리에서 계산
                  const completedPoints = pointHistory.filter(p => 
                    p.payment_status === 'completed' || p.payment_status === '지급완료'
                  )
                  const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
                  
                  const withdrawnPoints = pointHistory.filter(p => 
                    p.points_type === 'withdrawn' || p.payment_status === '출금완료'
                  )
                  const totalWithdrawnPoints = withdrawnPoints.reduce((sum, p) => sum + Math.abs(p.points_amount || 0), 0)
                  
                  const availablePoints = Math.max(0, totalCompletedPoints - totalWithdrawnPoints)
                  
                  console.log('🔍 히스토리에서 포인트 계산:', {
                    totalCompletedPoints,
                    totalWithdrawnPoints,
                    availablePoints
                  })
                  
                  return availablePoints.toLocaleString()
                })()}P
              </p>
              <p className="text-xs text-gray-500 mt-1">
                출금 가능한 포인트
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">총 적립</p>
              <p className="text-2xl font-bold text-gray-900">
                {(() => {
                  // 🔥 로컬 상태에서 직접 가져오기
                  const directTotalPoints = userPointsData?.total_points || 0
                  
                  if (directTotalPoints > 0) {
                    console.log('✅ 직접 데이터에서 총 적립 포인트 사용:', directTotalPoints)
                    return directTotalPoints.toLocaleString()
                  }
                  
                  // 백업: 포인트 히스토리에서 계산
                  const completedPoints = pointHistory.filter(p => 
                    p.payment_status === 'completed' || p.payment_status === '지급완료'
                  )
                  const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
                  
                  return totalCompletedPoints.toLocaleString()
                })()}P
              </p>
              <p className="text-xs text-gray-500 mt-1">
                출금해도 유지되는 누적 포인트
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center">
            <CreditCard className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">체험단 참여</p>
              <p className="text-2xl font-bold text-gray-900">
                {userPoints?.experience_count || 0}회
              </p>
              <p className="text-xs text-gray-500 mt-1">
                완료된 체험단 수
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 출금 버튼 */}
      <div className="mb-8">
        <button
          onClick={async () => {
            if (!user) return
            
            try {
              // 기존 인증된 계좌 정보 로드
              const { dataService } = await import('../lib/dataService')
              const existingAccounts = await dataService.entities.bank_accounts.list({
                filter: { user_id: user.user_id }
              })
              
              const verifiedAccount = existingAccounts.find(account => account.is_verified)
              
              if (verifiedAccount) {
                // 인증된 계좌가 있으면 기존 정보로 설정
                setWithdrawalData({
                  requested_amount: '',
                  bank_name: verifiedAccount.bank_name,
                  account_number: verifiedAccount.account_number,
                  account_holder: verifiedAccount.account_holder
                })
              } else {
                // 인증된 계좌가 없으면 빈 상태로 설정
                setWithdrawalData({
                  requested_amount: '',
                  bank_name: '',
                  account_number: '',
                  account_holder: ''
                })
              }
              
              setShowWithdrawalModal(true)
            } catch (error) {
              console.error('계좌 정보 로드 실패:', error)
              setShowWithdrawalModal(true)
            }
          }}
          disabled={(() => {
            // 🔥 실제 DB 데이터 우선 사용
            const directAvailablePoints = userPointsData?.available_points || 0
            
            if (directAvailablePoints > 0) {
              console.log('🔍 출금 버튼 - 직접 데이터 사용:', directAvailablePoints)
              return directAvailablePoints < 1000
            }
            
            // 백업: 히스토리에서 계산
            const completedPoints = pointHistory.filter(p => 
              p.payment_status === 'completed' || p.payment_status === '지급완료'
            )
            const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
            
            const withdrawnPoints = pointHistory.filter(p => 
              p.points_type === 'withdrawn' || p.payment_status === '출금완료'
            )
            const totalWithdrawnPoints = withdrawnPoints.reduce((sum, p) => sum + Math.abs(p.points_amount || 0), 0)
            
            const availablePoints = Math.max(0, totalCompletedPoints - totalWithdrawnPoints)
            console.log('🔍 출금 버튼 - 히스토리에서 계산:', availablePoints)
            return availablePoints < 1000
          })()}
          className="bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
          <ArrowUpRight className="w-5 h-5" />
          <span>포인트 출금</span>
        </button>
        {(() => {
          // 🔥 실제 DB 데이터 우선 사용
          const directAvailablePoints = userPointsData?.available_points || 0
          
          if (directAvailablePoints > 0) {
            return directAvailablePoints < 1000
          }
          
          // 백업: 히스토리에서 계산
          const completedPoints = pointHistory.filter(p => 
            p.payment_status === 'completed' || p.payment_status === '지급완료'
          )
          const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
          
          const withdrawnPoints = pointHistory.filter(p => 
            p.points_type === 'withdrawn' || p.payment_status === '출금완료'
          )
          const totalWithdrawnPoints = withdrawnPoints.reduce((sum, p) => sum + Math.abs(p.points_amount || 0), 0)
          
          const availablePoints = Math.max(0, totalCompletedPoints - totalWithdrawnPoints)
          return availablePoints < 1000
        })() && (
          <p className="text-sm text-gray-500 mt-2">
            최소 출금 금액은 1,000P입니다
          </p>
        )}
      </div>
      {/* 출금 내역 */}
      {withdrawalHistory.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border mb-8">
          <div className="p-6 border-b">
            <h2 className="text-xl font-bold text-gray-900">출금 내역</h2>
          </div>
          <div className="divide-y">
            {withdrawalHistory.map((withdrawal) => (
              <div key={withdrawal._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {withdrawal.bank_name} {withdrawal.account_number}
                        </h3>
                        <p className="text-sm text-gray-600">
                          예금주: {withdrawal.account_holder}
                        </p>
                        <div className="text-sm text-gray-500 mt-1">
                          요청: {withdrawal.requested_amount?.toLocaleString()}원 | 
                          세금: {withdrawal.tax_amount?.toLocaleString()}원 | 
                          실지급: {withdrawal.final_amount?.toLocaleString()}원
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadge(withdrawal.status).color}`}>
                      {getStatusBadge(withdrawal.status).text}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(withdrawal.created_at).toLocaleDateString()}
                    </p>
                    {withdrawal.status === 'pending' && (
                      <button
                        onClick={() => {
                          setVerificationData({
                            bankAccountId: withdrawal.bank_account_id || '',
                            depositName: ''
                          })
                          setShowAccountVerificationModal(true)
                        }}
                        className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600"
                      >
                        1원 인증
                      </button>
                    )}
                  </div>
                </div>
                {withdrawal.admin_note && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>관리자 메모:</strong> {withdrawal.admin_note}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* 포인트 거래 내역 */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">포인트 내역</h2>
        </div>
        <div className="divide-y">
          {pointHistory.length > 0 ? (
            pointHistory.map((point) => (
              <div key={point._id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {point.points_type === 'earned' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    )}
                    <div>
                      <h3 
                        className={`font-medium text-gray-900 ${(point.campaign_id || point.campaign_name || point.description?.includes('캠페인')) ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
                        onClick={() => {
                          console.log('🔍 포인트 제목 클릭:', {
                            description: point.description,
                            campaign_id: point.campaign_id,
                            campaign_name: point.campaign_name,
                            point: point
                          })
                          
                          // campaign_id가 있으면 사용하고, 없으면 description에서 캠페인 이름 추출
                          const campaignId = point.campaign_id
                          let campaignName = point.campaign_name
                          
                          if (!campaignId && !campaignName) {
                            // description에서 캠페인 이름 추출 시도
                            const match = point.description.match(/캠페인 "([^"]+)"/)
                            if (match) {
                              campaignName = match[1]
                              console.log('🔍 description에서 추출한 캠페인 이름:', campaignName)
                            }
                          }
                          
                          if (campaignId || campaignName) {
                            fetchCampaignHistory(campaignId, campaignName)
                          } else {
                            console.log('❌ campaign_id와 campaign_name이 모두 없습니다')
                          }
                        }}
                      >
                        {point.description}
                      </h3>
                      {point.campaign_name && (
                        <div className="flex items-center space-x-2">
                          <p 
                            className={`text-sm text-gray-600 ${point.campaign_id ? 'cursor-pointer hover:text-blue-600 hover:underline' : ''}`}
                            onClick={() => {
                              if (point.campaign_id) {
                                fetchCampaignHistory(point.campaign_id, point.campaign_name)
                              }
                            }}
                          >
                            캠페인: {point.campaign_name}
                          </p>
                          {point.campaign_id && (
                            <button
                              onClick={() => navigate(`/campaigns/${point.campaign_id}`)}
                              className="text-blue-500 hover:text-blue-700 transition-colors"
                              title="캠페인 상세페이지로 이동"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      )}
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          point.payment_status === 'completed' ? 'bg-green-100 text-green-800' :
                          point.payment_status === 'approved' ? 'bg-purple-100 text-purple-800' :
                          point.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          point.payment_status === 'failed' ? 'bg-red-100 text-red-800' :
                          point.status === 'success' ? 'bg-green-100 text-green-800' :
                          point.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          point.status === 'failed' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {point.payment_status === 'completed' ? '포인트 지급 완료' :
                           point.payment_status === 'approved' ? '포인트 지급 승인' :
                           point.payment_status === 'pending' ? '대기중' :
                           point.payment_status === 'failed' ? '실패' :
                           point.payment_status || 
                           (point.status === 'success' ? '완료' :
                            point.status === 'pending' ? '대기중' :
                            point.status === 'failed' ? '실패' : '알 수 없음')}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      point.points_type === 'earned' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {point.points_type === 'earned' ? '+' : ''}{(point.points_amount || point.points || 0).toLocaleString()}P
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(point.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center text-gray-500">
              <p>포인트 거래 내역이 없습니다</p>
            </div>
          )}
        </div>
      </div>

      {/* 출금 요청 모달 */}
      {showWithdrawalModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">포인트 출금</h2>
              
              {/* 계좌인증 안내 */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    <CreditCard className="w-5 h-5 text-blue-400" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800 mb-1">
                      계좌인증 필수 안내
                    </h3>
                    <p className="text-sm text-blue-700">
                      출금 요청을 위해서는 먼저 계좌인증이 완료되어야 합니다.
                    </p>
                    <ul className="text-xs text-blue-600 mt-2 space-y-1">
                      <li>• 1원 인증을 통해 계좌 소유자 본인 확인</li>
                      <li>• 인증 완료 후 출금 요청 가능</li>
                      <li>• 새로운 계좌 입력 시 재인증 필요</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <form onSubmit={handleWithdrawalRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    출금 금액
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="1000"
                      max={(() => {
                        // 🔥 실제 DB 데이터 우선 사용
                        const directAvailablePoints = userPointsData?.available_points || 0
                        
                        if (directAvailablePoints > 0) {
                          console.log('🔍 출금 모달 최대값 - 직접 데이터 사용:', directAvailablePoints)
                          return directAvailablePoints
                        }
                        
                        // 백업: 히스토리에서 계산
                        const completedPoints = pointHistory.filter(p => 
                          p.payment_status === 'completed' || p.payment_status === '지급완료'
                        )
                        const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
                        
                        const withdrawnPoints = pointHistory.filter(p => 
                          p.points_type === 'withdrawn' || p.payment_status === '출금완료'
                        )
                        const totalWithdrawnPoints = withdrawnPoints.reduce((sum, p) => sum + Math.abs(p.points_amount || 0), 0)
                        
                        return Math.max(0, totalCompletedPoints - totalWithdrawnPoints)
                      })()}
                      value={withdrawalData.requested_amount}
                      onChange={(e) => setWithdrawalData(prev => ({ ...prev, requested_amount: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                      placeholder="1000"
                    />
                    <span className="absolute right-3 top-2 text-gray-500">P</span>
                  </div>
                  <div className="mt-1 space-y-1">
                    <p className="text-xs text-gray-500">
                      출금 가능: {(() => {
                        // 🔥 실제 DB 데이터 우선 사용
                        const directAvailablePoints = userPointsData?.available_points || 0
                        
                        if (directAvailablePoints > 0) {
                          return directAvailablePoints.toLocaleString()
                        }
                        
                        // 백업: 히스토리에서 계산
                        const completedPoints = pointHistory.filter(p => 
                          p.payment_status === 'completed' || p.payment_status === '지급완료'
                        )
                        const totalCompletedPoints = completedPoints.reduce((sum, p) => sum + (p.points_amount || 0), 0)
                        
                        const withdrawnPoints = pointHistory.filter(p => 
                          p.points_type === 'withdrawn' || p.payment_status === '출금완료'
                        )
                        const totalWithdrawnPoints = withdrawnPoints.reduce((sum, p) => sum + Math.abs(p.points_amount || 0), 0)
                        
                        const availablePoints = Math.max(0, totalCompletedPoints - totalWithdrawnPoints)
                        return availablePoints.toLocaleString()
                      })()}P (최소 1,000P)
                    </p>
                    {withdrawalData.requested_amount && (
                      <p className={`text-xs ${
                        Number(withdrawalData.requested_amount) >= 1000 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {Number(withdrawalData.requested_amount) >= 1000 
                          ? '✓ 출금 신청 가능' 
                          : '✗ 최소 1,000P 이상 입력해주세요'
                        }
                      </p>
                    )}
                  </div>
                </div>
                {/* 세금 미리보기 */}
                {previewTax.finalAmount > 0 && (
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">출금 정보</h4>
                    <div className="text-sm space-y-1">
                      <div className="flex justify-between">
                        <span>요청 금액:</span>
                        <span>{Number(withdrawalData.requested_amount).toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between text-red-600">
                        <span>세금 (3.3%):</span>
                        <span>-{previewTax.taxAmount.toLocaleString()}원</span>
                      </div>
                      <div className="flex justify-between font-bold border-t pt-1">
                        <span>실지급액:</span>
                        <span>{previewTax.finalAmount.toLocaleString()}원</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 계좌 정보 섹션 */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">입금 계좌 정보</h3>
                  </div>
                  
                  {withdrawalData.bank_name ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-800">인증된 계좌</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">은행:</span>
                          <span className="font-medium">{withdrawalData.bank_name}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">계좌번호:</span>
                          <span className="font-medium">{withdrawalData.account_number}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">예금주:</span>
                          <span className="font-medium">{withdrawalData.account_holder}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center mb-2">
                        <AlertCircle className="w-5 h-5 text-gray-600 mr-2" />
                        <span className="text-sm font-medium text-gray-800">출금 신청 시 본인인증 진행</span>
                      </div>
                      <p className="text-sm text-gray-600">
                        출금 신청 버튼을 누르면 본인인증 후 출금이 처리됩니다.
                      </p>
                    </div>
                  )}
                </div>

                {/* 출금 안내 - 핵심 정보만 */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-yellow-900 mb-2">출금 안내</h4>
                      <ul className="text-xs text-yellow-800 space-y-1">
                        <li>• 최소 출금 금액: 1,000원</li>
                        <li>• 본인 명의 계좌만 가능</li>
                        <li>• 세금 3.3% 차감 후 지급</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* 고객센터 정보 */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-5 h-5 text-gray-600 mt-0.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-2">고객센터</h4>
                      <div className="text-xs text-gray-700 space-y-1">
                        <div>📧 이메일: support@allthingbucket.com</div>
                        <div>💬 카카오톡: @올띵버킷 (24시간 문의 가능)</div>
                        <div className="mt-2 text-gray-600">
                          문의사항이 있으시면 언제든 연락주세요!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowWithdrawalModal(false)
                      setWithdrawalData({
                        requested_amount: '',
                        bank_name: '',
                        account_number: '',
                        account_holder: ''
                      })
                    }}
                    className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-lg font-medium hover:bg-gray-200"
                  >
                    취소
                  </button>
                  <button
                    type="submit"
                    disabled={!withdrawalData.requested_amount || Number(withdrawalData.requested_amount) < 1000}
                    className="flex-1 bg-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    출금 요청
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* 캠페인 히스토리 모달 */}
      {showCampaignHistoryModal && selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">캠페인 히스토리</h2>
                  <p className="text-sm text-gray-600 mt-1">{selectedCampaign.name}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => navigate(`/campaigns/${selectedCampaign.id}`)}
                    className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-1 text-sm"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>상세페이지</span>
                  </button>
                  <button
                    onClick={() => setShowCampaignHistoryModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {campaignHistory.length > 0 ? (
                <div className="space-y-4">
                  {campaignHistory.map((history, index) => {
                    const IconComponent = history.icon
                    return (
                      <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
                        <div className={`p-2 rounded-full ${history.color} bg-opacity-20`}>
                          <IconComponent className={`w-4 h-4 ${history.color}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900">{history.title}</h3>
                            <span className="text-xs text-gray-500">
                              {new Date(history.date).toLocaleDateString('ko-KR', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{history.details}</p>
                          <div className="mt-2">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              history.status === 'completed' || history.status === '지급완료' ? 'bg-green-100 text-green-800' :
                              history.status === 'approved' || history.status === '승인됨' ? 'bg-blue-100 text-blue-800' :
                              history.status === 'pending' || history.status === '대기중' ? 'bg-yellow-100 text-yellow-800' :
                              history.status === 'rejected' || history.status === '거절됨' ? 'bg-red-100 text-red-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {history.status === 'completed' ? '완료' :
                               history.status === '지급완료' ? '지급완료' :
                               history.status === 'approved' ? '승인됨' :
                               history.status === 'pending' ? '대기중' :
                               history.status === 'rejected' ? '거절됨' :
                               history.status || '알 수 없음'}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>캠페인 히스토리가 없습니다</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 1원 인증 모달 */}
      {showAccountVerificationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">1원 계좌인증</h2>
              
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">인증 방법</h4>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. 계좌로 1원을 입금해주세요</li>
                    <li>2. 입금자명: <strong>올띵버킷</strong></li>
                    <li>3. 입금 후 아래에 입금자명을 입력해주세요</li>
                  </ol>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    입금자명 확인
                  </label>
                  <input
                    type="text"
                    required
                    value={verificationData.depositName}
                    onChange={(e) => setVerificationData(prev => ({ ...prev, depositName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="입금자명을 입력하세요"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    정확한 입금자명을 입력해야 인증이 완료됩니다.
                  </p>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <FileText className="w-5 h-5 text-green-600 mt-0.5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-green-900 mb-1">고객센터</h4>
                      <div className="text-xs text-green-800 space-y-1">
                        <div>📞 전화: 01022129245 (평일 09:00-18:00)</div>
                        <div>💬 카카오톡: @올띵버킷</div>
                        <div>📧 이메일: support@allthingbucket.com</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountVerificationModal(false)
                    setVerificationData({ bankAccountId: '', depositName: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  취소
                </button>
                <button
                  onClick={handleAccountVerification}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  인증 완료
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 포인트 출금 상세 규정 */}
      <div className="mt-12 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">포인트 출금 규정</h3>
        
        <div className="space-y-4 text-sm text-gray-700">
          {/* 기본 출금 조건 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔸 출금 조건</h4>
            <ul className="space-y-1 text-xs ml-4">
              <li>• 포인트가 1,000원 이상 모이면 출금 신청이 가능합니다.</li>
              <li>• 입금계좌의 예금주와 회원 정보의 이름이 동일해야 하며, 실명이어야 포인트가 지급됩니다.</li>
              <li>• 출금 금액은 지정이 불가하며, 신청 정보와 금액 수정을 원하실 경우 앞선 신청을 취소하시고 다시 신청해 주세요.</li>
            </ul>
          </div>

          {/* 지급 일정 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔸 지급 일정</h4>
            <ul className="space-y-1 text-xs ml-4">
              <li>• 포인트는 한 달에 3번 신청이 가능하며, 신청 마감일 5일 후 지급됩니다.</li>
              <li>• 지급일이 공휴일인 경우, 다음 영업일에 지급됩니다.</li>
              <li>• <strong>신청 기간별 지급일:</strong></li>
              <li className="ml-4">- 1일 ~ 10일 신청 → 당월 15일 지급</li>
              <li className="ml-4">- 11일 ~ 20일 신청 → 당월 25일 지급</li>
              <li className="ml-4">- 21일 ~ 말일 신청 → 익월 5일 지급</li>
            </ul>
          </div>

          {/* 세금 및 수수료 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔸 세금 및 수수료</h4>
            <ul className="space-y-1 text-xs ml-4">
              <li>• 출금 시 금융 수수료 및 세금을 차감하고 지급됩니다.</li>
              <li>• <strong>포인트</strong>: 사업소득에 따른 세금 3.3% 공제</li>
              <li>• <strong>이벤트 포인트</strong>: 기타소득으로 50,000원 초과 시 해당 금액에 한하여 세금 22% 공제</li>
              <li>• 출금 신청한 금액은 입금된 월의 소득 발생으로 신고되며, 관련 세금신고는 입금 예금주의 명의로 진행됩니다.</li>
            </ul>
          </div>

          {/* 실명인증 안내 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-2">🔸 실명인증 안내</h4>
            <ul className="space-y-1 text-xs ml-4">
              <li>• 명의도용 차단이 되어 있거나 나이스평가 정보에서 사용자 정보를 불러올 수 없는 경우, <a href="https://www.namecheck.co.kr/prod_name.nc" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 underline">온라인 실명 등록 서비스</a>를 이용하세요.</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500 text-center">
            자세한 문의사항은 고객센터로 연락해 주세요.
          </p>
        </div>
      </div>
      
      {/* 채팅봇 */}
      <ChatBot />
    </div>
  )
}

export default Points
