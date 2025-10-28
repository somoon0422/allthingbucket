import React, { useState, useEffect } from 'react'
import { dataService } from '../lib/dataService'
import { useAuth } from '../hooks/useAuth'
import { MessageSquare, ThumbsUp, PenSquare, Search, X, Trash2 } from 'lucide-react'
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
  { id: 'all', name: '전체' },
  { id: '자유게시판', name: '자유게시판' },
  { id: '가입인사', name: '가입인사' },
  { id: '서이추', name: '서이추' },
  { id: '이벤트', name: '이벤트' },
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

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (!window.confirm('정말 삭제하시겠습니까?')) {
      return
    }

    try {
      const { error } = await dataService.community.deletePost(postId)
      if (error) throw error

      toast.success('게시글이 삭제되었습니다')
      fetchPosts()
    } catch (error) {
      console.error('게시글 삭제 실패:', error)
      toast.error('게시글 삭제에 실패했습니다')
    }
  }

  const { isAdminUser } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-5xl mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent mb-2">
            ✨ 커뮤니티 ✨
          </h1>
          <p className="text-sm text-gray-600">함께 나누는 체험단 이야기</p>
        </div>

        {/* 검색 & 글쓰기 */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="궁금한 내용을 검색해보세요 🔍"
              className="w-full pl-12 pr-4 py-3 text-sm border-2 border-purple-200 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white shadow-sm"
            />
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowWriteModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full hover:shadow-lg transform hover:scale-105 transition-all"
            >
              <PenSquare className="w-4 h-4" />
              <span>글쓰기</span>
            </button>
          )}
        </div>

        {/* 카테고리 */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex-shrink-0 px-5 py-2.5 text-sm font-medium rounded-full transition-all transform hover:scale-105 ${
                selectedCategory === category.id
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg'
                  : 'bg-white text-gray-700 border-2 border-purple-200 hover:border-purple-400'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* 정렬 */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            총 <span className="font-bold text-purple-600">{filteredPosts.length}</span>개의 게시글
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setSortBy('latest')}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                sortBy === 'latest'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-400'
              }`}
            >
              최신순
            </button>
            <button
              onClick={() => setSortBy('popular')}
              className={`px-4 py-2 text-sm rounded-full transition-all ${
                sortBy === 'popular'
                  ? 'bg-purple-600 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-300 hover:border-purple-400'
              }`}
            >
              인기순
            </button>
          </div>
        </div>

        {/* 게시글 목록 */}
        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-200 border-t-purple-600 mx-auto"></div>
            <p className="text-sm text-gray-500 mt-4">로딩 중...</p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-3xl">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              {searchQuery ? '검색 결과가 없어요' : '아직 게시글이 없어요'}
            </h3>
            <p className="text-sm text-gray-500">
              {searchQuery ? '다른 검색어로 시도해보세요' : '첫 번째 글을 작성해보세요!'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPosts.map((post) => {
              const categoryInfo = getCategoryInfo(post.category)
              const canDelete = user && (post.user_id === user.id || isAdminUser())

              return (
                <div
                  key={post.id}
                  className="bg-white/80 backdrop-blur-sm border-2 border-purple-200 rounded-2xl p-5 hover:shadow-lg hover:border-purple-400 transform hover:scale-[1.02] transition-all cursor-pointer group"
                  onClick={() => navigate(`/community/${post.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="inline-block px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 text-purple-700 text-xs font-medium rounded-full border border-purple-200">
                          {categoryInfo.name}
                        </span>
                        <span className="text-xs text-gray-500">
                          {extractUsername(post.user_email)}
                        </span>
                        <span className="text-xs text-gray-400">·</span>
                        <span className="text-xs text-gray-500">
                          {getTimeAgo(post.created_at)}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {post.content}
                      </h3>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-4 h-4" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-4 h-4" />
                          {post.comments?.length || 0}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {post.image_url && (
                        <img
                          src={post.image_url}
                          alt="thumbnail"
                          className="w-20 h-20 rounded-xl object-cover border-2 border-purple-100"
                        />
                      )}
                      {canDelete && (
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                          title={isAdminUser() && post.user_id !== user?.id ? '관리자 권한으로 삭제' : '삭제'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
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

// 글쓰기 모달
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
        try {
          const formData = new FormData()
          formData.append('file', image)
          const uploadResult = await dataService.uploadImage(formData)

          if (uploadResult.error) {
            console.warn('이미지 업로드 실패, 텍스트만 게시합니다:', uploadResult.error)
            toast('이미지 업로드에 실패했지만 텍스트는 게시됩니다', { icon: '⚠️' })
          } else {
            image_url = uploadResult.data?.url || ''
          }
        } catch (imageError) {
          console.warn('이미지 업로드 예외:', imageError)
          toast('이미지 업로드에 실패했지만 텍스트는 게시됩니다', { icon: '⚠️' })
        }
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gradient-to-br from-white to-purple-50 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border-2 border-purple-200">
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 px-6 py-5 flex items-center justify-between rounded-t-3xl">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            ✨ 글쓰기
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 p-2 rounded-full transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              📁 카테고리 선택
            </label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(cat => cat.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-full border-2 transition-all transform hover:scale-105 ${
                    category === cat.id
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white border-purple-400 shadow-lg'
                      : 'bg-white text-gray-700 border-purple-200 hover:border-purple-400'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              ✍️ 내용
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="어떤 이야기를 나눠볼까요? 😊"
              className="w-full h-64 p-4 text-sm border-2 border-purple-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent bg-white/80 backdrop-blur-sm"
            />
          </div>

          {/* 이미지 */}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              📸 이미지 (선택)
            </label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-56 object-cover rounded-2xl border-2 border-purple-200" />
                <button
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-3 right-3 p-2 bg-red-500 rounded-full text-white hover:bg-red-600 shadow-lg transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-36 border-2 border-dashed border-purple-300 rounded-2xl hover:border-purple-500 cursor-pointer transition-all bg-purple-50/50 hover:bg-purple-100/50">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <div className="text-5xl mb-2">📷</div>
                <span className="text-sm text-gray-600 font-medium">클릭하여 이미지 추가</span>
              </label>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white/80 backdrop-blur-sm border-t-2 border-purple-200 px-6 py-4 flex justify-end gap-3 rounded-b-3xl">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-sm border-2 border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-all font-medium"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="px-6 py-2.5 text-sm bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full hover:shadow-lg transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none font-medium"
          >
            {submitting ? '작성 중...' : '게시하기 ✨'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Community
