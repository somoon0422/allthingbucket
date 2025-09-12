# Open Graph 이미지 생성 가이드

카카오톡 링크 공유 시 표시될 미리보기 이미지를 생성하는 가이드입니다.

## 📋 필수 요구사항

### 이미지 규격
- **크기**: 1200x630px (권장) 또는 최소 200x200px
- **비율**: 1.91:1 (가로형)
- **파일 형식**: JPG, PNG
- **파일 용량**: 1MB 이하

### 디자인 요소
- **브랜드 로고**: 올띵버킷 로고 포함
- **제목**: "올띵버킷 - 체험단 플랫폼"
- **부제목**: "무료 제품 체험의 기회"
- **색상**: 브랜드 컬러 사용
- **폰트**: 가독성 좋은 폰트 사용

## 🎨 디자인 예시

```
┌─────────────────────────────────────────────────────────┐
│  [올띵버킷 로고]                    올띵버킷 - 체험단 플랫폼  │
│                                                         │
│              무료 제품 체험의 기회                        │
│                                                         │
│        다양한 제품을 체험하고 리뷰를 작성해보세요!        │
│                                                         │
│                    [제품 이미지들]                       │
└─────────────────────────────────────────────────────────┘
```

## 🛠️ 생성 방법

### 1. 온라인 도구 사용
- **Canva**: https://canva.com
- **Figma**: https://figma.com
- **Adobe Express**: https://express.adobe.com

### 2. 템플릿 사용
1. Canva에서 "Facebook Post" 또는 "Instagram Post" 템플릿 선택
2. 크기를 1200x630px로 조정
3. 올띵버킷 로고와 텍스트 추가
4. 브랜드 컬러 적용
5. JPG 또는 PNG로 다운로드

### 3. 직접 제작
```html
<!-- HTML/CSS로 제작 예시 -->
<div style="width: 1200px; height: 630px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-family: Arial, sans-serif;">
  <div style="text-align: center;">
    <h1 style="font-size: 48px; margin: 0;">올띵버킷</h1>
    <h2 style="font-size: 32px; margin: 20px 0;">체험단 플랫폼</h2>
    <p style="font-size: 24px; margin: 0;">무료 제품 체험의 기회</p>
  </div>
</div>
```

## 📁 파일 저장

1. 이미지 파일명: `og-image.jpg`
2. 저장 위치: `public/og-image.jpg`
3. URL: `https://allthingbucket.com/og-image.jpg`

## 🔧 설정 완료 후

### 1. 파일 업로드
```bash
# public 폴더에 og-image.jpg 파일 저장
public/
├── og-image.jpg
├── logo.png
└── ...
```

### 2. 캐시 초기화
1. [카카오 공유 디버거](https://developers.kakao.com/tool/debugger/sharing) 접속
2. URL 입력: `https://allthingbucket.com`
3. "디버그" 클릭
4. "캐시 초기화" 버튼 클릭

### 3. 테스트
1. 카카오톡에서 링크 공유 테스트
2. 미리보기 이미지 확인
3. 제목과 설명 확인

## 🎯 추가 팁

### 동적 OG 이미지 (고급)
각 페이지마다 다른 OG 이미지를 표시하려면:

```typescript
// React에서 동적 OG 태그 설정
useEffect(() => {
  const metaTitle = document.querySelector('meta[property="og:title"]')
  const metaDescription = document.querySelector('meta[property="og:description"]')
  const metaImage = document.querySelector('meta[property="og:image"]')
  
  if (metaTitle) metaTitle.setAttribute('content', '페이지별 제목')
  if (metaDescription) metaDescription.setAttribute('content', '페이지별 설명')
  if (metaImage) metaImage.setAttribute('content', '페이지별 이미지 URL')
}, [])
```

### 이미지 최적화
- **WebP 형식**: 더 작은 파일 크기
- **압축**: 이미지 품질 80-90%로 압축
- **CDN 사용**: 빠른 로딩을 위해 CDN 활용

## 📱 모바일 최적화

- **반응형**: 다양한 화면 크기에서 잘 보이도록
- **텍스트 크기**: 모바일에서도 읽기 쉽게
- **대비**: 배경과 텍스트의 대비 충분히

## 🔍 검증 도구

- **Facebook Sharing Debugger**: https://developers.facebook.com/tools/debug/
- **Twitter Card Validator**: https://cards-dev.twitter.com/validator
- **LinkedIn Post Inspector**: https://www.linkedin.com/post-inspector/

이렇게 설정하면 카카오톡에서 링크를 공유할 때 아름다운 미리보기가 표시됩니다!
