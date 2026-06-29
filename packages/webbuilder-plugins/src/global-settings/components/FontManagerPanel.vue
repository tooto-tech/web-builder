<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { ElInput } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { HostUi } from '@toototech/webbuilder/core'
import { useFontManager, type InstalledFont } from '../useFontManager.js'
import type { GoogleFontItem } from '../useGoogleFonts.js'
import FontFamilySelect from './FontFamilySelect.vue'

type FontDelivery = 'remote' | 'local'

interface FontSelectPayload {
  value: string
  source: 'installed' | 'system' | 'google'
  family?: string
  googleName?: string
}

const props = defineProps<{
  grapes?: any
  hostUi?: Pick<HostUi, 'confirm'>
  globalFontFamily: string
  fontDelivery: FontDelivery
}>()

const emit = defineEmits<{
  (e: 'select-global-font', payload: FontSelectPayload): void
  (e: 'reset-global-font'): void
  (e: 'update:font-delivery', value: FontDelivery): void
}>()

const fontManager = useFontManager()
const { installedFonts, googleFonts } = fontManager

const activeView = ref<'installed' | 'browse'>('installed')
const search = ref('')
const expandedFamily = ref<string | null>(null)
const isLocalFontDelivery = computed({
  get: () => props.fontDelivery === 'local',
  set: (value: boolean) => {
    emit('update:font-delivery', value ? 'local' : 'remote')
  },
})

const { allFonts, loading, load } = googleFonts

async function switchToBrowse() {
  activeView.value = 'browse'
  if (allFonts.value.length === 0) await load()
}

const filteredBrowseFonts = computed(() => {
  const q = search.value.toLowerCase()
  let fonts = allFonts.value
  if (q) {
    fonts = fonts.filter(font =>
      font.family.toLowerCase().includes(q) || font.category.toLowerCase().includes(q)
    )
  }
  return fonts
})

const PAGE_SIZE = 30
const displayCount = ref(PAGE_SIZE)
const listRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)

watch(search, () => { displayCount.value = PAGE_SIZE })
watch(activeView, () => { displayCount.value = PAGE_SIZE })

const visibleBrowseFonts = computed(() =>
  filteredBrowseFonts.value.slice(0, displayCount.value)
)
const hasMore = computed(() =>
  displayCount.value < filteredBrowseFonts.value.length
)

let sentinelObserver: IntersectionObserver | null = null

function setupSentinelObserver() {
  sentinelObserver?.disconnect()
  if (!sentinelRef.value || !listRef.value) return
  sentinelObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0]?.isIntersecting && hasMore.value) {
        displayCount.value += PAGE_SIZE
      }
    },
    { root: listRef.value, threshold: 0.1 }
  )
  sentinelObserver.observe(sentinelRef.value)
}

watch([activeView, visibleBrowseFonts], async () => {
  if (activeView.value !== 'browse') return
  await nextTick()
  setupSentinelObserver()
}, { flush: 'post' })

onBeforeUnmount(() => sentinelObserver?.disconnect())

const previewObserver = ref<IntersectionObserver | null>(null)
const loadedPreviews = ref(new Set<string>())

function setupPreviewObserver() {
  previewObserver.value?.disconnect()
  previewObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const googleName = (entry.target as HTMLElement).dataset.previewFont
        if (googleName && !loadedPreviews.value.has(googleName)) {
          loadedPreviews.value.add(googleName)
          const href = `https://fonts.googleapis.com/css2?family=${googleName}:wght@400;700&display=swap`
          if (!document.head.querySelector(`link[data-wb-font-preview="${googleName}"]`)) {
            const link = document.createElement('link')
            link.rel = 'stylesheet'
            link.setAttribute('data-wb-font-preview', googleName)
            link.href = href
            document.head.appendChild(link)
          }
          previewObserver.value?.unobserve(entry.target)
        }
      })
    },
    { root: listRef.value, rootMargin: '200px', threshold: 0 }
  )
}

async function observePreviewItems() {
  await nextTick()
  if (!previewObserver.value) return
  const items = listRef.value?.querySelectorAll<HTMLElement>('[data-preview-font]') ?? []
  items.forEach(el => previewObserver.value?.observe(el))
}

watch(visibleBrowseFonts, async () => {
  if (activeView.value !== 'browse') return
  await nextTick()
  observePreviewItems()
}, { flush: 'post' })

