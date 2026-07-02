/*
 * WebBuilder shell UI copy.
 *
 * Every user-visible string rendered by the shell chrome (TopBar +
 * WebBuilderShell) resolves through this map. `options.i18n.locale` selects a
 * locale bundle; `options.i18n.messages` overrides individual keys. Defaults
 * keep the legacy zh-CN copy so the default appearance stays unchanged.
 */

export type WebBuilderShellMessageKey =
  | 'topbar.pageSettings'
  | 'topbar.templateSettings'
  | 'topbar.toggleBorders'
  | 'topbar.publish'
  | 'topbar.publishing'
  | 'topbar.export'
  | 'topbar.import'
  | 'shell.bottomDropHint'
  | 'shell.exitPreview'
  | 'shell.blockingProcessing'

export type WebBuilderShellMessages = Record<WebBuilderShellMessageKey, string>

export const SHELL_MESSAGES: Record<'zh-CN' | 'en', WebBuilderShellMessages> = {
  'zh-CN': {
    'topbar.pageSettings': '页面设置',
    'topbar.templateSettings': '模板设置',
    'topbar.toggleBorders': '显示组件边框',
    'topbar.publish': '发布',
    'topbar.publishing': '发布中',
    'topbar.export': '导出',
    'topbar.import': '导入',
    'shell.bottomDropHint': '拖拽组件到这里，追加到页面底部（不影响页面代码结构）',
    'shell.exitPreview': '退出预览',
    'shell.blockingProcessing': '正在处理复杂任务，请保持页面打开',
  },
  en: {
    'topbar.pageSettings': 'Page settings',
    'topbar.templateSettings': 'Template settings',
    'topbar.toggleBorders': 'Show component borders',
    'topbar.publish': 'Publish',
    'topbar.publishing': 'Publishing',
    'topbar.export': 'Export',
    'topbar.import': 'Import',
    'shell.bottomDropHint': 'Drag a component here to append it to the bottom of the page (page code structure is unaffected)',
    'shell.exitPreview': 'Exit preview',
    'shell.blockingProcessing': 'Processing a long-running task, please keep this page open',
  },
}

export const DEFAULT_SHELL_LOCALE = 'zh-CN'

const normalizeShellLocale = (locale?: string): 'zh-CN' | 'en' => {
  const lower = (locale ?? DEFAULT_SHELL_LOCALE).toLowerCase()
  if (lower.startsWith('en')) return 'en'
  return 'zh-CN'
}

export interface ResolveShellMessagesInput {
  locale?: string
  messages?: Record<string, unknown>
}

export const resolveShellMessages = (
  i18n?: ResolveShellMessagesInput,
): WebBuilderShellMessages => {
  const base = SHELL_MESSAGES[normalizeShellLocale(i18n?.locale)]
  if (!i18n?.messages) return { ...base }

  const merged: WebBuilderShellMessages = { ...base }
  for (const key of Object.keys(base) as WebBuilderShellMessageKey[]) {
    const override = i18n.messages[key]
    if (typeof override === 'string') {
      merged[key] = override
    }
  }
  return merged
}
