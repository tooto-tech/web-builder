<script setup lang="ts">
import { WebBuilder, type WebBuilderOptions } from '@toototech/webbuilder'

const options: WebBuilderOptions = {
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
