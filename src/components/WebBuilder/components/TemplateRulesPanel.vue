<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElDatePicker, ElInputNumber, ElOption, ElPopconfirm, ElSelect, ElSwitch } from 'element-plus'
import {
  type TempTemplateResourceType,
} from '@/components/WebBuilder/config/templateSharedResources'
import {
  type TemplateRule,
  type TemplateRuleConditions,
  type TemplateTimeRange,
} from '@/components/WebBuilder/utils/templateRules'

interface TemplateRuleFieldOption {
  value: string | number
  label: string
}

const props = defineProps<{
  currentTemplateType: TempTemplateResourceType | null
  currentRules: TemplateRule[]
  ensureRulesEditable?: (silent?: boolean) => Promise<boolean>
  getRulesLockState?: () => { status?: string; message?: string }
  addRule?: () => Promise<void>
  patchRule?: (ruleId: string, patch: Partial<TemplateRule>) => Promise<void>
  removeRule?: (ruleId: string) => Promise<void>
  getFieldOptions?: (
    templateType: TempTemplateResourceType | null,
    fieldKey: string,
  ) => TemplateRuleFieldOption[]
}>()

const expandedRuleId = ref<string | null>(null)

const rulesLockState = computed(() => props.getRulesLockState?.() ?? {})
const rulesReadonly = computed(() =>
  ['conflict', 'error', 'acquiring'].includes(`${rulesLockState.value.status ?? ''}`),
)

const conditionFieldMap: Record<TempTemplateResourceType, Array<{
  key: keyof TemplateRuleConditions
  label: string
  kind: 'numbers' | 'strings' | 'daterange'
  placeholder: string
}>> = {
  TEMP_POST_DETAIL: [
    { key: 'postIds', label: '文章 ID', kind: 'numbers', placeholder: '输入文章 ID' },
    { key: 'excludePostIds', label: '排除文章 ID', kind: 'numbers', placeholder: '输入不包含的文章 ID' },
    { key: 'typeIds', label: '文章类型 ID', kind: 'numbers', placeholder: '输入文章类型 ID' },
    { key: 'excludeTypeIds', label: '排除类型 ID', kind: 'numbers', placeholder: '输入不包含的文章类型 ID' },
    { key: 'tagIds', label: '标签 ID', kind: 'numbers', placeholder: '输入标签 ID' },
    { key: 'templateNames', label: '模板名', kind: 'strings', placeholder: '输入模板名' },
    { key: 'publishTimeRange', label: '发布时间范围', kind: 'daterange', placeholder: '' },
  ],
  TEMP_POST_CATEGORY_LIST: [
    { key: 'categoryIds', label: '文章分类 ID', kind: 'numbers', placeholder: '输入分类 ID' },
    { key: 'excludeCategoryIds', label: '排除分类 ID', kind: 'numbers', placeholder: '输入不包含的分类 ID' },
    { key: 'rootCategoryIds', label: '根分类 ID', kind: 'numbers', placeholder: '输入根分类 ID' },
    { key: 'levels', label: '分类层级', kind: 'numbers', placeholder: '输入层级' },
  ],
  TEMP_MEDIA_DETAIL: [
    { key: 'resourceIds', label: '媒体资源 ID', kind: 'numbers', placeholder: '输入媒体资源 ID' },
    { key: 'excludeResourceIds', label: '排除媒体资源 ID', kind: 'numbers', placeholder: '输入不包含的媒体资源 ID' },
    { key: 'categoryIds', label: '媒体分类 ID', kind: 'numbers', placeholder: '输入分类 ID' },
    { key: 'excludeCategoryIds', label: '排除分类 ID', kind: 'numbers', placeholder: '输入不包含的分类 ID' },
    { key: 'mediaTypes', label: '媒体类型', kind: 'strings', placeholder: '输入媒体类型' },
    { key: 'publishTimeRange', label: '发布时间范围', kind: 'daterange', placeholder: '' },
  ],
  TEMP_MEDIA_CATEGORY_LIST: [
    { key: 'categoryIds', label: '媒体分类 ID', kind: 'numbers', placeholder: '输入分类 ID' },
    { key: 'excludeCategoryIds', label: '排除分类 ID', kind: 'numbers', placeholder: '输入不包含的分类 ID' },
  ],
  TEMP_PRODUCT_DETAIL: [
    { key: 'spuIds', label: '产品 SPU ID', kind: 'numbers', placeholder: '输入 SPU ID' },
    { key: 'excludeSpuIds', label: '排除产品 SPU ID', kind: 'numbers', placeholder: '输入不包含的 SPU ID' },
    { key: 'categoryIds', label: '产品分类 ID', kind: 'numbers', placeholder: '输入分类 ID' },
    { key: 'excludeCategoryIds', label: '排除分类 ID', kind: 'numbers', placeholder: '输入不包含的分类 ID' },
    { key: 'brandIds', label: '品牌 ID', kind: 'numbers', placeholder: '输入品牌 ID' },
    { key: 'createTimeRange', label: '创建时间范围', kind: 'daterange', placeholder: '' },
  ],
  TEMP_PRODUCT_CATEGORY_LIST: [
    { key: 'categoryIds', label: '分类 ID', kind: 'numbers', placeholder: '输入分类 ID' },
    { key: 'excludeCategoryIds', label: '排除分类 ID', kind: 'numbers', placeholder: '输入不包含的分类 ID' },
    { key: 'rootCategoryIds', label: '根分类 ID', kind: 'numbers', placeholder: '输入根分类 ID' },
    { key: 'levels', label: '分类层级', kind: 'numbers', placeholder: '输入层级' },
  ],
}

