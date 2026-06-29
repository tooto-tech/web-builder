import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: false,
    minify: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es'],
      fileName: () => 'index.js',
    },
    rollupOptions: {
      external: [
        '@monaco-editor/loader',
        '@iconify/vue',
        '@toototech/webbuilder-core',
        'element-plus',
        'grapesjs',
        'monaco-editor',
        'vue',
      ],
    },
  },
})
