<script lang="ts" setup>
import { ref, computed, watch, onBeforeUnmount, nextTick, shallowRef } from 'vue'
import { ElPopover, ElInput } from 'element-plus'
import { Icon } from '@iconify/vue'
import type { WbStyleProperty } from '../../config/wbStyleSectors'
import { useGoogleFonts, injectGoogleFontCss } from '../../composables/useGoogleFonts'
import { useFontManager } from '../../composables/useFontManager'

// ── 系统字体（本地可用，无需加载）────────────────────────────────

interface SystemFontItem {
  value: string
  label: string
}

const SYSTEM_FONTS: SystemFontItem[] = [
  { value: '',                                                                          label: '默认' },
  { value: 'Arial, sans-serif',                                                         label: 'Arial' },
  { value: '"Helvetica Neue", Helvetica, Arial, sans-serif',                            label: 'Helvetica Neue' },
  { value: 'Verdana, Geneva, sans-serif',                                               label: 'Verdana' },
  { value: '"Trebuchet MS", Helvetica, sans-serif',                                     label: 'Trebuchet MS' },
  { value: 'Tahoma, Geneva, sans-serif',                                                label: 'Tahoma' },
  { value: 'Georgia, "Times New Roman", serif',                                         label: 'Georgia' },
  { value: '"Times New Roman", Times, serif',                                           label: 'Times New Roman' },
  { value: 'Palatino, "Palatino Linotype", "Book Antiqua", serif',                      label: 'Palatino' },
  { value: '"Courier New", Courier, monospace',                                         label: 'Courier New' },
  { value: '"Lucida Console", Monaco, monospace',                                       label: 'Lucida Console' },
  { value: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif', label: 'PingFang SC（苹方）' },
  { value: '"Microsoft YaHei", "WenQuanYi Micro Hei", sans-serif',                     label: '微软雅黑' },
  { value: '"Source Han Sans CN", "Noto Sans CJK SC", "PingFang SC", sans-serif',      label: '思源黑体' },
  { value: '"Source Han Serif CN", "Noto Serif CJK SC", serif',                        label: '思源宋体' },
  { value: '"STSong", "SimSun", serif',                                                 label: '宋体' },
  { value: '"STKaiti", "KaiTi", serif',                                                 label: '楷体' },
]

// ── Props / Emits ─────────────────────────────────────────────────

const props = defineProps<{
  property: WbStyleProperty
  modelValue: string
  grapes?: any
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'select', payload: {
    value: string
    source: 'installed' | 'system' | 'google'
    family?: string
    googleName?: string
  }): void
}>()

// ── 内部状态 ──────────────────────────────────────────────────────

const visible   = ref(false)
const activeTab = ref<'installed' | 'system' | 'google'>('installed')
const search    = ref('')
const _editor   = shallowRef<any>(null)

// Font manager (installed fonts)
const fontManager = useFontManager()

// Google fonts composable
const { allFonts, loading, load, search: searchFonts } = useGoogleFonts()

// 当前 GrapesJS Canvas document（用于注入字体 CSS）
const canvasDoc = computed(() => {
  try { return _editor.value?.Canvas?.getDocument?.() ?? null } catch { return null }
})

// 捕获编辑器引用
props.grapes?.onInit((editor: any) => { _editor.value = editor })

// ── 当前字体显示名 ────────────────────────────────────────────────

const currentLabel = computed(() => {
  const val = props.modelValue
  if (!val) return '默认字体'
  // 先在已安装字体中查找
  const installed = fontManager.installedFonts.value.find(f => f.cssFamily === val)
  if (installed) return installed.family
  const sys = SYSTEM_FONTS.find(f => f.value === val)
  if (sys) return sys.label
  const gf = allFonts.value.find(f => f.cssFamily === val)
  if (gf) return gf.family
  return val.replace(/^["']?([^"',]+)["']?.*$/, '$1').trim()
})

// ── 搜索过滤 ──────────────────────────────────────────────────────

const filteredSystemFonts = computed(() => {
  const q = search.value.toLowerCase()
  return q ? SYSTEM_FONTS.filter(f => f.label.toLowerCase().includes(q)) : SYSTEM_FONTS
})

