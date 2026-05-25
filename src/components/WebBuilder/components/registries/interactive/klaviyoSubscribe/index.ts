/**
 * Klaviyo 订阅表单组件（Klaviyo Subscribe Form）
 *
 * 用途：
 *   在网站任意位置嵌入一个 Klaviyo Client API 订阅表单，
 *   用户输入邮箱后直接提交到 Klaviyo，不经过业务后端。
 *
 * 设计要点：
 *   1. 订阅列表（List ID）与租户公开 API Key（Company ID / Site ID）
 *      通过 trait 面板选择，编辑时写入根元素 data-klaviyo-* 属性，
 *      发布后的静态页面可独立运行。
 *   2. Company ID 首次使用时自动从 `/content/klaviyo-config/get` 拉取，
 *      无需用户手动填写。用户仍可在 trait 面板手动覆盖。
 *   3. 表单根节点用 <form> 标签，带 onsubmit="return false;"，
 *      避免浏览器默认提交行为；运行时通过 fetch 调用
 *      `https://a.klaviyo.com/client/subscriptions/?company_id=<companyId>`。
 *   4. 子元素（输入框 / 提交按钮 / 状态文本）是 selectable + stylable 的，
 *      可在 StyleManager 里自由调整颜色、间距、字号等；
 *      只是被锁定为不可拖拽 / 不可删除，避免破坏逻辑结构。
 *   5. 提交逻辑与后台 `/cms/klaviyo/klaviyo-subscribe` 页面生成的代码保持一致。
 *
 * 运行时输出示意：
 * ```html
 * <form class="wb-klaviyo-subscribe"
 *       data-wb-component="klaviyo-subscribe"
 *       data-klaviyo-company-id="S2caqd"
 *       data-klaviyo-list-id="QZdk9k"
 *       onsubmit="return false;">
 *   <input class="wb-klaviyo-subscribe__email" type="email" placeholder="Enter your email" required />
 *   <button class="wb-klaviyo-subscribe__submit" type="button">Subscribe</button>
 *   <div class="wb-klaviyo-subscribe__status" aria-live="polite"></div>
 * </form>
 * ```
 */

import type { Editor } from 'grapesjs'
import {
  makeTextTrait,
} from '@/components/WebBuilder/utils/traitFactory'
import { getKlaviyoConfig, getKlaviyoLists } from '@/api/content/klaviyo'

const TYPE_KLAVIYO_SUBSCRIBE = 'wb-klaviyo-subscribe'
export const WB_KLAVIYO_SUBSCRIBE_TYPE = TYPE_KLAVIYO_SUBSCRIBE

/**
 * 子元素保持锁定：不可拖拽 / 不可删除 / 不可复制，
 * 但保持 selectable + layerable + stylable，
 * 以便用户在 Layers 面板查看并在 StyleManager 中直接调整颜色、间距、字号等。
 */
const CHILD_LOCK_BUT_STYLABLE = {
  draggable: false,
  droppable: false,
  removable: false,
  copyable: false,
  badgable: false,
  // selectable / layerable / hoverable / highlightable 保持 GrapesJS 默认 true
} as const

// ─────────────────────────────────────────────────────────────
// Klaviyo 列表 / Config 获取（editor 级缓存，避免重复请求）
// ─────────────────────────────────────────────────────────────

interface KlaviyoListOption {
  value: string
  label: string
  name: string
}

function getKlaviyoListOptions(
  editor: Editor,
  force = false,
): Promise<KlaviyoListOption[]> {
  const state = editor as Editor & {
    __wbKlaviyoListOptions?: KlaviyoListOption[]
    __wbKlaviyoListOptionsPromise?: Promise<KlaviyoListOption[]>
  }

  if (!force && Array.isArray(state.__wbKlaviyoListOptions)) {
    return Promise.resolve(state.__wbKlaviyoListOptions)
  }
  if (!force && state.__wbKlaviyoListOptionsPromise) {
    return state.__wbKlaviyoListOptionsPromise
  }

  const promise = getKlaviyoLists()
    .then((data: any): KlaviyoListOption[] => {
      const list = Array.isArray(data) ? data : (Array.isArray(data?.list) ? data.list : [])
      const options: KlaviyoListOption[] = list
        .map((item: any): KlaviyoListOption | null => {
          const id = `${item?.listId ?? ''}`.trim()
          if (!id) return null
          const name = `${item?.name ?? '未命名列表'}`
          const profileCount = Number(item?.profileCount ?? 0)
          return {
            value: id,
            name,
            label: profileCount > 0 ? `${name} (${profileCount})` : name,
          }
        })
        .filter((item: KlaviyoListOption | null): item is KlaviyoListOption => item !== null)

      state.__wbKlaviyoListOptions = options
      return options
    })
    .catch((error): KlaviyoListOption[] => {
      console.error('[WebBuilder] Failed to load Klaviyo lists', error)
      state.__wbKlaviyoListOptions = []
      return []
    })
    .finally(() => {
      state.__wbKlaviyoListOptionsPromise = undefined
    })

  state.__wbKlaviyoListOptionsPromise = promise
  return promise
}

