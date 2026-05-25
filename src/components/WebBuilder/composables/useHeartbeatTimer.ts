export interface UseHeartbeatTimerOptions {
  /** 心跳回调，返回 Promise。每次心跳触发时调用，有 inFlight 守卫保护。 */
  beatFn: () => Promise<void>
  /** 心跳间隔（毫秒），默认 10000 */
  intervalMs?: number
}

/**
 * 通用心跳定时器管理 composable。
 * 内置 inFlight 守卫：若上一次心跳尚未完成，本次触发将被跳过，避免并发调用。
 */
export function useHeartbeatTimer(options: UseHeartbeatTimerOptions) {
  const { beatFn, intervalMs = 10000 } = options

  let heartbeatTimer: number | null = null
  let heartbeatInFlight = false

  const stop = () => {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer)
      heartbeatTimer = null
    }
    heartbeatInFlight = false
  }

  const start = () => {
    // 先 stop，保证幂等（防止重复启动导致多个定时器并存）
    stop()
    heartbeatTimer = window.setInterval(() => {
      if (heartbeatInFlight) return
      heartbeatInFlight = true
      beatFn().finally(() => {
        heartbeatInFlight = false
      })
    }, intervalMs)
  }

  return { start, stop }
}
