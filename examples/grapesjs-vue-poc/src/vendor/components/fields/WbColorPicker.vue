<script lang="ts" setup>
import { ref, watch, nextTick } from 'vue'
import { Icon } from '@iconify/vue'
import {
  makeGlobalColorVar,
  parseGlobalColorVar,
} from '@/components/WebBuilder/utils/globalSettingsPrimitives'
import { useGlobalSettingsHostDeps } from '@/components/WebBuilder/utils/globalSettingsHostDeps'

const globalSettings = useGlobalSettingsHostDeps()
const globalColors = globalSettings.colors

const props = withDefaults(defineProps<{
  modelValue?: string
  /** 隐藏全局颜色区域（在全局颜色编辑器中使用时传 true） */
  hideGlobalColors?: boolean
}>(), { hideGlobalColors: false })
const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'clear'): void
}>()

// ── 状态 ──────────────────────────────────────────────────────────
const nativeRef = ref<HTMLInputElement | null>(null)
const hexOnly   = ref('#000000')   // 传给 <input type="color">（不含 alpha）
const hexText   = ref('')          // 文本框显示值
const alpha     = ref(100)         // 透明度 0-100
const linkedGlobalId = ref<string | null>(null)

// ── 解析传入的颜色值 ───────────────────────────────────────────────
function parseColor(val: string) {
  if (!val) {
    hexOnly.value = '#000000'
    alpha.value   = 100
    hexText.value = ''
    return
  }
  // 8位 hex #RRGGBBAA
  if (/^#[0-9a-fA-F]{8}$/.test(val)) {
    hexOnly.value = val.slice(0, 7)
    alpha.value   = Math.round(parseInt(val.slice(7, 9), 16) / 255 * 100)
    hexText.value = val
    return
  }
  // 6位 hex
  if (/^#[0-9a-fA-F]{3,6}$/.test(val)) {
    hexOnly.value = val.length === 4
      ? `#${val[1]}${val[1]}${val[2]}${val[2]}${val[3]}${val[3]}`
      : val
    alpha.value   = 100
    hexText.value = val
    return
  }
  // rgba / rgb
  const m = val.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/)
  if (m) {
    const r = parseInt(m[1]).toString(16).padStart(2, '0')
    const g = parseInt(m[2]).toString(16).padStart(2, '0')
    const b = parseInt(m[3]).toString(16).padStart(2, '0')
    hexOnly.value = `#${r}${g}${b}`
    alpha.value   = m[4] ? Math.round(parseFloat(m[4]) * 100) : 100
    hexText.value = val
    return
  }
  // 其他（named color 等）
  hexText.value = val
}

// ── 根据当前状态生成输出值 ──────────────────────────────────────────
function buildOutput(): string {
  if (alpha.value < 100) {
    const a = Math.round(alpha.value / 255 * 100)  // eslint 兼容
    const aa = Math.round(alpha.value / 100 * 255).toString(16).padStart(2, '0')
    void a
    return `${hexOnly.value}${aa}`
  }
  return hexOnly.value
}

// ── 监听外部 modelValue ────────────────────────────────────────────
watch(() => props.modelValue, (val) => {
  if (!val) {
    hexOnly.value = '#000000'
    alpha.value   = 100
    hexText.value = ''
    linkedGlobalId.value = null
    return
  }
  const gcId = parseGlobalColorVar(val)
  if (gcId) {
    linkedGlobalId.value = gcId
    const resolved = globalSettings.colors.value.find(c => c.id === gcId)?.value
    if (resolved) parseColor(resolved)
  } else {
    linkedGlobalId.value = null
    parseColor(val)
  }
}, { immediate: true })

// ── 原生颜色选择器 ────────────────────────────────────────────────
function handleNativeInput(e: Event) {
  const val = (e.target as HTMLInputElement).value
  hexOnly.value = val
  hexText.value = buildOutput()
}
function handleNativeChange(e: Event) {
  const val = (e.target as HTMLInputElement).value
  hexOnly.value = val
  const out = buildOutput()
  hexText.value = out
  linkedGlobalId.value = null
  emit('update:modelValue', out)
}

// ── 透明度 ────────────────────────────────────────────────────────
function handleAlpha(e: Event) {
  alpha.value = parseInt((e.target as HTMLInputElement).value)
  const out = buildOutput()
  hexText.value = out
  emit('update:modelValue', out)
}

// ── 文本框直接输入 ──────────────────────────────────────────────
function applyText() {
  const val = hexText.value.trim()
  if (!val) return
  linkedGlobalId.value = null
  parseColor(val)
  emit('update:modelValue', val)
}

// ── 清除 ──────────────────────────────────────────────────────────
function clearColor() {
  hexOnly.value = '#000000'
  alpha.value   = 100
  hexText.value = ''
  linkedGlobalId.value = null
  emit('clear')
  emit('update:modelValue', '')
}

// ── 屏幕取色 ─────────────────────────────────────────────────────
const hasEyeDropper = 'EyeDropper' in window

async function pickWithEyedropper() {
  try {
    const result = await new (window as any).EyeDropper().open()
    hexOnly.value = result.sRGBHex
    alpha.value   = 100
    hexText.value = result.sRGBHex
    linkedGlobalId.value = null
    emit('update:modelValue', result.sRGBHex)
  } catch { /* user cancelled */ }
}

// ── 全局颜色 ──────────────────────────────────────────────────────
function selectGlobalColor(gc: { id: string; value: string }) {
  linkedGlobalId.value = gc.id
  parseColor(gc.value)
  emit('update:modelValue', makeGlobalColorVar(gc.id))
}

// ── 添加全局颜色 ───────────────────────────────────────────────────
const showAddGlobal    = ref(false)
const addGlobalName    = ref('')
const addGlobalInputRef = ref<HTMLInputElement | null>(null)

function openAddGlobal() {
  addGlobalName.value = hexText.value || hexOnly.value
  showAddGlobal.value = true
  nextTick(() => addGlobalInputRef.value?.select())
}
function confirmAddGlobal() {
  if (!addGlobalName.value.trim()) return
  globalSettings.addColor(addGlobalName.value.trim(), hexOnly.value)
  showAddGlobal.value = false
  addGlobalName.value = ''
}
function cancelAddGlobal() {
  showAddGlobal.value = false
  addGlobalName.value = ''
}
</script>

<template>
  <div class="wb-color-picker" @mousedown.stop @pointerdown.stop>

    <!-- 颜色输入行 -->
    <div class="color-row">
      <!-- 隐藏的原生颜色选择器 -->
      <input
        ref="nativeRef"
        type="color"
        :value="hexOnly"
        class="native-input"
        tabindex="-1"
        @input="handleNativeInput"
        @change="handleNativeChange"
      />
      <!-- 色块预览，点击触发原生 picker -->
      <div
        class="swatch"
        :style="{ background: modelValue || '#000' }"
        title="点击选色"
        @click="nativeRef?.click()"
      ></div>
      <!-- Hex 文本输入 -->
      <input
        v-model="hexText"
        type="text"
        class="hex-input"
        placeholder="#000000"
        spellcheck="false"
        @blur="applyText"
        @keyup.enter="applyText"
      />
      <!-- 清除 -->
      <button class="tool-btn" title="清除颜色" @click="clearColor">
        <Icon icon="lucide:rotate-ccw" :size="13" />
      </button>
      <!-- 屏幕取色 -->
      <button v-if="hasEyeDropper" class="tool-btn" title="屏幕取色" @click="pickWithEyedropper">
        <Icon icon="lucide:pipette" :size="13" />
      </button>
    </div>

    <!-- 透明度 -->
    <div class="alpha-row">
      <span class="alpha-label">透明度</span>
      <input
        type="range"
        :value="alpha"
        min="0"
        max="100"
        step="1"
        class="alpha-slider"
        @input="handleAlpha"
        @change="handleAlpha"
      />
      <span class="alpha-value">{{ alpha }}%</span>
    </div>

    <!-- 已联结全局颜色标记 -->
    <div v-if="linkedGlobalId" class="linked-badge">
      <Icon icon="lucide:link" :size="10" />
      <span>{{ globalColors.find(c => c.id === linkedGlobalId)?.name ?? '全局颜色' }}</span>
    </div>

    <!-- 全局颜色区域 -->
    <div v-if="!hideGlobalColors" class="global-section">
      <div class="global-header">
        <span class="global-title">
          <Icon icon="lucide:globe" :size="11" class="mr-1" />
          全局颜色
        </span>
        <button class="add-global-btn" title="将当前颜色加入全局" @click="openAddGlobal">
          <Icon icon="lucide:plus" :size="11" />
        </button>
      </div>

      <div v-if="showAddGlobal" class="add-global-form">
        <input
          ref="addGlobalInputRef"
          v-model="addGlobalName"
          class="add-global-input"
          placeholder="颜色名称"
          @keyup.enter="confirmAddGlobal"
          @keyup.esc="cancelAddGlobal"
        />
        <button class="add-global-confirm" @click="confirmAddGlobal">
          <Icon icon="lucide:check" :size="11" />
        </button>
        <button class="add-global-cancel" @click="cancelAddGlobal">
          <Icon icon="lucide:x" :size="11" />
        </button>
      </div>

      <div v-if="globalColors.length > 0" class="global-swatches">
        <div
          v-for="gc in globalColors"
          :key="gc.id"
          class="global-swatch"
          :class="{ 'global-swatch--active': linkedGlobalId === gc.id }"
          :title="gc.name"
          @click="selectGlobalColor(gc)"
        >
          <div class="global-swatch-inner" :style="{ background: gc.value }" ></div>
        </div>
      </div>
      <div v-else class="global-empty">暂无全局颜色，点击 + 添加</div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.wb-color-picker {
  width: 240px;
  font-size: 12px;
  user-select: none;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── 颜色输入行 ── */
.color-row {
  display: flex;
  align-items: center;
  gap: 5px;
}

.native-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
  width: 0;
  height: 0;
  border: none;
  padding: 0;
}

.swatch {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  border-radius: 5px;
  border: 1px solid rgba(0,0,0,.15);
  cursor: pointer;
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 6px 6px;
  background-position: 0 0, 0 3px, 3px -3px, -3px 0;
  background-clip: padding-box;
  position: relative;

  &::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 4px;
    background: inherit;
    background-image: none;
  }

  &:hover { opacity: .85; }
}

.hex-input {
  flex: 1;
  min-width: 0;
  height: 28px;
  padding: 0 6px;
  font-size: 11px;
  font-family: monospace;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  outline: none;
  color: #374151;
  background: #fff;

  &:focus { border-color: #2251ff; }
}

.tool-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  cursor: pointer;
  flex-shrink: 0;

  &:hover { background: #f3f4f6; color: #111827; }
}

/* ── 透明度 ── */
.alpha-row {
  display: flex;
  align-items: center;
  gap: 6px;
}

.alpha-label {
  font-size: 10px;
  color: #9ca3af;
  flex-shrink: 0;
}

.alpha-slider {
  flex: 1;
  height: 4px;
  accent-color: #2251ff;
  cursor: pointer;
}

.alpha-value {
  font-size: 10px;
  color: #6b7280;
  width: 30px;
  text-align: right;
  flex-shrink: 0;
}

/* ── 联结标记 ── */
.linked-badge {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 10px;
  color: #1a3fd4;
  background: #e8efff;
  border: 1px solid #a5c0ff;
  border-radius: 4px;
  padding: 2px 6px;
  overflow: hidden;
  white-space: nowrap;
}

/* ── 全局颜色 ── */
.global-section {
  border-top: 1px solid #f0f0f0;
  padding-top: 8px;
}

.global-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
}

.global-title {
  display: flex;
  align-items: center;
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.add-global-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  border: 1px solid #e5e7eb;
  background: #fff;
  color: #6b7280;
  cursor: pointer;

  &:hover { background: #f0f5ff; border-color: #2251ff; color: #1a3fd4; }
}

.add-global-form {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
}

.add-global-input {
  flex: 1;
  height: 22px;
  padding: 0 5px;
  font-size: 11px;
  border: 1px solid #e5e7eb;
  border-radius: 3px;
  outline: none;

  &:focus { border-color: #2251ff; }
}

.add-global-confirm {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px;
  border-radius: 3px; border: 1px solid #2251ff;
  background: #2251ff; color: #fff; cursor: pointer;
  &:hover { background: #1a3fd4; }
}

.add-global-cancel {
  display: flex; align-items: center; justify-content: center;
  width: 22px; height: 22px;
  border-radius: 3px; border: 1px solid #e5e7eb;
  background: #fff; color: #6b7280; cursor: pointer;
  &:hover { background: #f3f4f6; }
}

.global-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.global-swatch {
  width: 20px;
  height: 20px;
  border-radius: 3px;
  cursor: pointer;
  padding: 2px;
  border: 1px solid transparent;
  transition: all 0.15s;
  background-image:
    linear-gradient(45deg, #ccc 25%, transparent 25%),
    linear-gradient(-45deg, #ccc 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #ccc 75%),
    linear-gradient(-45deg, transparent 75%, #ccc 75%);
  background-size: 6px 6px;
  background-position: 0 0, 0 3px, 3px -3px, -3px 0;

  &:hover { border-color: #2251ff; transform: scale(1.1); }
  &--active { border-color: #1a3fd4 !important; box-shadow: 0 0 0 2px rgba(34,81,255,.35); }
}

.global-swatch-inner {
  width: 100%; height: 100%; border-radius: 1px;
}

.global-empty {
  font-size: 11px;
  color: #9ca3af;
  text-align: center;
  padding: 4px 0;
}
</style>
