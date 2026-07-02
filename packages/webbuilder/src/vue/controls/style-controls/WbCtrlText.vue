<script lang="ts" setup>
import { NInput } from 'naive-ui'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

defineProps<{
  property: WbStyleProperty
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <NInput
    size="small"
    class="w-full"
    :value="modelValue"
    :placeholder="property.default ?? ''"
    @update:value="(v) => emit('update:modelValue', String(v ?? ''))"
  />
</template>
