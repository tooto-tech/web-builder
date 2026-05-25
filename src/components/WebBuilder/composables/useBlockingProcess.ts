import { computed, ref, type ComputedRef, type Ref } from 'vue'

export type BlockingProcessAction = 'publish' | 'save'
export type BlockingProcessMessage = string | string[]

export interface UseBlockingProcessReturn {
  action: Ref<BlockingProcessAction | null>
  message: Ref<string>
  active: ComputedRef<boolean>
  start: (action: BlockingProcessAction, message?: BlockingProcessMessage) => void
  stop: () => void
  setMessage: (message: BlockingProcessMessage) => void
}

export default function useBlockingProcess(): UseBlockingProcessReturn {
  const action = ref<BlockingProcessAction | null>(null)
  const message = ref('')
  const messageVariants = ref<string[]>([])
  let timer: ReturnType<typeof setInterval> | undefined
  let messageIndex = 0

  const active = computed(() => action.value !== null)

  const clearTimer = () => {
    if (!timer) return
    clearInterval(timer)
    timer = undefined
  }

  const normalizeMessages = (nextMessage?: BlockingProcessMessage): string[] => {
    if (!nextMessage) return []
    const messages = Array.isArray(nextMessage) ? nextMessage : [nextMessage]
    return messages.map((item) => `${item ?? ''}`.trim()).filter(Boolean)
  }

  const applyMessage = (
    nextMessage: BlockingProcessMessage | undefined,
    fallbackMessage: string
  ) => {
    const normalized = normalizeMessages(nextMessage)
    const nextMessages = normalized.length ? normalized : [fallbackMessage]
    messageVariants.value = nextMessages
    messageIndex = 0
    message.value = nextMessages[0] || fallbackMessage
  }

  const setMessage = (nextMessage: BlockingProcessMessage) => {
    if (!action.value) return
    applyMessage(nextMessage, message.value || 'Processing...')
  }

  const start = (
    nextAction: BlockingProcessAction,
    nextMessage?: BlockingProcessMessage
  ) => {
    clearTimer()
    action.value = nextAction
    applyMessage(nextMessage, nextAction === 'publish' ? '正在准备发布' : '正在准备保存')
    timer = setInterval(() => {
      const messages = messageVariants.value
      if (!messages.length || action.value !== nextAction) return
      messageIndex = (messageIndex + 1) % messages.length
      message.value = messages[messageIndex]
    }, 1800)
  }

  const stop = () => {
    clearTimer()
    action.value = null
    message.value = ''
    messageVariants.value = []
    messageIndex = 0
  }

  return {
    action,
    message,
    active,
    start,
    stop,
    setMessage
  }
}
