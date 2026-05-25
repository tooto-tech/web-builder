import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import gjsBanner from '@/components/WebBuilder/components/registries/media/banner'
import { wbMessage as ElMessage } from '@/components/WebBuilder/utils/wbMessage'
import parserPostCSS from 'grapesjs-parser-postcss'

import {
  useGrapes,
  useSelectedComponent,
  usePages,
  useEditSession,
  useDraftManager,
  usePublish,
  useEditorInit,
  useImageManager,
  useLayoutSettings,
  usePageSettings,
  useEditorChanges,
  useWbStyleManager,
  useDesignSystem,
  useSharedResourceAutosave,
  useTemplateRulesManager,
  useTemplateRuleOptions,
  useWebBuilderI18n,
  useWebBuilderWorkspace,
  useBlockingProcess,
  useEditorPageSync
} from '@/components/WebBuilder/composables'
import useCodeEditor from '@/components/WebBuilder/composables/useCodeEditor'
import useLayoutBundleManager from '@/components/WebBuilder/composables/useLayoutBundleManager'
import { useCmsLivePreview } from '@/components/WebBuilder/composables/useCmsLivePreview'
import { useTemplatePreviewData } from '@/components/WebBuilder/composables/useTemplatePreviewData'
import useResourceTransaction from '@/components/WebBuilder/composables/useResourceTransaction'
import {
  makeLayoutParticipant,
  makePageParticipant,
  makeSharedResourcesParticipant,
  makeTemplateParticipant
} from '@/components/WebBuilder/composables/useResourceParticipants'
import useRegistrationDiagnostics from '@/components/WebBuilder/composables/useRegistrationDiagnostics'
import { getEditorRuntime } from '@/components/WebBuilder/composables/useEditorRuntime'
import {
  normalizePageResourceIdentity,
  type PageResourceIdentity
} from '@/api/content/page'
import type { WebBuilderAdapters, WebBuilderStorageMode } from '@/runtime'
import grapesjsAosTraits from '@/components/WebBuilder/plugins/grapesjs-aos-traits'
import grapesjsSymbolsFallback from '@/components/WebBuilder/plugins/grapesjs-symbols-fallback'
import {
  cleanupRedundantProtectedCssRules,
  syncMountedComponentStyles
} from '@/components/WebBuilder/utils/editorHelpers'
import {
  getEditorModeForResource,
  isLoopItemTemplateResource as isLoopItemTemplateResourceIdentity,
  isTemplateResource,
  isTemplateRulesPanelResource,
  resolvePageResourceIdentityFromRoute
} from '@/components/WebBuilder/utils/pageResourceIdentity'
import {
  buildLayoutProjectDataMap,
  buildPageOnlyProjectData,
  mergeLayoutBundleProjectData
} from '@/components/WebBuilder/utils/layoutProjectData'
import {
  loadProjectDataWithPaint,
  runAfterProjectLoadPaint
} from '@/components/WebBuilder/utils/projectLoad'
import {
  getPrimaryContentPageFromEditor,
  type PageSettings
} from '@/components/WebBuilder/utils/pageSettings'
import { stripI18nTranslationsFromProjectData } from '@/components/WebBuilder/utils/i18n'
import { isTempTemplateResourceType } from '@/components/WebBuilder/config/templateSharedResources'
import { resolveDynamicContext } from '@/components/WebBuilder/components/registries/dynamic/cms'
import { ensureTemplateMainComponent } from '@/components/WebBuilder/utils/templateStarterProject'

export interface WebBuilderControllerProps {
  resource?: PageResourceIdentity
  resourceId?: number
  resourceKey?: string
  resourceType?: string
  resourceScope?: string
  ownerType?: string
  ownerId?: number
  adapters?: WebBuilderAdapters
  storageMode?: WebBuilderStorageMode
}

export default function useWebBuilderController(props: WebBuilderControllerProps) {

const route = useRoute()
const router = useRouter()
const isDev = import.meta.env.DEV
const sidePanelWidth = ref(280)
const isResizingSidePanel = ref(false)
let sidePanelResizeStartX = 0
let sidePanelResizeStartWidth = 280

const sidePanelGridStyle = computed(() => ({
  gridTemplateColumns: `48px ${sidePanelWidth.value}px minmax(0, 1fr)`
}))

function clampSidePanelWidth(value: number) {
  const maxWidth = Math.max(280, Math.floor(window.innerWidth / 2))
  return Math.min(maxWidth, Math.max(240, Math.round(value)))
}

function stopSidePanelResize() {
  if (!isResizingSidePanel.value) return
  isResizingSidePanel.value = false
  document.body.style.cursor = ''
  document.body.style.userSelect = ''
  document.body.classList.remove('wb-side-panel-resizing')
  window.removeEventListener('mousemove', handleSidePanelResizeMove)
  window.removeEventListener('mouseup', stopSidePanelResize)
  window.removeEventListener('blur', stopSidePanelResize)
}

function handleSidePanelResizeMove(event: MouseEvent) {
  if (!isResizingSidePanel.value) return
  sidePanelWidth.value = clampSidePanelWidth(
    sidePanelResizeStartWidth + event.clientX - sidePanelResizeStartX
  )
}

function startSidePanelResize(event: MouseEvent) {
  if (isPreviewMode.value) return
  sidePanelResizeStartX = event.clientX
  sidePanelResizeStartWidth = sidePanelWidth.value
  isResizingSidePanel.value = true
  document.body.style.cursor = 'col-resize'
  document.body.style.userSelect = 'none'
  document.body.classList.add('wb-side-panel-resizing')
  window.addEventListener('mousemove', handleSidePanelResizeMove)
  window.addEventListener('mouseup', stopSidePanelResize)
  window.addEventListener('blur', stopSidePanelResize)
}

const pageResource = computed<PageResourceIdentity>(() =>
  props.resource
    ? normalizePageResourceIdentity(props.resource)
    : resolvePageResourceIdentityFromRoute(route.query, props)
)

const isTempTemplateResource = computed(() => isTemplateResource(pageResource.value))
const isLoopItemTemplateResource = computed(() =>
  isLoopItemTemplateResourceIdentity(pageResource.value)
)
const editorMode = computed(() => getEditorModeForResource(pageResource.value))

// Use ref to determine container for the canvas
const canvas = ref(null)
const escapeName = (name: string) => `${name}`.trim()

// Pass GrapesJS configuration object to useGrapes
const grapes = useGrapes({
  container: canvas,
  // parser: {
  //   optionsHtml: {
  //     allowScripts: true,
  //     allowUnsafeAttr: true,
  //     allowUnsafeAttrValue: true,
  //   },
  // },
  // avoidDefaults: true,
  // clearStyles: true,
  dragMode: 'translate',
  canvas: {
    styles: [
      'https://fonts.googleapis.com/css2?family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Staatliches&display=swap'
    ],
    script: ['https://code.jquery.com/jquery-3.5.1.min.js'],
    frameStyle: `
    * ::-webkit-scrollbar { width: 10 }
    body{background:#ffffff;}
    body .tooto-selected{
        outline: 2px solid #2251ff !important;
    }
    [data-gjs-type="wrapper"] > [data-wb-loop-item-root]{
      max-width: 410px;
      margin: 10vh auto;
    }
  `
  },
  stylePrefix: 'tooto-',
  deviceManager: {
    devices: [
      { id: 'desktop', name: 'Desktop', icon: 'lucide:monitor' },
      { id: 'mobile', name: 'Mobile', width: '375px', widthMedia: '767px' }
    ]
  },
  selectorManager: {
    escapeName,
    states: [{ name: 'hover', label: 'Hover' }]
  },
  plugins: [
    // grapesjsTailwind,
    grapesjsSymbolsFallback,
    gjsBanner,
    parserPostCSS,
    (editor: any) =>
      grapesjsAosTraits(editor, {
        cssUrl: 'https://cdn.jsdelivr.net/npm/aos/dist/aos.css',
        jsUrl: 'https://cdn.jsdelivr.net/npm/aos/dist/aos.js'
      })
  ],
  // 禁用默认的 asset manager，使用自定义的 AssetsModal
  assetManager: {
    custom: true
  },
  // 禁用默认存储，使用后端接口存储
  // 实际草稿落盘目标由 `src/components/WebBuilder/config/storage.ts` 控制：
  // backend / indexeddb
  storageManager: {
    type: ''
  }
})

// 提前初始化 StyleManager（必须在 GrapesJS 初始化前调用，设置 custom 模式）
// WbStylePanel.vue 中的调用会命中此处建立的缓存
useWbStyleManager(grapes)

// 全局设计系统注入（颜色、字体、自定义 CSS，始终运行，不受面板切换影响）
useDesignSystem(grapes)

// CMS 动态组件编辑器实时预览
useCmsLivePreview(grapes)

const layoutSettingsStore = useLayoutSettings()

// 轻量 composables，先于编辑器装配声明，避免后续回调闭包跨越过长
const selected = useSelectedComponent(grapes)
const codeEditor = useCodeEditor(grapes)
const editorChanges = useEditorChanges(grapes)
let sharedResourcesManager: ReturnType<typeof useSharedResourceAutosave> | null = null
let lifecycleResourceTransaction: ReturnType<typeof useResourceTransaction> | null = null

const blockingProcess = useBlockingProcess()
const blockingProcessMessage = blockingProcess.message
const blockingProcessingActive = blockingProcess.active
const startBlockingProcess = blockingProcess.start
const stopBlockingProcess = blockingProcess.stop
const setBlockingProcessMessage = blockingProcess.setMessage

const hasDirtyEditorResources = () =>
  lifecycleResourceTransaction?.hasDirtyResources() ?? editorChanges.hasChanges.value

const buildCurrentEditorResourceProjectData = (
  projectData: Record<string, any> | null | undefined
): Record<string, any> => {
  if (isLoopItemTemplateResource.value) {
    return buildPageOnlyProjectData(projectData)
  }
  return layoutBundleManager.buildCurrentResourceProjectData(projectData)
}

const serializeCurrentEditorResourceProjectData = (editor: any) => {
  const projectData = buildCurrentEditorResourceProjectData(editor?.getProjectData?.() || null)
  return JSON.stringify(stripI18nTranslationsFromProjectData(projectData))
}

// 编辑器引用（直接指向 editorInit 的响应式状态，无需额外中间 ref）
const editorRef = computed(() => editorInit.editorRef.value)
const isEditorReadyRef = computed(() => editorInit.isEditorReady.value)
const registrationDiagnostics = useRegistrationDiagnostics()
const registrationOptionalDiagnostics = registrationDiagnostics.optionalDiagnostics
const registrationBlockingDiagnostic = registrationDiagnostics.blockingDiagnostic
const registrationDiagnosticText = computed(() => {
  if (registrationBlockingDiagnostic.value) return registrationBlockingDiagnostic.value.message
  const optionalIds = registrationOptionalDiagnostics.value.map((item) => item.entryId)
  if (!optionalIds.length) return ''
  return `部分可选组件注册失败：${optionalIds.join('、')}`
})

// 编辑会话管理
const editSession = useEditSession({
  pageResource: () => pageResource.value,
  editorChanges,
  hasDirtyResources: hasDirtyEditorResources
})

const hasUnsavedEditorWork = () => editSession.hasUnsavedChanges.value

const layoutBundleManager = useLayoutBundleManager({
  session: editSession.session,
  getPageResource: () => pageResource.value,
  getEditorMode: () => editorMode.value
})

const templateRulesManager = useTemplateRulesManager({
  getSessionKey: () => editSession.currentSessionKey.value,
  getPageResource: () => pageResource.value
})

const templateRuleOptions = useTemplateRuleOptions()

// 草稿数据管理
const draftManager = useDraftManager({
  pageResource: () => pageResource.value,
  getEditor: () => editorRef.value,
  session: editSession.session,
  serializeSchemaJson: serializeCurrentEditorResourceProjectData,
  isPublishing: () => publishManager?.isPublishing?.value ?? false,
  onSaveConflictConfirmStart: (silent) => {
    if (!silent) stopBlockingProcess()
  },
  onSaveConflictConfirmEnd: (silent) => {
    if (!silent) startBlockingProcess('save', ['保存中，请稍候', '正在重新提交草稿数据'])
  }
})

sharedResourcesManager = useSharedResourceAutosave({
  getSessionKey: () => editSession.currentSessionKey.value
})

const currentResourceExtJson = computed(() =>
  `${(draftManager.currentPage.value as any)?.extJson ?? ''}`.trim()
)

const ensureStandalonePageIdentity = (editor: any) => {
  const resource = pageResource.value
  const resourceKey = `${resource.resourceKey ?? ''}`.trim()
  if (
    (!isTempTemplateResourceType(resource.resourceType) && resource.resourceType !== 'PAGE') ||
    !resourceKey
  )
    return

  const fallbackName =
    `${(draftManager.currentPage.value as any)?.resourceName ?? ''}`.trim() || resourceKey
  const dynamicContext =
    resolveDynamicContext(resource.resourceType, currentResourceExtJson.value) || undefined
  let page = getPrimaryContentPageFromEditor(editor)

  if (!page && editor?.Pages?.add) {
    page = editor.Pages.add({
      id: resourceKey,
      name: fallbackName,
      slug: fallbackName,
      custom: {
        slug: fallbackName,
        tdkTitle: fallbackName,
        tdk: { title: fallbackName }
      },
      component: ''
    })
  }

  if (!page) return

  const currentId = `${page?.get?.('id') ?? page?.id ?? ''}`.trim()
  const currentName = `${page?.get?.('name') ?? page?.name ?? ''}`.trim()
  const custom = page?.get?.('custom') ?? page?.custom ?? {}
  const nextCustom = {
    ...custom,
    slug: `${custom.slug ?? page?.get?.('slug') ?? page?.slug ?? ''}`.trim() || fallbackName,
    tdkTitle: `${custom.tdkTitle ?? custom.tdk?.title ?? ''}`.trim() || fallbackName,
    tdk: {
      ...(custom.tdk ?? {}),
      title: `${custom.tdkTitle ?? custom.tdk?.title ?? ''}`.trim() || fallbackName
    },
    // 动态字段 block 需要知道当前页面属于哪种模板上下文
    resourceType: resource.resourceType ?? custom.resourceType ?? '',
    ...(dynamicContext ? { wbTemplateContext: dynamicContext } : {})
  }

  if (page?.set) {
    if (currentId !== resourceKey) {
      page.set('id', resourceKey)
    }
    if (!currentName) {
      page.set('name', fallbackName)
    }
    if (!`${page?.get?.('slug') ?? page?.slug ?? ''}`.trim()) {
      page.set('slug', fallbackName)
    }
    page.set('custom', nextCustom)
  } else {
    page.id = resourceKey
    if (!currentName) page.name = fallbackName
    if (!`${page.slug ?? ''}`.trim()) page.slug = fallbackName
    page.custom = nextCustom
  }

  // Seed the primary CMS component for newly-created TEMP_* templates so the
  // canvas doesn't appear blank on first open.  Only runs when the wrapper has
  // no child components yet.
  const seededMainComponent = isTempTemplateResourceType(resource.resourceType)
    ? ensureTemplateMainComponent(editor, resource.resourceType, page, currentResourceExtJson.value)
    : false

  if (!seededMainComponent) {
    editor?.clearDirtyCount?.()
  } else {
    editorChanges.markAsChanged()
  }
}

// 图片资源管理
const imageManager = useImageManager({
  getEditor: () => editorRef.value
})

const isEditorManualLoad = (editor: any) => getEditorRuntime(editor).isManualLoad
const startEditorManualLoad = (editor: any) => getEditorRuntime(editor).startManualLoad()
const requestEditorCmsPreviewRefresh = (editor: any, delay = 450) => {
  getEditorRuntime(editor).requestCmsPreviewRefresh(delay)
}
const requestEditorTemplatePreviewRefresh = (editor: any) => {
  getEditorRuntime(editor).requestTemplatePreviewRefresh()
}

// 编辑器初始化
const editorInit = useEditorInit({
  grapes,
  setupAssetManager: (editor) => {
    imageManager.setupAssetManagerInterceptor(editor)
  },
  onLoad: async (editor) => {
    // 如果是手动加载项目，跳过自动加载服务器数据
    if (isEditorManualLoad(editor)) {
      return
    }

    const draftData = await draftManager.loadDraftData()
    await sharedResourcesManager?.loadSharedDrafts(draftManager.legacySharedPayloads.value)
    const combinedDraftData = isLoopItemTemplateResource.value
      ? buildPageOnlyProjectData(draftData)
      : await layoutBundleManager.loadLayoutDrafts(draftData)
    if (isLoopItemTemplateResource.value) {
      layoutBundleManager.updateCurrentResourceBaseline(combinedDraftData)
    }
    await templateRulesManager.loadTemplateRules()
    // 只有在有数据时才加载
    if (combinedDraftData) {
      const finishManualLoad = startEditorManualLoad(editor)
      editorChanges.pauseTracking()
      try {
        await loadProjectDataWithPaint(editor, combinedDraftData, {
          afterPaint: () => {
            syncMountedComponentStyles(editor)
            cleanupRedundantProtectedCssRules(editor)
          }
        })
      } finally {
        setTimeout(() => {
          finishManualLoad()
          editor.clearDirtyCount?.()
          editorChanges.resumeTracking(true)
          requestEditorCmsPreviewRefresh(editor, 450)
        }, 0)
      }
    }

    ensureStandalonePageIdentity(editor)
    layoutBundleManager.updateCurrentResourceBaseline(editor.getProjectData?.() || combinedDraftData)

    editorPageSync.restoreSelectedPage(editor)
  },
  onComponentDblclick: (component) => {
    imageManager.handleComponentDblclick(component)
  }
})

// 发布功能
const publishManager = usePublish({
  pageResource: () => pageResource.value,
  getEditor: () => editorInit.editorRef.value,
  getSessionKey: () => editSession.currentSessionKey.value,
  getBaseUpdateTime: () => draftManager.baseUpdateTime.value,
  setBaseUpdateTime: (time: Date) => {
    draftManager.baseUpdateTime.value = time
  },
  serializeSchemaJson: serializeCurrentEditorResourceProjectData,
  onPublishProcessingMessage: setBlockingProcessMessage,
  onPublishProcessingEnd: stopBlockingProcess,
  onBeforeAutoReload: () => editSession.allowNextBeforeUnload()
})

let saveTransactionSilent = false
const resourceParticipantEditor = () => editorInit.editorRef.value
const layoutParticipantContext = {
  manager: layoutBundleManager,
  getEditor: resourceParticipantEditor,
  getSaveSilent: () => saveTransactionSilent
}
const pageParticipantContext = {
  draftManager,
  publishManager,
  editLock: editSession,
  layoutBundleManager,
  editorChanges,
  getEditor: resourceParticipantEditor,
  getSaveSilent: () => saveTransactionSilent
}
const saveResourceTransaction = useResourceTransaction({
  participants: () => [
    makeSharedResourcesParticipant(sharedResourcesManager, 'save'),
    makeLayoutParticipant(layoutParticipantContext, 'save'),
    makeTemplateParticipant(templateRulesManager, 'save', {
      getSaveSilent: () => saveTransactionSilent
    }),
    makePageParticipant(pageParticipantContext, 'save'),
  ],
})

const publishResourceTransaction = useResourceTransaction({
  participants: () => [
    makeSharedResourcesParticipant(sharedResourcesManager, 'publish'),
    makeLayoutParticipant(layoutParticipantContext, 'publish', { publishTarget: 'draft' }),
    makeLayoutParticipant(layoutParticipantContext, 'publish', { publishTarget: 'rules' }),
    makeTemplateParticipant(templateRulesManager, 'publish', { publishTarget: 'draft' }),
    makeTemplateParticipant(templateRulesManager, 'publish', { publishTarget: 'rules' }),
    makePageParticipant(pageParticipantContext, 'publish'),
  ],
})

const resourceTransaction = {
  flushDrafts: (silent = false) => {
    saveTransactionSilent = silent
    return saveResourceTransaction.flushDrafts()
  },
  publish: () => publishResourceTransaction.publish(),
}
// 页面设置管理
const pagesMgr = usePages(grapes)
const pageSettings = usePageSettings({
  getSelectedPage: () => pagesMgr.selected
})
const webBuilderI18n = useWebBuilderI18n({
  grapes,
  resource: pageResource,
  blockingProcess
})

lifecycleResourceTransaction = useResourceTransaction({
  participants: () => [
    makeSharedResourcesParticipant(sharedResourcesManager, 'lifecycle'),
    makeLayoutParticipant(layoutParticipantContext, 'lifecycle'),
    makeTemplateParticipant(templateRulesManager, 'lifecycle'),
    {
      id: 'i18n-draft',
      label: '多语言草稿',
      isDirty: () => Boolean(webBuilderI18n.dirty.value),
      failurePolicy: 'warning',
      flushDraft: () => true,
      publish: () => true,
      releaseLock: () => undefined,
    },
    makePageParticipant(pageParticipantContext, 'lifecycle'),
  ],
})

const currentResourceType = computed(() => pageResource.value.resourceType ?? null)

useTemplatePreviewData({
  grapes,
  getSelectedPage: () => pagesMgr.selected,
  resourceType: currentResourceType,
  resourceExtJson: currentResourceExtJson,
  isEditorReady: isEditorReadyRef
})

const handleSavePageSettings = (settings: PageSettings) => {
  pageSettings.savePageSettings(settings)
  const editor = editorInit.editorRef.value
  if (editor) requestEditorTemplatePreviewRefresh(editor)
}

const selectedKey = computed(() => {
  const comp = selected.getRawComponent?.() ?? (selected.component as any)
  return comp?.cid ?? null
})

const showLayoutPanel = computed(() => editorMode.value === 'layout')
const showTemplatePanel = computed(() => isTemplateRulesPanelResource(pageResource.value))
const editorPageSync = useEditorPageSync({
  routeQuery: computed(() => route.query),
  replaceRouteQuery: (query) => router.replace({ query }),
  getPageResource: () => pageResource.value,
  getEditorMode: () => editorMode.value,
  isEditorReady: isEditorReadyRef,
  isLoopItemTemplateResource,
  getSelectedPage: () => pagesMgr.selected,
  exportLayoutSettings: () => layoutSettingsStore.exportSettings(),
  grapes
})
const isPageSwitching = editorPageSync.isPageSwitching
const renderReadonlyLayoutPreview = editorPageSync.renderReadonlyLayoutPreview

const webBuilderWorkspace = useWebBuilderWorkspace({
  isDev,
  selectedKey,
  showLayoutPanel,
  showTemplatePanel,
  blockingProcessingActive,
  blockingProcessMessage,
  isEditorReady: isEditorReadyRef,
  isPageSwitching,
  grapes,
  getEditor: () => editorInit.editorRef.value,
  canOpenPageSettings: () => editorMode.value !== 'layout',
  openPageSettings: () => pageSettings.openPageSettings(),
  runAfterProjectLoadPaint,
  startBlockingProcess,
  stopBlockingProcess,
  setBlockingProcessMessage,
  ensureI18nReadyOrConfirmed: webBuilderI18n.ensureReadyOrConfirm,
  getI18nEntries: () => webBuilderI18n.entries.value,
  getI18nPreviewProjectData: () => webBuilderI18n.getPreviewProjectData(),
  loadI18nPreviewProjectData: (projectData) => loadI18nPreviewProjectData(projectData),
  refreshI18nSourceEntries: () => webBuilderI18n.refreshSourceEntries(),
  autoTranslateMissing: (options) => webBuilderI18n.autoTranslateMissing(options),
  resourceTransaction,
  hasCurrentResourceChanges: (projectData) =>
    layoutBundleManager.hasCurrentResourceChanges(projectData),
  updateCurrentResourceBaseline: (projectData) =>
    layoutBundleManager.updateCurrentResourceBaseline(projectData),
  markEditorSaved: () => editorChanges.markAsSaved(),
  markEditorChanged: () => editorChanges.markAsChanged(),
  pauseEditorTracking: () => editorChanges.pauseTracking(),
  resumeEditorTracking: (markClean) => editorChanges.resumeTracking(markClean),
  hasEditorChanges: () => editorChanges.hasChanges.value,
  hasUnsavedEditorWork,
  parseProjectData: (schemaJson, errorMessage) =>
    draftManager.parseProjectData(schemaJson, errorMessage),
  applyProjectDataToEditor: (projectData) => applyProjectDataToEditor(projectData)
})

const activePanel = webBuilderWorkspace.activePanel
const showLayers = webBuilderWorkspace.showLayers
const showCode = webBuilderWorkspace.showCode
const showProjectsBrowser = webBuilderWorkspace.showProjectsBrowser
const isPreviewMode = webBuilderWorkspace.isPreviewMode
const editorLoadingVisible = webBuilderWorkspace.editorLoadingVisible
const editorLoadingText = webBuilderWorkspace.editorLoadingText
const devices = webBuilderWorkspace.devices
const selectedDevice = webBuilderWorkspace.selectedDevice
const handleSelectPanel = webBuilderWorkspace.handleSelectPanel
const toggleLayers = webBuilderWorkspace.toggleLayers
const closeLayers = webBuilderWorkspace.closeLayers
const toggleCode = webBuilderWorkspace.toggleCode
const setDevice = webBuilderWorkspace.setDevice
const openProjectsBrowser = webBuilderWorkspace.openProjectsBrowser
const handleOpenPageSettings = webBuilderWorkspace.handleOpenPageSettings
const openPreview = webBuilderWorkspace.openPreview
const exitPreview = webBuilderWorkspace.exitPreview
const handleSaveDraft = webBuilderWorkspace.handleSaveDraft
const handlePublish = webBuilderWorkspace.handlePublish
const handleImportStart = webBuilderWorkspace.handleImportStart
const handleImportDone = webBuilderWorkspace.handleImportDone
const handleRestoreHistory = webBuilderWorkspace.handleRestoreHistory

let componentRemovePanelHandler: (() => void) | null = null
let componentRemovePanelRafId: number | null = null
let isWebBuilderUnmounting = false
grapes.onInit((editor: any) => {
  componentRemovePanelHandler = () => {
    if (isWebBuilderUnmounting) return

    if (componentRemovePanelRafId != null) {
      cancelAnimationFrame(componentRemovePanelRafId)
      componentRemovePanelRafId = null
    }

    componentRemovePanelRafId = requestAnimationFrame(() => {
      componentRemovePanelRafId = null
      if (isWebBuilderUnmounting || editorRef.value !== editor) return
      webBuilderWorkspace.resetPanelAfterSelectionCleared(editor, editorRef.value)
    })
  }

  editor.on('component:remove', componentRemovePanelHandler)
})

const isCodeRefreshing = ref(false)

const refreshCodeForModal = () => {
  if (!isDev || isCodeRefreshing.value) return
  isCodeRefreshing.value = true
  requestAnimationFrame(() => {
    try {
      codeEditor.refreshCode()
    } finally {
      isCodeRefreshing.value = false
    }
  })
}

const BOTTOM_DROP_MIME = 'application/x-wb-content'
const isBottomDropActive = ref(false)
let bottomDropDragDepth = 0

const parseDraggedContent = (raw: string) => {
  try {
    return JSON.parse(raw)
  } catch {
    return raw
  }
}

const toComponentArray = (children: any): any[] => {
  if (!children) return []
  if (Array.isArray(children)) return children
  if (typeof children.models !== 'undefined' && Array.isArray(children.models))
    return children.models
  if (typeof children.toArray === 'function') return children.toArray()
  return []
}

const findLoopItemRootComponent = (root: any): any | null => {
  if (!root) return null
  const stack = [root]
  const seen = new Set<any>()
  while (stack.length > 0) {
    const component = stack.shift()
    if (!component || seen.has(component)) continue
    seen.add(component)
    const attrs = component.getAttributes?.() || component.get?.('attributes') || {}
    if (Object.prototype.hasOwnProperty.call(attrs, 'data-wb-loop-item-root')) {
      return component
    }
    stack.push(...toComponentArray(component.components?.()))
  }
  return null
}

const appendToPageBottom = (content: any) => {
  const editor = editorInit.editorRef.value
  if (!editor || !content) return

  const page = editor.Pages?.getSelected?.()
  const main = page?.getMainComponent?.()
  const root = isLoopItemTemplateResource.value ? findLoopItemRootComponent(main) || main : main
  if (root && typeof root.append === 'function') {
    const added = root.append(content)
    if (Array.isArray(added) && added.length > 0) {
      editor.select?.(added[added.length - 1])
    } else if (added) {
      editor.select?.(added)
    }
    return
  }

  editor.addComponents(content)
}

const handleBottomDropDragEnter = (event: DragEvent) => {
  event.preventDefault()
  bottomDropDragDepth += 1
  isBottomDropActive.value = true
}

const handleBottomDropDragLeave = (event: DragEvent) => {
  event.preventDefault()
  bottomDropDragDepth = Math.max(0, bottomDropDragDepth - 1)
  if (bottomDropDragDepth === 0) {
    isBottomDropActive.value = false
  }
}

const handleBottomDropDragOver = (event: DragEvent) => {
  event.preventDefault()
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

const handleBottomDrop = (event: DragEvent) => {
  event.preventDefault()
  bottomDropDragDepth = 0
  isBottomDropActive.value = false

  const transfer = event.dataTransfer
  if (!transfer) return

  const raw = transfer.getData(BOTTOM_DROP_MIME) || transfer.getData('text/html')
  if (!raw) return
  const content = parseDraggedContent(raw)
  appendToPageBottom(content)
}

const handleCodeSave = (data: { html: string; css: string; js: string }) => {
  codeEditor.updateCode('html', data.html)
  codeEditor.updateCode('css', data.css)
  codeEditor.updateCode('js', data.js)
  webBuilderWorkspace.closeCode()
}

const applyProjectDataToEditor = async (projectData: Record<string, any>) => {
  const editor = editorInit.editorRef.value
  if (!editor?.loadProjectData) {
    throw new Error('EDITOR_NOT_READY')
  }

  const nextProjectData =
    editorMode.value === 'layout'
      ? layoutBundleManager.buildCurrentResourceProjectData(projectData)
      : isLoopItemTemplateResource.value
        ? buildPageOnlyProjectData(projectData)
        : mergeLayoutBundleProjectData(
            buildPageOnlyProjectData(projectData),
            Object.values(buildLayoutProjectDataMap(editor.getProjectData?.() || {}))
          )
  draftManager.hydrateProjectData(nextProjectData)
  editorChanges.pauseTracking()
  const finishManualLoad = startEditorManualLoad(editor)

  try {
    await loadProjectDataWithPaint(editor, nextProjectData, {
      skipUndo: true,
      afterPaint: () => {
        syncMountedComponentStyles(editor)
        cleanupRedundantProtectedCssRules(editor)
        requestEditorCmsPreviewRefresh(editor, 600)
        renderReadonlyLayoutPreview()
      }
    })
  } finally {
    finishManualLoad()
  }
}

async function resetEditor() {
  const editor = editorInit.editorRef.value
  if (!editor?.loadProjectData) return

  const emptyProjectData = {
    assets: [],
    styles: [],
    pages: [
      {
        id: 'home',
        name: 'Home',
        component: ''
      }
    ]
  }

  editorChanges.pauseTracking()
  const finishManualLoad = startEditorManualLoad(editor)

  try {
    await loadProjectDataWithPaint(editor, emptyProjectData, {
      skipUndo: true,
      afterPaint: () => {
        syncMountedComponentStyles(editor)
        cleanupRedundantProtectedCssRules(editor)
        editor.Pages?.select?.('home')
        editor.select?.(null)
        requestEditorCmsPreviewRefresh(editor, 300)
      }
    })
  } finally {
    finishManualLoad()
    editor.trigger?.('wb:manual-load:end')
    editorChanges.resumeTracking(false)
    editorChanges.markAsChanged()
  }
}

const handleResetEditor = async () => {
  try {
    await ElMessageBox.confirm(
      '这会清空当前画布和页面数据，并重建一个空白 Home 页面。该操作不会自动保存到草稿，确认继续吗？',
      'Reset Editor',
      {
        type: 'warning',
        confirmButtonText: '确认重置',
        cancelButtonText: '取消'
      }
    )
  } catch {
    return
  }

  await resetEditor()
  ElMessage.success('编辑器已重置，当前为空白页面')
}

const loadI18nPreviewProjectData = async (projectData: Record<string, any>) => {
  const editor = editorInit.editorRef.value
  if (!editor?.loadProjectData) return
  editorChanges.pauseTracking()
  const finishManualLoad = startEditorManualLoad(editor)
  try {
    await loadProjectDataWithPaint(editor, projectData, {
      skipUndo: true,
      afterPaint: () => {
        syncMountedComponentStyles(editor)
        cleanupRedundantProtectedCssRules(editor)
        requestEditorCmsPreviewRefresh(editor, 300)
        renderReadonlyLayoutPreview()
      }
    })
  } finally {
    finishManualLoad()
    editorChanges.resumeTracking(true)
  }
}


const handleBeforeUnload = (event: BeforeUnloadEvent) => {
  editSession.handleBeforeUnload(event)
  layoutBundleManager.stopTimers()
  templateRulesManager.stopTimers()
  layoutBundleManager.releaseAllLocksKeepalive()
  templateRulesManager.releaseAllLocksKeepalive()
}

onBeforeRouteLeave(async () => {
  const leaveState = webBuilderWorkspace.getLeaveConfirmationState()
  if (!leaveState.hasUnsavedChanges) return true
  try {
    await ElMessageBox.confirm(
      leaveState.message,
      leaveState.title,
      {
        type: 'warning',
        confirmButtonText: '离开',
        cancelButtonText: '继续编辑',
        distinguishCancelAndClose: true
      }
    )
    return true
  } catch {
    return false
  }
})

// 在组件挂载时获取编辑锁
onMounted(async () => {
  // 在浏览器环境注册 beforeunload 监听器
  window.addEventListener('beforeunload', handleBeforeUnload)

  // 先获取编辑锁
  const lockAcquired = await editSession.tryAcquireLock()
  if (!lockAcquired) {
    return // 用户取消或获取锁失败
  }

  // 启动心跳和自动保存定时器
  editSession.startTimers()
  layoutBundleManager.startTimers()
  templateRulesManager.startTimers()

  // 注意：草稿数据会在编辑器 load 事件中自动加载，不需要在这里重复加载
})
// 在组件卸载前释放编辑锁
onBeforeUnmount(async () => {
  isWebBuilderUnmounting = true
  stopBlockingProcess()
  stopSidePanelResize()

  if (componentRemovePanelRafId != null) {
    cancelAnimationFrame(componentRemovePanelRafId)
    componentRemovePanelRafId = null
  }

  editorPageSync.cleanup()

  // 移除 beforeunload 事件监听器
  window.removeEventListener('beforeunload', handleBeforeUnload)

  // 清理编辑器事件监听器
  if (componentRemovePanelHandler && editorRef.value?.off) {
    editorRef.value.off('component:remove', componentRemovePanelHandler)
    componentRemovePanelHandler = null
  }

  editorInit.cleanup()

  editSession.stopTimers()
  layoutBundleManager.stopTimers()
  templateRulesManager.stopTimers()
  await lifecycleResourceTransaction?.releaseLocks()
})

  return {
    activePanel,
    blockingProcessingActive,
    canvas,
    closeLayers,
    codeEditor,
    currentResourceExtJson,
    devices,
    editorChanges,
    editorInit,
    editorLoadingText,
    editorLoadingVisible,
    exitPreview,
    grapes,
    handleBottomDrop,
    handleBottomDropDragEnter,
    handleBottomDropDragLeave,
    handleBottomDropDragOver,
    handleCodeSave,
    handleImportDone,
    handleImportStart,
    handleOpenPageSettings,
    handlePublish,
    handleResetEditor,
    handleRestoreHistory,
    handleSaveDraft,
    handleSavePageSettings,
    handleSelectPanel,
    handleSidePanelResizeMove,
    imageManager,
    isBottomDropActive,
    isCodeRefreshing,
    isDev,
    isEditorReadyRef,
    isPageSwitching,
    isPreviewMode,
    isResizingSidePanel,
    isTempTemplateResource,
    layoutBundleManager,
    openPreview,
    openProjectsBrowser,
    pageResource,
    pageSettings,
    publishManager,
    refreshCodeForModal,
    registrationDiagnosticText,
    selected,
    selectedDevice,
    setDevice,
    showCode,
    showLayers,
    showLayoutPanel,
    showProjectsBrowser,
    showTemplatePanel,
    sidePanelGridStyle,
    startSidePanelResize,
    stopSidePanelResize,
    templateRuleOptions,
    templateRulesManager,
    toggleCode,
    toggleLayers,
    webBuilderI18n
  }
}
