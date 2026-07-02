import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@toototech/webbuilder': resolve(__dirname, '../../packages/webbuilder/src/index.ts'),
    },
  },
})