const activeFields = computed(() =>
  props.currentTemplateType ? conditionFieldMap[props.currentTemplateType] : [],
)

const isFixedOptionField = (fieldKey: keyof TemplateRuleConditions) => fieldKey === 'levels'

const ensureAccess = async (silent = false) => {
  if (!props.ensureRulesEditable) return true
  return props.ensureRulesEditable(silent)
}

const toggleRule = (ruleId: string) => {
  expandedRuleId.value = expandedRuleId.value === ruleId ? null : ruleId
}

const getRuleDisplayName = (rule: TemplateRule, index: number) =>
  rule.name?.trim() || `规则 ${index + 1}`

const getConditionSummary = (rule: TemplateRule) => {
  const conditions = rule.conditions || {}
  const entries = Object.entries(conditions)
    .filter(([, value]) => {
      if (Array.isArray(value)) return value.length > 0
      if (value && typeof value === 'object') {
        return !!(`${(value as TemplateTimeRange).start ?? ''}`.trim() || `${(value as TemplateTimeRange).end ?? ''}`.trim())
      }
      return false
    })
  if (!entries.length) return '空条件，作为兜底规则'
  return `已配置 ${entries.length} 组匹配条件`
}

const updateRuleName = async (ruleId: string, value: string) => {
  await props.patchRule?.(ruleId, { name: value })
}

const updateRuleEnabled = async (ruleId: string, value: boolean) => {
  await props.patchRule?.(ruleId, { enabled: value })
}

const updateRulePriority = async (ruleId: string, value: number | null | undefined) => {
  await props.patchRule?.(ruleId, { priority: Number.isFinite(Number(value)) ? Number(value) : 0 })
}

const buildNextConditions = (
  rule: TemplateRule,
  key: keyof TemplateRuleConditions,
  value: unknown,
): TemplateRuleConditions => ({
  ...(rule.conditions || {}),
  [key]: value,
})

const updateNumberTags = async (
  rule: TemplateRule,
  key: keyof TemplateRuleConditions,
  values: Array<string | number>,
) => {
  if (!(await ensureAccess(true))) return
  const nextValues = values
    .map((item) => Number(item))
    .filter((item) => Number.isFinite(item))
  await props.patchRule?.(rule.id, {
    conditions: buildNextConditions(rule, key, nextValues),
  })
}

const updateStringTags = async (
  rule: TemplateRule,
  key: keyof TemplateRuleConditions,
  values: string[],
) => {
  if (!(await ensureAccess(true))) return
  const nextValues = values
    .map((item) => `${item ?? ''}`.trim())
    .filter(Boolean)
  await props.patchRule?.(rule.id, {
    conditions: buildNextConditions(rule, key, nextValues),
  })
}

const updateDateRange = async (
  rule: TemplateRule,
  key: keyof TemplateRuleConditions,
  range: [string, string] | null,
) => {
  if (!(await ensureAccess(true))) return
  const nextRange = range
    ? {
        start: `${range[0] ?? ''}`.trim(),
        end: `${range[1] ?? ''}`.trim(),
      }
    : undefined
  await props.patchRule?.(rule.id, {
    conditions: buildNextConditions(rule, key, nextRange),
  })
}