watch(activeView, async (view) => {
  if (view !== 'browse') return
  await nextTick()
  setupPreviewObserver()
  observePreviewItems()
  setupSentinelObserver()
})

onBeforeUnmount(() => previewObserver.value?.disconnect())

function handleInstall(font: GoogleFontItem) {
  fontManager.installFont(font)
}

function handleGlobalFontSelect(payload: FontSelectPayload) {
  emit('select-global-font', payload)
}

function resetGlobalFont() {
  emit('reset-global-font')
}

async function handleRemove(font: InstalledFont) {
  const confirmed = await props.hostUi?.confirm({
    message: `确定要卸载字体 "${font.family}" 吗？已使用该字体的组件将回退到默认字体。`,
    title: '卸载字体',
    confirmText: '卸载',
    cancelText: '取消',
  })
  if (!confirmed) return
  fontManager.removeFont(font.family)
  expandedFamily.value = null
}

function toggleVariant(font: InstalledFont, variant: string) {
  const has = font.variants.includes(variant)
  let newVariants: string[]
  if (has) {
    newVariants = font.variants.filter(v => v !== variant)
    if (newVariants.length === 0) newVariants = ['regular']
  } else {
    newVariants = [...font.variants, variant]
  }
  fontManager.updateVariants(font.family, newVariants)
}

function toggleExpand(family: string) {
  expandedFamily.value = expandedFamily.value === family ? null : family
}

function variantLabel(variant: string): string {
  const map: Record<string, string> = {
    '100': 'Thin',
    '200': 'Extra Light',
    '300': 'Light',
    'regular': 'Regular',
    '500': 'Medium',
    '600': 'Semi Bold',
    '700': 'Bold',
    '800': 'Extra Bold',
    '900': 'Black',
  }
  return map[variant] ?? variant
}
</script>

