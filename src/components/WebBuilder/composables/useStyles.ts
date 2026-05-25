import { markRaw, shallowReactive } from 'vue'

const toModelList = (input: any): any[] => {
  if (Array.isArray(input)) return input
  if (Array.isArray(input?.models)) return input.models
  return []
}

/**
 * The CSS Manager contains the lifecycle functions and reactive representations of the CSS Rules.
 * @typedef CssManager
 * @memberof module:useStyles
 * @inner
 * @property {Object[]} cssRules A reactive list of all the
 * [CSS rules]{@link https://grapesjs.com/docs/api/css_rule.html#cssrule} as defined in GrapesJS.
 * @property {Object} selected.rule A reactive representation of the selected
 * [CSS rule]{@link https://grapesjs.com/docs/api/css_rule.html#cssrule}.
 * @property {String} selected.selector The css selector that identifies the selected rule.
 * @property {Function} addRules
 * [Add a CSS rule]{@link https://grapesjs.com/docs/api/css_composer.html#addrules} via CSS string
 * @property {Function} setRule
 * [Add/update the CssRule]{@link https://grapesjs.com/docs/api/css_composer.html#setrule}
 * @property {Function} remove [Remove rule]{@link https://grapesjs.com/docs/api/css_composer.html#remove},
 * by CssRule or matching selector
 * @property {Function} clear [Remove all rules]{@link https://grapesjs.com/docs/api/css_composer.html#clear}
 */

/**
 * Fetch and, if necessary, initiate the CSS manager.
 * @exports useStyles
 * @param {VGCconfig} grapes As provided by useGrapes
 * @returns {module:useStyles~CssManager}
 */
export default function useStyles(grapes: any) {
  if (!grapes._cache.styles) {
    if (!grapes.config.selectorManager) grapes.config.selectorManager = {}
    grapes.config.selectorManager.custom = true

    const cm = (grapes._cache.styles = shallowReactive({
      cssRules: [] as any[],
      selected: {
        rule: null as any,
        selector: '',
      },
      addRules: () => {},
      setRule: () => {},
      remove: () => {},
      clear: () => {},
    }))

    grapes.onInit((editor: any) => {
      cm.addRules = editor.Css.addRules.bind(editor.Css)
      cm.setRule = editor.Css.setRule.bind(editor.Css)
      cm.remove = editor.Css.remove.bind(editor.Css)
      cm.clear = editor.Css.clear.bind(editor.Css)

      function bindRuleStyle(rule: any) {
        return new Proxy(
          {},
          {
            get: (_target: any, style: string) => rule?.getStyle?.(style),
            set: (_target: any, style: string, val: any) => {
              const styles = rule.getStyle()
              rule.setStyle({ ...styles, [style]: val })
              return true
            },
          }
        )
      }

      const toRuleRecord = (rule: any) => {
        if (!rule) return null
        const rawRule = markRaw(rule)
        return markRaw({
          _model: rawRule,
          cid: rawRule.cid,
          selectorsToString: rawRule.selectorsToString?.bind(rawRule),
          getStyle: rawRule.getStyle?.bind(rawRule),
          setStyle: rawRule.setStyle?.bind(rawRule),
          remove: rawRule.remove?.bind(rawRule),
          style: bindRuleStyle(rawRule),
        })
      }

      const refreshRules = () => {
        const rules = toModelList(editor.Css.getAll?.())
        cm.cssRules = rules
          .map((rule: any) => toRuleRecord(rule))
          .filter(Boolean) as any[]
      }

      function updateSelected() {
        const selected = editor.getSelectedToStyle()
        const currentSelected = cm.selected.rule?._model ?? cm.selected.rule
        if (selected !== currentSelected) {
          if (selected) {
            cm.selected.rule = toRuleRecord(selected)
            cm.selected.selector = selected.selectorsToString()
          } else {
            cm.selected.rule = null
            cm.selected.selector = ''
          }
        } else if (selected) {
          cm.selected.selector = selected.selectorsToString()
        } else {
          cm.selected.selector = ''
        }
      }

      refreshRules()
      updateSelected()

      editor.on('selector:custom', updateSelected)
      editor.on('styleable:change', updateSelected)
      editor.on('css:rule:add', refreshRules)
      editor.on('css:rule:remove', refreshRules)
      editor.on('destroy', () => {
        editor.off('selector:custom', updateSelected)
        editor.off('styleable:change', updateSelected)
        editor.off('css:rule:add', refreshRules)
        editor.off('css:rule:remove', refreshRules)
      })
    })
  }

  return grapes._cache.styles
}