const getDateRangeValue = (
  rule: TemplateRule,
  key: keyof TemplateRuleConditions,
): [string, string] | null => {
  const range = rule.conditions?.[key] as TemplateTimeRange | undefined
  if (!range?.start && !range?.end) return null
  return [range.start || '', range.end || '']
}

const mergeFieldOptions = (
  fieldKey: keyof TemplateRuleConditions,
  rule: TemplateRule,
): TemplateRuleFieldOption[] => {
  const fetched = props.getFieldOptions
    ? props.getFieldOptions(props.currentTemplateType, fieldKey as string)
    : []
  const known = new Map<string, TemplateRuleFieldOption>()
  fetched.forEach((option) => {
    known.set(`${option.value}`, option)
  })
  const selected = (rule.conditions?.[fieldKey] as Array<string | number>) || []
  selected.forEach((value) => {
    const key = `${value}`
    if (!known.has(key)) {
      known.set(key, { value, label: `${value}` })
    }
  })
  return Array.from(known.values())
}
</script>

<template>
  <div class="layout-panel">
    <template v-if="currentTemplateType">
      <div class="layout-panel__header">
        <div class="layout-panel__title">模板规则</div>
        <div class="layout-panel__description">当前模板的命中规则配置</div>
      </div>

      <div class="layout-panel__actions">
        <button
          type="button"
          class="layout-action-button"
          :disabled="rulesReadonly"
          @click="addRule?.()"
        >
          <Icon icon="lucide:plus" :size="16" />
          <span>新增规则</span>
        </button>
      </div>

      <div v-if="rulesLockState.message" class="layout-panel__note">
        {{ rulesLockState.message }}
      </div>
      <div v-else-if="currentRules.length === 0" class="layout-panel__note">
        当前模板还没有规则，未命中时不会参与渲染。
      </div>

      <div class="layout-rules">
        <div
          v-for="(rule, index) in currentRules"
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
              <div class="layout-rule-card__meta">{{ getConditionSummary(rule) }}</div>
            </div>
            <div class="layout-rule-card__badge">
              优先级 {{ rule.priority ?? 0 }}
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

            <div class="layout-form-row">
              <label class="layout-form-field layout-form-field--grow">
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

            <template v-for="field in activeFields" :key="field.key">
              <label v-if="field.kind !== 'daterange'" class="layout-form-field">
                <span class="layout-form-field__label">{{ field.label }}</span>
                <ElSelect
                  :model-value="(rule.conditions?.[field.key] as Array<string | number>) || []"
                  class="w-full"
                  multiple
                  filterable
                  :allow-create="!isFixedOptionField(field.key)"
                  default-first-option
                  :reserve-keyword="false"
                  :disabled="rulesReadonly"
                  :placeholder="field.placeholder"
                  @update:model-value="(value) => field.kind === 'numbers'
                    ? updateNumberTags(rule, field.key, value as Array<string | number>)
                    : updateStringTags(rule, field.key, value as string[])"
                >
                  <ElOption
                    v-for="item in mergeFieldOptions(field.key, rule)"
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

            <div class="layout-rule-card__hint">
              条件之间为 AND，同一字段内多个值为 OR；`排除*` 字段命中任一值即视为不匹配。若条件为空，则作为该模板类型的兜底规则。
            </div>

            <div class="layout-rule-card__footer">
              <ElPopconfirm
                title="确认删除当前规则？"
                confirm-button-text="删除"
                cancel-button-text="取消"
                @confirm="removeRule?.(rule.id)"
              >
                <template #reference>
                  <button
                    type="button"
                    class="layout-action-button layout-action-button--danger"
                    :disabled="rulesReadonly"
                    @click.stop
                  >
                    <Icon icon="lucide:trash-2" :size="16" />
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
      当前资源不支持模板规则配置。
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
  background: #eff6ff;
  color: #2563eb;
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

.layout-form-field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.layout-form-field :deep(.el-date-editor.el-input__wrapper),
.layout-form-field :deep(.el-date-editor--datetimerange.el-input__wrapper) {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
}

.layout-form-field :deep(.el-date-editor .el-range-separator) {
  flex-shrink: 0;
  padding: 0 4px;
}

.layout-form-field :deep(.el-date-editor .el-range-input) {
  min-width: 0;
  flex: 1 1 0;
}

.layout-form-field--grow {
  flex: 1;
}

.layout-form-field--inline {
  min-width: 88px;
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
