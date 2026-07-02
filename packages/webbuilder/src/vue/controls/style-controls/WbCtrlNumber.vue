<script lang="ts" setup>
import { computed } from 'vue'
import { NInputNumber, NSelect } from 'naive-ui'
import type { WbStyleProperty } from '../../config/wbStyleSectors'

// ─── Props / Emits ────────────────────────────────────────────────

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
}>()

// ─── 常量 ─────────────────────────────────────────────────────────

/** 关键字单位：选中后直接写入 CSS，不拼数字 */
const KEYWORD_UNITS = new Set([
  'auto', 'none', 'inherit', 'initial', 'unset',
  'normal', 'max-content', 'min-content', 'fit-content',
])

// ─── 解析 / 组合 ──────────────────────────────────────────────────

/**
 * 将 CSS 值解析为 { num, unit }
 * "16px"  → { num: 16, unit: "px" }
 * "auto"  → { unit: "auto" }
 * "1.5"   → { num: 1.5, unit: "" }
 * ""      → { unit: defaultUnit }
 */
function parseCssValue(cssValue: string, units: string[]): { num?: number; unit: string } {
  const defaultUnit = units[0] ?? ''
  if (!cssValue) return { unit: defaultUnit }

  // 纯关键字（在单位列表中 且 不含数字）
  if ((units.includes(cssValue) || KEYWORD_UNITS.has(cssValue)) && !/\d/.test(cssValue)) {
    return { unit: cssValue }
  }

  // 数字 + 可选单位
  const match = cssValue.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*([a-z%]*)$/i)
  if (match) {
    const num  = Number(match[1])
    const unit = match[2] || ''
    return { num, unit: unit || defaultUnit }
  }

  return { unit: defaultUnit }
}

// ─── 计算属性 ─────────────────────────────────────────────────────

const units = computed(() => props.property.units ?? [])

const parsed = computed(() => parseCssValue(props.modelValue, units.value))

const numPart  = computed(() => parsed.value.num)
const unitPart = computed(() => parsed.value.unit || units.value[0] || '')
const isInteger = computed(() => props.property.type === 'integer')
const unitOptions = computed(() =>
  units.value.map(unit => ({ label: unit || '无', value: unit })),
)

/** 当前单位是关键字（如 auto/none），此时只显示单位选择器 */
const isKeywordUnit = computed(() => KEYWORD_UNITS.has(unitPart.value))

// ─── 事件处理 ─────────────────────────────────────────────────────

function handleNumChange(rawVal: number | undefined): void {
  const newNum = rawVal == null || Number.isNaN(rawVal)
    ? undefined
    : isInteger.value
      ? Math.trunc(rawVal)
      : rawVal
  const unit   = unitPart.value

  if (newNum == null) {
    emit('update:modelValue', '')
    return
  }

  if (units.value.length === 0) {
    // 无单位（opacity、z-index 等）
    emit('update:modelValue', String(newNum))
  } else {
    emit('update:modelValue', `${newNum}${unit}`)
  }
}

function handleUnitChange(newUnit: string): void {
  if (KEYWORD_UNITS.has(newUnit)) {
    // 关键字：直接写入（如 "auto"）
    emit('update:modelValue', newUnit)
  } else {
    const num = numPart.value
    // num 为空（如从 none/auto 切换过来）时，用 0 作为默认值，避免卡死在关键字状态
    emit('update:modelValue', `${num ?? 0}${newUnit}`)
  }
}
</script>

<template>
  <div class="wb-ctrl-number">

    <!-- 关键字单位：仅显示单位选择器 -->
    <NSelect
      v-if="units.length > 0 && isKeywordUnit"
      size="small"
      class="wb-ctrl-number__keyword"
      :value="unitPart"
      :options="unitOptions"
      @update:value="(u) => handleUnitChange(String(u))"
    />

    <template v-else>
      <NInputNumber
        size="small"
        class="wb-ctrl-number__input"
        :value="numPart"
        :min="property.min"
        :max="property.max"
        :step="property.step ?? 1"
        :precision="isInteger ? 0 : undefined"
        :placeholder="property.default ?? ''"
        button-placement="right"
        @update:value="(v) => handleNumChange(v ?? undefined)"
      />

      <NSelect
        v-if="units.length > 0"
        class="wb-ctrl-number__unit"
        size="small"
        :value="unitPart"
        :options="unitOptions"
        @update:value="(u) => handleUnitChange(String(u))"
      />
    </template>

  </div>
</template>

<style scoped>
.wb-ctrl-number {
  display: flex;
  gap: 6px;
  width: 100%;
  min-width: 0;
}

.wb-ctrl-number__input,
.wb-ctrl-number__keyword {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
}

.wb-ctrl-number__unit {
  flex: 0 0 70px;
}
</style>
