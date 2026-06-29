<script lang="ts" setup>
import { computed, nextTick, onBeforeUnmount, ref, shallowRef, watch } from 'vue'
import { ElInput, ElPopover } from 'element-plus'
import { Icon } from '@iconify/vue'
import { useFontManager } from '../useFontManager.js'
import { injectGoogleFontCss, useGoogleFonts } from '../useGoogleFonts.js'

interface SystemFontItem {
  value: string
  label: string
}

interface FontSelectPayload {
  value: string
  source: 'installed' | 'system' | 'google'
  family?: string
  googleName?: string
}

const SYSTEM_FONTS: SystemFontItem[] = [
  { value: '', label: '默认' },
  { value: 'Arial, sans-serif', label: 'Arial' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif', label: 'Helvetica Neue' },
  { value: 'Verdana, Geneva, sans-serif', label: 'Verdana' },
  { value: '"Trebuchet MS", Helvetica, sans-serif', label: 'Trebuchet MS' },
  { value: 'Tahoma, Geneva, sans-serif', label: 'Tahoma' },
  { value: 'Georgia, "Times New Roman", serif', label: 'Georgia' },
  { value: '"Times New Roman", Times, serif', label: 'Times New Roman' },
  { value: 'Palatino, "Palatino Linotype", "Book Antiqua", serif', label: 'Palatino' },
  { value: '"Courier New", Courier, monospace', label: 'Courier New' },
  { value: '"Lucida Console", Monaco, monospace', label: 'Lucida Console' },
  { value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif', label: 'PingFang SC（苹方）' },
  { value: '"Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif', label: '微软雅黑' },
  { value: '"Source Han Sans CN", "Noto Sans CJK SC", "PingFang SC", sans-serif', label: '思源黑体' },
  { value: '"Source Han Serif CN", "Noto Serif CJK SC", serif', label: '思源宋体' },
  { value: '"STSong", "SimSun", serif', label: '宋体' },
  { value: '"STKaiti", "KaiTi", serif', label: '楷体' },
]

const props = defineProps<{
  modelValue: string
  grapes?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', payload: FontSelectPayload): void
}>()

const visible = ref(false)
const activeTab = ref<'installed' | 'system' | 'google'>('installed')
const search = ref('')
const editorRef = shallowRef<any>(null)

const fontManager = useFontManager()
const { allFonts, loading, load, search: searchFonts } = useGoogleFonts()

props.grapes?.onInit((editor: any) => {
  editorRef.value = editor
})

const canvasDoc = computed(() => {
  try {
    return editorRef.value?.Canvas?.getDocument?.() ?? null
  } catch {
    return null
  }
})

const currentLabel = computed(() => {
  const val = props.modelValue
  if (!val) return '默认字体'

  const installed = fontManager.installedFonts.value.find(font => font.cssFamily === val)
  if (installed) return installed.family

  const systemFont = SYSTEM_FONTS.find(font => font.value === val)
  if (systemFont) return systemFont.label

  const googleFont = allFonts.value.find(font => font.cssFamily === val)
  if (googleFont) return googleFont.family

  return val.replace(/^["']?([^"',]+)["']?.*$/, '$1').trim()
})

const filteredSystemFonts = computed(() => {
  const q = search.value.toLowerCase()
  return q ? SYSTEM_FONTS.filter(font => font.label.toLowerCase().includes(q)) : SYSTEM_FONTS
})

const filteredGoogleFonts = computed(() => searchFonts(search.value))

const PAGE_SIZE = 40
const displayCount = ref(PAGE_SIZE)
const listRef = ref<HTMLElement | null>(null)
const sentinelRef = ref<HTMLElement | null>(null)

watch(search, () => { displayCount.value = PAGE_SIZE })
watch(activeTab, () => { displayCount.value = PAGE_SIZE })

const visibleGoogleFonts = computed(() =>
  filteredGoogleFonts.value.slice(0, displayCount.value)
)

const hasMore = computed(() =>
  displayCount.value < filteredGoogleFonts.value.length
)

let sentinelObserver: IntersectionObserver | null = null

function setupSentinelObserver() {
  sentinelObserver?.disconnect()
  if (!sentinelRef.value) return
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

watch([activeTab, visibleGoogleFonts], async () => {
  if (activeTab.value !== 'google') return
  await nextTick()
  setupSentinelObserver()
}, { flush: 'post' })

onBeforeUnmount(() => sentinelObserver?.disconnect())

const fontPreviewObserver = ref<IntersectionObserver | null>(null)

function setupFontPreviewObserver() {
  fontPreviewObserver.value?.disconnect()
  fontPreviewObserver.value = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        const googleName = (entry.target as HTMLElement).dataset.googleName
        if (googleName) {
          injectGoogleFontCss(googleName, canvasDoc.value)
          fontPreviewObserver.value?.unobserve(entry.target)
        }
      })
    },
    { root: listRef.value, rootMargin: '100px', threshold: 0 }
  )
}

async function observeFontItems() {
  await nextTick()
  if (!fontPreviewObserver.value) return
  const items = listRef.value?.querySelectorAll<HTMLElement>('[data-google-name]') ?? []
  items.forEach(el => fontPreviewObserver.value?.observe(el))
}

watch(visibleGoogleFonts, async () => {
  if (activeTab.value !== 'google') return
  await nextTick()
  observeFontItems()
}, { flush: 'post' })

onBeforeUnmount(() => fontPreviewObserver.value?.disconnect())

async function onShow() {
  displayCount.value = PAGE_SIZE
  if (allFonts.value.length === 0) await load()
  if (activeTab.value === 'google') {
    await nextTick()
    setupFontPreviewObserver()
    observeFontItems()
    setupSentinelObserver()
  }
}

watch(activeTab, async (tab) => {
  if (tab !== 'google') return
  await nextTick()
  setupFontPreviewObserver()
  observeFontItems()
  setupSentinelObserver()
})

function selectSystemFont(font: SystemFontItem) {
  emit('update:modelValue', font.value)
  emit('select', {
    value: font.value,
    source: 'system',
  })
  visible.value = false
  search.value = ''
}

function selectInstalledFont(font: { family: string; googleName: string; cssFamily: string }) {
  emit('update:modelValue', font.cssFamily)
  emit('select', {
    value: font.cssFamily,
    source: 'installed',
    family: font.family,
    googleName: font.googleName,
  })
  visible.value = false
  search.value = ''
}

function selectGoogleFont(family: string, googleName: string, cssFamily: string) {
  injectGoogleFontCss(googleName, canvasDoc.value)
  emit('update:modelValue', cssFamily)
  emit('select', {
    value: cssFamily,
    source: 'google',
    family,
    googleName,
  })
  visible.value = false
  search.value = ''
}
</script>

<template>
  <ElPopover
    v-model:visible="visible"
    placement="bottom-start"
    :width="270"
    trigger="click"
    popper-class="wb-font-popover"
    @show="onShow"
  >
    <template #reference>
      <button
        class="wb-font-trigger"
        :style="modelValue ? { fontFamily: modelValue } : {}"
        type="button"
      >
        <span class="wb-font-trigger-label">{{ currentLabel }}</span>
        <Icon icon="lucide:chevron-down" :size="12" class="text-gray-400 flex-shrink-0" />
      </button>
    </template>

    <div class="wb-font-panel" @mousedown.stop @pointerdown.stop>
      <div class="wb-fp-search">
        <ElInput
          v-model="search"
          size="small"
          placeholder="搜索字体..."
          clearable
        >
          <template #prefix>
            <Icon icon="lucide:search" :size="12" />
          </template>
        </ElInput>
      </div>

      <div class="wb-fp-tabs">
        <button
          class="wb-fp-tab"
          :class="{ 'wb-fp-tab--active': activeTab === 'installed' }"
          type="button"
          @click="activeTab = 'installed'"
        >
          已安装
        </button>
        <button
          class="wb-fp-tab"
          :class="{ 'wb-fp-tab--active': activeTab === 'system' }"
          type="button"
          @click="activeTab = 'system'"
        >
          系统字体
        </button>
        <button
          class="wb-fp-tab"
          :class="{ 'wb-fp-tab--active': activeTab === 'google' }"
          type="button"
          @click="activeTab = 'google'"
        >
          Google 字体
        </button>
      </div>

      <div ref="listRef" class="wb-fp-list">
        <template v-if="activeTab === 'installed'">
          <button
            class="wb-fp-item"
            :class="{ 'wb-fp-item--active': !modelValue }"
            type="button"
            @click="selectSystemFont({ value: '', label: '默认' })"
          >
            <span class="wb-fp-name">默认字体</span>
          </button>

          <button
            v-for="font in fontManager.installedFonts.value"
            :key="font.family"
            class="wb-fp-item"
            :class="{ 'wb-fp-item--active': modelValue === font.cssFamily }"
            type="button"
            @click="selectInstalledFont(font)"
          >
            <span class="wb-fp-name" :style="{ fontFamily: font.cssFamily }">
              {{ font.family }}
            </span>
            <span class="wb-fp-preview" :style="{ fontFamily: font.cssFamily }">
              Aa
            </span>
          </button>

          <div v-if="fontManager.installedFonts.value.length === 0" class="wb-fp-empty">
            暂无已安装字体，请在「全局设置 → 字体管理」中安装
          </div>
        </template>

        <template v-else-if="activeTab === 'system'">
          <button
            v-for="font in filteredSystemFonts"
            :key="font.value"
            class="wb-fp-item"
            :class="{ 'wb-fp-item--active': modelValue === font.value }"
            type="button"
            @click="selectSystemFont(font)"
          >
            <span class="wb-fp-name" :style="font.value ? { fontFamily: font.value } : {}">
              {{ font.label }}
            </span>
            <span v-if="font.value" class="wb-fp-preview" :style="{ fontFamily: font.value }">
              Aa
            </span>
          </button>
          <div v-if="filteredSystemFonts.length === 0" class="wb-fp-empty">无匹配字体</div>
        </template>

        <template v-else>
          <div v-if="loading" class="wb-fp-loading">
            <Icon icon="lucide:loader-2" class="animate-spin" :size="16" />
            <span>加载字体列表...</span>
          </div>

          <template v-else>
            <button
              v-for="font in visibleGoogleFonts"
              :key="font.family"
              class="wb-fp-item"
              :class="{ 'wb-fp-item--active': modelValue === font.cssFamily }"
              type="button"
              :data-google-name="font.googleName"
              @click="selectGoogleFont(font.family, font.googleName, font.cssFamily)"
            >
              <span class="wb-fp-name" :style="{ fontFamily: font.cssFamily }">
                {{ font.family }}
              </span>
              <span class="wb-fp-preview" :style="{ fontFamily: font.cssFamily }">
                Aa
              </span>
            </button>

            <div ref="sentinelRef" class="wb-fp-sentinel">
              <span v-if="hasMore" class="wb-fp-sentinel-hint">
                <Icon icon="lucide:loader-2" class="animate-spin" :size="13" />
              </span>
            </div>

            <div v-if="!hasMore && filteredGoogleFonts.length === 0" class="wb-fp-empty">
              无匹配字体
            </div>

            <div v-if="!hasMore && filteredGoogleFonts.length > 0" class="wb-fp-end">
              共 {{ filteredGoogleFonts.length }} 个字体
            </div>
          </template>
        </template>
      </div>
    </div>
  </ElPopover>
</template>

<style scoped>
.wb-font-trigger {
  display: flex;
  align-items: center;
  gap: 6px;
  width: 100%;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
  overflow: hidden;
}
.wb-font-trigger:hover {
  border-color: #a5b4fc;
  background: #fff;
}
.wb-font-trigger-label {
  flex: 1;
  min-width: 0;
  color: #374151;
  font-size: 12px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-font-panel {
  display: flex;
  flex-direction: column;
}

.wb-fp-search {
  padding: 8px 8px 6px;
  border-bottom: 1px solid #f0f0f0;
}

.wb-fp-tabs {
  display: flex;
  flex-shrink: 0;
  border-bottom: 1px solid #f0f0f0;
}
.wb-fp-tab {
  flex: 1;
  height: 30px;
  border: none;
  border-bottom: 2px solid transparent;
  background: none;
  color: #9ca3af;
  cursor: pointer;
  font-size: 11px;
  font-weight: 500;
  transition: color 0.15s, border-color 0.15s;
}
.wb-fp-tab:hover { color: #374151; }
.wb-fp-tab--active { color: #4f46e5; border-bottom-color: #4f46e5; }

.wb-fp-list {
  flex: 1;
  max-height: 320px;
  overflow-x: hidden;
  overflow-y: auto;
  padding: 4px 0;
}

.wb-fp-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  width: 100%;
  padding: 5px 10px;
  border: none;
  background: none;
  cursor: pointer;
  transition: background 0.1s;
}
.wb-fp-item:hover { background: #f3f4f6; }
.wb-fp-item--active { background: #eef2ff; }

.wb-fp-name {
  flex: 1;
  min-width: 0;
  color: #374151;
  font-size: 12px;
  overflow: hidden;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-fp-preview {
  flex-shrink: 0;
  min-width: 22px;
  color: #6b7280;
  font-size: 14px;
  text-align: right;
  white-space: nowrap;
}

.wb-fp-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 0;
  color: #9ca3af;
  font-size: 12px;
}

.wb-fp-sentinel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 32px;
}
.wb-fp-sentinel-hint {
  color: #9ca3af;
}

.wb-fp-end {
  padding: 6px 0 8px;
  color: #d1d5db;
  font-size: 11px;
  text-align: center;
}

.wb-fp-empty {
  padding: 20px;
  color: #9ca3af;
  font-size: 11px;
  text-align: center;
}
</style>
