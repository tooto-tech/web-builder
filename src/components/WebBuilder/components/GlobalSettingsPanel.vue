<script lang="ts" setup>
import { computed, onBeforeUnmount, onMounted, nextTick, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { ElInput, ElOption, ElPopover, ElSelect } from 'element-plus'
import { useGlobalColorsStore } from '@/store/modules/globalColors'
import {
  HEADING_LEVELS,
  useGlobalTypographyStore,
  type GlobalHeadingStyle,
  type HeadingLevel,
} from '@/store/modules/globalTypography'
import { useGlobalCustomCssStore } from '@/store/modules/globalCustomCss'
import { useGlobalCustomCodeStore, type CustomCodeSnippet } from '@/store/modules/globalCustomCode'
import WbColorPicker from '@/components/WebBuilder/components/fields/WbColorPicker.vue'
import FontManagerPanel from '@/components/WebBuilder/components/FontManagerPanel.vue'
import { useFontManager } from '@/components/WebBuilder/composables/useFontManager'
import loader from '@monaco-editor/loader'
import type { editor as MonacoEditor } from 'monaco-editor'

const props = defineProps<{
  grapes: any
  isEditorReady?: boolean
}>()

// ── 全局颜色管理 ──────────────────────────────────────────────
const globalColorsStore = useGlobalColorsStore()
const globalTypographyStore = useGlobalTypographyStore()
const globalCustomCssStore = useGlobalCustomCssStore()
const globalCustomCodeStore = useGlobalCustomCodeStore()
const fontManager = useFontManager()

type GlobalSettingsCategoryId = 'colors' | 'fonts' | 'headings' | 'css' | 'code'

const activeCategory = ref<GlobalSettingsCategoryId | null>(null)
const headingLevels = HEADING_LEVELS
const panelRoot = ref<HTMLElement | null>(null)
let touchStartX = 0
let touchStartY = 0

const headingStyleFields: {
  key: keyof GlobalHeadingStyle
  label: string
  placeholder: string
}[] = [
  { key: 'fontSize', label: '字号', placeholder: '48px' },
  { key: 'lineHeight', label: '行高', placeholder: '1.2' },
  { key: 'letterSpacing', label: '字距', placeholder: '0px' },
]

const SYSTEM_FONT_OPTIONS = [
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica Neue' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif', label: 'PingFang SC' },
  { value: '"Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif', label: 'Microsoft YaHei' },
  { value: '"Source Han Sans CN", "Noto Sans CJK SC", "PingFang SC", sans-serif', label: 'Source Han Sans' },
]

const HEADING_WEIGHT_OPTIONS = [
  { value: '300', label: 'Light' },
  { value: '400', label: 'Regular' },
  { value: '500', label: 'Medium' },
  { value: '600', label: 'Semi Bold' },
  { value: '700', label: 'Bold' },
  { value: '800', label: 'Extra Bold' },
]

const HEADING_TRANSFORM_OPTIONS = [
  { value: 'none', label: 'Default' },
  { value: 'uppercase', label: 'Uppercase' },
  { value: 'lowercase', label: 'Lowercase' },
  { value: 'capitalize', label: 'Capitalize' },
]

const HEADING_STYLE_OPTIONS = [
  { value: 'normal', label: 'Default' },
  { value: 'italic', label: 'Italic' },
  { value: 'oblique', label: 'Oblique' },
]

const HEADING_DECORATION_OPTIONS = [
  { value: 'none', label: 'Default' },
  { value: 'underline', label: 'Underline' },
  { value: 'line-through', label: 'Line Through' },
  { value: 'overline', label: 'Overline' },
]

const categoryItems = computed(() => [
  {
    id: 'colors' as const,
    icon: 'lucide:palette',
    title: '全局颜色',
    desc: '管理可复用颜色变量',
    meta: `${globalColorsStore.colors.length} 个颜色`,
  },
  {
    id: 'fonts' as const,
    icon: 'file-icons:font-outline',
    title: '字体管理',
    desc: '管理全局字体和字体资源',
    meta: globalTypographyStore.fontFamily || '默认字体',
  },
  {
    id: 'headings' as const,
    icon: 'lucide:heading',
    title: '标题样式',
    desc: '设置 H1-H6 默认样式变量',
    meta: 'H1-H6',
  },
  {
    id: 'css' as const,
    icon: 'lucide:file-code',
    title: '自定义 CSS',
    desc: '添加全站 CSS 规则',
    meta: globalCustomCssStore.css.trim() ? '已配置' : '未配置',
  },
  {
    id: 'code' as const,
    icon: 'lucide:code',
    title: '自定义代码',
    desc: '发布时注入 Head 或 Body',
    meta: `${globalCustomCodeStore.snippets.length} 个片段`,
  },
])

const headingFontOptions = computed(() => {
  const options = [
    { value: '', label: 'Default' },
    ...(globalTypographyStore.fontFamily
      ? [{ value: globalTypographyStore.fontFamily, label: 'Global Font' }]
      : []),
    ...fontManager.installedFonts.value.map((font) => ({
      value: font.cssFamily,
      label: font.family,
    })),
    ...SYSTEM_FONT_OPTIONS,
  ]
  const seen = new Set<string>()
  return options.filter((option) => {
    if (seen.has(option.value)) return false
    seen.add(option.value)
    return true
  })
})

const activeCategoryItem = computed(() =>
  categoryItems.value.find((item) => item.id === activeCategory.value) ?? null
)

function openCategory(id: GlobalSettingsCategoryId) {
  activeCategory.value = id
  if (id === 'css') {
    nextTick(() => initCssMonaco())
  }
  if (id === 'code' && expandedSnippetId.value) {
    nextTick(() => initCodeMonaco(expandedSnippetId.value as string))
  }
}

function backToCategories() {
  if (activeCategory.value === 'css') {
    disposeCssMonaco()
  }
  if (activeCategory.value === 'code') {
    disposeAllCodeEditors()
  }
  activeCategory.value = null
}

function handlePanelTouchStart(event: TouchEvent) {
  if (activeCategory.value !== 'css') return
  const touch = event.touches[0]
  if (!touch) return
  touchStartX = touch.clientX
  touchStartY = touch.clientY
}

function handlePanelTouchMove(event: TouchEvent) {
  if (activeCategory.value !== 'css') return
  const touch = event.touches[0]
  if (!touch) return
  const deltaX = touch.clientX - touchStartX
  const deltaY = touch.clientY - touchStartY
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 8) {
    event.preventDefault()
  }
}

// ── 编辑状态 ──────────────────────────────────────────────────
/** 当前展开的颜色 ID（展开内联 picker） */
const expandedId = ref<string | null>(null)
const editingName = ref('')
const editingValue = ref('')

function startEdit(color: { id: string; name: string; value: string }) {
  // 若点击同一个则收起
  if (expandedId.value === color.id) {
    expandedId.value = null
    return
  }
  expandedId.value = color.id
  editingName.value = color.name
  editingValue.value = color.value
}

function confirmEdit() {
  if (!expandedId.value) return
  globalColorsStore.updateColor(expandedId.value, {
    name: editingName.value.trim() || editingValue.value,
    value: editingValue.value
  })
  expandedId.value = null
}

function cancelEdit() {
  expandedId.value = null
}

// ── 新增状态 ──────────────────────────────────────────────────
const showAddForm = ref(false)
const newName = ref('')
const newValue = ref('#2251ff')
const addNameInputRef = ref<HTMLInputElement | null>(null)

function openAddForm() {
  showAddForm.value = true
  newName.value = ''
  newValue.value = '#2251ff'
  expandedId.value = null // 关闭其他编辑
}

function confirmAdd() {
  if (!newValue.value) return
  globalColorsStore.addColor(newName.value.trim() || newValue.value, newValue.value)
  showAddForm.value = false
}

function cancelAdd() {
  showAddForm.value = false
}

onMounted(() => {
  panelRoot.value?.addEventListener('touchstart', handlePanelTouchStart, { passive: true })
  panelRoot.value?.addEventListener('touchmove', handlePanelTouchMove, { passive: false })
})

onBeforeUnmount(() => {
  panelRoot.value?.removeEventListener('touchstart', handlePanelTouchStart)
  panelRoot.value?.removeEventListener('touchmove', handlePanelTouchMove)
  disposeCssMonaco()
  // 清理所有代码编辑器
  disposeAllCodeEditors()
})

function updateHeadingValue(level: HeadingLevel, key: keyof GlobalHeadingStyle, value: string) {
  globalTypographyStore.setHeadingStyle(level, {
    [key]: value,
  } as Partial<GlobalHeadingStyle>)
}

function getHeadingSummary(level: HeadingLevel) {
  const style = globalTypographyStore.headingStyles[level]
  return `${style.fontFamily ? 'Custom' : 'Default'} / ${style.fontSize} / ${style.fontWeight}`
}

// ── 自定义 CSS 编辑器 ─────────────────────────────────────────
const cssEditorContainer = ref<HTMLElement | null>(null)
let cssMonacoEditor: MonacoEditor.IStandaloneCodeEditor | null = null
let cssSyncTimer: ReturnType<typeof setTimeout> | null = null

async function initCssMonaco() {
  if (!cssEditorContainer.value || cssMonacoEditor) return

  try {
    const monaco = await loader.init()

    cssMonacoEditor = monaco.editor.create(cssEditorContainer.value, {
      value: globalCustomCssStore.css,
      language: 'css',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'off',
      wrappingIndent: 'none',
      fontSize: 11,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      lineHeight: 17,
      lineNumbers: 'on',
      glyphMargin: false,
      folding: true,
      lineDecorationsWidth: 8,
      lineNumbersMinChars: 3,
      renderLineHighlight: 'line',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      contextmenu: false,
      tabSize: 2,
      suggestOnTriggerCharacters: true,
      quickSuggestions: { other: true, comments: true, strings: true },
      scrollbar: {
        verticalScrollbarSize: 6,
        horizontalScrollbarSize: 8,
        horizontal: 'visible',
        alwaysConsumeMouseWheel: false,
      }
    })

    cssMonacoEditor.onDidChangeModelContent(() => {
      if (cssSyncTimer) clearTimeout(cssSyncTimer)
      cssSyncTimer = setTimeout(() => {
        const value = cssMonacoEditor?.getValue() || ''
        globalCustomCssStore.setCss(value)
      }, 400)
    })
  } catch {
    /* 静默处理 */
  }
}

function disposeCssMonaco() {
  const value = cssMonacoEditor?.getValue()
  if (typeof value === 'string') {
    globalCustomCssStore.setCss(value)
  }
  if (cssSyncTimer) {
    clearTimeout(cssSyncTimer)
    cssSyncTimer = null
  }
  if (cssMonacoEditor) {
    cssMonacoEditor.dispose()
    cssMonacoEditor = null
  }
}

// 当 isEditorReady 变 true 时，store 数据已从 schema 恢复；
// 此时同步 Monaco 编辑器内容
watch(
  () => props.isEditorReady,
  (ready) => {
    if (!ready) return
    if (activeCategory.value === 'css') {
      nextTick(() => initCssMonaco())
    }
    const storeValue = globalCustomCssStore.css
    if (cssMonacoEditor && cssMonacoEditor.getValue() !== storeValue) {
      cssMonacoEditor.setValue(storeValue)
    }
    // 同步自定义代码编辑器
    syncCodeEditorFromStore()
  }
)

// ── 自定义代码片段 ───────────────────────────────────────────────
const POSITION_OPTIONS: { value: CustomCodeSnippet['position']; label: string }[] = [
  { value: 'head', label: 'Head' },
  { value: 'body-start', label: 'Body 前' },
  { value: 'body-end', label: 'Body 后' }
]

const expandedSnippetId = ref<string | null>(null)
const codeEditorRefs = ref<Record<string, HTMLElement | null>>({})
const codeEditors: Record<string, MonacoEditor.IStandaloneCodeEditor> = {}
const codeSyncTimers: Record<string, ReturnType<typeof setTimeout>> = {}

function toggleSnippet(id: string) {
  if (expandedSnippetId.value === id) {
    expandedSnippetId.value = null
    return
  }
  expandedSnippetId.value = id
  nextTick(() => initCodeMonaco(id))
}

function addCodeSnippet() {
  globalCustomCodeStore.addSnippet()
  const last = globalCustomCodeStore.snippets[globalCustomCodeStore.snippets.length - 1]
  if (last) {
    expandedSnippetId.value = last.id
    nextTick(() => initCodeMonaco(last.id))
  }
}

function removeCodeSnippet(id: string) {
  disposeCodeEditor(id)
  globalCustomCodeStore.removeSnippet(id)
  if (expandedSnippetId.value === id) expandedSnippetId.value = null
}

function updateSnippetPosition(id: string, pos: CustomCodeSnippet['position']) {
  globalCustomCodeStore.updateSnippet(id, { position: pos })
}

function toggleSnippetEnabled(id: string, enabled: boolean) {
  globalCustomCodeStore.updateSnippet(id, { enabled })
}

function updateSnippetLabel(id: string, label: string) {
  globalCustomCodeStore.updateSnippet(id, { label })
}

