import { getImageManager } from '../../utils/traitBridge'
import type { Editor } from 'grapesjs'

export interface ImagePickerTraitRuntime {
  getImageManager?: typeof getImageManager
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

export function registerImagePickerTrait(editor: Editor, runtime: ImagePickerTraitRuntime = {}) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('image-picker')) return
  const getImages = runtime.getImageManager ?? getImageManager

  tm.addType('image-picker', {
    createInput() {
      const el = document.createElement('div')
      el.className = 'wb-trait-img-picker'
      el.style.cssText = 'width:100%;'
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const ui = trait.get?.('ui') || {}
      const showPreview = ui.showPreview !== false
      const value = readTraitValue(component, trait)

      const updateDisplay = (v: string) => {
        const previewImg = elInput.querySelector('.wb-img-preview-img') as HTMLImageElement
        const placeholder = elInput.querySelector('.wb-img-placeholder') as HTMLElement
        const urlInput = elInput.querySelector('.wb-img-url') as HTMLInputElement
        if (previewImg && placeholder) {
          if (v) {
            previewImg.src = v
            previewImg.style.display = 'block'
            placeholder.style.display = 'none'
          } else {
            previewImg.style.display = 'none'
            placeholder.style.display = 'flex'
          }
        }
        if (urlInput && urlInput !== document.activeElement) {
          urlInput.value = v
        }
      }

      const setValue = (v: string) => {
        writeTraitValue(component, trait, v)
        updateDisplay(v)
      }

      elInput.innerHTML = ''

      if (showPreview) {
        const preview = document.createElement('div')
        preview.className = 'wb-img-preview'
        preview.style.cssText = 'width:100%;aspect-ratio:16/9;border-radius:4px;overflow:hidden;background:#f3f4f6;display:flex;align-items:center;justify-content:center;border:1px solid #e5e7eb;margin-bottom:8px;'

        const img = document.createElement('img')
        img.className = 'wb-img-preview-img'
        img.style.cssText = `width:100%;height:100%;object-fit:contain;display:${value ? 'block' : 'none'};`
        img.alt = '预览'
        if (value) img.src = value

        const placeholder = document.createElement('div')
        placeholder.className = 'wb-img-placeholder'
        placeholder.style.cssText = `display:${value ? 'none' : 'flex'};align-items:center;justify-content:center;color:#9ca3af;font-size:12px;width:100%;height:100%;`
        placeholder.textContent = '暂无图片'

        preview.appendChild(img)
        preview.appendChild(placeholder)
        elInput.appendChild(preview)
      }

      const btnGroup = document.createElement('div')
      btnGroup.style.cssText = 'display:flex;gap:8px;margin-bottom:8px;'

      const pickBtn = document.createElement('button')
      pickBtn.type = 'button'
      pickBtn.textContent = '从素材库选择'
      pickBtn.style.cssText = 'flex:1;padding:5px 12px;border:1px solid #409eff;background:#ecf5ff;color:#409eff;border-radius:4px;cursor:pointer;font-size:12px;'
      pickBtn.onmouseenter = () => { pickBtn.style.background = '#d9ecff' }
      pickBtn.onmouseleave = () => { pickBtn.style.background = '#ecf5ff' }
      pickBtn.onclick = () => {
        const im = getImages()
        if (!im) return
        const target = {
          isStyleProp: !showPreview,
          selectCallback: (asset: any) => {
            const src = asset?.getSrc?.() ?? asset?.src ?? ''
            if (src) setValue(src)
          },
        }
        if (typeof im.openAssetsDialogWithTarget === 'function') {
          im.openAssetsDialogWithTarget(target)
        } else if (typeof im.openAssetsDialog === 'function') {
          im.openAssetsDialog(target)
        }
      }

      const clearBtn = document.createElement('button')
      clearBtn.type = 'button'
      clearBtn.textContent = '清空'
      clearBtn.style.cssText = 'padding:5px 12px;border:1px solid #dcdfe6;background:#fff;color:#606266;border-radius:4px;cursor:pointer;font-size:12px;'
      clearBtn.onmouseenter = () => { clearBtn.style.background = '#f5f7fa' }
      clearBtn.onmouseleave = () => { clearBtn.style.background = '#fff' }
      clearBtn.onclick = () => setValue('')

      btnGroup.appendChild(pickBtn)
      btnGroup.appendChild(clearBtn)
      elInput.appendChild(btnGroup)

      const urlInput = document.createElement('input')
      urlInput.type = 'text'
      urlInput.className = 'wb-img-url'
      urlInput.value = value
      urlInput.placeholder = showPreview ? 'https://' : 'https://example.com/bg.jpg'
      urlInput.style.cssText = 'width:100%;padding:4px 8px;border:1px solid #dcdfe6;border-radius:4px;font-size:12px;box-sizing:border-box;outline:none;'
      urlInput.addEventListener('input', () => setValue(urlInput.value))
      urlInput.addEventListener('focus', () => { urlInput.style.borderColor = '#409eff' })
      urlInput.addEventListener('blur', () => { urlInput.style.borderColor = '#dcdfe6' })
      elInput.appendChild(urlInput)
    },
  })
}
