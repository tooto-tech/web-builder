<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import BorderRadiusControl from '../BorderRadiusControl.vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'
import type { WbStyleManager } from '../../composables/useWbStyleManager'

const props = defineProps<{
  property: WbStyleProperty
  styleManager: WbStyleManager
}>()

// ─── 工具函数 ─────────────────────────────────────────────────────

function detectUnit(v: string): string | null {
  const m = v.trim().match(/^-?\d*\.?\d+(px|%|em|rem|vw|vh)$/)
  return m ? m[1] : null
}

function toDisplay(cssVal: string, unit: string): string {
  if (!cssVal) return ''
  const m = cssVal.trim().match(/^(-?\d*\.?\d+)(px|%|em|rem|vw|vh)$/)
  if (m && m[2] === unit) return m[1]
  return cssVal.trim()
}

function toCss(displayVal: string, unit: string): string {
  const v = displayVal.trim()
  if (!v) return ''
  if (/^-?\d*\.?\d+$/.test(v)) return `${v}${unit}`
  return v
}

function splitValues(val: string): string[] {
  return val.trim().split(/\s+/).filter(Boolean)
}

/**
 * 解析圆角方向值。
 * border-radius 简写顺序：TL TR BR BL（顺时针，从左上开始）
 */
function resolveCorner(
  styles: Record<string, string>,
  shorthand: string,
  individualProp: string,
  corner: 'tl' | 'tr' | 'br' | 'bl',
): string {
  // 1. 单项属性
  if (individualProp && styles[individualProp]) return styles[individualProp]

  // 2. 主简写 border-radius: A B C D
  if (styles[shorthand]) {
    const p = splitValues(styles[shorthand])
    // 顺序：tl=0, tr=1, br=2, bl=3
    if (corner === 'tl') return p[0] ?? ''
    if (corner === 'tr') return p[1] ?? p[0] ?? ''
    if (corner === 'br') return p[2] ?? p[0] ?? ''
    if (corner === 'bl') return p[3] ?? p[1] ?? p[0] ?? ''
  }

  return ''
}

// ─── 响应式状态 ───────────────────────────────────────────────────

const unit = ref('px')
const sp = computed(() => props.property.subProperties ?? {})

const cssTl = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveCorner(props.styleManager.currentStyles.value, props.property.id, sp.value['tl'] ?? '', 'tl')
})
const cssTr = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveCorner(props.styleManager.currentStyles.value, props.property.id, sp.value['tr'] ?? '', 'tr')
})
const cssBr = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveCorner(props.styleManager.currentStyles.value, props.property.id, sp.value['br'] ?? '', 'br')
})
const cssBl = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveCorner(props.styleManager.currentStyles.value, props.property.id, sp.value['bl'] ?? '', 'bl')
})

watch(
  [cssTl, cssTr, cssBr, cssBl],
  ([tl, tr, br, bl]) => {
    const detected = detectUnit(tl) || detectUnit(tr) || detectUnit(br) || detectUnit(bl)
    if (detected) unit.value = detected
  },
  { immediate: true },
)

watch(() => props.styleManager.selectedComponent.value, () => { unit.value = 'px' })

const displayTl = computed(() => toDisplay(cssTl.value, unit.value))
const displayTr = computed(() => toDisplay(cssTr.value, unit.value))
const displayBr = computed(() => toDisplay(cssBr.value, unit.value))
const displayBl = computed(() => toDisplay(cssBl.value, unit.value))

// ─── 写回 CSS ─────────────────────────────────────────────────────

function handleChange(
  dirs: Partial<Record<'tl' | 'tr' | 'br' | 'bl', string>>,
  newUnit?: string,
) {
  const prev = { tl: displayTl.value, tr: displayTr.value, br: displayBr.value, bl: displayBl.value }
  const u = newUnit ?? unit.value
  if (newUnit) unit.value = newUnit

  const styles: Record<string, string> = {}
  for (const corner of ['tl', 'tr', 'br', 'bl'] as const) {
    const cssKey = sp.value[corner]
    if (!cssKey) continue
    const display = dirs[corner] !== undefined ? dirs[corner]! : prev[corner]
    const css = toCss(display, u)
    if (css !== undefined) styles[cssKey] = css
  }

  // 清除简写，避免覆盖单项
  const shorthand = props.property.id
  if (props.styleManager.currentStyles.value[shorthand]) {
    styles[shorthand] = ''
  }

  props.styleManager.setValues(styles)
}
</script>

<template>
  <BorderRadiusControl
    :tl="displayTl"
    :tr="displayTr"
    :br="displayBr"
    :bl="displayBl"
    :unit="unit"
    @change="handleChange"
  />
</template>
