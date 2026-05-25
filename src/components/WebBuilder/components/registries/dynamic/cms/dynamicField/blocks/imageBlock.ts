/**
 * 动态图片 block（对标 Elementor Pro 的 Featured Image）
 *
 * 输出：`<img data-cms-bind-src="post.image" data-cms-bind-alt="post.imageAlt" src="" alt="" />`
 * traits：
 *   - srcField：kind=image 的字段（必填）
 *   - altField：kind=text 的字段（可选）
 *   - placeholderSrc：字段为空时的占位图 URL，仅编辑器用
 *   - objectFit：cover / contain / fill / none
 *
 * （想让图片包一层链接时，外面单独再套一个 wb-cms-dynamic-link block 即可，
 * 保持单一职责，避免 trait 膨胀。）
 */
import { WB_CMS_DYN_IMAGE_TYPE } from '../constants'
import {
  buildTraitOptions,
  clearTraitValueIfUnavailable,
  refreshTraitOptions,
  resolveAvailableFields
} from '../helpers'
import { registerDynamicFieldBlock } from '../registerBlock'

const DEFAULT_PLACEHOLDER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="200"><rect width="100%" height="100%" fill="#e5e7eb"/><text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" fill="#6b7280" font-family="sans-serif" font-size="14">动态图片</text></svg>'
const DEFAULT_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(DEFAULT_PLACEHOLDER_SVG)}`

const OBJECT_FIT_OPTIONS = ['cover', 'contain', 'fill', 'none', 'scale-down'].map((v) => ({
  id: v,
  value: v,
  label: v
}))

export const registerDynamicImageBlock = (editor: any) => {
  registerDynamicFieldBlock(editor, {
    type: WB_CMS_DYN_IMAGE_TYPE,
    dynamicKey: 'image',
    defaults: {
      tagName: 'img',
      name: '动态图片',
      attributes: {
        src: DEFAULT_PLACEHOLDER,
        alt: '动态图片',
        style: 'max-width:100%;height:auto;display:block;object-fit:cover;'
      },
      defaultProps: {
        dynSrcField: '',
        dynAltField: '',
        dynPlaceholder: DEFAULT_PLACEHOLDER,
        dynObjectFit: 'cover'
      },
      droppable: false,
      editable: false
    },
    watchProps: ['dynSrcField', 'dynAltField', 'dynPlaceholder', 'dynObjectFit'],
    syncAttrs: (model) => {
      // 把占位 src / object-fit 同步到 DOM attributes（发布时 SSG 用 data-cms-bind-src 覆盖）
      const placeholder = String(model.get('dynPlaceholder') ?? '').trim() || DEFAULT_PLACEHOLDER
      const fit = String(model.get('dynObjectFit') ?? 'cover').trim() || 'cover'
      const style = `max-width:100%;height:auto;display:block;object-fit:${fit};`
      const existing = model.getAttributes?.() || {}
      model.setAttributes?.({
        ...existing,
        src: placeholder,
        style
      })
      return {
        'data-cms-bind-src': String(model.get('dynSrcField') ?? '').trim(),
        'data-cms-bind-alt': String(model.get('dynAltField') ?? '').trim()
      }
    },
    hydrateProps: (model) => {
      const attrs = model.getAttributes?.() || {}
      const srcField = String(attrs['data-cms-bind-src'] ?? '').trim()
      const altField = String(attrs['data-cms-bind-alt'] ?? '').trim()
      const src = String(attrs.src ?? '').trim()
      const style = String(attrs.style ?? '').trim()
      const fit = style.match(/object-fit\s*:\s*([^;]+)/i)?.[1]?.trim()
      if (srcField && !model.get('dynSrcField')) {
        model.set('dynSrcField', srcField, { silent: true })
      }
      if (altField && !model.get('dynAltField')) {
        model.set('dynAltField', altField, { silent: true })
      }
      if (src && !model.get('dynPlaceholder')) model.set('dynPlaceholder', src, { silent: true })
      if (fit && !model.get('dynObjectFit')) model.set('dynObjectFit', fit, { silent: true })
    },
    traits: [
      {
        type: 'select',
        label: '图片字段',
        name: 'dynSrcField',
        changeProp: true,
        options: [{ value: '', label: '—（请选择字段）' }]
      },
      {
        type: 'select',
        label: 'Alt 字段',
        name: 'dynAltField',
        changeProp: true,
        options: [{ value: '', label: '—（不绑定）' }]
      },
      {
        type: 'text',
        label: '占位图 URL',
        name: 'dynPlaceholder',
        changeProp: true,
        placeholder: '编辑器预览使用'
      },
      {
        type: 'select',
        label: '填充方式',
        name: 'dynObjectFit',
        changeProp: true,
        options: OBJECT_FIT_OPTIONS
      }
    ],
    refreshTraits: (model) => {
      const { fields: imageFields } = resolveAvailableFields(model, { kinds: ['image'] })
      const { fields: textFields } = resolveAvailableFields(model, { kinds: ['text'] })
      clearTraitValueIfUnavailable(model, 'dynSrcField', imageFields)
      clearTraitValueIfUnavailable(model, 'dynAltField', textFields)
      refreshTraitOptions(
        model,
        'dynSrcField',
        buildTraitOptions(imageFields, { includeEmpty: true, emptyLabel: '—（请选择字段）' })
      )
      refreshTraitOptions(
        model,
        'dynAltField',
        buildTraitOptions(textFields, { includeEmpty: true, emptyLabel: '—（不绑定）' })
      )
    },
    onFirstAdd: (model) => {
      const { fields: imageFields } = resolveAvailableFields(model, { kinds: ['image'] })
      const { fields: textFields } = resolveAvailableFields(model, { kinds: ['text'] })
      if (imageFields[0] && !model.get('dynSrcField'))
        model.set('dynSrcField', imageFields[0].value)
      // 优先选与 src 同 prefix 的 alt（post.image → post.imageAlt）
      const srcField = String(model.get('dynSrcField') ?? '')
      const guessAltFromSrc = srcField.replace(/\.image$/i, '.imageAlt')
      const matchedAlt =
        textFields.find((f) => f.value === guessAltFromSrc) ||
        textFields.find((f) => /alt$/i.test(f.value))
      if (matchedAlt && !model.get('dynAltField')) model.set('dynAltField', matchedAlt.value)
    }
  })
}
