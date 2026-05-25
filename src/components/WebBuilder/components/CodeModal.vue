<script lang="ts" setup>
import { computed, ref, watch } from 'vue'
import { ElButton, ElDialog, ElTabPane, ElTabs } from 'element-plus'

const props = defineProps<{
  modelValue: boolean
  html: string
  css: string
  js: string
  refreshing?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'save', data: { html: string; css: string; js: string }): void
  (e: 'refresh'): void
}>()

const activeTab = ref('html')
const htmlCode = ref('')
const cssCode = ref('')
const jsCode = ref('')

const visible = computed({
  get: () => props.modelValue,
  set: (value: boolean) => emit('update:modelValue', value),
})

watch(
  () => props.modelValue,
  (value) => {
    if (!value) return
    activeTab.value = 'html'
    htmlCode.value = props.html
    cssCode.value = props.css
    jsCode.value = props.js
  },
)

watch(
  () => [props.html, props.css, props.js] as const,
  ([html, css, js]) => {
    if (!visible.value) return
    htmlCode.value = html
    cssCode.value = css
    jsCode.value = js
  },
)

const handleSave = () => {
  emit('save', {
    html: htmlCode.value,
    css: cssCode.value,
    js: jsCode.value,
  })
  visible.value = false
}
</script>

<template>
  <ElDialog
    v-model="visible"
    width="80%"
    :show-close="false"
    :title="''"
    :append-to-body="false"
    align-center
    :close-on-click-modal="false"
  >
    <ElTabs v-model="activeTab" class="code-tabs">
      <ElTabPane label="HTML" name="html" lazy>
        <textarea
          v-model="htmlCode"
          class="code-editor"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
        ></textarea>
      </ElTabPane>
      <ElTabPane label="CSS" name="css" lazy>
        <textarea
          v-model="cssCode"
          class="code-editor"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
        ></textarea>
      </ElTabPane>
      <ElTabPane label="JavaScript" name="js" lazy>
        <textarea
          v-model="jsCode"
          class="code-editor"
          spellcheck="false"
          autocomplete="off"
          autocapitalize="off"
          autocorrect="off"
        ></textarea>
      </ElTabPane>
    </ElTabs>
    <template #footer>
      <div class="flex justify-between p-4">
        <ElButton size="large" :loading="props.refreshing" @click="emit('refresh')">
          Refresh Code
        </ElButton>
        <div class="flex gap-3">
          <ElButton size="large" class="min-w-28" @click="visible = false">Cancel</ElButton>
          <ElButton size="large" color="#2251FF" class="min-w-28" @click="handleSave">Save</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<style lang="scss" scoped>
:deep(.el-dialog) {
  padding: 0;

  .el-dialog__header {
    padding: 0;
  }

  .el-tabs__nav {
    float: none;
    justify-content: center;
  }

  .el-tabs__item {
    font-weight: 400;

    &.is-active {
      color: #2251ff;
    }
  }

  .el-tabs__nav-wrap::after {
    height: 1px;
  }

  .el-tabs__active-bar {
    background-color: #2251ff;
  }

  .el-dialog__footer {
    padding-top: 0;
  }

  .el-tabs__header {
    margin-bottom: 0;
  }
}

.code-editor {
  display: block;
  width: 100%;
  min-height: 60vh;
  max-height: 60vh;
  padding: 20px;
  overflow: auto;
  resize: none;
  border: 0;
  border-radius: 4px;
  outline: none;
  color: #1f2937;
  background: #fff;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace;
  font-size: 14px;
  font-weight: 300;
  line-height: 1.5;
  white-space: pre;
  tab-size: 2;
}
</style>