function getKlaviyoCompanyId(editor: Editor): Promise<string> {
  const state = editor as Editor & {
    __wbKlaviyoCompanyId?: string
    __wbKlaviyoCompanyIdPromise?: Promise<string>
  }

  if (typeof state.__wbKlaviyoCompanyId === 'string') {
    return Promise.resolve(state.__wbKlaviyoCompanyId)
  }
  if (state.__wbKlaviyoCompanyIdPromise) {
    return state.__wbKlaviyoCompanyIdPromise
  }

  const promise = getKlaviyoConfig()
    .then((config: any) => {
      const publicApiKey = `${config?.publicApiKey ?? ''}`.trim()
      state.__wbKlaviyoCompanyId = publicApiKey
      return publicApiKey
    })
    .catch((error) => {
      console.warn('[WebBuilder] Failed to load Klaviyo config', error)
      state.__wbKlaviyoCompanyId = ''
      return ''
    })
    .finally(() => {
      state.__wbKlaviyoCompanyIdPromise = undefined
    })

  state.__wbKlaviyoCompanyIdPromise = promise
  return promise
}

/**
 * 为组件动态填充 "订阅列表" 下拉选项。
 * 参考 `faqSection` / `previewProductTrait` 的做法，
 * 使用 GrapesJS 内置 `select` trait + 运行时 `trait.set('options', ...)`。
 */
async function initKlaviyoListTrait(editor: Editor, model: any): Promise<void> {
  const trait = model.getTrait?.('klaviyoListId')
  if (!trait) return

  const currentValue = `${model.get?.('klaviyoListId') ?? ''}`.trim()
  const savedName = `${model.get?.('klaviyoListName') ?? ''}`.trim()

  const options = await getKlaviyoListOptions(editor)

  const traitOptions: Array<{ value: string; label: string }> = [
    { value: '', label: '请选择订阅列表' },
    ...options.map(o => ({ value: o.value, label: o.label })),
  ]

  // 如果当前保存的 listId 在拉取到的列表中找不到，追加一个占位选项，避免显示为空
  if (currentValue && !options.some(o => o.value === currentValue)) {
    traitOptions.push({
      value: currentValue,
      label: savedName ? `${savedName} (未匹配)` : `当前列表 (${currentValue})`,
    })
  }

  trait.set('options', traitOptions)
}

const BLOCK_ICON = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1B160C" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>`

// ─────────────────────────────────────────────────────────────
// 默认文案 & 默认样式
// ─────────────────────────────────────────────────────────────

const DEFAULT_PLACEHOLDER = 'Enter your email'
const DEFAULT_BUTTON_TEXT = 'Subscribe'
const DEFAULT_LOADING_TEXT = 'Subscribing...'
const DEFAULT_SUCCESS_MSG = 'Subscribed successfully!'
const DEFAULT_ERROR_MSG = 'Subscription failed, please try again.'

const DEFAULT_STYLES = `
  .wb-klaviyo-subscribe {
    display: inline-flex;
    gap: 8px;
    align-items: center;
    box-sizing: border-box;
    flex-wrap: wrap;
  }
  .wb-klaviyo-subscribe__email {
    padding: 8px 12px;
    border: 1px solid #ccc;
    border-radius: 4px;
    font-size: 14px;
    width: 250px;
    box-sizing: border-box;
    background: #fff;
    color: #111827;
    outline: none;
    transition: border-color 0.18s ease, box-shadow 0.18s ease;
  }
  .wb-klaviyo-subscribe__email:focus {
    border-color: #111827;
    box-shadow: 0 0 0 2px rgba(17, 24, 39, 0.08);
  }
  .wb-klaviyo-subscribe__email::placeholder {
    color: #9ca3af;
    opacity: 1;
  }
  .wb-klaviyo-subscribe__submit {
    padding: 8px 20px;
    background: #000;
    color: #fff;
    border: none;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    line-height: 1.2;
    transition: background-color 0.18s ease, opacity 0.18s ease;
  }
  .wb-klaviyo-subscribe__submit:hover {
    background: #1f2937;
  }
  .wb-klaviyo-subscribe__submit[disabled] {
    cursor: wait;
    opacity: 0.7;
  }
  .wb-klaviyo-subscribe__status {
    flex-basis: 100%;
    margin-top: 8px;
    font-size: 13px;
    line-height: 1.4;
    min-height: 1em;
  }
  .wb-klaviyo-subscribe__status[data-status="success"] {
    color: #067647;
  }
  .wb-klaviyo-subscribe__status[data-status="error"] {
    color: #b42318;
  }
  .wb-klaviyo-subscribe__status[data-status="warning"] {
    color: #b54708;
  }
  @media (max-width: 639px) {
    .wb-klaviyo-subscribe {
      display: flex;
      width: 100%;
    }
    .wb-klaviyo-subscribe__email {
      width: 100%;
      flex: 1;
      min-width: 0;
    }
  }
`