<template>
  <div class="font-manager">
    <div class="fm-header">
      <div class="flex items-center gap-1.5">
        <Icon icon="lucide:type" :size="14" class="text-gray-500" />
        <span class="text-sm font-semibold text-gray-700">字体管理</span>
      </div>
      <span class="text-[10px] text-gray-400">{{ installedFonts.length }} 个已安装</span>
    </div>

    <div class="fm-global">
      <div class="fm-section-title">
        <span>全局字体</span>
        <button
          v-if="props.globalFontFamily"
          class="fm-reset-btn"
          type="button"
          @click="resetGlobalFont"
        >
          恢复默认
        </button>
      </div>
      <FontFamilySelect
        :model-value="props.globalFontFamily"
        :grapes="props.grapes"
        @select="handleGlobalFontSelect"
      />
      <div class="fm-helper">
        应用于页面正文、表单控件和 H1-H6 默认样式，最终通过 CSS 变量输出。
      </div>
    </div>

    <div class="fm-delivery">
      <div class="fm-delivery-copy">
        <span class="fm-delivery-title">发布字体本地化</span>
        <span class="fm-delivery-desc">开启后发布时下载 Google Fonts 并引用本地字体文件</span>
      </div>
      <button
        class="fm-switch"
        :class="{ 'fm-switch--active': isLocalFontDelivery }"
        type="button"
        role="switch"
        :aria-checked="isLocalFontDelivery"
        title="发布字体本地化"
        @click="isLocalFontDelivery = !isLocalFontDelivery"
      >
        <span class="fm-switch-thumb"></span>
      </button>
    </div>

    <div class="fm-tabs">
      <button
        class="fm-tab"
        :class="{ 'fm-tab--active': activeView === 'installed' }"
        type="button"
        @click="activeView = 'installed'"
      >
        已安装
      </button>
      <button
        class="fm-tab"
        :class="{ 'fm-tab--active': activeView === 'browse' }"
        type="button"
        @click="switchToBrowse"
      >
        浏览字体
      </button>
    </div>

    <div v-if="activeView === 'browse'" class="fm-search">
      <ElInput
        v-model="search"
        size="small"
        placeholder="搜索 Google 字体..."
        clearable
      >
        <template #prefix>
          <Icon icon="lucide:search" :size="12" />
        </template>
      </ElInput>
    </div>

    <div v-if="activeView === 'installed'" class="fm-list">
      <div v-if="installedFonts.length === 0" class="fm-empty">
        <Icon icon="lucide:type" :size="24" class="text-gray-300 mb-2" />
        <p class="text-xs text-gray-400">暂无已安装字体</p>
        <button
          class="fm-browse-btn"
          type="button"
          @click="switchToBrowse"
        >
          <Icon icon="lucide:plus" :size="12" />
          浏览并安装字体
        </button>
      </div>

      <div v-for="font in installedFonts" :key="font.family" class="fm-installed-item">
        <div class="fm-installed-row" @click="toggleExpand(font.family)">
          <span class="fm-font-name" :style="{ fontFamily: font.cssFamily }">
            {{ font.family }}
          </span>
          <span class="fm-font-meta">{{ font.variants.length }} 个变体</span>
          <button
            class="fm-icon-btn text-gray-400 hover:text-red-500"
            title="卸载"
            type="button"
            @click.stop="handleRemove(font)"
          >
            <Icon icon="lucide:trash-2" :size="13" />
          </button>
          <button
            class="fm-icon-btn text-gray-400"
            type="button"
          >
            <Icon
              :icon="expandedFamily === font.family ? 'lucide:chevron-up' : 'lucide:chevron-down'"
              :size="13"
            />
          </button>
        </div>

        <div v-if="expandedFamily === font.family" class="fm-variants">
          <div class="fm-variant-label">选择字重变体：</div>
          <div class="fm-variant-grid">
            <label
              v-for="variant in fontManager.ALL_VARIANTS"
              :key="variant"
              class="fm-variant-checkbox"
            >
              <input
                type="checkbox"
                :checked="font.variants.includes(variant)"
                @change="toggleVariant(font, variant)"
              />
              <span class="fm-variant-text">{{ variantLabel(variant) }}</span>
            </label>
          </div>
          <div
            class="fm-preview-text"
            :style="{ fontFamily: font.cssFamily, fontWeight: 400 }"
          >
            The quick brown fox jumps over the lazy dog
          </div>
          <div
            class="fm-preview-text"
            :style="{ fontFamily: font.cssFamily, fontWeight: 700 }"
          >
            The quick brown fox jumps over the lazy dog
          </div>
        </div>
      </div>
    </div>

    <div v-else ref="listRef" class="fm-list fm-browse-list">
      <div v-if="loading" class="fm-loading">
        <Icon icon="lucide:loader-2" class="animate-spin" :size="16" />
        <span>加载字体列表...</span>
      </div>

      <template v-else>
        <div
          v-for="font in visibleBrowseFonts"
          :key="font.family"
          class="fm-browse-item"
          :data-preview-font="font.googleName"
        >
          <div class="fm-browse-row">
            <span class="fm-font-name" :style="{ fontFamily: font.cssFamily }">
              {{ font.family }}
            </span>
            <span class="fm-font-category">{{ font.category }}</span>
            <button
              v-if="fontManager.isInstalled(font.family)"
              class="fm-installed-badge"
              type="button"
              disabled
            >
              <Icon icon="lucide:check" :size="11" />
              已安装
            </button>
            <button
              v-else
              class="fm-install-btn"
              type="button"
              @click="handleInstall(font)"
            >
              <Icon icon="lucide:plus" :size="11" />
              安装
            </button>
          </div>
        </div>

        <div ref="sentinelRef" class="fm-sentinel">
          <span v-if="hasMore" class="text-gray-400">
            <Icon icon="lucide:loader-2" class="animate-spin" :size="13" />
          </span>
        </div>

        <div v-if="!hasMore && filteredBrowseFonts.length === 0" class="fm-empty">
          <p class="text-xs text-gray-400">无匹配字体</p>
        </div>

        <div v-if="!hasMore && filteredBrowseFonts.length > 0" class="fm-end">
          共 {{ filteredBrowseFonts.length }} 个字体
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped>
.font-manager {
  padding: 12px;
  border-top: 1px solid #f0f0f0;
}

.fm-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.fm-global {
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fafbfc;
}

.fm-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 6px;
  color: #374151;
  font-size: 11px;
  font-weight: 600;
}

.fm-reset-btn {
  padding: 0;
  border: none;
  background: none;
  color: #6b7280;
  cursor: pointer;
  font-size: 10px;
}
.fm-reset-btn:hover {
  color: #2251ff;
}

