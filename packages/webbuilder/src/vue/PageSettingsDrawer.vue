<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { NButton, NDrawer, NDrawerContent, NForm, NFormItem, NInput, NSelect, NSpace } from 'naive-ui'
import type { SelectOption } from 'naive-ui'
import type { PageSettingsService } from '../core/index.js'

import {
  createEmptyPageSettings,
  type PageSettings,
} from './pageSettings.js'

const props = withDefaults(defineProps<{
  show: boolean
  settings: PageSettings
  title?: string
  resourceType?: string | null
  pageSettingsService?: PageSettingsService
}>(), {
  title: '页面设置',
  resourceType: null,
  pageSettingsService: () => ({}),
})

const emit = defineEmits<{
  (event: 'update:show', value: boolean): void
  (event: 'save', value: PageSettings): void
}>()

const visible = computed({
  get: () => props.show,
  set: (value) => emit('update:show', value),
})

const localSettings = ref<PageSettings>(createEmptyPageSettings())
const previewOptions = ref<SelectOption[]>([])
const previewSearching = ref(false)

type PreviewSelectorKind = 'post' | 'product' | 'media' | ''

const previewSelectorKind = computed<PreviewSelectorKind>(() => {
  const type = `${props.resourceType ?? ''}`.trim()
  if (type === 'TEMP_POST_DETAIL') return 'post'
  if (type === 'TEMP_PRODUCT_DETAIL') return 'product'
  if (type === 'TEMP_MEDIA_DETAIL') return 'media'
  return ''
})

const supportsPreviewSelector = computed(() => Boolean(previewSelectorKind.value))

interface PreviewPostResource {
  id?: number | string
  name?: string
  contents?: Array<{ name?: string }>
}

interface PreviewMediaResource {
  id?: number | string
  title?: string
  contents?: Array<{ title?: string }>
}

const toList = (result: unknown): unknown[] => {
  if (Array.isArray(result)) return result
  if (
    result &&
    typeof result === 'object' &&
    Array.isArray((result as { list?: unknown }).list)
  ) {
    return (result as { list: unknown[] }).list
  }
  return []
}

const toSelectOption = (id: number | string | undefined, label: string): SelectOption | null => {
  if (id == null) return null
  const numericId = Number(id)
  if (!Number.isFinite(numericId)) return null
  return {
    value: numericId,
    label: label.trim() ? `#${id} ${label.trim()}` : `#${id}`,
  }
}

const toPostOption = (post: PreviewPostResource | null | undefined): SelectOption | null => {
  const label = post?.contents?.[0]?.name || post?.name || ''
  return toSelectOption(post?.id, label)
}

interface PreviewProductResource {
  id?: number | string
  name?: string
}

const toProductOption = (product: PreviewProductResource | null | undefined): SelectOption | null =>
  toSelectOption(product?.id, `${product?.name ?? ''}`)

const toMediaOption = (media: PreviewMediaResource | null | undefined): SelectOption | null => {
  const label = media?.contents?.[0]?.title || media?.title || ''
  return toSelectOption(media?.id, label)
}

const mergePreviewOptions = (nextOptions: SelectOption[]) => {
  const map = new Map<string | number, SelectOption>()
  previewOptions.value.forEach((option) => map.set(option.value as string | number, option))
  nextOptions.forEach((option) => map.set(option.value as string | number, option))
  previewOptions.value = Array.from(map.values())
}

const fetchPreviewPosts = async (keyword = '') => {
  previewSearching.value = true
  try {
    const result = await props.pageSettingsService.getPostPage?.({
      pageNo: 1,
      pageSize: 20,
      name: keyword || undefined,
    })
    const options = toList(result)
      .map((item) => toPostOption(item as PreviewPostResource))
      .filter((item): item is SelectOption => Boolean(item))
    mergePreviewOptions(options)
  } finally {
    previewSearching.value = false
  }
}

const fetchPreviewProducts = async () => {
  previewSearching.value = true
  try {
    const result = await props.pageSettingsService.getSpuSimpleList?.()
    const options = toList(result)
      .map((item) => toProductOption(item as PreviewProductResource))
      .filter((item): item is SelectOption => Boolean(item))
    mergePreviewOptions(options)
  } finally {
    previewSearching.value = false
  }
}

const fetchPreviewMedia = async (keyword = '') => {
  previewSearching.value = true
  try {
    const result = await props.pageSettingsService.getMediaResourcePage?.({
      pageNo: 1,
      pageSize: 20,
      title: keyword || undefined,
    })
    const options = toList(result)
      .map((item) => toMediaOption(item as PreviewMediaResource))
      .filter((item): item is SelectOption => Boolean(item))
    mergePreviewOptions(options)
  } finally {
    previewSearching.value = false
  }
}

