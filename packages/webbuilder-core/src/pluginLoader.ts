import type { GrapesPluginFn } from './types.js'

const scriptPromises = new Map<string, Promise<void>>()

const loadScript = (url: string): Promise<void> => {
  const cached = scriptPromises.get(url)
  if (cached) return cached

  const promise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[data-wb-plugin-src="${url}"]`)
    if (existing) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = url
    script.async = true
    script.dataset.wbPluginSrc = url
    script.onload = () => resolve()
    script.onerror = () => reject(new Error(`脚本加载失败：${url}`))
    document.head.appendChild(script)
  })

  scriptPromises.set(url, promise)
  return promise
}

const pickFunction = (mod: any): GrapesPluginFn | null => {
  if (typeof mod === 'function') return mod as GrapesPluginFn
  if (mod && typeof mod.default === 'function') return mod.default as GrapesPluginFn
  return null
}

export const deriveGlobalNames = (url: string): string[] => {
  const candidates = new Set<string>()
  try {
    const parsedUrl = new URL(url)
    const parts = parsedUrl.pathname.split('/').filter(Boolean)
    const skip = new Set(['npm', 'gh', 'dist', 'umd', 'lib', 'build'])

    for (let index = 0; index < parts.length; index += 1) {
      if (parts[index].startsWith('@') && parts[index + 1]) {
        candidates.add(`${parts[index]}/${parts[index + 1].split('@')[0]}`)
        candidates.add(parts[index + 1].split('@')[0])
      }
    }

    for (const segment of parts) {
      const name = segment.split('@')[0]
      if (!name || skip.has(name)) continue
      if (name.endsWith('.js')) {
        candidates.add(name.replace(/\.(min\.)?js$/i, ''))
      } else if (/^[a-zA-Z]/.test(name)) {
        candidates.add(name)
      }
    }

    for (const candidate of [...candidates]) {
      if (candidate.startsWith('grapesjs-')) {
        candidates.add(`gjs-${candidate.slice('grapesjs-'.length)}`)
      } else if (candidate.startsWith('gjs-')) {
        candidates.add(`grapesjs-${candidate.slice('gjs-'.length)}`)
      }
    }
  } catch {
    return []
  }

  return [...candidates]
}

const pickFromGlobals = (names: string[]): GrapesPluginFn | null => {
  for (const name of names) {
    const fn = pickFunction((window as any)[name])
    if (fn) return fn
  }
  return null
}

export async function loadPluginFromUrl(
  url: string,
  globalVar?: string
): Promise<GrapesPluginFn> {
  const trimmedUrl = url.trim()
  if (!trimmedUrl) throw new Error('插件 URL 不能为空')

  if (globalVar?.trim()) {
    const name = globalVar.trim()
    await loadScript(trimmedUrl)
    const fn = pickFunction((window as any)[name])
    if (!fn) throw new Error(`未在 window.${name} 找到插件函数`)
    return fn
  }

  try {
    const mod = await import(/* @vite-ignore */ trimmedUrl)
    const fn = pickFunction(mod)
    if (fn) return fn
  } catch {
    // UMD bundles commonly fail dynamic import, then fall back to script globals.
  }

  const candidates = deriveGlobalNames(trimmedUrl)
  if (candidates.length) {
    try {
      await loadScript(trimmedUrl)
    } catch {
      // Report a single useful message below.
    }
    const fn = pickFromGlobals(candidates)
    if (fn) return fn
  }

  throw new Error(
    '未从模块解析到插件函数（ESM 默认导出 / UMD 全局变量均未命中）。若为 UMD 包，请填写全局变量名。'
  )
}
