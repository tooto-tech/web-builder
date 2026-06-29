import type { Editor } from 'grapesjs'

export const WB_KLAVIYO_SUBSCRIBE_TYPE = 'wb-klaviyo-subscribe'

const DEFAULT_PLACEHOLDER = 'Enter your email'
const DEFAULT_BUTTON_TEXT = 'Subscribe'
const DEFAULT_LOADING_TEXT = 'Subscribing...'
const DEFAULT_SUCCESS_MSG = 'Subscribed successfully!'
const DEFAULT_ERROR_MSG = 'Subscription failed, please try again.'

const CHILD_LOCK_BUT_STYLABLE = {
  draggable: false,
  droppable: false,
  removable: false,
  copyable: false,
  badgable: false,
} as const

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

function readAttr(model: any, name: string): string {
  return `${model.getAttributes?.()?.[name] ?? ''}`.trim()
}

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

const subscribeScript = function (this: HTMLElement) {
  const root = this as HTMLElement & { __wbKlaviyoInit?: boolean }
  if (root.__wbKlaviyoInit) return
  root.__wbKlaviyoInit = true

  if (window.parent !== window) return

  const emailInput = root.querySelector('.wb-klaviyo-subscribe__email') as HTMLInputElement | null
  const submitBtn = root.querySelector('.wb-klaviyo-subscribe__submit') as HTMLButtonElement | null
  const statusEl = root.querySelector('.wb-klaviyo-subscribe__status') as HTMLElement | null
  if (!emailInput || !submitBtn) return
  const emailEl = emailInput
  const submitEl = submitBtn

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

  const originalLabel = (submitEl.textContent || '').trim() || 'Subscribe'

  function readRootAttr(name: string, fallback: string) {
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
    submitEl.disabled = submitting
    submitEl.setAttribute('aria-busy', submitting ? 'true' : 'false')
    submitEl.textContent = submitting ? readRootAttr(ATTR.loading, DEFAULTS.loading) : originalLabel
  }

  function handleSubscribe() {
    const email = (emailEl.value || '').trim()
    if (!email) {
      emailEl.focus()
      return
    }
    if (typeof emailEl.checkValidity === 'function' && !emailEl.checkValidity()) {
      emailEl.reportValidity?.()
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
          setStatus(readRootAttr(ATTR.success, DEFAULTS.success), 'success')
          emailEl.value = ''
        } else {
          setStatus(readRootAttr(ATTR.error, DEFAULTS.error), 'error')
        }
      })
      .catch(function (err) {
        setStatus('Network error: ' + (err && err.message ? err.message : 'unknown'), 'error')
      })
      .finally(function () {
        setSubmitting(false)
      })
  }

  submitEl.addEventListener('click', function (event) {
    event.preventDefault()
    handleSubscribe()
  })

  emailEl.addEventListener('keydown', function (event) {
    if ((event as KeyboardEvent).key === 'Enter') {
      event.preventDefault()
      handleSubscribe()
    }
  })

  if (root.tagName === 'FORM') {
    root.addEventListener('submit', function (event) {
      event.preventDefault()
      handleSubscribe()
    })
  }
}

export function registerKlaviyoSubscribeComponent(editor: Editor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_KLAVIYO_SUBSCRIBE_TYPE)) return

  domComponents.addType(WB_KLAVIYO_SUBSCRIBE_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (el?.getAttribute?.('data-wb-component') === 'klaviyo-subscribe') {
        return { type: WB_KLAVIYO_SUBSCRIBE_TYPE }
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
        klaviyoListId: '',
        klaviyoListName: '',
        klaviyoCompanyId: '',
        emailPlaceholder: DEFAULT_PLACEHOLDER,
        buttonText: DEFAULT_BUTTON_TEXT,
        loadingText: DEFAULT_LOADING_TEXT,
        successMessage: DEFAULT_SUCCESS_MSG,
        errorMessage: DEFAULT_ERROR_MSG,
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
        this.on(
          'change:klaviyoListId change:klaviyoListName change:klaviyoCompanyId '
            + 'change:loadingText change:successMessage change:errorMessage',
          this.syncAttrs,
        )
        this.on('change:emailPlaceholder change:buttonText', this.rebuildChildren)
        this.syncAttrs()
      },
      syncAttrs(this: any) {
        if (this.__wbKlaviyoSyncing) return
        this.__wbKlaviyoSyncing = true

        const listId =
          `${this.get('klaviyoListId') ?? ''}`.trim() || readAttr(this, 'data-klaviyo-list-id')
        const listName =
          `${this.get('klaviyoListName') ?? ''}`.trim() || readAttr(this, 'data-klaviyo-list-name')
        const companyId =
          `${this.get('klaviyoCompanyId') ?? ''}`.trim() ||
          readAttr(this, 'data-klaviyo-company-id')
        const loadingText =
          `${this.get('loadingText') ?? ''}`.trim() ||
          readAttr(this, 'data-klaviyo-loading-text') ||
          DEFAULT_LOADING_TEXT
        const successMsg =
          `${this.get('successMessage') ?? ''}`.trim() ||
          readAttr(this, 'data-klaviyo-success-msg') ||
          DEFAULT_SUCCESS_MSG
        const errorMsg =
          `${this.get('errorMessage') ?? ''}`.trim() ||
          readAttr(this, 'data-klaviyo-error-msg') ||
          DEFAULT_ERROR_MSG

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
          return classes.some((className: any) =>
            (typeof className === 'string'
              ? className
              : `${className?.get?.('name') ?? className?.id ?? ''}`) === target,
          )
        }

        const emailChild = models.find((child) => hasClass(child, 'wb-klaviyo-subscribe__email'))
        const submitChild = models.find((child) => hasClass(child, 'wb-klaviyo-subscribe__submit'))

        emailChild?.addAttributes?.({ placeholder })
        submitChild?.components?.(buttonText)
      },
    },
  })
}
