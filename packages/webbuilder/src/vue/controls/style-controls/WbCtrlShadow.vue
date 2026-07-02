<script lang="ts" setup>
import { computed, nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import {
  NButton,
  NCheckbox,
  NCollapse,
  NCollapseItem,
  NInput,
} from 'naive-ui'
import WbCtrlColor from './WbCtrlColor.vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'
import type { WbStyleManager } from '../../composables/useWbStyleManager'

const props = defineProps<{
  property: WbStyleProperty
  styleManager: WbStyleManager
}>()

interface ShadowLayer {
  h: string
  v: string
  blur: string
  spread: string
  color: string
  inset: boolean
}

const lengthFields = [
  { key: 'h', label: '水平' },
  { key: 'v', label: '垂直' },
  { key: 'blur', label: '模糊' },
  { key: 'spread', label: '扩展' },
] as const

const createLayer = (): ShadowLayer => ({
  h: '0px',
  v: '2px',
  blur: '4px',
  spread: '0px',
  color: 'rgba(0,0,0,0.2)',
  inset: false,
})

const splitTopLevel = (str: string): string[] => {
  const parts: string[] = []
  let depth = 0
  let current = ''

  for (const ch of str) {
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1

    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
      continue
    }

    current += ch
  }

  if (current.trim()) parts.push(current.trim())
  return parts
}

const tokenize = (str: string): string[] => {
  const tokens: string[] = []
  let depth = 0
  let current = ''

  for (const ch of str) {
    if (ch === '(') depth += 1
    else if (ch === ')') depth -= 1

    if (ch === ' ' && depth === 0) {
      if (current) {
        tokens.push(current)
        current = ''
      }
      continue
    }

    current += ch
  }

  if (current) tokens.push(current)
  return tokens
}

const isLength = (token: string): boolean =>
  /^-?\d*\.?\d+(px|em|rem|%|vh|vw|ch|ex|cm|mm|in|pt|pc)?$/.test(token.trim())

const parseShadow = (css: string): ShadowLayer[] => {
  if (!css || css.trim() === 'none') return []

  return splitTopLevel(css).map((part) => {
    const inset = /\binset\b/.test(part)
    const tokens = tokenize(
      part
        .replace(/\binset\b/g, '')
        .replace(/\s+/g, ' ')
        .trim(),
    )
    const nums: string[] = []
    const colorParts: string[] = []

    tokens.forEach((token) => {
      if (nums.length < 4 && isLength(token)) {
        nums.push(token)
        return
      }

      if (token) colorParts.push(token)
    })

    return {
      h: nums[0] ?? '0px',
      v: nums[1] ?? '0px',
      blur: nums[2] ?? '0px',
      spread: nums[3] ?? '0px',
      color: colorParts.join(' ') || '#000000',
      inset,
    }
  })
}

const layersToCSS = (layers: ShadowLayer[]): string =>
  layers
    .map(layer =>
      `${layer.inset ? 'inset ' : ''}${layer.h} ${layer.v} ${layer.blur} ${layer.spread} ${layer.color}`,
    )
    .join(', ')

const layers = ref<ShadowLayer[]>([])
const activeLayerIds = ref<string[]>([])

const currentCSS = computed(() => {
  void props.styleManager.currentStyles.value
  return props.styleManager.getValue(props.property.id)
})

let committing = false

const layerName = (index: number) => `shadow-layer-${index}`

const updateActiveLayerIds = (value: string | number | Array<string | number>) => {
  activeLayerIds.value = Array.isArray(value)
    ? value.map(item => String(item))
    : [String(value)]
}

const syncActiveLayers = () => {
  const available = new Set(layers.value.map((_, index) => layerName(index)))
  activeLayerIds.value = activeLayerIds.value.filter(id => available.has(id))
  if (!activeLayerIds.value.length && layers.value.length) {
    activeLayerIds.value = [layerName(0)]
  }
}

watch(
  currentCSS,
  (css) => {
    if (committing) return
    layers.value = parseShadow(css)
    syncActiveLayers()
  },
  { immediate: true },
)

const commit = () => {
  committing = true
  const css = layersToCSS(layers.value)

  if (css) {
    props.styleManager.setValue(props.property.id, css)
  } else {
    props.styleManager.clearValue(props.property.id)
  }

  nextTick(() => {
    committing = false
  })
}

const layerSummary = (layer: ShadowLayer): string =>
  `${layer.h} ${layer.v} ${layer.blur}${layer.spread !== '0px' ? ` ${layer.spread}` : ''}`

const addLayer = () => {
  layers.value.push(createLayer())
  activeLayerIds.value = [layerName(layers.value.length - 1)]
  commit()
}

const duplicateLayer = (index: number) => {
  layers.value.splice(index + 1, 0, { ...layers.value[index] })
  activeLayerIds.value = [layerName(index + 1)]
  commit()
}

const removeLayer = (index: number) => {
  layers.value.splice(index, 1)
  syncActiveLayers()
  commit()
}

const moveLayer = (index: number, direction: -1 | 1) => {
  const target = index + direction
  if (target < 0 || target >= layers.value.length) return

  const nextLayers = [...layers.value]
  const [moved] = nextLayers.splice(index, 1)
  nextLayers.splice(target, 0, moved)
  layers.value = nextLayers
  activeLayerIds.value = [layerName(target)]
  commit()
}

