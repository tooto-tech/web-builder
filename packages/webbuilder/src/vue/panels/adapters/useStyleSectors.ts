import { computed, ref } from 'vue'
import type { Property, Sector } from 'grapesjs'
import type {
  WbCtrlOption,
  WbCtrlType,
  WbStyleProperty,
  WbStyleSector,
} from '../../config/wbStyleSectors.js'
import type { WbStyleManager } from '../../composables/useWbStyleManager.js'

type ProviderProperty = Property & {
  get?: (...args: any[]) => unknown
  getOptions?: () => Array<Record<string, unknown>>
  getProperties?: () => ProviderProperty[]
  getUnit?: () => string
  getUnits?: () => string[]
  getMin?: () => number
  getMax?: () => number
  getStep?: () => number
}

const readModelValue = (
  model: { get?: (...args: any[]) => unknown } | undefined,
  key: string,
): unknown => model?.get?.(key)

const toStringValue = (value: unknown, fallback = ''): string => {
  if (value == null) return fallback
  return `${value}`
}

const getPropertyName = (property: ProviderProperty): string =>
  toStringValue(
    property.getName?.()
      ?? readModelValue(property, 'property')
      ?? property.getId?.()
      ?? readModelValue(property, 'id'),
  )

const getPropertyLabel = (property: ProviderProperty, fallback: string): string =>
  toStringValue(
    property.getLabel?.({ locale: false })
      ?? readModelValue(property, 'label')
      ?? readModelValue(property, 'name'),
    fallback,
  )

const mapPropertyType = (property: ProviderProperty, propertyName: string): WbCtrlType => {
  if (propertyName === 'margin' || propertyName === 'padding' || propertyName === 'border-width') {
    return 'spacing'
  }
  if (propertyName === 'border-radius') return 'border-radius'
  if (propertyName === 'box-shadow' || propertyName === 'text-shadow') return 'shadow'
  if (propertyName === 'background-image') return 'bg-image'
  if (propertyName === 'font-family') return 'font'

  const type = toStringValue(property.getType?.() ?? readModelValue(property, 'type'), 'text')
  if (type === 'number' || type === 'integer') return 'number'
  if (type === 'color') return 'color'
  if (type === 'select') return 'select'
  if (type === 'radio' || type === 'button' || type === 'icon-radio') return 'icon-radio'
  return 'text'
}

const normalizeOptions = (property: ProviderProperty): WbCtrlOption[] | undefined => {
  const options = property.getOptions?.() ?? readModelValue(property, 'options')
  if (!Array.isArray(options)) return undefined

  return options.map(option => ({
    value: toStringValue(option.value ?? option.id),
    label: toStringValue(option.label ?? option.name ?? option.value ?? option.id),
    icon: toStringValue(option.icon ?? option.className, '') || undefined,
  }))
}

const fallbackSubProperties = (
  propertyName: string,
): Record<string, string> | undefined => {
  if (propertyName === 'padding' || propertyName === 'margin' || propertyName === 'border-width') {
    const prefix = propertyName === 'border-width' ? 'border' : propertyName
    const suffix = propertyName === 'border-width' ? '-width' : ''
    return {
      top: `${prefix}-top${suffix}`,
      right: `${prefix}-right${suffix}`,
      bottom: `${prefix}-bottom${suffix}`,
      left: `${prefix}-left${suffix}`,
    }
  }

  if (propertyName === 'border-radius') {
    return {
      tl: 'border-top-left-radius',
      tr: 'border-top-right-radius',
      br: 'border-bottom-right-radius',
      bl: 'border-bottom-left-radius',
    }
  }

  return undefined
}

const normalizeSubProperties = (
  property: ProviderProperty,
  propertyName: string,
): Record<string, string> | undefined => {
  const subProperties = property.getProperties?.() ?? []
  if (!subProperties.length) return fallbackSubProperties(propertyName)

  const result: Record<string, string> = {}
  subProperties.forEach((subProperty) => {
    const name = getPropertyName(subProperty)
    if (name.endsWith('-top')) result.top = name
    if (name.endsWith('-right')) result.right = name
    if (name.endsWith('-bottom')) result.bottom = name
    if (name.endsWith('-left')) result.left = name
    if (name.endsWith('-top-left-radius')) result.tl = name
    if (name.endsWith('-top-right-radius')) result.tr = name
    if (name.endsWith('-bottom-right-radius')) result.br = name
    if (name.endsWith('-bottom-left-radius')) result.bl = name
  })

  return Object.keys(result).length ? result : fallbackSubProperties(propertyName)
}

export const normalizeStyleProperty = (
  property: ProviderProperty,
): WbStyleProperty => {
  const id = getPropertyName(property)
  const type = mapPropertyType(property, id)

  return {
    id,
    label: getPropertyLabel(property, id),
    type,
    default: toStringValue(property.getDefaultValue?.() ?? readModelValue(property, 'defaults')),
    options: normalizeOptions(property),
    units: property.getUnits?.() ?? undefined,
    min: property.getMin?.(),
    max: property.getMax?.(),
    step: property.getStep?.(),
    subProperties: type === 'spacing' || type === 'border-radius'
      ? normalizeSubProperties(property, id)
      : undefined,
  }
}

export const normalizeStyleSectors = (
  sectors: Sector[],
): WbStyleSector[] =>
  sectors.map((sector) => {
    const id = toStringValue(sector.getId?.() ?? readModelValue(sector, 'id'))

    return {
      id,
      label: toStringValue(sector.getName?.() ?? readModelValue(sector, 'name'), id),
      defaultOpen: sector.isOpen?.() ?? Boolean(readModelValue(sector, 'open')),
      properties: (sector.getProperties?.() ?? []).map(property =>
        normalizeStyleProperty(property as ProviderProperty)
      ),
    }
  })

const flattenProperties = (sectors: Sector[]): Map<string, ProviderProperty> => {
  const properties = new Map<string, ProviderProperty>()

  sectors.forEach((sector) => {
    sector.getProperties?.().forEach((property) => {
      const providerProperty = property as ProviderProperty
      properties.set(getPropertyName(providerProperty), providerProperty)
      providerProperty.getProperties?.().forEach((subProperty) => {
        properties.set(getPropertyName(subProperty), subProperty)
      })
    })
  })

  return properties
}

const readPropertyValue = (property: ProviderProperty | undefined): string => {
  if (!property) return ''
  return toStringValue(property.getValue?.({ noDefault: true }) ?? readModelValue(property, 'value'))
}

export const createProviderStyleManager = (
  sectors: Sector[],
): WbStyleManager => {
  const providerProperties = computed(() => flattenProperties(sectors))
  const selectedComponent = ref<unknown>(null)
  const styleMode = ref<'component' | 'selector'>('selector')
  const selectedClasses = ref<string[]>([])

  const getProviderProperty = (property: string) =>
    providerProperties.value.get(property)

  const currentStyles = computed<Record<string, string>>(() => {
    const styles: Record<string, string> = {}
    providerProperties.value.forEach((property, id) => {
      const value = readPropertyValue(property)
      if (value) styles[id] = value
    })
    return styles
  })

  return {
    hasSelection: computed(() => sectors.length > 0),
    selectedComponent,
    currentStyles,
    styleMode,
    setStyleMode(mode) {
      styleMode.value = mode
    },
    currentSelector: computed(() => ''),
    availableClasses: computed(() => []),
    selectedClasses,
    selectedTargetType: computed(() => selectedClasses.value.length > 0 ? 'class' : 'id'),
    canSelectClasses: computed(() => false),
    selectIdTarget: () => {
      selectedClasses.value = []
    },
    toggleClassTarget: () => undefined,
    cssText: computed(() => ''),
    setCssFromText: () => undefined,
    getValue(property) {
      return readPropertyValue(getProviderProperty(property))
    },
    setValue(property, value) {
      getProviderProperty(property)?.upValue?.(value)
    },
    setValues(styles) {
      Object.entries(styles).forEach(([property, value]) => {
        if (value) {
          getProviderProperty(property)?.upValue?.(value)
          return
        }
        getProviderProperty(property)?.clear?.()
      })
    },
    clearValue(property) {
      getProviderProperty(property)?.clear?.()
    },
  }
}
