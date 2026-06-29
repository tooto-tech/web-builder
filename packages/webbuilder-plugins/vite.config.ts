import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

const injectVueEntryStyle = () => ({
  name: 'webbuilder-plugins-inject-vue-entry-style',
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
        basic: resolve(__dirname, 'src/components-basic/index.ts'),
        cms: resolve(__dirname, 'src/components-cms/index.ts'),
        i18n: resolve(__dirname, 'src/localization/index.ts'),
        'global-settings': resolve(__dirname, 'src/global-settings/index.ts'),
        'layout-template': resolve(__dirname, 'src/layout-templates/index.ts'),
        publisher: resolve(__dirname, 'src/publishing/index.ts'),
        vue: resolve(__dirname, 'src/vue-components.ts'),
      },
      formats: ['es'],
      fileName: (_format, entryName) => `${entryName}.js`,
    },
    rollupOptions: {
      external: [
        '@iconify/iconify',
        '@iconify/json',
        '@iconify/vue',
        '@toototech/webbuilder',
        '@toototech/webbuilder/core',
        'element-plus',
        'grapesjs',
        'swiper',
        'vue',
      ],
    },
  },
})
