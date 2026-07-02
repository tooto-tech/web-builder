<script lang="ts" setup>
import { computed } from 'vue'
import { ElInput, ElSelect, ElOption } from 'element-plus'
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
 * "16px"  → { num: "16",  unit: "px" }
 * "auto"  → { num: "",    unit: "auto" }
 * "1.5"   → { num: "1.5", unit: "" }
 * ""      → { num: "",    unit: defaultUnit }
 */
function parseCssValue(cssValue: string, units: string[]): { num: string; unit: string } {
  const defaultUnit = units[0] ?? ''
  if (!cssValue) return { num: '', unit: defaultUnit }

  // 纯关键字（在单位列表中 且 不含数字）
  if ((units.includes(cssValue) || KEYWORD_UNITS.has(cssValue)) && !/\d/.test(cssValue)) {
    return { num: '', unit: cssValue }
  }

  // 数字 + 可选单位
  const match = cssValue.match(/^(-?(?:\d+\.?\d*|\.\d+))\s*([a-z%]*)$/i)
  if (match) {
    const num  = match[1]
    const unit = match[2] || ''
    return { num, unit: unit || defaultUnit }
  }

  return { num: cssValue, unit: defaultUnit }
}

// ─── 计算属性 ─────────────────────────────────────────────────────

const units = computed(() => props.property.units ?? [])

const parsed = computed(() => parseCssValue(props.modelValue, units.value))

const numPart  = computed(() => parsed.value.num)
const unitPart = computed(() => parsed.value.unit || units.value[0] || '')

/** 当前单位是关键字（如 auto/none），此时只显示单位选择器 */
const isKeywordUnit = computed(() => KEYWORD_UNITS.has(unitPart.value))

// ─── 事件处理 ─────────────────────────────────────────────────────

function handleNumChange(rawVal: string): void {
  const newNum = rawVal.trim()
  const unit   = unitPart.value

  if (!newNum && newNum !== '0') {
    emit('update:modelValue', '')
    return
  }

  if (units.value.length === 0) {
    // 无单位（opacity、z-index 等）
    emit('update:modelValue', newNum)
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
    emit('update:modelValue', `${num !== '' ? num : '0'}${newUnit}`)
  }
}
</script>

<template>
  <div class="w-full min-w-0">

    <!-- 关键字单位：仅显示单位选择器 -->
    <el-select
      v-if="units.length > 0 && isKeywordUnit"
      size="small"
      class="w-full"
      :model-value="unitPart"
      @update:model-value="(u) => handleUnitChange(String(u))"
    >
      <el-option
        v-for="u in units"
        :key="u"
        :label="u || '无'"
        :value="u"
      />
    </el-select>

    <!-- 数值输入（单位作为 prepend） -->
    <el-input
      v-else
      size="small"
      type="number"
      class="w-full"
      :model-value="numPart"
      :min="property.min"
      :max="property.max"
      :step="property.step ?? 1"
      :placeholder="property.default ?? ''"
      @update:model-value="(v) => handleNumChange(String(v ?? ''))"
    >
      <template v-if="units.length > 0" #append>
        <el-select
          :model-value="unitPart"
          style="width: 72px"
          @update:model-value="(u) => handleUnitChange(String(u))"
        >
          <el-option
            v-for="u in units"
            :key="u"
            :label="u || '无'"
            :value="u"
          />
        </el-select>
      </template>
    </el-input>

  </div>
</template>
