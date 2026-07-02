<script lang="ts" setup>
import { Icon } from '@iconify/vue'
import { DevicesProvider } from '@tootix/grapesjs-vue'

const getDeviceId = (device: any) => {
  if (typeof device === 'string') return device
  return device && typeof device.get === 'function' ? device.get('id') : device?.id
}

const getDeviceName = (device: any) =>
  device && typeof device.get === 'function' ? device.get('name') : device?.name

const getDeviceIcon = (device: any) => {
  const id = getDeviceId(device)
  const icons: Record<string, string> = {
    desktop: 'lucide:monitor',
    tablet: 'lucide:tablet',
    mobileLandscape: 'prime:cellphone',
    mobile: 'lucide:smartphone',
  }
  return icons[id] ?? 'mdi:devices'
}
</script>

<template>
  <DevicesProvider v-slot="{ devices, selected, select }">
    <div class="tw-flex">
      <button
        v-for="device in devices"
        :key="getDeviceId(device)"
        :class="{
          'tw-bg-[color:var(--wb-btn-active-bg)]':
            getDeviceId(device) === selected,
        }"
        class="tw-aspect-square tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded tw-text-white"
        :title="getDeviceName(device)"
        :aria-label="getDeviceName(device)"
        @click="select(getDeviceId(device))"
      >
        <Icon :icon="getDeviceIcon(device)" />
      </button>
    </div>
  </DevicesProvider>
</template>
