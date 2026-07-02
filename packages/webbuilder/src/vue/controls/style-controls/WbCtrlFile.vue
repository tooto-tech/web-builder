<script lang="ts" setup>
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NInput } from 'naive-ui'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
  editor?: any
  imageManager?: any
  grapes?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

const assetManager = computed(() =>
  props.editor?.AssetManager
    ?? props.grapes?.editor?.AssetManager
    ?? props.grapes?.AssetManager,
)
const canOpenPicker = computed(() =>
  Boolean(props.imageManager?.openAssetsDialog || assetManager.value?.open),
)

const getAssetSrc = (asset: any): string =>
  String(asset?.getSrc?.() ?? asset?.src ?? asset ?? '')

const openPicker = () => {
  if (props.imageManager?.openAssetsDialog) {
    props.imageManager.openAssetsDialog({
      isStyleProp: true,
      selectCallback: (asset: any) => {
        emit('update:modelValue', getAssetSrc(asset))
      },
    })
    return
  }

  if (assetManager.value?.open) {
    assetManager.value.open({
      select: (asset: any) => {
        emit('update:modelValue', getAssetSrc(asset))
        assetManager.value.close?.()
      },
    })
  }
}
</script>

<template>
  <div class="wb-ctrl-file">
    <NInput
      class="wb-ctrl-file__input"
      :value="modelValue"
      :placeholder="property.default || 'URL'"
      size="small"
      clearable
      @update:value="(value) => emit('update:modelValue', String(value ?? ''))"
    />
    <NButton
      class="wb-ctrl-file__button"
      :disabled="!canOpenPicker"
      size="small"
      title="选择资源"
      @click="openPicker"
    >
      <Icon icon="lucide:folder-open" :size="14" />
    </NButton>
  </div>
</template>

<style scoped>
.wb-ctrl-file {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.wb-ctrl-file__input {
  flex: 1 1 auto;
  min-width: 0;
}

.wb-ctrl-file__button {
  flex: 0 0 30px;
  width: 30px;
  padding: 0;
}
</style>
