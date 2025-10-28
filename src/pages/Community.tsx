import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, ThumbsUp, Send, Image as ImageIcon, X, Trash2, Clock, TrendingUp } from 'lucide-react'
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

  const handleDeletePost = async (postId: string) => {
    if (!confirm('정말 이 게시물을 삭제하시겠습니까?')) {
      return
    }

    try {
      const { error } = await dataService.community.deletePost(postId)
      if (error) throw error

      toast.success('게시물이 삭제되었습니다')
      setPosts(posts.filter(p => p.id !== postId))
    } catch (error) {
      console.error('게시물 삭제 실패:', error)
      toast.error('게시물 삭제에 실패했습니다')
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <div className="inline-flex items-center space-x-2 mb-3">
            <MessageSquare className="w-8 h-8 text-primary-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-pink-600 bg-clip-text text-transparent">
              커뮤니티
            </h1>
          </div>
          <p className="text-slate-600 text-lg">올띵버킷 멤버들과 자유롭게 소통하고 경험을 공유하세요</p>
          <div className="flex items-center justify-center space-x-6 mt-4 text-sm text-slate-500">
            <div className="flex items-center space-x-1">
              <TrendingUp className="w-4 h-4" />
              <span>게시물 {posts.length}개</span>
            </div>
            <div className="flex items-center space-x-1">
              <ThumbsUp className="w-4 h-4" />
              <span>좋아요 {posts.reduce((sum, p) => sum + p.likes, 0)}개</span>
            </div>
          </div>
        </div>

        {/* 게시물 작성 */}
        {isAuthenticated ? (
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-slate-200">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                {user?.email ? extractUsername(user.email).charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  placeholder="무엇을 공유하고 싶으신가요?"
                  className="w-full p-4 border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary-500 transition-colors text-base"
                  rows={4}
                />

                {imagePreview && (
                  <div className="relative mt-4">
                    <img src={imagePreview} alt="Preview" className="w-full max-h-96 object-cover rounded-xl" />
                    <button
                      onClick={() => {
                        setNewPostImage(null)
                        setImagePreview(null)
                      }}
                      className="absolute top-3 right-3 p-2 bg-black/60 rounded-full text-white hover:bg-black/80 transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                )}

                <div className="flex items-center justify-between mt-4">
                  <label className="cursor-pointer group">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                    />
                    <div className="flex items-center space-x-2 px-4 py-2.5 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">
                      <ImageIcon className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
                      <span className="text-slate-700 font-medium">사진 추가</span>
                    </div>
                  </label>

                  <button
                    onClick={handleCreatePost}
                    disabled={!newPostContent.trim()}
                    className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-pink-600 text-white rounded-xl hover:from-primary-700 hover:to-pink-700 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                  >
                    게시하기
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-primary-50 to-pink-50 rounded-2xl p-8 mb-8 text-center border border-primary-100">
            <MessageSquare className="w-12 h-12 text-primary-600 mx-auto mb-3" />
            <h3 className="text-xl font-bold text-slate-900 mb-2">로그인하고 소통해보세요!</h3>
            <p className="text-slate-600">로그인하면 게시물을 작성하고 댓글을 남길 수 있습니다.</p>
          </div>
        )}

        {/* 게시물 목록 */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-20">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
              <p className="text-slate-600 mt-6 text-lg">게시물을 불러오는 중...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-slate-200">
              <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-slate-700 mb-2">아직 게시물이 없습니다</h3>
              <p className="text-slate-500">첫 번째 게시물의 주인공이 되어보세요!</p>
            </div>
          ) : (
            posts.map((post) => {
              const displayName = extractUsername(post.user_email)
              const hasLiked = user && post.liked_by.includes(user.id)
              const isAuthor = user && post.user_id === user.id

              return (
                <div key={post.id} className="bg-white rounded-2xl shadow-lg p-6 border border-slate-200 hover:shadow-xl transition-shadow">
                  {/* 게시물 헤더 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0">
                        {displayName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-base font-bold text-slate-900">{displayName}</h3>
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <Clock className="w-3 h-3" />
                          <span>{getTimeAgo(post.created_at)}</span>
                        </div>
                      </div>
                    </div>

                    {isAuthor && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  {/* 게시물 내용 */}
                  <p className="text-base text-slate-800 leading-relaxed whitespace-pre-line mb-4">
                    {post.content}
                  </p>

                  {/* 이미지 */}
                  {post.image_url && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <img
                        src={post.image_url}
                        alt="Post"
                        className="w-full max-h-96 object-cover"
                      />
                    </div>
                  )}

                  {/* 좋아요/댓글 통계 */}
                  <div className="flex items-center justify-between py-3 border-t border-b border-slate-100">
                    <button
                      onClick={() => handleLikePost(post.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-all ${
                        hasLiked
                          ? 'text-primary-600 bg-primary-50 font-semibold'
                          : 'text-slate-600 hover:text-primary-600 hover:bg-slate-50'
                      }`}
                    >
                      <ThumbsUp className={`w-5 h-5 ${hasLiked ? 'fill-current' : ''}`} />
                      <span className="text-sm">{post.likes > 0 ? `좋아요 ${post.likes}` : '좋아요'}</span>
                    </button>
                    <div className="flex items-center space-x-2 text-slate-600">
                      <MessageSquare className="w-5 h-5" />
                      <span className="text-sm font-medium">댓글 {post.comments?.length || 0}</span>
                    </div>
                  </div>

                  {/* 댓글 목록 */}
                  {post.comments && post.comments.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {post.comments.map((comment) => {
                        const commentUsername = extractUsername(comment.user_email)
                        return (
                          <div key={comment.id} className="flex items-start space-x-3 p-3 bg-slate-50 rounded-xl">
                            <div className="w-9 h-9 bg-gradient-to-br from-navy-500 to-navy-600 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                              {commentUsername.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2 mb-1">
                                <span className="text-sm font-bold text-slate-900">{commentUsername}</span>
                                <span className="text-xs text-slate-400">·</span>
                                <span className="text-xs text-slate-500">{getTimeAgo(comment.created_at)}</span>
                              </div>
                              <p className="text-sm text-slate-700 leading-relaxed">{comment.content}</p>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}

                  {/* 댓글 입력 */}
                  {isAuthenticated && (
                    <div className="mt-4 flex items-center space-x-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-primary-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {user?.email ? extractUsername(user.email).charAt(0).toUpperCase() : 'U'}
                      </div>
                      <input
                        type="text"
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        onKeyPress={(e) => e.key === 'Enter' && handleAddComment(post.id)}
                        placeholder="댓글을 입력하세요..."
                        className="flex-1 px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm focus:outline-none focus:border-primary-500 transition-colors"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="p-2.5 bg-gradient-to-r from-primary-600 to-pink-600 text-white rounded-xl hover:from-primary-700 hover:to-pink-700 transition-all shadow-md"
                      >
                        <Send className="w-5 h-5" />
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
