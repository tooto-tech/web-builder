import type { GrapesEditor } from '../../../../../types/editor'
import { getEffectiveTenantId } from '@/utils/auth'
import { initProductCategorySelectTrait } from './categorySelectTrait'

export const WB_CMS_PRODUCT_DATASHEET_LIST_TYPE = 'wb-cms-product-datasheet-list'

const PRODUCT_DATASHEET_CSS = `
.wb-product-datasheet-list {
  width: 100%;
  max-width: 1680px;
  margin: 0 auto;
  padding: 52px 40px 72px;
  color: #0b0d12;
  font-family: inherit;
}
.wb-product-datasheet-list__title {
  margin: 0 0 28px;
  font-size: 72px;
  line-height: 0.95;
  font-weight: 800;
  letter-spacing: 0;
}
.wb-product-datasheet-list__filters {
  margin: 0 0 88px;
  padding: 30px 30px 36px;
  border-radius: 8px;
  background: #f6f6f7;
}
.wb-product-datasheet-list__filters-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
}
.wb-product-datasheet-list__filters-title {
  margin: 0;
  font-size: 22px;
  line-height: 1.2;
  font-weight: 700;
}
.wb-product-datasheet-list__reset {
  border: 0;
  padding: 0;
  background: transparent;
  color: #2855ff;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}
.wb-product-datasheet-list__filter-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 20px 16px;
  align-items: start;
}
.wb-product-datasheet-filter__control {
  position: relative;
  min-width: 0;
}
.wb-product-datasheet-filter__toggle {
  width: 100%;
  min-height: 58px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 0 24px;
  border: 1px solid #dfdfdf;
  border-radius: 8px;
  background: #fff;
  color: #111318;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  text-align: left;
  cursor: pointer;
  box-shadow: none;
}
.wb-product-datasheet-filter__control.is-active .wb-product-datasheet-filter__toggle,
.wb-product-datasheet-filter__toggle:focus {
  border-color: #2855ff;
  box-shadow: 0 0 0 1px #2855ff;
  outline: none;
}
.wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__toggle {
  border-color: #2448ea;
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  background: #2448ea;
  color: #fff;
  box-shadow: none;
}
.wb-product-datasheet-filter__value {
  color: #2855ff;
}
.wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__value {
  color: inherit;
}
.wb-product-datasheet-filter__chevron {
  width: 11px;
  height: 11px;
  flex: 0 0 auto;
  border-right: 2px solid currentColor;
  border-bottom: 2px solid currentColor;
  transform: rotate(45deg);
  margin-top: -5px;
}
.wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__chevron {
  transform: rotate(225deg);
  margin-top: 5px;
}
.wb-product-datasheet-filter__panel {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  display: none;
  z-index: 30;
  border: 1px solid #dfdfdf;
  border-top: 0;
  border-radius: 0 0 8px 8px;
  background: #fff;
  box-shadow: 0 16px 28px rgba(15, 23, 42, 0.08);
}
.wb-product-datasheet-filter__control.is-open .wb-product-datasheet-filter__panel {
  display: block;
}
.wb-product-datasheet-filter__range-fields {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  gap: 10px;
  padding: 22px 20px;
  align-items: center;
}
.wb-product-datasheet-filter__range-input {
  min-width: 0;
  position: relative;
  display: block;
}
.wb-product-datasheet-filter__range-input input {
  width: 100%;
  height: 42px;
  border: 1px solid #e2e2e2;
  border-radius: 5px;
  padding: 0 48px 0 12px;
  font: inherit;
  font-size: 16px;
  color: #20242b;
}
.wb-product-datasheet-filter__unit {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  color: #a3a3a3;
  font-size: 16px;
}
.wb-product-datasheet-filter__dash {
  color: #555;
  font-weight: 700;
}
.wb-product-datasheet-filter__actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 18px;
  padding: 18px 20px 20px;
  border-top: 1px solid #ececec;
}
.wb-product-datasheet-filter__action {
  height: 46px;
  border: 1px solid #e2e2e2;
  border-radius: 5px;
  background: #fff;
  color: #111318;
  font: inherit;
  font-size: 17px;
  font-weight: 700;
  cursor: pointer;
}
.wb-product-datasheet-filter__action--primary {
  border-color: #2448ea;
  background: #2448ea;
  color: #fff;
}
.wb-product-datasheet-filter__options {
  max-height: 268px;
  overflow: auto;
  padding: 10px 0;
}
.wb-product-datasheet-filter__option {
  min-height: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 20px;
  font-size: 16px;
  cursor: pointer;
}
.wb-product-datasheet-filter__option:hover {
  background: #f5f7ff;
}
.wb-product-datasheet-filter__option input {
  width: 16px;
  height: 16px;
  accent-color: #2448ea;
}
.wb-product-datasheet-list__summary {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 24px;
  margin-bottom: 28px;
}
.wb-product-datasheet-list__results-title {
  margin: 0 0 12px;
  font-size: 30px;
  line-height: 1.1;
  font-weight: 800;
}
.wb-product-datasheet-list__meta {
  display: flex;
  align-items: center;
  gap: 18px;
  font-size: 21px;
  line-height: 1.2;
  font-weight: 700;
}
.wb-product-datasheet-list__meta strong {
  color: #2855ff;
}
.wb-product-datasheet-list__export {
  min-width: 176px;
  height: 48px;
  border: 1px solid #d8d8d8;
  background: #fff;
  color: #111318;
  font: inherit;
  font-size: 18px;
  font-weight: 700;
  cursor: pointer;
}
.wb-product-datasheet-list__export:disabled {
  color: #aaa;
  cursor: not-allowed;
}
.wb-product-datasheet-list__table-wrap {
  width: 100%;
  overflow-x: auto;
  overflow-y: visible;
}
.wb-product-datasheet-list__table {
  --wb-datasheet-field-count: 5;
  min-width: 1180px;
}
.wb-product-datasheet-list__header,
.wb-product-datasheet-list__row {
  display: grid;
  grid-template-columns: 96px minmax(220px, 1.4fr) repeat(var(--wb-datasheet-field-count), minmax(136px, 1fr));
  align-items: center;
}
.wb-product-datasheet-list__header {
  min-height: 70px;
  background: #334eea;
  color: #fff;
  font-size: 21px;
  font-weight: 800;
}
.wb-product-datasheet-list__body {
  max-height: 642px;
  overflow-y: auto;
  scrollbar-color: #2b2f38 #e8e8ea;
  scrollbar-width: thin;
}
.wb-product-datasheet-list__body::-webkit-scrollbar {
  width: 6px;
}
.wb-product-datasheet-list__body::-webkit-scrollbar-track {
  background: #e8e8ea;
}
.wb-product-datasheet-list__body::-webkit-scrollbar-thumb {
  background: #2b2f38;
  border-radius: 999px;
}
.wb-product-datasheet-list__row {
  min-height: 70px;
  color: #4a4a4a;
  font-size: 20px;
  font-weight: 500;
}
.wb-product-datasheet-list__row:nth-child(even) {
  background: #f4f4f4;
}
.wb-product-datasheet-list__row.is-selected {
  background: #f4f7ff;
  color: #111318;
  font-weight: 800;
}
.wb-product-datasheet-list__cell {
  min-width: 0;
  padding: 0 22px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wb-product-datasheet-list__checkbox {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0;
}
.wb-product-datasheet-list__checkbox input {
  width: 24px;
  height: 24px;
  margin: 0;
  accent-color: #2448ea;
  cursor: pointer;
}
.wb-product-datasheet-list__designation-link {
  color: inherit;
  font-weight: inherit;
  text-decoration: none;
}
.wb-product-datasheet-list__row.is-selected .wb-product-datasheet-list__designation-link {
  color: #2855ff;
  text-decoration: underline;
  text-underline-offset: 3px;
}
.wb-product-datasheet-list__empty {
  padding: 42px 20px;
  color: #7a7a7a;
  font-size: 18px;
  text-align: center;
  border: 1px solid #eee;
  border-top: 0;
}
@media (max-width: 1024px) {
  .wb-product-datasheet-list {
    padding: 42px 24px 56px;
  }
  .wb-product-datasheet-list__title {
    font-size: 56px;
  }
  .wb-product-datasheet-list__filter-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
@media (max-width: 640px) {
  .wb-product-datasheet-list {
    padding: 34px 16px 48px;
  }
  .wb-product-datasheet-list__title {
    font-size: 42px;
  }
  .wb-product-datasheet-list__filters {
    margin-bottom: 56px;
    padding: 22px 16px 28px;
  }
  .wb-product-datasheet-list__filter-grid {
    grid-template-columns: minmax(0, 1fr);
  }
  .wb-product-datasheet-list__summary {
    align-items: flex-start;
    flex-direction: column;
  }
}
`

