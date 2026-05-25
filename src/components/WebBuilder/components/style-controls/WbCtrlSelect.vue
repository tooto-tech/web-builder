<script lang="ts" setup>
import { ElSelect, ElOption } from 'element-plus'
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
  <el-select
    size="small"
    class="w-full"
    clearable
    :model-value="modelValue"
    :placeholder="property.default ?? '默认'"
    @update:model-value="(v) => emit('update:modelValue', v ?? '')"
  >
    <el-option
      v-for="opt in property.options"
      :key="opt.value"
      :label="opt.label"
      :value="opt.value"
    />
  </el-select>
</template>
<style scoped>
.el-select-dropdown__item{
--el-font-size-base: 12px;
}
</style>