const updateField = (index: number, key: keyof ShadowLayer, value: string | boolean) => {
  layers.value[index] = { ...layers.value[index], [key]: value }
  commit()
}
</script>

<template>
  <div class="wb-shadow-ctrl">
    <div v-if="!layers.length" class="wb-shadow-ctrl__empty">
      未设置阴影
    </div>

    <NCollapse
      v-else
      class="wb-shadow-ctrl__layers"
      :expanded-names="activeLayerIds"
      @update:expanded-names="updateActiveLayerIds"
    >
      <NCollapseItem
        v-for="(layer, index) in layers"
        :key="index"
        :name="layerName(index)"
        class="wb-shadow-layer"
      >
        <template #title>
          <span class="wb-shadow-layer__title">
            <span
              class="wb-shadow-layer__swatch"
              :style="{ background: layer.color }"
            />
            <span class="wb-shadow-layer__summary">
              {{ layerSummary(layer) }}
            </span>
            <span v-if="layer.inset" class="wb-shadow-layer__badge">
              内嵌
            </span>
          </span>
        </template>

        <div class="wb-shadow-layer__body">
          <div class="wb-shadow-layer__actions">
            <NButton
              text
              size="small"
              title="上移"
              :disabled="index === 0"
              @click.stop="moveLayer(index, -1)"
            >
              <Icon icon="lucide:arrow-up" :size="13" />
            </NButton>
            <NButton
              text
              size="small"
              title="下移"
              :disabled="index === layers.length - 1"
              @click.stop="moveLayer(index, 1)"
            >
              <Icon icon="lucide:arrow-down" :size="13" />
            </NButton>
            <NButton
              text
              size="small"
              title="复制"
              @click.stop="duplicateLayer(index)"
            >
              <Icon icon="lucide:copy" :size="13" />
            </NButton>
            <NButton
              text
              size="small"
              title="删除"
              @click.stop="removeLayer(index)"
            >
              <Icon icon="lucide:trash-2" :size="13" />
            </NButton>
          </div>

          <div class="wb-shadow-layer__grid">
            <label
              v-for="field in lengthFields"
              :key="field.key"
              class="wb-shadow-layer__field"
            >
              <span>{{ field.label }}</span>
              <NInput
                :value="String(layer[field.key])"
                size="small"
                @update:value="(value) => updateField(index, field.key, String(value ?? ''))"
              />
            </label>
          </div>

          <div class="wb-shadow-layer__footer">
            <label class="wb-shadow-layer__color">
              <span>颜色</span>
              <WbCtrlColor
                :property="property"
                :model-value="layer.color"
                @update:model-value="(value) => updateField(index, 'color', value || '#000000')"
              />
            </label>
            <NCheckbox
              :checked="layer.inset"
              @update:checked="(value) => updateField(index, 'inset', Boolean(value))"
            >
              内嵌
            </NCheckbox>
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>

    <NButton
      class="wb-shadow-ctrl__add"
      secondary
      size="small"
      @click="addLayer"
    >
      <Icon icon="lucide:plus" :size="13" />
      添加阴影
    </NButton>
  </div>
</template>

<style scoped>
.wb-shadow-ctrl {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.wb-shadow-ctrl__empty {
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 8px 10px;
  color: #6b7280;
  font-size: 12px;
  line-height: 18px;
  background: #f9fafb;
}

.wb-shadow-ctrl__layers {
  border-top: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
}

.wb-shadow-layer :deep(.n-collapse-item__header) {
  min-height: 34px;
  min-width: 0;
  padding: 0 8px;
  background: #fff;
}

.wb-shadow-layer :deep(.n-collapse-item__header-main) {
  min-width: 0;
}

.wb-shadow-layer :deep(.n-collapse-item__content-inner) {
  padding: 0;
}

.wb-shadow-layer__title {
  display: flex;
  align-items: center;
  gap: 7px;
  min-width: 0;
  width: 100%;
}

.wb-shadow-layer__swatch {
  width: 16px;
  height: 16px;
  flex: 0 0 auto;
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 4px;
}

.wb-shadow-layer__summary {
  min-width: 0;
  overflow: hidden;
  color: #374151;
  font-size: 12px;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-shadow-layer__badge {
  flex: 0 0 auto;
  border-radius: 4px;
  padding: 1px 5px;
  color: #1d4ed8;
  background: #eff6ff;
  font-size: 10px;
  line-height: 14px;
}

.wb-shadow-layer__body {
  display: grid;
  gap: 8px;
  border-top: 1px solid #eef2f7;
  padding: 8px;
  background: #f9fafb;
}

.wb-shadow-layer__actions {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
}

.wb-shadow-layer__actions :deep(.n-button) {
  width: 24px;
  height: 24px;
  margin-left: 0;
  padding: 0;
}

.wb-shadow-layer__grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.wb-shadow-layer__field,
.wb-shadow-layer__color {
  display: grid;
  gap: 4px;
  min-width: 0;
  color: #4b5563;
  font-size: 11px;
  line-height: 16px;
}

.wb-shadow-layer__footer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 8px;
}

.wb-shadow-ctrl__add {
  width: 100%;
  justify-content: center;
  gap: 5px;
}
</style>
