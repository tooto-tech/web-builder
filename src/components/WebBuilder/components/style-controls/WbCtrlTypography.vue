<script setup lang="ts">
import { reactive, watchEffect } from 'vue'
import { ElPopover } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { WbStyleManager } from '../../composables/useWbStyleManager'
import { typographySector } from '../../config/wbStyleSectors'
import WbCtrlColor from './WbCtrlColor.vue'
import WbCtrlFont from './WbCtrlFont.vue'
import WbCtrlSelect from './WbCtrlSelect.vue'
import WbCtrlIconRadio from './WbCtrlIconRadio.vue'

const props = defineProps<{
  styleManager: WbStyleManager
  grapes?: any
}>()

// ─── 配置来源 ─────────────────────────────────────────────────────

const propDef = (id: string) => typographySector.properties.find(p => p.id === id)!

// ─── get / set ────────────────────────────────────────────────────

function get(id: string): string {
  void props.styleManager.currentStyles.value  // 响应式追踪
  return props.styleManager.getValue(id)
}

function set(id: string, v: string) {
  v ? props.styleManager.setValue(id, v) : props.styleManager.clearValue(id)
}

// ─── 数字输入（纯数字自动追加 px，其他原样写入）────────────────────

const isPlain = (v: string) => /^-?\d*\.?\d+$/.test(v.trim())
const showBadge = (v: string) => { const s = v.trim(); return !s || isPlain(s) }

function numDisplay(cssVal: string): string {
  if (!cssVal) return ''
  const m = cssVal.trim().match(/^(-?\d*\.?\d+)px$/)
  if (m) return m[1]
  return cssVal.trim()
}

function numCommit(display: string): string {
  const v = display.trim()
  if (!v) return ''
  if (isPlain(v)) return `${v}px`
  return v
}

// 每个数字字段：本地编辑值 + 聚焦保护
const fontSize      = reactive({ val: '', focused: false })
const lineHeight    = reactive({ val: '', focused: false })
const letterSpacing = reactive({ val: '', focused: false })

watchEffect(() => {
  void props.styleManager.currentStyles.value
  if (!fontSize.focused)      fontSize.val      = numDisplay(get('font-size'))
  if (!lineHeight.focused)    lineHeight.val     = numDisplay(get('line-height'))
  if (!letterSpacing.focused) letterSpacing.val  = numDisplay(get('letter-spacing'))
})

function commit(field: { val: string; focused: boolean }, id: string) {
  field.focused = false
  set(id, numCommit(field.val))
}
</script>

