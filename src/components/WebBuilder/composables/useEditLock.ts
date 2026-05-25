import { ref } from 'vue'
import { ElMessageBox, ElLoading } from 'element-plus'
import { useRouter } from 'vue-router'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import {
  acquireLock,
  hasPageResourceLocator,
  normalizePageResourceIdentity,
  releaseLock,
  updateHeartbeat,
  type PageResourceIdentity,
  type PageEditLockRespVO,
} from '@/api/content/page'
import { getOrCreateSessionKey } from '../utils/sessionKey'
import { releaseLockKeepalive } from '../utils/lockKeepalive'
import { useHeartbeatTimer } from './useHeartbeatTimer'

export interface UseEditLockOptions {
  pageResource: () => PageResourceIdentity
  onTakenOver?: () => void | Promise<void>
  /** 返回 true 表示有未保存的更改，刷新/关闭时应拦截 */
  hasUnsavedChanges?: () => boolean
  /** 可选注入，用于测试替换真实 API；生产代码不需要传 */
  _deps?: {
    acquireLock?: typeof acquireLock
    releaseLock?: typeof releaseLock
    updateHeartbeat?: typeof updateHeartbeat
  }
}

/**
 * 编辑锁管理 composable
 */
export default function useEditLock(options: UseEditLockOptions) {
  const router = useRouter()
  const { pageResource, onTakenOver, hasUnsavedChanges } = options

  const _acquireLock = options._deps?.acquireLock ?? acquireLock
  const _releaseLock = options._deps?.releaseLock ?? releaseLock
  const _updateHeartbeat = options._deps?.updateHeartbeat ?? updateHeartbeat

  const hasEditLock = ref(false)
  const currentSessionKey = ref('')
  let skipNextBeforeUnloadPrompt = false
  let skipNextBeforeUnloadPromptTimer: number | null = null

  const getCurrentPageResource = () => normalizePageResourceIdentity(pageResource())

  const allowNextBeforeUnload = () => {
    skipNextBeforeUnloadPrompt = true
    if (skipNextBeforeUnloadPromptTimer !== null) {
      window.clearTimeout(skipNextBeforeUnloadPromptTimer)
    }
    skipNextBeforeUnloadPromptTimer = window.setTimeout(() => {
      skipNextBeforeUnloadPrompt = false
      skipNextBeforeUnloadPromptTimer = null
    }, 5000)
  }

  const reloadPageWithoutPrompt = () => {
    allowNextBeforeUnload()
    window.location.reload()
  }

  /**
   * 等待锁释放并重试获取
   */
  const waitAndRetryLock = async (lockHolder: PageEditLockRespVO): Promise<boolean> => {
    const maxWaitTime = 5000 // 5 秒
    const checkInterval = 2000 // 每 2 秒检查一次
    const startTime = Date.now()

    let loadingInstance: any = null
    let countdownTimer: number | null = null

    try {
      // 计算剩余时间
      const getRemainingTime = () => {
        const elapsed = Date.now() - startTime
        const remaining = Math.max(0, Math.ceil((maxWaitTime - elapsed) / 1000))
        return remaining
      }

      // 显示加载提示和倒计时
      loadingInstance = ElLoading.service({
        lock: true,
        text: `正在等待 ${lockHolder.username} 保存退出编辑器...\n剩余时间: ${getRemainingTime()} 秒`,
        background: 'rgba(0, 0, 0, 0.7)',
        customClass: 'edit-lock-waiting-loading',
      })

      // 每秒更新倒计时
      countdownTimer = window.setInterval(() => {
        const remaining = getRemainingTime()
        if (loadingInstance) {
          loadingInstance.setText(
            `正在等待 ${lockHolder.username} 保存退出编辑器...\n剩余时间: ${remaining} 秒`
          )
        }
      }, 1000)

      // 首先标记接管标志（让对方在心跳时能检测到）
      try {
        await _acquireLock({
          ...getCurrentPageResource(),
          sessionKey: currentSessionKey.value,
          forceTakeover: true,
          immediateTakeover: false, // 首次接管：写标记，等待对方释放
        })
      } catch (takeoverError) {
        // 静默处理错误
      }

      // 轮询检查锁是否释放
      while (Date.now() - startTime < maxWaitTime) {
        try {
          const result = await _acquireLock({
            ...getCurrentPageResource(),
            sessionKey: currentSessionKey.value,
            forceTakeover: false, // 不强制，只检测锁是否释放
          })

          if (result === null) {
            // 成功获取锁！
            hasEditLock.value = true
            if (countdownTimer) clearInterval(countdownTimer)
            if (loadingInstance) loadingInstance.close()
            ElMessage.success({
              message: '对方已释放编辑锁，成功获取编辑权限。页面将刷新以加载最新数据',
              duration: 2000,
            })
            // 刷新页面以加载最新数据
            setTimeout(() => {
              reloadPageWithoutPrompt()
            }, 1000)
            return true
          }

          // 仍然被锁定，继续等待
        } catch (error) {
          // 静默处理错误
        }

        // 等待检查间隔
        if (Date.now() - startTime < maxWaitTime) {
          await new Promise((resolve) => setTimeout(resolve, checkInterval))
        }
      }

      // 超时，强制立即接管
      if (countdownTimer) clearInterval(countdownTimer)
      if (loadingInstance) {
        loadingInstance.setText('等待超时，正在强制接管编辑权限...')
      }

      try {
        const result = await _acquireLock({
          ...getCurrentPageResource(),
          sessionKey: currentSessionKey.value,
          forceTakeover: true,
          immediateTakeover: true, // 立即接管，直接删除旧锁
        })

        if (countdownTimer) clearInterval(countdownTimer)
        if (loadingInstance) loadingInstance.close()

        if (result === null) {
          hasEditLock.value = true
          ElMessage.success({
            message: '已强制接管编辑权限，成功进入编辑器。页面将刷新以加载最新数据',
            duration: 2000,
          })
          setTimeout(() => {
            reloadPageWithoutPrompt()
          }, 1000)
          return true
        } else {
          ElMessage.warning('强制接管可能未完全成功，请刷新页面重试')
          router.back()
          return false
        }
      } catch (error) {
        if (countdownTimer) clearInterval(countdownTimer)
        if (loadingInstance) loadingInstance.close()
        ElMessage.error('强制接管失败: ' + ((error as any)?.message || String(error)))
        router.back()
        return false
      }
    } catch (error) {
      if (countdownTimer) clearInterval(countdownTimer)
      if (loadingInstance) loadingInstance.close()
      ElMessage.error('等待接管过程出错')
      router.back()
      return false
    }
  }

  /**
   * 获取编辑锁
   */
  const tryAcquireLock = async (forceTakeover = false): Promise<boolean> => {
    const resource = getCurrentPageResource()
    if (!hasPageResourceLocator(resource)) {
      return true
    }

    // 获取或创建 session key
    if (!currentSessionKey.value) {
      currentSessionKey.value = getOrCreateSessionKey()
    }

    try {
      const result = await _acquireLock({
        ...resource,
        sessionKey: currentSessionKey.value,
        forceTakeover,
      })

      if (result === null) {
        // 成功获取锁
        hasEditLock.value = true
        return true
      }

      // 锁被其他会话持有
      const lockHolder = result
      let message: string

      if (lockHolder.isCurrentSession) {
        // 同一会话（不应该发生，但安全处理）
        hasEditLock.value = true
        return true
      } else if (lockHolder.isCurrentUser) {
        // 同一用户，不同浏览器/标签页
        message = '您已在其他浏览器或标签页中打开此页面编辑器'
      } else {
        // 不同用户
        message = `用户 ${lockHolder.username} 正在编辑此页面`
      }

      try {
        await ElMessageBox.confirm(
          `${message}\n\n是否接管编辑？\n` +
            `⚠️ 警告：强制接管可能会导致对方正在编辑的内容丢失，请谨慎操作！`,
          '编辑冲突',
          {
            confirmButtonText: '接管编辑',
            cancelButtonText: '返回',
            type: 'warning',
            distinguishCancelAndClose: true,
            dangerouslyUseHTMLString: false,
          }
        )

        // 用户选择接管 - 等待其他用户释放锁
        return await waitAndRetryLock(lockHolder)
      } catch {
        // 用户选择取消
        ElMessage.info('已取消编辑')
        router.back()
        return false
      }
    } catch (error: any) {
      ElMessage.error('获取编辑锁失败: ' + (error?.message || String(error)))
      router.push('/')
      return false
    }
  }

  /**
   * 释放编辑锁
   */
  const releaseEditLock = async () => {
    const resource = getCurrentPageResource()
    if (!hasEditLock.value || !hasPageResourceLocator(resource) || !currentSessionKey.value) {
      return
    }

    try {
      await _releaseLock(resource, currentSessionKey.value)
      hasEditLock.value = false
    } catch (error) {
      // 静默处理错误
    }
  }

  /**
   * 发送心跳并检查是否被接管
   */
  const sendHeartbeat = async () => {
    const resource = getCurrentPageResource()
    if (!hasEditLock.value || !hasPageResourceLocator(resource) || !currentSessionKey.value) {
      return
    }

    try {
      const result = await _updateHeartbeat(resource, currentSessionKey.value)

      // 检查锁是否被其他会话接管
      if (result.takenOver && result.takeoverInfo) {
        // 停止定时器，防止进一步操作
        stopTimers()
        hasEditLock.value = false

        // 释放锁
        try {
          await _releaseLock(resource, currentSessionKey.value)
        } catch (releaseError) {
          // 静默处理错误
        }

        // 显示接管通知并刷新页面
        const takeoverInfo = result.takeoverInfo
        let message: string
        if (takeoverInfo.isCurrentUser) {
          message = '您的编辑权限已被您在其他浏览器或标签页中接管，页面将刷新以加载最新数据'
        } else {
          message = `您的编辑权限已被用户 ${takeoverInfo.username} 接管，页面将刷新以加载最新数据`
        }

        ElMessage.warning({
          message,
          duration: 3000,
          showClose: true,
        })

        // 调用接管回调
        if (onTakenOver) {
          await onTakenOver()
        }

        // 刷新整个页面以重新加载数据
        setTimeout(() => {
          reloadPageWithoutPrompt()
        }, 1000)
      }
    } catch (error) {
      // 静默处理错误
    }
  }

  const { start: startHeartbeat, stop: stopHeartbeat } = useHeartbeatTimer({
    beatFn: sendHeartbeat,
  })

  /**
   * 启动定时器（心跳和自动保存）
   */
  const startTimers = () => {
    // 前置条件检查：无编辑锁时不启动心跳
    if (!hasEditLock.value) {
      stopHeartbeat()
      return
    }
    // useHeartbeatTimer.start() 内部已保证幂等（先 stop 再启动）
    startHeartbeat()
  }

  /**
   * 停止定时器
   */
  const stopTimers = () => {
    stopHeartbeat()
  }

  /**
   * 在页面卸载前释放编辑锁的处理函数
   */
  const handleBeforeUnload = (event: BeforeUnloadEvent) => {
    // 有未保存的更改时，触发浏览器原生的离开确认弹窗
    if (!skipNextBeforeUnloadPrompt && hasUnsavedChanges?.()) {
      event.preventDefault()
      event.returnValue = ''
    }

    stopTimers()
    // 使用同步方式释放锁（beforeunload 中不能使用 async）
    const resource = getCurrentPageResource()
    if (hasEditLock.value && hasPageResourceLocator(resource) && currentSessionKey.value) {
      const sessionKey = currentSessionKey.value

      // 优先使用 keepalive 请求，减少页面关闭时释放锁失败概率
      const keepaliveTriggered = releaseLockKeepalive(resource, sessionKey)
      if (!keepaliveTriggered) {
        _releaseLock(resource, sessionKey).catch(() => {
          // 静默处理错误
        })
      }
    }
  }

  return {
    hasEditLock,
    currentSessionKey,
    tryAcquireLock,
    releaseEditLock,
    sendHeartbeat,
    startTimers,
    stopTimers,
    allowNextBeforeUnload,
    handleBeforeUnload,
  }
}
