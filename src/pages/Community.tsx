import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, ThumbsUp, Send, Image as ImageIcon, X, Edit2, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface Post {
  id: string
  user_id: string
  user_email: string
  content: string
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
  content: string
  created_at: string
}

const Community: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [newPostContent, setNewPostContent] = useState('')
  const [newPostImage, setNewPostImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [commentInputs, setCommentInputs] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await dataService.community.getPosts()
      if (error) throw error
      setPosts(data || [])
    } catch (error) {
      console.error('게시물 로드 실패:', error)
      toast.error('게시물을 불러올 수 없습니다')
    } finally {
      setLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setNewPostImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCreatePost = async () => {
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다')
      return
    }

    if (!newPostContent.trim()) {
      toast.error('내용을 입력해주세요')
      return
    }

    try {
      let image_url = ''

      if (newPostImage) {
        const formData = new FormData()
        formData.append('file', newPostImage)
        const uploadResult = await dataService.uploadImage(formData)
        if (uploadResult.error) throw uploadResult.error
        image_url = uploadResult.data?.url || ''
      }

      const { error } = await dataService.community.createPost({
        user_id: user.id,
        user_email: user.email || '',
        content: newPostContent,
        image_url: image_url || undefined
      })

      if (error) throw error

      toast.success('게시물이 작성되었습니다')
      setNewPostContent('')
      setNewPostImage(null)
      setImagePreview(null)
      fetchPosts()
    } catch (error) {
      console.error('게시물 작성 실패:', error)
      toast.error('게시물 작성에 실패했습니다')
    }
  }

  const handleLikePost = async (postId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다')
      return
    }

    try {
      const post = posts.find(p => p.id === postId)
      if (!post) return

      const hasLiked = post.liked_by.includes(user.id)

      const { error } = await dataService.community.likePost(postId, user.id, !hasLiked)
      if (error) throw error

      setPosts(posts.map(p =>
        p.id === postId
          ? {
              ...p,
              likes: hasLiked ? p.likes - 1 : p.likes + 1,
              liked_by: hasLiked
                ? p.liked_by.filter(id => id !== user.id)
                : [...p.liked_by, user.id]
            }
          : p
      ))
    } catch (error) {
      console.error('좋아요 실패:', error)
      toast.error('좋아요에 실패했습니다')
    }
  }

  const handleAddComment = async (postId: string) => {
    if (!isAuthenticated || !user) {
      toast.error('로그인이 필요합니다')
      return
    }

    const content = commentInputs[postId]?.trim()
    if (!content) {
      toast.error('댓글 내용을 입력해주세요')
      return
    }

    try {
      const { error } = await dataService.community.addComment({
        post_id: postId,
        user_id: user.id,
        user_email: user.email || '',
        content
      })

      if (error) throw error

      toast.success('댓글이 작성되었습니다')
      setCommentInputs({ ...commentInputs, [postId]: '' })
      fetchPosts()
    } catch (error) {
      console.error('댓글 작성 실패:', error)
      toast.error('댓글 작성에 실패했습니다')
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

      return date.toLocaleDateString('ko-KR')
    } catch {
      return '방금 전'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-beige-50 via-white to-beige-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* 헤더 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">커뮤니티</h1>
          <p className="text-slate-600">올띵버킷 멤버들과 자유롭게 소통하세요</p>
        </div>

        {/* 게시물 작성 */}
        {isAuthenticated && (
          <div className="bg-white rounded-xl p-5 border border-slate-200 mb-6">
            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="무슨 생각을 하고 계신가요?"
              className="w-full p-3 border border-slate-200 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              rows={3}
            />

            {imagePreview && (
              <div className="relative mt-3">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-lg" />
                <button
                  onClick={() => {
                    setNewPostImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="flex items-center justify-between mt-3">
              <label className="cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="flex items-center space-x-2 px-3 py-2 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors text-sm">
                  <ImageIcon className="w-4 h-4 text-slate-600" />
                  <span className="text-slate-600 font-medium">이미지</span>
                </div>
              </label>

              <button
                onClick={handleCreatePost}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm"
              >
                게시
              </button>
            </div>
          </div>
        )}

        {/* 게시물 목록 */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="text-slate-600 mt-4 text-sm">로딩 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-slate-200">
              <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-600 text-sm">아직 게시물이 없습니다</p>
              <p className="text-slate-500 text-xs mt-1">첫 번째 게시물을 작성해보세요!</p>
            </div>
          ) : (
            posts.map((post) => {
              const displayName = extractUsername(post.user_email)
              const hasLiked = user && post.liked_by.includes(user.id)

              return (
                <div key={post.id} className="bg-white rounded-xl p-5 border border-slate-200">
                  {/* 게시물 헤더 */}
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                      {displayName.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-900">{displayName}</h3>
                      <p className="text-xs text-slate-500">{getTimeAgo(post.created_at)}</p>
                    </div>
                  </div>

                  {/* 게시물 내용 */}
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line mb-3">
                    {post.content}
                  </p>

                  {/* 이미지 */}
                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt="Post"
                      className="w-full rounded-lg mb-3"
                    />
                  )}

                  {/* 좋아요/댓글 버튼 */}
                  <div className="flex items-center space-x-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center space-x-1 text-xs font-medium transition-colors ${
                        hasLiked ? 'text-primary-600' : 'text-slate-600 hover:text-primary-600'
                      }`}
                    >
                      <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current' : ''}`} />
                      <span>{post.likes}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-xs font-medium text-slate-600">
                      <MessageSquare className="w-4 h-4" />
                      <span>{post.comments?.length || 0}</span>
                    </div>
                  </div>

                  {/* 댓글 */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="mt-4 space-y-3 pt-3 border-t border-slate-100">
                      {post.comments.map((comment) => {
                        const commentUsername = extractUsername(comment.user_email)
                        return (
                          <div key={comment.id} className="flex items-start space-x-2">
                            <div className="w-7 h-7 bg-gradient-to-br from-navy-500 to-navy-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                              {commentUsername.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 bg-slate-50 rounded-lg p-2">
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-bold text-slate-900">{commentUsername}</span>
                                <span className="text-xs text-slate-500">{getTimeAgo(comment.created_at)}</span>
                              </div>
                              <p className="text-xs text-slate-700">{comment.content}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 댓글 입력 */}
                  {isAuthenticated && (
                    <div className="mt-3 flex items-center space-x-2">
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary-500"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

export default Community
