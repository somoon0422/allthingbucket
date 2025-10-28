import React, { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
import { ThumbsUp, MessageSquare, ArrowLeft, Trash2, Send } from 'lucide-react'
import toast from 'react-hot-toast'
import 'react-quill/dist/quill.snow.css'

interface Post {
  id: string
  user_id: string
  user_email: string
  user_nickname?: string
  user_profile_image_url?: string
  content: string
  category?: string
  image_url?: string
  likes: number
  liked_by: string[]
  created_at: string
  comments: Comment[]
}

interface Comment {
  id: string
  post_id: string
  user_id: string
  user_email: string
  user_nickname?: string
  user_profile_image_url?: string
  content: string
  created_at: string
}

const CommunityDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user, isAuthenticated, isAdminUser } = useAuth()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  const [commentContent, setCommentContent] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const viewCountIncrementedRef = useRef(false)

  useEffect(() => {
    if (id && !viewCountIncrementedRef.current) {
      fetchPost()
      // 조회수 증가 (한 번만)
      dataService.community.incrementViewCount(id)
      viewCountIncrementedRef.current = true
    }
  }, [id])

  const fetchPost = async () => {
    try {
      setLoading(true)
      const { data, error } = await dataService.community.getPosts()
      if (error) throw error

      const foundPost = data?.find((p: Post) => p.id === id)
      if (foundPost) {
        setPost(foundPost)
      } else {
        toast.error('게시글을 찾을 수 없습니다')
        navigate('/community')
      }
    } catch (error) {
      console.error('게시글 로드 실패:', error)
      toast.error('게시글을 불러올 수 없습니다')
      navigate('/community')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!isAuthenticated || !user || !post) {
      toast.error('로그인이 필요합니다')
      return
    }

    const hasLiked = post.liked_by.includes(user.id)

    try {
      const { error } = await dataService.community.likePost(post.id, user.id, !hasLiked)
      if (error) throw error

      setPost({
        ...post,
        likes: hasLiked ? post.likes - 1 : post.likes + 1,
        liked_by: hasLiked
          ? post.liked_by.filter(id => id !== user.id)
          : [...post.liked_by, user.id]
      })
    } catch (error) {
      console.error('좋아요 실패:', error)
      toast.error('좋아요에 실패했습니다')
    }
  }

  const handleAddComment = async () => {
    if (!isAuthenticated || !user || !post) {
      toast.error('로그인이 필요합니다')
      return
    }

    if (!commentContent.trim()) {
      toast.error('댓글 내용을 입력해주세요')
      return
    }

    try {
      setSubmitting(true)

      // 사용자 프로필 정보 가져오기 (닉네임, 프로필 이미지)
      let userNickname = user.email?.split('@')[0] || '익명'
      let userProfileImageUrl = ''

      try {
        // influencer_profiles에서 먼저 확인
        const influencerProfiles = await (dataService.entities as any).influencer_profiles.list()
        const influencerProfile = Array.isArray(influencerProfiles)
          ? influencerProfiles.find((p: any) => p && p.user_id === user.id)
          : null

        if (influencerProfile?.nickname) {
          userNickname = influencerProfile.nickname
          userProfileImageUrl = influencerProfile.profile_image_url || ''
        } else {
          // user_profiles에서 확인
          const userProfiles = await (dataService.entities as any).user_profiles.list()
          const userProfile = Array.isArray(userProfiles)
            ? userProfiles.find((p: any) => p && p.user_id === user.id)
            : null

          if (userProfile?.nickname) {
            userNickname = userProfile.nickname
            userProfileImageUrl = userProfile.profile_image_url || ''
          }
        }
      } catch (error) {
        console.warn('프로필 정보 조회 실패, 기본값 사용:', error)
      }

      const { error } = await dataService.community.addComment({
        post_id: post.id,
        user_id: user.id,
        user_email: user.email || '',
        user_nickname: userNickname,
        user_profile_image_url: userProfileImageUrl || undefined,
        content: commentContent
      })

      if (error) throw error

      toast.success('댓글이 작성되었습니다')
      setCommentContent('')
      fetchPost()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      toast.error('댓글 작성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeletePost = async () => {
    if (!post) return

    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      const { error } = await dataService.community.deletePost(post.id)
      if (error) throw error

      toast.success('게시글이 삭제되었습니다')
      navigate('/community')
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      toast.error('게시글 삭제에 실패했습니다')
    }
  }

  const extractUsername = (email: string) => {
    return email.split('@')[0]
  }

  const getTimeAgo = (dateStr: string) => {
    try {
      const date = new Date(dateStr)
      const now = new Date()
      const diffMs = now.getTime() - date.getTime()
      const diffMins = Math.floor(diffMs / 60000)
      const diffHours = Math.floor(diffMs / 3600000)
      const diffDays = Math.floor(diffMs / 86400000)

      if (diffMins < 1) return '방금 전'
      if (diffMins < 60) return `${diffMins}분 전`
      if (diffHours < 24) return `${diffHours}시간 전`
      if (diffDays < 7) return `${diffDays}일 전`

      return date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' })
    } catch {
      return '방금 전'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600"></div>
      </div>
    )
  }

  if (!post) {
    return null
  }

  const hasLiked = user && post.liked_by.includes(user.id)
  const canDelete = user && (post.user_id === user.id || isAdminUser())

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-4">
          <button
            onClick={() => navigate('/community')}
            className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            목록으로
          </button>
        </div>

        {/* 게시글 */}
        <div className="bg-white border border-gray-200 rounded-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
                    {post.category || '자유게시판'}
                  </span>
                  <div className="flex items-center gap-2">
                    {post.user_profile_image_url ? (
                      <img
                        src={post.user_profile_image_url}
                        alt={post.user_nickname || '프로필'}
                        className="w-5 h-5 rounded-full object-cover border border-gray-200"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-xs text-gray-500">
                          {(post.user_nickname || post.user_email.split('@')[0])[0].toUpperCase()}
                        </span>
                      </div>
                    )}
                    <span className="text-xs text-gray-500">
                      {post.user_nickname || extractUsername(post.user_email)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">·</span>
                  <span className="text-xs text-gray-500">
                    {getTimeAgo(post.created_at)}
                  </span>
                </div>
              </div>
              {canDelete && (
                <button
                  onClick={handleDeletePost}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                  title={isAdminUser() && post.user_id !== user?.id ? '관리자 권한으로 삭제' : '삭제'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            <div className="prose max-w-none">
              <div
                className="text-gray-900 ql-editor"
                dangerouslySetInnerHTML={{ __html: post.content }}
              />
            </div>

            {post.image_url && (
              <div className="mt-4">
                <img
                  src={post.image_url}
                  alt="Post"
                  className="w-full max-h-96 object-contain rounded-md"
                />
              </div>
            )}

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={handleLike}
                disabled={!isAuthenticated}
                className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
                  hasLiked
                    ? 'bg-primary-50 text-primary-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                <span className="text-sm font-medium">{post.likes}</span>
              </button>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MessageSquare className="w-4 h-4" />
                <span>{post.comments?.length || 0}</span>
              </div>
            </div>
          </div>

          {/* 댓글 목록 */}
          <div className="p-6">
            <h3 className="text-sm font-bold text-gray-900 mb-4">
              댓글 {post.comments?.length || 0}
            </h3>

            {post.comments && post.comments.length > 0 ? (
              <div className="space-y-4 mb-4">
                {post.comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex-shrink-0 w-8 h-8 bg-gray-200 rounded-full overflow-hidden">
                      {comment.user_profile_image_url ? (
                        <img
                          src={comment.user_profile_image_url}
                          alt={comment.user_nickname || '프로필'}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-sm text-gray-500">
                            {(comment.user_nickname || comment.user_email.split('@')[0])[0].toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm font-medium text-gray-900">
                          {comment.user_nickname || extractUsername(comment.user_email)}
                        </span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(comment.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">{comment.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 mb-4">첫 댓글을 작성해보세요</p>
            )}

            {/* 댓글 작성 */}
            {isAuthenticated ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={commentContent}
                  onChange={(e) => setCommentContent(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  placeholder="댓글을 입력하세요"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  disabled={submitting}
                />
                <button
                  onClick={handleAddComment}
                  disabled={submitting || !commentContent.trim()}
                  className="px-4 py-2 bg-primary-600 text-white text-sm rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <p className="text-sm text-gray-500">댓글을 작성하려면 로그인하세요</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CommunityDetail
