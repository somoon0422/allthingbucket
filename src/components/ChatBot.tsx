import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Phone, Mail } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'

interface ChatMessage {
  id: string
  text: string
  sender: 'user' | 'admin'
  timestamp: Date
  isRead?: boolean
}

const ChatBot: React.FC = () => {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [currentChatRoom, setCurrentChatRoom] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 채팅방 초기화 또는 조회
  useEffect(() => {
    if (user && isOpen) {
      initializeChatRoom()
      // 온라인 상태 설정
      setUserOnline()
    }
  }, [user, isOpen])

  // 컴포넌트 언마운트 시 오프라인 상태 설정
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (user) {
        setUserOffline()
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (user) {
        setUserOffline()
      }
    }
  }, [user])

  // 메시지 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 온라인 상태 관리 함수들
  const setUserOnline = async () => {
    if (!user) return
    try {
      await dataService.entities.user_online_status.setOnline(user.user_id)
    } catch (error) {
      console.warn('⚠️ 온라인 상태 설정 오류 (RLS 정책으로 인한 무시):', error)
    }
  }

  const setUserOffline = async () => {
    if (!user) return
    try {
      await dataService.entities.user_online_status.setOffline(user.user_id)
    } catch (error) {
      console.warn('⚠️ 오프라인 상태 설정 오류 (RLS 정책으로 인한 무시):', error)
    }
  }

  const updateLastSeen = async () => {
    if (!user) return
    try {
      await dataService.entities.user_online_status.updateLastSeen(user.user_id)
    } catch (error) {
      console.error('마지막 접속 시간 업데이트 오류:', error)
    }
  }

  const initializeChatRoom = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // 기존 채팅방 조회
      const existingRooms = await dataService.entities.chat_rooms.list({
        filter: { user_id: user.user_id }
      })

      let chatRoom = existingRooms.find(room => room.status === 'active')

      // 기존 채팅방이 없으면 새로 생성
      if (!chatRoom) {
        chatRoom = await dataService.entities.chat_rooms.create({
          user_id: user.user_id,
          user_name: user.name || user.email || '사용자',
          user_email: user.email,
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      }

      setCurrentChatRoom(chatRoom)

      // 기존 대화 조회
      if (chatRoom) {
        const existingConversations = await dataService.entities.chat_conversations.list({
          filter: { chat_room_id: chatRoom.id }
        })

        // 모든 대화의 메시지를 하나의 배열로 합치기
        const allMessages: ChatMessage[] = []
        
        existingConversations.forEach(conversation => {
          if (conversation.conversation_data && Array.isArray(conversation.conversation_data)) {
            conversation.conversation_data.forEach((msg: any) => {
              allMessages.push({
                id: msg.id,
                text: msg.message_text,
                sender: msg.sender_type as 'user' | 'admin',
                timestamp: new Date(msg.timestamp),
                isRead: true // 기존 메시지는 읽음 처리
              })
            })
          }
        })

        // 시간순으로 정렬
        allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
        setMessages(allMessages)

        // 첫 메시지가 없으면 환영 메시지가 포함된 대화 생성
        if (allMessages.length === 0) {
          const welcomeConversation = await dataService.entities.chat_conversations.create({
            chat_room_id: chatRoom.id,
            conversation_data: [{
              id: 'welcome_msg',
              sender_type: 'admin',
              sender_name: '올띵버킷 고객센터',
              message_text: '안녕하세요! 올띵버킷 고객센터입니다. 무엇을 도와드릴까요? 😊',
              timestamp: new Date().toISOString()
            }],
            message_count: 1,
            first_message_at: new Date().toISOString(),
            last_message_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })

          if (welcomeConversation) {
            setMessages([{
              id: 'welcome_msg',
              text: '안녕하세요! 올띵버킷 고객센터입니다. 무엇을 도와드릴까요? 😊',
              sender: 'admin',
              timestamp: new Date(),
              isRead: true
            }])
          }
        }
      }
    } catch (error) {
      console.error('채팅방 초기화 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !currentChatRoom || !user) return

    try {
      setIsLoading(true)
      
      // 마지막 접속 시간 업데이트
      await updateLastSeen()
      
      const now = new Date().toISOString()
      const userMessageId = `user_${Date.now()}`
      const botMessageId = `bot_${Date.now() + 1}`
      
      // 자동 응답 생성
      const botResponse = getBotResponse(inputMessage)
      
      // 새로운 대화 생성 (사용자 메시지 + 봇 응답을 하나의 JSON으로)
      const conversationData = [
        {
          id: userMessageId,
          sender_type: 'user',
          sender_name: user.name || user.email || '사용자',
          message_text: inputMessage,
          timestamp: now
        },
        {
          id: botMessageId,
          sender_type: 'admin',
          sender_name: '올띵버킷 고객센터',
          message_text: botResponse,
          timestamp: new Date(Date.now() + 1000).toISOString() // 1초 후
        }
      ]

      const newConversation = await dataService.entities.chat_conversations.create({
        chat_room_id: currentChatRoom.id,
        conversation_data: conversationData,
        message_count: 2,
        first_message_at: now,
        last_message_at: new Date(Date.now() + 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

      if (newConversation) {
        // UI에 메시지 추가
        const userMessage: ChatMessage = {
          id: userMessageId,
          text: inputMessage,
          sender: 'user',
          timestamp: new Date(now),
          isRead: true
        }

        const adminMessage: ChatMessage = {
          id: botMessageId,
          text: botResponse,
          sender: 'admin',
          timestamp: new Date(Date.now() + 1000),
          isRead: false
        }

        setMessages(prev => [...prev, userMessage, adminMessage])
        setInputMessage('')
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.')
    } finally {
      setIsLoading(false)
    }
  }

  const getBotResponse = (userMessage: string): string => {
    const message = userMessage.toLowerCase()
    
    if (message.includes('출금') || message.includes('환급')) {
      return "출금 관련 문의는 고객센터로 연락주세요!\n\n📞 전화: 01022129245\n💬 카카오톡: @올띵버킷\n📧 이메일: support@allthingbucket.com\n\n영업일 기준 3~5일 내 처리됩니다."
    }
    
    if (message.includes('포인트') || message.includes('적립')) {
      return "포인트 적립은 체험단 참여 후 리뷰 작성으로 가능합니다.\n\n체험단 신청 → 선정 → 제품 수령 → 리뷰 작성 → 포인트 적립 순서로 진행됩니다."
    }
    
    if (message.includes('체험단') || message.includes('신청')) {
      return "체험단 신청은 홈페이지의 '체험단 신청' 탭에서 가능합니다.\n\n선정되면 개별 연락드리며, 제품 수령 후 리뷰를 작성해주세요."
    }
    
    if (message.includes('계좌') || message.includes('인증')) {
      return "계좌 인증은 출금 요청 시 1원 입금을 통해 진행됩니다.\n\n입금자명을 정확히 확인해주시고, 문제가 있으시면 고객센터로 연락주세요."
    }
    
    return "죄송합니다. 더 자세한 문의는 고객센터로 연락주세요!\n\n📞 전화: 01022129245\n💬 카카오톡: @올띵버킷\n📧 이메일: support@allthingbucket.com"
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* 채팅봇 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-green-500 hover:bg-green-600 text-white rounded-full p-4 shadow-lg transition-all duration-200 z-40"
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {/* 채팅봇 모달 */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-80 h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 flex flex-col">
          {/* 헤더 */}
          <div className="bg-green-500 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">올띵버킷 고객센터</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-white hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* 메시지 영역 */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {isLoading && messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p>채팅방을 불러오는 중...</p>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.sender === 'user'
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <div className="whitespace-pre-line">{message.text}</div>
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-green-100' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString('ko-KR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                      {message.sender === 'admin' && !message.isRead && (
                        <span className="ml-2 text-blue-500">●</span>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* 입력 영역 */}
          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-lg transition-colors disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            
            {/* 빠른 연락처 */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="flex space-x-4 text-xs text-gray-600">
                <a 
                  href="tel:1588-0000" 
                  className="flex items-center space-x-1 hover:text-green-600"
                >
                  <Phone className="w-3 h-3" />
                  <span>1588-0000</span>
                </a>
                <a 
                  href="mailto:support@allthingbucket.com" 
                  className="flex items-center space-x-1 hover:text-green-600"
                >
                  <Mail className="w-3 h-3" />
                  <span>이메일</span>
                </a>
                <a 
                  href="https://pf.kakao.com/_올띵버킷" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-1 hover:text-green-600"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>카카오톡</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot
