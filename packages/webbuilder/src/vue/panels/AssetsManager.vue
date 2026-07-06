<script setup lang="ts">
import { computed, nextTick, ref, shallowRef, watch } from 'vue'
import { Icon } from '@iconify/vue'
import { NButton, NInput, NScrollbar, NSpin } from 'naive-ui'
import type { HostUi, MediaAssetRecord, MediaService } from '../../core/index.js'
import {
  getMediaAssetThumbnailUrl,
  mediaAssetMatchesFilter,
  normalizeMediaAssetPage,
} from '../mediaAssets.js'

const props = withDefaults(defineProps<{
  variant?: 'panel' | 'modal'
  title?: string
  initialRecords?: MediaAssetRecord[]
  types?: string[]
  mediaService?: MediaService
  ui?: HostUi
}>(), {
  variant: 'panel',
  title: 'Assets',
  initialRecords: () => [],
  types: () => [],
  mediaService: () => ({}),
  ui: () => ({
    confirm: async () => false,
    message: {
      success: () => undefined,
      warning: () => undefined,
      info: () => undefined,
      error: () => undefined,
    },
  }),
})

const emit = defineEmits<{
  (event: 'select', asset: MediaAssetRecord): void
}>()

const loading = ref(false)
const loadingMore = ref(false)
const uploading = ref(false)
const uploadProgress = ref(0)
const keyword = ref('')
const pageNo = ref(1)
const pageSize = 30
const total = ref(0)
const assets = shallowRef<MediaAssetRecord[]>([])
const fileInputRef = ref<HTMLInputElement | null>(null)
const scrollbarRef = shallowRef<InstanceType<typeof NScrollbar> | null>(null)

const assetFilterType = computed(() =>
  props.types.some(type => type.includes('svg')) ? 'svg' : 'image',
)

const uploadAccept = computed(() =>
  assetFilterType.value === 'svg'
    ? 'image/svg+xml,.svg'
    : 'image/jpeg,image/jpg,image/png,image/gif,image/webp,image/svg+xml',
)

const uploadText = computed(() => {
  if (!uploading.value) return assetFilterType.value === 'svg' ? 'Upload SVG' : 'Upload'
  return `Uploading ${uploadProgress.value}%`
})

const canUpload = computed(() => typeof props.mediaService.uploadAssets === 'function')
const canDelete = computed(() => typeof props.mediaService.deleteAsset === 'function')

const displayAssets = computed(() =>
  assets.value.filter(asset => mediaAssetMatchesFilter(asset, assetFilterType.value)),
)

const hasMore = computed(() => assets.value.length < total.value)

const uploadButtonStyle = computed(() => {
  if (!uploading.value) return undefined
  return {
    background: `linear-gradient(90deg, rgba(34, 81, 255, 0.16) ${uploadProgress.value}%, transparent ${uploadProgress.value}%)`,
  }
})

const resetScroll = async () => {
  await nextTick()
  scrollbarRef.value?.scrollTo?.({ top: 0 })
}

const setAssetsFromInitialRecords = () => {
  assets.value = [...props.initialRecords]
  total.value = props.initialRecords.length
}

const loadAssets = async (append = false) => {
  if (append) {
    if (loading.value || loadingMore.value || !hasMore.value) return
    loadingMore.value = true
  } else {
    loading.value = true
  }

  try {
    if (!props.mediaService.loadAssets) {
      setAssetsFromInitialRecords()
      return
    }

    const page = append ? pageNo.value + 1 : 1
    const result = await props.mediaService.loadAssets({
      pageNo: page,
      pageSize,
      type: 'image',
      filterType: assetFilterType.value,
      keyword: keyword.value.trim() || undefined,
    })
    const normalized = normalizeMediaAssetPage(result)
    pageNo.value = page
    assets.value = append ? [...assets.value, ...normalized.list] : normalized.list
    total.value = normalized.total
  } catch (error) {
    props.ui.message.error(error instanceof Error ? error.message : 'Failed to load assets')
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const resetAndLoadAssets = async () => {
  pageNo.value = 1
  assets.value = []
  total.value = 0
  await resetScroll()
  await loadAssets(false)
}

const openFileDialog = () => {
  fileInputRef.value?.click()
}

const isValidUploadFile = (file: File) => {
  if (assetFilterType.value === 'svg') {
    return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')
  }
  return file.type.startsWith('image/')
}

const handleFileChange = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = Array.from(target.files ?? [])
  if (!files.length) return

  const invalidFile = files.find(file => !isValidUploadFile(file))
  if (invalidFile) {
    props.ui.message.error(assetFilterType.value === 'svg'
      ? 'Only SVG files can be uploaded here'
      : 'Only image files can be uploaded')
    target.value = ''
    return
  }

  uploading.value = true
  uploadProgress.value = 0
  try {
    const result = await props.mediaService.uploadAssets?.(files, {
      filterType: assetFilterType.value,
      onProgress: (percent) => {
        uploadProgress.value = Math.max(0, Math.min(100, Math.round(percent)))
      },
    })
    const uploaded = normalizeMediaAssetPage(result)
    if (uploaded.list.length) {
      assets.value = [...uploaded.list, ...assets.value]
      total.value += uploaded.list.length
    }
    props.ui.message.success(files.length > 1 ? `Uploaded ${files.length} files` : 'Upload complete')
    await resetAndLoadAssets()
  } catch (error) {
    props.ui.message.error(error instanceof Error ? error.message : 'Upload failed')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    target.value = ''
  }
}

const selectAsset = (asset: MediaAssetRecord) => {
  emit('select', asset)
}

const removeAsset = async (asset: MediaAssetRecord) => {
  const confirmed = await props.ui.confirm({
    title: 'Delete asset',
    message: `Delete "${asset.name}"?`,
    confirmText: 'Delete',
    cancelText: 'Cancel',
  })
  if (!confirmed) return

  try {
    await props.mediaService.deleteAsset?.(asset.id, asset)
    assets.value = assets.value.filter(item => item.id !== asset.id)
    total.value = Math.max(0, total.value - 1)
    props.ui.message.success('Asset deleted')
  } catch (error) {
    props.ui.message.error(error instanceof Error ? error.message : 'Delete failed')
  }
}

watch(
  () => props.initialRecords,
  (records) => {
    if (!props.mediaService.loadAssets && records.length) setAssetsFromInitialRecords()
  },
  { immediate: true },
)

watch(
  assetFilterType,
  () => void resetAndLoadAssets(),
  { immediate: true },
)
</script>

<template>
  <div
    class="wb-assets-manager"
    :class="`wb-assets-manager--${variant}`"
    data-testid="wb-assets-manager-panel"
  >
    <header class="wb-assets-manager__header">
      <div class="wb-assets-manager__meta">
        <strong>{{ title }}</strong>
        <span>{{ displayAssets.length }}/{{ total }}</span>
      </div>
      <div class="wb-assets-manager__actions">
        <NInput
          v-model:value="keyword"
          size="small"
          clearable
          placeholder="Search"
          @keyup.enter="resetAndLoadAssets"
          @clear="resetAndLoadAssets"
        />
        <NButton
          size="small"
          :disabled="!canUpload || uploading"
          :style="uploadButtonStyle"
          @click="openFileDialog"
        >
          <Icon icon="mdi:upload" :width="14" />
          <span>{{ uploadText }}</span>
        </NButton>
      </div>
      <input
        ref="fileInputRef"
        type="file"
        multiple
        :accept="uploadAccept"
        class="wb-assets-manager__file-input"
        @change="handleFileChange"
      />
    </header>

    <NScrollbar ref="scrollbarRef" class="wb-assets-manager__scroll">
      <NSpin :show="loading">
        <div v-if="displayAssets.length" class="wb-assets-manager__grid">
          <button
            v-for="asset in displayAssets"
            :key="asset.id"
            type="button"
            class="wb-assets-manager__asset"
            @click="selectAsset(asset)"
          >
            <span class="wb-assets-manager__thumb">
              <img
                :src="getMediaAssetThumbnailUrl(asset)"
                :alt="asset.name"
              />
            </span>
            <span class="wb-assets-manager__name" :title="asset.name">{{ asset.name }}</span>
            <button
              v-if="canDelete"
              type="button"
              class="wb-assets-manager__delete"
              title="Delete"
              @click.stop="removeAsset(asset)"
            >
              <Icon icon="mdi:trash-can-outline" :width="14" />
            </button>
          </button>
        </div>
        <div v-else class="wb-assets-manager__empty">No assets are available.</div>
      </NSpin>
      <div v-if="displayAssets.length" class="wb-assets-manager__footer">
        <NButton
          v-if="hasMore"
          size="small"
          :loading="loadingMore"
          @click="loadAssets(true)"
        >
          Load more
        </NButton>
        <span v-else>All {{ total }} assets loaded</span>
      </div>
    </NScrollbar>
  </div>
</template>

<style scoped>
.wb-assets-manager {
  display: flex;
  min-height: 0;
  height: 100%;
  flex-direction: column;
  color: #111827;
  background: #fff;
}

.wb-assets-manager__header {
  flex: 0 0 auto;
  border-bottom: 1px solid #e5e7eb;
  padding: 12px;
}

.wb-assets-manager__meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 10px;
  font-size: 12px;
}

