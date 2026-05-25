import { computed } from 'vue'
import { useSelectedComponent } from './index'
import {
  getTraitLabel,
  getTraitType,
  getTraitValue as getTraitValueBase,
  setTraitValue as setTraitValueBase,
  getTraitOptions,
  isCustomTraitType,
} from '../utils/traitHelpers'

/**
 * 管理组件 traits 的 composable
 */
export default function useTraits(grapes: any) {
  const selected = useSelectedComponent(grapes)

  const componentTraits = computed(() => {
    selected.revision
    const component =
      selected.getRawComponent?.() ?? selected.component?._model ?? selected.component
    const traits = component?.get?.('traits')?.models ?? component?.traits ?? []
    return Array.isArray(traits) ? traits : []
  })

  const getCurrentComponent = () =>
    selected.getRawComponent?.() ?? selected.component?._model ?? selected.component

  const getTraitValue = (trait: any) => getTraitValueBase(trait, getCurrentComponent())

  const setTraitValue = (trait: any, value: any) =>
    setTraitValueBase(trait, value, getCurrentComponent())

  return {
    componentTraits,
    getTraitLabel,
    getTraitType,
    getTraitValue,
    setTraitValue,
    getTraitOptions,
    isCustomTraitType,
  }
}
