<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import SpacingControl from '../SpacingControl.vue'
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

/** 把简写值按空格分割（不处理 calc()，但足以覆盖常见场景） */
function splitValues(val: string): string[] {
  return val.trim().split(/\s+/).filter(Boolean)
}

/**
 * 从 currentStyles 中解析出某个方向的实际值。
 * 优先级：单项属性 > 逻辑简写（padding-block / padding-inline）> 主简写（padding）
 */
function resolveDir(
  styles: Record<string, string>,
  shorthand: string,
  individualProp: string,
  dir: 'top' | 'right' | 'bottom' | 'left',
): string {
  // 1. 单项属性（最高优先级）
  if (individualProp && styles[individualProp]) return styles[individualProp]

  // 2. 逻辑简写
  if (dir === 'top' || dir === 'bottom') {
    // padding-block / margin-block / border-block-width
    const blockKey =
      shorthand === 'padding'      ? 'padding-block' :
      shorthand === 'margin'       ? 'margin-block' :
      shorthand === 'border-width' ? 'border-block-width' : ''
    if (blockKey && styles[blockKey]) {
      const p = splitValues(styles[blockKey])
      return dir === 'top' ? p[0] : (p[1] ?? p[0])
    }
    // padding-block-start / padding-block-end
    const sideKey = `${blockKey}-${dir === 'top' ? 'start' : 'end'}`
    if (styles[sideKey]) return styles[sideKey]
  }

  if (dir === 'right' || dir === 'left') {
    const inlineKey =
      shorthand === 'padding'      ? 'padding-inline' :
      shorthand === 'margin'       ? 'margin-inline' :
      shorthand === 'border-width' ? 'border-inline-width' : ''
    if (inlineKey && styles[inlineKey]) {
      // inline 简写：start=left, end=right
      const p = splitValues(styles[inlineKey])
      return dir === 'left' ? p[0] : (p[1] ?? p[0])
    }
    const sideKey = `${inlineKey}-${dir === 'left' ? 'start' : 'end'}`
    if (styles[sideKey]) return styles[sideKey]
  }

  // 3. 主简写（padding: A B C D）
  if (styles[shorthand]) {
    const p = splitValues(styles[shorthand])
    if (dir === 'top')    return p[0] ?? ''
    if (dir === 'right')  return p[1] ?? p[0] ?? ''
    if (dir === 'bottom') return p[2] ?? p[0] ?? ''
    if (dir === 'left')   return p[3] ?? p[1] ?? p[0] ?? ''
  }

  return ''
}

// ─── 响应式状态 ───────────────────────────────────────────────────

const unit = ref('px')

const sp = computed(() => props.property.subProperties ?? {})

// 解析各方向 CSS 值（响应 currentStyles 变化）
const cssTop = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveDir(
    props.styleManager.currentStyles.value,
    props.property.id,
    sp.value['top'] ?? '',
    'top',
  )
})
const cssRight = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveDir(
    props.styleManager.currentStyles.value,
    props.property.id,
    sp.value['right'] ?? '',
    'right',
  )
})
const cssBottom = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveDir(
    props.styleManager.currentStyles.value,
    props.property.id,
    sp.value['bottom'] ?? '',
    'bottom',
  )
})
const cssLeft = computed(() => {
  void props.styleManager.currentStyles.value
  return resolveDir(
    props.styleManager.currentStyles.value,
    props.property.id,
    sp.value['left'] ?? '',
    'left',
  )
})

// 从已有值中推断单位
watch(
  [cssTop, cssRight, cssBottom, cssLeft],
  ([t, r, b, l]) => {
    const detected = detectUnit(t) || detectUnit(r) || detectUnit(b) || detectUnit(l)
    if (detected) unit.value = detected
  },
  { immediate: true },
)

watch(() => props.styleManager.selectedComponent.value, () => { unit.value = 'px' })

const displayTop    = computed(() => toDisplay(cssTop.value,    unit.value))
const displayRight  = computed(() => toDisplay(cssRight.value,  unit.value))
const displayBottom = computed(() => toDisplay(cssBottom.value, unit.value))
const displayLeft   = computed(() => toDisplay(cssLeft.value,   unit.value))

// ─── 写回 CSS ─────────────────────────────────────────────────────

function handleChange(
  dirs: Partial<Record<'top' | 'right' | 'bottom' | 'left', string>>,
  newUnit?: string,
) {
  const prev = {
    top:    displayTop.value,
    right:  displayRight.value,
    bottom: displayBottom.value,
    left:   displayLeft.value,
  }

  const u = newUnit ?? unit.value
  if (newUnit) unit.value = newUnit

  const styles: Record<string, string> = {}
  for (const dir of ['top', 'right', 'bottom', 'left'] as const) {
    const cssKey = sp.value[dir]
    if (!cssKey) continue
    const display = dirs[dir] !== undefined ? dirs[dir]! : prev[dir]
    const css = toCss(display, u)
    if (css !== undefined) styles[cssKey] = css
  }

  // 写入单项属性的同时清除可能存在的简写，避免简写覆盖单项
  const shorthand = props.property.id
  if (props.styleManager.currentStyles.value[shorthand]) {
    styles[shorthand] = ''
  }

  props.styleManager.setValues(styles)
}
</script>

<template>
  <SpacingControl
    :top="displayTop"
    :right="displayRight"
    :bottom="displayBottom"
    :left="displayLeft"
    :unit="unit"
    @change="handleChange"
  />
</template>
