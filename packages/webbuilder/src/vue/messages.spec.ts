import { describe, expect, it } from 'vitest'

import { SHELL_MESSAGES, resolveShellMessages } from './messages.js'

describe('WebBuilder shell messages', () => {
  it('defaults to the legacy zh-CN copy', () => {
    const messages = resolveShellMessages()
    expect(messages).toEqual(SHELL_MESSAGES['zh-CN'])
    expect(messages['topbar.publish']).toBe('发布')
    expect(messages['shell.exitPreview']).toBe('退出预览')
  })

  it('selects the locale bundle from i18n.locale', () => {
    expect(resolveShellMessages({ locale: 'en' })['topbar.publish']).toBe('Publish')
    expect(resolveShellMessages({ locale: 'en-US' })['topbar.export']).toBe('Export')
    expect(resolveShellMessages({ locale: 'zh-CN' })['topbar.publish']).toBe('发布')
    expect(resolveShellMessages({ locale: 'unknown' })['topbar.publish']).toBe('发布')
  })

  it('applies string overrides from i18n.messages', () => {
    const messages = resolveShellMessages({
      locale: 'en',
      messages: {
        'topbar.publish': 'Ship it',
        'shell.exitPreview': 42,
        'unrelated-key': 'ignored',
      },
    })

    expect(messages['topbar.publish']).toBe('Ship it')
    expect(messages['shell.exitPreview']).toBe(SHELL_MESSAGES.en['shell.exitPreview'])
    expect('unrelated-key' in messages).toBe(false)
  })

  it('keeps locale bundles key-complete', () => {
    expect(Object.keys(SHELL_MESSAGES.en).sort()).toEqual(
      Object.keys(SHELL_MESSAGES['zh-CN']).sort(),
    )
  })
})
