<script setup lang="ts">
import { computed, reactive, watch } from 'vue'

interface Props {
  tl: string
  tr: string
  br: string
  bl: string
  unit: string
}

const props = defineProps<Props>()

const emit = defineEmits<{
  change: [dirs: Partial<Record<'tl' | 'tr' | 'br' | 'bl', string>>, unit?: string]
}>()

const isPlainNumber = (v: string) => /^-?\d*\.?\d+$/.test(v.trim())
const showUnit = (v: string) => { const s = v.trim(); return s === '' || isPlainNumber(s) }
const normalize = (v: string) => v.trim().replace(/\s+/g, ' ')

type Dir = 'tl' | 'tr' | 'br' | 'bl' | 'all'

const local   = reactive({ tl: '', tr: '', br: '', bl: '', all: '' })
const focused = reactive<Record<Dir, boolean>>({ tl: false, tr: false, br: false, bl: false, all: false })

const corners = ['tl', 'tr', 'br', 'bl'] as const
corners.forEach(c => {
  watch(() => props[c], v => { if (!focused[c]) local[c] = v }, { immediate: true })
})

const isLinked = computed(() => {
  const vals = corners.map(c => props[c].trim())
  return vals[0] !== '' && vals.every(v => v === vals[0])
})

watch(
  [() => props.tl, isLinked],
  ([tl, linked]) => { if (!focused.all) local.all = linked ? (tl as string) : '' },
  { immediate: true },
)

function onFocus(dir: Dir) { focused[dir] = true }

function onBlur(dir: 'tl' | 'tr' | 'br' | 'bl') {
  focused[dir] = false
  emit('change', { [dir]: normalize(local[dir]) })
}

function onAllBlur() {
  focused.all = false
  const v = normalize(local.all)
  emit('change', { tl: v, tr: v, br: v, bl: v })
}
</script>

<template>
  <div class="rc-grid">

    <!-- 左上 -->
    <div class="rc-cell rc-cell--tl">
      <div class="rc-field">
        <input
          type="text"
          v-model="local.tl"
          placeholder="0"
          @focus="onFocus('tl')"
          @blur="onBlur('tl')"
        />
        <span v-if="showUnit(local.tl)" class="rc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 右上 -->
    <div class="rc-cell rc-cell--tr">
      <div class="rc-field">
        <input
          type="text"
          v-model="local.tr"
          placeholder="0"
          @focus="onFocus('tr')"
          @blur="onBlur('tr')"
        />
        <span v-if="showUnit(local.tr)" class="rc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 中间（全部） -->
    <div class="rc-cell rc-cell--all" :class="{ 'is-linked': isLinked }">
      <div class="rc-field">
        <input
          type="text"
          v-model="local.all"
          placeholder="—"
          @focus="onFocus('all')"
          @blur="onAllBlur()"
        />
        <span v-if="isLinked && showUnit(local.all)" class="rc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 左下 -->
    <div class="rc-cell rc-cell--bl">
      <div class="rc-field">
        <input
          type="text"
          v-model="local.bl"
          placeholder="0"
          @focus="onFocus('bl')"
          @blur="onBlur('bl')"
        />
        <span v-if="showUnit(local.bl)" class="rc-unit-badge">{{ unit }}</span>
      </div>
    </div>

    <!-- 右下 -->
    <div class="rc-cell rc-cell--br">
      <div class="rc-field">
        <input
          type="text"
          v-model="local.br"
          placeholder="0"
          @focus="onFocus('br')"
          @blur="onBlur('br')"
        />
        <span v-if="showUnit(local.br)" class="rc-unit-badge">{{ unit }}</span>
      </div>
    </div>

  </div>
</template>

<style scoped>
.rc-grid {
  width: 100%;
  padding: 6px;
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 5px;
  border-radius: 4px;
}

.rc-cell {
  grid-column-end: span 4;
}

.rc-cell--tl  { grid-column-start: 1; grid-row: 1; }
.rc-cell--tr  { grid-column-start: 9; grid-row: 1; }
.rc-cell--all { grid-column-start: 5; grid-row: 2; }
.rc-cell--bl  { grid-column-start: 1; grid-row: 3; }
.rc-cell--br  { grid-column-start: 9; grid-row: 3; }

.rc-field {
  position: relative;
  width: 100%;
}

.rc-field input {
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

.rc-field input:focus {
  box-shadow: 0 0 0 1px #3b82f6;
}

.rc-cell--all:not(.is-linked) .rc-field input {
  background: #e8e8e8;
  color: #aaa;
}

.rc-unit-badge {
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
