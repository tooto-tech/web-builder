<script lang="ts" setup>
import { computed } from 'vue'
import { ElPopover } from 'element-plus'
import WbColorPicker from '../fields/WbColorPicker.vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'
import {
  parseGlobalColorVar,
  useWebBuilderGlobalSettingsControls,
} from '../globalSettings'

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const globalSettings = useWebBuilderGlobalSettingsControls()

/** 解析全局颜色引用，返回实际颜色值和名称 */
const resolvedColor = computed(() => {
  const gcId = parseGlobalColorVar(props.modelValue)
  if (!gcId) return null
  const gc = globalSettings.colors.value.find(c => c.id === gcId)
  return gc ? { name: gc.name, value: gc.value } : null
})

/** 色块显示用的实际颜色值 */
const displayColor = computed(() => {
  return resolvedColor.value?.value || props.modelValue || ''
})

/** 文本显示 */
const displayText = computed(() => {
  if (resolvedColor.value) return resolvedColor.value.name
  return props.modelValue || '未设置'
})
</script>

<template>
  <el-popover
    placement="bottom-start"
    :width="270"
    trigger="click"
    popper-class="wb-color-popover"
  >
    <template #reference>
      <div class="wb-ctrl-color-btn" :class="{ 'wb-ctrl-color-btn--linked': resolvedColor }">
        <span
          class="wb-ctrl-color-swatch"
          :style="{ background: displayColor || 'transparent' }"
        ></span>
        <span class="wb-ctrl-color-text">
          {{ displayText }}
        </span>
      </div>
    </template>

    <WbColorPicker
      :model-value="modelValue"
      @update:model-value="(v) => emit('update:modelValue', v)"
      @clear="() => emit('update:modelValue', '')"
    />
  </el-popover>
</template>

<style scoped>
.wb-ctrl-color-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  cursor: pointer;
  background: #f9fafb;
  transition: border-color 0.15s, background 0.15s;
  min-width: 80px;
  max-width: 160px;
  overflow: hidden;
}
.wb-ctrl-color-btn:hover {
  border-color: #a5b4fc;
  background: #fff;
}
.wb-ctrl-color-btn--linked {
  border-color: #a5c0ff;
  background: #f0f5ff;
}

/* 棋盘格透明提示 */
.wb-ctrl-color-swatch {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  border-radius: 3px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 6px 6px;
  background-position: 0 0, 0 3px, 3px -3px, -3px 0;
  background-clip: padding-box;
  position: relative;
}
.wb-ctrl-color-swatch::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 2px;
  background: inherit;
}

.wb-ctrl-color-text {
  font-size: 11px;
  font-family: monospace;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  min-width: 0;
}
</style>
