import React, { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Mail, Minimize2, Maximize2, RotateCcw, ArrowLeft, Trash2 } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

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
  const [isMinimized, setIsMinimized] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [inputMessage, setInputMessage] = useState('')
  const [currentChatRoom, setCurrentChatRoom] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [showBackButton, setShowBackButton] = useState(false)
  const [chatRooms, setChatRooms] = useState<any[]>([])
  const [showChatList, setShowChatList] = useState(false) // 채팅 리스트 표시 여부
  const [showMainMenu, setShowMainMenu] = useState(true) // 메인 메뉴 표시 여부
  const [selectedRooms, setSelectedRooms] = useState<Set<string>>(new Set()) // 선택된 채팅방 ID들
  const [isDeleteMode, setIsDeleteMode] = useState(false) // 삭제 모드 여부
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 빠른 응답 버튼들
  const quickReplies = [
    { text: '체험단 신청 방법', emoji: '🎯' },
    { text: '포인트 적립 방법', emoji: '💰' },
    { text: '출금 문의', emoji: '💳' },
    { text: '계좌 인증', emoji: '🔐' }
  ]

  // 채팅방 초기화 또는 조회
  useEffect(() => {
    if (user && isOpen) {
      loadChatRooms()
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

  // 채팅방 변경 시 메시지 초기화 (추가 안전장치)
  useEffect(() => {
    if (!currentChatRoom) {
      setMessages([])
      setInputMessage('')
    }
  }, [currentChatRoom])

  // 온라인 상태 관리 함수들 (RLS 정책 오류 해결)
  const setUserOnline = async () => {
    if (!user) return
    // RLS 정책 오류로 인해 온라인 상태 관리 비활성화
  }

  const setUserOffline = async () => {
    if (!user) return
    // RLS 정책 오류로 인해 온라인 상태 관리 비활성화
  }

  const updateLastSeen = async () => {
    if (!user) return
    // RLS 정책 오류로 인해 마지막 접속 시간 업데이트 비활성화
  }

  // 채팅방 목록 로드
  const loadChatRooms = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      console.log('🔍 채팅방 로드 시작 - 사용자 ID:', user.user_id)
      
      // 🔥 필터 없이 모든 채팅방 조회 후 클라이언트에서 필터링
      const allRooms = await dataService.entities.chat_rooms.list()
      
      console.log('🔍 필터 없이 로드된 전체 채팅방:', allRooms)
      console.log('🔍 필터 없이 로드된 채팅방 개수:', allRooms?.length || 0)
      console.log('🔍 현재 시간:', new Date().toISOString())
      
      if (allRooms && allRooms.length > 0) {
        console.log('🔍 각 채팅방 상세 정보:')
        allRooms.forEach((room: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${room.id}, User ID: ${room.user_id}, Created: ${room.created_at}`)
        })
      }
      
      // 실제 해당 사용자의 채팅방만 필터링 (추가 안전장치)
      const userChatRooms = (allRooms || []).filter((room: any) => 
        room.user_id === user.user_id
      )
      
      console.log('🔍 사용자 필터링 후 채팅방:', userChatRooms)
      console.log('🔍 필터링 후 개수:', userChatRooms.length)
      
      if (userChatRooms.length > 0) {
        console.log('🔍 필터링된 각 채팅방 상세 정보:')
        userChatRooms.forEach((room: any, index: number) => {
          console.log(`  ${index + 1}. ID: ${room.id}, User ID: ${room.user_id}, Created: ${room.created_at}`)
        })
      }

      // 각 채팅방의 마지막 메시지 정보 추가
      const roomsWithLastMessage = await Promise.all(
        userChatRooms.map(async (room: any) => {
          try {
            const conversations = await dataService.entities.chat_conversations.list()
            
            // 클라이언트에서 해당 채팅방의 대화만 필터링
            const roomConversations = conversations.filter((conv: any) => 
              conv.chat_room_id === room.id
            )
            
            let lastMessage = ''
            let lastMessageTime = room.created_at
            
            if (roomConversations.length > 0) {
              // 가장 최근 대화 찾기
              const latestConversation = roomConversations.sort((a: any, b: any) => 
                new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime()
              )[0]
              
              if (latestConversation.conversation_data && latestConversation.conversation_data.length > 0) {
                const lastMsg = latestConversation.conversation_data[latestConversation.conversation_data.length - 1]
                lastMessage = lastMsg.message_text
                lastMessageTime = lastMsg.timestamp
              }
            }
            
            return {
              ...room,
              lastMessage: lastMessage || '새 채팅',
              lastMessageTime
            }
          } catch (error) {
            console.error('채팅방 정보 로드 오류:', error)
            return {
              ...room,
              lastMessage: '새 채팅',
              lastMessageTime: room.created_at
            }
          }
        })
      )

      console.log('🔍 메시지 정보 추가 후 채팅방:', roomsWithLastMessage)
      console.log('🔍 메시지 정보 추가 후 개수:', roomsWithLastMessage.length)
      
      // 🔍 각 채팅방의 ID를 상세히 확인
      console.log('🔍 각 채팅방 ID 목록:')
      roomsWithLastMessage.forEach((room, index) => {
        console.log(`  ${index + 1}. ID: ${room.id}, Created: ${room.created_at}, Status: ${room.status}`)
      })
      
      // 🔥 중복 제거 로직 개선 - ID와 생성시간을 함께 고려
      const uniqueRooms = roomsWithLastMessage.filter((room, index, self) => {
        // ID가 같아도 생성시간이 다르면 다른 채팅방으로 간주
        const isUnique = index === self.findIndex(r => 
          r.id === room.id && r.created_at === room.created_at
        )
        if (!isUnique) {
          console.log(`🔍 중복 제거됨: ID ${room.id}, Created: ${room.created_at} (인덱스 ${index})`)
        }
        return isUnique
      })
      
      console.log('🔍 중복 제거 후 채팅방:', uniqueRooms)
      console.log('🔍 중복 제거 후 개수:', uniqueRooms.length)
      
      // 최신 메시지 순으로 정렬
      uniqueRooms.sort((a, b) => 
        new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime()
      )

      console.log('🔍 최종 정렬 후 채팅방:', uniqueRooms)
      console.log('🔍 최종 채팅방 개수:', uniqueRooms.length)

      setChatRooms(uniqueRooms)
    } catch (error) {
      console.error('채팅방 목록 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMessage = async (messageText?: string) => {
    const messageToSend = messageText || inputMessage
    if (!messageToSend.trim() || !currentChatRoom || !user) return

    console.log('🔍 메시지 전송 시작:', {
      message: messageToSend,
      chatRoomId: currentChatRoom.id,
      userId: user.user_id
    })

    try {
      setIsLoading(true)
      setIsTyping(true)
      
      // 마지막 접속 시간 업데이트
      await updateLastSeen()
      
      const now = new Date().toISOString()
      const userMessageId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const botMessageId = `bot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      // 자동 응답 생성
      const botResponse = getBotResponse(messageToSend)
      
      // 새로운 대화 생성 (사용자 메시지 + 봇 응답을 하나의 JSON으로)
      const conversationData = [
        {
          id: userMessageId,
          sender_type: 'user',
          sender_name: user.name || user.email || '사용자',
          message_text: messageToSend,
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

      console.log('🔍 대화 데이터 생성:', {
        chatRoomId: currentChatRoom.id,
        conversationData: conversationData
      })

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
          text: messageToSend,
          sender: 'user',
          timestamp: new Date(now),
          isRead: true
        }

        setMessages(prev => [...prev, userMessage])
        setInputMessage('')
        setShowBackButton(true) // 메시지 전송 후 뒤로가기 버튼 표시
        setShowMainMenu(false) // 메인 메뉴 숨기기
        
        // 타이핑 효과를 위한 지연
        setTimeout(() => {
          setIsTyping(false)
        const adminMessage: ChatMessage = {
          id: botMessageId,
          text: botResponse,
          sender: 'admin',
          timestamp: new Date(Date.now() + 1000),
          isRead: false
        }
          setMessages(prev => [...prev, adminMessage])
        }, 1500)
      }
    } catch (error) {
      console.error('메시지 전송 오류:', error)
      alert('메시지 전송에 실패했습니다. 다시 시도해주세요.')
      setIsTyping(false)
    } finally {
      setIsLoading(false)
    }
  }

  // 채팅 종료 함수
  const handleCloseChat = async () => {
    // 오프라인 상태 설정
    await setUserOffline()
    
    // 상태 초기화
    setMessages([])
    setCurrentChatRoom(null)
    setIsOpen(false)
    setIsMinimized(false)
    setShowBackButton(false)
    setShowChatList(false)
    setShowMainMenu(true)
    setChatRooms([])
  }

  // 채팅 초기화 함수 (새 채팅 시작)
  const handleResetChat = async () => {
    await startNewChat()
  }

  // 뒤로가기 함수 (메인 메뉴로 돌아가기)
  const handleGoBack = () => {
    setMessages([])
    setCurrentChatRoom(null)
    setShowBackButton(false)
    setShowChatList(false)
    setShowMainMenu(true) // 메인 메뉴 표시
    setInputMessage('')
  }

  // 이전 채팅 보기
  const showPreviousChats = () => {
    // 기존 메시지 초기화
    setMessages([])
    setInputMessage('')
    setCurrentChatRoom(null)
    
    setShowMainMenu(false)
    setShowChatList(true)
    setShowBackButton(true)
  }

  // 채팅방 선택 함수
  const selectChatRoom = async (room: any) => {
    // 기존 메시지 초기화
    setMessages([])
    setInputMessage('')
    
    setCurrentChatRoom(room)
    setShowChatList(false)
    setShowMainMenu(false)
    setShowBackButton(true)
    
    // 선택된 채팅방의 메시지 로드
    await loadChatRoomMessages(room.id)
  }

  // 새 채팅 시작 함수
  const startNewChat = async () => {
    console.log('🔄 새 채팅 시작 함수 호출됨')
    
    // 기존 상태 완전 초기화
    setMessages([])
    setCurrentChatRoom(null)
    setInputMessage('')
    
    // UI 상태 설정
    setShowMainMenu(false)
    setShowChatList(false)
    setShowBackButton(true)
    
    // 새 채팅방 생성
    await createNewChatRoom()
  }

  // 새 채팅방 생성
  const createNewChatRoom = async () => {
    if (!user) return

    try {
      setIsLoading(true)
      
      console.log('🔄 새 채팅방 생성 시작 - 사용자:', user.user_id)
      
      // 🔍 생성 전 채팅방 목록 상태 확인
      console.log('🔍 생성 전 현재 채팅방 목록 개수:', chatRooms.length)
      console.log('🔍 생성 전 현재 채팅방 목록:', chatRooms.map(r => ({ id: r.id, created_at: r.created_at })))
      
      // 기존 채팅방 상태 완전 초기화
      setCurrentChatRoom(null)
      setMessages([])
      
      // 🔥 완전히 새로운 채팅방 생성 (기존 채팅방과 완전히 분리)
      // 🔥 강제로 새로운 채팅방 생성 (기존 채팅방 재사용 방지)
      const chatRoomData = {
        user_id: user.user_id,
        user_name: user.name || user.email || '사용자',
        user_email: user.email,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('🚀 새 채팅방 생성 데이터:', chatRoomData)
      console.log('🚀 기존 채팅방과 완전히 분리된 새로운 채팅방을 생성합니다')
      
      const newChatRoom = await dataService.entities.chat_rooms.create(chatRoomData)
      
      console.log('🚀 새 채팅방 생성 요청 완료 - 기존 채팅방과 완전히 분리된 새로운 채팅방 생성')
      console.log('🔍 생성된 채팅방 결과:', newChatRoom)
      console.log('🔍 생성된 채팅방 ID:', newChatRoom?.id)
      console.log('🔍 생성된 채팅방 생성시간:', newChatRoom?.created_at)
      
      console.log('🔍 생성된 채팅방 상세 정보:', {
        id: newChatRoom?.id,
        user_id: newChatRoom?.user_id,
        created_at: newChatRoom?.created_at,
        fullObject: newChatRoom
      })
      
      console.log('✅ 새 채팅방 생성 완료:', newChatRoom)

      // 채팅방 생성 실패 체크
      if (!newChatRoom || !newChatRoom.id) {
        throw new Error('채팅방 생성에 실패했습니다.')
      }

      // 새 채팅방 설정
      setCurrentChatRoom(newChatRoom)
      console.log('🔍 새 채팅방 설정 완료:', newChatRoom.id)

      // 환영 메시지 생성 (더 고유한 ID 사용)
      const welcomeMessageId = `welcome_${newChatRoom.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const welcomeConversation = await dataService.entities.chat_conversations.create({
        chat_room_id: newChatRoom.id,
        conversation_data: [{
          id: welcomeMessageId,
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
        // 환영 메시지만 포함된 새로운 메시지 배열 설정
        const welcomeMessage = {
          id: welcomeMessageId,
          text: '안녕하세요! 올띵버킷 고객센터입니다. 무엇을 도와드릴까요? 😊',
          sender: 'admin' as const,
          timestamp: new Date(),
          isRead: true
        }
        
        console.log('✅ 새 채팅방 환영 메시지 설정:', welcomeMessage)
        
        // 메시지 상태를 완전히 초기화하고 환영 메시지만 설정
        setMessages([])
        
        // 🔥 채팅방 목록 새로고침 (새 채팅방이 목록에 나타나도록)
        console.log('🔄 채팅방 목록 새로고침 시작...')
        await loadChatRooms()
        
        // 🔥 환영 메시지를 즉시 설정 (새 채팅방임을 명확히 표시)
        setMessages([welcomeMessage])
        
        // 🔥 새 채팅방이 목록에 추가되었는지 확인 (더 긴 딜레이로 확실하게)
        setTimeout(async () => {
          console.log('🔄 채팅방 목록 재로드하여 새 채팅방 확인...')
          
          // 🔥 채팅방 목록을 다시 로드하고 결과를 직접 확인
          try {
            const allRooms = await dataService.entities.chat_rooms.list()
            
            const userChatRooms = (allRooms || []).filter((room: any) => 
              room.user_id === user.user_id
            )
            
            console.log('🔍 createNewChatRoom에서 로드된 전체 채팅방:', allRooms)
            console.log('🔍 createNewChatRoom에서 필터링된 채팅방:', userChatRooms)
            
            console.log('🔍 직접 로드한 채팅방 목록 개수:', userChatRooms.length)
            console.log('🔍 직접 로드한 채팅방 목록:', userChatRooms.map(r => ({ id: r.id, created_at: r.created_at })))
            console.log('🔍 새로 생성된 채팅방 ID:', newChatRoom.id)
            
            // 새 채팅방이 목록에 있는지 확인
            const isNewRoomInList = userChatRooms.some(room => room.id === newChatRoom.id)
            console.log('🔍 새 채팅방이 목록에 있는지:', isNewRoomInList)
            
            if (isNewRoomInList) {
              console.log('✅ 새 채팅방이 성공적으로 목록에 추가되었습니다!')
            } else {
              console.log('❌ 새 채팅방이 목록에 없습니다. 다시 로드 시도...')
              await loadChatRooms()
            }
            
          } catch (error) {
            console.error('❌ 채팅방 목록 확인 중 오류:', error)
          }
          
          console.log('✅ 새 채팅방 생성 및 설정 완료:', newChatRoom.id)
          console.log('🎉 새 채팅방이 성공적으로 생성되었습니다!')
          
        }, 500) // 딜레이를 500ms로 증가
      }
    } catch (error) {
      console.error('새 채팅방 생성 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // 채팅방 메시지 로드
  const loadChatRoomMessages = async (chatRoomId: string) => {
    try {
      setIsLoading(true)
      
      // 먼저 메시지를 완전히 초기화
      setMessages([])
      
      const existingConversations = await dataService.entities.chat_conversations.list({
        filter: { chat_room_id: chatRoomId }
      })

      // 모든 대화의 메시지를 하나의 배열로 합치기
      const allMessages: ChatMessage[] = []
      
      existingConversations.forEach(conversation => {
        if (conversation.conversation_data && Array.isArray(conversation.conversation_data)) {
          conversation.conversation_data.forEach((msg: any, msgIndex: number) => {
            // 모든 메시지 ID를 강제로 고유하게 생성 (기존 ID 무시)
            const safeId = `msg_${conversation.id}_${msgIndex}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            allMessages.push({
              id: safeId,
              text: msg.message_text,
              sender: msg.sender_type as 'user' | 'admin',
              timestamp: new Date(msg.timestamp),
              isRead: true
            })
          })
        }
      })

      // 시간순으로 정렬
      allMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
      
      // 중복 ID 제거 및 최종 안전장치
      const uniqueMessages = allMessages.reduce((acc: ChatMessage[], current: ChatMessage, index: number) => {
        // ID가 여전히 중복되는 경우를 대비해 인덱스 추가
        const existingIndex = acc.findIndex(msg => msg.id === current.id)
        if (existingIndex >= 0) {
          // 중복된 ID가 있으면 새로운 고유 ID로 변경
          const newId = `${current.id}_dup_${index}_${Math.random().toString(36).substr(2, 9)}`
          acc.push({ ...current, id: newId })
        } else {
          acc.push(current)
        }
        return acc
      }, [])
      
      console.log('🔍 로드된 메시지:', uniqueMessages.length, '개')
      
      // 메시지를 설정하기 전에 약간의 지연을 두어 완전한 초기화 보장
      setTimeout(() => {
        // 최종 안전장치: 메시지 배열에서 중복 ID 제거
        const finalMessages = uniqueMessages.filter((message, index, array) => {
          return array.findIndex(msg => msg.id === message.id) === index
        })
        
        console.log('🔍 최종 메시지:', finalMessages.length, '개 (중복 제거 후)')
        setMessages(finalMessages)
      }, 50)
    } catch (error) {
      console.error('채팅방 메시지 로드 오류:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getBotResponse = (_userMessage: string): string => {
    // 🔥 모든 메시지에 대해 동일한 자동응답 제공
    return "안녕하세요! 올띵버킷 고객센터입니다.\n\n문의해주신 내용을 확인했습니다. 담당자가 채팅을 확인한 후 연락드리겠습니다.\n\n평일 기준 24시간 내, 주말 및 공휴일 기준 48시간 내에 답변드리겠습니다.\n\n감사합니다! 😊"
  }

  // 채팅방 삭제 함수
  const deleteChatRoom = async (roomId: string) => {
    if (!confirm('정말로 이 채팅방을 삭제하시겠습니까?')) return

    try {
      console.log('🗑️ 채팅방 삭제 시작:', roomId)
      
      // 1. 해당 채팅방의 모든 대화 삭제
      const conversations = await dataService.entities.chat_conversations.list()
      const roomConversations = conversations.filter((conv: any) => conv.chat_room_id === roomId)
      
      for (const conversation of roomConversations) {
        await dataService.entities.chat_conversations.delete(conversation.id)
        console.log('🗑️ 대화 삭제 완료:', conversation.id)
      }
      
      // 2. 채팅방 삭제
      await dataService.entities.chat_rooms.delete(roomId)
      console.log('🗑️ 채팅방 삭제 완료:', roomId)
      
      // 3. 현재 채팅방이 삭제된 채팅방이면 초기화
      if (currentChatRoom && currentChatRoom.id === roomId) {
        setCurrentChatRoom(null)
        setMessages([])
        setInputMessage('')
        setShowBackButton(false)
        setShowMainMenu(true)
        setShowChatList(false)
      }
      
      // 4. 채팅방 목록 새로고침
      await loadChatRooms()
      
      toast.success('채팅방이 삭제되었습니다.')
    } catch (error) {
      console.error('채팅방 삭제 실패:', error)
      toast.error('채팅방 삭제에 실패했습니다.')
    }
  }

  // 체크박스 선택/해제 함수
  const toggleRoomSelection = (roomId: string) => {
    setSelectedRooms(prev => {
      const newSet = new Set(prev)
      if (newSet.has(roomId)) {
        newSet.delete(roomId)
      } else {
        newSet.add(roomId)
      }
      return newSet
    })
  }

  // 전체 선택/해제 함수
  const toggleAllSelection = () => {
    if (selectedRooms.size === chatRooms.length) {
      // 전체 해제
      setSelectedRooms(new Set())
    } else {
      // 전체 선택
      setSelectedRooms(new Set(chatRooms.map(room => room.id)))
    }
  }

  // 일괄 삭제 함수
  const bulkDeleteRooms = async () => {
    if (selectedRooms.size === 0) {
      toast.error('삭제할 채팅방을 선택해주세요.')
      return
    }

    if (!confirm(`정말로 선택된 ${selectedRooms.size}개의 채팅방을 삭제하시겠습니까?`)) return

    try {
      console.log('🗑️ 일괄 삭제 시작:', Array.from(selectedRooms))
      
      let successCount = 0
      let failCount = 0

      for (const roomId of selectedRooms) {
        try {
          // 1. 해당 채팅방의 모든 대화 삭제
          const conversations = await dataService.entities.chat_conversations.list()
          const roomConversations = conversations.filter((conv: any) => conv.chat_room_id === roomId)
          
          for (const conversation of roomConversations) {
            await dataService.entities.chat_conversations.delete(conversation.id)
          }
          
          // 2. 채팅방 삭제
          await dataService.entities.chat_rooms.delete(roomId)
          console.log('🗑️ 채팅방 삭제 완료:', roomId)
          successCount++
        } catch (error) {
          console.error('채팅방 삭제 실패:', roomId, error)
          failCount++
        }
      }

      // 3. 현재 채팅방이 삭제된 채팅방 중 하나라면 초기화
      if (currentChatRoom && selectedRooms.has(currentChatRoom.id)) {
        setCurrentChatRoom(null)
        setMessages([])
        setInputMessage('')
        setShowBackButton(false)
        setShowMainMenu(true)
        setShowChatList(false)
      }

      // 4. 선택 초기화 및 삭제 모드 해제
      setSelectedRooms(new Set())
      setIsDeleteMode(false)

      // 5. 채팅방 목록 새로고침
      await loadChatRooms()

      if (failCount === 0) {
        toast.success(`${successCount}개의 채팅방이 삭제되었습니다.`)
      } else {
        toast.error(`${successCount}개 삭제 성공, ${failCount}개 삭제 실패`)
      }
    } catch (error) {
      console.error('일괄 삭제 실패:', error)
      toast.error('일괄 삭제 중 오류가 발생했습니다.')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  // 카카오 채널 채팅 함수
  const handleKakaoChannelChat = () => {
    try {
      // 카카오 SDK가 로드되어 있는지 확인
      if (typeof window !== 'undefined' && (window as any).Kakao) {
        const Kakao = (window as any).Kakao
        
        // 카카오 로그인 상태 확인 후 채널 채팅 열기
        if (Kakao.Auth.getAccessToken()) {
          // 이미 로그인된 경우 바로 채팅 열기
          Kakao.Channel.chat({
            channelPublicId: '_NrAxmn' // 올띵버킷 카카오톡 채널 ID
          })
        } else {
          // 로그인이 필요한 경우 로그인 후 채팅 열기
          Kakao.Auth.login({
            success: function() {
              Kakao.Channel.chat({
                channelPublicId: '_NrAxmn'
              })
            },
            fail: function(error: any) {
              console.error('카카오 로그인 실패:', error)
              // 로그인 실패 시 직접 링크로 이동
              window.open('http://pf.kakao.com/_NrAxmn', '_blank', 'noopener,noreferrer')
            }
          })
        }
      } else {
        // SDK가 없으면 직접 링크로 이동
        window.open('http://pf.kakao.com/_NrAxmn', '_blank', 'noopener,noreferrer')
      }
    } catch (error) {
      console.error('카카오 채널 채팅 오류:', error)
      // 오류 발생 시 직접 링크로 이동
      window.open('http://pf.kakao.com/_NrAxmn', '_blank', 'noopener,noreferrer')
    }
  }

  // 카카오 채널 채팅 함수를 전역으로 export
  if (typeof window !== 'undefined') {
    (window as any).handleKakaoChannelChat = handleKakaoChannelChat
  }

  return (
    <>
      {/* 채팅봇 버튼 */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full p-4 shadow-lg transition-all duration-300 z-40 hover:scale-110 group"
        >
          <MessageCircle className="w-6 h-6 group-hover:animate-pulse" />
          {/* 알림 점 */}
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
        </button>
      )}

      {/* 채팅봇 모달 */}
      {isOpen && (
        <div className={`fixed bottom-6 right-6 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 flex flex-col transition-all duration-300 ${
          isMinimized ? 'w-96 h-16' : 'w-96 h-[500px]'
        }`}>
          {/* 헤더 */}
          <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-2xl flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {showBackButton && (
                <button
                  onClick={handleGoBack}
                  className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-white hover:text-white mr-2"
                  title="채팅 목록으로"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              <div className="w-3 h-3 bg-green-300 rounded-full animate-pulse"></div>
              <MessageCircle className="w-5 h-5" />
              <span className="font-medium">올띵버킷 고객센터</span>
            </div>
            <div className="flex items-center space-x-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-white hover:text-white"
                title={isMinimized ? '최대화' : '최소화'}
              >
                {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
              </button>
              <button
                onClick={handleResetChat}
                className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-all duration-200 text-white hover:text-white"
                title="새 채팅 시작"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            <button
                onClick={handleCloseChat}
                className="p-1.5 bg-white/20 hover:bg-red-500/80 rounded-lg transition-all duration-200 text-white hover:text-white"
                title="채팅 종료"
            >
                <X className="w-4 h-4" />
            </button>
            </div>
          </div>

          {/* 메인 메뉴, 채팅 리스트 또는 메시지 영역 */}
          {!isMinimized && (
            <div className="flex-1 overflow-y-auto bg-gray-50">
              {showMainMenu ? (
                // 메인 메뉴 표시
                <div className="p-6">
                  <div className="space-y-4">
                    {/* 환영 메시지 */}
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">무엇을 도와드릴까요?</h3>
                      <p className="text-sm text-gray-600">아래 주제를 선택하거나 직접 채팅을 시작하세요</p>
                    </div>
                    
                    {/* 빠른 문의 버튼들 */}
                    <div className="space-y-3">
                      <p className="text-xs text-gray-600 font-medium">빠른 문의</p>
                      <div className="grid grid-cols-2 gap-2">
                        {quickReplies.map((reply, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              startNewChat()
                              setTimeout(() => {
                                handleSendMessage(reply.text)
                              }, 800)
                            }}
                            className="flex items-center space-x-2 p-3 bg-transparent border-2 border-green-600 rounded-lg text-sm text-green-900 font-semibold hover:bg-green-100 hover:border-green-700 hover:text-green-950 transition-all duration-200 shadow-sm"
                          >
                            <span className="text-lg">{reply.emoji}</span>
                            <span>{reply.text}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 채팅 시작하기 */}
                    <div className="space-y-2">
                      <button
                        onClick={startNewChat}
                        className="w-full p-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center space-x-2 font-medium"
                      >
                        <MessageCircle className="w-5 h-5" />
                        <span>새 채팅 시작하기</span>
                      </button>
                      
                      {/* 이전 채팅 버튼 */}
                      {chatRooms.length > 0 && (
                        <button
                          onClick={showPreviousChats}
                          className="w-full p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                        >
                          이전 채팅 보기 ({chatRooms.length}개)
                        </button>
                      )}
                    </div>

                    {/* 연락처 버튼들 */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs text-gray-500 font-medium mb-3 text-center">다른 방법으로 문의하기</p>
                      <div className="grid grid-cols-2 gap-2">
                        {/* 이메일 문의 */}
                        <a 
                          href="mailto:support@allthingbucket.com" 
                          className="flex items-center justify-center space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 font-medium hover:bg-blue-100 hover:border-blue-300 transition-all duration-200"
                          title="이메일 문의"
                        >
                          <Mail className="w-4 h-4" />
                          <span>이메일</span>
                        </a>
                        
                        {/* 카카오톡 문의 */}
                        <button
                          onClick={() => handleKakaoChannelChat()}
                          className="flex items-center justify-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700 font-medium hover:bg-yellow-100 hover:border-yellow-300 transition-all duration-200"
                          title="올띵버킷 카카오톡 채널 채팅"
                        >
                          <MessageCircle className="w-4 h-4" />
                          <span>카카오톡</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : showChatList ? (
                // 채팅 리스트 표시
                <div className="p-4">
                  <div className="space-y-2">
                    {/* 채팅방 목록 */}
                    {isLoading ? (
                      <div className="text-center py-8 text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                        <p>채팅 목록을 불러오는 중...</p>
                      </div>
                    ) : chatRooms.length > 0 ? (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-medium text-gray-900">이전 채팅</p>
                          <div className="flex items-center space-x-2">
                            {isDeleteMode && (
                              <>
                                <button
                                  onClick={toggleAllSelection}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  {selectedRooms.size === chatRooms.length ? '전체 해제' : '전체 선택'}
                                </button>
                                <button
                                  onClick={bulkDeleteRooms}
                                  disabled={selectedRooms.size === 0}
                                  className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                                >
                                  삭제 ({selectedRooms.size})
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => setIsDeleteMode(!isDeleteMode)}
                              className={`text-xs px-2 py-1 rounded ${
                                isDeleteMode 
                                  ? 'bg-gray-500 text-white hover:bg-gray-600' 
                                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                              }`}
                            >
                              {isDeleteMode ? '완료' : '선택'}
                            </button>
                          </div>
                        </div>
                        {chatRooms.map((room) => (
                          <div
                            key={room.id}
                            className="w-full p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2 flex-1">
                                {isDeleteMode && (
                                  <input
                                    type="checkbox"
                                    checked={selectedRooms.has(room.id)}
                                    onChange={() => toggleRoomSelection(room.id)}
                                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500"
                                  />
                                )}
                                <button
                                  onClick={() => !isDeleteMode && selectChatRoom(room)}
                                  className="flex-1 text-left"
                                  disabled={isDeleteMode}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="text-sm font-medium text-gray-900">
                                        {room.created_at ? 
                                          `채팅방 ${new Date(room.created_at).toLocaleDateString()}` : 
                                          `채팅방 ${room.id.slice(-8)}`
                                        }
                                      </p>
                                      <p className="text-xs text-gray-600 truncate mt-1">
                                        {room.lastMessage.length > 40 
                                          ? room.lastMessage.substring(0, 40) + '...' 
                                          : room.lastMessage
                                        }
                                      </p>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(room.lastMessageTime).toLocaleDateString('ko-KR', {
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </div>
                                  </div>
                                </button>
                              </div>
                              {!isDeleteMode && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteChatRoom(room.id)
                                  }}
                                  className="ml-2 p-1 text-gray-400 hover:text-red-500 transition-colors"
                                  title="채팅방 삭제"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">이전 채팅이 없습니다</p>
                        <p className="text-xs">새 채팅을 시작해보세요!</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                // 메시지 영역 표시
                <div className="p-4 space-y-3">
            {isLoading && messages.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto mb-2"></div>
                <p>채팅방을 불러오는 중...</p>
              </div>
            ) : (
                    <>
                      {messages.map((message) => (
                <div
                  key={message.id}
                          className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'} animate-fadeIn`}
                >
                  <div
                            className={`max-w-xs px-4 py-3 rounded-2xl text-sm shadow-sm ${
                      message.sender === 'user'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 text-white rounded-br-md'
                                : 'bg-white text-gray-800 border border-gray-200 rounded-bl-md'
                    }`}
                  >
                            <div className="whitespace-pre-line leading-relaxed">{message.text}</div>
                            <div className={`text-xs mt-2 ${
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
                      ))}
                      
                      {/* 타이핑 인디케이터 */}
                      {isTyping && (
                        <div className="flex justify-start animate-fadeIn">
                          <div className="bg-white text-gray-800 border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                            <div className="flex items-center space-x-1">
                              <div className="flex space-x-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                              </div>
                              <span className="text-xs text-gray-500 ml-2">상담원이 입력 중...</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
            )}
            <div ref={messagesEndRef} />
          </div>
              )}
            </div>
          )}


          {/* 입력 영역 */}
          {!isMinimized && !showChatList && !showMainMenu && (
            <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="메시지를 입력하세요..."
                disabled={isLoading}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm disabled:bg-gray-100 disabled:cursor-not-allowed transition-all duration-200"
              />
              <button
                  onClick={() => handleSendMessage()}
                disabled={!inputMessage.trim() || isLoading}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 disabled:from-gray-300 disabled:to-gray-400 text-white px-4 py-3 rounded-full transition-all duration-200 disabled:cursor-not-allowed hover:scale-105"
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
                <div className="flex justify-center space-x-6 text-xs text-gray-600">
                <a 
                  href="mailto:support@allthingbucket.com" 
                    className="flex items-center space-x-1 hover:text-green-600 transition-colors"
                  title="이메일 문의"
                >
                  <Mail className="w-3 h-3" />
                  <span>이메일</span>
                </a>
                <button
                  onClick={() => handleKakaoChannelChat()}
                  className="flex items-center space-x-1 hover:text-green-600 transition-colors"
                  title="올띵버킷 카카오톡 채널 채팅"
                >
                  <MessageCircle className="w-3 h-3" />
                  <span>카카오톡</span>
                </button>
              </div>
            </div>
          </div>
          )}
        </div>
      )}
    </>
  )
}

export default ChatBot