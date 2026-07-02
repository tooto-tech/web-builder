<script lang="ts" setup>
import { Icon } from '@iconify/vue'

defineProps<{
  modelValue: any
  options: { value: any; label: string; icon?: string }[]
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()
</script>

<template>
  <div class="flex w-full overflow-hidden rounded border border-[#c6cad1] bg-white">
    <button
      v-for="(option, index) in options"
      :key="String(option.value)"
      type="button"
      class="h-6 flex-1 flex items-center justify-center transition-colors border-l border-[#c6cad1] first:border-l-0"
      :class="[
        modelValue === option.value
          ? 'bg-[#d9dde3] text-[#1f2937]'
          : 'text-[#4b5563] hover:bg-[#f3f4f6]',
        index === 0 ? 'rounded-l' : '',
        index === options.length - 1 ? 'rounded-r' : '',
      ]"
      :title="option.label"
      :aria-label="option.label"
      @click="emit('update:modelValue', option.value)"
    >
      <Icon :icon="option.icon || 'lucide:circle'" class="text-sm" />
    </button>
  </div>
</template>
