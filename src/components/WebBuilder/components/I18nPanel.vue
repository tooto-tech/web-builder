<script lang="ts" setup>
import { computed, onMounted, ref, watch } from 'vue'
import type useWebBuilderI18n from '@/components/WebBuilder/composables/useWebBuilderI18n'
import type { WebBuilderI18nEntry, WebBuilderI18nField } from '@/api/content/webbuilderI18n'
import { TranslationConfigApi, type TranslationConfigVO } from '@/api/translation/config'
import {
  collectI18nKeysFromModel,
  getWebBuilderI18nEntryId,
  isModelI18nSkipped,
  setModelI18nSkipped
} from '@/components/WebBuilder/utils/i18n'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'

type WebBuilderI18nManager = ReturnType<typeof useWebBuilderI18n>

const props = defineProps<{
  manager: WebBuilderI18nManager
  selectedComponent?: any
  selectedRevision?: number
}>()

const fieldLabels: Partial<Record<WebBuilderI18nField, string>> = {
  text: '文本',
  html: 'HTML',
  alt: '图片 Alt',
  title: 'Title',
  placeholder: 'Placeholder',
  'aria-label': 'ARIA Label',
  'seo.title': 'SEO 标题',
  'seo.description': 'SEO 描述',
  'seo.keywords': 'SEO 关键词'
}

const statusLabels = {
  translated: '已翻译',
  missing: '缺失',
  stale: '源文已变更',
  pending: '待翻译',
  source_changed: '源文已变更',
  draft: '草稿',
  empty: '空内容',
  error: '翻译失败'
}

const statusClass = {
  translated: 'wb-i18n-status--translated',
  missing: 'wb-i18n-status--missing',
  stale: 'wb-i18n-status--stale',
  pending: 'wb-i18n-status--missing',
  source_changed: 'wb-i18n-status--stale',
  draft: 'wb-i18n-status--stale',
  empty: 'wb-i18n-status--missing',
  error: 'wb-i18n-status--error'
}

type ProviderOption = {
  key: string
  label: string
  value: string
}

const engineLabels: Record<string, string> = {
  qwen_mt: 'Qwen-MT',
  qwen: 'Qwen-MT',
  qwenmt: 'Qwen-MT',
  deepseek: 'DeepSeek',
  deepl: 'DeepL',
  tencent_tmt: '腾讯云 TMT',
  volcengine_mt: '火山引擎翻译'
}

const selectedEntryId = ref('')
const providerOptions = ref<ProviderOption[]>([])
const providerLoading = ref(false)
const providerConfigError = ref('')
const noTranslateRevision = ref(0)

const selectedKeyDependency = computed(
  () =>
    `${props.manager.sourceRevision.value}:${props.selectedRevision ?? 0}:${
      props.selectedComponent?.cid ?? ''
    }`
)
const selectedKeys = computed(() => {
  if (!selectedKeyDependency.value && !props.selectedComponent) return new Set<string>()
  return collectI18nKeysFromModel(props.selectedComponent, { includeAncestors: true })
})

const hasSelectedComponent = computed(() => Boolean(props.selectedComponent))
const selectedNoTranslate = computed(() => {
  void noTranslateRevision.value
  void selectedKeyDependency.value
  return isModelI18nSkipped(props.selectedComponent)
})
const scopedEntries = computed(() => {
  if (hasSelectedComponent.value && !selectedKeys.value.size) return []
  const keys = selectedKeys.value
  if (!keys.size) return props.manager.entries.value
  const selectedEntries = props.manager.entries.value.filter((entry) => keys.has(entry.key))
  return selectedEntries.length ? selectedEntries : props.manager.entries.value
})

const visibleEntries = computed(() => scopedEntries.value)

const selectedOnly = computed(() => hasSelectedComponent.value)
const dirtyIds = computed(() => new Set(props.manager.dirtyEntryIds.value))
const isActionableEntry = (entry: WebBuilderI18nEntry) =>
  entry.status === 'missing' || entry.status === 'stale' || entry.status === 'error'