async function initCodeMonaco(id: string) {
  await nextTick()
  const container = codeEditorRefs.value[id]
  if (!container || codeEditors[id]) return

  try {
    const monaco = await loader.init()
    const snippet = globalCustomCodeStore.snippets.find((s) => s.id === id)

    const editor = monaco.editor.create(container, {
      value: snippet?.code || '',
      language: 'html',
      theme: 'vs',
      automaticLayout: true,
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap: 'on',
      fontSize: 12,
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
      lineHeight: 18,
      lineNumbers: 'off',
      glyphMargin: false,
      folding: false,
      lineDecorationsWidth: 4,
      lineNumbersMinChars: 0,
      renderLineHighlight: 'none',
      overviewRulerLanes: 0,
      hideCursorInOverviewRuler: true,
      overviewRulerBorder: false,
      contextmenu: false,
      tabSize: 2,
      scrollbar: { verticalScrollbarSize: 6, horizontalScrollbarSize: 6 }
    })

    editor.onDidChangeModelContent(() => {
      if (codeSyncTimers[id]) clearTimeout(codeSyncTimers[id])
      codeSyncTimers[id] = setTimeout(() => {
        globalCustomCodeStore.updateSnippet(id, { code: editor.getValue() })
      }, 400)
    })

    codeEditors[id] = editor
  } catch {
    /* 静默 */
  }
}

function disposeCodeEditor(id: string) {
  const value = codeEditors[id]?.getValue()
  if (typeof value === 'string') {
    globalCustomCodeStore.updateSnippet(id, { code: value })
  }
  if (codeSyncTimers[id]) clearTimeout(codeSyncTimers[id])
  codeEditors[id]?.dispose()
  delete codeEditors[id]
  delete codeSyncTimers[id]
}

function disposeAllCodeEditors() {
  for (const id of Object.keys(codeEditors)) {
    disposeCodeEditor(id)
  }
}

function syncCodeEditorFromStore() {
  for (const snippet of globalCustomCodeStore.snippets) {
    const ed = codeEditors[snippet.id]
    if (ed && ed.getValue() !== snippet.code) {
      ed.setValue(snippet.code)
    }
  }
}

function getPositionLabel(pos: CustomCodeSnippet['position']) {
  return POSITION_OPTIONS.find((o) => o.value === pos)?.label || pos
}
</script>

<template>
  <div
    ref="panelRoot"
    class="global-settings-panel h-full flex flex-col overflow-hidden bg-white"
    :class="{ 'global-settings-panel--css': activeCategory === 'css' }"
  >
    <div v-if="!activeCategory" class="h-full overflow-y-auto p-3">
      <div class="mb-3">
        <div class="text-sm font-semibold text-gray-800">全局设置</div>
        <div class="mt-1 text-[11px] leading-4 text-gray-400">
          管理全站复用的颜色、字体、CSS 与代码。
        </div>
      </div>

      <div class="space-y-2">
        <button
          v-for="item in categoryItems"
          :key="item.id"
          type="button"
          class="settings-cell"
          @click="openCategory(item.id)"
        >
          <span class="settings-cell__icon">
            <Icon :icon="item.icon" :size="15" />
          </span>
          <span class="settings-cell__body">
            <span class="settings-cell__title">{{ item.title }}</span>
            <span class="settings-cell__desc">{{ item.desc }}</span>
          </span>
          <span class="settings-cell__meta">{{ item.meta }}</span>
          <Icon icon="lucide:chevron-right" :size="14" class="settings-cell__chevron" />
        </button>
      </div>
    </div>

    <template v-else>
      <div class="settings-subpage-header">
        <button
          type="button"
          class="settings-back-btn"
          aria-label="返回全局设置分类"
          @click="backToCategories"
        >
          <Icon icon="lucide:chevron-left" :size="16" />
        </button>
        <div class="min-w-0 flex-1">
          <div class="truncate text-sm font-semibold text-gray-800">
            {{ activeCategoryItem?.title }}
          </div>
          <div class="truncate text-[11px] leading-4 text-gray-400">
            {{ activeCategoryItem?.desc }}
          </div>
        </div>
      </div>

      <div class="settings-subpage-body min-h-0 flex-1 overflow-y-auto">
        <div v-if="activeCategory === 'colors'" class="p-3">
      <!-- 标题 -->
      <div class="flex items-center gap-1.5 mb-3">
        <Icon icon="lucide:palette" :size="14" class="text-gray-500" />
        <span class="text-sm font-semibold text-gray-700">全局颜色</span>
      </div>

      <!-- 颜色列表 -->
      <div class="space-y-1">
        <div v-for="color in globalColorsStore.colors" :key="color.id" class="color-item">
          <!-- 标题行 -->
          <div class="color-item__row">
            <!-- 名称 -->
            <span class="flex-1 text-xs text-gray-700 truncate" :title="color.name">
              {{ color.name }}
            </span>
            <!-- 颜色值 -->
            <span class="text-xs text-gray-400 font-mono">{{ color.value }}</span>
            <button
              class="icon-btn text-gray-400 hover:text-red-500"
              title="删除"
              @click="globalColorsStore.removeColor(color.id)"
            >
              <Icon icon="lucide:trash-2" class="text-xs" />
            </button>
            <!-- 色块 -->
            <div class="size-5 cursor-pointer border p-0.5 rounded-[2px]">
              <div
                class="size-full rounded-[2px]"
                :style="{ background: color.value }"
                :title="color.value"
                @click="startEdit(color)"
              ></div>
            </div>
          </div>

          <!-- 内联编辑面板 -->
          <div v-if="expandedId === color.id" class="color-item__editor">
            <WbColorPicker
              :model-value="editingValue"
              hide-global-colors
              @update:model-value="editingValue = $event || editingValue"
            />
            <div class="editor-footer">
              <input
                v-model="editingName"
                class="name-input flex-1"
                placeholder="颜色名称"
                @keyup.enter="confirmEdit"
                @keyup.esc="cancelEdit"
              />
              <button class="icon-btn text-indigo-500" title="确认" @click="confirmEdit">
                <Icon icon="lucide:check" :size="13" />
              </button>
              <button class="icon-btn text-gray-400" title="取消" @click="cancelEdit">
                <Icon icon="lucide:x" :size="13" />
              </button>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!globalColorsStore.colors.length" class="text-xs text-gray-400 text-center py-3">
          暂无全局颜色
        </div>
      </div>

      <!-- 新增表单 -->
      <div v-if="showAddForm" class="add-form">
        <WbColorPicker
          :model-value="newValue"
          hide-global-colors
          @update:model-value="newValue = $event || newValue"
        />
        <div class="editor-footer">
          <input
            ref="addNameInputRef"
            v-model="newName"
            class="name-input flex-1"
            placeholder="颜色名称（可选）"
            @keyup.enter="confirmAdd"
            @keyup.esc="cancelAdd"
          />
          <button class="icon-btn text-indigo-500" title="确认" @click="confirmAdd">
            <Icon icon="lucide:check" :size="13" />
          </button>
          <button class="icon-btn text-gray-400" title="取消" @click="cancelAdd">
            <Icon icon="lucide:x" :size="13" />
          </button>
        </div>
      </div>

      <!-- 添加按钮 -->
      <button v-if="!showAddForm" class="add-btn" @click="openAddForm">
        <Icon icon="lucide:plus" :size="13" />
        添加颜色
      </button>
        </div>

    <!-- 字体管理面板 -->
        <FontManagerPanel v-else-if="activeCategory === 'fonts'" :grapes="grapes" />

        <div v-else-if="activeCategory === 'headings'" class="p-3">
      <div class="flex items-center gap-1.5 mb-3">
        <Icon icon="lucide:heading" :size="14" class="text-gray-500" />
        <span class="text-sm font-semibold text-gray-700">Typography</span>
      </div>
      <div class="text-[11px] leading-5 text-gray-400 mb-3">
        H1-H6 默认排版通过 CSS 变量输出，例如 --wb-h1-font-size。
      </div>

      <div class="typography-list">
        <section v-for="level in headingLevels" :key="level" class="typography-section">
          <div class="typography-section__title">
            {{ level.toUpperCase() }}
          </div>
          <div class="typography-row">
            <div class="typography-row__label">
              <span>Typography</span>
              <span class="typography-row__summary">{{ getHeadingSummary(level) }}</span>
            </div>
            <div class="typography-action-group">
              <button class="typography-action" type="button" title="使用 CSS 变量">
                <Icon icon="lucide:globe-2" :size="14" />
              </button>
              <el-popover
                placement="left-start"
                trigger="click"
                :width="318"
                popper-class="wb-typography-popover"
              >
                <template #reference>
                  <button class="typography-action typography-action--edit" type="button">
                    <Icon icon="lucide:pencil" :size="14" />
                  </button>
                </template>

                <div class="typography-popover">
                  <div class="typography-popover__header">
                    <span>{{ level.toUpperCase() }} Typography</span>
                    <button
                      class="icon-btn text-gray-400"
                      type="button"
                      title="恢复该层级默认"
                      @click="globalTypographyStore.resetHeadingStyle(level)"
                    >
                      <Icon icon="lucide:rotate-ccw" :size="14" />
                    </button>
                  </div>

                  <div class="typography-popover__preview">
                    <span
                      :style="{
                        fontFamily:
                          globalTypographyStore.headingStyles[level].fontFamily ||
                          globalTypographyStore.fontFamily ||
                          undefined,
                        fontSize: globalTypographyStore.headingStyles[level].fontSize,
                        lineHeight: globalTypographyStore.headingStyles[level].lineHeight,
                        fontWeight: globalTypographyStore.headingStyles[level].fontWeight,
                        textTransform: globalTypographyStore.headingStyles[level].textTransform,
                        fontStyle: globalTypographyStore.headingStyles[level].fontStyle,
                        textDecorationLine:
                          globalTypographyStore.headingStyles[level].textDecoration,
                        letterSpacing: globalTypographyStore.headingStyles[level].letterSpacing,
                      }"
                    >
                      Heading
                    </span>
                  </div>

                  <div class="typography-popover__fields">
                    <label class="typography-field">
                      <span>字体</span>
                      <el-select
                        :model-value="globalTypographyStore.headingStyles[level].fontFamily"
                        class="typography-control"
                        size="small"
                        filterable
                        @change="updateHeadingValue(level, 'fontFamily', $event)"
                      >
                        <el-option
                          v-for="option in headingFontOptions"
                          :key="option.value || 'default'"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </label>

                    <label
                      v-for="field in headingStyleFields"
                      :key="`${level}-${field.key}`"
                      class="typography-field"
                    >
                      <span>{{ field.label }}</span>
                      <el-input
                        :model-value="globalTypographyStore.headingStyles[level][field.key]"
                        class="typography-control"
                        size="small"
                        :placeholder="field.placeholder"
                        @input="updateHeadingValue(level, field.key, $event)"
                      />
                    </label>

                    <label class="typography-field">
                      <span>字重</span>
                      <el-select
                        :model-value="globalTypographyStore.headingStyles[level].fontWeight"
                        class="typography-control"
                        size="small"
                        @change="updateHeadingValue(level, 'fontWeight', $event)"
                      >
                        <el-option
                          v-for="option in HEADING_WEIGHT_OPTIONS"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </label>

                    <label class="typography-field">
                      <span>Transform</span>
                      <el-select
                        :model-value="globalTypographyStore.headingStyles[level].textTransform"
                        class="typography-control"
                        size="small"
                        @change="updateHeadingValue(level, 'textTransform', $event)"
                      >
                        <el-option
                          v-for="option in HEADING_TRANSFORM_OPTIONS"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </label>

                    <label class="typography-field">
                      <span>Style</span>
                      <el-select
                        :model-value="globalTypographyStore.headingStyles[level].fontStyle"
                        class="typography-control"
                        size="small"
                        @change="updateHeadingValue(level, 'fontStyle', $event)"
                      >
                        <el-option
                          v-for="option in HEADING_STYLE_OPTIONS"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </label>

                    <label class="typography-field">
                      <span>Decoration</span>
                      <el-select
                        :model-value="globalTypographyStore.headingStyles[level].textDecoration"
                        class="typography-control"
                        size="small"
                        @change="updateHeadingValue(level, 'textDecoration', $event)"
                      >
                        <el-option
                          v-for="option in HEADING_DECORATION_OPTIONS"
                          :key="option.value"
                          :label="option.label"
                          :value="option.value"
                        />
                      </el-select>
                    </label>
                  </div>
                </div>
              </el-popover>
            </div>
          </div>
        </section>
      </div>

      <button class="add-btn" @click="globalTypographyStore.resetHeadingStyles">
        <Icon icon="lucide:rotate-ccw" :size="13" />
        恢复全部标题默认值
      </button>
        </div>

    <!-- 自定义 CSS -->
        <div v-else-if="activeCategory === 'css'" class="css-settings-page">
      <div class="flex items-center gap-1.5 mb-3 flex-shrink-0">
        <Icon icon="lucide:file-code" :size="14" class="text-gray-500" />
        <span class="text-sm font-semibold text-gray-700">自定义 CSS</span>
      </div>
      <div ref="cssEditorContainer" class="css-editor-container"></div>
        </div>

    <!-- 自定义代码 -->
        <div v-else-if="activeCategory === 'code'" class="p-3">
      <div class="flex items-center gap-1.5 mb-3">
        <Icon icon="lucide:code" :size="14" class="text-gray-500" />
        <span class="text-sm font-semibold text-gray-700">自定义代码</span>
      </div>
      <div class="text-[11px] leading-4 text-gray-400 mb-2">
        添加自定义 HTML / JS 代码片段，发布时注入到页面指定位置。
      </div>

      <!-- 片段列表 -->
      <div class="space-y-1.5">
        <div
          v-for="snippet in globalCustomCodeStore.snippets"
          :key="snippet.id"
          class="code-snippet"
        >
          <!-- 标题行 -->
          <div class="code-snippet__row" @click="toggleSnippet(snippet.id)">
            <Icon
              :icon="
                expandedSnippetId === snippet.id ? 'lucide:chevron-down' : 'lucide:chevron-right'
              "
              :size="12"
              class="text-gray-400 flex-shrink-0"
            />
            <span class="flex-1 text-xs text-gray-700 truncate">
              {{ snippet.label || '未命名代码' }}
            </span>
            <span class="code-snippet__badge">{{ getPositionLabel(snippet.position) }}</span>
            <button
              class="icon-btn text-gray-400 hover:text-gray-600"
              :title="snippet.enabled ? '已启用' : '已禁用'"
              @click.stop="toggleSnippetEnabled(snippet.id, !snippet.enabled)"
            >
              <Icon :icon="snippet.enabled ? 'lucide:eye' : 'lucide:eye-off'" :size="13" />
            </button>
            <button
              class="icon-btn text-gray-400 hover:text-red-500"
              title="删除"
              @click.stop="removeCodeSnippet(snippet.id)"
            >
              <Icon icon="lucide:trash-2" :size="12" />
            </button>
          </div>

          <!-- 展开编辑 -->
          <div v-if="expandedSnippetId === snippet.id" class="code-snippet__editor">
            <div class="code-snippet__fields">
              <input
                :value="snippet.label"
                class="name-input flex-1"
                placeholder="标签名（如 Google Analytics）"
                @input="updateSnippetLabel(snippet.id, ($event.target as HTMLInputElement).value)"
              />
              <select
                :value="snippet.position"
                class="code-snippet__select"
                @change="
                  updateSnippetPosition(
                    snippet.id,
                    ($event.target as HTMLSelectElement).value as CustomCodeSnippet['position']
                  )
                "
              >
                <option v-for="opt in POSITION_OPTIONS" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
            </div>
            <div
              :ref="
                (el) => {
                  codeEditorRefs[snippet.id] = el as HTMLElement
                }
              "
              class="code-editor-container"
            ></div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="!globalCustomCodeStore.snippets.length"
        class="text-xs text-gray-400 text-center py-3"
      >
        暂无自定义代码
      </div>

      <!-- 添加按钮 -->
      <button class="add-btn" @click="addCodeSnippet">
        <Icon icon="lucide:plus" :size="13" />
        添加代码
      </button>
        </div>
      </div>
    </template>
    </div>
</template>

<style scoped lang="scss">
.global-settings-panel {
  overscroll-behavior-x: contain;
}

.global-settings-panel--css {
  touch-action: pan-y;
}

.global-settings-panel--css .settings-subpage-body {
  overflow: hidden;
}

.css-settings-page {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  padding: 12px;
  overflow: hidden;
  overscroll-behavior-x: contain;
}

.settings-cell {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 10px;
  min-height: 58px;
  padding: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease,
    box-shadow 0.15s ease;

  &:hover {
    border-color: #bfd0ff;
    background: #f8fbff;
  }

  &:focus-visible {
    outline: 2px solid rgba(34, 81, 255, 0.28);
    outline-offset: 2px;
  }

  &__icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    border-radius: 6px;
    background: #eef4ff;
    color: #2251ff;
    flex-shrink: 0;
  }

  &__body {
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
  }

  &__title {
    color: #374151;
    font-size: 12px;
    font-weight: 600;
    line-height: 18px;
  }

  &__desc {
    color: #9ca3af;
    font-size: 11px;
    line-height: 16px;
  }

  &__meta {
    max-width: 74px;
    overflow: hidden;
    color: #6b7280;
    font-size: 10px;
    line-height: 16px;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__chevron {
    color: #9ca3af;
    flex-shrink: 0;
  }
}

.settings-subpage-header {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 54px;
  padding: 8px 10px;
  border-bottom: 1px solid #eef0f3;
  background: #fff;
  flex-shrink: 0;
}

.settings-back-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #4b5563;
  background: #fff;
  cursor: pointer;

  &:hover {
    background: #f9fafb;
  }

  &:focus-visible {
    outline: 2px solid rgba(34, 81, 255, 0.28);
    outline-offset: 2px;
  }
}

.color-item {
  border-radius: 6px;
  overflow: hidden;
  border: 1px solid transparent;

  &__row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 2px;
  }

  &__editor {
    border-top: 1px solid #f0f0f0;
    padding-bottom: 6px;
    background: #fafafa;
    border-radius: 0 0 6px 6px;
  }
}

.color-swatch {
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
  cursor: pointer;
  transition: transform 0.15s;

  &:hover {
    transform: scale(1.1);
  }
}

.icon-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border-radius: 4px;
  border: none;
  background: none;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s;

  &:hover {
    background: #f3f4f6;
  }
}

.editor-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 8px 0;
}

.name-input {
  height: 24px;
  padding: 0 6px;
  font-size: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 4px;
  outline: none;
  color: #374151;
  min-width: 0;

  &:focus {
    border-color: #2251ff;
    box-shadow: 0 0 0 2px rgba(34, 81, 255, 0.12);
  }
}

.add-form {
  margin-top: 8px;
  border: 1px solid #d0dfff;
  border-radius: 6px;
  overflow: hidden;
  background: #fafafa;

  .editor-footer {
    border-top: 1px solid #f0f0f0;
    padding: 6px 8px;
  }
}

.typography-list {
  border-top: 1px solid #eef0f3;
}

.typography-section {
  padding: 14px 0;
  border-bottom: 1px solid #eef0f3;

  &__title {
    margin-bottom: 12px;
    color: #374151;
    font-size: 13px;
    font-weight: 700;
    line-height: 18px;
  }
}

.typography-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  &__label {
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 2px;
    color: #4b5563;
    font-size: 13px;
    font-weight: 600;
    line-height: 18px;
  }

  &__summary {
    color: #9ca3af;
    font-size: 10px;
    font-weight: 400;
    line-height: 14px;
  }
}

.typography-action-group {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #d6dbe1;
  border-radius: 5px;
  background: #fff;
}

.typography-action {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 32px;
  border: none;
  border-right: 1px solid #d6dbe1;
  color: #4b5563;
  background: #fff;
  cursor: default;

  &:last-child {
    border-right: 0;
  }

  &--edit {
    background: #eef0f3;
    color: #111827;
    cursor: pointer;

    &:hover {
      background: #e2e5e9;
    }
  }
}

.typography-popover {
  color: #4b5563;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-bottom: 12px;
    color: #374151;
    font-size: 15px;
    font-weight: 700;
    line-height: 22px;
  }

  &__preview {
    display: flex;
    align-items: center;
    min-height: 58px;
    margin-bottom: 12px;
    padding: 10px 12px;
    overflow: hidden;
    border: 1px solid #eef0f3;
    border-radius: 6px;
    background: #fafbfc;

    span {
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  &__fields {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
}

.typography-field {
  display: grid;
  grid-template-columns: 86px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  color: #4b5563;
  font-size: 13px;
  line-height: 18px;
}

.typography-control {
  width: 100%;
}

:deep(.typography-control .el-input__wrapper),
:deep(.typography-control .el-select__wrapper) {
  min-height: 34px;
  border-radius: 5px;
  box-shadow: 0 0 0 1px #d6dbe1 inset;
}

:deep(.typography-control .el-input__wrapper.is-focus),
:deep(.typography-control .el-select__wrapper.is-focused) {
  box-shadow:
    0 0 0 1px #2251ff inset,
    0 0 0 2px rgba(34, 81, 255, 0.12);
}

:deep(.typography-control .el-input__inner),
:deep(.typography-control .el-select__placeholder),
:deep(.typography-control .el-select__selected-item) {
  color: #374151;
  font-size: 13px;
}

:global(.wb-typography-popover) {
  padding: 16px !important;
  border-radius: 6px !important;
  box-shadow: 0 14px 38px rgba(15, 23, 42, 0.18) !important;
}

.css-editor-container {
  min-height: 0;
  height: auto;
  flex: 1;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;
  overscroll-behavior: contain;
  touch-action: pan-y;
}

.code-snippet {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  overflow: hidden;

  &__row {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 8px;
    cursor: pointer;
    transition: background 0.15s;

    &:hover {
      background: #f9fafb;
    }
  }

  &__badge {
    font-size: 10px;
    line-height: 1;
    padding: 2px 6px;
    border-radius: 3px;
    background: #eff6ff;
    color: #3b82f6;
    white-space: nowrap;
    flex-shrink: 0;
  }

  &__editor {
    border-top: 1px solid #f0f0f0;
    background: #fafafa;
  }

  &__fields {
    display: flex;
    gap: 6px;
    padding: 8px 8px 6px;
  }

  &__select {
    height: 24px;
    padding: 0 4px;
    font-size: 11px;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    outline: none;
    color: #374151;
    background: #fff;
    cursor: pointer;
    flex-shrink: 0;

    &:focus {
      border-color: #2251ff;
    }
  }
}

.code-editor-container {
  height: 180px;
  border-top: 1px solid #f0f0f0;
}

.add-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  margin-top: 8px;
  font-size: 12px;
  color: #2251ff;
  border: 1px dashed #a5c0ff;
  border-radius: 5px;
  background: none;
  cursor: pointer;
  width: 100%;
  justify-content: center;
  transition: background 0.15s;

  &:hover {
    background: #e8efff;
  }
}
</style>
