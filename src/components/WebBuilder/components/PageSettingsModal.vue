<script lang="ts" setup>
import { ref, watch, computed, shallowRef } from 'vue'
import { ElDialog, ElSelect, ElOption } from 'element-plus'
import type { PageSettings } from '@/components/WebBuilder/utils/pageSettings'
import { getPost, getPostPage, type PostDetailVO, type PostVO } from '@/api/content/post'
import { getLoopItemType } from '@/components/WebBuilder/config/templateSharedResources'
import { getSpu, getSpuSimpleList } from '@/api/mall/product/spu'
import { getCategoryList as getProductCategoryList } from '@/api/mall/product/category'
import {
  getMediaResourceDetail,
  getMediaResourcePage,
  type MediaResourceVO
} from '@/api/content/mediaResource'

const props = defineProps<{
  modelValue: boolean
  settings: PageSettings
  /** 当前页面所属资源类型，用于切换"页面设置 / 模板设置"以及展示预览选择器 */
  resourceType?: string | null
  /** 当前资源扩展元数据，例如 TEMP_LOOP_ITEM 的 loopItemType */
  resourceExtJson?: string | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', settings: PageSettings): void
}>()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const localSettings = ref<PageSettings>({ ...props.settings })

watch(
  () => props.settings,
  (newSettings) => {
    localSettings.value = { ...newSettings }
  },
  { deep: true, immediate: true }
)

watch(visible, (newVal) => {
  if (newVal) {
    localSettings.value = { ...props.settings }
    if (previewSelectorKind.value) {
      void ensurePreviewOptions(localSettings.value.previewResourceId ?? null)
    }
  }
})

/** 所有模板类型（标题显示为"模板设置"） */
const TEMPLATE_RESOURCE_TYPES = new Set([
  'TEMP_POST_DETAIL',
  'TEMP_POST_CATEGORY_LIST',
  'TEMP_MEDIA_DETAIL',
  'TEMP_MEDIA_CATEGORY_LIST',
  'TEMP_PRODUCT_DETAIL',
  'TEMP_PRODUCT_CATEGORY_LIST',
  'TEMP_LOOP_ITEM'
])

const isTemplateResource = computed(() =>
  TEMPLATE_RESOURCE_TYPES.has(`${props.resourceType ?? ''}`.trim())
)

const isPostDetailTemplate = computed(
  () => `${props.resourceType ?? ''}`.trim() === 'TEMP_POST_DETAIL'
)

const isMediaDetailTemplate = computed(
  () => `${props.resourceType ?? ''}`.trim() === 'TEMP_MEDIA_DETAIL'
)

const isProductDetailTemplate = computed(
  () => `${props.resourceType ?? ''}`.trim() === 'TEMP_PRODUCT_DETAIL'
)

const loopItemType = computed(() =>
  `${props.resourceType ?? ''}`.trim() === 'TEMP_LOOP_ITEM'
    ? getLoopItemType(props.resourceExtJson) || ''
    : ''
)

const PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES = new Set(['productCategoryFaq'])

const isProductCategoryContextLoopItemType = (value: string): boolean =>
  PRODUCT_CATEGORY_CONTEXT_LOOP_TYPES.has(value)

type PreviewSelectorKind = 'post' | 'product' | 'media' | 'productCategory' | ''

const previewSelectorKind = computed<PreviewSelectorKind>(() => {
  if (isPostDetailTemplate.value) return 'post'
  if (isProductDetailTemplate.value) return 'product'
  if (isMediaDetailTemplate.value) return 'media'
  if (loopItemType.value === 'post') return 'post'
  if (loopItemType.value === 'product') return 'product'
  if (loopItemType.value === 'media') return 'media'
  if (isProductCategoryContextLoopItemType(loopItemType.value)) return 'productCategory'
  return ''
})

const supportsPreviewSelector = computed(() => !!previewSelectorKind.value)

const dialogTitle = computed(() => (isTemplateResource.value ? '模板设置' : '页面设置'))

/* ───────────── 预览文章选择器（TEMP_POST_DETAIL） ───────────── */

interface PreviewPostOption {
  id: number
  label: string
}

const previewOptions = shallowRef<PreviewPostOption[]>([])
const previewSearching = ref(false)

const toPreviewOption = (post: PostVO | undefined | null): PreviewPostOption | null => {
  if (!post || post.id == null) return null
  const content = post.contents?.[0]
  const title = (content?.name || post.name || '').trim()
  const label = title ? `#${post.id} ${title}` : `#${post.id}`
  return { id: Number(post.id), label }
}

