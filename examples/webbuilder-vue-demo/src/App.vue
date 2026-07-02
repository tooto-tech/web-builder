<script setup lang="ts">
import { WebBuilder, type WebBuilderOptions } from '@toototech/webbuilder'
import { componentsBasic } from '@toototech/webbuilder-plugins/basic'

const options: WebBuilderOptions = {
  // 白标示例：解除注释即可换肤/换品牌/换文案
  // theme: { '--wb-topbar-bg': '#1e293b', '--wb-primary': '#16a34a' },
  // branding: { homeIcon: 'lucide:rocket', publishLabel: 'Ship it' },
  // i18n: { locale: 'en', messages: { 'shell.bottomDropHint': 'Drop blocks here' } },
  plugins: [
    componentsBasic({
      onRegistrationFailure: diagnostic => {
        console.warn(diagnostic.message, diagnostic.error)
      },
    }),
  ],
  canvas: {
    initialComponents: `
      <section style="padding: 56px 40px; font-family: Inter, Arial, sans-serif;">
        <p style="margin: 0 0 12px; color: #2563eb; font-size: 14px;">WebBuilder Demo</p>
        <h1 style="margin: 0; max-width: 720px; color: #111827; font-size: 42px; line-height: 1.1;">
          One options object mounts the editor shell.
        </h1>
        <p style="margin: 18px 0 0; max-width: 620px; color: #4b5563; font-size: 16px; line-height: 1.7;">
          This Vue 3 + TypeScript + Vite 8 demo imports WebBuilder directly from the package.
        </p>
      </section>
    `,
  },
}
</script>

<template>
  <WebBuilder :options="options" />
</template>
