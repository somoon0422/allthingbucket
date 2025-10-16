
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 빈티지 버건디 (메인 컬러)
        vintage: {
          50: '#FCF3F3',
          100: '#F9E7E7',
          200: '#F3CFCF',
          300: '#E8AEAE',
          400: '#D88585',
          500: '#B85C5C', // 로고 메인
          600: '#A04848',
          700: '#8E3838',
          800: '#7A2F2F',
          900: '#652828',
        },
        // 빈티지 네이비 (서브 컬러)
        navy: {
          50: '#F3F6F8',
          100: '#E7EDF1',
          200: '#CCD9E2',
          300: '#A8BFD0',
          400: '#7A9DB8',
          500: '#4A6B7C', // 로고 배경
          600: '#3A5563',
          700: '#2A4553',
          800: '#1F3542',
          900: '#162A35',
        },
        // 빈티지 골드 (악센트)
        gold: {
          50: '#FAF7F3',
          100: '#F5EFE7',
          200: '#EBE0CF',
          300: '#DDCAAE',
          400: '#CCB188',
          500: '#D4A574', // 로고 텍스트
          600: '#C49563',
          700: '#B48553',
          800: '#9D7145',
          900: '#856039',
        },
      },
      fontFamily: {
        'sans': ['Pretendard', 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        'korean': ['Pretendard', 'Noto Sans KR', 'Malgun Gothic', '맑은 고딕'],
      },
      lineHeight: {
        'relaxed': '1.6',
        'loose': '1.8',
      }
    },
  },
  plugins: [],
}
