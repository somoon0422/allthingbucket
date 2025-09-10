
import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
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
        const reviewsResponse = await dataService.entities.review_submissions.list({
          filter: { application_id: applicationId }
        })
        
        console.log('📋 검색된 리뷰:', reviewsResponse)
        
        const reviews = Array.isArray(reviewsResponse) ? reviewsResponse : (reviewsResponse as any).data || []
        
        // 🔥 user_applications에서도 이미지 데이터 확인
        const applicationResponse = await dataService.entities.user_applications.get(applicationId)
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
      
      // 사용자 ID 우선순위로 확인
      const userId = user?.user_id || user?.id || (user as any)?._id
      if (!userId) {
        toast.error('사용자 인증 정보가 없습니다')
        return
      }
      
      // 리뷰 제출 데이터 생성
      const reviewData = {
        application_id: applicationId,
        experience_id: experienceId,
        experience_name: experienceName,
        user_id: userId,
        user_name: user?.name || (user as any)?.userName || '사용자',
        
        // 🔥 리뷰 내용
        blog_url: blogUrl.trim() || null,
        review_images: reviewImages,
        main_image: reviewImages.length > 0 ? reviewImages[0] : null,
        additional_notes: additionalNotes.trim() || null,
        
        // 상태 및 메타데이터
        status: 'pending', // 검수 대기
        submitted_at: new Date().toISOString(),
        review_type: blogUrl.trim() ? 'blog' : 'image', // 블로그 or 이미지 리뷰
        
        // 검수 관련
        admin_review_status: 'pending',
        admin_review_notes: null,
        reviewed_at: null,
        reviewed_by: null
      }

      console.log('📝 리뷰 제출 데이터:', reviewData)

      let reviewResult
      if (existingReview) {
        // 기존 리뷰 업데이트
        const reviewId = (existingReview as any)._id || (existingReview as any).id
        reviewResult = await dataService.entities.review_submissions.update(reviewId, reviewData)
        console.log('✅ 리뷰 업데이트 결과:', reviewResult)
      } else {
        // 새 리뷰 생성
        reviewResult = await dataService.entities.review_submissions.create(reviewData)
        console.log('✅ 리뷰 제출 결과:', reviewResult)
      }

      // 🚀 user_applications 상태 업데이트
      await dataService.entities.user_applications.update(applicationId, {
        status: 'review_submitted',
        review_submitted_at: new Date().toISOString(),
        review_submission_id: (reviewResult as any)._id || (reviewResult as any).id,
        blog_url: blogUrl.trim() || null,
        review_images: reviewImages,
        additional_notes: additionalNotes.trim() || null
      })

      console.log('✅ 신청 내역 상태 업데이트 완료')

      // 🚀 어드민 알림 생성
      try {
        await dataService.entities.admin_notifications.create({
          type: 'review_submitted',
          title: '새로운 리뷰 제출',
          message: `${user?.name || '사용자'}님이 "${experienceName}" 캠페인 리뷰를 제출했습니다.`,
          data: {
            application_id: applicationId,
            experience_id: experienceId,
            user_id: userId,
            review_submission_id: (reviewResult as any)._id || (reviewResult as any).id,
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