const mergePreviewOptions = (next: PreviewPostOption[]) => {
  const map = new Map<number, PreviewPostOption>()
  previewOptions.value.forEach((opt) => map.set(opt.id, opt))
  next.forEach((opt) => map.set(opt.id, opt))
  previewOptions.value = Array.from(map.values())
}

const toProductOption = (product: any): PreviewPostOption | null => {
  if (!product || product.id == null) return null
  const label = product.name ? `#${product.id} ${product.name}` : `#${product.id}`
  return { id: Number(product.id), label }
}

const toMediaOption = (media: MediaResourceVO | undefined | null): PreviewPostOption | null => {
  if (!media || media.id == null) return null
  const title = media.contents?.[0]?.title || media.title || ''
  const label = title ? `#${media.id} ${title}` : `#${media.id}`
  return { id: Number(media.id), label }
}

const flattenProductCategoryList = (list: any[]): any[] => {
  const result: any[] = []
  const walk = (items: any[]) => {
    items.forEach((item) => {
      if (!item) return
      result.push(item)
      if (Array.isArray(item.children)) walk(item.children)
    })
  }
  walk(list)
  return result
}

const toProductCategoryOption = (category: any): PreviewPostOption | null => {
  if (!category || category.id == null) return null
  const name = `${category.name || category.label || ''}`.trim()
  const code = `${category.code || ''}`.trim()
  const title = [name, code ? `/${code}` : ''].filter(Boolean).join(' ')
  const label = title ? `#${category.id} ${title}` : `#${category.id}`
  return { id: Number(category.id), label }
}

const fetchPreviewPosts = async (keyword = '') => {
  previewSearching.value = true
  try {
    const res: any = await getPostPage({
      pageNo: 1,
      pageSize: 20,
      name: keyword || undefined
    })
    const list: PostVO[] = Array.isArray(res?.list) ? res.list : Array.isArray(res) ? res : []
    const options = list
      .map((item) => toPreviewOption(item))
      .filter((item): item is PreviewPostOption => !!item)
    mergePreviewOptions(options)
  } catch {
    // 忽略加载失败，下拉保留已有选项
  } finally {
    previewSearching.value = false
  }
}

const fetchPreviewProducts = async () => {
  previewSearching.value = true
  try {
    const list = await getSpuSimpleList()
    const options = (Array.isArray(list) ? list : [])
      .map((item) => toProductOption(item))
      .filter((item): item is PreviewPostOption => !!item)
    mergePreviewOptions(options)
  } catch {
    // ignore
  } finally {
    previewSearching.value = false
  }
}

const fetchPreviewMedia = async (keyword = '') => {
  previewSearching.value = true
  try {
    const res: any = await getMediaResourcePage({
      pageNo: 1,
      pageSize: 20,
      title: keyword || undefined
    })
    const list: MediaResourceVO[] = Array.isArray(res?.list)
      ? res.list
      : Array.isArray(res)
        ? res
        : []
    const options = list
      .map((item) => toMediaOption(item))
      .filter((item): item is PreviewPostOption => !!item)
    mergePreviewOptions(options)
  } catch {
    // ignore
  } finally {
    previewSearching.value = false
  }
}

const fetchPreviewProductCategories = async (keyword = '') => {
  previewSearching.value = true
  try {
    const raw = await getProductCategoryList(keyword ? { name: keyword } : {})
    const list = Array.isArray(raw)
      ? raw
      : Array.isArray((raw as any)?.list)
        ? (raw as any).list
        : []
    const normalizedKeyword = keyword.trim().toLowerCase()
    const filtered = flattenProductCategoryList(list).filter((item) => {
      if (!normalizedKeyword) return true
      return [item?.name, item?.code, item?.id].some((field) =>
        `${field ?? ''}`.toLowerCase().includes(normalizedKeyword)
      )
    })
    const options = filtered
      .map((item) => toProductCategoryOption(item))
      .filter((item): item is PreviewPostOption => !!item)
    mergePreviewOptions(options)
  } catch {
    // ignore
  } finally {
    previewSearching.value = false
  }
}

