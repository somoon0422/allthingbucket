
import { useState, useCallback } from 'react'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

interface Notification {
  _id: string
  user_id: string
  title: string
  message: string
  type: string
  read: boolean
  created_at: string
}

// ✅ TSX 호환 안전한 배열 보장 함수
function ensureArray(value: any): any[] {
  if (value === null || value === undefined) {
    return []
  }
  
  if (Array.isArray(value)) {
    return value
  }
  
  if (typeof value === 'object' && value !== null) {
    const arrayKeys = ['list', 'data', 'items', 'results', 'notifications']
    
    for (const key of arrayKeys) {
      if (value[key] && Array.isArray(value[key])) {
        return value[key]
      }
    }
    
    return []
  }
  
  return []
}

// ✅ TSX 호환 안전한 필터링 함수
function safeFilter(array: any, predicate: (item: any) => boolean): any[] {
  const safeArray = ensureArray(array)
  
  if (safeArray.length === 0) {
    return []
  }
  
  try {
    const filtered = safeArray.filter((item: any) => {
      if (item === null || item === undefined) {
        return false
      }
      return predicate(item)
    })
    
    return filtered
  } catch (error) {
    console.error('필터링 실패:', error)
    return []
  }
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)

  const fetchNotifications = useCallback(async (userId: string) => {
    try {
      setLoading(true)
      console.log('📡 알림 조회 시작:', userId)
      
      const response = await dataService.entities.notifications.list({
        filter: { user_id: userId },
        sort: { created_at: -1 }
      })
      
      const notificationList = ensureArray(response)
      const userNotifications = safeFilter(notificationList, (notification: any) => 
        notification && notification.user_id === userId
      )
      
      setNotifications(userNotifications)
      console.log('✅ 알림 조회 완료:', userNotifications.length, '건')
      
      return userNotifications
    } catch (error) {
      console.error('❌ 알림 조회 실패:', error)
      setNotifications([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await dataService.entities.notifications.update(notificationId, {
        read: true,
        read_at: new Date().toISOString()
      })
      
      setNotifications(prev => prev.map(notification => 
        notification._id === notificationId 
          ? { ...notification, read: true }
          : notification
      ))
      
      console.log('✅ 알림 읽음 처리:', notificationId)
    } catch (error) {
      console.error('❌ 알림 읽음 처리 실패:', error)
      toast.error('알림 처리에 실패했습니다')
    }
  }, [])

  const createNotification = useCallback(async (notificationData: {
    user_id: string
    title: string
    message: string
    type: string
  }) => {
    try {
      const notification = await dataService.entities.notifications.create({
        ...notificationData,
        read: false,
        created_at: new Date().toISOString()
      })
      
      console.log('✅ 알림 생성 완료:', notification)
      return notification
    } catch (error) {
      console.error('❌ 알림 생성 실패:', error)
      throw error
    }
  }, [])

  const getUnreadCount = useCallback(() => {
    return notifications.filter(notification => !notification.read).length
  }, [notifications])

  return {
    notifications,
    loading,
    fetchNotifications,
    markAsRead,
    createNotification,
    getUnreadCount
  }
}
