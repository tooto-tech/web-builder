<script lang="ts" setup>
import { ElInput } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
  imageManager?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

function openImagePicker() {
  if (!props.imageManager) return
  props.imageManager.openAssetsDialog({
    isStyleProp: true,
    selectCallback: (asset: any) => {
      const url = typeof asset.getSrc === 'function' ? asset.getSrc() : (asset.src ?? asset)
      emit('update:modelValue', `url("${url}")`)
    },
  })
}
</script>

<template>
  <div class="flex gap-1 items-center">
    <el-input
      size="small"
      class="flex-1"
      :model-value="modelValue"
      placeholder="url(...)"
      clearable
      @update:model-value="(v) => emit('update:modelValue', v ?? '')"
    />
    <button
      v-if="imageManager"
      type="button"
      class="flex-shrink-0 w-7 h-7 flex items-center justify-center border border-gray-300 rounded text-gray-500 hover:border-blue-400 hover:text-blue-500 bg-white transition-colors"
      title="选择图片"
      @click="openImagePicker"
    >
      <Icon icon="lucide:image" :size="13" />
    </button>
  </div>
</template>
