<script lang="ts" setup>
import { Icon } from '@iconify/vue'

const props = defineProps<{
  devices: any[]
  selectedDevice: any
}>()

const emit = defineEmits<{
  (e: 'select-device', device: any): void
}>()

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
  <div class="flex">
    <template v-for="device in props.devices" :key="getDeviceId(device)">
      <button
        :class="{
          'bg-editor-btn-active':
            getDeviceId(device) === getDeviceId(props.selectedDevice),
        }"
        @click="emit('select-device', device)"
        class="aspect-square w-8 flex items-center justify-center rounded text-white"
        :title="getDeviceName(device)"
        :aria-label="getDeviceName(device)"
      >
        <Icon :icon="getDeviceIcon(device)" />
      </button>
    </template>
  </div>
</template>