/** 打开对话框时：保证已选中的资源始终出现在候选列表里 */
const ensurePreviewOptions = async (currentId: number | null) => {
  previewOptions.value = []
  if (previewSelectorKind.value === 'product') await fetchPreviewProducts()
  else if (previewSelectorKind.value === 'media') await fetchPreviewMedia('')
  else if (previewSelectorKind.value === 'productCategory') await fetchPreviewProductCategories('')
  else await fetchPreviewPosts('')

  if (currentId == null) return
  if (previewOptions.value.some((opt) => opt.id === currentId)) return
  try {
    if (previewSelectorKind.value === 'product') {
      const product = await getSpu(currentId)
      const opt = toProductOption(product)
      if (opt) mergePreviewOptions([opt])
      return
    }
    if (previewSelectorKind.value === 'media') {
      const media = await getMediaResourceDetail(currentId)
      const opt = toMediaOption(media)
      if (opt) mergePreviewOptions([opt])
      return
    }
    if (previewSelectorKind.value === 'productCategory') {
      await fetchPreviewProductCategories('')
      return
    }
    // 后端 `/content/post/get` 返回 `{ post, isEditingPublished, relatedPosts }`，
    // 老版本曾直接返回 PostVO，这里做兼容
    const raw: PostDetailVO | PostVO = await getPost(currentId)
    const post = (raw as PostDetailVO)?.post ?? (raw as PostVO)
    const opt = toPreviewOption(post)
    if (opt) mergePreviewOptions([opt])
  } catch {
    // ignore
  }
}

const onPreviewRemoteSearch = (query: string) => {
  const keyword = query.trim()
  if (previewSelectorKind.value === 'media') void fetchPreviewMedia(keyword)
  else if (previewSelectorKind.value === 'productCategory')
    void fetchPreviewProductCategories(keyword)
  else if (previewSelectorKind.value === 'post') void fetchPreviewPosts(keyword)
}

const close = () => {
  visible.value = false
}

const save = () => {
  emit('save', { ...localSettings.value })
  visible.value = false
}
</script>

<template>
  <ElDialog
    v-model="visible"
    :title="dialogTitle"
    width="600px"
    :close-on-click-modal="false"
    :close-on-press-escape="true"
    destroy-on-close
    align-center
  >
    <div class="space-y-4">
      <div v-if="supportsPreviewSelector" class="wb-preview-picker">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          预览数据
          <span class="ml-1 text-xs font-normal text-gray-400">
            <template v-if="previewSelectorKind === 'post'"
              >选择一篇文章，让画布动态字段显示真实文章数据</template
            >
            <template v-else-if="previewSelectorKind === 'media'"
              >选择一个媒体资源，让画布动态字段显示真实数据</template
            >
            <template v-else-if="previewSelectorKind === 'productCategory'"
              >选择一个产品分类，让画布动态字段显示该分类配置的 FAQ 和文章数据</template
            >
            <template v-else>选择一个产品，让画布动态字段显示真实数据</template>
          </span>
        </label>
        <ElSelect
          v-model="localSettings.previewResourceId"
          filterable
          :remote="previewSelectorKind !== 'product'"
          clearable
          size="small"
          style="width: 100%"
          :placeholder="
            previewSelectorKind === 'post'
              ? '搜索标题或直接选择一篇文章'
              : previewSelectorKind === 'media'
                ? '搜索标题或直接选择一个媒体资源'
                : previewSelectorKind === 'productCategory'
                  ? '搜索或选择一个产品分类'
                  : '选择一个产品'
          "
          :remote-method="onPreviewRemoteSearch"
          :loading="previewSearching"
        >
          <ElOption
            v-for="opt in previewOptions"
            :key="opt.id"
            :value="opt.id"
            :label="opt.label"
          />
        </ElSelect>
      </div>

      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Page ID</label>
        <el-input :value="props.settings.id" disabled size="small" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Page Name</label>
        <el-input v-model="localSettings.name" placeholder="Enter page name" size="small" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Slug</label>
        <el-input v-model="localSettings.slug" placeholder="e.g., about-us" size="small" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Title</label>
        <el-input v-model="localSettings.tdkTitle" placeholder="Page title" size="small" />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <el-input
          v-model="localSettings.tdkDescription"
          type="textarea"
          :rows="2"
          placeholder="Page description"
          size="small"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
        <el-input
          v-model="localSettings.tdkKeywords"
          placeholder="Keywords, separated by commas"
          size="small"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Custom HTML head</label>
        <el-input
          v-model="localSettings.customHead"
          type="textarea"
          :rows="3"
          placeholder="&lt;style&gt;...&lt;/style&gt;"
          size="small"
          class="font-mono"
        />
      </div>
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">Custom HTML body</label>
        <el-input
          v-model="localSettings.customBody"
          type="textarea"
          :rows="3"
          placeholder="&lt;script&gt;...&lt;/script&gt;"
          size="small"
          class="font-mono"
        />
      </div>
    </div>
    <template #footer>
      <div class="flex justify-end gap-2">
        <el-button size="small" @click="close">Cancel</el-button>
        <el-button type="primary" size="small" @click="save">Save</el-button>
      </div>
    </template>
  </ElDialog>
</template>
