<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

// ─── Props / Emits ────────────────────────────────────────────────

interface Props {
  top: string
  right: string
  bottom: string
  left: string
  unit: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  /**
   * dirs: 哪些方向发生了变化（空对象 = 仅改变单位）
   * unit: 新单位（undefined = 不改变单位）
   */
  change: [dirs: Partial<Record<'top' | 'right' | 'bottom' | 'left', string>>, unit?: string]
}>()

// ─── 工具函数 ─────────────────────────────────────────────────────

const isPlainNumber = (v: string) => /^-?\d*\.?\d+$/.test(v.trim())

/** 只有纯数字（或空）时才显示内置单位 */
const showUnit = (v: string) => {
  const s = v.trim()
  return s === '' || isPlainNumber(s)
}

const normalize = (v: string) => v.trim().replace(/\s+/g, ' ')

// ─── 本地编辑状态 ─────────────────────────────────────────────────

type Dir = 'top' | 'right' | 'bottom' | 'left' | 'all'

const local = reactive({ top: '', right: '', bottom: '', left: '', all: '' })
const focused = reactive<Record<Dir, boolean>>({
  top: false,
  right: false,
  bottom: false,
  left: false,
  all: false
})

// 四个方向：props → local（仅当未聚焦时同步）
const dirs = ['top', 'right', 'bottom', 'left'] as const
dirs.forEach((dir) => {
  watch(
    () => props[dir],
    (v) => {
      if (!focused[dir]) local[dir] = v
    },
    { immediate: true }
  )
})

// 是否联动：四个值均相等且非空
const isLinked = computed(() => {
  const vals = dirs.map((d) => props[d].trim())
  return vals[0] !== '' && vals.every((v) => v === vals[0])
})

// 中央 all 输入：联动时显示当前值，否则显示空
watch(
  [() => props.top, isLinked],
  ([top, linked]) => {
    if (!focused.all) local.all = linked ? (top as string) : ''
  },
  { immediate: true }
)

// ─── 事件处理 ─────────────────────────────────────────────────────

function onFocus(dir: Dir) {
  focused[dir] = true
}

function onBlur(dir: 'top' | 'right' | 'bottom' | 'left') {
  focused[dir] = false
  emit('change', { [dir]: normalize(local[dir]) })
}

function onAllBlur() {
  focused.all = false
  const v = normalize(local.all)
  emit('change', { top: v, right: v, bottom: v, left: v })
}
</script>

<template>
  <div class="sc-grid">
    <!-- 上 -->
    <div class="sc-cell sc-cell--top">
      <div class="sc-field">
        <input
          type="text"
          v-model="local.top"
          placeholder="0"
          @focus="onFocus('top')"
          @blur="onBlur('top')"
        />
        <span v-if="showUnit(local.top)" class="sc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 左 -->
    <div class="sc-cell sc-cell--left">
      <div class="sc-field">
        <input
          type="text"
          v-model="local.left"
          placeholder="0"
          @focus="onFocus('left')"
          @blur="onBlur('left')"
        />
        <span v-if="showUnit(local.left)" class="sc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 中央（全部） -->
    <div class="sc-cell sc-cell--all" :class="{ 'is-linked': isLinked }">
      <div class="sc-field">
        <input
          type="text"
          v-model="local.all"
          placeholder="—"
          @focus="onFocus('all')"
          @blur="onAllBlur()"
        />
        <span v-if="isLinked && showUnit(local.all)" class="sc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 右 -->
    <div class="sc-cell sc-cell--right">
      <div class="sc-field">
        <input
          type="text"
          v-model="local.right"
          placeholder="0"
          @focus="onFocus('right')"
          @blur="onBlur('right')"
        />
        <span v-if="showUnit(local.right)" class="sc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 下 -->
    <div class="sc-cell sc-cell--bottom">
      <div class="sc-field">
        <input
          type="text"
          v-model="local.bottom"
          placeholder="0"
          @focus="onFocus('bottom')"
          @blur="onBlur('bottom')"
        />
        <span v-if="showUnit(local.bottom)" class="sc-unit-badge">{{ unit }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.sc-grid {
  width: 100%;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 5px;
  border-radius: 4px;
}

.sc-cell {
  grid-column-end: span 4;
}

.sc-cell--top {
  grid-column-start: 5;
  grid-row: 1;
}
.sc-cell--left {
  grid-column-start: 1;
  grid-row: 2;
}
.sc-cell--all {
  grid-column-start: 5;
  grid-row: 2;
}
.sc-cell--right {
  grid-column-start: 9;
  grid-row: 2;
}
.sc-cell--bottom {
  grid-column-start: 5;
  grid-row: 3;
}

.sc-field {
  position: relative;
  width: 100%;
}

.sc-field input {
  min-width: 0;
  width: 100%;
  height: 28px;
  border: none;
  outline: none;
  border-radius: 4px;
  padding: 0 20px 0 5px;
  font-size: 12px;
  text-align: center;
  color: #333;
  font-family: inherit;
  transition: box-shadow 0.15s;
  background-color: #fff;
  box-shadow: 0 0 0 1px var(--el-border-color);
}

.sc-field input:focus {
  box-shadow: 0 0 0 1px #3b82f6;
}

.sc-cell--all:not(.is-linked) .sc-field input {
  background: #e8e8e8;
  color: #aaa;
}

.sc-unit-badge {
  position: absolute;
  right: 5px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  line-height: 1;
  color: #888;
  pointer-events: none;
  user-select: none;
}
</style>
