import { ElMessage } from 'element-plus'

type MessageLike = string | Record<string, any>

function normalizeMessage(input: MessageLike) {
  const base = typeof input === 'string' ? { message: input } : (input || {})
  return {
    ...base,
    position: 'top-right',
    showClose: true,
  }
}

export const wbMessage = {
  success(input: MessageLike) {
    return ElMessage.success(normalizeMessage(input))
  },
  warning(input: MessageLike) {
    return ElMessage.warning(normalizeMessage(input))
  },
  info(input: MessageLike) {
    return ElMessage.info(normalizeMessage(input))
  },
  error(input: MessageLike) {
    return ElMessage.error(normalizeMessage(input))
  },
}

