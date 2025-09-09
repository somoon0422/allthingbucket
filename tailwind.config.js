
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
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
