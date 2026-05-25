<script lang="ts" setup>
import { ref, computed, watch } from 'vue'
import { ElInput, ElTag, ElRadioGroup, ElRadioButton, ElCollapse, ElCollapseItem } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useWbStyleManager, useWbStyleState, useComponentClasses } from '../composables'
import WbSector from './WbSector.vue'
import { WB_STYLE_SECTORS } from '../config/wbStyleSectors'

// ─── Props ────────────────────────────────────────────────────────

const props = defineProps<{
  grapes: any
  imageManager?: any
}>()

// ─── Composables ─────────────────────────────────────────────────

const sm         = useWbStyleManager(props.grapes)
const styleState = useWbStyleState(props.grapes)
const classes    = useComponentClasses(props.grapes)

const activeCollapse = ref<string>(
  WB_STYLE_SECTORS.find(s => s.defaultOpen)?.id ?? ''
)

// ─── CSS 编辑器 ───────────────────────────────────────────────────

const showCssEditor = ref(false)
const cssEditorText = ref('')
const showClassInput = ref(false)

// 打开 CSS 编辑器时同步最新文本
watch(showCssEditor, (open) => {
  if (open) cssEditorText.value = sm.cssText.value
})

// 当外部样式变化时，若编辑器未获焦则同步
watch(sm.cssText, (val) => {
  if (!cssEditorFocused.value) cssEditorText.value = val
})

let cssEditorFocused = ref(false)

const applyCssText = () => {
  sm.setCssFromText(cssEditorText.value)
}

const newClassName = ref('')

const selectorTags = computed(() => {
  return classes.classTags.value.map(className => ({
    key: className,
    label: `.${className}`,
    selected: sm.selectedClasses.value.includes(className),
  }))
})

const idSelectorLabel = computed(() => {
  const comp = sm.selectedComponent.value
  const id = comp?.getAttributes?.()?.id ?? comp?.getId?.()
  return id ? `#${id}` : '#id'
})

const addClassTag = () => {
  const value = newClassName.value.trim().replace(/^\.+/, '').split(/\s+/)[0] ?? ''
  if (!value) return
  if (classes.classTags.value.includes(value)) {
    newClassName.value = ''
    showClassInput.value = false
    return
  }

  classes.setClasses([...classes.classTags.value, value])
  newClassName.value = ''
  showClassInput.value = false
}

const removeClassTag = (className: string) => {
  classes.setClasses(classes.classTags.value.filter(name => name !== className))
}

const openClassInput = () => {
  showClassInput.value = true
}

const closeClassInput = () => {
  if (!newClassName.value.trim()) {
    showClassInput.value = false
  }
}
</script>

