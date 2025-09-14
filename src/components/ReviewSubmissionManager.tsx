
import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
import { SupabaseOAuthService } from '../services/supabaseOAuthService'
import ImageUploadManager from './ImageUploadManager'
import {FileText, Link, Image, Send, X, AlertCircle, CheckCircle, ExternalLink} from 'lucide-react'
import toast from 'react-hot-toast'

interface ReviewSubmissionManagerProps {
  isOpen: boolean
  onClose: () => void
  onSubmitComplete: () => void
  applicationId: string
  experienceId: string
  experienceName: string
}

const ReviewSubmissionManager: React.FC<ReviewSubmissionManagerProps> = ({
  isOpen,
  onClose,
  onSubmitComplete,
  applicationId,
  experienceId,
  experienceName
}) => {
  const { user } = useAuth()
  
  const [submitting, setSubmitting] = useState(false)
  const [blogUrl, setBlogUrl] = useState('')
  const [reviewImages, setReviewImages] = useState<string[]>([])
  const [additionalNotes, setAdditionalNotes] = useState('')
  const [existingReview, setExistingReview] = useState<any>(null)
  const [loadingReview, setLoadingReview] = useState(false)

  // 🔍 기존 리뷰 데이터 로드
  useEffect(() => {
    const loadExistingReview = async () => {
      if (!isOpen || !applicationId || !user?.user_id) return
      
      try {
        setLoadingReview(true)
        console.log('🔍 기존 리뷰 데이터 로딩:', { applicationId, userId: user.user_id })
        
        // application_id로 기존 리뷰 검색
        const reviewsResponse = await (dataService.entities as any).review_submissions.list({
          filter: { application_id: applicationId }
        })
        
        console.log('📋 검색된 리뷰:', reviewsResponse)
        
        const reviews = Array.isArray(reviewsResponse) ? reviewsResponse : (reviewsResponse as any).data || []
        
        // 🔥 user_applications에서도 이미지 데이터 확인
        const applicationResponse = await (dataService.entities as any).user_applications.get(applicationId)
        console.log('📋 신청 데이터에서 이미지 확인:', applicationResponse)
        
        if (reviews && reviews.length > 0) {
          const review = reviews[0] // 첫 번째 리뷰 사용
          setExistingReview(review)
          
          // 기존 데이터로 폼 채우기
          setBlogUrl(review.blog_url || '')
          
          // 🔥 모든 가능한 이미지 필드 확인 (리뷰 데이터에서)
          let existingImages = review.review_images || 
                              review.images || 
                              review.image_urls || 
                              review.attached_images ||
                              (review.main_image ? [review.main_image] : []) ||
                              []
          
          // 🔥 submission_data 필드에서도 이미지 확인
          if (review.submission_data && review.submission_data.images) {
            existingImages = review.submission_data.images
            console.log('🔄 submission_data에서 이미지 데이터 발견:', review.submission_data.images)
          }
          
          // 🔥 user_applications에서도 이미지 데이터 확인
          if (applicationResponse && (existingImages.length === 0 || !existingImages[0])) {
            const appImages = (applicationResponse as any).review_images || 
                             (applicationResponse as any).images || 
                             (applicationResponse as any).image_urls || 
                             (applicationResponse as any).attached_images ||
                             []
            if (appImages.length > 0) {
              existingImages = appImages
              console.log('🔄 user_applications에서 이미지 데이터 발견:', appImages)
            }
          }
          
          // 🔥 최종적으로 빈 배열이면 현재 reviewImages 상태 유지
          if (existingImages.length === 0 && reviewImages.length > 0) {
            console.log('🔄 기존 reviewImages 상태 유지:', reviewImages)
            existingImages = reviewImages
          }
          
          console.log('🔍 전체 리뷰 데이터:', review)
          console.log('🔍 신청 데이터:', applicationResponse)
          console.log('🖼️ 기존 이미지 데이터 (모든 필드):', {
            review_images: review.review_images,
            images: review.images,
            image_urls: review.image_urls,
            attached_images: review.attached_images,
            main_image: review.main_image,
            app_review_images: (applicationResponse as any)?.review_images,
            app_images: (applicationResponse as any)?.images,
            final_images: existingImages
          })
          
          setReviewImages(existingImages)
          setAdditionalNotes(review.additional_notes || (applicationResponse as any)?.additional_notes || '')
          
          console.log('✅ 기존 리뷰 데이터 로드 완료:', review)
        } else {
          // 🔥 리뷰가 없어도 user_applications에서 이미지 데이터 확인
          if (applicationResponse) {
            const appImages = (applicationResponse as any).review_images || 
                             (applicationResponse as any).images || 
                             (applicationResponse as any).image_urls || 
                             (applicationResponse as any).attached_images ||
                             []
            
            if (appImages.length > 0) {
              setReviewImages(appImages)
              setBlogUrl((applicationResponse as any).blog_url || '')
              setAdditionalNotes((applicationResponse as any).additional_notes || '')
              console.log('🔄 user_applications에서 기존 이미지 데이터 발견:', appImages)
            }
          }
          
          console.log('📝 새로운 리뷰 작성')
          setExistingReview(null)
        }
      } catch (error) {
        console.error('❌ 기존 리뷰 로드 실패:', error)
        setExistingReview(null)
      } finally {
        setLoadingReview(false)
      }
    }
    
    loadExistingReview()
  }, [isOpen, applicationId, user?.user_id])

  // 🔧 블로그 URL 유효성 검사
  const validateBlogUrl = (url: string): boolean => {
    if (!url.trim()) return false
    
    try {
      const urlObj = new URL(url)
      // 일반적인 블로그/SNS 플랫폼 확인
      const validDomains = [
        'blog.naver.com',
        'blog.daum.net',
        'tistory.com',
        'brunch.co.kr',
        'instagram.com',
        'youtube.com',
        'facebook.com',
        'twitter.com',
        'linkedin.com'
      ]
      
      const hostname = urlObj.hostname.toLowerCase()
      return validDomains.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      ) || hostname.includes('blog') || hostname.includes('review')
    } catch {
      return false
    }
  }

  // 🔧 리뷰 제출 처리
  const handleSubmitReview = async () => {
    if (!applicationId || !experienceId) {
      toast.error('신청 정보가 없습니다')
      return
    }

    // 유효성 검사
    if (!blogUrl.trim() && reviewImages.length === 0) {
      toast.error('블로그 URL 또는 구매평 이미지 중 하나는 필수입니다')
      return
    }

    if (blogUrl.trim() && !validateBlogUrl(blogUrl)) {
      toast.error('올바른 블로그 URL을 입력해주세요 (네이버 블로그, 티스토리, 인스타그램 등)')
      return
    }

    try {
      setSubmitting(true)
      
      // 사용자 ID 확인 및 users 테이블에서 실제 ID 조회
      const authUserId = user?.user_id || user?.id || (user as any)?._id
      if (!authUserId) {
        toast.error('사용자 인증 정보가 없습니다')
        return
      }
      
      console.log('🔍 리뷰 제출 시 사용자 ID 확인:', { authUserId, user })
      
      // users 테이블에서 실제 사용자 ID 조회
      const usersResponse = await (dataService.entities as any).users.list()
      const users = Array.isArray(usersResponse) ? usersResponse : []
      
      console.log('🔍 users 테이블 조회 결과:', { 
        usersResponse, 
        users, 
        authUserId, 
        userEmail: user?.email,
        totalUsers: users.length 
      })
      
      // OAuth 로그도 함께 확인
      console.log('🔍 저장된 OAuth 로그:', SupabaseOAuthService.getStoredLogs())
      console.log('🔍 세션 OAuth 로그:', SupabaseOAuthService.getSessionLogs())
      
      let dbUser = users.find((u: any) => u.user_id === authUserId || u.email === user?.email)
      
      console.log('🔍 사용자 검색 결과:', { 
        dbUser, 
        searchCriteria: {
          byUserId: users.find((u: any) => u.user_id === authUserId),
          byEmail: users.find((u: any) => u.email === user?.email)
        }
      })
      
      if (!dbUser) {
        console.error('❌ users 테이블에서 사용자를 찾을 수 없음:', { 
          authUserId, 
          email: user?.email, 
          users: users.map(u => ({ id: u.id, user_id: u.user_id, email: u.email }))
        })
        
        // 현재 로그인된 사용자 정보를 users 테이블에 자동으로 생성
        console.log('🔄 users 테이블에 현재 사용자 자동 생성 중...')
        try {
          const newUser = {
            user_id: authUserId,
            email: user?.email || '',
            name: user?.name || user?.email?.split('@')[0] || '사용자',
            phone: null,
            google_id: authUserId, // 현재 사용자의 ID를 google_id로 설정
            profile_image_url: null,
            is_active: true
          }
          
          console.log('📝 생성할 사용자 데이터:', newUser)
          const createResult = await (dataService.entities as any).users.create(newUser)
          
          if (createResult && createResult.success) {
            console.log('✅ users 테이블에 사용자 생성 완료:', createResult.data)
            // 생성된 사용자를 dbUser로 설정
            const createdUser = createResult.data
            dbUser = createdUser
          } else {
            console.error('❌ users 테이블 사용자 생성 실패:', createResult)
            toast.error('사용자 정보 생성에 실패했습니다. 다시 로그인해주세요.')
            return
          }
        } catch (createError) {
          console.error('❌ users 테이블 사용자 생성 중 오류:', createError)
          toast.error('사용자 정보 생성 중 오류가 발생했습니다. 다시 로그인해주세요.')
          return
        }
      }
      
      console.log('✅ users 테이블에서 찾은 사용자:', dbUser)
      
      // dbUser 검증
      if (!dbUser || !dbUser.id || !dbUser.user_id) {
        console.error('❌ dbUser가 유효하지 않음:', dbUser)
        toast.error('사용자 정보가 유효하지 않습니다. 다시 로그인해주세요.')
        return
      }
      
      console.log('🔍 사용할 사용자 ID들:', {
        dbUser_id: dbUser.id,
        dbUser_user_id: dbUser.user_id,
        authUserId: authUserId
      })
      
      // 1. 먼저 user_reviews 테이블에 리뷰 내용 저장
      const userReviewData = {
        user_id: dbUser.user_id, // users.user_id (문자열) 사용 - FK 제약 조건에 맞춤
        campaign_id: experienceId,
        rating: 5, // 기본값, 나중에 별점 기능 추가 가능
        title: `${experienceName} 체험 후기`,
        content: additionalNotes.trim() || '체험 후기를 작성했습니다.',
        images: reviewImages,
        video_url: null,
        social_media_links: blogUrl.trim() ? [blogUrl.trim()] : [],
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      console.log('📝 user_reviews 데이터:', userReviewData)

      // user_reviews 테이블에 저장
      const userReviewResult = await (dataService.entities as any).user_reviews.create(userReviewData)
      console.log('✅ user_reviews 생성 결과:', userReviewResult)

      if (!userReviewResult.success) {
        throw new Error('리뷰 저장에 실패했습니다')
      }

      // 2. review_submissions 테이블에 제출 신청 저장
      const submissionData = {
        user_id: dbUser.user_id, // users.user_id (문자열) 사용 - FK 제약 조건에 맞춤
        campaign_id: experienceId,
        review_id: userReviewResult.data.id,
        submission_data: userReviewData, // user_reviews 정보를 JSON으로 저장
        status: 'submitted',
        submitted_at: new Date().toISOString()
      }

      console.log('📝 review_submissions 데이터:', submissionData)

      let submissionResult
      if (existingReview) {
        // 기존 제출 업데이트
        const submissionId = (existingReview as any)._id || (existingReview as any).id
        submissionResult = await (dataService.entities as any).review_submissions.update(submissionId, submissionData)
        console.log('✅ 리뷰 제출 업데이트 결과:', submissionResult)
      } else {
        // 새 제출 생성
        submissionResult = await (dataService.entities as any).review_submissions.create(submissionData)
        console.log('✅ 리뷰 제출 결과:', submissionResult)
      }

      // 🚀 user_applications 상태 업데이트
      try {
        // user_applications 테이블의 기존 데이터 확인
        const currentApplication = await (dataService.entities as any).user_applications.get(applicationId)
        console.log('🔍 현재 신청 데이터:', currentApplication)
        
        const updateData: any = {
          status: 'review_in_progress', // 리뷰검수중으로 변경
          review_submitted_at: new Date().toISOString() // 리뷰 제출 날짜 항상 설정
        }
        
        // 기존 필드가 있는 경우만 업데이트
        if (currentApplication && currentApplication.data) {
          const app = currentApplication.data
          if (app.review_submission_id !== undefined) updateData.review_submission_id = (submissionResult as any)._id || (submissionResult as any).id
          if (app.blog_url !== undefined) updateData.blog_url = blogUrl.trim() || null
          if (app.review_images !== undefined) updateData.review_images = reviewImages
        }
        
        console.log('📝 user_applications 업데이트 데이터:', { applicationId, updateData })
        const updateResult = await (dataService.entities as any).user_applications.update(applicationId, updateData)
        console.log('✅ 신청 내역 상태 업데이트 결과:', updateResult)
      } catch (updateError) {
        console.error('❌ user_applications 업데이트 실패:', updateError)
        // 업데이트 실패해도 리뷰 제출은 성공한 것으로 처리
      }

      // 🚀 어드민 알림 생성
      try {
        await (dataService.entities as any).admin_notifications.create({
          type: 'review_submitted',
          title: '새로운 리뷰 제출',
          message: `${user?.name || '사용자'}님이 "${experienceName}" 캠페인 리뷰를 제출했습니다.`,
          data: {
            application_id: applicationId,
            experience_id: experienceId,
            user_id: dbUser.id,
            review_submission_id: (submissionResult as any)._id || (submissionResult as any).id,
            review_type: blogUrl.trim() ? 'blog' : 'image'
          },
          created_at: new Date().toISOString(),
          read: false
        })
        console.log('✅ 어드민 알림 생성 완료')
      } catch (notificationError) {
        console.error('⚠️ 어드민 알림 생성 실패 (무시):', notificationError)
      }

      toast.success(existingReview ? '리뷰가 수정되었습니다! 검수 후 포인트가 지급됩니다.' : '리뷰가 제출되었습니다! 검수 후 포인트가 지급됩니다.')
      
      // 페이지 새로고침하여 상태 업데이트 반영
      setTimeout(() => {
        window.location.reload()
      }, 1500)
      
      onSubmitComplete()
      
    } catch (error) {
      console.error('❌ 리뷰 제출 실패:', error)
      
      // 더 자세한 에러 정보 제공
      let errorMessage = '리뷰 제출에 실패했습니다. 다시 시도해주세요.'
      
      if (error instanceof Error) {
        console.error('❌ 에러 상세:', {
          message: error.message,
          stack: error.stack,
          name: error.name
        })
        
        if (error.message.includes('인증') || error.message.includes('auth')) {
          errorMessage = '로그인이 필요합니다. 다시 로그인해주세요.'
        } else if (error.message.includes('권한') || error.message.includes('permission')) {
          errorMessage = '권한이 없습니다. 관리자에게 문의해주세요.'
        } else if (error.message.includes('네트워크') || error.message.includes('network')) {
          errorMessage = '네트워크 연결을 확인해주세요.'
        }
      }
      
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  // 🔧 초기화
  const handleReset = () => {
    setBlogUrl('')
    setReviewImages([])
    setAdditionalNotes('')
  }

  if (!isOpen) return null

  if (loadingReview) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
            <span className="text-gray-700">기존 리뷰 데이터를 불러오는 중...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {existingReview ? '리뷰 수정 및 재제출' : '리뷰 제출 및 검수 요청'}
            </h3>
            <p className="text-sm text-gray-600 mt-1">{experienceName}</p>
            {existingReview && (
              <p className="text-xs text-blue-600 mt-1">기존 리뷰를 수정하여 재제출합니다</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <div className="space-y-6">
          {/* 안내 메시지 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" />
              <div className="text-sm text-blue-800">
                <p className="font-medium mb-1">리뷰 제출 안내</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>블로그 URL 또는 구매평 이미지 중 하나는 필수로 제출해야 합니다</li>
                  <li>제출된 리뷰는 관리자 검수 후 포인트가 지급됩니다</li>
                  <li>검수는 보통 1-3일 소요되며, 승인/반려 결과를 알려드립니다</li>
                </ul>
              </div>
            </div>
          </div>

          {/* 블로그 URL 입력 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Link className="w-4 h-4 inline mr-1" />
              블로그 리뷰 URL (선택)
            </label>
            <div className="space-y-2">
              <input
                type="url"
                value={blogUrl}
                onChange={(e) => setBlogUrl(e.target.value)}
                placeholder="https://blog.naver.com/... 또는 https://instagram.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              
              {/* URL 유효성 표시 */}
              {blogUrl.trim() && (
                <div className={`flex items-center text-sm ${
                  validateBlogUrl(blogUrl) ? 'text-green-600' : 'text-red-600'
                }`}>
                  {validateBlogUrl(blogUrl) ? (
                    <>
                      <CheckCircle className="w-4 h-4 mr-1" />
                      <span>올바른 블로그 URL입니다</span>
                      <a 
                        href={blogUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:text-blue-700"
                      >
                        <ExternalLink className="w-4 h-4 inline" />
                      </a>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="w-4 h-4 mr-1" />
                      <span>올바른 블로그 URL을 입력해주세요</span>
                    </>
                  )}
                </div>
              )}
              
              <p className="text-xs text-gray-500">
                지원 플랫폼: 네이버 블로그, 티스토리, 브런치, 인스타그램, 유튜브 등
              </p>
            </div>
          </div>

          {/* 구매평 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <Image className="w-4 h-4 inline mr-1" />
              구매평 이미지 (선택)
            </label>
            <ImageUploadManager
              onImagesChange={setReviewImages}
              initialImages={reviewImages}
              maxImages={5}
              allowFileUpload={true}
              allowUrlInput={true}
            />
          </div>

          {/* 추가 메모 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              <FileText className="w-4 h-4 inline mr-1" />
              추가 메모 (선택)
            </label>
            <textarea
              value={additionalNotes}
              onChange={(e) => setAdditionalNotes(e.target.value)}
              placeholder="리뷰 관련 추가 설명이나 요청사항을 입력해주세요..."
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* 제출 요약 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">제출 내용 요약</h4>
            <div className="space-y-1 text-sm text-gray-600">
              <div className="flex items-center justify-between">
                <span>블로그 URL:</span>
                <span className={blogUrl.trim() ? 'text-green-600' : 'text-gray-400'}>
                  {blogUrl.trim() ? '✓ 입력됨' : '미입력'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>구매평 이미지:</span>
                <span className={reviewImages.length > 0 ? 'text-green-600' : 'text-gray-400'}>
                  {reviewImages.length > 0 ? `✓ ${reviewImages.length}장` : '미업로드'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>추가 메모:</span>
                <span className={additionalNotes.trim() ? 'text-green-600' : 'text-gray-400'}>
                  {additionalNotes.trim() ? '✓ 작성됨' : '미작성'}
                </span>
              </div>
            </div>
          </div>

          {/* 버튼 영역 */}
          <div className="flex space-x-3 pt-4">
            <button
              onClick={handleReset}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              초기화
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmitReview}
              disabled={submitting || (!blogUrl.trim() && reviewImages.length === 0)}
              className="flex-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {submitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  제출 중...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {existingReview ? '리뷰 수정 제출' : '리뷰 제출'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReviewSubmissionManager
