import { afterEach, describe, expect, it, vi } from 'vitest'
import useBlockingProcess from './useBlockingProcess'

describe('useBlockingProcess', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  it('starts a save process with fallback text and rotates message variants', () => {
    vi.useFakeTimers()
    const process = useBlockingProcess()

    process.start('save')
    expect(process.active.value).toBe(true)
    expect(process.action.value).toBe('save')
    expect(process.message.value).toBe('正在准备保存')

    process.setMessage(['保存中，请稍候', '正在提交草稿数据'])
    expect(process.message.value).toBe('保存中，请稍候')

    vi.advanceTimersByTime(1800)
    expect(process.message.value).toBe('正在提交草稿数据')

    vi.advanceTimersByTime(1800)
    expect(process.message.value).toBe('保存中，请稍候')
  })

  it('ignores message updates while inactive and clears state on stop', () => {
    vi.useFakeTimers()
    const process = useBlockingProcess()

    process.setMessage('不会显示')
    expect(process.message.value).toBe('')

    process.start('publish', ['正在准备发布', '正在锁定发布流程'])
    vi.advanceTimersByTime(1800)
    expect(process.message.value).toBe('正在锁定发布流程')

    process.stop()
    expect(process.active.value).toBe(false)
    expect(process.action.value).toBeNull()
    expect(process.message.value).toBe('')

    vi.advanceTimersByTime(1800)
    expect(process.message.value).toBe('')
  })
})