// ─────────────────────────────────────────────────────────────
// 构建子组件
// ─────────────────────────────────────────────────────────────

function buildChildren(options: {
  placeholder: string
  buttonText: string
}) {
  return [
    {
      tagName: 'input',
      name: '邮箱输入框',
      classes: ['wb-klaviyo-subscribe__email'],
      ...CHILD_LOCK_BUT_STYLABLE,
      attributes: {
        type: 'email',
        name: 'email',
        placeholder: options.placeholder,
        required: 'required',
        autocomplete: 'email',
      },
    },
    {
      tagName: 'button',
      name: '订阅按钮',
      classes: ['wb-klaviyo-subscribe__submit'],
      ...CHILD_LOCK_BUT_STYLABLE,
      attributes: {
        type: 'button',
      },
      components: options.buttonText,
      // 按钮文字允许用户通过双击直接编辑
      editable: true,
    },
    {
      tagName: 'div',
      name: '状态提示',
      classes: ['wb-klaviyo-subscribe__status'],
      ...CHILD_LOCK_BUT_STYLABLE,
      attributes: {
        'aria-live': 'polite',
      },
      components: '',
    },
  ]
}

// ─────────────────────────────────────────────────────────────
// 运行时脚本：完全保留原始 Klaviyo Client API 调用逻辑
// 只是改成通过 data-* 读取配置 + addEventListener 绑定点击
// ─────────────────────────────────────────────────────────────

const subscribeScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbKlaviyoInit?: boolean }
  if (root.__wbKlaviyoInit) return
  root.__wbKlaviyoInit = true

  // 编辑器 canvas 在 iframe 里，不拦截，方便选中 / 调整样式
  if (window.parent !== window) return

  const emailInput = root.querySelector('.wb-klaviyo-subscribe__email') as HTMLInputElement | null
  const submitBtn = root.querySelector('.wb-klaviyo-subscribe__submit') as HTMLButtonElement | null
  const statusEl = root.querySelector('.wb-klaviyo-subscribe__status') as HTMLElement | null
  if (!emailInput || !submitBtn) return

  const ATTR = {
    company: 'data-klaviyo-company-id',
    list: 'data-klaviyo-list-id',
    loading: 'data-klaviyo-loading-text',
    success: 'data-klaviyo-success-msg',
    error: 'data-klaviyo-error-msg',
  }

  const DEFAULTS = {
    loading: 'Subscribing...',
    success: 'Subscribed successfully!',
    error: 'Subscription failed, please try again.',
  }

  const originalLabel = (submitBtn.textContent || '').trim() || 'Subscribe'

  function readAttr(name: string, fallback: string) {
    const value = (root.getAttribute(name) || '').trim()
    return value || fallback
  }

  function setStatus(text: string, status: string) {
    if (!statusEl) return
    statusEl.textContent = text || ''
    if (status) {
      statusEl.setAttribute('data-status', status)
    } else {
      statusEl.removeAttribute('data-status')
    }
  }

  function setSubmitting(submitting: boolean) {
    submitBtn!.disabled = submitting
    submitBtn!.setAttribute('aria-busy', submitting ? 'true' : 'false')
    submitBtn!.textContent = submitting ? readAttr(ATTR.loading, DEFAULTS.loading) : originalLabel
  }

  function handleSubscribe() {
    const email = (emailInput!.value || '').trim()
    if (!email) {
      emailInput!.focus()
      return
    }
    if (typeof emailInput!.checkValidity === 'function' && !emailInput!.checkValidity()) {
      emailInput!.reportValidity?.()
      return
    }

    const companyId = (root.getAttribute(ATTR.company) || '').trim()
    const listId = (root.getAttribute(ATTR.list) || '').trim()
    if (!companyId || !listId) {
      setStatus('Klaviyo is not configured. Please set the company ID and list ID.', 'error')
      return
    }

    setStatus('', '')
    setSubmitting(true)

    fetch('https://a.klaviyo.com/client/subscriptions/?company_id=' + encodeURIComponent(companyId), {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        revision: '2024-10-15',
      },
      body: JSON.stringify({
        data: {
          type: 'subscription',
          attributes: {
            profile: { data: { type: 'profile', attributes: { email: email } } },
          },
          relationships: {
            list: { data: { type: 'list', id: listId } },
          },
        },
      }),
    })
      .then(function (response) {
        if (response.ok || response.status === 202) {
          setStatus(readAttr(ATTR.success, DEFAULTS.success), 'success')
          emailInput!.value = ''
        } else {
          setStatus(readAttr(ATTR.error, DEFAULTS.error), 'error')
        }
      })
      .catch(function (err) {
        setStatus('Network error: ' + (err && err.message ? err.message : 'unknown'), 'error')
      })
      .finally(function () {
        setSubmitting(false)
      })
  }

  submitBtn.addEventListener('click', function (event) {
    event.preventDefault()
    handleSubscribe()
  })

  emailInput.addEventListener('keydown', function (event) {
    if ((event as KeyboardEvent).key === 'Enter') {
      event.preventDefault()
      handleSubscribe()
    }
  })

  // 保险：如果根节点是 <form>，阻止其默认提交行为（即使没有 onsubmit 属性）
  if (root.tagName === 'FORM') {
    root.addEventListener('submit', function (event) {
      event.preventDefault()
      handleSubscribe()
    })
  }
}

