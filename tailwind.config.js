
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🌸 모던 빈티지 테라코타 (메인 컬러 - 밝고 따뜻함)
        vintage: {
          50: '#FFF5F2',
          100: '#FFE8E0',
          200: '#FFDDD0',
          300: '#F5C4B0',
          400: '#E8A88D',
          500: '#E07856', // 메인 테라코타
          600: '#D4654A',
          700: '#B8543D',
          800: '#9A4632',
          900: '#7D3827',
        },
        // 🌿 올리브 그린 (서브 컬러 - 자연스러움)
        navy: {
          50: '#F7F9F4',
          100: '#EEF2E8',
          200: '#DDE8D1',
          300: '#C5D9B5',
          400: '#A8C495',
          500: '#9CAF88', // 올리브 그린
          600: '#7F9670',
          700: '#687D5C',
          800: '#526749',
          900: '#3F5038',
        },
        // ✨ 머스타드 골드 (악센트 - 따뜻한 골드)
        gold: {
          50: '#FEF9F0',
          100: '#FDF3E0',
          200: '#FAE8C8',
          300: '#F4D9A8',
          400: '#EDCA85',
          500: '#E6B87D', // 머스타드 골드
          600: '#D9A661',
          700: '#C08F4D',
          800: '#A1773E',
          900: '#826031',
        },
      },
      fontFamily: {
        'sans': ['Pretendard', 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'korean': ['Pretendard', 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕'],
      },
      lineHeight: {
        'relaxed': '1.6',
        'loose': '1.8',
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(224, 120, 86, 0.15), 0 4px 6px -2px rgba(224, 120, 86, 0.08)',
        'vintage': '0 4px 20px -2px rgba(224, 120, 86, 0.2), 0 2px 8px -2px rgba(156, 175, 136, 0.15)',
      },
      backgroundImage: {
        'vintage-texture': "url(\"data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
}