<template>
  <div class="ty-trigger mb-3">
    <span class="text-[10px]">排版</span>


    <el-popover
      trigger="click"
      placement="bottom-end"
      :width="260"
      :show-arrow="false"
      popper-class="ty-popper"
      transition="none"
    >
      <!-- 触发行：label + icon -->
      <template #reference>
        <button type="button" class="ty-trigger-btn" title="配置排版">
          <Icon icon="nimbus:font" />
        </button>
      </template>

      <!-- 弹出面板 -->
      <div class="ty-panel">

        <!-- 颜色 -->
        <div class="ty-row">
          <span class="ty-lbl">颜色</span>
          <WbCtrlColor
            :property="propDef('color')"
            :model-value="get('color')"
            @update:model-value="v => set('color', v)"
          />
        </div>

        <!-- 字体 -->
        <div class="ty-row">
          <span class="ty-lbl">字体</span>
          <WbCtrlFont
            :property="propDef('font-family')"
            :model-value="get('font-family')"
            :grapes="grapes"
            @update:model-value="v => set('font-family', v)"
          />
        </div>

        <!-- 字号 + 字重 -->
        <div class="ty-2col">
          <div class="ty-col">
            <span class="ty-lbl">字号</span>
            <div class="ty-num">
              <input
                type="text"
                v-model="fontSize.val"
                placeholder="—"
                @focus="fontSize.focused = true"
                @blur="commit(fontSize, 'font-size')"
              />
              <span v-if="showBadge(fontSize.val)" class="ty-unit">px</span>
            </div>
          </div>
          <div class="ty-col">
            <span class="ty-lbl">字重</span>
            <WbCtrlSelect
              :property="propDef('font-weight')"
              :model-value="get('font-weight')"
              @update:model-value="v => set('font-weight', v)"
            />
          </div>
        </div>

        <!-- 对齐 -->
        <div class="ty-row">
          <span class="ty-lbl">对齐</span>
          <WbCtrlIconRadio
            :property="propDef('text-align')"
            :model-value="get('text-align')"
            @update:model-value="v => set('text-align', v)"
          />
        </div>

        <!-- 字形 -->
        <div class="ty-row">
          <span class="ty-lbl">字形</span>
          <WbCtrlIconRadio
            :property="propDef('font-style')"
            :model-value="get('font-style')"
            @update:model-value="v => set('font-style', v)"
          />
        </div>

        <!-- 行高 + 字间距 -->
        <div class="ty-2col">
          <div class="ty-col">
            <span class="ty-lbl">行高</span>
            <div class="ty-num">
              <input
                type="text"
                v-model="lineHeight.val"
                placeholder="—"
                @focus="lineHeight.focused = true"
                @blur="commit(lineHeight, 'line-height')"
              />
              <span v-if="showBadge(lineHeight.val)" class="ty-unit">px</span>
            </div>
          </div>
          <div class="ty-col">
            <span class="ty-lbl">字间距</span>
            <div class="ty-num">
              <input
                type="text"
                v-model="letterSpacing.val"
                placeholder="—"
                @focus="letterSpacing.focused = true"
                @blur="commit(letterSpacing, 'letter-spacing')"
              />
              <span v-if="showBadge(letterSpacing.val)" class="ty-unit">px</span>
            </div>
          </div>
        </div>

        <!-- 装饰 + 大小写 -->
        <div class="ty-2col">
          <div class="ty-col">
            <span class="ty-lbl">装饰</span>
            <WbCtrlSelect
              :property="propDef('text-decoration')"
              :model-value="get('text-decoration')"
              @update:model-value="v => set('text-decoration', v)"
            />
          </div>
          <div class="ty-col">
            <span class="ty-lbl">大小写</span>
            <WbCtrlSelect
              :property="propDef('text-transform')"
              :model-value="get('text-transform')"
              @update:model-value="v => set('text-transform', v)"
            />
          </div>
        </div>

        <!-- 空白 -->
        <div class="ty-row">
          <span class="ty-lbl">空白</span>
          <WbCtrlSelect
            :property="propDef('white-space')"
            :model-value="get('white-space')"
            @update:model-value="v => set('white-space', v)"
          />
        </div>

      </div>
    </el-popover>
  </div>

</template>

<style scoped>
/* ── 触发行 ───────────────────────────────────────────────────── */

.ty-trigger {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
}

.ty-trigger-label {
  font-size: 12px;
  font-weight: 500;
  color: #374151;
}

.ty-trigger-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: transparent;
  border-radius: 4px;
  font-size: 15px;
  color: #6b7280;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  flex-shrink: 0;
}

.ty-trigger-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

/* ── 面板内部 ─────────────────────────────────────────────────── */

.ty-panel {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ty-row {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.ty-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.ty-col {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 0;
}

.ty-lbl {
  font-size: 10px;
  color: #9ca3af;
  line-height: 1;
  user-select: none;
}

/* ── 数字输入框 ───────────────────────────────────────────────── */

.ty-num {
  position: relative;
  width: 100%;
}

.ty-num input {
  width: 100%;
  height: 22px;
  border: none;
  outline: none;
  border-radius: 4px;
  padding: 0 22px 0 6px;
  font-size: 12px;
  text-align: center;
  background-color: #fff;
  color: #333;
  font-family: inherit;
  transition: box-shadow 0.15s;
  box-shadow: 0 0 0 1px var(--el-border-color);
}

.ty-num input:focus {
  box-shadow: 0 0 0 1px #3b82f6;
}

.ty-unit {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 10px;
  color: #9ca3af;
  pointer-events: none;
  user-select: none;
}
</style>

<!-- 全局：覆盖 ElPopover 默认 padding -->
<style>
.ty-popper.el-popover {
  padding: 10px !important;
}
</style>
