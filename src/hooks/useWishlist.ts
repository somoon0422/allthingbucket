import { useState, useEffect } from 'react'
import { useAuth } from './useAuth'
import { dataService } from '../lib/dataService'
import toast from 'react-hot-toast'

export const useWishlist = () => {
  const { user, isAuthenticated } = useAuth()
  const [wishlist, setWishlist] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [wishlistIds, setWishlistIds] = useState<Set<string>>(new Set())
  const [error, setError] = useState<string | null>(null)

  // 찜목록 로드
  const loadWishlist = async (showError = false) => {
    if (!isAuthenticated || !user?.user_id) {
      setWishlist([])
      setWishlistIds(new Set())
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // dataService.entities.wishlist가 존재하는지 확인
      if (!dataService.entities.wishlist) {
        throw new Error('wishlist 엔티티가 정의되지 않았습니다')
      }
      
      const wishlistData = await dataService.entities.wishlist.list({
        filter: { user_id: user.user_id }
      })
      
      setWishlist(wishlistData || [])
      setWishlistIds(new Set((wishlistData || []).map((item: any) => item.campaign_id)))
    } catch (error) {
      console.error('찜목록 로드 실패:', error)
      setError(error instanceof Error ? error.message : '찜목록 로드 실패')
      if (showError) {
        toast.error('찜목록을 불러오는데 실패했습니다')
      }
    } finally {
      setLoading(false)
    }
  }

  // 찜하기 추가/제거
  const toggleWishlist = async (campaignId: string) => {
    if (!isAuthenticated || !user?.user_id) {
      toast.error('로그인이 필요합니다')
      return false
    }

    try {
      const isWishlisted = wishlistIds.has(campaignId)
      
      if (isWishlisted) {
        // 찜하기 제거
        const wishlistItem = wishlist.find(item => item.campaign_id === campaignId)
        if (wishlistItem) {
          const result = await dataService.entities.wishlist.delete(wishlistItem.id)
          if (result.success) {
            setWishlist(prev => prev.filter(item => item.campaign_id !== campaignId))
            setWishlistIds(prev => {
              const newSet = new Set(prev)
              newSet.delete(campaignId)
              return newSet
            })
          } else {
            throw new Error(result.message || '찜하기 제거 실패')
          }
        }
      } else {
        // 찜하기 추가
        const newWishlistItem = {
          user_id: user.user_id,
          campaign_id: campaignId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
        
        const result = await dataService.entities.wishlist.create(newWishlistItem)
        if (result.success && result.data) {
          setWishlist(prev => [...prev, result.data])
          setWishlistIds(prev => new Set([...prev, campaignId]))
        } else {
          throw new Error(result.message || '찜하기 추가 실패')
        }
      }
      
      return !isWishlisted
    } catch (error) {
      console.error('찜하기 토글 실패:', error)
      toast.error('찜하기 처리에 실패했습니다')
      return false
    }
  }

  // 특정 캠페인이 찜되어 있는지 확인
  const isWishlisted = (campaignId: string) => {
    return wishlistIds.has(campaignId)
  }

  // 찜목록에서 캠페인 정보와 함께 가져오기
  const getWishlistWithCampaigns = async () => {
    if (!isAuthenticated || !user?.user_id) {
      return []
    }

    try {
      setLoading(true)
      const wishlistData = await dataService.entities.wishlist.list({
        filter: { user_id: user.user_id }
      })

      if (!wishlistData || wishlistData.length === 0) {
        return []
      }

      // 각 찜목록 항목에 대해 캠페인 정보 가져오기
      const campaignsWithWishlist = await Promise.all(
        wishlistData.map(async (wishlistItem: any) => {
          try {
            const campaign = await dataService.entities.campaigns.get(wishlistItem.campaign_id)
            return {
              ...wishlistItem,
              campaign: campaign
            }
          } catch (error) {
            console.error(`캠페인 ${wishlistItem.campaign_id} 로드 실패:`, error)
            return {
              ...wishlistItem,
              campaign: null
            }
          }
        })
      )

      // 캠페인 정보가 있는 것만 필터링
      return campaignsWithWishlist.filter(item => item.campaign !== null)
    } catch (error) {
      console.error('찜목록과 캠페인 정보 로드 실패:', error)
      toast.error('찜목록을 불러오는데 실패했습니다')
      return []
    } finally {
      setLoading(false)
    }
  }

  // 찜목록에서 제거
  const removeFromWishlist = async (campaignId: string) => {
    if (!isAuthenticated || !user?.user_id) {
      return false
    }

    try {
      const wishlistItem = wishlist.find(item => item.campaign_id === campaignId)
      if (wishlistItem) {
        await dataService.entities.wishlist.delete(wishlistItem.id)
        setWishlist(prev => prev.filter(item => item.campaign_id !== campaignId))
        setWishlistIds(prev => {
          const newSet = new Set(prev)
          newSet.delete(campaignId)
          return newSet
        })
        toast.success('찜 목록에서 제거되었습니다')
        return true
      }
      return false
    } catch (error) {
      console.error('찜목록 제거 실패:', error)
      toast.error('찜목록에서 제거하는데 실패했습니다')
      return false
    }
  }

  // 초기 로드
  useEffect(() => {
    loadWishlist()
  }, [isAuthenticated, user?.user_id])

  return {
    wishlist,
    wishlistIds,
    loading,
    error,
    loadWishlist,
    toggleWishlist,
    isWishlisted,
    getWishlistWithCampaigns,
    removeFromWishlist
  }
}
