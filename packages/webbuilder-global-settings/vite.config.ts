import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  build: {
    sourcemap: false,
    minify: false,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        plugin: resolve(__dirname, 'src/plugin.ts'),
        publisher: resolve(__dirname, 'src/publisher.ts'),
        vue: resolve(__dirname, 'src/vue.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        '@iconify/vue',
        '@tooto-tech/webbuilder-core',
        'element-plus',
        'grapesjs',
        'vue',
      ],
    },
  },
})
