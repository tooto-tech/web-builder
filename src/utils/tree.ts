import { callUtilsAdapter, getOptionalAdapterMethod } from '@/runtime'

export const defaultProps = {
  id: 'id',
  children: 'children',
  pid: 'parentId'
}

export const handleTree = (
  data: any[],
  id = defaultProps.id,
  parentId = defaultProps.pid,
  children = defaultProps.children
) => {
  const adapterMethod = getOptionalAdapterMethod(['utils', 'tree'], 'handleTree')
  if (adapterMethod) return adapterMethod(data, id, parentId, children)

  const config = { id, parentId, children }
  const childrenListMap: Record<string, any[]> = {}
  const nodeIds: Record<string, any> = {}
  const tree: any[] = []

  for (const item of data || []) {
    const parentKey = item?.[config.parentId]
    const nodeKey = item?.[config.id]
    childrenListMap[parentKey] = childrenListMap[parentKey] || []
    nodeIds[nodeKey] = item
    childrenListMap[parentKey].push(item)
  }

  for (const item of data || []) {
    const parentKey = item?.[config.parentId]
    if (!nodeIds[parentKey]) {
      tree.push(item)
    }
  }

  for (const item of data || []) {
    const nodeKey = item?.[config.id]
    item[config.children] = childrenListMap[nodeKey] || []
  }

  return tree
}

export const listToTree = <T = any>(list: any[]): T[] => handleTree(list) as T[]
export const treeToList = <T = any>(tree: any): T => tree as T
export const findNode = <T = any>(): T | null => null
export const findNodeAll = <T = any>(): T[] => []
export const findPath = <T = any>(): T[] => []
export const findPathAll = () => []
export const filter = <T = any>(tree: T[]): T[] => tree
export const forEach = <T = any>(tree: T[]): T[] => tree
export const treeMap = <T = any>(tree: T[]): T[] => tree
export const treeMapEach = (tree: any) => tree
export const eachTree = (treeDatas: any[], callBack: Function, parentNode = {}) => {
  treeDatas.forEach((node) => {
    callBack(node, parentNode)
    if (Array.isArray(node.children)) eachTree(node.children, callBack, node)
  })
}
export const handleTree2 = (data: any[], id: string, parentId: string, children: string) =>
  handleTree(data, id, parentId, children)
export const checkSelectedNode = () => false
export const treeToString = () => ''
export const callTreeAdapter = <T = unknown>(method: string, ...args: any[]): T =>
  callUtilsAdapter<T>('tree', method, ...args)
