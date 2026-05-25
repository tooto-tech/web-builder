<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { Icon } from '@iconify/vue'
import {
  getHistoryDetail,
  getHistoryPage,
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  type PageHistoryDetailRespVO,
  type PageHistoryRespVO,
  type PageResourceIdentity,
  type PageVO,
} from '@/api/content/page'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'

const props = defineProps<{
  resourceId?: number
  resourceKey?: string
  resourceType?: string
  resourceScope?: string
  ownerType?: string
  ownerId?: number
  currentPage?: PageVO | null
  refreshKey?: number
  restoringId?: number | null
}>()

const emit = defineEmits<{
  (e: 'restore', detail: PageHistoryDetailRespVO): void
}>()

const PAGE_SIZE = 12

const loading = ref(false)
const loadingMore = ref(false)
const detailLoading = ref(false)
const histories = ref<PageHistoryRespVO[]>([])
const selectedId = ref<number | null>(null)
const selectedDetail = ref<PageHistoryDetailRespVO | null>(null)
const total = ref(0)
const pageNo = ref(1)

const resourceIdentity = computed<PageResourceIdentity>(() =>
  normalizePageResourceIdentity({
    resourceId: props.resourceId,
    resourceKey: props.resourceKey,
    resourceType: props.resourceType,
    resourceScope: props.resourceScope,
    ownerType: props.ownerType,
    ownerId: props.ownerId,
  }),
)
const hasMore = computed(() => histories.value.length < total.value)
const selectedSummary = computed(
  () => histories.value.find((item) => item.id === selectedId.value) ?? null,
)

const statusLabelMap: Record<string, string> = {
  draft: '草稿',
  release: '已发布',
}

const publishStatusLabelMap: Record<string, string> = {
  request: '发布中',
  success: '发布成功',
  failed: '发布失败',
}

