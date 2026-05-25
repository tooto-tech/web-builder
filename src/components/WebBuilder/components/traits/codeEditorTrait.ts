import loader from '@monaco-editor/loader'
import type { Editor } from 'grapesjs'

type MonacoLoader = typeof loader

export interface CodeEditorTraitRuntime {
  monacoLoader?: MonacoLoader
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

export function registerCodeEditorTrait(editor: Editor, runtime: CodeEditorTraitRuntime = {}) {
  const tm = editor.TraitManager
  if (!tm || tm.getType('code-editor')) return
  const monacoLoader = runtime.monacoLoader ?? loader

  tm.addType('code-editor', {
    createInput() {
      const el = document.createElement('div')

      el.className = 'wb-trait-code-editor'
      el.style.cssText = 'width:100%;'
      el.innerHTML = `
        <div class="wb-code-editor-shell" style="display:flex;flex-direction:column;gap:8px;">
          <div class="wb-code-editor-toolbar" style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <div class="wb-code-editor-meta" style="font-size:12px;color:#6b7280;">Code Editor</div>
            <button type="button" class="wb-code-editor-open" style="padding:6px 12px;border:1px solid #dcdfe6;border-radius:8px;background:#fff;color:#111827;font-size:12px;font-weight:600;cursor:pointer;">编辑代码</button>
          </div>
          <div class="wb-code-editor-summary" style="padding:10px 12px;border:1px solid #dcdfe6;border-radius:10px;background:#f9fafb;color:#4b5563;font-size:12px;line-height:1.6;white-space:pre-wrap;word-break:break-word;">暂无代码</div>
        </div>
      `
      return el
    },
    onUpdate({ elInput, component, trait }: any) {
      const value = readTraitValue(component, trait) || ''
      const language = `${trait?.get?.('language') ?? trait?.attributes?.language ?? 'html'}`.trim() || 'html'
      const toolbarMeta = elInput.querySelector('.wb-code-editor-meta') as HTMLElement | null
      const openBtn = elInput.querySelector('.wb-code-editor-open') as HTMLButtonElement | null
      const summary = elInput.querySelector('.wb-code-editor-summary') as HTMLElement | null
      const traitState = ((elInput as any).__wbCodeEditorState ??= {})

      if (toolbarMeta) {
        toolbarMeta.textContent = `Language: ${language.toUpperCase()}`
      }

      if (summary) {
        const trimmed = `${value}`.trim()
        if (!trimmed) {
          summary.textContent = '暂无代码'
        } else {
          const lines = trimmed.split('\n')
          const preview = lines.slice(0, 8).join('\n')
          summary.textContent = lines.length > 8 ? `${preview}\n...` : preview
        }
      }

      if (openBtn && !traitState.openBound) {
        traitState.openBound = true
        openBtn.onclick = async () => {
          if (traitState.overlay) {
            traitState.overlay.style.display = 'flex'
            traitState.editor?.layout?.()
            return
          }

          const overlay = document.createElement('div')
          overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(15,23,42,0.45);display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;'

          const dialog = document.createElement('div')
          dialog.style.cssText = 'width:min(1100px, 96vw);height:min(760px, 92vh);background:#fff;border-radius:16px;box-shadow:0 20px 50px rgba(15,23,42,0.25);display:flex;flex-direction:column;overflow:hidden;'
          dialog.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #e5e7eb;">
              <div>
                <div style="font-size:14px;font-weight:700;color:#111827;">编辑代码</div>
                <div style="font-size:12px;color:#6b7280;margin-top:2px;">Language: ${language.toUpperCase()}</div>
              </div>
              <div style="display:flex;align-items:center;gap:8px;">
                <button type="button" class="wb-code-dialog-cancel" style="padding:8px 14px;border:1px solid #d1d5db;border-radius:10px;background:#fff;color:#374151;font-size:12px;cursor:pointer;">取消</button>
                <button type="button" class="wb-code-dialog-save" style="padding:8px 14px;border:0;border-radius:10px;background:#2251ff;color:#fff;font-size:12px;font-weight:600;cursor:pointer;">保存</button>
              </div>
            </div>
            <div class="wb-code-dialog-editor" style="flex:1;min-height:0;"></div>
          `

          overlay.appendChild(dialog)
          document.body.appendChild(overlay)

          const close = () => {
            overlay.style.display = 'none'
          }

          overlay.addEventListener('click', (event) => {
            if (event.target === overlay) close()
          })

          const cancelBtn = dialog.querySelector('.wb-code-dialog-cancel') as HTMLButtonElement | null
          const saveBtn = dialog.querySelector('.wb-code-dialog-save') as HTMLButtonElement | null
          const editorHost = dialog.querySelector('.wb-code-dialog-editor') as HTMLElement | null

          let draftValue = readTraitValue(component, trait) || ''

          const mountFallback = () => {
            if (!editorHost) return
            editorHost.innerHTML = ''
            const textarea = document.createElement('textarea')
            textarea.value = draftValue
            textarea.spellcheck = false
            textarea.style.cssText = 'display:block;width:100%;height:100%;padding:16px;border:0;outline:none;resize:none;box-sizing:border-box;font-size:13px;line-height:1.7;font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;'
            textarea.oninput = () => {
              draftValue = textarea.value
            }
            editorHost.appendChild(textarea)
            textarea.focus()
          }

          try {
            const monaco = await monacoLoader.init()
            if (!editorHost) return
            const editorInstance = monaco.editor.create(editorHost, {
              value: draftValue,
              language,
              theme: 'vs',
              automaticLayout: true,
              minimap: { enabled: false },
              scrollBeyondLastLine: false,
              wordWrap: 'on',
              fontSize: 13,
              lineHeight: 20,
              lineNumbers: 'on',
              glyphMargin: false,
              tabSize: 2,
            })

            traitState.editor = editorInstance
            traitState.overlay = overlay
            editorInstance.onDidChangeModelContent(() => {
              draftValue = editorInstance.getValue()
            })

            cancelBtn && (cancelBtn.onclick = close)
            saveBtn && (saveBtn.onclick = () => {
              writeTraitValue(component, trait, draftValue)
              close()
            })
          } catch {
            traitState.overlay = overlay
            mountFallback()
            cancelBtn && (cancelBtn.onclick = close)
            saveBtn && (saveBtn.onclick = () => {
              writeTraitValue(component, trait, draftValue)
              close()
            })
          }
        }
      }
    },
  })
}