const filteredGoogleFonts = computed(() => searchFonts(search.value))

// ── 无限滚动 ──────────────────────────────────────────────────────

const PAGE_SIZE = 40
const displayCount = ref(PAGE_SIZE)

// 搜索词变化时重置分页
watch(search, () => { displayCount.value = PAGE_SIZE })
// Tab 切换时重置
watch(activeTab, () => { displayCount.value = PAGE_SIZE })

const visibleGoogleFonts = computed(() =>
  filteredGoogleFonts.value.slice(0, displayCount.value)
)

const hasMore = computed(() =>
  displayCount.value < filteredGoogleFonts.value.length
)

// 滚动容器 ref
const listRef = ref<HTMLElement | null>(null)
// 哨兵元素 ref（放在列表底部，触发加载更多）
const sentinelRef = ref<HTMLElement | null>(null)

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

// 当 Google tab 显示且有字体时，建立哨兵观察者
watch([activeTab, visibleGoogleFonts], async () => {
  if (activeTab.value !== 'google') return
  await nextTick()
  setupSentinelObserver()
}, { flush: 'post' })

onBeforeUnmount(() => sentinelObserver?.disconnect())

// ── 字体预览懒加载（IntersectionObserver per item）────────────────

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

// 重新观察所有未加载的字体条目
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

// ── 打开弹窗 ──────────────────────────────────────────────────────

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

// tab 切换时初始化 observer
watch(activeTab, async (tab) => {
  if (tab !== 'google') return
  await nextTick()
  setupFontPreviewObserver()
  observeFontItems()
  setupSentinelObserver()
})

// ── 选择字体 ──────────────────────────────────────────────────────

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
  <el-popover
    v-model:visible="visible"
    placement="bottom-start"
    :width="270"
    trigger="click"
    popper-class="wb-font-popover"
    @show="onShow"
  >
    <!-- 触发按钮 -->
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

    <!-- 弹窗 -->
    <div class="wb-font-panel" @mousedown.stop @pointerdown.stop>

      <!-- 搜索框 -->
      <div class="wb-fp-search">
        <el-input
          v-model="search"
          size="small"
          placeholder="搜索字体..."
          clearable
        >
          <template #prefix>
            <Icon icon="lucide:search" :size="12" />
          </template>
        </el-input>
      </div>

      <!-- Tab 切换 -->
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

      <!-- 字体列表 -->
      <div ref="listRef" class="wb-fp-list">

        <!-- 已安装字体 -->
        <template v-if="activeTab === 'installed'">
          <!-- 默认字体选项 -->
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

        <!-- 系统字体 -->
        <template v-if="activeTab === 'system'">
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

        <!-- Google 字体 -->
        <template v-else>
          <!-- 加载中 -->
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

            <!-- 加载更多哨兵 -->
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
  </el-popover>
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
  font-size: 12px;
  color: #374151;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
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
  border-bottom: 1px solid #f0f0f0;
  flex-shrink: 0;
}
.wb-fp-tab {
  flex: 1;
  height: 30px;
  font-size: 11px;
  font-weight: 500;
  color: #9ca3af;
  background: none;
  border: none;
  border-bottom: 2px solid transparent;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}
.wb-fp-tab:hover { color: #374151; }
.wb-fp-tab--active { color: #4f46e5; border-bottom-color: #4f46e5; }

.wb-fp-list {
  flex: 1;
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
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
  font-size: 12px;
  color: #374151;
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: left;
}

.wb-fp-preview {
  font-size: 14px;
  color: #6b7280;
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 22px;
  text-align: right;
}

.wb-fp-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 24px 0;
  font-size: 12px;
  color: #9ca3af;
}

.wb-fp-sentinel {
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.wb-fp-sentinel-hint {
  color: #9ca3af;
}

.wb-fp-end {
  text-align: center;
  font-size: 11px;
  color: #d1d5db;
  padding: 6px 0 8px;
}

.wb-fp-empty {
  padding: 20px;
  text-align: center;
  font-size: 11px;
  color: #9ca3af;
}
</style>
