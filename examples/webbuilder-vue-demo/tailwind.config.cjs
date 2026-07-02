/** @type {import('tailwindcss').Config} */
module.exports = {
  prefix: 'tw-',
  content: [
    './index.html',
    './src/**/*.{vue,js,ts}',
    '../../packages/webbuilder/src/**/*.vue',
  ],
  theme: {
    extend: {
      colors: {
        'editor-panel': '#001533',
        'editor-primary': '#2251FF',
        'editor-btn-hover': '#ffffff29',
        'editor-btn-active': '#ffffff29',
      },
    },
  },
  plugins: [],
}
