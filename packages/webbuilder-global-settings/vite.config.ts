import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const injectVueEntryStyle = () => ({
  name: 'webbuilder-global-settings-inject-vue-entry-style',
  generateBundle(_options: unknown, bundle: Record<string, any>) {
    const vueEntry = Object.values(bundle).find(
      chunk => chunk?.type === 'chunk' && chunk.fileName === 'vue.js',
    )
    if (vueEntry && typeof vueEntry.code === 'string' && !vueEntry.code.includes("import './style.css';")) {
      vueEntry.code = `import './style.css';\n${vueEntry.code}`
    }
  },
})

export default defineConfig({
  plugins: [vue(), injectVueEntryStyle()],
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
        '@toototech/webbuilder-core',
        'element-plus',
        'grapesjs',
        'vue',
      ],
    },
  },
})