const ensureSelectedPreviewOption = async (currentId: number | null | undefined) => {
  if (currentId == null || previewOptions.value.some((option) => option.value === currentId)) return

  if (previewSelectorKind.value === 'product') {
    const product = await props.pageSettingsService.getSpu?.(currentId)
    const option = toProductOption(product as PreviewProductResource)
    if (option) mergePreviewOptions([option])
    return
  }

  if (previewSelectorKind.value === 'media') {
    const media = await props.pageSettingsService.getMediaResourceDetail?.(currentId)
    const option = toMediaOption(media as PreviewMediaResource)
    if (option) mergePreviewOptions([option])
    return
  }

  const rawPost = await props.pageSettingsService.getPost?.(currentId)
  const postRecord = rawPost && typeof rawPost === 'object'
    ? rawPost as { post?: PreviewPostResource }
    : {}
  const option = toPostOption((postRecord.post ?? rawPost) as PreviewPostResource)
  if (option) mergePreviewOptions([option])
}

const ensurePreviewOptions = async () => {
  previewOptions.value = []
  if (previewSelectorKind.value === 'product') {
    await fetchPreviewProducts()
  } else if (previewSelectorKind.value === 'media') {
    await fetchPreviewMedia('')
  } else if (previewSelectorKind.value === 'post') {
    await fetchPreviewPosts('')
  }
  await ensureSelectedPreviewOption(localSettings.value.previewResourceId)
}

const handlePreviewSearch = (query: string) => {
  const keyword = query.trim()
  if (previewSelectorKind.value === 'media') void fetchPreviewMedia(keyword)
  if (previewSelectorKind.value === 'post') void fetchPreviewPosts(keyword)
}

const resetLocalSettings = () => {
  localSettings.value = {
    ...createEmptyPageSettings(),
    ...props.settings,
  }
}

watch(
  () => props.settings,
  resetLocalSettings,
  { deep: true, immediate: true },
)

watch(visible, (nextVisible) => {
  if (nextVisible) {
    resetLocalSettings()
    if (supportsPreviewSelector.value) void ensurePreviewOptions()
  }
})

const close = () => {
  visible.value = false
}

const save = () => {
  emit('save', { ...localSettings.value })
  close()
}
</script>

<template>
  <NDrawer
    v-model:show="visible"
    placement="left"
    :width="520"
    :mask-closable="false"
    :block-scroll="false"
    class="wb-page-settings-drawer"
  >
    <NDrawerContent
      :title="title"
      closable
    >
      <NForm
        label-placement="top"
        size="small"
        class="wb-page-settings-drawer__form"
      >
        <NFormItem
          v-if="supportsPreviewSelector"
          label="预览数据"
        >
          <NSelect
            v-model:value="localSettings.previewResourceId"
            filterable
            clearable
            :remote="previewSelectorKind !== 'product'"
            :loading="previewSearching"
            :options="previewOptions"
            :placeholder="
              previewSelectorKind === 'post'
                ? '搜索标题或直接选择一篇文章'
                : previewSelectorKind === 'media'
                  ? '搜索标题或直接选择一个媒体资源'
                  : '选择一个产品'
            "
            @search="handlePreviewSearch"
          />
        </NFormItem>

        <NFormItem label="Page ID">
          <NInput
            :value="settings.id"
            disabled
          />
        </NFormItem>

        <NFormItem label="Page Name">
          <NInput
            v-model:value="localSettings.name"
            placeholder="Enter page name"
          />
        </NFormItem>

        <NFormItem label="Slug">
          <NInput
            v-model:value="localSettings.slug"
            placeholder="e.g., about-us"
          />
        </NFormItem>

        <NFormItem label="Title">
          <NInput
            v-model:value="localSettings.tdkTitle"
            placeholder="Page title"
          />
        </NFormItem>

        <NFormItem label="Description">
          <NInput
            v-model:value="localSettings.tdkDescription"
            type="textarea"
            placeholder="Page description"
            :autosize="{ minRows: 2, maxRows: 4 }"
          />
        </NFormItem>

        <NFormItem label="Keywords">
          <NInput
            v-model:value="localSettings.tdkKeywords"
            placeholder="Keywords, separated by commas"
          />
        </NFormItem>

        <NFormItem label="Custom HTML head">
          <NInput
            v-model:value="localSettings.customHead"
            type="textarea"
            placeholder="&lt;style&gt;...&lt;/style&gt;"
            class="wb-page-settings-drawer__code"
            :autosize="{ minRows: 3, maxRows: 8 }"
          />
        </NFormItem>

        <NFormItem label="Custom HTML body">
          <NInput
            v-model:value="localSettings.customBody"
            type="textarea"
            placeholder="&lt;script&gt;...&lt;/script&gt;"
            class="wb-page-settings-drawer__code"
            :autosize="{ minRows: 3, maxRows: 8 }"
          />
        </NFormItem>
      </NForm>

      <template #footer>
        <NSpace justify="end">
          <NButton
            size="small"
            @click="close"
          >
            Cancel
          </NButton>
          <NButton
            type="primary"
            size="small"
            @click="save"
          >
            Save
          </NButton>
        </NSpace>
      </template>
    </NDrawerContent>
  </NDrawer>
</template>

<style scoped>
.wb-page-settings-drawer__form {
  max-height: calc(100vh - 132px);
  overflow-y: auto;
  padding-right: 4px;
}

.wb-page-settings-drawer__code :deep(textarea) {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace;
}
</style>
