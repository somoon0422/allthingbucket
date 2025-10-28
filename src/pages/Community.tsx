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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">커뮤니티</h1>
            {isAuthenticated && (
              <button
                onClick={() => setShowWriteModal(true)}
                className="flex items-center space-x-2 px-5 py-2.5 bg-primary-600 text-white text-sm font-medium rounded-md hover:bg-primary-700 transition-colors"
              >
                <PenSquare className="w-4 h-4" />
                <span>글쓰기</span>
              </button>
            )}
          </div>

          {/* 검색 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="검색어를 입력하세요"
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 메인 */}
        <div>
          <main className="w-full">
            {/* 카테고리 (모든 화면) */}
            <div className="mb-4 overflow-x-auto">
              <div className="flex space-x-2 pb-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-4 py-2 text-sm rounded-md transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-primary-600 text-white font-medium'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 정렬 */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-600">
                총 <span className="font-medium text-gray-900">{filteredPosts.length}</span>개의 게시글
              </p>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setSortBy('latest')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    sortBy === 'latest'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  최신순
                </button>
                <button
                  onClick={() => setSortBy('popular')}
                  className={`px-3 py-1.5 text-sm rounded transition-colors ${
                    sortBy === 'popular'
                      ? 'bg-gray-900 text-white'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  인기순
                </button>
              </div>
            </div>

            {/* 게시글 목록 */}
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-gray-200 border-t-primary-600 mx-auto"></div>
                <p className="text-sm text-gray-500 mt-3">로딩 중...</p>
              </div>
            ) : filteredPosts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-gray-200 rounded-md">
                <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-600">
                  {searchQuery ? '검색 결과가 없습니다' : '아직 게시글이 없습니다'}
                </p>
              </div>
            ) : (
              <div className="bg-white border border-gray-200 rounded-md">
                {filteredPosts.map((post, idx) => {
                  const categoryInfo = getCategoryInfo(post.category)
                  const canDelete = user && (post.user_id === user.id || isAdminUser())

                  return (
                    <div
                      key={post.id}
                      className={`flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group ${
                        idx !== 0 ? 'border-t border-gray-200' : ''
                      }`}
                      onClick={() => navigate(`/community/${post.id}`)}
                    >
                      <div className="flex-shrink-0 w-16">
                        <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full border border-gray-300">
                          {categoryInfo.name}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1 hover:text-primary-600 transition-colors">
                          {getPreviewText(post.content, 100)}
                        </h3>
                      </div>
                      <div className="flex-shrink-0 flex items-center gap-4 text-xs text-gray-500">
                        <span>{extractUsername(post.user_email)}</span>
                        <span>{getTimeAgo(post.created_at)}</span>
                        <span className="flex items-center gap-1">
                          <ThumbsUp className="w-3.5 h-3.5" />
                          {post.likes}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {post.comments?.length || 0}
                        </span>
                        {canDelete && (
                          <button
                            onClick={(e) => handleDeletePost(post.id, e)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all"
                            title={isAdminUser() && post.user_id !== user?.id ? '관리자 권한으로 삭제' : '삭제'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
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
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-5 py-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">글쓰기</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* 카테고리 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">카테고리</label>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.filter(cat => cat.id !== 'all').map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`px-4 py-2 text-sm rounded-md border transition-colors ${
                    category === cat.id
                      ? 'bg-primary-600 text-white border-primary-600'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">내용</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="내용을 입력하세요"
              className="w-full h-64 p-3 text-sm border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          {/* 이미지 */}
          <div>
            <label className="block text-sm font-medium text-gray-900 mb-2">이미지 (선택)</label>
            {imagePreview ? (
              <div className="relative">
                <img src={imagePreview} alt="Preview" className="w-full h-48 object-cover rounded-md" />
                <button
                  onClick={() => {
                    setImage(null)
                    setImagePreview(null)
                  }}
                  className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black/80"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-md hover:border-primary-500 cursor-pointer transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                />
                <span className="text-sm text-gray-500">클릭하여 이미지 추가</span>
              </label>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t px-5 py-4 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !content.trim()}
            className="px-4 py-2 text-sm bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '작성 중...' : '작성'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default Community
