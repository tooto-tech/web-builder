<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElDatePicker, ElInputNumber, ElOption, ElPopconfirm, ElSelect, ElSwitch } from 'element-plus'
import {
  LAYOUT_RULE_TARGET_RESOURCE_TYPES,
  cloneLayoutSettings,
  getGrapesPageId,
  getGrapesPageName,
  layoutTargetMatchesPage,
  getPageLayoutSlot,
  type LayoutRuleConditions,
  type LayoutRuleTargetResourceType,
  type LayoutTimeRange,
  type LayoutMatchMode,
  type LayoutRule,
  type LayoutSlotKey,
  type WebBuilderLayoutSettings,
} from '../utils/layoutSettings'
import {
  type RulePageOption,
} from '../utils/layoutRulePages'

interface LayoutRuleFieldOption {
  value: string | number
  label: string
}

const props = defineProps<{
  pages: any[]
  layoutSettings: WebBuilderLayoutSettings
  setLayoutSettings: (settings: WebBuilderLayoutSettings) => void
  loadRulePageOptions: () => Promise<RulePageOption[]>
  ensureRulesEditable?: (silent?: boolean) => Promise<boolean>
  getRulesLockState?: () => { status?: string; message?: string }
  getFieldOptions?: (
    targetType: LayoutRuleTargetResourceType | null,
    fieldKey: string,
  ) => LayoutRuleFieldOption[]
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const expandedRuleId = ref<string | null>(null)
const selectablePages = ref<RulePageOption[]>([])
const loadingPages = ref(false)

type DynamicTargetResourceType = Exclude<LayoutRuleTargetResourceType, 'PAGE'>

const targetResourceTypeLabels: Record<LayoutRuleTargetResourceType, string> = {
  PAGE: '静态页面',
  TEMP_POST_DETAIL: '文章详情',
  TEMP_POST_CATEGORY_LIST: '文章分类列表',
  TEMP_PRODUCT_DETAIL: '产品详情',
  TEMP_PRODUCT_CATEGORY_LIST: '产品分类详情/列表',
  TEMP_MEDIA_DETAIL: '媒体详情',
  TEMP_MEDIA_CATEGORY_LIST: '媒体分类列表',
}

const targetResourceTypeOptions = LAYOUT_RULE_TARGET_RESOURCE_TYPES.map((value) => ({
  value,
  label: targetResourceTypeLabels[value],
}))

const conditionFieldMap: Record<DynamicTargetResourceType, Array<{
  key: keyof LayoutRuleConditions
  label: string
  kind: 'numbers' | 'strings' | 'daterange'
  placeholder: string
}>> = {
  TEMP_POST_DETAIL: [
    { key: 'postIds', label: '指定文章', kind: 'numbers', placeholder: '搜索文章' },
    { key: 'excludePostIds', label: '排除文章', kind: 'numbers', placeholder: '搜索排除文章' },
    { key: 'categoryIds', label: '文章分类', kind: 'numbers', placeholder: '选择文章分类' },
    { key: 'excludeCategoryIds', label: '排除文章分类', kind: 'numbers', placeholder: '选择排除分类' },
    { key: 'typeIds', label: '文章类型', kind: 'numbers', placeholder: '选择文章类型' },
    { key: 'excludeTypeIds', label: '排除文章类型', kind: 'numbers', placeholder: '选择排除类型' },
    { key: 'tagIds', label: '标签', kind: 'numbers', placeholder: '选择标签' },
    { key: 'excludeTagIds', label: '排除标签', kind: 'numbers', placeholder: '选择排除标签' },
    { key: 'templateNames', label: '模板名', kind: 'strings', placeholder: '输入模板名' },
    { key: 'publishTimeRange', label: '发布时间', kind: 'daterange', placeholder: '' },
  ],
  TEMP_POST_CATEGORY_LIST: [
    { key: 'categoryIds', label: '指定分类', kind: 'numbers', placeholder: '选择文章分类' },
    { key: 'excludeCategoryIds', label: '排除分类', kind: 'numbers', placeholder: '选择排除分类' },
    { key: 'rootCategoryIds', label: '根分类', kind: 'numbers', placeholder: '选择根分类' },
    { key: 'levels', label: '层级', kind: 'numbers', placeholder: '选择层级' },
    { key: 'typeIds', label: '文章类型页', kind: 'numbers', placeholder: '选择文章类型' },
  ],
  TEMP_PRODUCT_DETAIL: [
    { key: 'spuIds', label: '指定产品', kind: 'numbers', placeholder: '搜索产品' },
    { key: 'excludeSpuIds', label: '排除产品', kind: 'numbers', placeholder: '搜索排除产品' },
    { key: 'categoryIds', label: '产品分类', kind: 'numbers', placeholder: '选择产品分类' },
    { key: 'excludeCategoryIds', label: '排除产品分类', kind: 'numbers', placeholder: '选择排除分类' },
    { key: 'brandIds', label: '品牌', kind: 'numbers', placeholder: '选择品牌' },
    { key: 'createTimeRange', label: '创建时间', kind: 'daterange', placeholder: '' },
  ],
  TEMP_PRODUCT_CATEGORY_LIST: [
    { key: 'categoryIds', label: '指定分类', kind: 'numbers', placeholder: '选择产品分类' },
    { key: 'excludeCategoryIds', label: '排除分类', kind: 'numbers', placeholder: '选择排除分类' },
    { key: 'rootCategoryIds', label: '根分类', kind: 'numbers', placeholder: '选择根分类' },
    { key: 'levels', label: '层级', kind: 'numbers', placeholder: '选择层级' },
  ],
  TEMP_MEDIA_DETAIL: [
    { key: 'resourceIds', label: '指定媒体资源', kind: 'numbers', placeholder: '搜索媒体资源' },
    { key: 'excludeResourceIds', label: '排除媒体资源', kind: 'numbers', placeholder: '搜索排除媒体资源' },
    { key: 'categoryIds', label: '媒体分类', kind: 'numbers', placeholder: '选择媒体分类' },
    { key: 'excludeCategoryIds', label: '排除媒体分类', kind: 'numbers', placeholder: '选择排除分类' },
    { key: 'mediaTypes', label: '媒体类型', kind: 'strings', placeholder: '输入媒体类型' },
    { key: 'publishTimeRange', label: '发布时间', kind: 'daterange', placeholder: '' },
  ],
  TEMP_MEDIA_CATEGORY_LIST: [
    { key: 'categoryIds', label: '媒体分类', kind: 'numbers', placeholder: '选择媒体分类' },
    { key: 'excludeCategoryIds', label: '排除媒体分类', kind: 'numbers', placeholder: '选择排除分类' },
  ],
}

const optionOnlyFields = new Set<keyof LayoutRuleConditions>([
  'postIds',
  'excludePostIds',
  'resourceIds',
  'excludeResourceIds',
  'spuIds',
  'excludeSpuIds',
])

const currentLayoutPage = computed(() => {
  return props.pages.find((page: any) => !!getPageLayoutSlot(page)) ?? null
})

const currentSlot = computed<LayoutSlotKey | null>(() => {
  return currentLayoutPage.value ? getPageLayoutSlot(currentLayoutPage.value) : null
})

const currentLayoutId = computed(() => {
  return currentLayoutPage.value ? getGrapesPageId(currentLayoutPage.value) : ''
})

const currentLayoutName = computed(() => {
  return currentLayoutPage.value ? getGrapesPageName(currentLayoutPage.value) : ''
})

const rulesLockState = computed(() => props.getRulesLockState?.() ?? {})
const rulesReadonly = computed(() =>
  ['conflict', 'error', 'acquiring'].includes(`${rulesLockState.value.status ?? ''}`),
)

const activeRules = computed(() => {
  const slotKey = currentSlot.value
  const layoutPage = currentLayoutPage.value
  if (!slotKey || !layoutPage) return []
  return props.layoutSettings[slotKey].rules.filter((rule) => layoutTargetMatchesPage(rule.layoutId, layoutPage))
})

async function loadSelectablePages() {
  loadingPages.value = true
  try {
    selectablePages.value = await props.loadRulePageOptions()
  } catch (error) {
    console.warn('[WebBuilder] 页面规则候选页加载失败', error)
    selectablePages.value = []
  } finally {
    loadingPages.value = false
  }
}

async function ensureRulesAccess(silent = false) {
  if (!props.ensureRulesEditable) return true
  return props.ensureRulesEditable(silent)
}

function updateSettings(mutator: (next: ReturnType<typeof cloneLayoutSettings>) => void) {
  const next = cloneLayoutSettings(props.layoutSettings)
  mutator(next)
  props.setLayoutSettings(next)
  emit('change')
}

function normalizeRuleOrder(rules: LayoutRule[]) {
  rules.forEach((rule, index) => {
    if (typeof rule.priority !== 'number' || !Number.isFinite(rule.priority)) {
      rule.priority = index
    }
  })
}

function createRule(slotKey: LayoutSlotKey, layoutId: string, index: number): LayoutRule {
  return {
    id: `${slotKey}-rule-${Date.now().toString(36)}-${index + 1}`,
    name: `规则 ${index + 1}`,
    layoutId,
    matchMode: 'exclude',
    pageIds: [],
    enabled: true,
    priority: index * 10,
    targetResourceTypes: [],
    conditions: {},
  }
}

async function addRule() {
  const slotKey = currentSlot.value
  const layoutId = currentLayoutId.value
  if (!slotKey || !layoutId) return
  if (!(await ensureRulesAccess())) return

  let createdRuleId = ''
  updateSettings((next) => {
    const rules = next[slotKey].rules
    const currentLayoutRules = rules.filter((rule) => `${rule.layoutId ?? ''}`.trim() === layoutId)
    const rule = createRule(slotKey, layoutId, currentLayoutRules.length)
    createdRuleId = rule.id
    rules.push(rule)
    normalizeRuleOrder(rules)
  })
  expandedRuleId.value = createdRuleId
}

async function removeRule(ruleId: string) {
  const slotKey = currentSlot.value
  if (!slotKey) return
  if (!(await ensureRulesAccess())) return

  updateSettings((next) => {
    next[slotKey].rules = next[slotKey].rules.filter((rule) => rule.id !== ruleId)
    normalizeRuleOrder(next[slotKey].rules)
  })

  if (expandedRuleId.value === ruleId) {
    expandedRuleId.value = null
  }
}

async function patchRule(ruleId: string, patch: Partial<LayoutRule>) {
  const slotKey = currentSlot.value
  if (!slotKey) return
  if (!(await ensureRulesAccess(true))) return

  updateSettings((next) => {
    const rule = next[slotKey].rules.find((item) => item.id === ruleId)
    if (!rule) return
    Object.assign(rule, patch)
  })
}

async function updateRuleName(ruleId: string, value: string) {
  await patchRule(ruleId, { name: value })
}

async function updateRuleMatchMode(ruleId: string, value: LayoutMatchMode) {
  await patchRule(ruleId, { matchMode: value })
}

async function updateRulePages(ruleId: string, value: string[]) {
  await patchRule(ruleId, {
    pageIds: value.map((item) => `${item ?? ''}`.trim()).filter(Boolean),
  })
}

async function updateRuleTargetResourceTypes(rule: LayoutRule, value: string[]) {
  const targetResourceTypes = value
    .map((item) => `${item ?? ''}`.trim())
    .filter((item): item is LayoutRuleTargetResourceType =>
      LAYOUT_RULE_TARGET_RESOURCE_TYPES.includes(item as LayoutRuleTargetResourceType))
  const previousPrimaryTargetType = getPrimaryDynamicTargetType(rule)
  const nextPrimaryTargetType = getPrimaryDynamicTargetType({ targetResourceTypes } as LayoutRule)

  await patchRule(rule.id, {
    targetResourceTypes,
    conditions: previousPrimaryTargetType === nextPrimaryTargetType ? rule.conditions : {},
  })
}

async function updateRulePriority(ruleId: string, value: number | null | undefined) {
  await patchRule(ruleId, {
    priority: typeof value === 'number' && Number.isFinite(value) ? value : 0,
  })
}

async function updateRuleEnabled(ruleId: string, value: boolean) {
  await patchRule(ruleId, { enabled: value })
}

function getPrimaryDynamicTargetType(rule: LayoutRule): DynamicTargetResourceType | null {
  const targetTypes = rule.targetResourceTypes || []
  const dynamicTypes = targetTypes.filter((type): type is DynamicTargetResourceType => type !== 'PAGE')
  return dynamicTypes.length === 1 ? dynamicTypes[0] : null
}

function getActiveConditionFields(rule: LayoutRule) {
  const targetType = getPrimaryDynamicTargetType(rule)
  return targetType ? conditionFieldMap[targetType] : []
}

function getFilteredPageOptions(rule: LayoutRule) {
  const targetTypes = new Set(rule.targetResourceTypes || [])
  if (targetTypes.size === 0) return selectablePages.value

  return selectablePages.value.filter((option) => {
    const optionType = `${option.resourceType ?? ''}`.trim()
    return optionType ? targetTypes.has(optionType as LayoutRuleTargetResourceType) : targetTypes.has('PAGE')
  })
}

function getOptionLabel(option: RulePageOption) {
  const type = `${option.resourceType ?? ''}`.trim() as LayoutRuleTargetResourceType
  const prefix = targetResourceTypeLabels[type] || '页面'
  return `${prefix} / ${option.label}`
}

function getFieldOptions(rule: LayoutRule, fieldKey: keyof LayoutRuleConditions): LayoutRuleFieldOption[] {
  return props.getFieldOptions?.(getPrimaryDynamicTargetType(rule), fieldKey) ?? []
}

function mergeFieldOptions(rule: LayoutRule, fieldKey: keyof LayoutRuleConditions): LayoutRuleFieldOption[] {
  const options = getFieldOptions(rule, fieldKey)
  const selected = (rule.conditions?.[fieldKey] as Array<string | number> | undefined) || []
  const seen = new Set(options.map((option) => `${option.value}`))
  const merged = [...options]
  selected.forEach((value) => {
    const key = `${value}`
    if (!key || seen.has(key)) return
    seen.add(key)
    merged.push({ value, label: `#${value}` })
  })
  return merged
}

async function updateRuleCondition(
  rule: LayoutRule,
  fieldKey: keyof LayoutRuleConditions,
  value: LayoutRuleConditions[keyof LayoutRuleConditions] | undefined,
) {
  const nextConditions: LayoutRuleConditions = { ...(rule.conditions || {}) }
  if (Array.isArray(value) && value.length === 0) {
    delete nextConditions[fieldKey]
  } else if (value && typeof value === 'object' && !Array.isArray(value)) {
    const range = value as LayoutTimeRange
    if (!(`${range.start ?? ''}`.trim() || `${range.end ?? ''}`.trim())) {
      delete nextConditions[fieldKey]
    } else {
      nextConditions[fieldKey] = value as never
    }
  } else if (value === undefined) {
    delete nextConditions[fieldKey]
  } else {
    nextConditions[fieldKey] = value as never
  }
  await patchRule(rule.id, { conditions: nextConditions })
}

async function updateNumberTags(rule: LayoutRule, fieldKey: keyof LayoutRuleConditions, value: Array<string | number>) {
  const numbers = value
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
  await updateRuleCondition(rule, fieldKey, Array.from(new Set(numbers)) as never)
}

async function updateStringTags(rule: LayoutRule, fieldKey: keyof LayoutRuleConditions, value: string[]) {
  const strings = value.map((item) => `${item ?? ''}`.trim()).filter(Boolean)
  await updateRuleCondition(rule, fieldKey, Array.from(new Set(strings)) as never)
}

function getDateRangeValue(rule: LayoutRule, fieldKey: keyof LayoutRuleConditions): [string, string] | null {
  const value = rule.conditions?.[fieldKey] as LayoutTimeRange | undefined
  const start = `${value?.start ?? ''}`.trim()
  const end = `${value?.end ?? ''}`.trim()
  return start && end ? [start, end] : null
}

async function updateDateRange(
  rule: LayoutRule,
  fieldKey: keyof LayoutRuleConditions,
  value: [string, string] | null,
) {
  await updateRuleCondition(rule, fieldKey, value ? { start: value[0], end: value[1] } : undefined)
}

function getRuleDisplayName(rule: LayoutRule, index: number) {
  return rule.name?.trim() || `规则 ${index + 1}`
}

function getRuleModeLabel(rule: LayoutRule) {
  return rule.matchMode === 'exclude' ? '排除页面' : '指定页面'
}

function getRuleScopeText(rule: LayoutRule) {
  const selectedCount = rule.pageIds.length
  const targetTypes = rule.targetResourceTypes || []
  const targetText = targetTypes.length
    ? targetTypes.map((type) => targetResourceTypeLabels[type]).join('、')
    : '全站'
  if (rule.matchMode === 'include') {
    return selectedCount > 0 ? `${targetText}，命中 ${selectedCount} 个资源` : `${targetText}，未选择资源`
  }
  return selectedCount > 0 ? `${targetText}，排除 ${selectedCount} 个资源` : `${targetText}，兜底命中`
}

function toggleRule(ruleId: string) {
  expandedRuleId.value = expandedRuleId.value === ruleId ? null : ruleId
}

onMounted(() => {
  loadSelectablePages()
})
</script>

<template>
  <div class="layout-panel">
    <template v-if="currentSlot && currentLayoutId">
      <div class="layout-panel__header">
        <div class="layout-panel__title">{{ currentLayoutName || currentLayoutId }}</div>
        <div class="layout-panel__description">
          {{ currentSlot === 'header' ? 'Header 规则配置' : 'Footer 规则配置' }}
        </div>
      </div>

      <div class="layout-panel__actions">
        <button
          type="button"
          class="layout-action-button"
          :disabled="rulesReadonly"
          @click="addRule"
        >
          <Icon icon="material-symbols-light:rule-rounded" :size="16" />
          <span>新增规则</span>
        </button>
      </div>

      <div v-if="rulesLockState.message" class="layout-panel__note">
        {{ rulesLockState.message }}
      </div>
      <div v-else-if="activeRules.length === 0" class="layout-panel__note">
        当前没有命中规则，页面不会显示该布局。添加规则后才会生效。
      </div>

      <div class="layout-rules">
        <div
          v-for="(rule, index) in activeRules"
          :key="rule.id"
          class="layout-rule-card"
        >
          <button
            type="button"
            class="layout-rule-card__summary"
            @click="toggleRule(rule.id)"
          >
            <div class="min-w-0 flex-1">
              <div class="layout-rule-card__title">{{ getRuleDisplayName(rule, index) }}</div>
              <div class="layout-rule-card__meta">
                {{ getRuleScopeText(rule) }}
              </div>
            </div>
            <div class="layout-rule-card__badge">
              {{ getRuleModeLabel(rule) }}
            </div>
            <Icon
              class="layout-rule-card__chevron"
              :class="{ 'layout-rule-card__chevron--open': expandedRuleId === rule.id }"
              icon="lucide:chevron-down"
              :size="16"
            />
          </button>

          <div v-if="expandedRuleId === rule.id" class="layout-rule-card__body">
            <label class="layout-form-field">
              <span class="layout-form-field__label">规则名称</span>
              <input
                :value="rule.name || ''"
                class="layout-input"
                type="text"
                :disabled="rulesReadonly"
                @input="updateRuleName(rule.id, ($event.target as HTMLInputElement).value)"
              />
            </label>

            <div class="layout-rule-section">
              <div class="layout-rule-section__title">目标范围</div>
              <label class="layout-form-field">
                <span class="layout-form-field__label">目标类型</span>
                <ElSelect
                  :model-value="rule.targetResourceTypes || []"
                  class="w-full"
                  multiple
                  filterable
                  clearable
                  :disabled="rulesReadonly"
                  placeholder="不选则兼容旧规则，按资源选择命中"
                  @update:model-value="(value) => updateRuleTargetResourceTypes(rule, value as string[])"
                >
                  <ElOption
                    v-for="option in targetResourceTypeOptions"
                    :key="option.value"
                    :label="option.label"
                    :value="option.value"
                  />
                </ElSelect>
              </label>
            </div>

            <div class="layout-rule-section">
              <div class="layout-rule-section__title">资源选择</div>
            <div class="layout-form-row">
              <label class="layout-form-field layout-form-field--grow">
                <span class="layout-form-field__label">匹配模式</span>
                <ElSelect
                  :model-value="rule.matchMode"
                  class="w-full"
                  :disabled="rulesReadonly"
                  @update:model-value="(value) => updateRuleMatchMode(rule.id, value as LayoutMatchMode)"
                >
                  <ElOption label="排除选中页面，其它页面生效" value="exclude" />
                  <ElOption label="仅选中页面生效" value="include" />
                </ElSelect>
              </label>
              <label class="layout-form-field layout-form-field--priority">
                <span class="layout-form-field__label">优先级</span>
                <ElInputNumber
                  :model-value="rule.priority"
                  class="w-full"
                  :min="0"
                  :step="10"
                  :disabled="rulesReadonly"
                  @update:model-value="(value) => updateRulePriority(rule.id, value)"
                />
              </label>
              <label class="layout-form-field layout-form-field--inline">
                <span class="layout-form-field__label">启用</span>
                <ElSwitch
                  :model-value="rule.enabled !== false"
                  :disabled="rulesReadonly"
                  @update:model-value="(value) => updateRuleEnabled(rule.id, Boolean(value))"
                />
              </label>
            </div>

            <label class="layout-form-field">
              <span class="layout-form-field__label">资源多选</span>
              <ElSelect
                :model-value="rule.pageIds"
                class="w-full"
                multiple
                filterable
                clearable
                :disabled="rulesReadonly || loadingPages"
                placeholder="选择页面"
                @update:model-value="(value) => updateRulePages(rule.id, value as string[])"
              >
                <ElOption
                  v-for="option in getFilteredPageOptions(rule)"
                  :key="option.id"
                  :label="getOptionLabel(option)"
                  :value="option.id"
                />
              </ElSelect>
            </label>
            </div>

            <div class="layout-rule-section">
              <div class="layout-rule-section__title">条件设置</div>
              <template v-if="getActiveConditionFields(rule).length">
                <template v-for="field in getActiveConditionFields(rule)" :key="field.key">
                  <label v-if="field.kind !== 'daterange'" class="layout-form-field">
                    <span class="layout-form-field__label">{{ field.label }}</span>
                    <ElSelect
                      :model-value="(rule.conditions?.[field.key] as Array<string | number>) || []"
                      class="w-full"
                      multiple
                      filterable
                      :allow-create="!optionOnlyFields.has(field.key)"
                      default-first-option
                      :reserve-keyword="false"
                      clearable
                      :disabled="rulesReadonly"
                      :placeholder="field.placeholder"
                      @update:model-value="(value) => field.kind === 'numbers'
                        ? updateNumberTags(rule, field.key, value as Array<string | number>)
                        : updateStringTags(rule, field.key, value as string[])"
                    >
                      <ElOption
                        v-for="item in mergeFieldOptions(rule, field.key)"
                        :key="`${field.key}-${item.value}`"
                        :label="item.label"
                        :value="item.value"
                      />
                    </ElSelect>
                  </label>

                  <label v-else class="layout-form-field">
                    <span class="layout-form-field__label">{{ field.label }}</span>
                    <ElDatePicker
                      :model-value="getDateRangeValue(rule, field.key)"
                      class="w-full"
                      type="datetimerange"
                      value-format="YYYY-MM-DD HH:mm:ss"
                      range-separator="至"
                      start-placeholder="开始时间"
                      end-placeholder="结束时间"
                      :disabled="rulesReadonly"
                      @update:model-value="(value) => updateDateRange(rule, field.key, value as [string, string] | null)"
                    />
                  </label>
                </template>
              </template>
              <div v-else class="layout-rule-card__hint">
                选择一个详情或分类模板类型后可配置业务条件。
              </div>
            </div>

            <div class="layout-rule-card__footer">
              <ElPopconfirm
                title="确定删除这条规则？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="removeRule(rule.id)"
              >
                <template #reference>
                  <button
                    type="button"
                    class="layout-action-button layout-action-button--danger"
                    @click.stop
                  >
                    <Icon icon="iconamoon:trash-thin" :size="16" />
                    <span>删除规则</span>
                  </button>
                </template>
              </ElPopconfirm>
            </div>
          </div>
        </div>
      </div>
    </template>

    <div v-else class="layout-panel__empty">
      当前布局页面尚未就绪。
    </div>
  </div>
</template>

<style scoped>
.layout-panel {
  display: flex;
  min-height: 100%;
  flex-direction: column;
  gap: 14px;
  padding: 18px 16px 24px;
  background: #fff;
}

.layout-panel__header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.layout-panel__title {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: #1f2937;
  word-break: break-word;
}

.layout-panel__description {
  font-size: 13px;
  color: #94a3b8;
}

.layout-panel__actions {
  display: flex;
  align-items: center;
}

.layout-panel__note {
  padding: 12px 14px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  font-size: 13px;
  line-height: 1.6;
  color: #64748b;
}

.layout-panel__empty {
  margin-top: 20px;
  padding: 14px;
  border-radius: 12px;
  background: #f8fafc;
  color: #64748b;
  font-size: 13px;
}

.layout-rules {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.layout-rule-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #fff;
  overflow: hidden;
}

.layout-rule-card__summary {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 14px 12px;
  background: transparent;
  border: 0;
  cursor: pointer;
  text-align: left;
}

.layout-rule-card__title {
  font-size: 15px;
  font-weight: 600;
  color: #1f2937;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.layout-rule-card__meta {
  margin-top: 4px;
  font-size: 12px;
  color: #94a3b8;
}

.layout-rule-card__badge {
  flex-shrink: 0;
  padding: 4px 10px;
  border-radius: 999px;
  background: #ecfdf3;
  color: #10b981;
  font-size: 12px;
  font-weight: 600;
}

.layout-rule-card__chevron {
  flex-shrink: 0;
  color: #94a3b8;
  transition: transform 0.2s ease;
}

.layout-rule-card__chevron--open {
  transform: rotate(180deg);
}

.layout-rule-card__body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 14px 14px;
}