<template>
  <!-- 无选中：空状态 -->
  <div
    v-if="!sm.hasSelection.value"
    class="px-3 py-8 text-center text-xs text-gray-400"
  >
    请先选中一个组件
  </div>

  <!-- 有选中：完整面板 -->
  <div v-else>

    <!-- ① 选择器切换 + CSS 编辑器 工具栏 -->
    <div class="px-3 py-2 border-b space-y-2">
      <div class="flex items-start gap-2">
        <span class="pt-1 text-xs font-semibold text-gray-700 flex-shrink-0">选择器</span>
        <div class="flex-1 min-w-0 flex flex-wrap gap-2">
          <el-tag
            class="wb-selector-tag"
            :effect="sm.selectedTargetType.value === 'id' ? 'dark' : 'plain'"
            @click="sm.selectIdTarget"
          >
            {{ idSelectorLabel }}
          </el-tag>
          <el-tag
            v-for="tag in selectorTags"
            :key="tag.key"
            class="wb-selector-tag"
            :effect="tag.selected ? 'dark' : 'plain'"
            closable
            @click="sm.toggleClassTarget(tag.key)"
            @close="removeClassTag(tag.key)"
          >
            {{ tag.label }}
          </el-tag>
          <el-input
            v-if="showClassInput"
            v-model="newClassName"
            size="small"
            class="wb-selector-input"
            placeholder="新增 class"
            @keydown.enter.prevent="addClassTag"
            @keydown.esc.prevent="showClassInput = false; newClassName = ''"
            @blur="closeClassInput"
          />
          <button
            v-else
            type="button"
            class="wb-selector-icon-btn"
            title="新增 class"
            @click="openClassInput"
          >
            <Icon icon="mdi:plus" class="text-[14px]" />
          </button>
        </div>
      </div>

      <div class="flex items-center gap-1">

      <!-- CSS 编辑器按钮 -->
        <button
          title="编辑 CSS 代码"
          class="w-7 h-7 flex items-center justify-center rounded text-xs transition-colors font-mono"
          :class="showCssEditor ? 'bg-purple-100 text-purple-600' : 'text-gray-500 hover:bg-gray-100'"
          @click="showCssEditor = !showCssEditor"
        >
          <Icon icon="mdi:code-braces" class="text-base" />
        </button>

        <span class="ml-auto text-[10px] text-gray-400">
          {{ sm.currentSelector.value || '#id' }}
        </span>
      </div>
    </div>

    <!-- ② 状态切换 -->
    <div class="px-3 py-2 border-b flex items-center gap-2">
      <span class="text-xs font-semibold text-gray-700 flex-shrink-0">状态</span>
      <el-radio-group
        size="small"
        class="ml-auto"
        fill="#d9dde3"
        text-color="#000"
        :model-value="styleState.currentState.value"
        @update:model-value="(v) => styleState.setState(v as any)"
      >
        <el-radio-button label="" value="">默认</el-radio-button>
        <el-radio-button label="hover" value="hover">悬停</el-radio-button>
        <el-radio-button label="focus" value="focus">焦点</el-radio-button>
      </el-radio-group>
    </div>

    <!-- ③ CSS 编辑器 -->
    <div v-if="showCssEditor" class="border-b">
      <textarea
        v-model="cssEditorText"
        class="w-full font-mono text-xs leading-relaxed resize-none outline-none bg-gray-950 text-green-300 p-3"
        style="min-height:160px;aspect-ratio:9/16;tab-size:2;"
        spellcheck="false"
        @focus="cssEditorFocused = true"
        @blur="cssEditorFocused = false; applyCssText()"
        @keydown.ctrl.enter.prevent="applyCssText()"
        @keydown.meta.enter.prevent="applyCssText()"
      ></textarea>
      <div class="px-3 py-1.5 bg-gray-100 flex items-center justify-between">
        <span class="text-[10px] text-gray-400">Ctrl+Enter 应用</span>
        <button
          class="text-xs text-blue-600 hover:text-blue-800 font-medium"
          @click="applyCssText"
        >
          应用
        </button>
      </div>
    </div>

    <!-- ④ Sector 列表（手风琴，CSS 编辑器关闭时显示） -->
    <el-collapse v-if="!showCssEditor" v-model="activeCollapse" accordion class="wb-sector-collapse">
      <el-collapse-item
        v-for="sector in WB_STYLE_SECTORS"
        :key="sector.id"
        :name="sector.id"
        :title="sector.label"
      >
        <WbSector
          :sector="sector"
          :style-manager="sm"
          :image-manager="imageManager"
          :grapes="grapes"
        />
      </el-collapse-item>
    </el-collapse>

  </div>
</template>

<style scoped>
.wb-selector-tag {
  cursor: pointer;
  user-select: none;
}

.wb-selector-icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  flex-shrink: 0;
}

.wb-selector-icon-btn:hover {
  border-color: #93c5fd;
  color: #1d4ed8;
}

.wb-selector-input {
  width: 120px;
}

.wb-sector-collapse {
  border: none;
}

.wb-sector-collapse :deep(.el-collapse-item__header) {
  padding: 0 12px;
  height: 34px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
  border-bottom-color: #e5e7eb;
}

.wb-sector-collapse :deep(.el-collapse-item__wrap) {
  border-bottom-color: #e5e7eb;
}

.wb-sector-collapse :deep(.el-collapse-item__content) {
  padding: 8px 12px 12px;
}
</style>