// ─────────────────────────────────────────────────────────────
// 组件注册
// ─────────────────────────────────────────────────────────────

export function registerKlaviyoSubscribeComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(TYPE_KLAVIYO_SUBSCRIBE)) {
    return
  }

  domComponents.addType(TYPE_KLAVIYO_SUBSCRIBE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'klaviyo-subscribe') {
        return { type: TYPE_KLAVIYO_SUBSCRIBE }
      }
      return false
    },
    model: {
      defaults: {
        name: 'Klaviyo 订阅表单',
        tagName: 'form',
        classes: ['wb-klaviyo-subscribe'],
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        copyable: true,
        attributes: {
          'data-wb-component': 'klaviyo-subscribe',
          'data-klaviyo-company-id': '',
          'data-klaviyo-list-id': '',
          'data-klaviyo-list-name': '',
          'data-klaviyo-loading-text': DEFAULT_LOADING_TEXT,
          'data-klaviyo-success-msg': DEFAULT_SUCCESS_MSG,
          'data-klaviyo-error-msg': DEFAULT_ERROR_MSG,
          onsubmit: 'return false;',
          novalidate: 'novalidate',
        },
        // 用 changeProp 保存的业务字段
        klaviyoListId: '',
        klaviyoListName: '',
        klaviyoCompanyId: '',
        emailPlaceholder: DEFAULT_PLACEHOLDER,
        buttonText: DEFAULT_BUTTON_TEXT,
        loadingText: DEFAULT_LOADING_TEXT,
        successMessage: DEFAULT_SUCCESS_MSG,
        errorMessage: DEFAULT_ERROR_MSG,
        traits: [
          {
            type: 'select',
            label: '订阅列表',
            name: 'klaviyoListId',
            changeProp: true,
            // 初始选项只有占位符，实际选项在 init() 中通过
            // `trait.set('options', ...)` 填充（参考 heading / faqSection）
            options: [{ value: '', label: '加载中...' }],
          },
          makeTextTrait('Company ID', 'klaviyoCompanyId', {
            placeholder: '留空则使用 Klaviyo 配置中的 Public API Key',
          }),
          makeTextTrait('输入框占位符', 'emailPlaceholder', { placeholder: DEFAULT_PLACEHOLDER }),
          makeTextTrait('按钮文字', 'buttonText', { placeholder: DEFAULT_BUTTON_TEXT }),
          makeTextTrait('加载中文字', 'loadingText', { placeholder: DEFAULT_LOADING_TEXT }),
          makeTextTrait('订阅成功提示', 'successMessage', { placeholder: DEFAULT_SUCCESS_MSG }),
          makeTextTrait('订阅失败提示', 'errorMessage', { placeholder: DEFAULT_ERROR_MSG }),
        ],
        components: buildChildren({
          placeholder: DEFAULT_PLACEHOLDER,
          buttonText: DEFAULT_BUTTON_TEXT,
        }),
        styles: DEFAULT_STYLES,
        script: subscribeScript,
        'script-export': subscribeScript,
      },
      init(this: any) {
        this.__wbKlaviyoSyncing = false

        // 选择 list 时，把列表名也同步写入 klaviyoListName，便于导出 HTML 保留可读性
        this.on('change:klaviyoListId', this.applyListName)
        this.on(
          'change:klaviyoListId change:klaviyoListName change:klaviyoCompanyId '
          + 'change:loadingText change:successMessage change:errorMessage',
          this.syncAttrs,
        )
        this.on('change:emailPlaceholder change:buttonText', this.rebuildChildren)

        // 初次渲染同步一次
        this.syncAttrs()

        // 异步填充订阅列表下拉选项（参考 heading/faqSection 模式）
        initKlaviyoListTrait(editor, this).catch((err) => {
          console.error('[WebBuilder] initKlaviyoListTrait failed', err)
        })

        // 异步填充 Company ID（未手动覆盖时）
        this.ensureCompanyId()
      },
      applyListName(this: any) {
        const listId = `${this.get('klaviyoListId') ?? ''}`.trim()
        if (!listId) {
          this.set('klaviyoListName', '')
          return
        }
        const state = editor as Editor & { __wbKlaviyoListOptions?: KlaviyoListOption[] }
        const matched = state.__wbKlaviyoListOptions?.find(o => o.value === listId)
        if (matched) {
          this.set('klaviyoListName', matched.name)
        }
      },
      syncAttrs(this: any) {
        if (this.__wbKlaviyoSyncing) return
        this.__wbKlaviyoSyncing = true

        const listId = `${this.get('klaviyoListId') ?? ''}`.trim()
        const listName = `${this.get('klaviyoListName') ?? ''}`.trim()
        const companyId = `${this.get('klaviyoCompanyId') ?? ''}`.trim()
        const loadingText = `${this.get('loadingText') ?? ''}`.trim() || DEFAULT_LOADING_TEXT
        const successMsg = `${this.get('successMessage') ?? ''}`.trim() || DEFAULT_SUCCESS_MSG
        const errorMsg = `${this.get('errorMessage') ?? ''}`.trim() || DEFAULT_ERROR_MSG

        this.addAttributes?.({
          'data-klaviyo-list-id': listId,
          'data-klaviyo-list-name': listName,
          'data-klaviyo-company-id': companyId,
          'data-klaviyo-loading-text': loadingText,
          'data-klaviyo-success-msg': successMsg,
          'data-klaviyo-error-msg': errorMsg,
        })

        this.__wbKlaviyoSyncing = false
      },
      rebuildChildren(this: any) {
        const placeholder = `${this.get('emailPlaceholder') ?? ''}`.trim() || DEFAULT_PLACEHOLDER
        const buttonText = `${this.get('buttonText') ?? ''}`.trim() || DEFAULT_BUTTON_TEXT

        const children = this.components?.()
        if (!children) return
        const models: any[] = children.models ?? []

        const hasClass = (child: any, target: string): boolean => {
          const classes: any[] = child?.getClasses?.() ?? []
          return classes.some((c: any) =>
            (typeof c === 'string' ? c : `${c?.get?.('name') ?? c?.id ?? ''}`) === target,
          )
        }

        const emailChild = models.find(c => hasClass(c, 'wb-klaviyo-subscribe__email'))
        const submitChild = models.find(c => hasClass(c, 'wb-klaviyo-subscribe__submit'))

        if (emailChild?.addAttributes) {
          emailChild.addAttributes({ placeholder })
        }
        if (submitChild?.components) {
          submitChild.components(buttonText)
        }
      },
      async ensureCompanyId(this: any) {
        if (`${this.get('klaviyoCompanyId') ?? ''}`.trim()) return
        const publicApiKey = await getKlaviyoCompanyId(editor)
        if (publicApiKey && !`${this.get('klaviyoCompanyId') ?? ''}`.trim()) {
          this.set('klaviyoCompanyId', publicApiKey)
        }
      },
    },
  })

  editor.BlockManager.add(TYPE_KLAVIYO_SUBSCRIBE, {
    label: 'Klaviyo 订阅',
    category: 'Interactive',
    content: { type: TYPE_KLAVIYO_SUBSCRIBE },
    media: BLOCK_ICON,
  })
}