.layout-rule-section {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-top: 2px;
}

.layout-rule-section + .layout-rule-section {
  padding-top: 12px;
  border-top: 1px solid #edf2f7;
}

.layout-rule-section__title {
  font-size: 13px;
  font-weight: 700;
  color: #334155;
}

.layout-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.layout-form-field--grow {
  flex: 1;
}

.layout-form-field--inline {
  min-width: 88px;
}

.layout-form-field--priority {
  width: 116px;
}

.layout-form-field__label {
  font-size: 12px;
  font-weight: 600;
  color: #64748b;
}

.layout-form-row {
  display: flex;
  gap: 10px;
  align-items: flex-end;
}

.layout-input {
  width: 100%;
  height: 36px;
  padding: 0 12px;
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  font-size: 13px;
  color: #1f2937;
  outline: none;
}

.layout-input:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12);
}

.layout-rule-card__hint {
  font-size: 12px;
  line-height: 1.6;
  color: #64748b;
}

.layout-rule-card__footer {
  display: flex;
  justify-content: flex-end;
}

.layout-action-button {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 14px;
  border: 1px solid #dbe4f0;
  border-radius: 10px;
  background: #fff;
  color: #2563eb;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s ease;
}

.layout-action-button:hover:not(:disabled) {
  border-color: #93c5fd;
  background: #eff6ff;
}

.layout-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.layout-action-button--danger {
  color: #ef4444;
}

.layout-action-button--danger:hover:not(:disabled) {
  border-color: #fecaca;
  background: #fef2f2;
}
</style>