.wb-assets-manager__meta strong {
  font-size: 13px;
  font-weight: 600;
}

.wb-assets-manager__meta span {
  color: #6b7280;
  font-variant-numeric: tabular-nums;
}

.wb-assets-manager__actions {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 8px;
}

.wb-assets-manager__actions :deep(.n-button__content) {
  gap: 4px;
}

.wb-assets-manager__file-input {
  display: none;
}

.wb-assets-manager__scroll {
  min-height: 0;
  flex: 1 1 auto;
}

.wb-assets-manager__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(112px, 1fr));
  gap: 10px;
  align-content: start;
  padding: 12px;
}

.wb-assets-manager--panel .wb-assets-manager__grid {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.wb-assets-manager--modal {
  height: min(640px, calc(100vh - 154px));
}

.wb-assets-manager__asset {
  position: relative;
  display: grid;
  grid-template-rows: minmax(0, 1fr) auto;
  overflow: hidden;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0;
  color: inherit;
  background: #fff;
  text-align: left;
  cursor: pointer;
}

.wb-assets-manager__asset:hover,
.wb-assets-manager__asset:focus-visible {
  border-color: #2251ff;
  outline: none;
}

.wb-assets-manager__thumb {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  overflow: hidden;
  background-color: #f3f4f6;
  background-image:
    linear-gradient(45deg, #d1d5db 25%, transparent 25%),
    linear-gradient(-45deg, #d1d5db 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #d1d5db 75%),
    linear-gradient(-45deg, transparent 75%, #d1d5db 75%);
  background-position: 0 0, 0 5px, 5px -5px, -5px 0;
  background-size: 10px 10px;
}

.wb-assets-manager__thumb img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.wb-assets-manager__name {
  overflow: hidden;
  border-top: 1px solid #e5e7eb;
  padding: 7px 8px;
  font-size: 11px;
  line-height: 16px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-assets-manager__delete {
  position: absolute;
  top: 6px;
  right: 6px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 0;
  border-radius: 4px;
  color: #dc2626;
  background: rgba(255, 255, 255, 0.94);
  box-shadow: 0 1px 4px rgba(15, 23, 42, 0.16);
  opacity: 0;
  transition: opacity 0.15s ease;
}

.wb-assets-manager__asset:hover .wb-assets-manager__delete,
.wb-assets-manager__asset:focus-within .wb-assets-manager__delete {
  opacity: 1;
}

.wb-assets-manager__empty {
  margin: 12px;
  border: 1px dashed #d1d5db;
  border-radius: 6px;
  padding: 20px;
  color: #6b7280;
  font-size: 12px;
  text-align: center;
}

.wb-assets-manager__footer {
  display: flex;
  justify-content: center;
  padding: 4px 12px 14px;
  color: #6b7280;
  font-size: 11px;
}
</style>