.fm-helper {
  margin-top: 6px;
  color: #9ca3af;
  font-size: 10px;
  line-height: 16px;
}

.fm-delivery {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 8px;
  margin-bottom: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
}

.fm-delivery-copy {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.fm-delivery-title {
  color: #374151;
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
}

.fm-delivery-desc {
  color: #9ca3af;
  font-size: 10px;
  line-height: 15px;
}

.fm-switch {
  position: relative;
  flex-shrink: 0;
  width: 34px;
  height: 20px;
  padding: 0;
  border: none;
  border-radius: 999px;
  background: #d1d5db;
  cursor: pointer;
  transition: background 0.15s;
}

.fm-switch--active {
  background: #4f46e5;
}

.fm-switch-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 2px rgb(15 23 42 / 18%);
  transition: transform 0.15s;
}

.fm-switch--active .fm-switch-thumb {
  transform: translateX(14px);
}

.fm-tabs {
  display: flex;
  margin-bottom: 8px;
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

.fm-tab {
  flex: 1;
  height: 28px;
  border: none;
  background: #f9fafb;
  color: #6b7280;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: all 0.15s;
}
.fm-tab:not(:last-child) {
  border-right: 1px solid #e5e7eb;
}
.fm-tab:hover {
  color: #374151;
  background: #f3f4f6;
}
.fm-tab--active {
  color: #4f46e5;
  background: #fff;
  font-weight: 600;
}

.fm-search {
  margin-bottom: 8px;
}

.fm-list {
  max-height: 360px;
  overflow-x: hidden;
  overflow-y: auto;
}
.fm-browse-list {
  max-height: 320px;
}

.fm-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.fm-browse-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  padding: 4px 12px;
  border: 1px solid #c7d2fe;
  border-radius: 5px;
  background: none;
  color: #4f46e5;
  cursor: pointer;
  font-size: 11px;
  transition: background 0.15s;
}
.fm-browse-btn:hover {
  background: #eef2ff;
}

.fm-installed-item {
  margin-bottom: 4px;
  overflow: hidden;
  border: 1px solid #f0f0f0;
  border-radius: 6px;
}

.fm-installed-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 8px;
  cursor: pointer;
  transition: background 0.1s;
}
.fm-installed-row:hover {
  background: #f9fafb;
}

.fm-font-name {
  flex: 1;
  min-width: 0;
  color: #374151;
  font-size: 12px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-font-meta,
.fm-font-category {
  flex-shrink: 0;
  color: #9ca3af;
  font-size: 10px;
}

.fm-icon-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  border-radius: 4px;
  background: none;
  cursor: pointer;
  transition: background 0.15s;
}
.fm-icon-btn:hover {
  background: #f3f4f6;
}

.fm-variants {
  padding: 8px;
  border-top: 1px solid #f0f0f0;
  background: #fafbfc;
}

.fm-variant-label {
  margin-bottom: 6px;
  color: #9ca3af;
  font-size: 10px;
}

.fm-variant-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 3px;
}

.fm-variant-checkbox {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 2px 0;
  color: #374151;
  cursor: pointer;
  font-size: 10px;
}
.fm-variant-checkbox input {
  width: 12px;
  height: 12px;
  margin: 0;
  accent-color: #4f46e5;
}

.fm-variant-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-preview-text {
  padding: 4px 0 0;
  color: #6b7280;
  font-size: 12px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.fm-browse-item {
  transition: background 0.1s;
}
.fm-browse-item:hover {
  background: #f9fafb;
}

.fm-browse-row {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 4px;
}

.fm-install-btn {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border: 1px solid #c7d2fe;
  border-radius: 4px;
  background: #fff;
  color: #4f46e5;
  cursor: pointer;
  font-size: 10px;
  font-weight: 500;
  transition: all 0.15s;
}
.fm-install-btn:hover {
  border-color: #818cf8;
  background: #eef2ff;
}

.fm-installed-badge {
  display: flex;
  flex-shrink: 0;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border: 1px solid #a7f3d0;
  border-radius: 4px;
  background: #ecfdf5;
  color: #059669;
  cursor: default;
  font-size: 10px;
  font-weight: 500;
}

.fm-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
}

.fm-end {
  padding: 6px 0;
  color: #d1d5db;
  font-size: 10px;
  text-align: center;
}

.fm-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 0;
  color: #9ca3af;
  font-size: 12px;
}
</style>
