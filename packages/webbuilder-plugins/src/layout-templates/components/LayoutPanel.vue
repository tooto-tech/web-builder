<script lang="ts" setup>
import { computed, onMounted, ref } from 'vue'
import { Icon } from '@iconify/vue'
import { ElOption, ElPopconfirm, ElSelect, ElSwitch } from 'element-plus'
import {
  cloneLayoutSettings,
  getGrapesPageId,
  getGrapesPageName,
  layoutTargetMatchesPage,
  getPageLayoutSlot,
  type LayoutMatchMode,
  type LayoutRule,
  type LayoutSlotKey,
  type WebBuilderLayoutSettings,
} from '../utils/layoutSettings'
import {
  type RulePageOption,
} from '../utils/layoutRulePages'

const props = defineProps<{
  pages: any[]
  layoutSettings: WebBuilderLayoutSettings
  setLayoutSettings: (settings: WebBuilderLayoutSettings) => void
  loadRulePageOptions: () => Promise<RulePageOption[]>
  ensureRulesEditable?: (silent?: boolean) => Promise<boolean>
  getRulesLockState?: () => { status?: string; message?: string }
}>()

const emit = defineEmits<{
  (e: 'change'): void
}>()

const expandedRuleId = ref<string | null>(null)
const selectablePages = ref<RulePageOption[]>([])
const loadingPages = ref(false)

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
    rule.priority = index
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
    priority: index,
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

async function updateRuleEnabled(ruleId: string, value: boolean) {
  await patchRule(ruleId, { enabled: value })
}

function getRuleDisplayName(rule: LayoutRule, index: number) {
  return rule.name?.trim() || `规则 ${index + 1}`
}

function getRuleModeLabel(rule: LayoutRule) {
  return rule.matchMode === 'exclude' ? '排除页面' : '指定页面'
}

function getRuleScopeText(rule: LayoutRule) {
  const selectedCount = rule.pageIds.length
  if (rule.matchMode === 'include') {
    return selectedCount > 0 ? `命中 ${selectedCount} 个页面` : '未选择页面，规则暂不生效'
  }
  return selectedCount > 0 ? `排除 ${selectedCount} 个页面` : '除已排除页面外全部命中'
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
              <span class="layout-form-field__label">页面多选</span>
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
                  v-for="option in selectablePages"
                  :key="option.id"
                  :label="option.label"
                  :value="option.id"
                />
              </ElSelect>
            </label>

            <div class="layout-rule-card__hint">
              <template v-if="rule.matchMode === 'exclude'">
                排除：除勾选页面外全部生效。不勾选页面时，表示全站生效。
              </template>
              <template v-else>
                指定：仅在勾选页面生效。
              </template>
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
