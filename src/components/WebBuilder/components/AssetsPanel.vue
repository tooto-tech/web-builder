<script lang="ts" setup>
import { computed, nextTick, reactive, ref, shallowRef } from 'vue'
import { Icon } from '@iconify/vue'
import { ElMessageBox, ElScrollbar } from 'element-plus'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import { deleteFile, getFilePage } from '@/api/infra/file'
import { useUpload } from '@/components/UploadFile/src/useUpload'
import {
  getShopifyStyleUploadFileName,
  renameFileForUpload,
} from '@/components/WebBuilder/utils/uploadFileName'

const loading = ref(false)
const loadingMore = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const list = ref<any[]>([])
const total = ref(0)
const fileInputRef = ref<HTMLInputElement | null>(null)
const listScrollRef = shallowRef<any>(null)
const { httpRequest } = useUpload()

const queryParams = reactive({
  pageNo: 1,
  pageSize: 30,
  type: 'image',
} as PageParam & { type: string })

const imageList = computed(() =>
  list.value.filter((file) => isImage(file.type))
)

const hasMore = computed(() => list.value.length < total.value)

const uploadButtonStyle = computed(() => {
  if (!uploading.value) return undefined
  return {
    background: `linear-gradient(90deg, rgba(34, 81, 255, 0.18) ${uploadProgress.value}%, transparent ${uploadProgress.value}%)`,
  }
})

const isImage = (type: string) => type?.includes('image') || false

const isSvgImage = (type: string) => type?.includes('svg') || false

const getThumbnailUrl = (url: string, type: string) => {
  if (!url || !isImage(type) || isSvgImage(type) || url.includes('?')) {
    return url
  }

  return `${url}?imageMogr2/thumbnail/240x`
}

const scrollToTop = async () => {
  await nextTick()
  listScrollRef.value?.setScrollTop?.(0)
}

const getList = async (append = false) => {
  if (append) {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    const data = await getFilePage(queryParams)
    const nextList = data?.list || []
    list.value = append ? [...list.value, ...nextList] : nextList
    total.value = data?.total || 0
  } finally {
    if (append) loadingMore.value = false
    else loading.value = false
  }
}

const resetAndLoadList = async () => {
  queryParams.pageNo = 1
  list.value = []
  total.value = 0
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

const handleUploadClick = () => {
  fileInputRef.value?.click()
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const selectedFiles = Array.from(files)
  const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
  const invalidFile = selectedFiles.find((file) => !imageTypes.includes(file.type))
  if (invalidFile) {
    ElMessage.error('只允许上传图片格式文件（jpg、png、gif、webp、svg）')
    target.value = ''
    return
  }

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
        },
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
    target.value = ''
  }
}

const previewImage = (file: any) => {
  if (!file?.url) return
  window.open(file.url, '_blank', 'noopener,noreferrer')
}

const removeImage = async (file: any) => {
  if (!file?.id) return

  try {
    await ElMessageBox.confirm(`确认删除文件“${file.name}”吗？`, '删除图片', {
      type: 'warning',
      confirmButtonText: '删除',
      cancelButtonText: '取消',
    })
  } catch {
    return
  }

  try {
    await deleteFile(file.id)
    list.value = list.value.filter((item) => item.id !== file.id)
    total.value = Math.max(0, total.value - 1)
    ElMessage.success('删除成功')
  } catch (error: any) {
    ElMessage.error(error?.message || '删除失败，请重试')
  }
}

resetAndLoadList()
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between border-b px-3 py-3">
      <div class="min-w-0">
        <div class="text-sm font-medium text-gray-700">Assets</div>
        <div class="mt-1 text-xs text-gray-400">{{ imageList.length }}/{{ total }}</div>
      </div>
      <button
        type="button"
        class="inline-flex items-center gap-1 rounded border border-gray-300 px-2 py-1.5 text-xs text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
        :disabled="uploading"
        :style="uploadButtonStyle"
        @click="handleUploadClick"
      >
        <Icon icon="mdi:upload" class="text-sm" />
        <span>{{ uploading ? `上传中 ${uploadProgress}%` : '上传' }}</span>
      </button>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        accept="image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml"
        class="hidden"
        @change="handleFileChange"
      />
    </div>

    <ElScrollbar
      ref="listScrollRef"
      class="min-h-0 flex-1"
      :distance="80"
      @end-reached="handleEndReached"
    >
      <div
        v-loading="loading"
        class="grid grid-cols-3 gap-3 p-3 min-h-full content-start"
        style="min-height: 100%;"
      >
        <div
          v-for="file in imageList"
          :key="file.id"
          role="button"
          tabindex="0"
          class="group relative overflow-hidden rounded border border-gray-200 bg-white text-left transition-colors hover:border-blue-500"
          @click="previewImage(file)"
          @keydown.enter.prevent="previewImage(file)"
          @keydown.space.prevent="previewImage(file)"
        >
          <div
            class="aspect-square overflow-hidden"
            style="background-image: linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%);
background-size: 10px 10px;
background-position: 0 0, 0 5px, 5px -5px, -5px 0;"
          >
            <img
              :src="getThumbnailUrl(file.url, file.type)"
              :alt="file.name"
              class="h-full w-full object-contain"
            />
          </div>
          <div class="border-t border-gray-200 px-2 py-2">
            <div class="truncate text-xs font-medium text-gray-700" :title="file.name">
              {{ file.name }}
            </div>
          </div>

          <button
            type="button"
            class="absolute right-2 top-2 inline-flex size-6 items-center justify-center rounded bg-white/95 text-red-600 opacity-0 shadow-sm transition-opacity group-hover:opacity-100"
            title="删除"
            @click.stop="removeImage(file)"
          >
            <Icon icon="mdi:trash-can-outline" class="text-sm" />
          </button>
        </div>
      </div>

      <div class="px-3 pb-3 text-center text-xs text-gray-400">
        <span v-if="loadingMore">加载更多中...</span>
        <span v-else-if="hasMore">继续下滑加载更多</span>
        <span v-else-if="imageList.length > 0">已加载全部 {{ imageList.length }} 个文件</span>
        <span v-else-if="!loading">暂无图片资源</span>
      </div>
    </ElScrollbar>
  </div>
</template>
