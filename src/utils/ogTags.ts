// Open Graph 태그 동적 설정 유틸리티

interface OGTagOptions {
  title?: string
  description?: string
  image?: string
  url?: string
  type?: string
  siteName?: string
  locale?: string
}

export const setOGTags = (options: OGTagOptions) => {
  const {
    title = '올띵버킷 - 체험단 플랫폼',
    description = '다양한 제품을 무료로 체험하고 리뷰를 작성해보세요. 올띵버킷에서 특별한 체험단 기회를 만나보세요!',
    image = 'https://allthingbucket.com/og-image.jpg',
    url = window.location.href,
    type = 'website',
    siteName = '올띵버킷',
    locale = 'ko_KR'
  } = options

  // 기본 메타 태그들
  const metaTags = [
    { property: 'og:title', content: title },
    { property: 'og:description', content: description },
    { property: 'og:image', content: image },
    { property: 'og:url', content: url },
    { property: 'og:type', content: type },
    { property: 'og:site_name', content: siteName },
    { property: 'og:locale', content: locale },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:image', content: image },
    { name: 'description', content: description }
  ]

  metaTags.forEach(({ property, name, content }) => {
    const selector = property ? `meta[property="${property}"]` : `meta[name="${name}"]`
    let metaElement = document.querySelector(selector) as HTMLMetaElement

    if (!metaElement) {
      metaElement = document.createElement('meta')
      if (property) {
        metaElement.setAttribute('property', property)
      } else if (name) {
        metaElement.setAttribute('name', name)
      }
      document.head.appendChild(metaElement)
    }

    metaElement.setAttribute('content', content)
  })

  // 페이지 제목도 업데이트
  document.title = title
}

// 캠페인 상세 페이지용 OG 태그 설정
export const setCampaignOGTags = (campaign: any) => {
  const campaignName = campaign.campaign_name || campaign.product_name || campaign.title || '체험단'
  const campaignDescription = campaign.description || '특별한 제품 체험 기회를 놓치지 마세요!'
  const campaignImage = campaign.main_images?.[0] || campaign.detail_images?.[0] || 'https://allthingbucket.com/og-image.jpg'
  
  setOGTags({
    title: `${campaignName} - 올띵버킷 체험단`,
    description: campaignDescription,
    image: campaignImage,
    url: `${window.location.origin}/campaign/${campaign.id}`
  })
}

// 홈페이지용 OG 태그 설정
export const setHomeOGTags = () => {
  setOGTags({
    title: '올띵버킷 - 체험단 플랫폼',
    description: '다양한 제품을 무료로 체험하고 리뷰를 작성해보세요. 올띵버킷에서 특별한 체험단 기회를 만나보세요!',
    image: 'https://allthingbucket.com/og-image.jpg',
    url: window.location.origin
  })
}

// 체험단 목록 페이지용 OG 태그 설정
export const setExperiencesOGTags = () => {
  setOGTags({
    title: '체험단 목록 - 올띵버킷',
    description: '현재 진행 중인 다양한 체험단을 확인하고 신청해보세요!',
    image: 'https://allthingbucket.com/og-image.jpg',
    url: `${window.location.origin}/experiences`
  })
}

// 찜목록 페이지용 OG 태그 설정
export const setWishlistOGTags = () => {
  setOGTags({
    title: '찜목록 - 올띵버킷',
    description: '관심 있는 체험단들을 한눈에 확인하세요!',
    image: 'https://allthingbucket.com/og-image.jpg',
    url: `${window.location.origin}/wishlist`
  })
}

// 내 신청 내역 페이지용 OG 태그 설정
export const setMyApplicationsOGTags = () => {
  setOGTags({
    title: '내 신청 내역 - 올띵버킷',
    description: '신청한 체험단의 진행 상황을 확인하세요!',
    image: 'https://allthingbucket.com/og-image.jpg',
    url: `${window.location.origin}/my-applications`
  })
}
