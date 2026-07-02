import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@toototech/webbuilder/core': resolve(__dirname, '../../packages/webbuilder/src/core/index.ts'),
      '@toototech/webbuilder': resolve(__dirname, '../../packages/webbuilder/src/index.ts'),
      '@toototech/webbuilder-plugins/basic': resolve(__dirname, '../../packages/webbuilder-plugins/src/components-basic/index.ts'),
      '@toototech/webbuilder-plugins/cms': resolve(__dirname, '../../packages/webbuilder-plugins/src/components-cms/index.ts'),
      '@toototech/webbuilder-plugins/global-settings': resolve(__dirname, '../../packages/webbuilder-plugins/src/global-settings/index.ts'),
      '@toototech/webbuilder-plugins/i18n': resolve(__dirname, '../../packages/webbuilder-plugins/src/localization/index.ts'),
      '@toototech/webbuilder-plugins/layout-template': resolve(__dirname, '../../packages/webbuilder-plugins/src/layout-templates/index.ts'),
      '@toototech/webbuilder-plugins/publisher': resolve(__dirname, '../../packages/webbuilder-plugins/src/publishing/index.ts'),
      '@toototech/webbuilder-plugins/vue': resolve(__dirname, '../../packages/webbuilder-plugins/src/vue-components.ts'),
      '@toototech/webbuilder-plugins': resolve(__dirname, '../../packages/webbuilder-plugins/src/index.ts'),
    },
  },
})
