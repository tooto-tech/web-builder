<script lang="ts" setup>
import { ref, computed, shallowRef } from 'vue'
import { useRouter } from 'vue-router'
import { Icon } from '@iconify/vue'
import { ElPopover } from 'element-plus'
import DeviceSwitcher from '@/components/WebBuilder/components/DeviceSwitcher.vue'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  loadProjectDataWithPaint,
  waitForProjectLoadPaint,
} from '@/components/WebBuilder/utils/projectLoad'
import { getEditorRuntime } from '@/components/WebBuilder/composables/useEditorRuntime'

const props = defineProps<{
  showLayers: boolean
  showCode: boolean
  isPublishing?: boolean
  grapes: any
  devices: any[]
  selectedDevice: any
  /** 是否处于模板资源（TEMP_*_DETAIL / TEMP_*_CATEGORY_LIST 等）编辑态 */
  isTemplateResource?: boolean
}>()

const emit = defineEmits<{
  (e: 'open-page-settings'): void
  (e: 'toggle-layers'): void
  (e: 'toggle-code'): void
  (e: 'preview'): void
  (e: 'save-draft'): void
  (e: 'publish'): void
  (e: 'browse-projects'): void
  (e: 'reset-editor'): void
  (e: 'set-device', device: any): void
  (e: 'import-start'): void
  (e: 'import-done'): void
}>()

const router = useRouter()
const showPublishPopover = ref(false)
const editorRef = shallowRef<any>(null)
const isDev = import.meta.env.DEV

// 画布组件边框显示状态
const showBorders = ref(false)

function toggleBorders() {
  const editor = editorRef.value
  if (!editor) return
  if (showBorders.value) {
    editor.stopCommand('core:component-outline')
  } else {
    editor.runCommand('core:component-outline')
  }
  showBorders.value = !showBorders.value
}

props.grapes.onInit((editor: any) => {
  editorRef.value = editor
})

// 中间工具按钮配置
const centerButtons = computed(() => [
  {
    id: 'page-settings',
    icon: props.isTemplateResource
      ? 'carbon:task-settings'
      : 'qlementine-icons:page-setup-16',
    ariaLabel: props.isTemplateResource ? 'Template settings' : 'Page settings',
    title: props.isTemplateResource ? '模板设置' : '页面设置',
    emit: 'open-page-settings',
    class: 'w-8 h-8 self-center flex items-center justify-center rounded hover:bg-editor-btn-active text-white',
  },
])

// 右侧工具按钮配置
const rightButtons = [
  ...(isDev
    ? [{
        id: 'reset-editor',
        icon: 'mdi:restore',
        ariaLabel: 'Reset editor',
        emit: 'reset-editor',
        class: 'w-8 h-8 self-center flex items-center justify-center rounded hover:bg-red-500/10 text-red-200 hover:text-red-100',
      }]
    : []),
  ...(isDev
    ? [{
        id: 'code',
        icon: 'carbon:code',
        ariaLabel: 'Toggle code editor',
        ariaPressed: computed(() => props.showCode),
        emit: 'toggle-code',
        class: 'w-8 h-8 self-center flex items-center justify-center rounded hover:bg-editor-btn-hover',
        activeClass: computed(() => props.showCode ? 'bg-editor-btn-active text-white' : 'text-white')
      }]
    : []),
  {
    id: 'layers',
    icon: 'si:layers-line',
    ariaLabel: 'Toggle layers',
    ariaPressed: computed(() => props.showLayers),
    emit: 'toggle-layers',
    class: 'w-8 h-8 self-center flex items-center justify-center rounded hover:bg-editor-btn-hover',
    activeClass: computed(() => props.showLayers ? 'bg-editor-btn-active text-white' : 'text-white')
  },
  {
    id: 'preview',
    icon: 'mdi:eye-outline',
    ariaLabel: 'Preview',
    emit: 'preview',
    class: 'w-8 h-8 self-center flex items-center justify-center rounded hover:bg-[#ffffff29] text-white'
  },
  {
    id: 'save-draft',
    icon: 'fluent:save-16-regular',
    ariaLabel: 'Save draft',
    emit: 'save-draft',
    class: 'w-8 h-8 self-center flex items-center justify-center rounded hover:bg-editor-btn-hover text-white'
  }
]

// 发布下拉菜单项配置
const publishMenuItems = [
  {
    label: '导出',
    icon:'stash:file-export',
    action: () => exportProject(),
    class: 'w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 rounded text-gray-700'
  },
  {
    label: '导入',
    icon:'stash:file-import',
    action: () => importProject(),
    class: 'w-full flex items-center gap-2 text-left px-3 py-2 hover:bg-gray-50 rounded text-gray-700'
  }
]

const handleBackToAdmin = () => {
  // 尝试返回上一页，如果没有历史记录则跳转到页面列表
  if (window.history.length > 1) {
    router.back()
  } else {
    router.push('/')
  }
}

const handleButtonClick = (button: any) => {
  if (button.emit) {
    const emitName = button.emit as keyof typeof emit
    emit(emitName as any)
  } else if (button.action) {
    button.action()
  }
}

// ── 导出：当前项目数据 → .grapesjs 文件 ─────────────────────────────────────
const exportProject = (): void => {
  const editor = editorRef.value
  if (!editor?.getProjectData) {
    ElMessage.warning('编辑器未就绪，无法导出')
    return
  }
  const data = editor.getProjectData()
  const name =
    (editor.Pages?.getSelected?.() as any)?.get?.('name') ||
    (editor.Pages?.getSelected?.() as any)?.get?.('id') ||
    'project'
  const safeName = `${String(name).trim() || 'project'}`.replace(/[/\\?*:|"]/g, '-')
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${safeName}.grapesjs`
  a.click()
  URL.revokeObjectURL(url)
  showPublishPopover.value = false
  ElMessage.success('导出成功')
}

// ── 导入：.grapesjs 文件 → 替换当前画布 ─────────────────────────────────────
const importInputRef = ref<HTMLInputElement | null>(null)

const importProject = (): void => {
  showPublishPopover.value = false
  importInputRef.value?.click()
}

const onImportFileChange = async (e: Event): Promise<void> => {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  const editor = editorRef.value
  if (!editor?.loadProjectData) {
    ElMessage.warning('编辑器未就绪，无法导入')
    return
  }

  return new Promise<void>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        emit('import-start')
        await waitForProjectLoadPaint()
        const raw = ev.target?.result as string
        const data = JSON.parse(raw) as Record<string, any>
        const finishManualLoad = getEditorRuntime(editor).startManualLoad()

        try {
          await loadProjectDataWithPaint(editor, data, { skipUndo: true })
        } finally {
          finishManualLoad()
        }

        editor.clearDirtyCount?.()
        getEditorRuntime(editor).requestCmsPreviewRefresh(600)
        ElMessage.success('导入成功，可保存草稿以持久化')
        emit('import-done')
        emit('save-draft')
        resolve()
      } catch {
        ElMessage.error('无效的 .grapesjs 文件，无法解析 JSON')
        emit('import-done')
        reject(new Error('Invalid .grapesjs file'))
      }
    }
    reader.onerror = () => {
      ElMessage.error('读取文件失败')
      emit('import-done')
      reject(new Error('Failed to read file'))
    }
    reader.readAsText(file)
  })
}
</script>

<template>
  <div class="topbar h-10 flex-shrink-0 bg-editor-panel grid grid-cols-[1fr_auto_1fr] items-center">
    <!-- 左侧区域 -->
    <div class="flex h-full items-center gap-2 relative">
      <div class="h-full mr-3">
        <button
          title="Dashboard"
          class="flex items-center text-xl justify-center h-full px-3.5 py-1 bg-editor-primary text-white hover:bg-blue-600 transition-colors"
          @click="handleBackToAdmin"
        >
          <Icon icon="clarity:dashboard-line" />
        </button>
      </div>
    </div>

    <!-- 中间区域 -->
    <div class="flex gap-3">
      <template v-for="btn in centerButtons" :key="btn.id">
        <button
          type="button"
          :class="btn.class"
          :aria-label="btn.ariaLabel"
          :title="btn.title"
          @click="handleButtonClick(btn)"
        >
          <Icon :icon="btn.icon" />
        </button>
      </template>
      <DeviceSwitcher
        :devices="props.devices"
        :selected-device="props.selectedDevice"
        @select-device="emit('set-device', $event)"
      />
    </div>

    <!-- 右侧区域 -->
    <div class="flex h-full justify-end pl-3 gap-3 relative">
      <input
        ref="importInputRef"
        type="file"
        accept=".grapesjs,application/json"
        class="hidden"
        @change="onImportFileChange"
      />

      <!-- 显示组件边框 -->
      <button
        type="button"
        class="w-8 h-8 self-center flex items-center justify-center rounded hover:bg-editor-btn-hover"
        :class="showBorders ? 'bg-editor-btn-active text-white' : 'text-white'"
        :aria-pressed="showBorders"
        aria-label="Toggle component borders"
        title="显示组件边框"
        @click="toggleBorders"
      >
        <Icon icon="fluent:border-none-16-regular" />
      </button>

      <button
        v-for="btn in rightButtons"
        :key="btn.id"
        type="button"
        :class="[
          btn.class,
          btn.activeClass?.value || ''
        ]"
        :aria-label="btn.ariaLabel"
        :aria-pressed="btn.ariaPressed?.value"
        @click="handleButtonClick(btn)"
      >
        <Icon :icon="btn.icon" />
      </button>

      <!-- 发布按钮组 -->
      <div class="flex">
        <button
          class="h-full flex justify-center items-center gap-2 text-sm px-6 py-1 bg-editor-primary text-white hover:bg-blue-600 transition-opacity disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-editor-primary"
          :disabled="props.isPublishing"
          @click="emit('publish')"
        >
          <Icon v-if="props.isPublishing" icon="mdi:loading" class="animate-spin" />
          {{ props.isPublishing ? '发布中' : '发布' }}
        </button>
        <ElPopover
          v-model:visible="showPublishPopover"
          placement="bottom-end"
          :width="160"
          trigger="click"
          :disabled="props.isPublishing"
        >
          <template #reference>
            <button
              class="h-full flex border-l border-white/20 items-center justify-center px-3 py-1 bg-editor-primary text-white hover:bg-blue-600 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:bg-editor-primary"
              :disabled="props.isPublishing"
            >
              <Icon icon="ep:arrow-down" />
            </button>
          </template>
          <div class="text-sm">
            <button
              v-for="item in publishMenuItems"
              :key="item.label"
              type="button"
              :class="item.class"
              @click="item.action"
            >
              <Icon :icon="item.icon" />
              {{ item.label }}
            </button>
          </div>
        </ElPopover>
      </div>
    </div>
  </div>
</template>