const activeEntry = computed(() => {
  return (
    visibleEntries.value.find(
      (entry) => getWebBuilderI18nEntryId(entry) === selectedEntryId.value
    ) ||
    visibleEntries.value[0] ||
    null
  )
})
const hasEnabledProvider = computed(() => providerOptions.value.length > 0)
const visibleActionableEntries = computed(() => visibleEntries.value.filter(isActionableEntry))
const hasActionableEntries = computed(() => props.manager.actionableEntries.value.length > 0)

const sourceLanguageLabel = computed(() => {
  const current = props.manager.sourceLocale.value
  return (
    props.manager.languages.value.find((lang) => lang.value === current)?.label ||
    current ||
    '源语言'
  )
})

const targetLanguageLabel = computed(() => {
  const current = props.manager.locale.value
  return (
    props.manager.languages.value.find((lang) => lang.value === current)?.label ||
    current ||
    '目标语言'
  )
})

const sourcePreview = (entry: WebBuilderI18nEntry) => {
  const source = `${entry.source ?? ''}`.trim()
  return source.length > 320 ? `${source.slice(0, 320)}...` : source
}

const entryOptionLabel = (entry: WebBuilderI18nEntry) => {
  const source = sourcePreview(entry).replace(/\s+/g, ' ')
  const label = fieldLabel(entry.field)
  const text = source.length > 64 ? `${source.slice(0, 64)}...` : source
  return `${label} - ${text || entry.label || entry.key}`
}

const fieldLabel = (field: WebBuilderI18nField) => {
  const known = fieldLabels[field]
  if (known) return known
  if (`${field}`.startsWith('prop:')) return '组件配置'
  if (`${field}`.startsWith('attr:')) return '属性'
  return `${field}`
}

const providerLabel = (config: TranslationConfigVO) => {
  const engineType = `${config.engineType || ''}`
  const engineLabel = engineLabels[engineType] || engineType || '翻译引擎'
  return config.model ? `${engineLabel} / ${config.model}` : engineLabel
}

const loadProviderOptions = async () => {
  providerLoading.value = true
  providerConfigError.value = ''
  try {
    const configs = await TranslationConfigApi.getEnabledConfigs()
    providerOptions.value = configs
      .filter((config) => config.engineType)
      .map((config) => ({
        key: `${config.id ?? config.engineType}-${config.model ?? ''}`,
        label: providerLabel(config),
        value: `${config.engineType}`
      }))
    if (!providerOptions.value.length) {
      props.manager.setProvider('')
      providerConfigError.value = '未启用翻译引擎，请先到翻译配置中启用'
      return
    }
    if (!providerOptions.value.some((option) => option.value === props.manager.provider.value)) {
      props.manager.setProvider(providerOptions.value[0].value)
    }
  } catch (error: any) {
    providerOptions.value = []
    props.manager.setProvider('')
    providerConfigError.value = error?.message || '加载启用翻译引擎失败'
  } finally {
    providerLoading.value = false
  }
}

const handleMachineTranslate = async () => {
  if (!hasEnabledProvider.value) {
    ElMessage.warning(providerConfigError.value || '请先启用翻译引擎')
    return
  }
  await props.manager.machineTranslate('missing')
  if (props.manager.lastError.value) {
    ElMessage.warning(props.manager.lastError.value)
  }
}

const handleMachineTranslateActive = async () => {
  const entry = activeEntry.value
  if (!entry) return
  if (!hasEnabledProvider.value) {
    ElMessage.warning(providerConfigError.value || '请先启用翻译引擎')
    return
  }
  await props.manager.machineTranslateEntries([entry])
  if (props.manager.lastError.value) {
    ElMessage.warning(props.manager.lastError.value)
  }
}

const handleNextTodo = () => {
  const candidates = visibleActionableEntries.value.length
    ? visibleEntries.value
    : props.manager.entries.value
  if (!candidates.length) return
  const currentIndex = candidates.findIndex(
    (entry) => getWebBuilderI18nEntryId(entry) === selectedEntryId.value
  )
  const next =
    candidates.slice(currentIndex + 1).find(isActionableEntry) || candidates.find(isActionableEntry)
  if (!next) return
  selectedEntryId.value = getWebBuilderI18nEntryId(next)
  props.manager.selectEntryComponent(next)
}

