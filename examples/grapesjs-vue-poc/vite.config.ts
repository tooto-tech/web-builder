import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      // 直连包源码（与根 vitest.config.ts 的 alias 保持一致）
      '@toototech/webbuilder/core': resolve(__dirname, '../../packages/webbuilder/src/core/index.ts'),
      '@toototech/webbuilder': resolve(__dirname, '../../packages/webbuilder/src/index.ts'),
      '@toototech/webbuilder-plugins/basic': resolve(__dirname, '../../packages/webbuilder-plugins/src/components-basic/index.ts'),
      '@toototech/webbuilder-plugins/global-settings': resolve(__dirname, '../../packages/webbuilder-plugins/src/global-settings/index.ts'),
      // vendor 拷贝文件里的 admin 绝对路径 import → 精确重定向
      '@/components/WebBuilder/utils/globalSettingsPrimitives': resolve(__dirname, 'src/vendor/utils/globalSettingsPrimitives.ts'),
      '@/components/WebBuilder/utils/globalSettingsHostDeps': resolve(__dirname, 'src/vendor/utils/globalSettingsHostDeps.ts'),
    },
  },
})
