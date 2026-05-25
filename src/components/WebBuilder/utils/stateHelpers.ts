/**
 * State 相关工具函数
 */

/**
 * 获取 state 的 ID（处理 state 对象或字符串）
 */
export function getStateId(state: any): string {
  if (!state) return ''
  if (typeof state === 'string') return state

  // 尝试多种方式获取 ID
  const id = state.getId?.() ?? state.id ?? state.get?.('id') ?? ''
  if (id) return id

  // 如果没有 ID，尝试从 name 构建（GrapesJS 可能会自动添加 : 前缀）
  const name = state.getName?.() ?? state.name ?? state.get?.('name') ?? ''
  if (name) {
    // 如果 name 已经是 :hover 格式，直接返回
    if (name.startsWith(':')) return name
    // 否则添加 : 前缀
    return `:${name}`
  }

  return ''
}
