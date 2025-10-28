import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, ThumbsUp, Eye, PenSquare, Search, Filter, TrendingUp, Clock, Heart, Sparkles } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface Post {
  id: string
  user_id: string
  user_email: string
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
  content: string
  created_at: string
}

const CATEGORIES = [
  { id: 'all', name: '전체', icon: '📋', color: 'bg-slate-100 text-slate-700' },
  { id: '자유게시판', name: '자유게시판', icon: '💬', color: 'bg-blue-100 text-blue-700' },
  { id: '체험후기', name: '체험후기', icon: '⭐', color: 'bg-yellow-100 text-yellow-700' },
  { id: '꿀팁공유', name: '꿀팁공유', icon: '💡', color: 'bg-green-100 text-green-700' },
  { id: '질문답변', name: '질문답변', icon: '❓', color: 'bg-purple-100 text-purple-700' },
  { id: '제품추천', name: '제품추천', icon: '🎁', color: 'bg-pink-100 text-pink-700' },
  { id: '캠페인정보', name: '캠페인정보', icon: '📢', color: 'bg-orange-100 text-orange-700' },
  { id: '사진/영상', name: '사진/영상', icon: '📸', color: 'bg-indigo-100 text-indigo-700' },
]

const Community: React.FC = () => {
  const { user, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [filteredPosts, setFilteredPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'latest' | 'popular'>('latest')
  const [showWriteModal, setShowWriteModal] = useState(false)

  useEffect(() => {
    fetchPosts()
  }, [])

  useEffect(() => {
    filterAndSortPosts()
  }, [posts, selectedCategory, searchQuery, sortBy])

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

  const filterAndSortPosts = () => {
    let filtered = [...posts]

    // 카테고리 필터
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(post => post.category === selectedCategory)
    }

    // 검색 필터
    if (searchQuery.trim()) {
      filtered = filtered.filter(post =>
        post.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // 정렬
    if (sortBy === 'latest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    } else {
      filtered.sort((a, b) => b.likes - a.likes)
    }

    setFilteredPosts(filtered)
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

      return date.toLocaleDateString('ko-KR', { month: 'long', day: 'numeric' })
    } catch {
      return '방금 전'
    }
  }

  const getCategoryInfo = (category?: string) => {
    return CATEGORIES.find(cat => cat.id === category) || CATEGORIES[1]
  }

  const getPreviewText = (content: string, maxLength: number = 100) => {
    if (content.length <= maxLength) return content
    return content.substring(0, maxLength) + '...'
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <Sparkles className="w-7 h-7 text-primary-600" />
              <h1 className="text-2xl font-bold text-slate-900">반려동물 커뮤니티</h1>
            </div>
            {isAuthenticated && (
              <button
                onClick={() => setShowWriteModal(true)}
                className="flex items-center space-x-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium shadow-md"
              >
                <PenSquare className="w-4 h-4" />
                <span>글쓰기</span>
              </button>
            )}
          </div>

          {/* 검색 & 정렬 */}
          <div className="flex items-center space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="궁금한 내용을 검색해보세요"
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSortBy('latest')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  sortBy === 'latest'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                최신순
              </button>
              <button
                onClick={() => setSortBy('popular')}
                className={`px-4 py-2.5 rounded-lg font-medium transition-colors ${
                  sortBy === 'popular'
                    ? 'bg-primary-600 text-white'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                인기순
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* 사이드바 - 카테고리 */}
          <aside className="w-64 flex-shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 sticky top-24">
              <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center">
                <Filter className="w-4 h-4 mr-2" />
                카테고리
              </h3>
              <div className="space-y-1">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors text-left ${
                      selectedCategory === category.id
                        ? 'bg-primary-50 text-primary-700 font-semibold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xl">{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                    {category.id !== 'all' && (
                      <span className="ml-auto text-xs text-slate-500">
                        {posts.filter(p => p.category === category.id).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 통계 */}
              <div className="mt-6 pt-4 border-t border-slate-200">
                <div className="space-y-2 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>전체 게시글</span>
                    <span className="font-bold text-slate-900">{posts.length}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>오늘 작성</span>
                    <span className="font-bold text-primary-600">
                      {posts.filter(p => {
                        const today = new Date().toDateString()
                        return new Date(p.created_at).toDateString() === today
                      }).length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* 메인 컨텐츠 - 게시글 목록 */}
          <main className="flex-1">
            {/* 모바일 카테고리 */}
            <div className="lg:hidden mb-4 overflow-x-auto pb-2">
              <div className="flex space-x-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 flex items-center space-x-2 px-4 py-2 rounded-full transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white font-semibold'
                        : 'bg-white border border-slate-300 text-slate-700'
                    }`}
                  >
                    <span>{category.icon}</span>
                    <span className="text-sm">{category.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
                <p className="text-slate-600 mt-4">로딩 중...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-xl border border-slate-200">
                <MessageSquare className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-700 mb-2">
                  {searchQuery ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
                </h3>
                <p className="text-slate-500">
                  {searchQuery ? '다른 검색어로 시도해보세요' : '첫 번째 글을 작성해보세요!'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredPosts.map((post) => {
                  const categoryInfo = getCategoryInfo(post.category)
                  const hasLiked = user && post.liked_by.includes(user.id)

                  return (
                    <div
                      key={post.id}
                      className="bg-white rounded-xl border border-slate-200 hover:border-primary-300 hover:shadow-md transition-all p-5 cursor-pointer"
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${categoryInfo.color}`}>
                              {categoryInfo.icon} {categoryInfo.name}
                            </span>
                            {post.likes > 5 && (
                              <span className="inline-flex items-center px-2 py-1 bg-red-50 text-red-600 rounded-full text-xs font-bold">
                                <Heart className="w-3 h-3 mr-1 fill-current" />
                                인기
                              </span>
                            )}
                          </div>
                          <h3 className="text-base font-bold text-slate-900 mb-2 line-clamp-1">
                            {getPreviewText(post.content, 60)}
                          </h3>
                          <p className="text-sm text-slate-600 line-clamp-2 mb-3">
                            {getPreviewText(post.content, 150)}
                          </p>
                        </div>
                        {post.image_url && (
                          <div className="ml-4 flex-shrink-0">
                            <img
                              src={post.image_url}
                              alt="thumbnail"
                              className="w-24 h-24 rounded-lg object-cover"
                            />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                        <div className="flex items-center space-x-1">
                          <span className="font-medium text-slate-700">
                            {extractUsername(post.user_email)}
                          </span>
                          <span>·</span>
                          <span>{getTimeAgo(post.created_at)}</span>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-1">
                            <ThumbsUp className={`w-4 h-4 ${hasLiked ? 'fill-current text-primary-600' : ''}`} />
                            <span>{post.likes}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageSquare className="w-4 h-4" />
                            <span>{post.comments?.length || 0}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </main>
        </div>
      </div>

      {/* 글쓰기 모달 */}
      {showWriteModal && (
        <WriteModal
          onClose={() => setShowWriteModal(false)}
          onSuccess={() => {
            setShowWriteModal(false)
            fetchPosts()
          }}
          user={user}
        />
      )}
    </div>
  )
}

// 글쓰기 모달 컴포넌트
const WriteModal: React.FC<{
  onClose: () => void
  onSuccess: () => void
  user: any
}> = ({ onClose, onSuccess, user }) => {
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('자유게시판')
  const [image, setImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImage(file)
      const reader = new FileReader()
      reader.onloadend = () => setImagePreview(reader.result as string)
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (!content.trim()) {
      toast.error('내용을 입력해주세요')
      return
    }

    try {
      setSubmitting(true)
      let image_url = ''

      if (image) {
        const formData = new FormData()
        formData.append('file', image)
        const uploadResult = await dataService.uploadImage(formData)
        if (uploadResult.error) throw uploadResult.error
        image_url = uploadResult.data?.url || ''
      }

      const { error } = await dataService.community.createPost({
        user_id: user.id,
        user_email: user.email || '',
        content,
        category,
        image_url: image_url || undefined
      })

      if (error) throw error

      toast.success('게시글이 작성되었습니다')
      onSuccess()
    } catch (error) {
      console.error('게시글 작성 실패:', error)
      toast.error('게시글 작성에 실패했습니다')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">글쓰기</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* 카테고리 선택 */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">카테고리</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.filter(cat => cat.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
                    category === cat.id
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="text-2xl mb-1">{cat.icon}</span>
                  <span className="text-xs font-medium">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 내용 입력 */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="반려동물에 관한 이야기를 자유롭게 공유해주세요"
              className="w-full h-64 p-4 border-2 border-slate-200 rounded-xl resize-none focus:outline-none focus:border-primary-500 transition-colors"
            />
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">사진 첨부 (선택)</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-64 object-cover rounded-xl" />
                <button
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 p-2 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  ✕
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl hover:border-primary-500 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <span className="text-4xl mb-2">📸</span>
                <span className="text-sm text-slate-600">클릭하여 사진 추가</span>
              </label>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
          >
            {submitting ? '작성 중...' : '게시하기'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Community
