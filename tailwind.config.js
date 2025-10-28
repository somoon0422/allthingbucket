
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 🔴 Primary Red (로고 메인 컬러)
        primary: {
          50: '#FFEBEE',
          100: '#FFCDD2',
          200: '#EF9A9A',
          300: '#E57373',
          400: '#EF5350',
          500: '#D32F2F', // 메인 레드
          600: '#C62828',
          700: '#B71C1C',
          800: '#8E0000',
          900: '#6A0000',
        },
        // 🔵 Navy Blue (로고 서브 컬러)
        navy: {
          50: '#E8EAF6',
          100: '#C5CAE9',
          200: '#9FA8DA',
          300: '#7986CB',
          400: '#5C6BC0',
          500: '#3F51B5',
          600: '#3949AB',
          700: '#303F9F',
          800: '#283593',
          900: '#1A237E', // 진한 네이비
        },
        // 🟡 Warm Beige (로고 배경 컬러 - 베이지/크림)
        beige: {
          50: '#FFFEF7',
          100: '#FFFCF0',
          200: '#FFF8DC',
          300: '#FFEFD5',
          400: '#FFE4B5',
          500: '#F5DEB3',
          600: '#DEB887',
          700: '#D2B48C',
          800: '#BC8F8F',
          900: '#A0826D',
        },
        // ✨ Accent Gold (포인트 컬러)
        gold: {
          50: '#FFFBEA',
          100: '#FFF3C4',
          200: '#FCE588',
          300: '#FADB5F',
          400: '#F7C948',
          500: '#F0B429',
          600: '#DE911D',
          700: '#CB6E17',
          800: '#B44D12',
          900: '#8D2B0B',
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
