
import React, { useState, useEffect } from 'react'
import {MapPin, Search, X} from 'lucide-react'

interface AddressInputProps {
  address: string
  detailedAddress: string
  onAddressChange: (address: string, detailedAddress: string) => void
  required?: boolean
}

// 다음 주소찾기 API 타입 정의
declare global {
  interface Window {
    daum: {
      Postcode: new (options: {
        oncomplete: (data: {
          address: string
          zonecode: string
          addressType: string
          bname: string
          buildingName: string
        }) => void
        onclose?: () => void
        width?: string | number
        height?: string | number
      }) => {
        open: () => void
        embed: (container: HTMLElement) => void
      }
    }
  }
}

const AddressInput: React.FC<AddressInputProps> = ({
  address,
  detailedAddress,
  onAddressChange,
  required = false
}) => {
  const [isSearching, setIsSearching] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Daum 우편번호 서비스 스크립트 로드
  useEffect(() => {
    // 이미 로드되어 있으면 스킵
    if (window.daum && window.daum.Postcode) {
      console.log('✅ 다음 주소 API 이미 로드됨')
      return
    }

    // 이미 스크립트 태그가 있는지 확인
    const existingScript = document.querySelector('script[src*="postcode.v2.js"]')
    if (existingScript) {
      console.log('✅ 다음 주소 API 스크립트 태그 존재')
      return
    }

    console.log('📦 다음 주소 API 로드 시작')
    const script = document.createElement('script')
    script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
    script.async = true
    script.onload = () => {
      console.log('✅ 다음 주소 API 로드 완료')
    }
    script.onerror = () => {
      console.error('❌ 다음 주소 API 로드 실패')
    }
    document.head.appendChild(script)
  }, [])

  const handleAddressSearch = () => {
    console.log('🔍 주소 검색 버튼 클릭됨')
    console.log('window.daum 상태:', window.daum)

    if (!window.daum || !window.daum.Postcode) {
      console.error('❌ 다음 우편번호 API가 로드되지 않았습니다')
      alert('주소 검색 기능을 불러오는 중입니다. 잠시 후 다시 시도해주세요.')

      // 스크립트 재로드 시도
      const script = document.createElement('script')
      script.src = '//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js'
      script.onload = () => {
        console.log('✅ 다음 주소 API 재로드 완료')
        alert('주소 검색이 준비되었습니다. 다시 클릭해주세요.')
      }
      document.head.appendChild(script)
      return
    }

    setIsSearching(true)
    setIsModalOpen(true)
    console.log('✅ 다음 주소 모달 열기')
  }

  // 모달이 열렸을 때 다음 주소 API 실행
  useEffect(() => {
    if (isModalOpen && window.daum && window.daum.Postcode) {
      const container = document.getElementById('daum-postcode-container')
      if (!container) return

      const postcode = new window.daum.Postcode({
        oncomplete: (data) => {
          // 선택된 주소 정보 처리
          let fullAddress = data.address

          // 건물명이 있으면 추가
          if (data.buildingName !== '') {
            fullAddress += ` (${data.buildingName})`
          }

          onAddressChange(fullAddress, detailedAddress)
          setIsSearching(false)
          setIsModalOpen(false)

          // 상세주소 입력 필드로 포커스 이동
          setTimeout(() => {
            const detailInput = document.getElementById('detailed-address-input')
            if (detailInput) {
              detailInput.focus()
            }
          }, 100)
        },
        width: '100%',
        height: '100%'
      })

      postcode.embed(container)
    }
  }, [isModalOpen, detailedAddress, onAddressChange])

  const handleDetailedAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onAddressChange(address, e.target.value)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsSearching(false)
  }

  return (
    <div>
      <label className="flex items-center text-sm font-medium text-gray-700 mb-2">
        <MapPin className="w-4 h-4 mr-2" />
        배송 주소 {required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-3">
        {/* 기본 주소 검색 */}
        <div className="relative">
          <input
            type="text"
            value={address}
            readOnly
            placeholder="주소 검색 버튼을 클릭해주세요"
            className="w-full px-3 py-2 pr-12 border border-gray-300 rounded-lg bg-gray-50 cursor-pointer focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            onClick={handleAddressSearch}
          />
          <button
            type="button"
            onClick={handleAddressSearch}
            disabled={isSearching}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 text-gray-500 hover:text-primary-600 transition-colors disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
          </button>
        </div>

        {/* 상세 주소 입력 */}
        <input
          id="detailed-address-input"
          type="text"
          value={detailedAddress}
          onChange={handleDetailedAddressChange}
          placeholder="상세 주소를 입력해주세요 (예: 101동 202호, 3층)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      <div className="mt-2 text-xs text-gray-500">
        <p>💡 주소 검색을 통해 정확한 주소를 입력해주세요</p>
        <p>📦 정확한 배송을 위해 상세 주소(동호수 등)까지 입력해주세요</p>
      </div>

      {/* 주소 검색 모달 */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
            {/* 모달 헤더 */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">주소 검색</h3>
              <button
                onClick={handleCloseModal}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* 다음 주소 검색 컨테이너 */}
            <div
              id="daum-postcode-container"
              className="w-full h-[500px]"
            />
          </div>
        </div>
      )}
    </div>
  )
}

// 🔥 Named Export 추가 (빌드 오류 해결)
export { AddressInput }
export default AddressInput