const formatTime = (value?: string | Date) => {
  if (!value) return '未知时间'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '未知时间'

  return new Intl.DateTimeFormat('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const getStatusLabel = (status?: string) => {
  if (!status) return '未知状态'
  return statusLabelMap[status] || status
}

const getPublishStatusLabel = (status?: string) => {
  if (!status) return ''
  return publishStatusLabelMap[status] || status
}

const getStatusClass = (status?: string) => {
  if (status === 'release') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'draft') {
    return 'border-amber-200 bg-amber-50 text-amber-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-500'
}

const getPublishStatusClass = (status?: string) => {
  if (status === 'success') {
    return 'border-green-200 bg-green-50 text-green-700'
  }

  if (status === 'failed') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (status === 'request') {
    return 'border-blue-200 bg-blue-50 text-blue-700'
  }

  return 'border-gray-200 bg-gray-50 text-gray-500'
}

const canQueryHistory = computed(() => hasPageResourceLocator(resourceIdentity.value))

const fetchHistoryDetail = async (id: number) => {
  detailLoading.value = true
  try {
    selectedDetail.value = await getHistoryDetail(id)
  } catch (error) {
    selectedDetail.value = null
    ElMessage.error('加载历史详情失败，请重试')
  } finally {
    detailLoading.value = false
  }
}

const selectHistory = async (id: number) => {
  if (selectedId.value === id && selectedDetail.value?.id === id) return

  selectedId.value = id
  await fetchHistoryDetail(id)
}

const refreshHistory = async (preserveSelection = false) => {
  if (!canQueryHistory.value) {
    histories.value = []
    total.value = 0
    selectedId.value = null
    selectedDetail.value = null
    return
  }

  loading.value = true
  try {
    pageNo.value = 1
    const result = await getHistoryPage({
      pageId: props.currentPage?.id,
      ...resourceIdentity.value,
      pageNo: pageNo.value,
      pageSize: PAGE_SIZE,
    })

    histories.value = result.list || []
    total.value = result.total || 0

    const nextSelectedId =
      preserveSelection && histories.value.some((item) => item.id === selectedId.value)
        ? selectedId.value
        : histories.value[0]?.id ?? null

    if (nextSelectedId) {
      await selectHistory(nextSelectedId)
    } else {
      selectedId.value = null
      selectedDetail.value = null
    }
  } catch (error) {
    histories.value = []
    total.value = 0
    selectedId.value = null
    selectedDetail.value = null
    ElMessage.error('加载历史记录失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

const loadMore = async () => {
  if (!hasMore.value || loadingMore.value || !canQueryHistory.value) return

  loadingMore.value = true
  try {
    const nextPageNo = pageNo.value + 1
    const result = await getHistoryPage({
      pageId: props.currentPage?.id,
      ...resourceIdentity.value,
      pageNo: nextPageNo,
      pageSize: PAGE_SIZE,
    })

    const appended = result.list || []
    const knownIds = new Set(histories.value.map((item) => item.id))
    histories.value = histories.value.concat(appended.filter((item) => !knownIds.has(item.id)))
    total.value = result.total || total.value
    pageNo.value = nextPageNo
  } catch (error) {
    ElMessage.error('加载更多历史记录失败，请重试')
  } finally {
    loadingMore.value = false
  }
}

const handleRestoreSelected = () => {
  if (!selectedDetail.value) return
  emit('restore', selectedDetail.value)
}

watch(
  [
    () => props.resourceId,
    () => props.resourceKey,
    () => props.resourceType,
    () => props.resourceScope,
    () => props.ownerType,
    () => props.ownerId,
    () => props.currentPage?.id,
    () => props.refreshKey,
  ],
  () => {
    void refreshHistory(true)
  },
  { immediate: true },
)
</script>

<template>
  <div class="flex h-full flex-col bg-white">
    <div class="border-b bg-white/95 px-3 py-3 backdrop-blur-sm">
      <div class="flex items-start justify-between gap-3">
        <div>
          <div class="text-sm font-medium text-gray-800">历史记录</div>
          <div class="mt-1 text-xs text-gray-400">
            共 {{ total }} 条版本记录
          </div>
        </div>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded border border-gray-200 text-gray-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
          :disabled="loading || loadingMore"
          title="刷新历史记录"
          @click="refreshHistory(true)"
        >
          <Icon icon="mdi:refresh" class="text-base" />
        </button>
      </div>
    </div>

    <div class="flex-1 overflow-y-auto px-3 py-3">
      <div class="mb-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3">
        <div class="text-xs font-medium text-slate-700">当前草稿</div>
        <template v-if="props.currentPage?.id">
          <div class="mt-2 text-sm font-semibold text-slate-900">
            {{ props.currentPage.version || `#${props.currentPage.id}` }}
          </div>
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
              :class="getStatusClass(props.currentPage.status)"
            >
              {{ getStatusLabel(props.currentPage.status) }}
            </span>
            <span
              v-if="props.currentPage.publishStatus"
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
              :class="getPublishStatusClass(props.currentPage.publishStatus)"
            >
              {{ getPublishStatusLabel(props.currentPage.publishStatus) }}
            </span>
          </div>
          <div class="mt-2 text-xs leading-5 text-slate-500">
            最近更新 {{ formatTime(props.currentPage.updateTime) }}
            <span v-if="props.currentPage.updater"> · {{ props.currentPage.updater }}</span>
          </div>
        </template>
        <div v-else class="mt-2 text-xs leading-5 text-slate-500">
          当前页面还没有可用的草稿信息。
        </div>
      </div>

      <div v-if="loading" class="space-y-2">
        <div
          v-for="index in 4"
          :key="index"
          class="h-20 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
        ></div>
      </div>

      <template v-else>
        <div
          v-if="!histories.length"
          class="rounded-xl border border-dashed border-gray-200 px-4 py-8 text-center text-xs leading-5 text-gray-400"
        >
          暂无历史记录，发布或保存新版本后会在这里展示。
        </div>

        <div v-else class="space-y-2">
          <button
            v-for="item in histories"
            :key="item.id"
            type="button"
            class="w-full rounded-xl border px-3 py-3 text-left transition-all"
            :class="
              selectedId === item.id
                ? 'border-blue-200 bg-blue-50 shadow-[0_4px_18px_rgba(37,99,235,0.08)]'
                : 'border-gray-100 bg-white hover:border-gray-200 hover:bg-gray-50'
            "
            @click="selectHistory(item.id)"
          >
            <div class="flex items-start justify-between gap-3">
              <div class="min-w-0">
                <div class="truncate text-sm font-medium text-gray-900">
                  {{ item.version || `历史版本 #${item.id}` }}
                </div>
                <div class="mt-1 text-xs text-gray-500">
                  {{ formatTime(item.createTime) }}
                  <span v-if="item.creator"> · {{ item.creator }}</span>
                </div>
              </div>
              <span
                class="inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[11px]"
                :class="getStatusClass(item.status)"
              >
                {{ getStatusLabel(item.status) }}
              </span>
            </div>
            <div class="mt-2 flex flex-wrap gap-2">
              <span
                v-if="item.publishStatus"
                class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
                :class="getPublishStatusClass(item.publishStatus)"
              >
                {{ getPublishStatusLabel(item.publishStatus) }}
              </span>
              <span class="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-500">
                ID {{ item.id }}
              </span>
            </div>
          </button>

          <button
            v-if="hasMore"
            type="button"
            class="mt-1 w-full rounded-xl border border-dashed border-gray-200 px-3 py-2 text-sm text-gray-500 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-50"
            :disabled="loadingMore"
            @click="loadMore"
          >
            {{ loadingMore ? '加载中...' : '加载更多' }}
          </button>
        </div>
      </template>

      <div
        v-if="selectedId"
        class="mt-4 rounded-xl border border-blue-100 bg-blue-50/60 px-3 py-3"
      >
        <div class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <div class="text-xs font-medium text-blue-900">已选版本</div>
            <div class="mt-1 truncate text-sm font-semibold text-gray-900">
              {{ selectedDetail?.version || selectedSummary?.version || `#${selectedId}` }}
            </div>
          </div>
          <button
            type="button"
            class="inline-flex shrink-0 items-center rounded-lg bg-editor-primary px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-600 disabled:cursor-not-allowed disabled:bg-gray-300"
            :disabled="
              detailLoading || !selectedDetail?.schemaJson || props.restoringId === selectedId
            "
            @click="handleRestoreSelected"
          >
            {{ props.restoringId === selectedId ? '恢复中...' : '恢复并保存' }}
          </button>
        </div>

        <div v-if="detailLoading" class="mt-2 text-xs text-gray-500">
          正在加载版本详情...
        </div>

        <template v-else-if="selectedDetail">
          <div class="mt-2 flex flex-wrap gap-2">
            <span
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
              :class="getStatusClass(selectedDetail.status)"
            >
              {{ getStatusLabel(selectedDetail.status) }}
            </span>
            <span
              v-if="selectedDetail.publishStatus"
              class="inline-flex items-center rounded-full border px-2 py-0.5 text-[11px]"
              :class="getPublishStatusClass(selectedDetail.publishStatus)"
            >
              {{ getPublishStatusLabel(selectedDetail.publishStatus) }}
            </span>
          </div>
          <div class="mt-2 text-xs leading-5 text-gray-500">
            {{ formatTime(selectedDetail.createTime) }}
            <span v-if="selectedDetail.creator"> · {{ selectedDetail.creator }}</span>
          </div>
          <p class="mt-2 text-[11px] leading-5 text-gray-500">
            {{
              selectedDetail.schemaJson
                ? '恢复后会覆盖当前编辑器内容，并立即保存为当前草稿。'
                : '该版本缺少 schemaJson，暂时无法直接恢复。'
            }}
          </p>
        </template>
      </div>
    </div>
  </div>
</template>
