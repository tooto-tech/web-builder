import type { Editor } from 'grapesjs'

export const WB_COUNT_UP_TYPE = 'wb-count-up'

// const COUNTUP_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/countup.js/2.8.0/countUp.umd.js'
const COUNT_UP_ROOT_CLASS = 'wb-count-up'
const COUNT_UP_NUMBER_CLASS = 'wb-cu-number'
const COUNT_UP_CSS = `
  .${COUNT_UP_ROOT_CLASS} {
    display: inline-flex;
    align-items: flex-start;
    gap: 0;
  }
  .${COUNT_UP_NUMBER_CLASS} {
    font-size: 64px;
    line-height: 1;
    color: #000000;
    font-variant-numeric: tabular-nums;
  }
  @media (max-width: 1023px) {
    .${COUNT_UP_NUMBER_CLASS} {
      font-size: 60px;
    }
  }
  @media (max-width: 767px) {
    .${COUNT_UP_NUMBER_CLASS} {
      font-size: 48px;
    }
  }
`

/**
 * 注册数字滚动组件（基于 CountUp.js）
 *
 * 编辑器中展示静态终值，发布页通过 IntersectionObserver 在元素进入视口时触发动画。
 * CountUp.js 通过 CDN 按需注入，不影响编辑器性能。
 */
