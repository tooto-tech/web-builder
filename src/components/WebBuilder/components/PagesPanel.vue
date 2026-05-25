<script lang="ts" setup>
import { computed, ref, nextTick, watch, shallowRef, onBeforeUnmount } from 'vue'
import { Icon } from '@iconify/vue'
import { ElInput, ElPopconfirm, ElDialog, ElSelect, ElOption } from 'element-plus'
import Sortable from 'sortablejs'
import { usePages } from '@/components/WebBuilder/composables'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import { isLayoutPage } from '@/components/WebBuilder/utils/layoutSettings'

const props = defineProps<{
  grapes: any
}>()

const pagesMgr = usePages(props.grapes)
const editingId = ref<string | null>(null)
const editingName = ref('')
const editorRef = shallowRef<any>(null)
const pagesListRef = ref<HTMLElement | null>(null)
const sortableRef = shallowRef<Sortable | null>(null)

props.grapes.onInit((editor: any) => { editorRef.value = editor })

// ── 工具函数 ──────────────────────────────────────────────────────

const getPageId = (page: any) =>
  page?.get?.('id') ?? page?.id ?? page?.get?.('name') ?? page?.name

const getPageLabel = (page: any) =>
  page?.get?.('name') ?? page?.name ?? page?.get?.('id') ?? page?.id ?? 'Page'

const selectedId = computed(() => getPageId(pagesMgr.selected))
const visiblePages = computed(() => pagesMgr.pages.filter((page: any) => !isLayoutPage(page)))

const getRawPage = (page: any) => page?._model ?? page

const toSlug = (name: string): string =>
  name
    .toLowerCase()
    .replace(/&/g, '')
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '')

/** 生成不重复的页面 ID */
const uniqueId = (base: string): string => {
  let id = base
  let counter = 1
  while (pagesMgr.pages.some((p: any) => getPageId(p) === id)) {
    id = `${base}-${counter++}`
  }
  return id
}

// ── 新建页面弹窗 ──────────────────────────────────────────────────

const showAddDialog = ref(false)
const addForm = ref({ name: '', basedOn: '' })

const openAddDialog = () => {
  addForm.value = { name: '', basedOn: '' }
  showAddDialog.value = true
}

/** 页面下拉选项（用于"基于某页面创建"） */
const pageOptions = computed(() =>
  visiblePages.value.map((p: any) => ({
    id: getPageId(p),
    label: getPageLabel(p),
  }))
)

const confirmAdd = () => {
  const name = addForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入页面名称')
    return
  }

  const editor = editorRef.value
  if (!editor) return

  const slug = toSlug(name)
  const id = uniqueId(slug || name.toLowerCase().replace(/\s+/g, '-'))

  // 基于已有页面创建
  let html = ''
  let css = ''
  let baseCustom: Record<string, any> = {}

  if (addForm.value.basedOn) {
    const srcPage = visiblePages.value.find((p: any) => getPageId(p) === addForm.value.basedOn)
    const rawSrc = srcPage ? getRawPage(srcPage) : null
    const srcComponent = rawSrc?.getMainComponent?.()
    if (srcComponent) {
      html = editor.getHtml?.({ component: srcComponent }) || ''
      css = editor.getCss?.({ component: srcComponent, avoidProtected: true }) || ''
      const srcCustom = rawSrc?.get?.('custom') ?? rawSrc?.custom ?? {}
      baseCustom = JSON.parse(JSON.stringify(srcCustom))
    }
  }

  const custom = { ...baseCustom, slug }

  const pageData: any = { id, name, custom }
  if (html) pageData.component = html
  if (css) pageData.styles = css

  const newPage = editor.Pages.add(pageData)
  if (newPage?.set) {
    newPage.set('slug', slug)
  }

  setTimeout(() => {
    pagesMgr.select(id)
  }, 50)

  showAddDialog.value = false
  ElMessage.success(`页面 "${name}" 已创建`)
}

// ── 复制页面弹窗 ──────────────────────────────────────────────────

const showDuplicateDialog = ref(false)
const duplicateForm = ref({ name: '', sourcePageId: '' })

const openDuplicateDialog = (page: any) => {
  const srcName = getPageLabel(page)
  duplicateForm.value = {
    name: `${srcName} (Copy)`,
    sourcePageId: getPageId(page),
  }
  showDuplicateDialog.value = true
}

const confirmDuplicate = () => {
  const name = duplicateForm.value.name.trim()
  if (!name) {
    ElMessage.warning('请输入页面名称')
    return
  }

  const editor = editorRef.value
  if (!editor) return

  const srcPage = visiblePages.value.find(
    (p: any) => getPageId(p) === duplicateForm.value.sourcePageId
  )
  const rawSrc = srcPage ? getRawPage(srcPage) : null
  const srcComponent = rawSrc?.getMainComponent?.()

  if (!srcComponent) {
    ElMessage.warning('无法复制：获取源页面内容失败')
    return
  }

  const slug = toSlug(name)
  const id = uniqueId(slug || name.toLowerCase().replace(/\s+/g, '-'))

  const html = editor.getHtml?.({ component: srcComponent }) || ''
  const css = editor.getCss?.({ component: srcComponent, avoidProtected: true }) || ''

  const srcCustom = rawSrc?.get?.('custom') ?? rawSrc?.custom ?? {}
  const custom = { ...JSON.parse(JSON.stringify(srcCustom)), slug }

  const newPage = editor.Pages.add({
    id,
    name,
    custom,
    component: html,
    styles: css,
  })

  if (newPage?.set) {
    newPage.set('slug', slug)
  }

  setTimeout(() => {
    pagesMgr.select(id)
  }, 100)

  showDuplicateDialog.value = false
  ElMessage.success(`页面 "${name}" 已创建`)
}

// ── 页面选择 ──────────────────────────────────────────────────────

const handleSelectPage = (page: any) => {
  const rawPage = getRawPage(page)
  const pageId = getPageId(page)
  if (rawPage) {
    pagesMgr.select(rawPage)
  } else if (pageId) {
    pagesMgr.select(pageId)
  }
}

// ── 内联编辑名称 ──────────────────────────────────────────────────

const editInputRefs = new Map<string, InstanceType<typeof ElInput>>()

const setEditInputRef = (pageId: string, el: InstanceType<typeof ElInput> | null) => {
  if (el) editInputRefs.set(pageId, el)
  else editInputRefs.delete(pageId)
}

const startEdit = (page: any) => {
  editingId.value = getPageId(page)
  editingName.value = getPageLabel(page)
}

watch(editingId, async (newId) => {
  if (!newId) return
  await nextTick()
  await nextTick()
  const inputRef = editInputRefs.get(newId)
  if (inputRef) {
    const inputEl = (inputRef as any).$el?.querySelector?.('input') as HTMLInputElement | null
    if (inputEl) { inputEl.focus(); inputEl.select(); return }
    if (typeof (inputRef as any).focus === 'function') { (inputRef as any).focus(); return }
  }
  setTimeout(() => {
    const inputEl = document.querySelector(`[data-page-id="${newId}"] input`) as HTMLInputElement | null
    inputEl?.focus(); inputEl?.select()
  }, 50)
})

const cancelEdit = () => { editingId.value = null; editingName.value = '' }

const saveEdit = (page: any) => {
  const name = editingName.value.trim()
  if (!name) return
  if (typeof page?.set === 'function') page.set('name', name)
  else if (page?.name !== undefined) page.name = name
  cancelEdit()
}

const removePage = (page: any) => { pagesMgr.remove(page) }

// ── 页面排序 ──────────────────────────────────────────────────────

const destroySortable = () => {
  sortableRef.value?.destroy?.()
  sortableRef.value = null
}

const initSortable = async () => {
  await nextTick()
  destroySortable()
  if (!pagesListRef.value || visiblePages.value.length < 2) return

  sortableRef.value = Sortable.create(pagesListRef.value, {
    animation: 160,
    draggable: '.page-list-item',
    handle: '.page-drag-handle',
    ghostClass: 'page-list-item--ghost',
    chosenClass: 'page-list-item--chosen',
    dragClass: 'page-list-item--dragging',
    filter: 'input, button, .el-popconfirm, .el-popper, .el-select, .el-input',
    preventOnFilter: false,
    onEnd: (event) => {
      const { oldIndex, newIndex } = event
      if (
        oldIndex === undefined ||
        newIndex === undefined ||
        oldIndex === newIndex
      ) {
        return
      }

      const page = visiblePages.value[oldIndex]
      if (!page) return
      pagesMgr.move(page, newIndex)
    },
  })
}

watch(
  () => visiblePages.value.map((page: any) => getPageId(page)).join('|'),
  () => {
    initSortable()
  },
  { immediate: true }
)

onBeforeUnmount(() => {
  destroySortable()
})
</script>

<template>
  <div class="p-3">
    <!-- 标题行 + 新增按钮 -->
    <div class="flex items-center justify-between mb-3">
      <div class="text-sm font-medium text-gray-700">Pages</div>
      <button
        class="flex items-center gap-1 px-2 py-1 rounded text-xs text-blue-600 hover:bg-blue-50 transition-colors"
        @click="openAddDialog"
        title="New page"
      >
        <Icon icon="lucide:plus" :size="14" />
        <span>New</span>
      </button>
    </div>

    <!-- 页面列表 -->
    <div ref="pagesListRef" class="grid grid-cols-1 gap-1.5">
      <div
        v-for="page in visiblePages"
        :key="getPageId(page)"
        class="page-list-item group h-9 border cursor-pointer rounded-md px-2.5 text-left text-xs relative flex items-center"
        :data-page-id="getPageId(page)"
        :class="selectedId === getPageId(page)
          ? 'bg-blue-50 border-blue-200'
          : 'border-gray-200 hover:bg-gray-50 hover:border-gray-300'"
        @click="handleSelectPage(page)"
      >
        <!-- 编辑模式 -->
        <template v-if="editingId === getPageId(page)">
          <ElInput
            :ref="(el) => setEditInputRef(getPageId(page), el as InstanceType<typeof ElInput>)"
            v-model="editingName"
            size="small"
            class="flex-1"
            :data-page-id="getPageId(page)"
            @keyup.enter="saveEdit(page)"
            @keyup.esc="cancelEdit"
            @click.stop
          />
          <div class="flex items-center gap-0.5 ml-1">
            <button
              class="p-1 rounded hover:bg-green-100 text-gray-500 hover:text-green-600"
              @click.stop="saveEdit(page)"
              title="Save"
            >
              <Icon icon="mdi:check" :size="14" />
            </button>
            <button
              class="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700"
              @click.stop="cancelEdit"
              title="Cancel"
            >
              <Icon icon="mdi:close" :size="14" />
            </button>
          </div>
        </template>

        <!-- 正常模式 -->
        <template v-else>
          <span
            class="page-drag-handle mr-1 -ml-1 p-0.5 rounded text-gray-300 hover:text-gray-500 hover:bg-gray-100 cursor-grab active:cursor-grabbing"
            title="Drag to reorder"
            @click.stop
          >
            <Icon icon="radix-icons:drag-handle-dots-1" :size="14" />
          </span>
          <Icon
            icon="lucide:file-text"
            :size="13"
            class="mr-2 flex-shrink-0"
            :class="selectedId === getPageId(page) ? 'text-blue-500' : 'text-gray-400'"
          />
          <span class="flex-1 leading-[22px] truncate">{{ getPageLabel(page) }}</span>

          <!-- 操作按钮 -->
          <div
            v-if="selectedId !== getPageId(page)"
            class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <button
              class="p-1 rounded hover:bg-blue-100 text-gray-400 hover:text-blue-600"
              @click.stop="openDuplicateDialog(page)"
              title="Duplicate"
            >
              <Icon icon="mdi:content-copy" :size="13" />
            </button>
            <button
              class="p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700"
              @click.stop="startEdit(page)"
              title="Rename"
            >
              <Icon icon="mdi:pencil" :size="13" />
            </button>
            <ElPopconfirm
              title="确定删除此页面？"
              confirm-button-text="删除"
              cancel-button-text="取消"
              @confirm="removePage(page)"
            >
              <template #reference>
                <button
                  class="p-1 rounded hover:bg-red-100 text-gray-400 hover:text-red-500"
                  @click.stop
                  title="Delete"
                >
                  <Icon icon="mdi:delete-outline" :size="13" />
                </button>
              </template>
            </ElPopconfirm>
          </div>
        </template>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="visiblePages.length === 0" class="text-center text-xs text-gray-400 py-6">
      暂无页面
    </div>

    <!-- 新建页面弹窗 -->
    <ElDialog
      v-model="showAddDialog"
      align-center
      title="新建页面"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">页面名称</label>
          <ElInput
            v-model="addForm.name"
            placeholder="例如：About Us"
            @keyup.enter="confirmAdd"
          />
          <div v-if="addForm.name.trim()" class="mt-1 text-[11px] text-gray-400">
            Slug: {{ toSlug(addForm.name.trim()) || '-' }}
          </div>
        </div>
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">基于页面创建</label>
          <ElSelect
            v-model="addForm.basedOn"
            placeholder="空白页面"
            clearable
            class="w-full"
          >
            <ElOption
              v-for="opt in pageOptions"
              :key="opt.id"
              :label="opt.label"
              :value="opt.id"
            />
          </ElSelect>
          <div class="mt-1 text-[11px] text-gray-400">
            不选择则创建空白页面，选择后将复制该页面的内容和样式
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            @click="showAddDialog = false"
          >
            取消
          </button>
          <button
            class="px-4 py-1.5 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="!addForm.name.trim()"
            @click="confirmAdd"
          >
            创建
          </button>
        </div>
      </template>
    </ElDialog>

    <!-- 复制页面弹窗 -->
    <ElDialog
      v-model="showDuplicateDialog"
      title="复制页面"
      width="400px"
      :close-on-click-modal="false"
      append-to-body
      destroy-on-close
    >
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">新页面名称</label>
          <ElInput
            v-model="duplicateForm.name"
            placeholder="输入新页面名称"
            @keyup.enter="confirmDuplicate"
          />
          <div v-if="duplicateForm.name.trim()" class="mt-1 text-[11px] text-gray-400">
            Slug: {{ toSlug(duplicateForm.name.trim()) || '-' }}
          </div>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end gap-2">
          <button
            class="px-4 py-1.5 text-sm rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
            @click="showDuplicateDialog = false"
          >
            取消
          </button>
          <button
            class="px-4 py-1.5 text-sm rounded-md bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50"
            :disabled="!duplicateForm.name.trim()"
            @click="confirmDuplicate"
          >
            复制
          </button>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<style scoped>
.page-list-item--ghost {
  opacity: 0.45;
  background: #eff6ff;
  border-color: #93c5fd;
}

.page-list-item--chosen {
  cursor: grabbing;
}

.page-list-item--dragging {
  box-shadow: 0 8px 18px rgb(15 23 42 / 12%);
}
</style>
