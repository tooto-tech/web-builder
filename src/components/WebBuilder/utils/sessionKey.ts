/**
 * 生成或获取 session key
 */
export const getOrCreateSessionKey = (): string => {
  const storageKey = 'cms_page_edit_session_key'
  let sessionKey = sessionStorage.getItem(storageKey)

  if (!sessionKey) {
    // 生成 UUID v4
    sessionKey = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
    sessionStorage.setItem(storageKey, sessionKey)
  }

  return sessionKey
}