const handleRefresh = async () => {
  await loadProviderOptions()
  props.manager.refreshSourceEntries()
  await props.manager.loadBundle()
}

const handleLocaleChange = (event: Event) => {
  props.manager.setLocale((event.target as HTMLSelectElement).value)
}

const handleProviderChange = (event: Event) => {
  props.manager.setProvider((event.target as HTMLSelectElement).value)
}

const handleEntryChange = (event: Event) => {
  selectedEntryId.value = (event.target as HTMLSelectElement).value
}

const handleToggleNoTranslate = () => {
  const nextSkipped = !selectedNoTranslate.value
  if (!setModelI18nSkipped(props.selectedComponent, nextSkipped)) return
  noTranslateRevision.value += 1
  props.manager.refreshSourceEntries()
  ElMessage.success(nextSkipped ? '已设为不翻译' : '已恢复翻译')
}

const handleActiveTranslationInput = (event: Event) => {
  const entry = activeEntry.value
  if (!entry) return
  props.manager.setTranslation(entry, (event.target as HTMLTextAreaElement).value)
}

onMounted(async () => {
  await props.manager.loadLanguages()
  await loadProviderOptions()
  await props.manager.loadBundle()
})

watch(
  visibleEntries,
  (entries) => {
    const ids = entries.map(getWebBuilderI18nEntryId)
    if (!ids.length) {
      selectedEntryId.value = ''
      return
    }
    if (!selectedEntryId.value || !ids.includes(selectedEntryId.value)) {
      selectedEntryId.value = ids[0]
    }
  },
  { immediate: true }
)

watch(
  () => [props.selectedComponent?.cid ?? '', props.selectedRevision ?? 0],
  ([cid]) => {
    if (!cid) return
    props.manager.refreshSourceEntries()
  }
)
</script>

