import { shallowRef, ref, markRaw, onBeforeUnmount, type Ref } from 'vue'

// ── Types ─────────────────────────────────────────────────────────────────────

export type LayerNode = {
  id: string
  label: string
  visible: boolean
  hasChildren: boolean
  children: LayerNode[]
  type: string
  tagName: string
  isWrapper?: boolean
  /** Raw GrapesJS Backbone model — use for all GJS operations */
  _model: any
}

export type DropTarget = {
  id: string
  position: 'before' | 'after' | 'inside'
}

export type LayerDragContext = {
  selectedId: Ref<string | null>
  selectedIds: Ref<Set<string>>
  collapsedIds: Ref<Set<string>>
  dragState: { draggingId: string | null; dropTarget: DropTarget | null }
  selectLayer: (id: string, event?: MouseEvent) => void
  renameLayer: (id: string, name: string) => void
  toggleVisible: (id: string) => void
  toggleExpand: (id: string) => void
  onDragStart: (e: DragEvent, id: string) => void
  onDragOver: (e: DragEvent, node: LayerNode) => void
  onDrop: (targetId: string) => void
  onDragEnd: () => void
  onContextMenu: (e: MouseEvent, node: LayerNode) => void
}

// ── Composable ────────────────────────────────────────────────────────────────

export function useLayerTree(grapes: any) {
  // shallowRef: only the array reference is reactive — prevents Vue from deeply
  // proxying GrapesJS Backbone models (_model), which caused 1-2s freezes.
  const layers = shallowRef<LayerNode[]>([])
  const selectedId = ref<string | null>(null)
  const selectedIds = ref<Set<string>>(new Set())
  const collapsedIds = ref<Set<string>>(new Set())

  /** cid → raw GrapesJS model, rebuilt on every tree refresh */
  const modelMap = new Map<string, any>()
  let editorInstance: any = null
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let lastSelectedId: string | null = null

  // Stored handler references for cleanup
  let _onSelected: ((comp: any) => void) | null = null
  let _onDeselected: (() => void) | null = null

  // ── Tree building ──────────────────────────────────────────────────────────

  const getLabel = (model: any): string =>
    model.getName?.() ??
    model.get?.('name') ??
    model.get?.('customName') ??
    model.get?.('type') ??
    model.get?.('tagName') ??
    'Component'

  const getVisible = (model: any): boolean => {
    const style = model.getStyle?.() ?? {}
    return style.display !== 'none'
  }

  const createLayerNode = (raw: any, children: LayerNode[], isWrapper = false): LayerNode | null => {
    const cid: string = raw?.cid ?? ''
    if (!cid) return null

    modelMap.set(cid, raw)

    return {
      id: cid,
      label: isWrapper ? 'Wrapper' : getLabel(raw),
      visible: getVisible(raw),
      hasChildren: children.length > 0,
      children,
      type: raw.get?.('type') ?? '',
      tagName: raw.get?.('tagName') ?? (isWrapper ? 'body' : 'div'),
      isWrapper,
      // markRaw: tell Vue never to proxy this Backbone model
      _model: markRaw(raw),
    }
  }

  const buildTree = (models: any[]): LayerNode[] =>
    models.flatMap((m) => {
      const raw = m._model ?? m
      const childModels: any[] = raw.components?.()?.models ?? []
      const children = buildTree(childModels)

      // 纯装饰节点直接隐藏；结构包装节点不出现在树里，但保留其可编辑后代。
      if (raw?.get?.('layerable') === false && raw?.get?.('selectable') === false) {
        return []
      }

      if (raw?.get?.('layerable') === false) {
        return children
      }

      const node = createLayerNode(raw, children)
      return node ? [node] : children
    })

  const buildWrapperTree = (wrapper: any): LayerNode[] => {
    const raw = wrapper?._model ?? wrapper
    const childModels: any[] = raw.components?.()?.models ?? []
    const children = buildTree(childModels)
    const wrapperNode = createLayerNode(raw, children, true)
    return wrapperNode ? [wrapperNode] : children
  }

  const refreshTree = () => {
    if (!editorInstance) return
    const wrapper = editorInstance.getWrapper?.()
    if (!wrapper) return
    modelMap.clear()
    layers.value = buildWrapperTree(wrapper)
    const expandableIds = new Set<string>()
    const walk = (nodes: LayerNode[]) => {
      for (const node of nodes) {
        if (node.hasChildren) expandableIds.add(node.id)
        walk(node.children)
      }
    }
    walk(layers.value)
    const nextCollapsedIds = new Set(
      [...collapsedIds.value].filter((id) => expandableIds.has(id))
    )
    if (nextCollapsedIds.size !== collapsedIds.value.size) {
      collapsedIds.value = nextCollapsedIds
    }
  }

  const getVisibleLayerIds = (): string[] => {
    const ids: string[] = []
    const walk = (nodes: LayerNode[]) => {
      for (const node of nodes) {
        ids.push(node.id)
        if (node.hasChildren && !collapsedIds.value.has(node.id)) {
          walk(node.children)
        }
      }
    }
    walk(layers.value)
    return ids
  }

  const syncSelectionFromEditor = (editor: any) => {
    const selected = editor?.getSelectedAll?.() || []
    const selectedList = Array.isArray(selected)
      ? selected
      : selected?.models || []
    const ids = selectedList
      .map((component: any) => component?.cid)
      .filter((id: unknown): id is string => typeof id === 'string' && !!id)

    const fallbackId = editor?.getSelected?.()?.cid
    if (!ids.length && fallbackId) ids.push(fallbackId)

    selectedIds.value = new Set(ids)
    selectedId.value = ids.length ? ids[ids.length - 1] : null
    if (selectedId.value) lastSelectedId = selectedId.value
  }

  const applySelectionToEditor = (ids: string[]) => {
    if (!editorInstance) return

    const models = ids
      .map((id) => modelMap.get(id))
      .filter(Boolean)

    if (!models.length) {
      editorInstance.select?.(null)
      selectedIds.value = new Set()
      selectedId.value = null
      return
    }

    editorInstance.select?.(models[0])
    models.slice(1).forEach((model) => {
      if (typeof editorInstance.selectAdd === 'function') {
        editorInstance.selectAdd(model)
      }
    })

    selectedIds.value = new Set(ids)
    selectedId.value = ids[ids.length - 1] || null
  }

  const debouncedRefresh = () => {
    if (debounceTimer) clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      refreshTree()
      debounceTimer = null
    }, 300)
  }

  // ── GrapesJS event wiring ──────────────────────────────────────────────────

  grapes.onInit((editor: any) => {
    editorInstance = editor

    editor.on('load', refreshTree)
    editor.on('page:select', refreshTree)
    editor.on('component:add', debouncedRefresh)
    editor.on('component:remove', debouncedRefresh)
    editor.on('component:update:name', debouncedRefresh)
    editor.on('component:update:custom-name', debouncedRefresh)

    _onSelected = (comp: any) => {
      syncSelectionFromEditor(editor)
      if (comp?.cid) lastSelectedId = comp.cid
    }
    _onDeselected = () => {
      syncSelectionFromEditor(editor)
    }

    editor.on('component:selected', _onSelected)
    editor.on('component:deselected', _onDeselected)

    refreshTree()
  })

  // ── Cleanup on unmount ─────────────────────────────────────────────────────

  onBeforeUnmount(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
      debounceTimer = null
    }
    if (editorInstance) {
      try {
        editorInstance.off('load', refreshTree)
        editorInstance.off('page:select', refreshTree)
        editorInstance.off('component:add', debouncedRefresh)
        editorInstance.off('component:remove', debouncedRefresh)
        editorInstance.off('component:update:name', debouncedRefresh)
        editorInstance.off('component:update:custom-name', debouncedRefresh)
        if (_onSelected) editorInstance.off('component:selected', _onSelected)
        if (_onDeselected) editorInstance.off('component:deselected', _onDeselected)
      } catch {
        // silent
      }
    }
    editorInstance = null
    _onSelected = null
    _onDeselected = null
  })

  // ── Public API ─────────────────────────────────────────────────────────────

  const selectLayer = (id: string, event?: MouseEvent) => {
    const model = modelMap.get(id)
    if (!model || !editorInstance) return

    const additive = !!(event?.metaKey || event?.ctrlKey)
    const range = !!event?.shiftKey
    const currentIds = new Set(selectedIds.value)
    const wasSelected = currentIds.has(id)
    let nextIds: string[] = [id]

    if (range && lastSelectedId) {
      const visibleIds = getVisibleLayerIds()
      const start = visibleIds.indexOf(lastSelectedId)
      const end = visibleIds.indexOf(id)
      if (start >= 0 && end >= 0) {
        const [from, to] = start <= end ? [start, end] : [end, start]
        const rangeIds = visibleIds.slice(from, to + 1)
        nextIds = additive
          ? Array.from(new Set([...currentIds, ...rangeIds]))
          : rangeIds
      }
    } else if (additive) {
      if (wasSelected) currentIds.delete(id)
      else currentIds.add(id)
      nextIds = Array.from(currentIds)
    }

    if (!additive || range || !wasSelected) {
      lastSelectedId = id
    }

    applySelectionToEditor(nextIds)
  }

  const renameLayer = (id: string, name: string) => {
    const model = modelMap.get(id)
    const nextName = name.trim()
    if (!model || !nextName) return
    if (typeof model.setName === 'function') {
      model.setName(nextName)
    } else {
      model.set?.('custom-name', nextName)
    }
    refreshTree()
  }

  const toggleVisible = (id: string) => {
    const model = modelMap.get(id)
    if (!model) return
    if (getVisible(model)) {
      model.addStyle({ display: 'none' })
    } else {
      const style = { ...(model.getStyle?.() ?? {}) }
      delete style.display
      model.setStyle(style)
    }
    refreshTree()
  }

  const toggleExpand = (id: string) => {
    const next = new Set(collapsedIds.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    collapsedIds.value = next
  }

  const moveLayer = (sourceId: string, targetId: string, position: DropTarget['position']) => {
    const source = modelMap.get(sourceId)
    const target = modelMap.get(targetId)
    if (!source || !target) return
    if (source === editorInstance?.getWrapper?.()) return
    try {
      if (position === 'inside') {
        source.move(target, { at: 0 })
      } else {
        const parent = target.parent?.()
        if (!parent) return
        const siblings: any[] = parent.components?.()?.models ?? []
        const targetIndex = siblings.indexOf(target)
        const at = position === 'before' ? targetIndex : targetIndex + 1
        source.move(parent, { at })
      }
    } catch {
      // silent
    }
    setTimeout(refreshTree, 50)
  }

  const toggleAll = (expand: boolean) => {
    if (expand) {
      collapsedIds.value = new Set()
    } else {
      const ids = new Set<string>()
      const walk = (nodes: LayerNode[]) => {
        for (const n of nodes) {
          if (n.hasChildren) {
            ids.add(n.id)
            walk(n.children)
          }
        }
      }
      walk(layers.value)
      collapsedIds.value = ids
    }
  }

  return {
    layers,
    selectedId,
    selectedIds,
    collapsedIds,
    selectLayer,
    renameLayer,
    toggleVisible,
    toggleExpand,
    moveLayer,
    toggleAll,
  }
}
