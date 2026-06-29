import { defineConfig } from 'vitest/config'
import { resolve } from 'node:path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['packages/{webbuilder,webbuilder-plugins}/**/*.{spec,test}.ts'],
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      '@toototech/webbuilder/core': resolve(__dirname, 'packages/webbuilder/src/core/index.ts'),
      '@toototech/webbuilder': resolve(__dirname, 'packages/webbuilder/src/index.ts'),
      '@toototech/webbuilder-plugins/basic': resolve(__dirname, 'packages/webbuilder-plugins/src/basic/index.ts'),
      '@toototech/webbuilder-plugins/cms': resolve(__dirname, 'packages/webbuilder-plugins/src/cms/index.ts'),
      '@toototech/webbuilder-plugins/global-settings': resolve(__dirname, 'packages/webbuilder-plugins/src/global-settings/index.ts'),
      '@toototech/webbuilder-plugins/i18n': resolve(__dirname, 'packages/webbuilder-plugins/src/i18n/index.ts'),
      '@toototech/webbuilder-plugins/layout-template': resolve(__dirname, 'packages/webbuilder-plugins/src/layout-template/index.ts'),
      '@toototech/webbuilder-plugins/publisher': resolve(__dirname, 'packages/webbuilder-plugins/src/publisher/index.ts'),
      '@toototech/webbuilder-plugins/vue': resolve(__dirname, 'packages/webbuilder-plugins/src/vue.ts'),
      '@toototech/webbuilder-plugins': resolve(__dirname, 'packages/webbuilder-plugins/src/index.ts'),
    },
  },
})
