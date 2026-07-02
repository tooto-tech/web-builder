/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
    '../../packages/webbuilder/src/**/*.vue',
  ],
  // 包外壳颜色走 --wb-* CSS 变量（见包内 src/vue/theme.ts），消费端无需定义 editor-* 色板
  theme: {
    extend: {},
  },
  plugins: [],
}
