import { computed, ref, shallowRef, watch, type ComputedRef, type Ref } from 'vue'
import { injectCssVariables, useGlobalColorsStore, type GlobalColor } from '@/store/modules/globalColors'
import { injectGlobalCustomCss, useGlobalCustomCssStore } from '@/store/modules/globalCustomCss'
import {
  injectGlobalFontCss,
  useGlobalTypographyStore,
  type GlobalHeadingStyles,
} from '@/store/modules/globalTypography'

export interface DesignSystemTypographyState {
  fontFamily: string
  googleName: string
  headingStyles: GlobalHeadingStyles
}

export interface UseDesignSystemReturn {
  isReady: Ref<boolean>
  colors: ComputedRef<GlobalColor[]>
  typography: ComputedRef<DesignSystemTypographyState>
  customCss: ComputedRef<string>
  syncToCanvas: (eventData?: any) => void
}

const getFrameDocument = (editor: any, eventData?: any): Document | null => {
  try {
    const frame = eventData?.frame ?? eventData
    return (
      frame?.view?.el?.contentDocument ??
      frame?.view?.getDocument?.() ??
      editor?.Canvas?.getDocument?.() ??
      null
    )
  } catch {
    return null
  }
}

export default function useDesignSystem(grapes: any): UseDesignSystemReturn {
  if (grapes._cache.designSystem) {
    return grapes._cache.designSystem
  }

  const globalColorsStore = useGlobalColorsStore()
  const globalTypographyStore = useGlobalTypographyStore()
  const globalCustomCssStore = useGlobalCustomCssStore()
  const editorRef = shallowRef<any>(null)
  const isReady = ref(false)

  const colors = computed(() => globalColorsStore.colors)
  const typography = computed<DesignSystemTypographyState>(() => ({
    fontFamily: globalTypographyStore.fontFamily,
    googleName: globalTypographyStore.googleName,
    headingStyles: globalTypographyStore.headingStyles,
  }))
  const customCss = computed(() => globalCustomCssStore.css)

  const syncDocument = (doc: Document) => {
    try {
      injectCssVariables(doc, globalColorsStore.colors)
      injectGlobalFontCss(
        doc,
        globalTypographyStore.fontFamily,
        globalTypographyStore.googleName,
        globalTypographyStore.headingStyles,
      )
      injectGlobalCustomCss(doc, globalCustomCssStore.css)
    } catch {
      // Canvas iframe can be unavailable between editor init and frame load.
    }
  }

  const syncToCanvas = (eventData?: any) => {
    try {
      injectCssVariables(document, globalColorsStore.colors)
      injectGlobalCustomCss(document, '')
    } catch {
      // SSR/tests or transient document states should not block later canvas syncs.
    }

    const editor = editorRef.value
    if (!editor) return

    const frameDoc = getFrameDocument(editor, eventData)
    if (frameDoc) {
      syncDocument(frameDoc)
    }
  }

  watch(
    () => [
      JSON.stringify(globalColorsStore.colors),
      globalTypographyStore.fontFamily,
      globalTypographyStore.googleName,
      JSON.stringify(globalTypographyStore.headingStyles),
      globalCustomCssStore.css,
      editorRef.value,
    ],
    () => syncToCanvas(),
    { immediate: true },
  )

  grapes.onInit((editor: any) => {
    editorRef.value = editor
    isReady.value = true
    syncToCanvas()

    editor.on('load', () => {
      syncToCanvas()
    })

    editor.on('canvas:frame:load', (eventData?: any) => {
      syncToCanvas(eventData)
    })

    editor.on('page:select', () => {
      setTimeout(() => syncToCanvas(), 80)
    })
  })

  const result: UseDesignSystemReturn = {
    isReady,
    colors,
    typography,
    customCss,
    syncToCanvas,
  }

  grapes._cache.designSystem = result
  return result
}
