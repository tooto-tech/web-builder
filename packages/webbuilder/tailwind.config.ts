import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Config } from 'tailwindcss'

const packageDir = dirname(fileURLToPath(import.meta.url))

export default {
  prefix: 'tw-',
  content: [
    resolve(packageDir, 'src/**/*.{vue,js,ts,jsx,tsx}'),
  ],
  theme: {
    extend: {
      colors: {
        'editor-bg': '#0d0d0d',
        'editor-panel': '#001533',
        'editor-panel-dark': '#001533',
        'editor-border': '#2c2c2c',
        'editor-border-light': '#3a3a3a',
        'editor-text': '#d1d5db',
        'editor-text-muted': '#9ca3af',
        'editor-text-dim': '#6b7280',
        'editor-text-darker': '#4b5563',
        'editor-primary': '#2251FF',
        'editor-primary-light': '#5c7cff',
        'editor-danger': '#ef4444',
        'editor-btn-hover': '#ffffff29',
        'editor-btn-active': '#ffffff29',
      },
    },
  },
  plugins: [],
} satisfies Config
