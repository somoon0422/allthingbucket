import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'
import { MessageCircle, Send, ArrowLeft, User as UserIcon } from 'lucide-react'
import toast from 'react-hot-toast'

const AdminChat: React.FC = () => {
  const { isAuthenticated, isAdminUser } = useAuth()
  const navigate = useNavigate()

  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [selectedChatRoom, setSelectedChatRoom] = useState<any>(null)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [onlineUsers, setOnlineUsers] = useState<any[]>([])
  const [chatNotifications, setChatNotifications] = useState<any[]>([])

  // 권한 확인
  useEffect(() => {
    if (!isAuthenticated || !isAdminUser) {
      navigate('/login')
    }
  }, [isAuthenticated, isAdminUser, navigate])

  // 초기 데이터 로드
  useEffect(() => {
    loadAllData()
  }, [])

  // 채팅방 목록 자동 새로고침
  useEffect(() => {
    const interval = setInterval(loadChatRooms, 5000) // 5초마다
    return () => clearInterval(interval)
  }, [])

  // 선택된 채팅방의 메시지 자동 새로고침
  useEffect(() => {
    if (selectedChatRoom) {
      loadChatMessages(selectedChatRoom.id)
      const interval = setInterval(() => loadChatMessages(selectedChatRoom.id), 2000) // 2초마다
      return () => clearInterval(interval)
    }
  }, [selectedChatRoom])

  const loadAllData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadChatRooms(),
        loadOnlineUsers(),
        loadChatNotifications()
      ])
    } catch (error) {
      console.error('데이터 로드 실패:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadChatRooms = async () => {
    try {
      const rooms = await dataService.entities.chat_rooms.list()
      setChatRooms(rooms || [])
    } catch (error) {
      console.error('채팅방 로드 실패:', error)
    }
  }

  const loadOnlineUsers = async () => {
    try {
      const users = await dataService.entities.user_online_status?.getOnlineUsers() || []
      setOnlineUsers(users)
    } catch (error) {
      console.error('온라인 사용자 로드 실패:', error)
    }
  }

  const loadChatNotifications = async () => {
    try {
      const notifications = await dataService.entities.admin_chat_notifications?.list() || []
      setChatNotifications(notifications)
    } catch (error) {
      console.error('채팅 알림 로드 실패:', error)
    }
  }

  const loadChatMessages = async (roomId: string) => {
    try {
      const conversations = await dataService.entities.chat_conversations.list({
        filter: { chat_room_id: roomId }
      })

      // 모든 대화의 메시지를 하나의 배열로 합치기
      const allMessages: any[] = []

      conversations.forEach(conversation => {
        if (conversation.conversation_data && Array.isArray(conversation.conversation_data)) {
          conversation.conversation_data.forEach((msg: any, msgIndex: number) => {
            const safeId = `msg_${conversation.id}_${msgIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            allMessages.push({
              id: safeId,
              chat_room_id: roomId,
              sender_type: msg.sender_type,
              sender_id: msg.sender_name,
              sender_name: msg.sender_name,
              message: msg.message_text,
              created_at: msg.timestamp
            })
          })
        }
      })

      // 시간순 정렬
      const sortedMessages = allMessages.sort((a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      )

      // 중복 제거
      const uniqueMessages = sortedMessages.reduce((acc: any[], current: any, index: number, array: any[]) => {
        const isDuplicate = array.slice(0, index).some(msg =>
          msg.message === current.message &&
          msg.sender_type === current.sender_type &&
          Math.abs(new Date(msg.created_at).getTime() - new Date(current.created_at).getTime()) < 1000
        )
        if (isDuplicate) {
          const newId = `${current.id}_dup_${index}_${Math.random().toString(36).substr(2, 9)}`
          acc.push({ ...current, id: newId })
        } else {
          acc.push(current)
        }
        return acc
      }, [])

      // 최종 중복 ID 제거
      const finalMessages = uniqueMessages.filter((message, index, array) => {
        return array.findIndex(msg => msg.id === message.id) === index
      })

      setChatMessages(finalMessages)
    } catch (error) {
      console.error('메시지 로드 실패:', error)
    }
  }

  const selectChatRoom = async (room: any) => {
    setSelectedChatRoom(room)
    await loadChatMessages(room.id)

    // 읽음 처리
    try {
      const roomNotifications = chatNotifications.filter(n => n.chat_room_id === room.id && !n.is_read)
      await Promise.all(
        roomNotifications.map(notification =>
          dataService.entities.admin_chat_notifications.update(notification.id, { is_read: true })
        )
      )
      await loadChatNotifications()
    } catch (error) {
      console.error('알림 읽음 처리 실패:', error)
    }
  }

  const sendAdminMessage = async () => {
    if (!chatInput.trim() || !selectedChatRoom) return

    try {
      const now = new Date().toISOString()
      const adminMessageId = `admin_${Date.now()}`

      // 관리자 메시지만 포함된 새로운 대화 생성
      const conversationData = [
        {
          id: adminMessageId,
          sender_type: 'admin',
          sender_name: '관리자',
          message_text: chatInput.trim(),
          timestamp: now
        }
      ]

      await dataService.entities.chat_conversations.create({
        chat_room_id: selectedChatRoom.id,
        conversation_data: conversationData,
        message_count: 1,
        first_message_at: now,
        last_message_at: now,
        created_at: now,
        updated_at: now
      })

      setChatInput('')
      await loadChatMessages(selectedChatRoom.id)
      toast.success('메시지가 전송되었습니다')
    } catch (error) {
      console.error('메시지 전송 실패:', error)
      toast.error('메시지 전송에 실패했습니다')
    }
  }

  const unreadCount = chatNotifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-vintage-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-6 h-6" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">실시간 채팅</h1>
                <p className="text-sm text-gray-600">
                  총 {chatRooms.length}개의 채팅방 | 미읽음 {unreadCount}개
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: 'calc(100vh - 200px)' }}>
          <div className="flex h-full">
            {/* 채팅방 목록 */}
            <div className="w-1/3 border-r border-gray-200 overflow-y-auto">
              <div className="p-4 bg-gray-50 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">채팅방 목록</h3>
              </div>
              <div className="divide-y divide-gray-200">
                {chatRooms.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                    <p>채팅방이 없습니다</p>
                  </div>
                ) : (
                  chatRooms.map((room) => {
                    const hasUnread = chatNotifications.some(
                      n => n.chat_room_id === room.id && !n.is_read
                    )
                    const userStatus = onlineUsers.find(u => u.user_id === room.user_id)
                    const isOnline = userStatus?.is_online

                    return (
                      <div
                        key={room.id}
                        onClick={() => selectChatRoom(room)}
                        className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
                          selectedChatRoom?.id === room.id ? 'bg-blue-50 border-l-4 border-vintage-500' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <UserIcon className="w-5 h-5 text-gray-400" />
                              <div className="font-medium text-gray-900">
                                {room.user_name || '사용자'}
                              </div>
                              <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {room.user_email}
                            </div>
                            {room.last_message_at && (
                              <div className="text-xs text-gray-400 mt-1">
                                {new Date(room.last_message_at).toLocaleString('ko-KR', {
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            )}
                          </div>
                          {hasUnread && (
                            <div className="ml-2">
                              <div className="w-2 h-2 bg-vintage-500 rounded-full"></div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* 채팅 메시지 영역 */}
            <div className="flex-1 flex flex-col">
              {selectedChatRoom ? (
                <>
                  {/* 채팅방 헤더 */}
                  <div className="p-4 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserIcon className="w-8 h-8 text-gray-400" />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {selectedChatRoom.user_name || '사용자'}
                            </h3>
                            {(() => {
                              const userStatus = onlineUsers.find(u => u.user_id === selectedChatRoom.user_id)
                              const isOnline = userStatus?.is_online
                              return (
                                <div className="flex items-center gap-1">
                                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                                  <span className={`text-xs ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                                    {isOnline ? '온라인' : '오프라인'}
                                  </span>
                                </div>
                              )
                            })()}
                          </div>
                          <p className="text-sm text-gray-500">
                            {selectedChatRoom.user_email}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 메시지 영역 */}
                  <div className="flex-1 p-6 overflow-y-auto bg-gray-50">
                    {chatMessages.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <MessageCircle className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                        <p>아직 메시지가 없습니다</p>
                        <p className="text-sm mt-2">첫 메시지를 보내보세요!</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {chatMessages.map((message) => (
                          <div
                            key={message.id}
                            className={`flex ${message.sender_type === 'user' ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-md px-4 py-3 rounded-2xl ${
                                message.sender_type === 'user'
                                  ? 'bg-white shadow-sm'
                                  : 'bg-vintage-500 text-white'
                              }`}
                            >
                              <div className="whitespace-pre-line break-words">
                                {message.message}
                              </div>
                              <div className={`text-xs mt-2 ${
                                message.sender_type === 'user' ? 'text-gray-400' : 'text-vintage-100'
                              }`}>
                                {new Date(message.created_at).toLocaleTimeString('ko-KR', {
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 메시지 입력 영역 */}
                  <div className="p-4 bg-white border-t border-gray-200">
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            sendAdminMessage()
                          }
                        }}
                        placeholder="메시지를 입력하세요..."
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-vintage-500 focus:border-transparent"
                      />
                      <button
                        onClick={sendAdminMessage}
                        disabled={!chatInput.trim()}
                        className="bg-vintage-500 hover:bg-vintage-600 disabled:bg-gray-300 text-white px-6 py-3 rounded-lg transition-colors disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-5 h-5" />
                        <span>전송</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center bg-gray-50">
                  <div className="text-center text-gray-500">
                    <MessageCircle className="w-20 h-20 mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">채팅방을 선택해주세요</p>
                    <p className="text-sm mt-2">왼쪽에서 채팅방을 선택하면 대화를 시작할 수 있습니다</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminChat
