<script lang="ts" setup>
import { ref, reactive, watch, computed, nextTick, shallowRef } from 'vue'
import { Icon } from '@iconify/vue'
import { ElDialog, ElScrollbar } from 'element-plus'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import { getFilePage } from '@/api/infra/file'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import {
  getShopifyStyleUploadFileName,
  renameFileForUpload,
} from '@/components/WebBuilder/utils/uploadFileName'

const props = defineProps<{
  grapes: any
  imageReplacementTarget?: any // 当前要替换的图片组件
  modelValue: boolean // 控制对话框显示/隐藏
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'image-selected', url: string): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const editorRef = shallowRef<any>(null)
props.grapes.onInit((editor: any) => {
  editorRef.value = editor
})

const loading = ref(false)
const loadingMore = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const list = ref<any[]>([])
const total = ref(0)
const hasMore = computed(() => list.value.length < total.value)
const assetFilterType = computed(() => {
  const target = props.imageReplacementTarget
  return typeof target === 'object' && target ? `${target.filterType ?? ''}`.trim() : ''
})
const dialogTitle = computed(() => {
  if (assetFilterType.value === 'svg') return '选择 SVG 资源'
  return '选择图片替换'
})
const uploadAccept = computed(() => {
  return assetFilterType.value === 'svg'
    ? 'image/svg+xml,.svg'
    : 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml'
})
const uploadButtonText = computed(() => assetFilterType.value === 'svg' ? '上传 SVG' : '上传图片')
const uploadButtonStyle = computed(() => {
  if (!uploading.value) return undefined
  return {
    background: `linear-gradient(90deg, rgba(34, 81, 255, 0.18) ${uploadProgress.value}%, transparent ${uploadProgress.value}%)`,
  }
})
const displayList = computed(() => {
  if (assetFilterType.value === 'svg') {
    return list.value.filter(file => isSvgImage(file.type))
  }
  return list.value
})

const queryParams = reactive({
  pageNo: 1,
  pageSize: 30,
  type: 'image',
} as PageParam & { type: string })

const fileInputRef = ref<HTMLInputElement | null>(null)
const listScrollRef = shallowRef<any>(null)
const { httpRequest } = useUpload()

watch(
  [visible, assetFilterType],
  ([newVal]) => {
    if (newVal) {
      resetAndLoadList()
    }
  },
  { immediate: true },
)

const resetListState = () => {
  queryParams.pageNo = 1
  list.value = []
  total.value = 0
}

const scrollToTop = async () => {
  await nextTick()
  listScrollRef.value?.setScrollTop?.(0)
}

// 获取文件列表
const getList = async (append = false) => {
  if (append) {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  } else {
    loading.value = true
  }
  try {
    const data = await getFilePage(queryParams)
    const nextList = data.list || []
    list.value = append ? [...list.value, ...nextList] : nextList
    total.value = data.total || 0
  } catch (error) {
    // 静默处理错误
  } finally {
    if (append) {
      loadingMore.value = false
    } else {
      loading.value = false
    }
  }
}

const resetAndLoadList = async () => {
  resetListState()
  await scrollToTop()
  await getList(false)
}

const loadMore = async () => {
  if (loading.value || loadingMore.value || !hasMore.value) return
  queryParams.pageNo = (queryParams.pageNo ?? 1) + 1
  await getList(true)
}

const handleEndReached = async (direction: string) => {
  if (direction !== 'bottom') return
  await loadMore()
}

// 仅用于替换当前目标图片
const insertImage = (url: string) => {
  if (!props.imageReplacementTarget) return
  emit('image-selected', url)
  visible.value = false
}

// 判断是否为图片
const isImage = (type: string) => {
  return type?.includes('image') || false
}

const isSvgImage = (type: string) => {
  return type?.includes('svg') || false
}

const getThumbnailUrl = (url: string, type: string) => {
  if (!url || !isImage(type) || isSvgImage(type) || url.includes('?')) {
    return url
  }

  return `${url}?imageMogr2/thumbnail/150x`
}

// 触发文件选择
const handleUploadClick = () => {
  fileInputRef.value?.click()
}