function makeProductDatasheetScript() {
  return function (this: any) {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const root = this
    if (root._wbProductDatasheetCleanup) {
      try {
        root._wbProductDatasheetCleanup()
      } catch (_) {
        // noop
      }
    }

    const rows = Array.from(
      root.querySelectorAll('[data-wb-product-datasheet-row]')
    ) as HTMLElement[]
    const controls = Array.from(
      root.querySelectorAll('[data-wb-product-datasheet-filter-control]')
    ) as HTMLElement[]
    const resetAllBtn = root.querySelector('[data-wb-product-datasheet-reset]')
    const totalEls = Array.from(
      root.querySelectorAll('[data-wb-product-datasheet-total]')
    ) as HTMLElement[]
    const selectedEls = Array.from(
      root.querySelectorAll('[data-wb-product-datasheet-selected-count]')
    ) as HTMLElement[]
    const exportBtn = root.querySelector(
      '[data-wb-product-datasheet-export]'
    ) as HTMLButtonElement | null
    const selectAll = root.querySelector(
      '[data-wb-product-datasheet-select-all]'
    ) as HTMLInputElement | null

    const parseSpecValues = function (row: HTMLElement): Record<string, any> {
      try {
        const raw = row.getAttribute('data-product-spec-values') || '{}'
        const parsed = JSON.parse(raw)
        return parsed && typeof parsed === 'object' ? parsed : {}
      } catch (_) {
        return {}
      }
    }

    const normalizeText = function (value: any): string {
      return String(value ?? '').trim()
    }

    const readSpec = function (specValues: Record<string, any>, code: string): any {
      const key = normalizeText(code)
      if (!key) return null
      const direct = specValues[key] || specValues[key.toLowerCase()] || specValues[key.toUpperCase()]
      if (direct) return direct
      const matchedKey = Object.keys(specValues).find(item => item.toLowerCase() === key.toLowerCase())
      return matchedKey ? specValues[matchedKey] : null
    }

    const readSpecText = function (spec: any): string {
      if (spec == null) return ''
      if (typeof spec === 'string' || typeof spec === 'number') return normalizeText(spec)
      return normalizeText(spec.value ?? spec.rawValue ?? spec.textValue ?? spec.numericValue ?? '')
    }

    const readSpecNumber = function (spec: any): number | null {
      const candidates = [
        spec?.numericValue,
        spec?.minValue,
        spec?.maxValue,
        spec?.value,
        spec?.rawValue,
        spec?.textValue,
        typeof spec === 'string' || typeof spec === 'number' ? spec : ''
      ]
      for (const candidate of candidates) {
        const match = normalizeText(candidate).replace(/,/g, '').match(/-?\d+(?:\.\d+)?/)
        if (!match) continue
        const numberValue = Number(match[0])
        if (Number.isFinite(numberValue)) return numberValue
      }
      return null
    }

    const getVisibleRows = function () {
      return rows.filter(row => row.style.display !== 'none')
    }

    const updateSelectionState = function () {
      const visibleRows = getVisibleRows()
      const selectedRows = visibleRows.filter((row) => {
        const input = row.querySelector(
          '[data-wb-product-datasheet-select-row]'
        ) as HTMLInputElement | null
        const checked = Boolean(input?.checked)
        row.classList.toggle('is-selected', checked)
        return checked
      })

      selectedEls.forEach(el => {
        el.textContent = String(selectedRows.length)
      })
      if (exportBtn) {
        exportBtn.disabled = selectedRows.length === 0
        exportBtn.textContent = selectedRows.length > 0 ? `Export (${selectedRows.length})` : 'Export'
      }
      if (selectAll) {
        selectAll.checked = visibleRows.length > 0 && selectedRows.length === visibleRows.length
        selectAll.indeterminate = selectedRows.length > 0 && selectedRows.length < visibleRows.length
      }
    }

    const hasActiveFilter = function (control: HTMLElement): boolean {
      const checked = control.querySelector('input[type="checkbox"]:checked')
      const min = normalizeText(
        (control.querySelector('[data-spec-filter-bound="min"]') as HTMLInputElement | null)?.value
      )
      const max = normalizeText(
        (control.querySelector('[data-spec-filter-bound="max"]') as HTMLInputElement | null)?.value
      )
      return Boolean(checked || min || max)
    }

    const updateControlSummary = function (control: HTMLElement) {
      const label = control.getAttribute('data-wb-product-datasheet-filter-label') || ''
      const summary = control.querySelector('[data-wb-product-datasheet-filter-summary]')
      const checked = Array.from(
        control.querySelectorAll('input[type="checkbox"]:checked')
      ) as HTMLInputElement[]
      const min = normalizeText(
        (control.querySelector('[data-spec-filter-bound="min"]') as HTMLInputElement | null)?.value
      )
      const max = normalizeText(
        (control.querySelector('[data-spec-filter-bound="max"]') as HTMLInputElement | null)?.value
      )
      let text = label
      if (checked.length > 0) {
        text = `${label}: ${checked.slice(0, 2).map(input => input.value).join(', ')}${
          checked.length > 2 ? ` +${checked.length - 2}` : ''
        }`
      } else if (min || max) {
        text = `${label}: ${min || 'Min'}–${max || 'Max'}`
      }
      if (summary) summary.textContent = text
      control.classList.toggle('is-active', hasActiveFilter(control))
    }

    const rowMatchesFilters = function (row: HTMLElement): boolean {
      const specValues = parseSpecValues(row)
      return controls.every((control) => {
        const code = control.getAttribute('data-spec-filter-control') || ''
        const spec = readSpec(specValues, code)
        const checked = Array.from(
          control.querySelectorAll('input[type="checkbox"]:checked')
        ) as HTMLInputElement[]
        if (checked.length > 0) {
          const currentText = readSpecText(spec).toLowerCase()
          const selected = checked.map(input => normalizeText(input.value).toLowerCase())
          if (!selected.includes(currentText)) return false
        }
        const minText = normalizeText(
          (control.querySelector('[data-spec-filter-bound="min"]') as HTMLInputElement | null)?.value
        )
        const maxText = normalizeText(
          (control.querySelector('[data-spec-filter-bound="max"]') as HTMLInputElement | null)?.value
        )
        if (minText || maxText) {
          const currentNumber = readSpecNumber(spec)
          if (currentNumber == null) return false
          const min = minText ? Number(minText) : null
          const max = maxText ? Number(maxText) : null
          if (min != null && Number.isFinite(min) && currentNumber < min) return false
          if (max != null && Number.isFinite(max) && currentNumber > max) return false
        }
        return true
      })
    }

    const applyFilters = function () {
      let visibleCount = 0
      rows.forEach((row) => {
        const matched = rowMatchesFilters(row)
        row.style.display = matched ? '' : 'none'
        if (!matched) {
          const input = row.querySelector(
            '[data-wb-product-datasheet-select-row]'
          ) as HTMLInputElement | null
          if (input) input.checked = false
        } else {
          visibleCount += 1
        }
      })
      totalEls.forEach(el => {
        el.textContent = String(visibleCount)
      })
      controls.forEach(updateControlSummary)
      updateSelectionState()
    }

    const closeControls = function (except?: HTMLElement) {
      controls.forEach((control) => {
        if (except && control === except) return
        control.classList.remove('is-open')
      })
    }

    const resetControl = function (control: HTMLElement) {
      Array.from(control.querySelectorAll('input')).forEach((input) => {
        const field = input as HTMLInputElement
        if (field.type === 'checkbox') field.checked = false
        else field.value = ''
      })
      updateControlSummary(control)
    }

    const exportSelectedRows = function () {
      const selectedRows = getVisibleRows().filter((row) => {
        const input = row.querySelector(
          '[data-wb-product-datasheet-select-row]'
        ) as HTMLInputElement | null
        return Boolean(input?.checked)
      })
      if (selectedRows.length === 0) return
      const pdfLogoUrl =
        'https://thb-1374992156.cos.ap-hongkong.myqcloud.com/20260419/logo_1776585798029.svg'
      const readCellText = function (cell: Element): string {
        const element = cell as HTMLElement
        return normalizeText(
          element.getAttribute('title') || element.innerText || element.textContent || ''
        )
      }
      const escapeHtml = function (value: string): string {
        return value
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#39;')
      }
      const headers = Array.from(
        root.querySelectorAll('[data-wb-product-datasheet-header-cell]')
      )
        .slice(1)
        .map(readCellText)
      const bodyRows = selectedRows.map((row) =>
        Array.from(row.querySelectorAll('[data-wb-product-datasheet-cell]'))
          .slice(1)
          .map(readCellText)
      )
      const columnCount = headers.length
      const landscape = columnCount > 6
      const printFrame = document.createElement('iframe')
      printFrame.setAttribute('title', 'Datasheet PDF Export')
      printFrame.style.position = 'fixed'
      printFrame.style.right = '0'
      printFrame.style.bottom = '0'
      printFrame.style.width = '0'
      printFrame.style.height = '0'
      printFrame.style.border = '0'
      printFrame.style.opacity = '0'
      document.body.appendChild(printFrame)

      const printedAt = new Date().toLocaleString()
      const headerHtml = headers.map(header => `<th>${escapeHtml(header)}</th>`).join('')
      const rowsHtml = bodyRows
        .map(
          (values) =>
            `<tr>${values.map(value => `<td>${escapeHtml(value)}</td>`).join('')}</tr>`
        )
        .join('')
      const pageSize = landscape ? 'A4 landscape' : 'A4'
      const tableLayout = landscape ? 'auto' : 'fixed'
      const fontSize = columnCount > 8 ? '9px' : columnCount > 6 ? '10px' : '11px'
      const printHtml = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Datasheet Export</title>
  <style>
    @page { size: ${pageSize}; margin: 12mm; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      color: #111827;
      font-family: Arial, Helvetica, sans-serif;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    h1 {
      margin: 0 0 6px;
      font-size: 24px;
      line-height: 1.2;
    }
    .print-header {
      display: flex;
      align-items: flex-start;
      justify-content: flex-start;
      margin: 0 0 18px;
    }
    .print-logo {
      display: block;
      width: 104px;
      max-height: 42px;
      object-fit: contain;
    }
    .meta {
      margin: 0 0 16px;
      color: #6b7280;
      font-size: 11px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: ${tableLayout};
      font-size: ${fontSize};
    }
    th,
    td {
      border: 1px solid #d1d5db;
      padding: 6px 8px;
      text-align: left;
      vertical-align: top;
      overflow-wrap: anywhere;
      word-break: break-word;
    }
    th {
      color: #fff;
      background: #2448f2;
      font-weight: 700;
    }
    tbody tr:nth-child(even) td {
      background: #f3f4f6;
    }
  </style>
</head>
<body>
  <header class="print-header">
    <img class="print-logo" src="${escapeHtml(pdfLogoUrl)}" alt="THB" data-wb-datasheet-print-logo>
  </header>
  <h1>Datasheet</h1>
  <p class="meta">Selected: ${selectedRows.length} | Exported: ${escapeHtml(printedAt)}</p>
  <table>
    <thead><tr>${headerHtml}</tr></thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`
      const printDocument = printFrame.contentDocument || printFrame.contentWindow?.document
      if (!printDocument || !printFrame.contentWindow) {
        printFrame.remove()
        return
      }
      printDocument.open()
      printDocument.write(printHtml)
      printDocument.close()
      const cleanupFrame = function () {
        window.setTimeout(() => {
          printFrame.remove()
        }, 300)
      }
      printFrame.contentWindow.onafterprint = cleanupFrame
      let didPrint = false
      const runPrint = function () {
        if (didPrint) return
        didPrint = true
        printFrame.contentWindow?.focus()
        printFrame.contentWindow?.print()
      }
      const logo = printDocument.querySelector(
        '[data-wb-datasheet-print-logo]'
      ) as HTMLImageElement | null
      if (logo && !logo.complete) {
        logo.onload = runPrint
        logo.onerror = runPrint
        window.setTimeout(runPrint, 800)
      } else {
        window.setTimeout(runPrint, 50)
      }
    }

    const listeners: Array<() => void> = []
    const addListener = function (
      target: EventTarget | null,
      event: string,
      handler: EventListenerOrEventListenerObject
    ) {
      if (!target) return
      target.addEventListener(event, handler)
      listeners.push(() => target.removeEventListener(event, handler))
    }

    controls.forEach((control) => {
      const toggle = control.querySelector('[data-wb-product-datasheet-filter-toggle]')
      addListener(toggle, 'click', (event) => {
        event.preventDefault()
        const shouldOpen = !control.classList.contains('is-open')
        closeControls(control)
        control.classList.toggle('is-open', shouldOpen)
      })
      Array.from(control.querySelectorAll('input[type="checkbox"]')).forEach((input) => {
        addListener(input, 'change', applyFilters)
      })
      Array.from(control.querySelectorAll('input[type="number"]')).forEach((input) => {
        addListener(input, 'keydown', (event) => {
          const keyboardEvent = event as KeyboardEvent
          if (keyboardEvent.key === 'Enter') applyFilters()
        })
      })
      addListener(control.querySelector('[data-wb-product-datasheet-filter-apply]'), 'click', () => {
        control.classList.remove('is-open')
        applyFilters()
      })
      addListener(control.querySelector('[data-wb-product-datasheet-filter-reset]'), 'click', () => {
        resetControl(control)
        applyFilters()
      })
      updateControlSummary(control)
    })

    rows.forEach((row) => {
      const input = row.querySelector(
        '[data-wb-product-datasheet-select-row]'
      ) as HTMLInputElement | null
      addListener(input, 'change', updateSelectionState)
    })

    addListener(selectAll, 'change', () => {
      const checked = Boolean(selectAll?.checked)
      getVisibleRows().forEach((row) => {
        const input = row.querySelector(
          '[data-wb-product-datasheet-select-row]'
        ) as HTMLInputElement | null
        if (input) input.checked = checked
      })
      updateSelectionState()
    })
    addListener(resetAllBtn, 'click', () => {
      controls.forEach(resetControl)
      closeControls()
      applyFilters()
    })
    addListener(exportBtn, 'click', exportSelectedRows)
    addListener(document, 'click', (event) => {
      if (!root.contains(event.target as Node)) closeControls()
    })

    totalEls.forEach(el => {
      el.textContent = String(rows.length)
    })
    updateSelectionState()
    root._wbProductDatasheetCleanup = function () {
      listeners.forEach(cleanup => cleanup())
    }
  }
}

const previewFilterComponents = [
  {
    tagName: 'section',
    attributes: { class: 'wb-product-filter__group' },
    components: [
      {
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-filter__control wb-product-datasheet-filter__control--select is-active',
          'data-wb-product-datasheet-filter-control': '',
          'data-wb-product-datasheet-filter-label': 'Designation',
          'data-spec-filter-control': 'designation'
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              type: 'button',
              class: 'wb-product-datasheet-filter__toggle',
              'data-wb-product-datasheet-filter-toggle': ''
            },
            components: [
              {
                tagName: 'span',
                attributes: { 'data-wb-product-datasheet-filter-summary': '' },
                content:
                  'Designation:<span class="wb-product-datasheet-filter__value"> 19-480</span>'
              },
              { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__chevron' } }
            ]
          }
        ]
      }
    ]
  },
  {
    tagName: 'section',
    attributes: { class: 'wb-product-filter__group' },
    components: [
      {
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-filter__control wb-product-datasheet-filter__control--select',
          'data-wb-product-datasheet-filter-control': '',
          'data-wb-product-datasheet-filter-label': 'd',
          'data-spec-filter-control': 'd'
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              type: 'button',
              class: 'wb-product-datasheet-filter__toggle',
              'data-wb-product-datasheet-filter-toggle': ''
            },
            components: [
              {
                tagName: 'span',
                attributes: { 'data-wb-product-datasheet-filter-summary': '' },
                content: 'd'
              },
              { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__chevron' } }
            ]
          }
        ]
      }
    ]
  },
  {
    tagName: 'section',
    attributes: { class: 'wb-product-filter__group' },
    components: [
      {
        tagName: 'div',
        attributes: {
          class:
            'wb-product-datasheet-filter__control wb-product-datasheet-filter__control--range is-open is-active',
          'data-wb-product-datasheet-filter-control': '',
          'data-wb-product-datasheet-filter-label': 'B',
          'data-spec-filter-control': 'b'
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              type: 'button',
              class: 'wb-product-datasheet-filter__toggle',
              'data-wb-product-datasheet-filter-toggle': ''
            },
            components: [
              {
                tagName: 'span',
                attributes: { 'data-wb-product-datasheet-filter-summary': '' },
                content: 'B:<span class="wb-product-datasheet-filter__value"> 19-36</span>'
              },
              { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__chevron' } }
            ]
          },
          {
            tagName: 'div',
            attributes: { class: 'wb-product-datasheet-filter__panel' },
            components: [
              {
                tagName: 'div',
                attributes: { class: 'wb-product-datasheet-filter__range-fields' },
                components: [
                  {
                    tagName: 'label',
                    attributes: { class: 'wb-product-datasheet-filter__range-input' },
                    components: [
                      {
                        tagName: 'input',
                        attributes: {
                          type: 'number',
                          value: '19',
                          'data-spec-filter-code': 'b',
                          'data-spec-filter-bound': 'min'
                        }
                      },
                      { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__unit' }, content: 'mm' }
                    ]
                  },
                  { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__dash' }, content: '-' },
                  {
                    tagName: 'label',
                    attributes: { class: 'wb-product-datasheet-filter__range-input' },
                    components: [
                      {
                        tagName: 'input',
                        attributes: {
                          type: 'number',
                          value: '36',
                          'data-spec-filter-code': 'b',
                          'data-spec-filter-bound': 'max'
                        }
                      },
                      { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__unit' }, content: 'mm' }
                    ]
                  }
                ]
              },
              {
                tagName: 'div',
                attributes: { class: 'wb-product-datasheet-filter__actions' },
                components: [
                  {
                    tagName: 'button',
                    attributes: {
                      type: 'button',
                      class: 'wb-product-datasheet-filter__action',
                      'data-wb-product-datasheet-filter-reset': ''
                    },
                    content: 'Reset'
                  },
                  {
                    tagName: 'button',
                    attributes: {
                      type: 'button',
                      class:
                        'wb-product-datasheet-filter__action wb-product-datasheet-filter__action--primary',
                      'data-wb-product-datasheet-filter-apply': ''
                    },
                    content: 'Apply'
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    tagName: 'section',
    attributes: { class: 'wb-product-filter__group' },
    components: [
      {
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-filter__control wb-product-datasheet-filter__control--select',
          'data-wb-product-datasheet-filter-control': '',
          'data-wb-product-datasheet-filter-label': 'C',
          'data-spec-filter-control': 'c'
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              type: 'button',
              class: 'wb-product-datasheet-filter__toggle',
              'data-wb-product-datasheet-filter-toggle': ''
            },
            components: [
              {
                tagName: 'span',
                attributes: { 'data-wb-product-datasheet-filter-summary': '' },
                content: 'C'
              },
              { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__chevron' } }
            ]
          }
        ]
      }
    ]
  },
  {
    tagName: 'section',
    attributes: { class: 'wb-product-filter__group' },
    components: [
      {
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-filter__control wb-product-datasheet-filter__control--select',
          'data-wb-product-datasheet-filter-control': '',
          'data-wb-product-datasheet-filter-label': 'Crw N',
          'data-spec-filter-control': 'crw'
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              type: 'button',
              class: 'wb-product-datasheet-filter__toggle',
              'data-wb-product-datasheet-filter-toggle': ''
            },
            components: [
              {
                tagName: 'span',
                attributes: { 'data-wb-product-datasheet-filter-summary': '' },
                content: 'Crw N'
              },
              { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__chevron' } }
            ]
          }
        ]
      }
    ]
  },
  {
    tagName: 'section',
    attributes: { class: 'wb-product-filter__group' },
    components: [
      {
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-filter__control wb-product-datasheet-filter__control--select',
          'data-wb-product-datasheet-filter-control': '',
          'data-wb-product-datasheet-filter-label': 'Corw N',
          'data-spec-filter-control': 'corw'
        },
        components: [
          {
            tagName: 'button',
            attributes: {
              type: 'button',
              class: 'wb-product-datasheet-filter__toggle',
              'data-wb-product-datasheet-filter-toggle': ''
            },
            components: [
              {
                tagName: 'span',
                attributes: { 'data-wb-product-datasheet-filter-summary': '' },
                content: 'Corw N'
              },
              { tagName: 'span', attributes: { class: 'wb-product-datasheet-filter__chevron' } }
            ]
          }
        ]
      }
    ]
  }
]

const previewRows = [
  ['LR604-2RSR', '13', '4', '4', '860', '350'],
  ['LR605-2RSR', '16', '5', '5', '1200', '500'],
  ['LR604-2RSR', '13', '4', '4', '860', '350'],
  ['LR605-2RSR', '16', '5', '5', '1200', '500', 'true'],
  ['LR604-2RSR', '13', '4', '4', '860', '350'],
  ['LR605-2RSR', '16', '5', '5', '1200', '500'],
  ['LR604-2RSR', '13', '4', '4', '860', '350'],
  ['LR605-2RSR', '16', '5', '5', '1200', '500']
]

function makeProductDatasheetComponents() {
  return [
    {
      tagName: 'h1',
      attributes: { class: 'wb-product-datasheet-list__title' },
      content: 'Datasheet'
    },
    {
      tagName: 'div',
      attributes: { class: 'wb-product-datasheet-list__filters' },
      components: [
        {
          tagName: 'div',
          attributes: { class: 'wb-product-datasheet-list__filters-head' },
          components: [
            {
              tagName: 'h2',
              attributes: { class: 'wb-product-datasheet-list__filters-title' },
              content: 'Filters'
            },
            {
              tagName: 'button',
              attributes: {
                type: 'button',
                class: 'wb-product-datasheet-list__reset',
                'data-wb-product-datasheet-reset': ''
              },
              content: 'Reset All'
            }
          ]
        },
        {
          tagName: 'div',
          attributes: {
            class: 'wb-product-datasheet-list__filter-grid',
            'data-wb-product-datasheet-filter-groups': ''
          },
          components: previewFilterComponents
        }
      ]
    },
    {
      tagName: 'div',
      attributes: { class: 'wb-product-datasheet-list__summary' },
      components: [
        {
          tagName: 'div',
          components: [
            {
              tagName: 'h2',
              attributes: { class: 'wb-product-datasheet-list__results-title' },
              content: 'Search Results'
            },
            {
              tagName: 'div',
              attributes: { class: 'wb-product-datasheet-list__meta' },
              components: [
                {
                  tagName: 'span',
                  components: [
                    { tagName: 'span', content: 'Total: ' },
                    {
                      tagName: 'span',
                      attributes: { 'data-wb-product-datasheet-total': '' },
                      content: '870'
                    }
                  ]
                },
                { tagName: 'span', content: '|' },
                {
                  tagName: 'span',
                  components: [
                    { tagName: 'span', content: 'Selected: ' },
                    {
                      tagName: 'strong',
                      attributes: { 'data-wb-product-datasheet-selected-count': '' },
                      content: '2'
                    }
                  ]
                }
              ]
            }
          ]
        },
        {
          tagName: 'button',
          attributes: {
            type: 'button',
            class: 'wb-product-datasheet-list__export',
            'data-wb-product-datasheet-export': ''
          },
          content: 'Export (2)'
        }
      ]
    },
    {
      tagName: 'div',
      attributes: { class: 'wb-product-datasheet-list__table-wrap' },
      components: [
        {
          tagName: 'div',
          attributes: {
            class: 'wb-product-datasheet-list__table',
            'data-wb-product-datasheet-table': '',
            style: '--wb-datasheet-field-count: 5;'
          },
          components: [
            {
              tagName: 'div',
              attributes: {
                class: 'wb-product-datasheet-list__header',
                'data-wb-product-datasheet-header': ''
              },
              components: [
                {
                  tagName: 'label',
                  attributes: {
                    class: 'wb-product-datasheet-list__cell wb-product-datasheet-list__checkbox',
                    'data-wb-product-datasheet-header-cell': ''
                  },
                  components: [
                    {
                      tagName: 'input',
                      attributes: {
                        type: 'checkbox',
                        'data-wb-product-datasheet-select-all': ''
                      }
                    }
                  ]
                },
                ...['Designation', 'd', 'B', 'C', 'Crw N', 'Corw N'].map((label) => ({
                  tagName: 'div',
                  attributes: {
                    class: 'wb-product-datasheet-list__cell',
                    'data-wb-product-datasheet-header-cell': '',
                    title: label,
                    'aria-label': label
                  },
                  content: label
                }))
              ]
            },
            {
              tagName: 'div',
              attributes: {
                class: 'wb-product-datasheet-list__body',
                'data-wb-product-datasheet-body': ''
              },
              components: previewRows.map(makePreviewRow)
            }
          ]
        }
      ]
    }
  ]
}

function makePreviewRow(row: string[]) {
  const selected = row[6] === 'true'
  return {
    tagName: 'div',
    attributes: {
      class: `wb-product-datasheet-list__row${selected ? ' is-selected' : ''}`,
      'data-wb-product-datasheet-row': ''
    },
    components: [
      {
        tagName: 'label',
        attributes: {
          class: 'wb-product-datasheet-list__cell wb-product-datasheet-list__checkbox',
          'data-wb-product-datasheet-cell': ''
        },
        components: [
          {
            tagName: 'input',
            attributes: {
              type: 'checkbox',
              ...(selected ? { checked: true } : {}),
              'data-wb-product-datasheet-select-row': ''
            }
          }
        ]
      },
      {
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-list__cell',
          'data-wb-product-datasheet-cell': ''
        },
        components: [
          {
            tagName: 'a',
            attributes: {
              class: 'wb-product-datasheet-list__designation-link',
              href: '#'
            },
            content: row[0]
          }
        ]
      },
      ...row.slice(1, 6).map((value) => ({
        tagName: 'div',
        attributes: {
          class: 'wb-product-datasheet-list__cell',
          'data-wb-product-datasheet-cell': ''
        },
        content: value
      }))
    ]
  }
}

export function registerCmsProductDatasheetList(editor: GrapesEditor): void {
  const domComponents = editor?.DomComponents
  if (!domComponents || domComponents.getType(WB_CMS_PRODUCT_DATASHEET_LIST_TYPE)) return

  domComponents.addType(WB_CMS_PRODUCT_DATASHEET_LIST_TYPE, {
    isComponent: (el: HTMLElement) => {
      if (!el?.getAttribute) return false
      const wbComponent = el.getAttribute('data-wb-component')
      const cmsComponent = el.getAttribute('data-cms-component')
      const listMode = el.getAttribute('data-list-mode') || el.getAttribute('data-wb-list-mode')
      const legacyDatasheet =
        cmsComponent === 'product-list' &&
        (listMode === 'datasheet' || el.hasAttribute('data-wb-product-datasheet'))
      return wbComponent === 'cms-product-datasheet-list' || legacyDatasheet
        ? { type: WB_CMS_PRODUCT_DATASHEET_LIST_TYPE }
        : false
    },

    model: {
      defaults: {
        name: '产品 Datasheet',
        tagName: 'section',
        draggable: '*',
        droppable: false,
        selectable: true,
        editable: false,
        stylable: true,
        styles: PRODUCT_DATASHEET_CSS,
        attributes: {
          'data-wb-component': 'cms-product-datasheet-list',
          'data-cms-component': 'product-list',
          'data-wb-product-datasheet-list': '',
          'data-wb-instance-id': '',
          'data-wb-category-id': '',
          'data-category-id': '',
          'data-sort-field': 'datasheet:first3',
          'data-sort-asc': 'true',
          'data-list-mode': 'datasheet',
          'data-load-all': 'true',
          'data-pagination': 'none',
          'data-page-size': '9999',
          'data-max-pages': '1',
          'data-wb-tenant-id': `${getEffectiveTenantId() || ''}`,
          'data-tenant-id': `${getEffectiveTenantId() || ''}`,
          class: 'wb-product-datasheet-list'
        },
        cmsCategoryId: '',
        traits: [
          {
            type: 'select',
            label: '产品分类',
            name: 'cmsCategoryId',
            changeProp: true,
            options: [{ value: '', label: '当前分类' }]
          }
        ],
        components: makeProductDatasheetComponents(),
        script: makeProductDatasheetScript(),
        'script-export': makeProductDatasheetScript()
      },

      init(this: any) {
        const attrs = this.getAttributes?.() || {}
        this.set(
          {
            script: makeProductDatasheetScript(),
            'script-export': makeProductDatasheetScript()
          },
          { silent: true }
        )
        if (!this.get('cmsCategoryId') && attrs['data-category-id']) {
          this.set('cmsCategoryId', attrs['data-category-id'], { silent: true })
        }
        if (
          attrs['data-wb-component'] !== 'cms-product-datasheet-list' ||
          !this.find?.('[data-wb-product-datasheet-filter-groups]')?.length
        ) {
          this.components(makeProductDatasheetComponents())
        }
        this.on('change:cmsCategoryId', this._syncAttrs)
        this._syncAttrs()
        void initProductCategorySelectTrait(this, {
          allLabel: '当前分类',
          traitName: 'cmsCategoryId'
        })
      },

      _syncAttrs(this: any) {
        const categoryId = String(this.get('cmsCategoryId') || '').trim()
        const tenantId = String(getEffectiveTenantId() || '')
        this.addAttributes({
          'data-cms-component': 'product-list',
          'data-wb-component': 'cms-product-datasheet-list',
          'data-wb-product-datasheet-list': '',
          'data-wb-instance-id': String(this.getId?.() || this.cid || ''),
          'data-wb-category-id': categoryId,
          'data-category-id': categoryId,
          'data-sort-field': 'datasheet:first3',
          'data-sort-asc': 'true',
          'data-list-mode': 'datasheet',
          'data-load-all': 'true',
          'data-pagination': 'none',
          'data-page-size': '9999',
          'data-max-pages': '1',
          'data-wb-tenant-id': tenantId,
          'data-tenant-id': tenantId,
          class: 'wb-product-datasheet-list'
        })
      }
    }
  })
}
