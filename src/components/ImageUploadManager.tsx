
import React, { useState, useCallback } from 'react'
import { useAuth } from '../hooks/useAuth'
import { lumi } from '../lib/lumi'
import {Upload, X, Link as LinkIcon, AlertCircle, Loader2} from 'lucide-react'
import toast from 'react-hot-toast'

interface ImageUploadManagerProps {
  onImagesChange: (images: string[]) => void
  initialImages?: string[]
  maxImages?: number
  allowFileUpload?: boolean // 🔥 파일 업로드 허용 여부
  allowUrlInput?: boolean   // URL 입력 허용 여부
}

const ImageUploadManager: React.FC<ImageUploadManagerProps> = ({
  onImagesChange,
  initialImages = [],
  maxImages = 5,
  allowFileUpload = true,  // 🔥 기본값: 파일 업로드 허용
  allowUrlInput = true
}) => {
  const { user } = useAuth()
  const [images, setImages] = useState<string[]>(initialImages)
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [showUrlInput, setShowUrlInput] = useState(false)

  // 🔄 대안 업로드 방식 (Base64 변환)
  const handleAlternativeUpload = useCallback(async (files: File[]) => {
    try {
      console.log('🔄 대안 업로드 방식 시도 (Base64)')
      const base64Images: string[] = []
      
      for (const file of files) {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader()
          reader.onload = () => resolve(reader.result as string)
          reader.onerror = reject
          reader.readAsDataURL(file)
        })
        base64Images.push(base64)
      }
      
      if (base64Images.length > 0) {
        const newImages = [...images, ...base64Images]
        setImages(newImages)
        onImagesChange(newImages)
        toast.success(`${base64Images.length}개 이미지를 Base64 방식으로 업로드 완료`)
        console.log('✅ Base64 업로드 성공')
      }
    } catch (altError) {
      console.error('❌ 대안 업로드도 실패:', altError)
      toast.error('모든 업로드 방식이 실패했습니다. 파일 크기를 확인해주세요.')
    }
  }, [images, onImagesChange])

  // 🔥 파일 업로드 처리 (Lumi 저장소 연동)
  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!allowFileUpload) {
      toast.error('파일 업로드가 허용되지 않습니다')
      return
    }

    // 사용자 인증 체크
    if (!user) {
      toast.error('로그인이 필요합니다')
      return
    }


    const fileArray = Array.from(files)
    
    // 파일 개수 체크
    if (images.length + fileArray.length > maxImages) {
      toast.error(`최대 ${maxImages}개의 이미지만 업로드할 수 있습니다`)
      return
    }

    // 파일 타입 및 크기 검증
    const validFiles = fileArray.filter(file => {
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name}은(는) 이미지 파일이 아닙니다`)
        return false
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB 제한
        toast.error(`${file.name}은(는) 10MB를 초과합니다`)
        return false
      }
      return true
    })

    if (validFiles.length === 0) return

    try {
      setUploading(true)
      console.log('🔄 파일 업로드 시작:', validFiles.map(f => f.name))
      console.log('🔍 Lumi SDK 상태:', { lumi: !!lumi, tools: !!lumi?.tools, file: !!lumi?.tools?.file })
      console.log('🔍 사용자 인증 상태:', { user: user?.name, id: user?.user_id })
      
      // 🚀 Lumi 파일 저장소에 업로드 시도
      try {
        const uploadResults = await lumi.tools.file.upload(validFiles)
        console.log('📊 업로드 결과:', uploadResults)
        
        const successfulUploads: string[] = []
        const failedUploads: string[] = []
        
        uploadResults.forEach((result, index) => {
          if (result.fileUrl) {
            successfulUploads.push(result.fileUrl)
            console.log(`✅ 업로드 성공: ${validFiles[index].name} -> ${result.fileUrl}`)
          } else {
            failedUploads.push(validFiles[index].name)
            console.error(`❌ 업로드 실패: ${validFiles[index].name} - ${result.uploadError}`)
          }
        })
        
        if (successfulUploads.length > 0) {
          const newImages = [...images, ...successfulUploads]
          setImages(newImages)
          onImagesChange(newImages)
          toast.success(`${successfulUploads.length}개 이미지 업로드 완료`)
        }
        
        if (failedUploads.length > 0) {
          // 실패한 파일들을 Base64로 처리
          const failedFiles = validFiles.filter((_, index) => failedUploads.includes(validFiles[index].name))
          await handleAlternativeUpload(failedFiles)
        }
      } catch (lumiError) {
        console.warn('⚠️ Lumi SDK 업로드 실패, Base64 방식으로 전환:', lumiError)
        // Lumi SDK 실패 시 바로 Base64 방식으로 전환
        await handleAlternativeUpload(validFiles)
      }
      
    } catch (error) {
      console.error('❌ 파일 업로드 오류:', error)
      // 최종적으로 Base64 방식으로 시도
      await handleAlternativeUpload(validFiles)
    } finally {
      setUploading(false)
    }
  }, [images, maxImages, onImagesChange, user, allowFileUpload, handleAlternativeUpload])

  // URL 추가 처리
  const handleUrlAdd = useCallback(() => {
    if (!allowUrlInput) {
      toast.error('URL 입력이 허용되지 않습니다')
      return
    }

    if (!urlInput.trim()) {
      toast.error('URL을 입력해주세요')
      return
    }

    if (images.length >= maxImages) {
      toast.error(`최대 ${maxImages}개의 이미지만 추가할 수 있습니다`)
      return
    }

    // URL 형식 검증
    try {
      new URL(urlInput)
    } catch {
      toast.error('올바른 URL 형식이 아닙니다')
      return
    }

    if (images.includes(urlInput)) {
      toast.error('이미 추가된 이미지입니다')
      return
    }

    const newImages = [...images, urlInput]
    setImages(newImages)
    onImagesChange(newImages)
    setUrlInput('')
    setShowUrlInput(false)
    toast.success('이미지가 추가되었습니다')
  }, [urlInput, images, maxImages, onImagesChange, allowUrlInput])

  // 이미지 삭제
  const handleRemoveImage = useCallback((index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    setImages(newImages)
    onImagesChange(newImages)
  }, [images, onImagesChange])

  // 드래그 앤 드롭 이벤트
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files)
    }
  }, [handleFileUpload])

  return (
    <div className="space-y-4">
      {/* 업로드 영역 */}
      {allowFileUpload && (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            dragActive 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
          } ${uploading ? 'pointer-events-none opacity-50' : ''}`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={(e) => e.target.files && handleFileUpload(e.target.files)}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={uploading}
          />
          
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-2" />
              <p className="text-sm text-gray-600">업로드 중...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <Upload className="w-8 h-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600 mb-1">
                이미지를 드래그하거나 클릭하여 업로드
              </p>
              <p className="text-xs text-gray-500">
                최대 {maxImages}개, 10MB 이하의 이미지 파일
              </p>
            </div>
          )}
        </div>
      )}

      {/* URL 입력 영역 */}
      {allowUrlInput && (
        <div className="space-y-2">
          {!showUrlInput ? (
            <button
              onClick={() => setShowUrlInput(true)}
              className="flex items-center space-x-2 px-3 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <LinkIcon className="w-4 h-4" />
              <span>URL로 이미지 추가</span>
            </button>
          ) : (
            <div className="flex space-x-2">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="이미지 URL을 입력하세요"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && handleUrlAdd()}
              />
              <button
                onClick={handleUrlAdd}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                추가
              </button>
              <button
                onClick={() => {
                  setShowUrlInput(false)
                  setUrlInput('')
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}

      {/* 이미지 미리보기 */}
      {images.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            업로드된 이미지 ({images.length}/{maxImages})
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {images.map((imageUrl, index) => (
              <div key={index} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={imageUrl}
                    alt={`업로드된 이미지 ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTIxIDlWN0MxOSA1IDEyIDUgMTIgNUM1IDUgMyA3IDMgOVYxN0MzIDE5IDUgMjEgMTIgMjFDMTkgMjEgMjEgMTkgMjEgMTdWOVoiIHN0cm9rZT0iIzk5OTk5OSIgc3Ryb2tlLXdpZHRoPSIyIiBzdHJva2UtbGluZWNhcD0icm91bmQiIHN0cm9rZS1saW5lam9pbj0icm91bmQiLz4KPC9zdmc+'
                    }}
                  />
                </div>
                <button
                  onClick={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 도움말 */}
      <div className="flex items-start space-x-2 p-3 bg-blue-50 rounded-lg">
        <AlertCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="text-xs text-blue-700">
          <p className="font-medium mb-1">이미지 업로드 안내</p>
          <ul className="space-y-1">
            {allowFileUpload && <li>• 파일 업로드: JPG, PNG, GIF 등 이미지 파일만 가능</li>}
            {allowUrlInput && <li>• URL 입력: 이미지 직접 링크 주소 입력 가능</li>}
            <li>• 최대 {maxImages}개까지 업로드 가능</li>
            <li>• 파일 크기는 10MB 이하로 제한</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

// 🔥 default export로 수정 (import 에러 해결)
export default ImageUploadManager
