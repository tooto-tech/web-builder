<script setup lang="ts">
import { DevicesProvider } from '@tootix/grapesjs-vue'
</script>

<template>
  <DevicesProvider v-slot="{ devices, selected, select }">
    <div class="tw-flex tw-gap-1 tw-p-2 tw-border-b" data-testid="device-panel">
      <button
        v-for="device in devices"
        :key="String(device.id)"
        type="button"
        class="tw-px-2 tw-py-1 tw-text-xs tw-rounded tw-border"
        :class="selected === String(device.id) ? 'tw-bg-editor-primary tw-text-white tw-border-editor-primary' : 'tw-border-gray-200 tw-text-gray-600'"
        :data-device="String(device.id)"
        @click="select(String(device.id))"
      >
        {{ device.getName() }}
      </button>
    </div>
  </DevicesProvider>
</template>
