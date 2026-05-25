import { openColorPicker } from '../../utils/traitBridge'
import type { Editor } from 'grapesjs'

export interface ColorPickerTraitRuntime {
  openColorPicker?: typeof openColorPicker
}

function readTraitValue(component: any, trait: any): string {
  const name = trait.get?.('name') || ''
  return trait.get?.('changeProp')
    ? `${component.get?.(name) ?? ''}`
    : `${component.getAttributes?.()?.[name] ?? ''}`
}

function writeTraitValue(component: any, trait: any, value: string) {
  const name = trait.get?.('name') || ''
  if (trait.get?.('changeProp')) {
    component.set?.(name, value)
  } else {
    component.addAttributes?.({ [name]: value })
  }
}

export function registerColorPickerTrait(editor: Editor, runtime: ColorPickerTraitRuntime = {}) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('color-picker')) return
  const openPicker = runtime.openColorPicker ?? openColorPicker

  tm.addType('color-picker', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-color-picker'
      el.style.cssText = 'width:100%;'
      el.innerHTML = `
        <div class="wb-cp-trigger" style="display:flex;align-items:center;gap:6px;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;cursor:pointer;background:#fff;width:100%;box-sizing:border-box;">
          <div class="wb-cp-swatch" style="width:20px;height:20px;border-radius:2px;border:1px solid #e4e7ed;background:transparent;flex-shrink:0;"></div>
          <span class="wb-cp-text" style="font-size:12px;color:#606266;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">未设置</span>
        </div>
      `
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const value = readTraitValue(component, trait)
      const swatch = elInput.querySelector('.wb-cp-swatch') as HTMLElement
      const text = elInput.querySelector('.wb-cp-text') as HTMLElement
      if (swatch) swatch.style.background = value || 'transparent'
      if (text) text.textContent = value || '未设置'

      const trigger = elInput.querySelector('.wb-cp-trigger') as HTMLElement
      if (trigger) {
        trigger.onclick = () => {
          openPicker({
            anchor: trigger,
            value: readTraitValue(component, trait),
            onChange: (v: string) => {
              writeTraitValue(component, trait, v)
              if (swatch) swatch.style.background = v || 'transparent'
              if (text) text.textContent = v || '未设置'
            },
            onClear: () => {
              writeTraitValue(component, trait, '')
              if (swatch) swatch.style.background = 'transparent'
              if (text) text.textContent = '未设置'
            },
          })
        }
      }
    },
  })
}
