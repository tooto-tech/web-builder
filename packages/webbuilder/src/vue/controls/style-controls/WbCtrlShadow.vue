<script lang="ts" setup>
import { ref, computed, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import WbCtrlColor from './WbCtrlColor.vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'
import type { WbStyleManager } from '../../composables/useWbStyleManager'

const props = defineProps<{
  property: WbStyleProperty
  styleManager: WbStyleManager
}>()

// ─── Shadow layer model ────────────────────────────────────────

interface ShadowLayer {
  h: string
  v: string
  blur: string
  spread: string
  color: string
  inset: boolean
}

function createLayer(): ShadowLayer {
  return { h: '0px', v: '2px', blur: '4px', spread: '0px', color: 'rgba(0,0,0,0.2)', inset: false }
}

// ─── CSS ↔ layers 转换 ────────────────────────────────────────

/** 按顶层逗号分割（不拆 rgba 括号内的逗号） */
function splitTopLevel(str: string): string[] {
  const parts: string[] = []
  let depth = 0, current = ''
  for (const ch of str) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ',' && depth === 0) {
      parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

/** 按空格分词（保留括号内的空格） */
function tokenize(str: string): string[] {
  const tokens: string[] = []
  let depth = 0, current = ''
  for (const ch of str) {
    if (ch === '(') depth++
    else if (ch === ')') depth--
    if (ch === ' ' && depth === 0) {
      if (current) { tokens.push(current); current = '' }
    } else {
      current += ch
    }
  }
  if (current) tokens.push(current)
  return tokens
}

function isLength(t: string): boolean {
  return /^-?\d*\.?\d+(px|em|rem|%|vh|vw|ch|ex|cm|mm|in|pt|pc)?$/.test(t.trim())
}

function parseShadow(css: string): ShadowLayer[] {
  if (!css || css.trim() === 'none' || css.trim() === '') return []
  return splitTopLevel(css).map(part => {
    const inset = /\binset\b/.test(part)
    const cleaned = part.replace(/\binset\b/g, '').replace(/\s+/g, ' ').trim()
    const tokens = tokenize(cleaned)
    const nums: string[] = []
    const colorParts: string[] = []
    for (const t of tokens) {
      if (nums.length < 4 && isLength(t)) {
        nums.push(t)
      } else if (t) {
        colorParts.push(t)
      }
    }
    return {
      h:      nums[0] ?? '0px',
      v:      nums[1] ?? '0px',
      blur:   nums[2] ?? '0px',
      spread: nums[3] ?? '0px',
      color:  colorParts.join(' ') || '#000000',
      inset,
    }
  })
}

function layersToCSS(ls: ShadowLayer[]): string {
  if (!ls.length) return ''
  return ls
    .map(l => `${l.inset ? 'inset ' : ''}${l.h} ${l.v} ${l.blur} ${l.spread} ${l.color}`)
    .join(', ')
}

// ─── 响应式状态 ────────────────────────────────────────────────

const layers = ref<ShadowLayer[]>([])
const expandedIdx = ref<number>(-1)

// 监听外部 CSS 变化 → 同步到 layers
const currentCSS = computed(() => {
  void props.styleManager.currentStyles.value
  return props.styleManager.getValue(props.property.id)
})

let committing = false

watch(
  currentCSS,
  (css) => {
    if (committing) return
    layers.value = parseShadow(css)
  },
  { immediate: true }
)

// ─── 写回 ─────────────────────────────────────────────────────

function commit() {
  committing = true
  const css = layersToCSS(layers.value)
  if (css) {
    props.styleManager.setValue(props.property.id, css)
  } else {
    props.styleManager.clearValue(props.property.id)
  }
  nextTick(() => { committing = false })
}

function addLayer() {
  layers.value.push(createLayer())
  expandedIdx.value = layers.value.length - 1
  commit()
}

function removeLayer(i: number) {
  layers.value.splice(i, 1)
  if (expandedIdx.value >= layers.value.length) {
    expandedIdx.value = layers.value.length - 1
  }
  commit()
}

function updateField(i: number, key: keyof ShadowLayer, value: string | boolean) {
  layers.value[i] = { ...layers.value[i], [key]: value }
  commit()
}
</script>

<template>
  <div class="wb-shadow-ctrl">

    <!-- 无阴影提示 -->
    <div v-if="!layers.length" class="text-xs text-gray-300 italic py-0.5">无阴影</div>

    <!-- 阴影层列表 -->
    <div
      v-for="(layer, i) in layers"
      :key="i"
      class="border rounded mb-1 overflow-hidden text-xs"
    >
      <!-- 层行头：颜色预览 + 简要信息 + 展开/删除按钮 -->
      <div
        class="flex items-center gap-1.5 px-2 py-1 cursor-pointer hover:bg-gray-50 select-none"
        @click="expandedIdx = expandedIdx === i ? -1 : i"
      >
        <span
          class="inline-block w-3 h-3 rounded-sm border flex-shrink-0"
          :style="{ background: layer.color }"
        ></span>
        <span class="flex-1 text-gray-600 truncate">
          {{ layer.inset ? 'inset ' : '' }}{{ layer.h }} {{ layer.v }} {{ layer.blur }}
        </span>
        <Icon
          :icon="expandedIdx === i ? 'lucide:chevron-up' : 'lucide:chevron-down'"
          class="text-gray-400"
          :size="11"
        />
        <button
          type="button"
          class="text-gray-400 hover:text-red-500 transition-colors"
          title="删除"
          @click.stop="removeLayer(i)"
        >
          <Icon icon="lucide:x" :size="12" />
        </button>
      </div>

      <!-- 展开编辑区 -->
      <div v-show="expandedIdx === i" class="px-2 pb-2 pt-1 bg-gray-50 flex flex-col gap-1.5">
        <!-- h / v / blur / spread 四格 -->
        <div class="grid grid-cols-4 gap-1">
          <div v-for="[key, lbl] in [['h','水平'],['v','垂直'],['blur','模糊'],['spread','扩展']]" :key="key">
            <div class="text-[10px] text-gray-400 mb-0.5 text-center">{{ lbl }}</div>
            <input
              type="text"
              :value="(layer as any)[key]"
              class="w-full h-6 px-1 text-xs text-center border rounded focus:outline-none focus:border-blue-400 bg-white"
              @change="updateField(i, key as keyof ShadowLayer, ($event.target as HTMLInputElement).value)"
            />
          </div>
        </div>

        <!-- 颜色 + 内嵌 -->
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-gray-400 w-8 flex-shrink-0">颜色</span>
          <WbCtrlColor
            class="flex-1"
            :property="property"
            :model-value="layer.color"
            @update:model-value="(v) => updateField(i, 'color', v || '#000000')"
          />
          <label class="flex items-center gap-1 text-xs text-gray-600 cursor-pointer flex-shrink-0">
            <input
              type="checkbox"
              :checked="layer.inset"
              class="w-3 h-3 accent-blue-500"
              @change="updateField(i, 'inset', ($event.target as HTMLInputElement).checked)"
            />
            内嵌
          </label>
        </div>
      </div>
    </div>

    <!-- 添加按钮 -->
    <button
      type="button"
      class="w-full text-xs text-gray-500 border border-dashed rounded py-1 mt-0.5 hover:border-blue-400 hover:text-blue-500 transition-colors"
      @click="addLayer"
    >
      + 添加阴影
    </button>

  </div>
</template>