<template>
  <aside class="wb-i18n-panel">
    <div class="wb-i18n-panel__header">
      <div>
        <div class="wb-i18n-panel__title">片段翻译</div>
        <div class="wb-i18n-panel__meta">
          {{ selectedOnly ? '当前选中组件' : '全部可翻译片段' }}
        </div>
      </div>
      <button class="wb-i18n-icon-btn" type="button" title="刷新" @click="handleRefresh">
        ↻
      </button>
    </div>

    <div class="wb-i18n-controls">
      <label class="wb-i18n-field">
        <span>语言</span>
        <select
          :value="manager.locale.value"
          class="wb-i18n-select"
          :disabled="!manager.targetLanguages.value.length"
          @change="handleLocaleChange"
        >
          <option v-if="!manager.targetLanguages.value.length" value=""> 未启用目标语言 </option>
          <option
            v-for="lang in manager.targetLanguages.value"
            :key="lang.value"
            :value="lang.value"
          >
            {{ lang.label }}
          </option>
        </select>
      </label>

      <label class="wb-i18n-field">
        <span>翻译引擎</span>
        <select
          :value="manager.provider.value"
          class="wb-i18n-select"
          :disabled="providerLoading || !providerOptions.length"
          @change="handleProviderChange"
        >
          <option v-if="providerLoading" value="">加载启用引擎...</option>
          <option v-else-if="!providerOptions.length" value="">未启用翻译引擎</option>
          <template v-else>
            <option v-for="provider in providerOptions" :key="provider.key" :value="provider.value">
              {{ provider.label }}
            </option>
          </template>
        </select>
        <span v-if="providerConfigError" class="wb-i18n-field__tip">
          {{ providerConfigError }}
        </span>
      </label>
    </div>

    <div class="wb-i18n-summary">
      <span>{{ manager.translatedCount.value }} 已翻译</span>
      <span>{{ manager.missingCount.value }} 缺失</span>
    </div>

    <button
      v-if="hasSelectedComponent"
      class="wb-i18n-btn wb-i18n-btn--secondary wb-i18n-no-translate-btn"
      type="button"
      @click="handleToggleNoTranslate"
    >
      {{ selectedNoTranslate ? '恢复翻译此组件' : '不翻译此组件' }}
    </button>

    <div v-if="manager.lastError.value" class="wb-i18n-error">
      {{ manager.lastError.value }}
    </div>

    <div class="wb-i18n-panel__body">
      <div v-if="manager.loading.value" class="wb-i18n-empty">加载翻译 bundle...</div>
      <div v-else-if="selectedNoTranslate" class="wb-i18n-empty"> 当前组件已排除翻译。 </div>
      <div v-else-if="!visibleEntries.length" class="wb-i18n-empty"> 当前项目没有可翻译文本。 </div>
      <template v-else>
        <label class="wb-i18n-field wb-i18n-picker">
          <span>片段</span>
          <select :value="selectedEntryId" class="wb-i18n-select" @change="handleEntryChange">
            <option
              v-for="entry in visibleEntries"
              :key="getWebBuilderI18nEntryId(entry)"
              :value="getWebBuilderI18nEntryId(entry)"
            >
              {{ entryOptionLabel(entry) }}
            </option>
          </select>
        </label>

        <section v-if="activeEntry" class="wb-i18n-editor">
          <div class="wb-i18n-editor__bar">
            <span class="wb-i18n-editor__title">{{ fieldLabel(activeEntry.field) }}</span>
            <span class="wb-i18n-status" :class="statusClass[activeEntry.status || 'missing']">
              {{ statusLabels[activeEntry.status || 'missing'] }}
            </span>
            <span v-if="dirtyIds.has(getWebBuilderI18nEntryId(activeEntry))" class="wb-i18n-dirty">
              未保存
            </span>
          </div>

          <div class="wb-i18n-translation-stack">
            <label class="wb-i18n-translation-block">
              <span>From {{ sourceLanguageLabel }}</span>
              <textarea
                class="wb-i18n-textarea wb-i18n-textarea--source"
                :value="activeEntry.source"
                rows="3"
                readonly
              ></textarea>
            </label>

            <label class="wb-i18n-translation-block wb-i18n-translation-block--target">
              <span>To {{ targetLanguageLabel }}</span>
              <textarea
                class="wb-i18n-textarea"
                :value="activeEntry.translation"
                rows="4"
                placeholder="输入译文，或使用翻译引擎生成"
                @input="handleActiveTranslationInput"
              ></textarea>
            </label>
          </div>

          <div class="wb-i18n-actions wb-i18n-actions--inline">
            <button
              class="wb-i18n-btn"
              type="button"
              :disabled="
                manager.translating.value ||
                manager.loading.value ||
                !activeEntry ||
                !hasEnabledProvider
              "
              @click="handleMachineTranslateActive"
            >
              {{ manager.translating.value ? '翻译中...' : 'AI 生成' }}
            </button>
          </div>
        </section>
      </template>
    </div>

    <div class="wb-i18n-actions wb-i18n-panel__footer">
      <button
        class="wb-i18n-btn wb-i18n-btn--secondary"
        type="button"
        :disabled="
          manager.translating.value ||
          manager.loading.value ||
          !manager.missingCount.value ||
          !hasEnabledProvider
        "
        @click="handleMachineTranslate"
      >
        自动翻译缺失项
      </button>
      <button
        class="wb-i18n-btn wb-i18n-btn--secondary"
        type="button"
        :disabled="!hasActionableEntries"
        @click="handleNextTodo"
      >
        下一个待处理
      </button>
    </div>
  </aside>
</template>

<style scoped>
.wb-i18n-panel {
  box-sizing: border-box;
  display: flex;
  height: 100%;
  min-height: 0;
  flex-direction: column;
  gap: 10px;
  overflow: hidden;
  padding: 14px;
  color: #1f2937;
}

.wb-i18n-panel *,
.wb-i18n-panel *::before,
.wb-i18n-panel *::after {
  box-sizing: border-box;
}

.wb-i18n-panel__header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.wb-i18n-panel__title {
  font-size: 14px;
  font-weight: 700;
}

.wb-i18n-panel__meta {
  margin-top: 2px;
  font-size: 12px;
  color: #6b7280;
}

