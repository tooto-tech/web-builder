<script lang="ts" setup>
import { ElInput } from 'element-plus'
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
  <el-input
    size="small"
    class="w-full"
    :model-value="modelValue"
    :placeholder="property.default ?? ''"
    @update:model-value="(v) => emit('update:modelValue', String(v ?? ''))"
  />
</template>
