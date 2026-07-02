<script lang="ts" setup>
import { ElSelect, ElOption } from 'element-plus'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

withDefaults(
  defineProps<{
    property: WbStyleProperty
    modelValue: string
    teleported?: boolean
  }>(),
  { teleported: true },
)

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()
</script>

<template>
  <el-select
    size="small"
    class="w-full"
    clearable
    :teleported="teleported"
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