.wb-i18n-panel__body {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.wb-i18n-panel__footer {
  flex: 0 0 auto;
  border-top: 1px solid #eef2f7;
  padding-top: 10px;
}

.wb-i18n-icon-btn,
.wb-i18n-btn,
.wb-i18n-select,
.wb-i18n-textarea {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
}

.wb-i18n-icon-btn {
  width: 28px;
  height: 28px;
  color: #374151;
}

.wb-i18n-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

.wb-i18n-field__tip {
  font-size: 12px;
  font-weight: 400;
  line-height: 1.5;
  color: #c2410c;
}

.wb-i18n-controls {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: 1fr;
  gap: 10px;
}

.wb-i18n-picker {
  border-top: 1px solid #eef2f7;
  padding-top: 10px;
}

.wb-i18n-select {
  height: 32px;
  padding: 0 8px;
  font-size: 13px;
}

.wb-i18n-summary {
  display: grid;
  flex: 0 0 auto;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px;
  font-size: 12px;
  color: #4b5563;
}

.wb-i18n-summary span {
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 6px 4px;
  text-align: center;
}

.wb-i18n-filters {
  display: flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 6px;
}

.wb-i18n-filter {
  min-height: 26px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #fff;
  padding: 0 8px;
  font-size: 12px;
  color: #4b5563;
}

.wb-i18n-filter--active {
  border-color: #2563eb;
  background: #eff6ff;
  color: #1d4ed8;
}

.wb-i18n-error {
  border: 1px solid #fecaca;
  border-radius: 6px;
  background: #fef2f2;
  padding: 8px;
  font-size: 12px;
  color: #b91c1c;
}

.wb-i18n-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.wb-i18n-actions--inline {
  grid-template-columns: 1fr;
}

.wb-i18n-btn {
  min-height: 32px;
  padding: 0 8px;
  font-size: 12px;
  font-weight: 600;
  color: #374151;
}

.wb-i18n-btn:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.wb-i18n-btn--primary {
  grid-column: 1 / -1;
  border-color: #2563eb;
  background: #2563eb;
  color: #fff;
}

.wb-i18n-btn--secondary {
  min-height: 30px;
  background: #f9fafb;
}

.wb-i18n-no-translate-btn {
  flex: 0 0 auto;
  width: 100%;
}

.wb-i18n-editor {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 10px;
}

.wb-i18n-editor__bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  font-weight: 700;
  color: #111827;
}

.wb-i18n-editor__title {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wb-i18n-editor__meta {
  display: flex;
  gap: 8px;
  font-size: 12px;
  color: #6b7280;
}

.wb-i18n-translation-stack {
  display: flex;
  min-height: 0;
  flex: 1 1 auto;
  flex-direction: column;
  gap: 8px;
}

.wb-i18n-translation-block {
  display: flex;
  min-height: 0;
  flex: 0 0 auto;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: #4b5563;
}

.wb-i18n-translation-block--target {
  flex: 1 1 auto;
}

.wb-i18n-status,
.wb-i18n-dirty {
  border-radius: 999px;
  padding: 2px 6px;
  font-size: 11px;
  line-height: 16px;
}

.wb-i18n-status--translated {
  background: #ecfdf5;
  color: #047857;
}

.wb-i18n-status--missing {
  background: #fff7ed;
  color: #c2410c;
}

.wb-i18n-status--stale {
  background: #eff6ff;
  color: #1d4ed8;
}

.wb-i18n-status--error {
  background: #fef2f2;
  color: #b91c1c;
}

.wb-i18n-dirty {
  background: #f3f4f6;
  color: #4b5563;
}

.wb-i18n-textarea {
  margin-top: 8px;
  width: 100%;
  min-height: 82px;
  flex: 0 0 auto;
  resize: none;
  padding: 8px;
  font-size: 12px;
  line-height: 1.5;
}

.wb-i18n-translation-block .wb-i18n-textarea {
  margin-top: 0;
}

.wb-i18n-textarea--source {
  min-height: 74px;
  background: #f9fafb;
  color: #374151;
}

.wb-i18n-translation-block--target .wb-i18n-textarea {
  min-height: 120px;
  flex: 1 1 auto;
}

.wb-i18n-empty {
  padding: 24px 8px;
  text-align: center;
  font-size: 12px;
  color: #6b7280;
}
</style>