// 处理文件选择
const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const selectedFiles = Array.from(files)

  const imageTypes = assetFilterType.value === 'svg'
    ? ['image/svg+xml']
    : ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  const invalidFile = selectedFiles.find(file => !imageTypes.includes(file.type))
  if (invalidFile) {
    ElMessage.error(assetFilterType.value === 'svg'
      ? '只允许上传 SVG 格式文件'
      : '只允许上传图片格式文件（jpg、png、gif、webp、svg）')
    target.value = ''
    return
  }

  // 开始上传
  uploading.value = true
  uploadProgress.value = 0
  try {
    const usedFileNames = new Set<string>()
    const totalFiles = selectedFiles.length
    for (const [index, file] of selectedFiles.entries()) {
      const uploadFileName = getShopifyStyleUploadFileName(file, usedFileNames, index)
      const uploadFile = renameFileForUpload(file, uploadFileName)
      await httpRequest({
        file: uploadFile as any,
        filename: uploadFileName,
        onProgress: (event: any) => {
          const currentFileProgress = Number(event?.percent ?? 0)
          uploadProgress.value = Math.min(100, Math.round(((index + currentFileProgress / 100) / totalFiles) * 100))
        }
      } as any)
      uploadProgress.value = Math.min(100, Math.round(((index + 1) / totalFiles) * 100))
    }

    ElMessage.success(selectedFiles.length > 1 ? `成功上传 ${selectedFiles.length} 个文件` : '上传成功')
    await resetAndLoadList()
  } catch (error: any) {
    ElMessage.error(error?.message || '上传失败，请重试')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    // 清空文件输入
    target.value = ''
  }
}

</script>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="80%"
    align-center
    custom-class="assets-modal"
    :close-on-click-modal="false"
  >
    <div class="flex flex-col" style="height: 600px;">
      <!-- 工具栏 -->
      <div class="px-4 py-3 border-b flex items-center justify-between mb-4">
        <div class="text-sm text-gray-500 tabular-nums">
          {{ displayList.length }}/{{ total }}
        </div>
        <button
          type="button"
          class="px-3 py-1.5 text-sm rounded border border-gray-300 hover:bg-gray-50 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="uploading"
          @click="handleUploadClick"
          :style="uploadButtonStyle"
          :title="uploadButtonText"
        >
          <Icon icon="mdi:upload" class="text-base" />
          <span v-if="uploading">上传中 {{ uploadProgress }}%</span>
          <span v-else>{{ uploadButtonText }}</span>
        </button>
        <!-- 隐藏的文件输入框 -->
        <input
          ref="fileInputRef"
          type="file"
          multiple
          :accept="uploadAccept"
          class="hidden"
          @change="handleFileChange"
        />
      </div>

      <!-- 文件列表 -->
      <ElScrollbar
        ref="listScrollRef"
        class="flex-1 px-4"
        :distance="80"
        @end-reached="handleEndReached"
      >
        <div
          v-loading="loading"
          class="grid grid-cols-9 gap-3 min-h-full content-start"
          style="min-height: 100%;"
        >
          <div
            v-for="file in displayList"
            :key="file.id"
            class="group relative cursor-pointer rounded border border-gray-200 hover:border-blue-500 transition-colors"
            @click="((assetFilterType === 'svg' && isSvgImage(file.type)) || (assetFilterType !== 'svg' && isImage(file.type))) && insertImage(file.url)"
          >
            <!-- 图片预览 -->
            <div
              v-if="isImage(file.type)"
              class="aspect-square overflow-hidden rounded-t"
              style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 10px 10px;
    background-position: 0 0, 0 5px, 5px -5px, -5px 0;"
            >
              <img
                :src="getThumbnailUrl(file.url, file.type)"
                :alt="file.name"
                class="w-full h-full object-contain"
              />
            </div>

            <!-- 非图片文件 -->
            <div v-else class="aspect-square flex items-center justify-center bg-gray-100">
              <Icon icon="mdi:file" class="text-4xl text-gray-400" />
            </div>

            <!-- 文件信息 -->
            <div class="p-2 border-t border-gray-200">
              <div class="text-xs font-medium truncate" :title="file.name">
                {{ file.name }}
              </div>
            </div>

            <!-- 悬停遮罩 -->
            <div
              v-if="isImage(file.type)"
              class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded"
            >
              <Icon icon="mdi:plus-circle" class="text-white text-2xl" />
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-if="!loading && displayList.length === 0" class="text-center py-12 text-gray-400">
          <Icon icon="mdi:folder-open-outline" class="text-5xl mb-3" />
          <div class="text-sm">{{ assetFilterType === 'svg' ? '暂无 SVG 文件' : '暂无文件' }}</div>
        </div>

        <div v-if="displayList.length > 0" class="py-4 text-center text-xs text-gray-400">
          <span v-if="loadingMore">加载更多中...</span>
          <span v-else-if="hasMore">继续下滑加载更多</span>
          <span v-else>已加载全部 {{ total }} 个文件</span>
        </div>
      </ElScrollbar>
    </div>
  </ElDialog>
</template>
