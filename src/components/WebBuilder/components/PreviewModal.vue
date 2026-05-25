<script lang="ts" setup>
const props = defineProps<{
  modelValue: boolean
  html: string
  css: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
}>()

const close = () => emit('update:modelValue', false)
</script>

<template>
  <div v-if="props.modelValue" class="absolute inset-0 z-30 flex items-center justify-center">
    <div class="absolute inset-0 bg-black/50" @click="close"></div>
    <div class="relative bg-white rounded shadow w-[90vw] h-[90vh] overflow-hidden">
      <div class="px-4 py-2 border-b text-sm font-medium flex items-center justify-between">
        <span>预览</span>
        <button class="text-xs px-2 py-1 rounded hover:bg-gray-100" @click="close">关闭</button>
      </div>
      <iframe
        class="w-full h-full"
        :srcdoc="`<!doctype html><html><head><style>${props.css}</style></head><body>${props.html}</body></html>`"
      ></iframe>
    </div>
  </div>
</template>