export function registerCountUpComponent(editor: Editor) {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_COUNT_UP_TYPE)) return

  domComponents.addType(WB_COUNT_UP_TYPE, {
    isComponent: (el: HTMLElement) =>
      el?.getAttribute?.('data-wb-component') === 'count-up'
        ? { type: WB_COUNT_UP_TYPE }
        : false,

    model: {
      defaults: {
        name: '数字滚动',
        tagName: 'div',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        classes: [COUNT_UP_ROOT_CLASS],
        styles: COUNT_UP_CSS,
        attributes: {
          'data-wb-component': 'count-up',
          'data-cu-end': '9999',
          'data-cu-start': '0',
          'data-cu-duration': '2.5',
          'data-cu-decimals': '0',
          'data-cu-prefix': '',
          'data-cu-suffix': '',
          'data-cu-separator': ',',
        },
        style: {
          display: 'inline-flex',
          'align-items': 'flex-start',
          gap: '0',
        },

        // ── Trait 对应的 model 属性 ──
        cuEnd: 9999,
        cuStart: 0,
        cuDuration: 2.5,
        cuDecimals: 0,
        cuPrefix: '',
        cuSuffix: '',
        cuSeparator: ',',

        traits: [
          {
            type: 'number',
            label: '目标数值',
            name: 'cuEnd',
            changeProp: true,
          },
          {
            type: 'number',
            label: '起始数值',
            name: 'cuStart',
            changeProp: true,
          },
          {
            type: 'number',
            label: '动画时长（秒）',
            name: 'cuDuration',
            changeProp: true,
            min: 0.1,
            max: 10,
            step: 0.1,
          },
          {
            type: 'number',
            label: '小数位数',
            name: 'cuDecimals',
            changeProp: true,
            min: 0,
            max: 6,
          },
          {
            type: 'text',
            label: '前缀',
            name: 'cuPrefix',
            changeProp: true,
            placeholder: '如: $、¥',
          },
          {
            type: 'text',
            label: '后缀',
            name: 'cuSuffix',
            changeProp: true,
            placeholder: '如: +、%、万',
          },
          {
            type: 'text',
            label: '千位分隔符',
            name: 'cuSeparator',
            changeProp: true,
            placeholder: '默认 ,（留空=不分隔）',
          },
        ],

        // ── 发布页运行时脚本 ──
        // GrapesJS 会将 script 内容原样输出到 HTML，在浏览器中执行
        script: function (this: HTMLElement) {
          const cdn = 'https://cdnjs.cloudflare.com/ajax/libs/countup.js/2.8.0/countUp.umd.js'

          const run = () => {
            const numberEl = this.querySelector('.wb-cu-number')
            if (!numberEl) return

            const end = parseFloat(this.dataset.cuEnd || '0')
            const start = parseFloat(this.dataset.cuStart || '0')
            const duration = parseFloat(this.dataset.cuDuration || '2.5')
            const decimals = parseInt(this.dataset.cuDecimals || '0', 10)
            const prefix = this.dataset.cuPrefix || ''
            const suffix = this.dataset.cuSuffix || ''
            const separator = this.dataset.cuSeparator !== undefined ? this.dataset.cuSeparator : ','

            // CountUp.js UMD 会暴露为 window.countUp.CountUp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const CountUpConstructor = (window as any).countUp?.CountUp
            if (!CountUpConstructor) {
              console.warn('[CountUp] Library not loaded')
              return
            }

            const counter = new CountUpConstructor(numberEl, end, {
              startVal: start,
              duration: duration,
              decimalPlaces: decimals,
              prefix: prefix,
              suffix: suffix,
              separator: separator,
            })

            if (!counter.error) {
              counter.start()
            }
          }

          const loadAndRun = () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if ((window as any).countUp?.CountUp) {
              run()
              return
            }
            const s = document.createElement('script')
            s.src = cdn
            s.onload = run
            s.onerror = function() { console.error('[CountUp] CDN load failed') }
            document.head.appendChild(s)
          }

          if ('IntersectionObserver' in window) {
            const io = new IntersectionObserver((entries, obs) => {
              entries.forEach(entry => {
                if (entry.isIntersecting) {
                  obs.disconnect()
                  loadAndRun()
                }
              })
            }, { threshold: 0.2 })
            io.observe(this)
          } else {
            loadAndRun()
          }
        },

        components: [],
      },

      init(this: any) {
        this._ensureBaseClasses()
        this.on(
          'change:cuEnd change:cuStart change:cuDuration change:cuDecimals change:cuPrefix change:cuSuffix change:cuSeparator',
          this._syncAll,
        )
        this._syncAll()
      },

      _ensureBaseClasses(this: any) {
        const classNames = new Set<string>()

        if (typeof this.getClasses === 'function') {
          this.getClasses().forEach((cls: any) => {
            const name = cls?.get?.('name') ?? cls?.name ?? cls?.getName?.() ?? ''
            if (name) classNames.add(String(name).trim())
          })
        }

        const attrClass = `${this.getAttributes?.()?.class ?? ''}`
        attrClass
          .split(/\s+/)
          .map((name: string) => name.trim())
          .filter(Boolean)
          .forEach((name: string) => classNames.add(name))

        classNames.add(COUNT_UP_ROOT_CLASS)
        const nextClasses = Array.from(classNames)

        this.setClass?.(nextClasses)
        this.addAttributes?.({ class: nextClasses.join(' ') })
      },

      _syncAll(this: any) {
        this._ensureBaseClasses?.()
        const end: number = this.get('cuEnd') ?? 9999
        const decimals: number = this.get('cuDecimals') ?? 0
        const prefix: string = this.get('cuPrefix') || ''
        const suffix: string = this.get('cuSuffix') || ''
        const separator: string = this.get('cuSeparator') !== undefined ? this.get('cuSeparator') : ','

        // 同步 data 属性（供发布页脚本读取）
        this.addAttributes({
          'data-cu-end': String(end),
          'data-cu-start': String(this.get('cuStart') ?? 0),
          'data-cu-duration': String(this.get('cuDuration') ?? 2.5),
          'data-cu-decimals': String(decimals),
          'data-cu-prefix': prefix,
          'data-cu-suffix': suffix,
          'data-cu-separator': separator,
        })

        // 格式化静态预览值
        const formatted = _formatPreview(end, decimals, prefix, suffix, separator)

        // 重建子组件（编辑器预览）
        const children: any[] = [
          {
            tagName: 'span',
            name: '数字文本',
            classes: [COUNT_UP_NUMBER_CLASS],
            attributes: { class: COUNT_UP_NUMBER_CLASS },
            components: [{ type: 'textnode', content: formatted }],
            selectable: true,
            editable: false,
            stylable: true,
            draggable: false,
            droppable: false,
            hoverable: true,
            copyable: false,
            removable: false,
          },
        ]

        this.components(children)
      },
    },
  })
}

/** 格式化预览数字（不依赖 CountUp.js） */
function _formatPreview(
  value: number,
  decimals: number,
  prefix: string,
  suffix: string,
  separator: string,
): string {
  let str = value.toFixed(decimals)
  if (separator) {
    const [int, dec] = str.split('.')
    const intFormatted = int.replace(/\B(?=(\d{3})+(?!\d))/g, separator)
    str = dec !== undefined ? `${intFormatted}.${dec}` : intFormatted
  }
  return `${prefix}${str}${suffix}`
}
